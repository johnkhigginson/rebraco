using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class TenantService
{
    private readonly RebracoDbContext _db;
    private readonly ILogger<TenantService> _logger;

    public TenantService(RebracoDbContext db, ILogger<TenantService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<(Tenant? Tenant, string? Error)> CreateAsync(CreateTenantDto dto)
    {
        // Pre-check for duplicate email (unique index exists but gives a raw DB error)
        var emailTaken = await _db.Tenants.AnyAsync(t => t.Email == dto.Email);
        if (emailTaken)
            return (null, "A tenant with this email already exists.");

        var tenant = new Tenant
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            EmergencyContactName = dto.EmergencyContactName,
            EmergencyContactPhone = dto.EmergencyContactPhone,
            MoveInDate = dto.MoveInDate,
            Status = dto.Status ?? TenantStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Tenant #{Id} '{First} {Last}' created",
            tenant.Id, tenant.FirstName, tenant.LastName);
        return (tenant, null);
    }

    public async Task<(List<Tenant> Items, int Total)> GetAllAsync(TenantFilterDto filter)
    {
        var query = _db.Tenants.AsNoTracking().AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(t =>
                t.FirstName.ToLower().Contains(search) ||
                t.LastName.ToLower().Contains(search) ||
                t.Email.ToLower().Contains(search));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(t => t.LastName)
            .ThenBy(t => t.FirstName)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Tenant?> GetByIdAsync(int id)
    {
        return await _db.Tenants
            .Include(t => t.Leases.OrderByDescending(l => l.StartDate))
                .ThenInclude(l => l.Unit)
                    .ThenInclude(u => u.Property)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<Tenant?> UpdateAsync(int id, UpdateTenantDto dto)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant == null) return null;

        if (dto.FirstName != null) tenant.FirstName = dto.FirstName;
        if (dto.LastName != null) tenant.LastName = dto.LastName;
        if (dto.Email != null) tenant.Email = dto.Email;
        if (dto.Phone != null) tenant.Phone = dto.Phone;
        if (dto.EmergencyContactName != null) tenant.EmergencyContactName = dto.EmergencyContactName;
        if (dto.EmergencyContactPhone != null) tenant.EmergencyContactPhone = dto.EmergencyContactPhone;
        if (dto.MoveInDate.HasValue) tenant.MoveInDate = dto.MoveInDate.Value;
        if (dto.Status.HasValue) tenant.Status = dto.Status.Value;

        tenant.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Tenant #{Id} updated", id);
        return tenant;
    }

    public async Task<Tenant?> UpdateStatusAsync(int id, TenantStatus status)
    {
        var tenant = await _db.Tenants.FindAsync(id);
        if (tenant == null) return null;

        tenant.Status = status;
        tenant.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Tenant #{Id} status updated to {Status}", id, status);
        return tenant;
    }
}

// --- DTOs ---

public record CreateTenantDto
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Email { get; init; }
    public string? Phone { get; init; }
    public string? EmergencyContactName { get; init; }
    public string? EmergencyContactPhone { get; init; }
    public DateTime? MoveInDate { get; init; }
    public TenantStatus? Status { get; init; }
}

public record UpdateTenantDto
{
    public string? FirstName { get; init; }
    public string? LastName { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? EmergencyContactName { get; init; }
    public string? EmergencyContactPhone { get; init; }
    public DateTime? MoveInDate { get; init; }
    public TenantStatus? Status { get; init; }
}

public record TenantFilterDto
{
    public TenantStatus? Status { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}
