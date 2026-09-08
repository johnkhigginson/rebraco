using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Services;

public class InquiryService
{
    private readonly RebracoDbContext _db;
    private readonly IEmailService _email;
    private readonly TenantService _tenants;
    private readonly LeaseService _leases;
    private readonly IMemberService _memberService;
    private readonly IMemberManager _memberManager;
    private readonly ILogger<InquiryService> _logger;

    public InquiryService(
        RebracoDbContext db,
        IEmailService email,
        TenantService tenants,
        LeaseService leases,
        IMemberService memberService,
        IMemberManager memberManager,
        ILogger<InquiryService> logger)
    {
        _db = db;
        _email = email;
        _tenants = tenants;
        _leases = leases;
        _memberService = memberService;
        _memberManager = memberManager;
        _logger = logger;
    }

    public async Task<Inquiry> SubmitAsync(SubmitInquiryDto dto)
    {
        var inquiry = new Inquiry
        {
            PropertyId = dto.PropertyId,
            PropertyName = dto.PropertyName,
            UnitId = dto.UnitId,
            UnitName = dto.UnitName,
            EfPropertyId = dto.EfPropertyId,
            EfUnitId = dto.EfUnitId,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PreferredMoveInDate = dto.PreferredMoveInDate,
            PreferredLeaseTerm = dto.PreferredLeaseTerm,
            Message = dto.Message,
            Source = "website",
            Status = InquiryStatus.New,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.Inquiries.Add(inquiry);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Inquiry #{Id} created for {Property}",
            inquiry.Id, inquiry.PropertyName ?? "unknown");

        // Fire-and-forget email notification (don't block the response)
        _ = Task.Run(async () =>
        {
            try { await _email.SendInquiryNotificationAsync(inquiry); }
            catch (Exception ex) { _logger.LogError(ex, "Failed to send inquiry notification email"); }
        });

        return inquiry;
    }

    public async Task<(List<Inquiry> Items, int Total)> GetAllAsync(InquiryFilterDto filter)
    {
        var query = _db.Inquiries.AsNoTracking().AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(i => i.Status == filter.Status.Value);

        if (!string.IsNullOrWhiteSpace(filter.PropertyId))
            query = query.Where(i => i.PropertyId == filter.PropertyId);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(i =>
                i.FullName.ToLower().Contains(search) ||
                i.Email.ToLower().Contains(search) ||
                (i.PropertyName != null && i.PropertyName.ToLower().Contains(search)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Inquiry?> GetByIdAsync(int id)
    {
        return await _db.Inquiries
            .Include(i => i.Notes.OrderByDescending(n => n.CreatedAt))
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Inquiry?> UpdateStatusAsync(int id, InquiryStatus status)
    {
        var inquiry = await _db.Inquiries.FindAsync(id);
        if (inquiry == null) return null;

        inquiry.Status = status;
        inquiry.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Inquiry #{Id} status updated to {Status}", id, status);
        return inquiry;
    }

    public async Task<InquiryNote?> AddNoteAsync(int inquiryId, string author, string content)
    {
        var inquiry = await _db.Inquiries.FindAsync(inquiryId);
        if (inquiry == null) return null;

        var note = new InquiryNote
        {
            InquiryId = inquiryId,
            Author = author,
            Content = content,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.InquiryNotes.Add(note);
        inquiry.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return note;
    }

    public async Task<(Tenant? Tenant, Lease? Lease, string? Error)> ConvertToTenantAsync(
        int inquiryId, ConvertInquiryDto dto)
    {
        var inquiry = await _db.Inquiries.FindAsync(inquiryId);
        if (inquiry == null)
            return (null, null, "Inquiry not found.");

        if (inquiry.Status == InquiryStatus.Closed)
            return (null, null, "Inquiry is already closed.");

        // 1. Create tenant
        var (tenant, tenantError) = await _tenants.CreateAsync(new CreateTenantDto
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            MoveInDate = dto.MoveInDate,
        });

        if (tenant == null)
            return (null, null, tenantError ?? "Failed to create tenant.");

        // 2. Create lease
        var (lease, leaseError) = await _leases.CreateAsync(new CreateLeaseDto
        {
            UnitId = dto.UnitId,
            TenantId = tenant.Id,
            BedDesignation = dto.BedDesignation,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MonthlyRent = dto.MonthlyRent,
            SecurityDeposit = dto.SecurityDeposit,
            Status = LeaseStatus.Active,
            LeaseType = Enum.TryParse<LeaseType>(dto.LeaseType, true, out var lt) ? lt : LeaseType.Fixed,
        });

        if (lease == null)
        {
            // Rollback tenant on lease failure
            _db.Tenants.Remove(tenant);
            await _db.SaveChangesAsync();
            return (null, null, leaseError ?? "Failed to create lease.");
        }

        // 3. Create Umbraco member for tenant portal access
        var memberKey = await CreateTenantMemberAsync(tenant);
        if (memberKey.HasValue)
        {
            tenant.MemberKey = memberKey.Value;
        }

        // 4. Close inquiry and add audit note
        inquiry.Status = InquiryStatus.Closed;
        inquiry.UpdatedAt = DateTimeOffset.UtcNow;

        _db.InquiryNotes.Add(new InquiryNote
        {
            InquiryId = inquiryId,
            Author = "System",
            Content = $"Converted to tenant #{tenant.Id} with lease #{lease.Id}" +
                      (memberKey.HasValue ? " (portal account created)" : ""),
            CreatedAt = DateTimeOffset.UtcNow,
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Rebraco: Inquiry #{InquiryId} converted → Tenant #{TenantId}, Lease #{LeaseId}",
            inquiryId, tenant.Id, lease.Id);

        return (tenant, lease, null);
    }
    /// <summary>
    /// Creates an Umbraco member account for the tenant so they can log into the tenant portal.
    /// Returns the member's Key (Guid) or null if creation fails.
    /// </summary>
    private async Task<Guid?> CreateTenantMemberAsync(Tenant tenant)
    {
        try
        {
            // Check if a member with this email already exists
            var existing = _memberService.GetByEmail(tenant.Email);
            if (existing != null)
            {
                _logger.LogInformation("Rebraco: Member already exists for {Email}, linking to tenant #{Id}",
                    tenant.Email, tenant.Id);

                // Ensure they're in the Tenant group
                var existingRoles = _memberService.GetAllRoles(existing.Id);
                if (!existingRoles.Contains("Tenant"))
                    _memberService.AssignRole(existing.Id, "Tenant");

                return existing.Key;
            }

            // Generate a random password
            var password = GenerateRandomPassword(16);

            // Create member via IMemberService (the content/property API)
            var member = _memberService.CreateMemberWithIdentity(
                tenant.Email,               // username
                tenant.Email,               // email
                $"{tenant.FirstName} {tenant.LastName}", // display name
                "tenant"                     // member type alias
            );

            // Set profile properties
            member.SetValue("phone", tenant.Phone ?? "");
            member.SetValue("emergencyContactName", tenant.EmergencyContactName ?? "");
            member.SetValue("emergencyContactPhone", tenant.EmergencyContactPhone ?? "");
            _memberService.Save(member);

            // Set password via Identity
            var identityMember = await _memberManager.FindByEmailAsync(tenant.Email);
            if (identityMember != null)
            {
                var token = await _memberManager.GeneratePasswordResetTokenAsync(identityMember);
                await _memberManager.ResetPasswordAsync(identityMember, token, password);

                // Assign to Tenant group via content API
                _memberService.AssignRole(member.Id, "Tenant");
            }

            var memberKey = member.Key;
            _logger.LogInformation("Rebraco: Created tenant portal member for {Email} (Key: {Key})",
                tenant.Email, memberKey);

            // Send welcome email with credentials
            _ = Task.Run(async () =>
            {
                try
                {
                    await _email.SendTenantWelcomeAsync(tenant, password);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send tenant welcome email to {Email}", tenant.Email);
                }
            });

            return memberKey;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create tenant member for {Email}", tenant.Email);
            return null; // Non-fatal — tenant is still created, just without portal access
        }
    }

    private static string GenerateRandomPassword(int length)
    {
        const string chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var result = new char[length];
        for (int i = 0; i < length; i++)
            result[i] = chars[bytes[i] % chars.Length];
        return new string(result);
    }
}

// --- DTOs ---

public record SubmitInquiryDto
{
    public string? PropertyId { get; init; }
    public string? PropertyName { get; init; }
    public string? UnitId { get; init; }
    public string? UnitName { get; init; }
    public int? EfPropertyId { get; init; }
    public int? EfUnitId { get; init; }
    public required string FullName { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public DateTime? PreferredMoveInDate { get; init; }
    public string? PreferredLeaseTerm { get; init; }
    public string? Message { get; init; }
}

public record InquiryFilterDto
{
    public InquiryStatus? Status { get; init; }
    public string? PropertyId { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}

public record ConvertInquiryDto
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public DateTime? MoveInDate { get; init; }
    public int UnitId { get; init; }
    public DateTime StartDate { get; init; }
    public DateTime EndDate { get; init; }
    public decimal MonthlyRent { get; init; }
    public decimal? SecurityDeposit { get; init; }
    public string? BedDesignation { get; init; }
    public string LeaseType { get; init; } = "Fixed";
}
