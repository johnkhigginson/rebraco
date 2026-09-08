using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class PropertyService
{
    private readonly RebracoDbContext _db;
    private readonly ILogger<PropertyService> _logger;

    public PropertyService(RebracoDbContext db, ILogger<PropertyService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Property> CreateAsync(CreatePropertyDto dto)
    {
        var slug = SlugHelper.Generate(dto.Name);
        slug = await SlugHelper.EnsureUniqueAsync(_db, slug);

        var property = new Property
        {
            Name = dto.Name,
            Slug = slug,
            Street = dto.Street,
            City = dto.City,
            State = dto.State,
            Zip = dto.Zip,
            Type = dto.Type,
            Description = dto.Description,
            TotalUnits = dto.TotalUnits,
            FeaturedImageUrl = dto.FeaturedImageUrl,
            CampusProximity = dto.CampusProximity,
            ByuApproved = dto.ByuApproved,
            GenderRestriction = dto.GenderRestriction,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone,
            IsPublished = dto.IsPublished,
            PricingPeriod = dto.PricingPeriod,
            StartingRent = dto.StartingRent,
            BuildingAmenities = dto.BuildingAmenities,
            MetaTitle = dto.MetaTitle,
            MetaDescription = dto.MetaDescription,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.Properties.Add(property);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Property #{Id} '{Name}' created (slug: {Slug})", property.Id, property.Name, property.Slug);
        return property;
    }

    public async Task<(List<Property> Items, int Total)> GetAllAsync(PropertyFilterDto filter)
    {
        var query = _db.Properties.AsNoTracking().AsQueryable();

        if (filter.Type.HasValue)
            query = query.Where(p => p.Type == filter.Type.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(search) ||
                (p.City != null && p.City.ToLower().Contains(search)) ||
                (p.Street != null && p.Street.ToLower().Contains(search)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(p => p.Name)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    public async Task<Property?> GetByIdAsync(int id)
    {
        return await _db.Properties
            .Include(p => p.Units.OrderBy(u => u.UnitNumber))
            .Include(p => p.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<int> GetInquiryCountAsync(int propertyId)
    {
        var idString = propertyId.ToString();
        return await _db.Inquiries.CountAsync(i => i.PropertyId == idString);
    }

    public async Task<Property?> UpdateAsync(int id, UpdatePropertyDto dto)
    {
        var property = await _db.Properties.FindAsync(id);
        if (property == null) return null;

        if (dto.Name != null)
        {
            property.Name = dto.Name;
            // Regenerate slug if name changed
            var slug = SlugHelper.Generate(dto.Name);
            property.Slug = await SlugHelper.EnsureUniqueAsync(_db, slug, id);
        }
        if (dto.Slug != null)
        {
            // Manual slug override
            property.Slug = await SlugHelper.EnsureUniqueAsync(_db, dto.Slug, id);
        }
        if (dto.Street != null) property.Street = dto.Street;
        if (dto.City != null) property.City = dto.City;
        if (dto.State != null) property.State = dto.State;
        if (dto.Zip != null) property.Zip = dto.Zip;
        if (dto.Type.HasValue) property.Type = dto.Type.Value;
        if (dto.Description != null) property.Description = dto.Description;
        if (dto.TotalUnits.HasValue) property.TotalUnits = dto.TotalUnits.Value;
        if (dto.FeaturedImageUrl != null) property.FeaturedImageUrl = dto.FeaturedImageUrl;
        if (dto.CampusProximity != null) property.CampusProximity = dto.CampusProximity;
        if (dto.ByuApproved.HasValue) property.ByuApproved = dto.ByuApproved.Value;
        if (dto.GenderRestriction.HasValue) property.GenderRestriction = dto.GenderRestriction.Value;
        if (dto.ContactEmail != null) property.ContactEmail = dto.ContactEmail;
        if (dto.ContactPhone != null) property.ContactPhone = dto.ContactPhone;
        if (dto.IsPublished.HasValue) property.IsPublished = dto.IsPublished.Value;
        if (dto.PricingPeriod.HasValue) property.PricingPeriod = dto.PricingPeriod.Value;
        if (dto.StartingRent.HasValue) property.StartingRent = dto.StartingRent.Value;
        if (dto.BuildingAmenities != null) property.BuildingAmenities = dto.BuildingAmenities;
        if (dto.MetaTitle != null) property.MetaTitle = dto.MetaTitle;
        if (dto.MetaDescription != null) property.MetaDescription = dto.MetaDescription;

        property.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Property #{Id} updated", id);
        return property;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var property = await _db.Properties
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null) return false;
        if (property.Units.Any()) return false; // Cannot delete property with units

        _db.Properties.Remove(property);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Property #{Id} deleted", id);
        return true;
    }
}

// --- DTOs ---

public record CreatePropertyDto
{
    public required string Name { get; init; }
    public string? Street { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Zip { get; init; }
    public PropertyType Type { get; init; } = PropertyType.Apartment;
    public string? Description { get; init; }
    public int TotalUnits { get; init; }
    // New public-facing fields
    public string? FeaturedImageUrl { get; init; }
    public string? CampusProximity { get; init; }
    public bool ByuApproved { get; init; }
    public GenderRestriction? GenderRestriction { get; init; }
    public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public bool IsPublished { get; init; }
    public PricingPeriod PricingPeriod { get; init; } = PricingPeriod.Monthly;
    public decimal? StartingRent { get; init; }
    public string? BuildingAmenities { get; init; }
    public string? MetaTitle { get; init; }
    public string? MetaDescription { get; init; }
}

public record UpdatePropertyDto
{
    public string? Name { get; init; }
    public string? Slug { get; init; }
    public string? Street { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? Zip { get; init; }
    public PropertyType? Type { get; init; }
    public string? Description { get; init; }
    public int? TotalUnits { get; init; }
    // New public-facing fields
    public string? FeaturedImageUrl { get; init; }
    public string? CampusProximity { get; init; }
    public bool? ByuApproved { get; init; }
    public GenderRestriction? GenderRestriction { get; init; }
    public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public bool? IsPublished { get; init; }
    public PricingPeriod? PricingPeriod { get; init; }
    public decimal? StartingRent { get; init; }
    public string? BuildingAmenities { get; init; }
    public string? MetaTitle { get; init; }
    public string? MetaDescription { get; init; }
}

public record PropertyFilterDto
{
    public PropertyType? Type { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}
