using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

/// <summary>
/// Manager endpoints for tour availability windows and tour lifecycle management.
/// </summary>
[ApiController]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class ToursController : ControllerBase
{
    private readonly TourService _tours;
    private readonly ILogger<ToursController> _logger;

    public ToursController(TourService tours, ILogger<ToursController> logger)
    {
        _tours = tours;
        _logger = logger;
    }

    // ════════════════════════════════════════════════════════════════════
    // Availability Windows
    // ════════════════════════════════════════════════════════════════════

    /// <summary>Create a recurring availability window for a property.</summary>
    [HttpPost("api/properties/{propertyId:int}/tour-availability")]
    public async Task<IActionResult> CreateAvailability(int propertyId, [FromBody] CreateAvailabilityRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var availability = await _tours.CreateAvailabilityAsync(propertyId, new CreateAvailabilityDto
            {
                DayOfWeek = request.DayOfWeek,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                SlotDurationMinutes = request.SlotDurationMinutes,
                MaxToursPerSlot = request.MaxToursPerSlot,
                IsActive = request.IsActive,
            });

            return Ok(MapAvailability(availability));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>List availability windows for a property.</summary>
    [HttpGet("api/properties/{propertyId:int}/tour-availability")]
    public async Task<IActionResult> GetAvailability(int propertyId)
    {
        var windows = await _tours.GetAvailabilityByPropertyAsync(propertyId);
        return Ok(windows.Select(MapAvailability));
    }

    /// <summary>Update an availability window.</summary>
    [HttpPatch("api/tour-availability/{id:int}")]
    public async Task<IActionResult> UpdateAvailability(int id, [FromBody] UpdateAvailabilityRequest request)
    {
        try
        {
            var availability = await _tours.UpdateAvailabilityAsync(id, new UpdateAvailabilityDto
            {
                DayOfWeek = request.DayOfWeek,
                StartTime = request.StartTime,
                EndTime = request.EndTime,
                SlotDurationMinutes = request.SlotDurationMinutes,
                MaxToursPerSlot = request.MaxToursPerSlot,
                IsActive = request.IsActive,
            });

            return Ok(MapAvailability(availability));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Delete an availability window.</summary>
    [HttpDelete("api/tour-availability/{id:int}")]
    public async Task<IActionResult> DeleteAvailability(int id)
    {
        try
        {
            await _tours.DeleteAvailabilityAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ════════════════════════════════════════════════════════════════════
    // Tour Management
    // ════════════════════════════════════════════════════════════════════

    /// <summary>List tours with optional filters.</summary>
    [HttpGet("api/tours")]
    public async Task<IActionResult> List(
        [FromQuery] int? propertyId,
        [FromQuery] TourStatus? status,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        var (items, total) = await _tours.GetAllAsync(new TourFilterDto
        {
            PropertyId = propertyId,
            Status = status,
            DateFrom = dateFrom,
            DateTo = dateTo,
            Search = search,
            Skip = skip,
            Take = Math.Clamp(take, 1, 100),
        });

        return Ok(new
        {
            items = items.Select(MapTour),
            total,
            skip,
            take,
        });
    }

    /// <summary>Get tour details.</summary>
    [HttpGet("api/tours/{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var tour = await _tours.GetByIdAsync(id);
        if (tour == null) return NotFound();
        return Ok(MapTour(tour));
    }

    /// <summary>Confirm a requested tour.</summary>
    [HttpPost("api/tours/{id:int}/confirm")]
    public async Task<IActionResult> Confirm(int id)
    {
        try
        {
            var tour = await _tours.ConfirmAsync(id);
            return Ok(MapTour(tour));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Reschedule a tour to a new date/time.</summary>
    [HttpPost("api/tours/{id:int}/reschedule")]
    public async Task<IActionResult> Reschedule(int id, [FromBody] RescheduleRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var tour = await _tours.RescheduleAsync(id, request.ScheduledDate, request.StartTime, request.EndTime);
            return Ok(MapTour(tour));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Cancel a tour.</summary>
    [HttpPost("api/tours/{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, [FromBody] CancelTourRequest? request = null)
    {
        try
        {
            var tour = await _tours.CancelAsync(id, request?.Reason);
            return Ok(MapTour(tour));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Mark a tour as completed.</summary>
    [HttpPost("api/tours/{id:int}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        try
        {
            var tour = await _tours.CompleteAsync(id);
            return Ok(MapTour(tour));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>Mark a tour as no-show.</summary>
    [HttpPost("api/tours/{id:int}/no-show")]
    public async Task<IActionResult> NoShow(int id)
    {
        try
        {
            var tour = await _tours.MarkNoShowAsync(id);
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

    private static object MapAvailability(TourAvailability a) => new
    {
        a.Id,
        a.PropertyId,
        dayOfWeek = a.DayOfWeek.ToString(),
        startTime = a.StartTime.ToString("HH:mm"),
        endTime = a.EndTime.ToString("HH:mm"),
        a.SlotDurationMinutes,
        a.MaxToursPerSlot,
        a.IsActive,
        a.CreatedAt,
        a.UpdatedAt,
    };

    private static object MapTour(Tour t) => new
    {
        t.Id,
        t.PropertyId,
        propertyName = t.Property?.Name,
        t.UnitId,
        unitNumber = t.Unit?.UnitNumber,
        t.InquiryId,
        t.ProspectMemberKey,
        t.FullName,
        t.Email,
        t.Phone,
        scheduledDate = t.ScheduledDate.ToString("yyyy-MM-dd"),
        startTime = t.StartTime.ToString("HH:mm"),
        endTime = t.EndTime.ToString("HH:mm"),
        status = t.Status.ToString(),
        t.Notes,
        t.ManagerNotes,
        t.ConfirmedAt,
        t.ReminderSentAt,
        t.CreatedAt,
        t.UpdatedAt,
    };
}

// ── Request DTOs ──────────────────────────────────────────────────────

public class CreateAvailabilityRequest
{
    [Required]
    public DayOfWeek DayOfWeek { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }

    [Range(15, 240)]
    public int? SlotDurationMinutes { get; set; }

    [Range(1, 20)]
    public int? MaxToursPerSlot { get; set; }

    public bool? IsActive { get; set; }
}

public class UpdateAvailabilityRequest
{
    public DayOfWeek? DayOfWeek { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }

    [Range(15, 240)]
    public int? SlotDurationMinutes { get; set; }

    [Range(1, 20)]
    public int? MaxToursPerSlot { get; set; }

    public bool? IsActive { get; set; }
}

public class RescheduleRequest
{
    [Required]
    public DateTime ScheduledDate { get; set; }

    [Required]
    public TimeOnly StartTime { get; set; }

    [Required]
    public TimeOnly EndTime { get; set; }
}

public class CancelTourRequest
{
    [MaxLength(2000)]
    public string? Reason { get; set; }
}
