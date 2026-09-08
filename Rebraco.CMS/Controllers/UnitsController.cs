using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class UnitsController : ControllerBase
{
    private readonly UnitService _service;
    private readonly ILogger<UnitsController> _logger;

    public UnitsController(UnitService service, ILogger<UnitsController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>List units for a property.</summary>
    [HttpGet("api/properties/{propertyId:int}/units")]
    public async Task<IActionResult> List(
        int propertyId,
        [FromQuery] UnitStatus? status,
        [FromQuery] string? floorPlan,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        if (take > 100) take = 100;

        var (items, total) = await _service.GetAllByPropertyAsync(propertyId, new UnitFilterDto
        {
            Status = status,
            FloorPlan = floorPlan,
            Search = search,
            Skip = skip,
            Take = take,
        });

        return Ok(new
        {
            items = items.Select(u => new
            {
                u.Id,
                u.PropertyId,
                u.UnitNumber,
                u.Bedrooms,
                u.Bathrooms,
                u.SqFt,
                u.Capacity,
                u.MonthlyRent,
                u.FloorPlan,
                status = u.Status.ToString(),
                u.IsPublished,
                u.CreatedAt,
            }),
            total,
            skip,
            take,
        });
    }

    /// <summary>Flat list of all units (for dropdowns).</summary>
    [HttpGet("api/units")]
    public async Task<IActionResult> ListAll()
    {
        var units = await _service.GetAllAsync();
        return Ok(new
        {
            items = units.Select(u => new
            {
                u.Id,
                u.PropertyId,
                propertyName = u.Property.Name,
                u.UnitNumber,
                u.Capacity,
                u.MonthlyRent,
                u.FloorPlan,
                status = u.Status.ToString(),
            }),
        });
    }

    /// <summary>Get a single unit with property, leases, and maintenance.</summary>
    [HttpGet("api/units/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var unit = await _service.GetByIdAsync(id);
        if (unit == null)
            return NotFound(new { error = "Unit not found." });

        var activeLeaseCount = await _service.GetActiveLeaseCountAsync(id);

        return Ok(new
        {
            unit.Id,
            unit.PropertyId,
            unit.UnitNumber,
            unit.Bedrooms,
            unit.Bathrooms,
            unit.SqFt,
            unit.Capacity,
            unit.MonthlyRent,
            unit.FloorPlan,
            status = unit.Status.ToString(),
            unit.Description,
            unit.Furnished,
            unit.PetsAllowed,
            unit.ParkingIncluded,
            unit.UtilitiesIncluded,
            genderRestriction = unit.GenderRestriction?.ToString(),
            unit.AvailableDate,
            pricingModel = unit.PricingModel.ToString(),
            pricingPeriod = unit.PricingPeriod.ToString(),
            unit.BedPrice,
            unit.Deposit,
            unit.FeaturedImageUrl,
            unit.Features,
            unit.SemesterAvailability,
            unit.LeaseTerms,
            unit.IsPublished,
            unit.CreatedAt,
            unit.UpdatedAt,
            activeLeaseCount,
            property = new { unit.Property.Id, unit.Property.Name },
            images = unit.Images.Where(i => !i.IsFloorPlan).Select(i => new
            {
                i.Id,
                i.Url,
                i.Alt,
                i.SortOrder,
            }),
            floorPlanImages = unit.Images.Where(i => i.IsFloorPlan).Select(i => new
            {
                i.Id,
                i.Url,
                i.Alt,
                i.SortOrder,
            }),
            leases = unit.Leases.Select(l => new
            {
                l.Id,
                l.TenantId,
                tenantName = $"{l.Tenant.FirstName} {l.Tenant.LastName}",
                l.BedDesignation,
                l.StartDate,
                l.EndDate,
                l.MonthlyRent,
                status = l.Status.ToString(),
            }),
        });
    }

    /// <summary>Create a unit in a property.</summary>
    [HttpPost("api/properties/{propertyId:int}/units")]
    public async Task<IActionResult> Create(int propertyId, [FromBody] CreateUnitRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var unit = await _service.CreateAsync(propertyId, new CreateUnitDto
        {
            UnitNumber = request.UnitNumber,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            SqFt = request.SqFt,
            Capacity = request.Capacity,
            MonthlyRent = request.MonthlyRent,
            FloorPlan = request.FloorPlan,
            Status = request.Status,
            Description = request.Description,
            Furnished = request.Furnished,
            PetsAllowed = request.PetsAllowed,
            ParkingIncluded = request.ParkingIncluded,
            UtilitiesIncluded = request.UtilitiesIncluded,
            GenderRestriction = request.GenderRestriction,
            AvailableDate = request.AvailableDate,
            PricingModel = request.PricingModel,
            PricingPeriod = request.PricingPeriod,
            BedPrice = request.BedPrice,
            Deposit = request.Deposit,
            FeaturedImageUrl = request.FeaturedImageUrl,
            Features = request.Features,
            SemesterAvailability = request.SemesterAvailability,
            LeaseTerms = request.LeaseTerms,
            IsPublished = request.IsPublished,
        });

        if (unit == null)
            return NotFound(new { error = "Property not found." });

        return Ok(new { success = true, id = unit.Id });
    }

    /// <summary>Bulk create units in a property (shared config, distinct unit numbers).</summary>
    [HttpPost("api/properties/{propertyId:int}/units/bulk")]
    public async Task<IActionResult> BulkCreate(int propertyId, [FromBody] BulkCreateUnitsRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (request.UnitNumbers == null || request.UnitNumbers.Length == 0)
            return BadRequest(new { error = "At least one unit number is required." });

        if (request.UnitNumbers.Length > 200)
            return BadRequest(new { error = "Cannot create more than 200 units at once." });

        var distinct = request.UnitNumbers.Select(n => n.Trim()).Where(n => n.Length > 0).Distinct().ToArray();
        if (distinct.Length != request.UnitNumbers.Length)
            return BadRequest(new { error = "Duplicate or empty unit numbers found." });

        var units = await _service.CreateBulkAsync(propertyId, new BulkCreateUnitDto
        {
            UnitNumbers = distinct,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            SqFt = request.SqFt,
            Capacity = request.Capacity,
            MonthlyRent = request.MonthlyRent,
            FloorPlan = request.FloorPlan,
            Status = request.Status,
            Description = request.Description,
            Furnished = request.Furnished,
            PetsAllowed = request.PetsAllowed,
            ParkingIncluded = request.ParkingIncluded,
            UtilitiesIncluded = request.UtilitiesIncluded,
            GenderRestriction = request.GenderRestriction,
            AvailableDate = request.AvailableDate,
            PricingModel = request.PricingModel,
            PricingPeriod = request.PricingPeriod,
            BedPrice = request.BedPrice,
            Deposit = request.Deposit,
            FeaturedImageUrl = request.FeaturedImageUrl,
            Features = request.Features,
            SemesterAvailability = request.SemesterAvailability,
            LeaseTerms = request.LeaseTerms,
            IsPublished = request.IsPublished,
        });

        if (units == null)
            return NotFound(new { error = "Property not found." });

        return Ok(new
        {
            success = true,
            created = units.Count,
            units = units.Select(u => new { u.Id, u.UnitNumber }),
        });
    }

    /// <summary>Partial update a unit.</summary>
    [HttpPatch("api/units/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUnitRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var unit = await _service.UpdateAsync(id, new UpdateUnitDto
        {
            UnitNumber = request.UnitNumber,
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            SqFt = request.SqFt,
            Capacity = request.Capacity,
            MonthlyRent = request.MonthlyRent,
            FloorPlan = request.FloorPlan,
            Status = request.Status,
            Description = request.Description,
            Furnished = request.Furnished,
            PetsAllowed = request.PetsAllowed,
            ParkingIncluded = request.ParkingIncluded,
            UtilitiesIncluded = request.UtilitiesIncluded,
            GenderRestriction = request.GenderRestriction,
            AvailableDate = request.AvailableDate,
            PricingModel = request.PricingModel,
            PricingPeriod = request.PricingPeriod,
            BedPrice = request.BedPrice,
            Deposit = request.Deposit,
            FeaturedImageUrl = request.FeaturedImageUrl,
            Features = request.Features,
            SemesterAvailability = request.SemesterAvailability,
            LeaseTerms = request.LeaseTerms,
            IsPublished = request.IsPublished,
        });

        if (unit == null)
            return NotFound(new { error = "Unit not found." });

        return Ok(new { success = true });
    }

    /// <summary>Update unit status.</summary>
    [HttpPatch("api/units/{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateUnitStatusRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var unit = await _service.UpdateStatusAsync(id, request.Status);
        if (unit == null)
            return NotFound(new { error = "Unit not found." });

        return Ok(new { success = true, status = unit.Status.ToString() });
    }

    /// <summary>Delete a unit (fails if has leases).</summary>
    [HttpDelete("api/units/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return Conflict(new { error = "Unit not found or has lease history. Remove leases first." });

        return Ok(new { success = true });
    }
}

// --- Request DTOs ---

public class CreateUnitRequest
{
    [Required, MaxLength(50)]
    public string UnitNumber { get; set; } = string.Empty;

    [Range(0, 50)]
    public int Bedrooms { get; set; }

    [Range(0, 50)]
    public int Bathrooms { get; set; }

    [Range(1, 100_000)]
    public int? SqFt { get; set; }

    [Range(1, 100)]
    public int Capacity { get; set; } = 1;

    [Range(0, 1_000_000)]
    public decimal MonthlyRent { get; set; }

    [MaxLength(100)]
    public string? FloorPlan { get; set; }
    public UnitStatus Status { get; set; } = UnitStatus.Available;

    [MaxLength(2000)]
    public string? Description { get; set; }

    // Public-facing fields
    public bool Furnished { get; set; }
    public bool PetsAllowed { get; set; }
    public bool ParkingIncluded { get; set; }
    public bool UtilitiesIncluded { get; set; }
    public GenderRestriction? GenderRestriction { get; set; }
    public DateTime? AvailableDate { get; set; }
    public PricingModel PricingModel { get; set; } = PricingModel.WholeUnit;
    public PricingPeriod PricingPeriod { get; set; } = PricingPeriod.Monthly;

    [Range(0, 1_000_000)]
    public decimal? BedPrice { get; set; }

    [Range(0, 1_000_000)]
    public decimal? Deposit { get; set; }

    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }

    [MaxLength(2000)]
    public string? Features { get; set; }

    [MaxLength(200)]
    public string? SemesterAvailability { get; set; }

    [MaxLength(200)]
    public string? LeaseTerms { get; set; }

    public bool IsPublished { get; set; }
}

public class UpdateUnitRequest
{
    [MaxLength(50)]
    public string? UnitNumber { get; set; }
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public int? SqFt { get; set; }
    public int? Capacity { get; set; }
    public decimal? MonthlyRent { get; set; }
    [MaxLength(100)]
    public string? FloorPlan { get; set; }
    public UnitStatus? Status { get; set; }
    [MaxLength(2000)]
    public string? Description { get; set; }

    // Public-facing fields
    public bool? Furnished { get; set; }
    public bool? PetsAllowed { get; set; }
    public bool? ParkingIncluded { get; set; }
    public bool? UtilitiesIncluded { get; set; }
    public GenderRestriction? GenderRestriction { get; set; }
    public DateTime? AvailableDate { get; set; }
    public PricingModel? PricingModel { get; set; }
    public PricingPeriod? PricingPeriod { get; set; }
    public decimal? BedPrice { get; set; }
    public decimal? Deposit { get; set; }
    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }
    [MaxLength(2000)]
    public string? Features { get; set; }
    [MaxLength(200)]
    public string? SemesterAvailability { get; set; }
    [MaxLength(200)]
    public string? LeaseTerms { get; set; }
    public bool? IsPublished { get; set; }
}

public class UpdateUnitStatusRequest
{
    [Required]
    public UnitStatus Status { get; set; }
}

public class BulkCreateUnitsRequest
{
    [Required]
    public string[] UnitNumbers { get; set; } = [];

    [Range(0, 50)]
    public int Bedrooms { get; set; }

    [Range(0, 50)]
    public int Bathrooms { get; set; }

    [Range(1, 100_000)]
    public int? SqFt { get; set; }

    [Range(1, 100)]
    public int Capacity { get; set; } = 1;

    [Range(0, 1_000_000)]
    public decimal MonthlyRent { get; set; }

    [MaxLength(100)]
    public string? FloorPlan { get; set; }
    public UnitStatus Status { get; set; } = UnitStatus.Available;

    [MaxLength(2000)]
    public string? Description { get; set; }

    public bool Furnished { get; set; }
    public bool PetsAllowed { get; set; }
    public bool ParkingIncluded { get; set; }
    public bool UtilitiesIncluded { get; set; }
    public GenderRestriction? GenderRestriction { get; set; }
    public DateTime? AvailableDate { get; set; }
    public PricingModel PricingModel { get; set; } = PricingModel.WholeUnit;
    public PricingPeriod PricingPeriod { get; set; } = PricingPeriod.Monthly;

    [Range(0, 1_000_000)]
    public decimal? BedPrice { get; set; }

    [Range(0, 1_000_000)]
    public decimal? Deposit { get; set; }

    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }

    [MaxLength(2000)]
    public string? Features { get; set; }

    [MaxLength(200)]
    public string? SemesterAvailability { get; set; }

    [MaxLength(200)]
    public string? LeaseTerms { get; set; }

    public bool IsPublished { get; set; }
}
