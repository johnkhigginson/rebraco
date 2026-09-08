using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class LeaseRenewalService
{
    private readonly RebracoDbContext _db;
    private readonly LeaseService _leaseService;
    private readonly RenewalSettingsService _settings;
    private readonly IEmailService _email;
    private readonly ILogger<LeaseRenewalService> _logger;

    public LeaseRenewalService(
        RebracoDbContext db,
        LeaseService leaseService,
        RenewalSettingsService settings,
        IEmailService email,
        ILogger<LeaseRenewalService> logger)
    {
        _db = db;
        _leaseService = leaseService;
        _settings = settings;
        _email = email;
        _logger = logger;
    }

    /// <summary>Create a renewal offer for an active lease.</summary>
    public async Task<(LeaseRenewal? Renewal, string? Error)> CreateOfferAsync(
        int leaseId, CreateRenewalOfferDto dto)
    {
        var lease = await _db.Leases
            .Include(l => l.Tenant)
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .FirstOrDefaultAsync(l => l.Id == leaseId);

        if (lease == null)
            return (null, "Lease not found.");

        if (lease.Status != LeaseStatus.Active)
            return (null, "Only active leases can receive renewal offers.");

        if (dto.ProposedEndDate <= dto.ProposedStartDate)
            return (null, "Proposed end date must be after start date.");

        // Check for an existing pending offer
        var hasPending = await _db.LeaseRenewals.AnyAsync(r =>
            r.OriginalLeaseId == leaseId &&
            (r.Status == RenewalStatus.Offered || r.Status == RenewalStatus.TenantAccepted));

        if (hasPending)
            return (null, "This lease already has a pending renewal offer.");

        var renewal = new LeaseRenewal
        {
            OriginalLeaseId = leaseId,
            ProposedStartDate = dto.ProposedStartDate,
            ProposedEndDate = dto.ProposedEndDate,
            ProposedMonthlyRent = dto.ProposedMonthlyRent,
            ProposedLeaseType = dto.ProposedLeaseType,
            ManagerNotes = dto.ManagerNotes,
            Status = RenewalStatus.Offered,
            OfferedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.LeaseRenewals.Add(renewal);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Renewal #{RenewalId} offered for Lease #{LeaseId} — ${Rent}/mo, {Start} to {End}",
            renewal.Id, leaseId, dto.ProposedMonthlyRent, dto.ProposedStartDate, dto.ProposedEndDate);

        try
        {
            // Reload navigation for email
            renewal.OriginalLease = lease;
            await _email.SendRenewalOfferAsync(renewal, lease.Tenant);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rebraco: Failed to send renewal offer email for Renewal #{Id}", renewal.Id);
        }

        return (renewal, null);
    }

    /// <summary>Get a renewal by ID with all related data.</summary>
    public async Task<LeaseRenewal?> GetByIdAsync(int id)
    {
        return await _db.LeaseRenewals
            .AsNoTracking()
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Tenant)
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Unit)
                    .ThenInclude(u => u.Property)
            .Include(r => r.NewLease)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    /// <summary>List all renewals for a specific lease.</summary>
    public async Task<List<LeaseRenewal>> GetByLeaseIdAsync(int leaseId)
    {
        return await _db.LeaseRenewals
            .AsNoTracking()
            .Include(r => r.NewLease)
            .Where(r => r.OriginalLeaseId == leaseId)
            .OrderByDescending(r => r.OfferedAt)
            .ToListAsync();
    }

    /// <summary>List all renewals with optional filters.</summary>
    public async Task<(List<LeaseRenewal> Items, int Total)> GetAllAsync(RenewalFilterDto filter)
    {
        var query = _db.LeaseRenewals.AsNoTracking()
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Tenant)
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Unit)
                    .ThenInclude(u => u.Property)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(r => r.Status == filter.Status.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLower();
            query = query.Where(r =>
                r.OriginalLease.Tenant.FirstName.ToLower().Contains(term) ||
                r.OriginalLease.Tenant.LastName.ToLower().Contains(term) ||
                r.OriginalLease.Unit.UnitNumber.ToLower().Contains(term) ||
                r.OriginalLease.Unit.Property.Name.ToLower().Contains(term));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.OfferedAt)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    /// <summary>Tenant accepts or declines a renewal offer.</summary>
    public async Task<(LeaseRenewal? Renewal, string? Error)> TenantRespondAsync(
        int renewalId, int tenantId, bool accepted, string? tenantNotes)
    {
        var renewal = await _db.LeaseRenewals
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Tenant)
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Unit)
                    .ThenInclude(u => u.Property)
            .FirstOrDefaultAsync(r => r.Id == renewalId);

        if (renewal == null)
            return (null, "Renewal offer not found.");

        if (renewal.OriginalLease.TenantId != tenantId)
            return (null, "You do not have access to this renewal offer.");

        if (renewal.Status != RenewalStatus.Offered)
            return (null, "This renewal offer is no longer available for response.");

        renewal.Status = accepted ? RenewalStatus.TenantAccepted : RenewalStatus.TenantDeclined;
        renewal.TenantNotes = tenantNotes;
        renewal.TenantRespondedAt = DateTimeOffset.UtcNow;
        renewal.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Renewal #{RenewalId} {Response} by Tenant #{TenantId}",
            renewalId, accepted ? "accepted" : "declined", tenantId);

        try
        {
            await _email.SendRenewalResponseAsync(renewal, accepted);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rebraco: Failed to send renewal response email for Renewal #{Id}", renewalId);
        }

        return (renewal, null);
    }

    /// <summary>Manager confirms an accepted renewal — creates the new lease.</summary>
    public async Task<(LeaseRenewal? Renewal, string? Error)> ConfirmAsync(int renewalId)
    {
        var renewal = await _db.LeaseRenewals
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Tenant)
            .Include(r => r.OriginalLease)
                .ThenInclude(l => l.Unit)
                    .ThenInclude(u => u.Property)
            .FirstOrDefaultAsync(r => r.Id == renewalId);

        if (renewal == null)
            return (null, "Renewal offer not found.");

        if (renewal.Status != RenewalStatus.TenantAccepted)
            return (null, "Only tenant-accepted renewals can be confirmed.");

        // Create the new lease via LeaseService
        var original = renewal.OriginalLease;
        var newLeaseStatus = renewal.ProposedStartDate <= DateTime.UtcNow
            ? LeaseStatus.Active
            : LeaseStatus.Pending;

        var (newLease, leaseError) = await _leaseService.CreateAsync(new CreateLeaseDto
        {
            UnitId = original.UnitId,
            TenantId = original.TenantId,
            BedDesignation = original.BedDesignation,
            StartDate = renewal.ProposedStartDate,
            EndDate = renewal.ProposedEndDate,
            MonthlyRent = renewal.ProposedMonthlyRent,
            SecurityDeposit = null,
            Status = newLeaseStatus,
            LeaseType = renewal.ProposedLeaseType,
            AutoInvoice = original.AutoInvoice,
        });

        if (newLease == null)
            return (null, $"Failed to create new lease: {leaseError}");

        renewal.NewLeaseId = newLease.Id;
        renewal.Status = RenewalStatus.Confirmed;
        renewal.ConfirmedAt = DateTimeOffset.UtcNow;
        renewal.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Renewal #{RenewalId} confirmed — new Lease #{NewLeaseId} created",
            renewalId, newLease.Id);

        try
        {
            await _email.SendRenewalConfirmedAsync(renewal, original.Tenant);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Rebraco: Failed to send renewal confirmed email for Renewal #{Id}", renewalId);
        }

        return (renewal, null);
    }

    /// <summary>Manager cancels a renewal offer (only if not yet confirmed).</summary>
    public async Task<(LeaseRenewal? Renewal, string? Error)> CancelAsync(int renewalId)
    {
        var renewal = await _db.LeaseRenewals.FindAsync(renewalId);
        if (renewal == null)
            return (null, "Renewal offer not found.");

        if (renewal.Status != RenewalStatus.Offered && renewal.Status != RenewalStatus.TenantAccepted)
            return (null, "Only pending renewal offers can be cancelled.");

        renewal.Status = RenewalStatus.Cancelled;
        renewal.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Renewal #{RenewalId} cancelled", renewalId);

        return (renewal, null);
    }

    /// <summary>Get active leases expiring within the configured auto-detect window that have no pending renewal.</summary>
    public async Task<List<Lease>> GetExpiringLeasesAsync()
    {
        var settings = await _settings.GetSettingsAsync();
        var today = DateTime.UtcNow.Date;
        var cutoff = today.AddDays(settings.AutoDetectDays);

        return await _db.Leases
            .AsNoTracking()
            .Include(l => l.Tenant)
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .Where(l => l.Status == LeaseStatus.Active
                        && l.EndDate > today
                        && l.EndDate <= cutoff
                        && !_db.LeaseRenewals.Any(r =>
                            r.OriginalLeaseId == l.Id &&
                            (r.Status == RenewalStatus.Offered || r.Status == RenewalStatus.TenantAccepted)))
            .OrderBy(l => l.EndDate)
            .ToListAsync();
    }

    /// <summary>Expire stale renewal offers that have passed the configured expiry window.</summary>
    public async Task<int> ExpireStaleOffersAsync()
    {
        var settings = await _settings.GetSettingsAsync();
        var cutoff = DateTimeOffset.UtcNow.AddDays(-settings.OfferExpiryDays);

        var stale = await _db.LeaseRenewals
            .Where(r => r.Status == RenewalStatus.Offered && r.OfferedAt < cutoff)
            .ToListAsync();

        if (stale.Count == 0) return 0;

        foreach (var r in stale)
        {
            r.Status = RenewalStatus.Expired;
            r.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Expired {Count} stale renewal offers", stale.Count);

        return stale.Count;
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────

public record CreateRenewalOfferDto
{
    public DateTime ProposedStartDate { get; init; }
    public DateTime ProposedEndDate { get; init; }
    public decimal ProposedMonthlyRent { get; init; }
    public LeaseType ProposedLeaseType { get; init; } = LeaseType.Fixed;
    public string? ManagerNotes { get; init; }
}

public record RenewalFilterDto
{
    public RenewalStatus? Status { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}
