using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

/// <summary>
/// Manager endpoints for reviewing and managing rental applications.
/// </summary>
[ApiController]
[Route("api/applications")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class ApplicationsController : ControllerBase
{
    private readonly ApplicationService _appService;
    private readonly IMemberManager _memberManager;

    public ApplicationsController(
        ApplicationService appService,
        IMemberManager memberManager)
    {
        _appService = appService;
        _memberManager = memberManager;
    }

    /// <summary>List applications with optional filters.</summary>
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? status,
        [FromQuery] int? propertyId,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        var filter = new ApplicationFilterDto
        {
            Status = Enum.TryParse<ApplicationStatus>(status, true, out var s) ? s : null,
            PropertyId = propertyId,
            Search = search,
            Skip = skip,
            Take = Math.Clamp(take, 1, 100),
        };

        var (items, total) = await _appService.GetAllAsync(filter);

        return Ok(new
        {
            items = items.Select(a => new
            {
                a.Id,
                a.PropertyId,
                PropertyName = a.Property?.Name,
                a.UnitId,
                UnitNumber = a.Unit?.UnitNumber,
                Status = a.Status.ToString(),
                a.ApplicantFirstName,
                a.ApplicantLastName,
                a.ApplicantEmail,
                a.DesiredMoveInDate,
                a.FeeAmountCents,
                a.FeePaidAt,
                a.SubmittedAt,
                a.ReviewedAt,
                a.CreatedAt,
            }),
            total,
            skip,
            take = filter.Take,
        });
    }

    /// <summary>Get full application detail.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var app = await _appService.GetByIdAsync(id);
        if (app == null) return NotFound(new { error = "Application not found." });

        return Ok(new
        {
            app.Id,
            app.PropertyId,
            PropertyName = app.Property?.Name,
            app.UnitId,
            UnitNumber = app.Unit?.UnitNumber,
            Status = app.Status.ToString(),
            app.MemberKey,
            app.ApplicantFirstName,
            app.ApplicantLastName,
            app.ApplicantEmail,
            app.ApplicantPhone,
            app.DesiredMoveInDate,
            app.DesiredLeaseTerm,
            app.EmploymentJson,
            app.RentalHistoryJson,
            app.ReferencesJson,
            app.EmergencyContactJson,
            app.VehicleJson,
            app.CoSignerJson,
            app.PetsJson,
            app.AdditionalNotes,
            app.FeeAmountCents,
            app.FeePaidAt,
            app.StripeCheckoutSessionId,
            app.SubmittedAt,
            app.ReviewedAt,
            app.ReviewedByMemberKey,
            app.DenialReason,
            app.ConvertedTenantId,
            ConvertedTenantName = app.ConvertedTenant != null
                ? $"{app.ConvertedTenant.FirstName} {app.ConvertedTenant.LastName}" : null,
            app.CreatedAt,
            app.UpdatedAt,
        });
    }

    /// <summary>Set application status to UnderReview.</summary>
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> SetUnderReview(int id)
    {
        var memberKey = await GetManagerMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var (success, error) = await _appService.SetUnderReviewAsync(id, memberKey.Value);
        if (!success) return BadRequest(new { error });

        return Ok(new { success = true });
    }

    /// <summary>Approve an application.</summary>
    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var memberKey = await GetManagerMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var (success, error) = await _appService.ApproveAsync(id, memberKey.Value);
        if (!success) return BadRequest(new { error });

        return Ok(new { success = true });
    }

    /// <summary>Deny an application.</summary>
    [HttpPost("{id:int}/deny")]
    public async Task<IActionResult> Deny(int id, [FromBody] DenyApplicationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var memberKey = await GetManagerMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var (success, error) = await _appService.DenyAsync(id, memberKey.Value, request.Reason);
        if (!success) return BadRequest(new { error });

        return Ok(new { success = true });
    }

    /// <summary>Convert an approved application to a tenant + lease.</summary>
    [HttpPost("{id:int}/convert")]
    public async Task<IActionResult> Convert(int id, [FromBody] ConvertApplicationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (tenant, lease, error) = await _appService.ConvertToTenantAsync(id, new ConvertApplicationDto
        {
            UnitId = request.UnitId,
            BedDesignation = request.BedDesignation,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            MonthlyRent = request.MonthlyRent,
            SecurityDeposit = request.SecurityDeposit,
            LeaseType = request.LeaseType,
            MoveInDate = request.MoveInDate,
        });

        if (tenant == null) return BadRequest(new { error });

        return Ok(new
        {
            success = true,
            tenantId = tenant!.Id,
            leaseId = lease!.Id,
        });
    }

    private async Task<Guid?> GetManagerMemberKeyAsync()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        return member?.Key;
    }
}

// ─── Request DTOs ────────────────────────────────────────────

public class DenyApplicationRequest
{
    [Required, MaxLength(1000)]
    public string Reason { get; set; } = string.Empty;
}

public class ConvertApplicationRequest
{
    [Required]
    public int UnitId { get; set; }

    [MaxLength(20)]
    public string? BedDesignation { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Required]
    public decimal MonthlyRent { get; set; }

    public decimal SecurityDeposit { get; set; }

    [MaxLength(20)]
    public string? LeaseType { get; set; }

    public DateOnly? MoveInDate { get; set; }
}
