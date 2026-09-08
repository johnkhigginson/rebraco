using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

/// <summary>
/// Core tour scheduling business logic: availability windows, slot calculation,
/// booking, and lifecycle management.
/// </summary>
public class TourService
{
    private readonly RebracoDbContext _db;
    private readonly TourSettingsService _settings;
    private readonly IEmailService _email;
    private readonly ILogger<TourService> _logger;

    public TourService(
        RebracoDbContext db,
        TourSettingsService settings,
        IEmailService email,
        ILogger<TourService> logger)
    {
        _db = db;
        _settings = settings;
        _email = email;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════════════
    // Availability Windows
    // ════════════════════════════════════════════════════════════════════

    public async Task<TourAvailability> CreateAvailabilityAsync(int propertyId, CreateAvailabilityDto dto)
    {
        var property = await _db.Properties.FindAsync(propertyId)
            ?? throw new InvalidOperationException("Property not found.");

        var availability = new TourAvailability
        {
            PropertyId = propertyId,
            DayOfWeek = dto.DayOfWeek,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            SlotDurationMinutes = dto.SlotDurationMinutes ?? 30,
            MaxToursPerSlot = dto.MaxToursPerSlot ?? 1,
            IsActive = dto.IsActive ?? true,
        };

        _db.TourAvailabilities.Add(availability);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Created tour availability {Id} for property {PropertyId} ({Day} {Start}-{End})",
            availability.Id, propertyId, availability.DayOfWeek, availability.StartTime, availability.EndTime);

        return availability;
    }

    public async Task<List<TourAvailability>> GetAvailabilityByPropertyAsync(int propertyId)
    {
        return await _db.TourAvailabilities
            .AsNoTracking()
            .Where(a => a.PropertyId == propertyId)
            .OrderBy(a => a.DayOfWeek)
            .ThenBy(a => a.StartTime)
            .ToListAsync();
    }

    public async Task<TourAvailability> UpdateAvailabilityAsync(int id, UpdateAvailabilityDto dto)
    {
        var availability = await _db.TourAvailabilities.FindAsync(id)
            ?? throw new InvalidOperationException("Availability window not found.");

        if (dto.DayOfWeek.HasValue) availability.DayOfWeek = dto.DayOfWeek.Value;
        if (dto.StartTime.HasValue) availability.StartTime = dto.StartTime.Value;
        if (dto.EndTime.HasValue) availability.EndTime = dto.EndTime.Value;
        if (dto.SlotDurationMinutes.HasValue) availability.SlotDurationMinutes = dto.SlotDurationMinutes.Value;
        if (dto.MaxToursPerSlot.HasValue) availability.MaxToursPerSlot = dto.MaxToursPerSlot.Value;
        if (dto.IsActive.HasValue) availability.IsActive = dto.IsActive.Value;
        availability.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();
        return availability;
    }

    public async Task DeleteAvailabilityAsync(int id)
    {
        var availability = await _db.TourAvailabilities.FindAsync(id)
            ?? throw new InvalidOperationException("Availability window not found.");

        _db.TourAvailabilities.Remove(availability);
        await _db.SaveChangesAsync();
    }

    // ════════════════════════════════════════════════════════════════════
    // Slot Calculation
    // ════════════════════════════════════════════════════════════════════

    /// <summary>
    /// Returns available time slots for a property on a specific date.
    /// Generates slots from availability windows, subtracts already-booked tours.
    /// </summary>
    public async Task<List<TourSlotDto>> GetAvailableSlotsAsync(int propertyId, DateTime date)
    {
        var dayOfWeek = date.DayOfWeek;

        // Get active availability windows for this day
        var windows = await _db.TourAvailabilities
            .AsNoTracking()
            .Where(a => a.PropertyId == propertyId && a.DayOfWeek == dayOfWeek && a.IsActive)
            .ToListAsync();

        if (windows.Count == 0) return [];

        // Get existing booked tours for this date (Requested or Confirmed)
        var existingTours = await _db.Tours
            .AsNoTracking()
            .Where(t => t.PropertyId == propertyId
                && t.ScheduledDate == date
                && (t.Status == TourStatus.Requested || t.Status == TourStatus.Confirmed))
            .ToListAsync();

        var slots = new List<TourSlotDto>();

        foreach (var window in windows)
        {
            var current = window.StartTime;
            while (true)
            {
                var slotEnd = current.AddMinutes(window.SlotDurationMinutes);
                if (slotEnd > window.EndTime) break;

                // Count tours already booked in this slot
                var bookedCount = existingTours.Count(t => t.StartTime == current && t.EndTime == slotEnd);
                var available = window.MaxToursPerSlot - bookedCount;

                if (available > 0)
                {
                    slots.Add(new TourSlotDto
                    {
                        StartTime = current,
                        EndTime = slotEnd,
                        AvailableCount = available,
                    });
                }

                current = slotEnd;
            }
        }

        return slots.OrderBy(s => s.StartTime).ToList();
    }

    /// <summary>
    /// Returns dates within a range that have at least one available slot.
    /// </summary>
    public async Task<List<DateTime>> GetAvailableDatesAsync(int propertyId, DateTime start, DateTime end)
    {
        // Get active availability windows for this property
        var windows = await _db.TourAvailabilities
            .AsNoTracking()
            .Where(a => a.PropertyId == propertyId && a.IsActive)
            .ToListAsync();

        if (windows.Count == 0) return [];

        var availableDays = windows.Select(w => w.DayOfWeek).Distinct().ToHashSet();
        var dates = new List<DateTime>();

        for (var date = start.Date; date <= end.Date; date = date.AddDays(1))
        {
            if (availableDays.Contains(date.DayOfWeek))
            {
                // Check if there's at least one open slot on this date
                var slotsOnDate = await GetAvailableSlotsAsync(propertyId, date);
                if (slotsOnDate.Count > 0)
                    dates.Add(date);
            }
        }

        return dates;
    }

    // ════════════════════════════════════════════════════════════════════
    // Tour Booking
    // ════════════════════════════════════════════════════════════════════

    public async Task<Tour> BookTourAsync(BookTourDto dto)
    {
        // Validate property exists
        var property = await _db.Properties.FindAsync(dto.PropertyId)
            ?? throw new InvalidOperationException("Property not found.");

        // Validate settings
        var tourSettings = await _settings.GetSettingsAsync();
        var maxDate = DateTime.Today.AddDays(tourSettings.MaxAdvanceBookingDays);
        if (dto.ScheduledDate > maxDate)
            throw new InvalidOperationException($"Cannot book tours more than {tourSettings.MaxAdvanceBookingDays} days in advance.");

        if (dto.ScheduledDate < DateTime.Today)
            throw new InvalidOperationException("Cannot book tours in the past.");

        // Validate slot is available
        var slots = await GetAvailableSlotsAsync(dto.PropertyId, dto.ScheduledDate);
        var slot = slots.FirstOrDefault(s => s.StartTime == dto.StartTime && s.EndTime == dto.EndTime);
        if (slot == null)
            throw new InvalidOperationException("The selected time slot is not available.");

        // Validate unit if specified
        if (dto.UnitId.HasValue)
        {
            var unit = await _db.Units.FindAsync(dto.UnitId.Value);
            if (unit == null || unit.PropertyId != dto.PropertyId)
                throw new InvalidOperationException("Unit not found or does not belong to this property.");
        }

        var tour = new Tour
        {
            PropertyId = dto.PropertyId,
            UnitId = dto.UnitId,
            InquiryId = dto.InquiryId,
            ProspectMemberKey = dto.ProspectMemberKey,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            ScheduledDate = dto.ScheduledDate,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Notes = dto.Notes,
            Status = tourSettings.RequireConfirmation ? TourStatus.Requested : TourStatus.Confirmed,
        };

        if (!tourSettings.RequireConfirmation)
            tour.ConfirmedAt = DateTimeOffset.UtcNow;

        _db.Tours.Add(tour);
        await _db.SaveChangesAsync();

        // Reload with navigation properties for email
        tour = (await GetByIdAsync(tour.Id))!;

        if (!tourSettings.RequireConfirmation)
            await _email.SendTourConfirmationAsync(tour);

        _logger.LogInformation("Tour {Id} booked for {Name} at property {PropertyId} on {Date} {Start}-{End} (Status: {Status})",
            tour.Id, tour.FullName, tour.PropertyId, tour.ScheduledDate.ToString("yyyy-MM-dd"),
            tour.StartTime, tour.EndTime, tour.Status);

        return tour;
    }

    public async Task<Tour?> GetByIdAsync(int id)
    {
        return await _db.Tours
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .Include(t => t.Inquiry)
            .FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<(List<Tour> Items, int Total)> GetAllAsync(TourFilterDto filter)
    {
        var query = _db.Tours
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .AsQueryable();

        if (filter.PropertyId.HasValue)
            query = query.Where(t => t.PropertyId == filter.PropertyId.Value);

        if (filter.Status.HasValue)
            query = query.Where(t => t.Status == filter.Status.Value);

        if (filter.DateFrom.HasValue)
            query = query.Where(t => t.ScheduledDate >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(t => t.ScheduledDate <= filter.DateTo.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.Trim();
            query = query.Where(t =>
                t.FullName.Contains(s) ||
                t.Email.Contains(s) ||
                t.Property.Name.Contains(s) ||
                (t.Unit != null && t.Unit.UnitNumber.Contains(s)));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.ScheduledDate)
            .ThenBy(t => t.StartTime)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .AsNoTracking()
            .ToListAsync();

        return (items, total);
    }

    public async Task<List<Tour>> GetByProspectAsync(Guid memberKey)
    {
        return await _db.Tours
            .Include(t => t.Property)
            .Include(t => t.Unit)
            .Where(t => t.ProspectMemberKey == memberKey)
            .OrderByDescending(t => t.ScheduledDate)
            .ThenBy(t => t.StartTime)
            .AsNoTracking()
            .ToListAsync();
    }

    // ════════════════════════════════════════════════════════════════════
    // Manager Actions
    // ════════════════════════════════════════════════════════════════════

    public async Task<Tour> ConfirmAsync(int id)
    {
        var tour = await GetByIdAsync(id)
            ?? throw new InvalidOperationException("Tour not found.");

        if (tour.Status != TourStatus.Requested)
            throw new InvalidOperationException($"Only Requested tours can be confirmed. Current status: {tour.Status}.");

        tour.Status = TourStatus.Confirmed;
        tour.ConfirmedAt = DateTimeOffset.UtcNow;
        tour.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        await _email.SendTourConfirmationAsync(tour);

        _logger.LogInformation("Tour {Id} confirmed", id);
        return tour;
    }

    public async Task<Tour> RescheduleAsync(int id, DateTime newDate, TimeOnly newStart, TimeOnly newEnd)
    {
        var tour = await GetByIdAsync(id)
            ?? throw new InvalidOperationException("Tour not found.");

        if (tour.Status is TourStatus.Completed or TourStatus.NoShow)
            throw new InvalidOperationException($"Cannot reschedule a {tour.Status} tour.");

        tour.ScheduledDate = newDate;
        tour.StartTime = newStart;
        tour.EndTime = newEnd;
        tour.Status = TourStatus.Confirmed;
        tour.ConfirmedAt = DateTimeOffset.UtcNow;
        tour.ReminderSentAt = null; // reset reminder for new date
        tour.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        await _email.SendTourRescheduledAsync(tour);

        _logger.LogInformation("Tour {Id} rescheduled to {Date} {Start}-{End}", id,
            newDate.ToString("yyyy-MM-dd"), newStart, newEnd);
        return tour;
    }

    public async Task<Tour> CancelAsync(int id, string? reason = null)
    {
        var tour = await GetByIdAsync(id)
            ?? throw new InvalidOperationException("Tour not found.");

        if (tour.Status is TourStatus.Completed or TourStatus.NoShow)
            throw new InvalidOperationException($"Cannot cancel a {tour.Status} tour.");

        tour.Status = TourStatus.Cancelled;
        if (reason != null) tour.ManagerNotes = reason;
        tour.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        await _email.SendTourCancelledAsync(tour, reason);

        _logger.LogInformation("Tour {Id} cancelled", id);
        return tour;
    }

    public async Task<Tour> CompleteAsync(int id)
    {
        var tour = await GetByIdAsync(id)
            ?? throw new InvalidOperationException("Tour not found.");

        if (tour.Status != TourStatus.Confirmed)
            throw new InvalidOperationException($"Only Confirmed tours can be completed. Current status: {tour.Status}.");

        tour.Status = TourStatus.Completed;
        tour.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Tour {Id} marked completed", id);
        return tour;
    }

    public async Task<Tour> MarkNoShowAsync(int id)
    {
        var tour = await GetByIdAsync(id)
            ?? throw new InvalidOperationException("Tour not found.");

        if (tour.Status != TourStatus.Confirmed)
            throw new InvalidOperationException($"Only Confirmed tours can be marked as no-show. Current status: {tour.Status}.");

        tour.Status = TourStatus.NoShow;
        tour.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Tour {Id} marked no-show", id);
        return tour;
    }

    // ════════════════════════════════════════════════════════════════════
    // Prospect Actions
    // ════════════════════════════════════════════════════════════════════

    public async Task<Tour> CancelByProspectAsync(int id, Guid memberKey)
    {
        var tour = await GetByIdAsync(id)
            ?? throw new InvalidOperationException("Tour not found.");

        if (tour.ProspectMemberKey != memberKey)
            throw new InvalidOperationException("You can only cancel your own tours.");

        if (tour.Status is TourStatus.Completed or TourStatus.NoShow or TourStatus.Cancelled)
            throw new InvalidOperationException($"Cannot cancel a {tour.Status} tour.");

        tour.Status = TourStatus.Cancelled;
        tour.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Tour {Id} cancelled by prospect {MemberKey}", id, memberKey);
        return tour;
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────

public class CreateAvailabilityDto
{
    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int? SlotDurationMinutes { get; set; }
    public int? MaxToursPerSlot { get; set; }
    public bool? IsActive { get; set; }
}

public class UpdateAvailabilityDto
{
    public DayOfWeek? DayOfWeek { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public int? SlotDurationMinutes { get; set; }
    public int? MaxToursPerSlot { get; set; }
    public bool? IsActive { get; set; }
}

public class TourSlotDto
{
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int AvailableCount { get; set; }
}

public class BookTourDto
{
    public int PropertyId { get; set; }
    public int? UnitId { get; set; }
    public int? InquiryId { get; set; }
    public Guid? ProspectMemberKey { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime ScheduledDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string? Notes { get; set; }
}

public class TourFilterDto
{
    public int? PropertyId { get; set; }
    public TourStatus? Status { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Search { get; set; }
    public int Skip { get; set; } = 0;
    public int Take { get; set; } = 50;
}
