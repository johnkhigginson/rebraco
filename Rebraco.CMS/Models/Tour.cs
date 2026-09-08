using System.ComponentModel.DataAnnotations;

namespace Rebraco.CMS.Models;

/// <summary>
/// A scheduled property tour. Can be booked by anonymous visitors or registered prospects.
/// Optionally linked to an inquiry and/or a specific unit.
/// </summary>
public class Tour
{
    public int Id { get; set; }

    public int PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    /// <summary>Optional — null for property-level tours, set for unit-specific tours.</summary>
    public int? UnitId { get; set; }
    public Unit? Unit { get; set; }

    /// <summary>Optional link to an existing inquiry.</summary>
    public int? InquiryId { get; set; }
    public Inquiry? Inquiry { get; set; }

    /// <summary>Umbraco member key if booked by a logged-in Prospect. Null for anonymous bookings.</summary>
    public Guid? ProspectMemberKey { get; set; }

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(254)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    /// <summary>The date of the scheduled tour.</summary>
    public DateTime ScheduledDate { get; set; }

    /// <summary>Tour slot start time.</summary>
    public TimeOnly StartTime { get; set; }

    /// <summary>Tour slot end time.</summary>
    public TimeOnly EndTime { get; set; }

    public TourStatus Status { get; set; } = TourStatus.Requested;

    /// <summary>Notes from the prospect when booking.</summary>
    [MaxLength(2000)]
    public string? Notes { get; set; }

    /// <summary>Internal manager notes.</summary>
    [MaxLength(2000)]
    public string? ManagerNotes { get; set; }

    public DateTimeOffset? ConfirmedAt { get; set; }

    /// <summary>Set when day-before reminder email was sent, to prevent duplicates.</summary>
    public DateTimeOffset? ReminderSentAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
