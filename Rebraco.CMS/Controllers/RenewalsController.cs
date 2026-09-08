using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class RenewalsController : ControllerBase
{
    private readonly LeaseRenewalService _renewals;
    private readonly ILogger<RenewalsController> _logger;

    public RenewalsController(
        LeaseRenewalService renewals,
        ILogger<RenewalsController> logger)
    {
        _renewals = renewals;
        _logger = logger;
    }

    /// <summary>Create a renewal offer for a lease.</summary>
    [HttpPost("api/leases/{leaseId:int}/renewals")]
    public async Task<IActionResult> CreateOffer(int leaseId, [FromBody] CreateRenewalOfferRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (renewal, error) = await _renewals.CreateOfferAsync(leaseId, new CreateRenewalOfferDto
        {
            ProposedStartDate = request.ProposedStartDate,
            ProposedEndDate = request.ProposedEndDate,
            ProposedMonthlyRent = request.ProposedMonthlyRent,
            ProposedLeaseType = request.ProposedLeaseType,
            ManagerNotes = request.Notes,
        });

        if (renewal == null) return BadRequest(new { error });

        return Ok(new
        {
            success = true,
            renewal = MapRenewal(renewal),
        });
    }

    /// <summary>List renewals for a specific lease.</summary>
    [HttpGet("api/leases/{leaseId:int}/renewals")]
    public async Task<IActionResult> ListByLease(int leaseId)
    {
        var renewals = await _renewals.GetByLeaseIdAsync(leaseId);
        return Ok(new
        {
            renewals = renewals.Select(r => new
            {
                r.Id,
                r.OriginalLeaseId,
                r.NewLeaseId,
                r.ProposedStartDate,
                r.ProposedEndDate,
                r.ProposedMonthlyRent,
                ProposedLeaseType = r.ProposedLeaseType.ToString(),
                Status = r.Status.ToString(),
                r.ManagerNotes,
                r.TenantNotes,
                r.OfferedAt,
                r.TenantRespondedAt,
                r.ConfirmedAt,
            }),
        });
    }

    /// <summary>List all renewals with optional filters.</summary>
    [HttpGet("api/renewals")]
    public async Task<IActionResult> ListAll(
        [FromQuery] RenewalStatus? status,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        var (items, total) = await _renewals.GetAllAsync(new RenewalFilterDto
        {
            Status = status,
            Search = search,
            Skip = skip,
            Take = take,
        });

        return Ok(new
        {
            renewals = items.Select(MapRenewal),
            total,
        });
    }

    /// <summary>Get renewal detail by ID.</summary>
    [HttpGet("api/renewals/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var renewal = await _renewals.GetByIdAsync(id);
        if (renewal == null) return NotFound(new { error = "Renewal not found." });

        return Ok(MapRenewal(renewal));
    }

    /// <summary>Confirm a tenant-accepted renewal — creates the new lease.</summary>
    [HttpPost("api/renewals/{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id)
    {
        var (renewal, error) = await _renewals.ConfirmAsync(id);
        if (renewal == null) return BadRequest(new { error });

        return Ok(new
        {
            success = true,
            renewal = new
            {
                renewal.Id,
                renewal.NewLeaseId,
                Status = renewal.Status.ToString(),
                renewal.ConfirmedAt,
            },
        });
    }

    /// <summary>Cancel a pending renewal offer.</summary>
    [HttpPost("api/renewals/{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var (renewal, error) = await _renewals.CancelAsync(id);
        if (renewal == null) return BadRequest(new { error });

        return Ok(new { success = true });
    }

    /// <summary>List leases expiring within the configured auto-detect window that have no pending renewal.</summary>
    [HttpGet("api/leases/expiring")]
    public async Task<IActionResult> Expiring()
    {
        var leases = await _renewals.GetExpiringLeasesAsync();

        return Ok(new
        {
            leases = leases.Select(l => new
            {
                l.Id,
                l.StartDate,
                l.EndDate,
                l.MonthlyRent,
                Status = l.Status.ToString(),
                LeaseType = l.LeaseType.ToString(),
                DaysRemaining = (int)(l.EndDate.Date - DateTime.UtcNow.Date).TotalDays,
                Tenant = new { l.Tenant.Id, l.Tenant.FirstName, l.Tenant.LastName, l.Tenant.Email },
                Unit = new { l.Unit.Id, l.Unit.UnitNumber, PropertyName = l.Unit.Property.Name },
            }),
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private static object MapRenewal(LeaseRenewal r) => new
    {
        r.Id,
        r.OriginalLeaseId,
        r.NewLeaseId,
        r.ProposedStartDate,
        r.ProposedEndDate,
        r.ProposedMonthlyRent,
        ProposedLeaseType = r.ProposedLeaseType.ToString(),
        Status = r.Status.ToString(),
        r.ManagerNotes,
        r.TenantNotes,
        r.OfferedAt,
        r.TenantRespondedAt,
        r.ConfirmedAt,
        Tenant = r.OriginalLease?.Tenant is { } t
            ? new { t.Id, t.FirstName, t.LastName, t.Email }
            : null,
        Unit = r.OriginalLease?.Unit is { } u
            ? new { u.Id, u.UnitNumber, PropertyName = u.Property?.Name }
            : null,
        OriginalLease = r.OriginalLease is { } ol
            ? new { ol.Id, ol.StartDate, ol.EndDate, ol.MonthlyRent }
            : null,
    };
}

// ─── Request DTOs ────────────────────────────────────────────────────

public class CreateRenewalOfferRequest : IValidatableObject
{
    [Required]
    public DateTime ProposedStartDate { get; set; }

    [Required]
    public DateTime ProposedEndDate { get; set; }

    [Range(0, 1_000_000)]
    public decimal ProposedMonthlyRent { get; set; }

    public LeaseType ProposedLeaseType { get; set; } = LeaseType.Fixed;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext ctx)
    {
        if (ProposedEndDate <= ProposedStartDate)
            yield return new ValidationResult(
                "End date must be after start date.", [nameof(ProposedEndDate)]);
    }
}
