using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class MaintenanceService
{
    private readonly RebracoDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<MaintenanceService> _logger;

    public MaintenanceService(RebracoDbContext db, IEmailService emailService, ILogger<MaintenanceService> logger)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task<MaintenanceRequest?> CreateAsync(CreateMaintenanceDto dto)
    {
        var unit = await _db.Units.FindAsync(dto.UnitId);
        if (unit == null) return null;

        var request = new MaintenanceRequest
        {
            UnitId = dto.UnitId,
            TenantId = dto.TenantId,
            Title = dto.Title,
            Description = dto.Description,
            LocationDetail = dto.LocationDetail,
            PermissionToEnter = dto.PermissionToEnter,
            PreferredAvailability = dto.PreferredAvailability,
            UrgencyNotes = dto.UrgencyNotes,
            Priority = dto.Priority,
            Status = MaintenanceStatus.Open,
            Category = dto.Category,
            ScheduledDate = dto.ScheduledDate,
            EstimatedCost = dto.EstimatedCost,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.MaintenanceRequests.Add(request);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Maintenance #{Id} '{Title}' created for Unit #{UnitId}",
            request.Id, request.Title, request.UnitId);
        return request;
    }

    public async Task<(List<MaintenanceRequest> Items, int Total)> GetAllAsync(MaintenanceFilterDto filter)
    {
        var query = _db.MaintenanceRequests.AsNoTracking()
            .Include(m => m.Unit)
                .ThenInclude(u => u.Property)
            .Include(m => m.Tenant)
            .AsQueryable();

        if (filter.Status.HasValue)
            query = query.Where(m => m.Status == filter.Status.Value);

        if (filter.Priority.HasValue)
            query = query.Where(m => m.Priority == filter.Priority.Value);

        if (filter.Category.HasValue)
            query = query.Where(m => m.Category == filter.Category.Value);

        if (filter.UnitId.HasValue)
            query = query.Where(m => m.UnitId == filter.UnitId.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(m =>
                m.Title.ToLower().Contains(search) ||
                (m.Description != null && m.Description.ToLower().Contains(search)) ||
                m.Unit.UnitNumber.ToLower().Contains(search) ||
                m.Unit.Property.Name.ToLower().Contains(search));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    public async Task<MaintenanceRequest?> GetByIdAsync(int id)
    {
        return await _db.MaintenanceRequests
            .Include(m => m.Unit)
                .ThenInclude(u => u.Property)
            .Include(m => m.Tenant)
            .Include(m => m.Notes.OrderByDescending(n => n.CreatedAt))
                .ThenInclude(n => n.Images.OrderBy(i => i.SortOrder))
            .Include(m => m.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(m => m.Id == id);
    }

    public async Task<MaintenanceRequest?> UpdateAsync(int id, UpdateMaintenanceDto dto)
    {
        var request = await _db.MaintenanceRequests.FindAsync(id);
        if (request == null) return null;

        if (dto.Title != null) request.Title = dto.Title;
        if (dto.Description != null) request.Description = dto.Description;
        if (dto.LocationDetail != null) request.LocationDetail = dto.LocationDetail;
        if (dto.PermissionToEnter.HasValue) request.PermissionToEnter = dto.PermissionToEnter.Value;
        if (dto.PreferredAvailability != null) request.PreferredAvailability = dto.PreferredAvailability;
        if (dto.UrgencyNotes != null) request.UrgencyNotes = dto.UrgencyNotes;
        if (dto.Priority.HasValue) request.Priority = dto.Priority.Value;
        if (dto.Category.HasValue) request.Category = dto.Category.Value;
        if (dto.ScheduledDate.HasValue) request.ScheduledDate = dto.ScheduledDate.Value;
        if (dto.EstimatedCost.HasValue) request.EstimatedCost = dto.EstimatedCost.Value;
        if (dto.ActualCost.HasValue) request.ActualCost = dto.ActualCost.Value;

        request.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Maintenance #{Id} updated", id);
        return request;
    }

    public async Task<MaintenanceRequest?> UpdateStatusAsync(int id, MaintenanceStatus newStatus)
    {
        var request = await _db.MaintenanceRequests.FindAsync(id);
        if (request == null) return null;

        var oldStatus = request.Status.ToString();

        request.Status = newStatus;
        request.UpdatedAt = DateTimeOffset.UtcNow;

        // Auto-set completion date when marking completed
        if (newStatus == MaintenanceStatus.Completed && !request.CompletedDate.HasValue)
            request.CompletedDate = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Maintenance #{Id} status updated to {Status}", id, newStatus);

        // Send status update email to tenant (if one is associated)
        if (request.TenantId.HasValue)
        {
            try
            {
                var tenant = await _db.Tenants.FindAsync(request.TenantId.Value);
                if (tenant != null)
                    await _emailService.SendMaintenanceStatusUpdateAsync(request, tenant, oldStatus, newStatus.ToString());
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Rebraco: Failed to send maintenance status email for Request #{Id}", id);
            }
        }

        return request;
    }

    public async Task<MaintenanceNote?> AddNoteAsync(int requestId, string author, string content)
    {
        var request = await _db.MaintenanceRequests.FindAsync(requestId);
        if (request == null) return null;

        var note = new MaintenanceNote
        {
            MaintenanceRequestId = requestId,
            Author = author,
            Content = content,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.MaintenanceNotes.Add(note);
        request.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return note;
    }

    // ═══════════════════════════════════════════════════════════════════
    // Image CRUD
    // ═══════════════════════════════════════════════════════════════════

    public async Task<MaintenanceImage?> AddRequestImageAsync(int requestId, string url, string? alt)
    {
        var request = await _db.MaintenanceRequests.FindAsync(requestId);
        if (request == null) return null;

        var nextSort = await _db.MaintenanceImages
            .Where(i => i.MaintenanceRequestId == requestId)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync() ?? -1;

        var image = new MaintenanceImage
        {
            MaintenanceRequestId = requestId,
            Url = url,
            Alt = alt,
            SortOrder = nextSort + 1,
        };

        _db.MaintenanceImages.Add(image);
        request.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return image;
    }

    public async Task<string?> DeleteRequestImageAsync(int requestId, int imageId)
    {
        var image = await _db.MaintenanceImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.MaintenanceRequestId == requestId);
        if (image == null) return null;

        var url = image.Url;
        _db.MaintenanceImages.Remove(image);
        await _db.SaveChangesAsync();

        return url;
    }

    public async Task<MaintenanceNoteImage?> AddNoteImageAsync(int noteId, string url, string? alt)
    {
        var note = await _db.MaintenanceNotes.FindAsync(noteId);
        if (note == null) return null;

        var nextSort = await _db.MaintenanceNoteImages
            .Where(i => i.MaintenanceNoteId == noteId)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync() ?? -1;

        var image = new MaintenanceNoteImage
        {
            MaintenanceNoteId = noteId,
            Url = url,
            Alt = alt,
            SortOrder = nextSort + 1,
        };

        _db.MaintenanceNoteImages.Add(image);
        await _db.SaveChangesAsync();

        return image;
    }

    public async Task<string?> DeleteNoteImageAsync(int noteId, int imageId)
    {
        var image = await _db.MaintenanceNoteImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.MaintenanceNoteId == noteId);
        if (image == null) return null;

        var url = image.Url;
        _db.MaintenanceNoteImages.Remove(image);
        await _db.SaveChangesAsync();

        return url;
    }
}

// --- DTOs ---

public record CreateMaintenanceDto
{
    public int UnitId { get; init; }
    public int? TenantId { get; init; }
    public required string Title { get; init; }
    public string? Description { get; init; }
    public string? LocationDetail { get; init; }
    public bool PermissionToEnter { get; init; }
    public string? PreferredAvailability { get; init; }
    public string? UrgencyNotes { get; init; }
    public MaintenancePriority Priority { get; init; } = MaintenancePriority.Medium;
    public MaintenanceCategory Category { get; init; } = MaintenanceCategory.Other;
    public DateTime? ScheduledDate { get; init; }
    public decimal? EstimatedCost { get; init; }
}

public record UpdateMaintenanceDto
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? LocationDetail { get; init; }
    public bool? PermissionToEnter { get; init; }
    public string? PreferredAvailability { get; init; }
    public string? UrgencyNotes { get; init; }
    public MaintenancePriority? Priority { get; init; }
    public MaintenanceCategory? Category { get; init; }
    public DateTime? ScheduledDate { get; init; }
    public decimal? EstimatedCost { get; init; }
    public decimal? ActualCost { get; init; }
}

public record MaintenanceFilterDto
{
    public MaintenanceStatus? Status { get; init; }
    public MaintenancePriority? Priority { get; init; }
    public MaintenanceCategory? Category { get; init; }
    public int? UnitId { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}
