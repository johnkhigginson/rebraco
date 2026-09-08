using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/properties")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class PropertiesController : ControllerBase
{
    private readonly PropertyService _service;
    private readonly ILogger<PropertiesController> _logger;

    public PropertiesController(PropertyService service, ILogger<PropertiesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] PropertyType? type,
        [FromQuery] string? search,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 25)
    {
        if (take > 100) take = 100;

        var (items, total) = await _service.GetAllAsync(new PropertyFilterDto
        {
            Type = type,
            Search = search,
            Skip = skip,
            Take = take,
        });

        return Ok(new
        {
            items = items.Select(p => new
            {
                p.Id,
                p.Name,
                p.Slug,
                p.Street,
                p.City,
                p.State,
                p.Zip,
                type = p.Type.ToString(),
                p.TotalUnits,
                p.FeaturedImageUrl,
                p.IsPublished,
                p.CreatedAt,
            }),
            total,
            skip,
            take,
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var property = await _service.GetByIdAsync(id);
        if (property == null)
            return NotFound(new { error = "Property not found." });

        var inquiryCount = await _service.GetInquiryCountAsync(id);

        return Ok(new
        {
            property.Id,
            property.Name,
            property.Slug,
            property.Street,
            property.City,
            property.State,
            property.Zip,
            type = property.Type.ToString(),
            property.Description,
            property.TotalUnits,
            property.FeaturedImageUrl,
            property.CampusProximity,
            property.ByuApproved,
            genderRestriction = property.GenderRestriction?.ToString(),
            property.ContactEmail,
            property.ContactPhone,
            property.IsPublished,
            pricingPeriod = property.PricingPeriod.ToString(),
            property.StartingRent,
            property.BuildingAmenities,
            property.MetaTitle,
            property.MetaDescription,
            property.CreatedAt,
            property.UpdatedAt,
            inquiryCount,
            images = property.Images.Select(i => new
            {
                i.Id,
                i.Url,
                i.Alt,
                i.SortOrder,
            }),
            units = property.Units.Select(u => new
            {
                u.Id,
                u.UnitNumber,
                u.Bedrooms,
                u.Bathrooms,
                u.SqFt,
                u.Capacity,
                u.MonthlyRent,
                u.FloorPlan,
                status = u.Status.ToString(),
                u.IsPublished,
            }),
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePropertyRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var property = await _service.CreateAsync(new CreatePropertyDto
            {
                Name = request.Name,
                Street = request.Street,
                City = request.City,
                State = request.State,
                Zip = request.Zip,
                Type = request.Type,
                Description = request.Description,
                TotalUnits = request.TotalUnits,
                FeaturedImageUrl = request.FeaturedImageUrl,
                CampusProximity = request.CampusProximity,
                ByuApproved = request.ByuApproved,
                GenderRestriction = request.GenderRestriction,
                ContactEmail = request.ContactEmail,
                ContactPhone = request.ContactPhone,
                IsPublished = request.IsPublished,
                PricingPeriod = request.PricingPeriod,
                StartingRent = request.StartingRent,
                BuildingAmenities = request.BuildingAmenities,
                MetaTitle = request.MetaTitle,
                MetaDescription = request.MetaDescription,
            });

            return Ok(new { success = true, id = property.Id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create property '{Name}'", request.Name);
            return StatusCode(500, new { error = "Failed to create property." });
        }
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePropertyRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var property = await _service.UpdateAsync(id, new UpdatePropertyDto
        {
            Name = request.Name,
            Slug = request.Slug,
            Street = request.Street,
            City = request.City,
            State = request.State,
            Zip = request.Zip,
            Type = request.Type,
            Description = request.Description,
            TotalUnits = request.TotalUnits,
            FeaturedImageUrl = request.FeaturedImageUrl,
            CampusProximity = request.CampusProximity,
            ByuApproved = request.ByuApproved,
            GenderRestriction = request.GenderRestriction,
            ContactEmail = request.ContactEmail,
            ContactPhone = request.ContactPhone,
            IsPublished = request.IsPublished,
            PricingPeriod = request.PricingPeriod,
            StartingRent = request.StartingRent,
            BuildingAmenities = request.BuildingAmenities,
            MetaTitle = request.MetaTitle,
            MetaDescription = request.MetaDescription,
        });

        if (property == null)
            return NotFound(new { error = "Property not found." });

        return Ok(new { success = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        if (!deleted)
            return Conflict(new { error = "Property not found or has units. Remove units first." });

        return Ok(new { success = true });
    }
}

// --- Request DTOs ---

public class CreatePropertyRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Street { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(2)]
    public string? State { get; set; }

    [MaxLength(10)]
    public string? Zip { get; set; }

    public PropertyType Type { get; set; } = PropertyType.Apartment;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(0, 10_000)]
    public int TotalUnits { get; set; }

    // Public-facing fields
    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }

    [MaxLength(500)]
    public string? CampusProximity { get; set; }

    public bool ByuApproved { get; set; }
    public GenderRestriction? GenderRestriction { get; set; }

    [MaxLength(254)]
    public string? ContactEmail { get; set; }

    [MaxLength(30)]
    public string? ContactPhone { get; set; }

    public bool IsPublished { get; set; }
    public PricingPeriod PricingPeriod { get; set; } = PricingPeriod.Monthly;

    [Range(0, 1_000_000)]
    public decimal? StartingRent { get; set; }

    [MaxLength(2000)]
    public string? BuildingAmenities { get; set; }

    [MaxLength(160)]
    public string? MetaTitle { get; set; }

    [MaxLength(300)]
    public string? MetaDescription { get; set; }
}

public class UpdatePropertyRequest
{
    [MaxLength(200)]
    public string? Name { get; set; }

    [MaxLength(250)]
    public string? Slug { get; set; }

    [MaxLength(300)]
    public string? Street { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(2)]
    public string? State { get; set; }

    [MaxLength(10)]
    public string? Zip { get; set; }

    public PropertyType? Type { get; set; }

    [MaxLength(2000)]
    public string? Description { get; set; }

    public int? TotalUnits { get; set; }

    // Public-facing fields
    [MaxLength(500)]
    public string? FeaturedImageUrl { get; set; }

    [MaxLength(500)]
    public string? CampusProximity { get; set; }

    public bool? ByuApproved { get; set; }
    public GenderRestriction? GenderRestriction { get; set; }

    [MaxLength(254)]
    public string? ContactEmail { get; set; }

    [MaxLength(30)]
    public string? ContactPhone { get; set; }

    public bool? IsPublished { get; set; }
    public PricingPeriod? PricingPeriod { get; set; }

    [Range(0, 1_000_000)]
    public decimal? StartingRent { get; set; }

    [MaxLength(2000)]
    public string? BuildingAmenities { get; set; }

    [MaxLength(160)]
    public string? MetaTitle { get; set; }

    [MaxLength(300)]
    public string? MetaDescription { get; set; }
}
