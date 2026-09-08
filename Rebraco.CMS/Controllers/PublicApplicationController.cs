using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

/// <summary>
/// Prospect-facing endpoints for managing rental applications.
/// Requires Prospect or Tenant member role.
/// </summary>
[ApiController]
[Route("api/portal/applications")]
[UmbracoMemberAuthorize("", "Prospect,Tenant", "")]
public class PublicApplicationController : ControllerBase
{
    private readonly ApplicationService _appService;
    private readonly ApplicationSettingsService _settingsService;
    private readonly IMemberManager _memberManager;

    public PublicApplicationController(
        ApplicationService appService,
        ApplicationSettingsService settingsService,
        IMemberManager memberManager)
    {
        _appService = appService;
        _settingsService = settingsService;
        _memberManager = memberManager;
    }

    /// <summary>Get which sections are required and the fee amount.</summary>
    [HttpGet("/api/portal/application-settings")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSettings()
    {
        var settings = await _settingsService.GetSettingsAsync();
        return Ok(settings);
    }

    /// <summary>List my applications.</summary>
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var memberKey = await GetMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var apps = await _appService.GetMyApplicationsAsync(memberKey.Value);

        return Ok(new
        {
            items = apps.Select(a => new
            {
                a.Id,
                a.PropertyId,
                PropertyName = a.Property?.Name,
                a.UnitId,
                Status = a.Status.ToString(),
                a.ApplicantFirstName,
                a.ApplicantLastName,
                a.DesiredMoveInDate,
                a.FeeAmountCents,
                a.FeePaidAt,
                a.SubmittedAt,
                a.CreatedAt,
            })
        });
    }

    /// <summary>Get one of my applications by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var memberKey = await GetMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var app = await _appService.GetMyApplicationByIdAsync(id, memberKey.Value);
        if (app == null) return NotFound(new { error = "Application not found." });

        return Ok(MapApplicationDetail(app));
    }

    /// <summary>Create a new draft application.</summary>
    [HttpPost]
    [EnableRateLimiting("PublicForm")]
    public async Task<IActionResult> Create([FromBody] CreateApplicationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var memberKey = await GetMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var member = await _memberManager.GetCurrentMemberAsync();

        var app = await _appService.CreateDraftAsync(memberKey.Value, new CreateApplicationDto
        {
            PropertyId = request.PropertyId,
            UnitId = request.UnitId,
            FirstName = request.FirstName ?? member?.Name?.Split(' ').FirstOrDefault() ?? "",
            LastName = request.LastName ?? member?.Name?.Split(' ').LastOrDefault() ?? "",
            Email = request.Email ?? member?.Email ?? "",
            Phone = request.Phone,
            DesiredMoveInDate = request.DesiredMoveInDate,
            DesiredLeaseTerm = request.DesiredLeaseTerm,
        });

        return Ok(new { success = true, applicationId = app.Id });
    }

    /// <summary>Update a draft application (sections, basic info).</summary>
    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateApplicationRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var memberKey = await GetMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var (app, error) = await _appService.UpdateDraftAsync(id, memberKey.Value, new UpdateApplicationDto
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            Phone = request.Phone,
            UnitId = request.UnitId,
            DesiredMoveInDate = request.DesiredMoveInDate,
            DesiredLeaseTerm = request.DesiredLeaseTerm,
            EmploymentJson = request.EmploymentJson,
            RentalHistoryJson = request.RentalHistoryJson,
            ReferencesJson = request.ReferencesJson,
            EmergencyContactJson = request.EmergencyContactJson,
            VehicleJson = request.VehicleJson,
            CoSignerJson = request.CoSignerJson,
            PetsJson = request.PetsJson,
            AdditionalNotes = request.AdditionalNotes,
        });

        if (app == null) return BadRequest(new { error });
        return Ok(new { success = true });
    }

    /// <summary>Submit a draft application (validates required sections).</summary>
    [HttpPost("{id:int}/submit")]
    public async Task<IActionResult> Submit(int id)
    {
        var memberKey = await GetMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var (app, error) = await _appService.SubmitAsync(id, memberKey.Value);
        if (app == null) return BadRequest(new { error });

        return Ok(new
        {
            success = true,
            status = app.Status.ToString(),
            feeRequired = app.Status == ApplicationStatus.PendingPayment,
            feeAmountCents = app.FeeAmountCents,
        });
    }

    /// <summary>Create a Stripe Checkout session to pay the application fee.</summary>
    [HttpPost("{id:int}/pay")]
    public async Task<IActionResult> Pay(int id, [FromBody] PayApplicationFeeRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var memberKey = await GetMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var (checkoutUrl, error) = await _appService.CreateCheckoutSessionAsync(
            id, memberKey.Value, request.SuccessUrl, request.CancelUrl);

        if (checkoutUrl == null) return BadRequest(new { error });
        return Ok(new { checkoutUrl });
    }

    /// <summary>Withdraw an application.</summary>
    [HttpPost("{id:int}/withdraw")]
    public async Task<IActionResult> Withdraw(int id)
    {
        var memberKey = await GetMemberKeyAsync();
        if (!memberKey.HasValue) return Unauthorized();

        var (success, error) = await _appService.WithdrawAsync(id, memberKey.Value);
        if (!success) return BadRequest(new { error });

        return Ok(new { success = true });
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private async Task<Guid?> GetMemberKeyAsync()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        return member?.Key;
    }

    private static object MapApplicationDetail(Application a) => new
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
        a.ApplicantPhone,
        a.DesiredMoveInDate,
        a.DesiredLeaseTerm,
        a.EmploymentJson,
        a.RentalHistoryJson,
        a.ReferencesJson,
        a.EmergencyContactJson,
        a.VehicleJson,
        a.CoSignerJson,
        a.PetsJson,
        a.AdditionalNotes,
        a.FeeAmountCents,
        a.FeePaidAt,
        a.SubmittedAt,
        a.ReviewedAt,
        a.DenialReason,
        a.CreatedAt,
        a.UpdatedAt,
    };
}

// ─── Request DTOs ────────────────────────────────────────────

public class CreateApplicationRequest
{
    [Required]
    public int PropertyId { get; set; }

    public int? UnitId { get; set; }

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(254), EmailAddress]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }

    public DateOnly? DesiredMoveInDate { get; set; }

    [MaxLength(50)]
    public string? DesiredLeaseTerm { get; set; }
}

public class UpdateApplicationRequest
{
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(254), EmailAddress]
    public string? Email { get; set; }

    [MaxLength(30)]
    public string? Phone { get; set; }

    public int? UnitId { get; set; }
    public DateOnly? DesiredMoveInDate { get; set; }

    [MaxLength(50)]
    public string? DesiredLeaseTerm { get; set; }

    public string? EmploymentJson { get; set; }
    public string? RentalHistoryJson { get; set; }
    public string? ReferencesJson { get; set; }
    public string? EmergencyContactJson { get; set; }
    public string? VehicleJson { get; set; }
    public string? CoSignerJson { get; set; }
    public string? PetsJson { get; set; }

    [MaxLength(2000)]
    public string? AdditionalNotes { get; set; }
}

public class PayApplicationFeeRequest
{
    [Required]
    public string SuccessUrl { get; set; } = string.Empty;

    [Required]
    public string CancelUrl { get; set; } = string.Empty;
}
