using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Rebraco.CMS.Models;

public enum ApplicationStatus
{
    Draft = 0,
    PendingPayment = 1,
    Submitted = 2,
    UnderReview = 3,
    Approved = 4,
    Denied = 5,
    Converted = 6,
    Withdrawn = 7,
}

public class Application
{
    public int Id { get; set; }

    // ── Target property/unit ────────────────────────────────────────
    public int PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public int? UnitId { get; set; }
    public Unit? Unit { get; set; }

    // ── Applicant identity ──────────────────────────────────────────
    /// <summary>Umbraco member key of the prospect who submitted the application.</summary>
    public Guid MemberKey { get; set; }

    [Required, MaxLength(100)]
    public string ApplicantFirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string ApplicantLastName { get; set; } = string.Empty;

    [Required, MaxLength(254)]
    public string ApplicantEmail { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? ApplicantPhone { get; set; }

    public DateOnly? DesiredMoveInDate { get; set; }

    [MaxLength(50)]
    public string? DesiredLeaseTerm { get; set; }

    // ── Status & workflow ───────────────────────────────────────────
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;

    // ── Section data (JSON, toggleable) ─────────────────────────────
    /// <summary>JSON: { employer, position, monthlyIncome, employmentDuration, supervisorName, supervisorPhone }</summary>
    public string? EmploymentJson { get; set; }

    /// <summary>JSON: [{ address, landlordName, landlordPhone, monthsLived, reasonForLeaving }]</summary>
    public string? RentalHistoryJson { get; set; }

    /// <summary>JSON: [{ name, phone, email, relationship }]</summary>
    public string? ReferencesJson { get; set; }

    /// <summary>JSON: { name, phone, relationship }</summary>
    public string? EmergencyContactJson { get; set; }

    /// <summary>JSON: { make, model, year, color, licensePlate, state }</summary>
    public string? VehicleJson { get; set; }

    /// <summary>JSON: { firstName, lastName, email, phone, relationship }</summary>
    public string? CoSignerJson { get; set; }

    /// <summary>JSON: [{ type, breed, weight, name }]</summary>
    public string? PetsJson { get; set; }

    [MaxLength(2000)]
    public string? AdditionalNotes { get; set; }

    // ── Fee tracking ────────────────────────────────────────────────
    /// <summary>Application fee snapshot at submission time, in cents.</summary>
    public long? FeeAmountCents { get; set; }

    public DateTimeOffset? FeePaidAt { get; set; }

    [MaxLength(200)]
    public string? StripeCheckoutSessionId { get; set; }

    // ── Review / audit ──────────────────────────────────────────────
    public DateTimeOffset? SubmittedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }

    /// <summary>Umbraco member key of the manager who reviewed.</summary>
    public Guid? ReviewedByMemberKey { get; set; }

    [MaxLength(1000)]
    public string? DenialReason { get; set; }

    /// <summary>Set when the application is converted to a tenant record.</summary>
    public int? ConvertedTenantId { get; set; }
    public Tenant? ConvertedTenant { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
