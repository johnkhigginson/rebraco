using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

/// <summary>
/// Public and prospect-facing tour endpoints.
/// Anonymous users can view slots and book tours.
/// Logged-in Prospect/Tenant members can view and cancel their tours.
/// </summary>
[ApiController]
public class PublicToursController : ControllerBase
{
    private readonly TourService _tours;
    private readonly IMemberManager _memberManager;
    private readonly ILogger<PublicToursController> _logger;

    public PublicToursController(
        TourService tours,
        IMemberManager memberManager,
        ILogger<PublicToursController> logger)
    {
        _tours = tours;
        _memberManager = memberManager;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════════════
    // Anonymous — Slot Discovery & Booking
    // ════════════════════════════════════════════════════════════════════

    /// <summary>Get dates with available tour slots in a date range.</summary>
    [HttpGet("api/public/tours/dates/{propertyId:int}")]
    [AllowAnonymous]
    [EnableRateLimiting("PublicApi")]
    public async Task<IActionResult> GetAvailableDates(
        int propertyId,
        [FromQuery] DateTime? start,
        [FromQuery] DateTime? end)
    {
        var startDate = start ?? DateTime.Today;
        var endDate = end ?? DateTime.Today.AddDays(30);

        if (endDate < startDate)
            return BadRequest(new { error = "End date must be after start date." });

        if ((endDate - startDate).TotalDays > 90)
            return BadRequest(new { error = "Date range cannot exceed 90 days." });

        var dates = await _tours.GetAvailableDatesAsync(propertyId, startDate, endDate);
        return Ok(dates.Select(d => d.ToString("yyyy-MM-dd")));
    }

    /// <summary>Get available time slots for a property on a specific date.</summary>
    [HttpGet("api/public/tours/slots/{propertyId:int}")]
    [AllowAnonymous]
    [EnableRateLimiting("PublicApi")]
    public async Task<IActionResult> GetAvailableSlots(
        int propertyId,
        [FromQuery, Required] DateTime date)
    {
        if (date < DateTime.Today)
            return BadRequest(new { error = "Cannot view slots for past dates." });

        var slots = await _tours.GetAvailableSlotsAsync(propertyId, date);
        return Ok(slots.Select(s => new
        {
            startTime = s.StartTime.ToString("HH:mm"),
            endTime = s.EndTime.ToString("HH:mm"),
            s.AvailableCount,
        }));
    }

    /// <summary>Book a tour (anonymous or logged-in).</summary>
    [HttpPost("api/public/tours")]
    [AllowAnonymous]
    [EnableRateLimiting("PublicForm")]
    public async Task<IActionResult> BookTour([FromBody] BookTourRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // If the user is logged in, attach their member key
        Guid? memberKey = null;
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member != null) memberKey = member.Key;

        try
        {
            var tour = await _tours.BookTourAsync(new BookTourDto
            {
                PropertyId = request.PropertyId,
                UnitId = request.UnitId,
                InquiryId = request.InquiryId,
                ProspectMemberKey = memberKey,
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                ScheduledDate = request.ScheduledDate,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                Notes = request.Notes,
            });

            return Ok(new
            {
                tour.Id,
                tour.PropertyId,
                propertyName = tour.Property?.Name,
                scheduledDate = tour.ScheduledDate.ToString("yyyy-MM-dd"),
                startTime = tour.StartTime.ToString("HH:mm"),
                endTime = tour.EndTime.ToString("HH:mm"),
                status = tour.Status.ToString(),
                tour.CreatedAt,
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // Prospect / Tenant Portal — My Tours
    // ════════════════════════════════════════════════════════════════════

    /// <summary>List my tours (Prospect or Tenant).</summary>
    [HttpGet("api/portal/tours")]
    [UmbracoMemberAuthorize("", "Prospect,Tenant", "")]
    public async Task<IActionResult> MyTours()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        var tours = await _tours.GetByProspectAsync(member.Key);
        return Ok(tours.Select(MapTour));
    }

    /// <summary>Get my tour detail.</summary>
    [HttpGet("api/portal/tours/{id:int}")]
    [UmbracoMemberAuthorize("", "Prospect,Tenant", "")]
    public async Task<IActionResult> MyTourDetail(int id)
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        var tour = await _tours.GetByIdAsync(id);
        if (tour == null || tour.ProspectMemberKey != member.Key)
            return NotFound();

        return Ok(MapTour(tour));
    }

    /// <summary>Cancel my tour.</summary>
    [HttpPost("api/portal/tours/{id:int}/cancel")]
    [UmbracoMemberAuthorize("", "Prospect,Tenant", "")]
    public async Task<IActionResult> CancelMyTour(int id)
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        try
        {
            var tour = await _tours.CancelByProspectAsync(id, member.Key);
            return Ok(MapTour(tour));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // Helpers
    // ════════════════════════════════════════════════════════════════════

    private static object MapTour(Models.Tour t) => new
    {
        t.Id,
        t.PropertyId,
        propertyName = t.Property?.Name,
        t.UnitId,
        unitNumber = t.Unit?.UnitNumber,
        scheduledDate = t.ScheduledDate.ToString("yyyy-MM-dd"),
        startTime = t.StartTime.ToString("HH:mm"),
        endTime = t.EndTime.ToString("HH:mm"),
        status = t.Status.ToString(),
        t.Notes,
        t.ConfirmedAt,
        t.CreatedAt,
    };
}

// ── Request DTOs ──────────────────────────────────────────────────────

public class BookTourRequest
{
    [Required]
    public int PropertyId { get; set; }

    public int? UnitId { get; set; }

    public int? InquiryId { get; set; }

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(254), EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MaxLength(30)]
    public string? Phone { get; set; }

    [Required]
    public DateTime ScheduledDate { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}
