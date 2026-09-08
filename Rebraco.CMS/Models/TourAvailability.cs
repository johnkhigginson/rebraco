using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

/// <summary>
/// Recurring weekly availability window for property tours.
/// Managers define when tours can be scheduled (e.g. Mon/Wed/Fri 10am-12pm).
/// </summary>
public class TourAvailability
{
    public int Id { get; set; }

    public int PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    /// <summary>Day of the week this window applies to.</summary>
    public DayOfWeek DayOfWeek { get; set; }

    /// <summary>Start time of the availability window.</summary>
    public TimeOnly StartTime { get; set; }

    /// <summary>End time of the availability window.</summary>
    public TimeOnly EndTime { get; set; }

    /// <summary>Duration of each tour slot in minutes.</summary>
    public int SlotDurationMinutes { get; set; } = 30;

    /// <summary>Maximum number of tours that can be booked per slot.</summary>
    public int MaxToursPerSlot { get; set; } = 1;

    /// <summary>Whether this availability window is currently active.</summary>
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
