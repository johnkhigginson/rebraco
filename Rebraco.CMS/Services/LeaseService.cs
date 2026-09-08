using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class LeaseService
{
    private readonly RebracoDbContext _db;
    private readonly ILogger<LeaseService> _logger;

    public LeaseService(RebracoDbContext db, ILogger<LeaseService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<(Lease? Lease, string? Error)> CreateAsync(CreateLeaseDto dto)
    {
        // Validate unit exists and check capacity
        var unit = await _db.Units.FindAsync(dto.UnitId);
        if (unit == null)
            return (null, "Unit not found.");

        // Validate tenant exists
        var tenant = await _db.Tenants.FindAsync(dto.TenantId);
        if (tenant == null)
            return (null, "Tenant not found.");

        // If creating as Active, check capacity
        if (dto.Status == LeaseStatus.Active)
        {
            var activeCount = await _db.Leases
                .CountAsync(l => l.UnitId == dto.UnitId && l.Status == LeaseStatus.Active);
            if (activeCount >= unit.Capacity)
                return (null, $"Unit is at capacity ({unit.Capacity} active leases).");
        }

        var lease = new Lease
        {
            UnitId = dto.UnitId,
            TenantId = dto.TenantId,
            BedDesignation = dto.BedDesignation,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MonthlyRent = dto.MonthlyRent,
            SecurityDeposit = dto.SecurityDeposit,
            Status = dto.Status,
            LeaseType = dto.LeaseType,
            AutoInvoice = dto.AutoInvoice,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        if (dto.AutoInvoice)
            lease.NextInvoiceDate = CalculateNextInvoiceDate(dto.StartDate);

        _db.Leases.Add(lease);

        // Side-effect: set unit to Occupied when an active lease is added
        if (dto.Status == LeaseStatus.Active && unit.Status == UnitStatus.Available)
        {
            unit.Status = UnitStatus.Occupied;
            unit.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Lease #{Id} created — Unit #{UnitId}, Tenant #{TenantId}",
            lease.Id, lease.UnitId, lease.TenantId);
        return (lease, null);
    }

    public async Task<(List<Lease> Items, int Total)> GetAllAsync(LeaseFilterDto filter)
    {
        var query = _db.Leases.AsNoTracking()
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .Include(l => l.Tenant)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(l => l.Status == filter.Status.Value);

        if (filter.UnitId.HasValue)
            query = query.Where(l => l.UnitId == filter.UnitId.Value);

        if (filter.TenantId.HasValue)
            query = query.Where(l => l.TenantId == filter.TenantId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(l =>
                l.Tenant.FirstName.ToLower().Contains(search) ||
                l.Tenant.LastName.ToLower().Contains(search) ||
                l.Unit.UnitNumber.ToLower().Contains(search) ||
                l.Unit.Property.Name.ToLower().Contains(search));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.StartDate)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Lease?> GetByIdAsync(int id)
    {
        return await _db.Leases
            .Include(l => l.Unit)
                .ThenInclude(u => u.Property)
            .Include(l => l.Tenant)
            .FirstOrDefaultAsync(l => l.Id == id);
    }

    public async Task<Lease?> UpdateAsync(int id, UpdateLeaseDto dto)
    {
        var lease = await _db.Leases.FindAsync(id);
        if (lease == null) return null;

        if (dto.BedDesignation != null) lease.BedDesignation = dto.BedDesignation;
        if (dto.StartDate.HasValue) lease.StartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue) lease.EndDate = dto.EndDate.Value;
        if (dto.MonthlyRent.HasValue) lease.MonthlyRent = dto.MonthlyRent.Value;
        if (dto.SecurityDeposit.HasValue) lease.SecurityDeposit = dto.SecurityDeposit.Value;
        if (dto.LeaseType.HasValue) lease.LeaseType = dto.LeaseType.Value;

        if (dto.AutoInvoice.HasValue)
        {
            lease.AutoInvoice = dto.AutoInvoice.Value;
            if (dto.AutoInvoice.Value && lease.NextInvoiceDate == null)
                lease.NextInvoiceDate = CalculateNextInvoiceDate(lease.StartDate);
            else if (!dto.AutoInvoice.Value)
                lease.NextInvoiceDate = null;
        }

        lease.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Lease #{Id} updated", id);
        return lease;
    }

    public async Task<(Lease? Lease, string? Error)> UpdateStatusAsync(int id, LeaseStatus newStatus)
    {
        var lease = await _db.Leases
            .Include(l => l.Unit)
            .FirstOrDefaultAsync(l => l.Id == id);
        if (lease == null) return (null, "Lease not found.");

        var oldStatus = lease.Status;

        // If activating, check capacity
        if (newStatus == LeaseStatus.Active && oldStatus != LeaseStatus.Active)
        {
            var activeCount = await _db.Leases
                .CountAsync(l => l.UnitId == lease.UnitId && l.Status == LeaseStatus.Active);
            if (activeCount >= lease.Unit.Capacity)
                return (null, $"Unit is at capacity ({lease.Unit.Capacity} active leases).");
        }

        lease.Status = newStatus;
        lease.UpdatedAt = DateTimeOffset.UtcNow;

        // Side-effects on unit status
        if (newStatus == LeaseStatus.Active && lease.Unit.Status == UnitStatus.Available)
        {
            lease.Unit.Status = UnitStatus.Occupied;
            lease.Unit.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else if (oldStatus == LeaseStatus.Active &&
                 (newStatus == LeaseStatus.Expired || newStatus == LeaseStatus.Terminated))
        {
            // Check if any other active leases remain on this unit
            var remainingActive = await _db.Leases
                .CountAsync(l => l.UnitId == lease.UnitId && l.Status == LeaseStatus.Active && l.Id != id);
            if (remainingActive == 0)
            {
                lease.Unit.Status = UnitStatus.Available;
                lease.Unit.UpdatedAt = DateTimeOffset.UtcNow;
            }
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Lease #{Id} status updated from {Old} to {New}", id, oldStatus, newStatus);
        return (lease, null);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    /// <summary>
    /// Calculates the next invoice date based on the lease start day.
    /// Returns the next occurrence of that day-of-month that is in the future.
    /// </summary>
    internal static DateOnly CalculateNextInvoiceDate(DateTime leaseStartDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var day = Math.Min(leaseStartDate.Day, DateTime.DaysInMonth(today.Year, today.Month));
        var candidate = new DateOnly(today.Year, today.Month, day);
        return candidate <= today
            ? AdvanceOneMonth(candidate, leaseStartDate.Day)
            : candidate;
    }

    /// <summary>
    /// Advances a date by one month, clamping the day for short months
    /// (e.g. Jan 31 → Feb 28, then back to Mar 31).
    /// </summary>
    internal static DateOnly AdvanceOneMonth(DateOnly current, int preferredDay)
    {
        var next = current.AddMonths(1);
        var day = Math.Min(preferredDay, DateTime.DaysInMonth(next.Year, next.Month));
        return new DateOnly(next.Year, next.Month, day);
    }
}

// --- DTOs ---

public record CreateLeaseDto
{
    public int UnitId { get; init; }
    public int TenantId { get; init; }
    public string? BedDesignation { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public decimal MonthlyRent { get; init; }
    public decimal? SecurityDeposit { get; init; }
    public LeaseStatus Status { get; init; } = LeaseStatus.Pending;
    public LeaseType LeaseType { get; init; } = LeaseType.Fixed;
    public bool AutoInvoice { get; init; }
}

public record UpdateLeaseDto
{
    public string? BedDesignation { get; init; }
    public DateTime? StartDate { get; init; }
    public DateTime? EndDate { get; init; }
    public decimal? MonthlyRent { get; init; }
    public decimal? SecurityDeposit { get; init; }
    public LeaseType? LeaseType { get; init; }
    public bool? AutoInvoice { get; init; }
}

public record LeaseFilterDto
{
    public LeaseStatus? Status { get; init; }
    public int? UnitId { get; init; }
    public int? TenantId { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}
