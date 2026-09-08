using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class PublicPropertyService
{
    private readonly RebracoDbContext _db;

    public PublicPropertyService(RebracoDbContext db)
    {
        _db = db;
    }

    public async Task<(List<PublicPropertySummaryDto> Items, int Total)> GetPublishedPropertiesAsync(
        PublicPropertyFilterDto filter)
    {
        var query = _db.Properties.AsNoTracking()
            .Where(p => p.IsPublished);

        if (!string.IsNullOrWhiteSpace(filter.Type))
        {
            if (Enum.TryParse<PropertyType>(filter.Type, true, out var pt))
                query = query.Where(p => p.Type == pt);
        }

        if (!string.IsNullOrWhiteSpace(filter.Gender))
        {
            if (Enum.TryParse<GenderRestriction>(filter.Gender, true, out var gr))
                query = query.Where(p => p.GenderRestriction == gr);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var s = filter.Search.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(s) ||
                (p.City != null && p.City.ToLower().Contains(s)) ||
                (p.Street != null && p.Street.ToLower().Contains(s)) ||
                (p.BuildingAmenities != null && p.BuildingAmenities.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();

        // Apply sort
        query = filter.Sort switch
        {
            "price-asc" => query.OrderBy(p => p.StartingRent ?? decimal.MaxValue),
            "price-desc" => query.OrderByDescending(p => p.StartingRent ?? 0),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            _ => query.OrderBy(p => p.Name),
        };

        var properties = await query
            .Skip(filter.Skip)
            .Take(filter.Take)
            .Select(p => new
            {
                Property = p,
                AvailableUnits = p.Units.Count(u => u.Status == UnitStatus.Available && u.IsPublished),
                MinRent = p.Units
                    .Where(u => u.Status == UnitStatus.Available && u.IsPublished)
                    .Select(u => (decimal?)u.MonthlyRent)
                    .Min(),
            })
            .ToListAsync();

        var items = properties.Select(x => MapToSummary(x.Property, x.AvailableUnits, x.MinRent)).ToList();

        return (items, total);
    }

    public async Task<PublicPropertyDetailDto?> GetBySlugAsync(string slug)
    {
        var data = await _db.Properties.AsNoTracking()
            .Where(p => p.IsPublished && p.Slug == slug)
            .Select(p => new
            {
                Property = p,
                Images = p.Images.OrderBy(i => i.SortOrder).ToList(),
                AvailableUnits = p.Units.Count(u => u.Status == UnitStatus.Available && u.IsPublished),
                MinRent = p.Units
                    .Where(u => u.Status == UnitStatus.Available && u.IsPublished)
                    .Select(u => (decimal?)u.MonthlyRent)
                    .Min(),
                Units = p.Units
                    .Where(u => u.IsPublished)
                    .OrderBy(u => u.UnitNumber)
                    .ToList(),
            })
            .FirstOrDefaultAsync();

        if (data == null) return null;

        var summary = MapToSummary(data.Property, data.AvailableUnits, data.MinRent);

        return new PublicPropertyDetailDto
        {
            Id = summary.Id,
            Name = summary.Name,
            Slug = summary.Slug,
            PropertyType = summary.PropertyType,
            Address = summary.Address,
            City = summary.City,
            State = summary.State,
            Zip = summary.Zip,
            FeaturedImageUrl = summary.FeaturedImageUrl,
            StartingRent = summary.StartingRent,
            PricingPeriod = summary.PricingPeriod,
            AvailableUnits = summary.AvailableUnits,
            TotalUnits = summary.TotalUnits,
            CampusProximity = summary.CampusProximity,
            ByuApproved = summary.ByuApproved,
            GenderRestriction = summary.GenderRestriction,
            BuildingAmenities = summary.BuildingAmenities,
            Description = data.Property.Description,
            Images = data.Images.Select(i => new PublicImageDto { Url = i.Url, Alt = i.Alt }).ToList(),
            ContactEmail = data.Property.ContactEmail,
            ContactPhone = data.Property.ContactPhone,
            MetaTitle = data.Property.MetaTitle,
            MetaDescription = data.Property.MetaDescription,
            Units = data.Units.Select(MapUnitToSummary).ToList(),
        };
    }

    public async Task<PublicUnitDetailDto?> GetUnitByIdAsync(int unitId)
    {
        var unit = await _db.Units.AsNoTracking()
            .Include(u => u.Property)
            .Include(u => u.Images.OrderBy(i => i.SortOrder))
            .Where(u => u.IsPublished && u.Property.IsPublished && u.Id == unitId)
            .FirstOrDefaultAsync();

        if (unit == null) return null;

        var summary = MapUnitToSummary(unit);

        return new PublicUnitDetailDto
        {
            Id = summary.Id,
            UnitNumber = summary.UnitNumber,
            Bedrooms = summary.Bedrooms,
            Bathrooms = summary.Bathrooms,
            SquareFeet = summary.SquareFeet,
            Rent = summary.Rent,
            PricingModel = summary.PricingModel,
            PricingPeriod = summary.PricingPeriod,
            BedPrice = summary.BedPrice,
            TotalBeds = summary.TotalBeds,
            AvailableBeds = summary.AvailableBeds,
            FeaturedImageUrl = summary.FeaturedImageUrl,
            AvailableDate = summary.AvailableDate,
            Furnished = summary.Furnished,
            PetsAllowed = summary.PetsAllowed,
            UtilitiesIncluded = summary.UtilitiesIncluded,
            ParkingIncluded = unit.ParkingIncluded,
            GenderRestriction = summary.GenderRestriction,
            SemesterAvailability = summary.SemesterAvailability,
            LeaseTerms = summary.LeaseTerms,
            Description = unit.Description,
            Features = SplitTags(unit.Features),
            Deposit = unit.Deposit,
            Images = unit.Images
                .Where(i => !i.IsFloorPlan)
                .Select(i => new PublicImageDto { Url = i.Url, Alt = i.Alt })
                .ToList(),
            FloorPlanImages = unit.Images
                .Where(i => i.IsFloorPlan)
                .Select(i => new PublicImageDto { Url = i.Url, Alt = i.Alt })
                .ToList(),
            PropertyName = unit.Property.Name,
            PropertySlug = unit.Property.Slug,
        };
    }

    // ── Mapping helpers ──────────────────────────────────────────────

    private static PublicPropertySummaryDto MapToSummary(Property p, int availableUnits, decimal? minRent)
    {
        return new PublicPropertySummaryDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            PropertyType = MapPropertyType(p.Type),
            Address = p.Street ?? "",
            City = p.City ?? "",
            State = p.State ?? "",
            Zip = p.Zip ?? "",
            FeaturedImageUrl = p.FeaturedImageUrl,
            StartingRent = p.StartingRent ?? minRent,
            PricingPeriod = p.PricingPeriod.ToString().ToLowerInvariant(),
            AvailableUnits = availableUnits,
            TotalUnits = p.TotalUnits,
            CampusProximity = p.CampusProximity,
            ByuApproved = p.ByuApproved,
            GenderRestriction = p.GenderRestriction?.ToString().ToLowerInvariant(),
            BuildingAmenities = SplitTags(p.BuildingAmenities),
        };
    }

    private static PublicUnitSummaryDto MapUnitToSummary(Unit u)
    {
        return new PublicUnitSummaryDto
        {
            Id = u.Id,
            UnitNumber = u.UnitNumber,
            Bedrooms = u.Bedrooms,
            Bathrooms = u.Bathrooms,
            SquareFeet = u.SqFt,
            Rent = u.MonthlyRent,
            PricingModel = u.PricingModel.ToString().ToLowerInvariant(),
            PricingPeriod = u.PricingPeriod.ToString().ToLowerInvariant(),
            BedPrice = u.BedPrice,
            TotalBeds = u.PricingModel == Models.PricingModel.PerBed ? u.Capacity : null,
            AvailableBeds = null, // Computed from active leases if needed
            FeaturedImageUrl = u.FeaturedImageUrl,
            AvailableDate = u.AvailableDate?.ToString("yyyy-MM-dd"),
            Furnished = u.Furnished,
            PetsAllowed = u.PetsAllowed,
            UtilitiesIncluded = u.UtilitiesIncluded,
            GenderRestriction = u.GenderRestriction?.ToString().ToLowerInvariant(),
            SemesterAvailability = SplitTags(u.SemesterAvailability),
            LeaseTerms = SplitTags(u.LeaseTerms),
        };
    }

    private static string MapPropertyType(PropertyType type) => type switch
    {
        PropertyType.Apartment => "apartment-complex",
        PropertyType.Dorm => "dorm",
        PropertyType.House => "house",
        PropertyType.Townhome => "townhouse",
        PropertyType.Commercial => "commercial",
        _ => type.ToString().ToLowerInvariant(),
    };

    private static string[] SplitTags(string? csv) =>
        string.IsNullOrWhiteSpace(csv) ? [] : csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

// ── DTOs ─────────────────────────────────────────────────────────────

public record PublicPropertyFilterDto
{
    public string? Type { get; init; }
    public string? Gender { get; init; }
    public string? Search { get; init; }
    public string? Sort { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 24;
}

public record PublicPropertySummaryDto
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string Slug { get; init; } = "";
    public string PropertyType { get; init; } = "";
    public string Address { get; init; } = "";
    public string City { get; init; } = "";
    public string State { get; init; } = "";
    public string Zip { get; init; } = "";
    public string? FeaturedImageUrl { get; init; }
    public decimal? StartingRent { get; init; }
    public string PricingPeriod { get; init; } = "monthly";
    public int AvailableUnits { get; init; }
    public int TotalUnits { get; init; }
    public string? CampusProximity { get; init; }
    public bool ByuApproved { get; init; }
    public string? GenderRestriction { get; init; }
    public string[] BuildingAmenities { get; init; } = [];
}

public record PublicPropertyDetailDto : PublicPropertySummaryDto
{
    public string? Description { get; init; }
    public List<PublicImageDto> Images { get; init; } = [];
    public string? ContactEmail { get; init; }
    public string? ContactPhone { get; init; }
    public string? MetaTitle { get; init; }
    public string? MetaDescription { get; init; }
    public List<PublicUnitSummaryDto> Units { get; init; } = [];
}

public record PublicUnitSummaryDto
{
    public int Id { get; init; }
    public string UnitNumber { get; init; } = "";
    public int Bedrooms { get; init; }
    public int Bathrooms { get; init; }
    public int? SquareFeet { get; init; }
    public decimal Rent { get; init; }
    public string PricingModel { get; init; } = "wholeunit";
    public string PricingPeriod { get; init; } = "monthly";
    public decimal? BedPrice { get; init; }
    public int? TotalBeds { get; init; }
    public int? AvailableBeds { get; init; }
    public string? FeaturedImageUrl { get; init; }
    public string? AvailableDate { get; init; }
    public bool Furnished { get; init; }
    public bool PetsAllowed { get; init; }
    public bool UtilitiesIncluded { get; init; }
    public string? GenderRestriction { get; init; }
    public string[] SemesterAvailability { get; init; } = [];
    public string[] LeaseTerms { get; init; } = [];
}

public record PublicUnitDetailDto : PublicUnitSummaryDto
{
    public bool ParkingIncluded { get; init; }
    public string? Description { get; init; }
    public string[] Features { get; init; } = [];
    public decimal? Deposit { get; init; }
    public List<PublicImageDto> Images { get; init; } = [];
    public List<PublicImageDto> FloorPlanImages { get; init; } = [];
    public string PropertyName { get; init; } = "";
    public string PropertySlug { get; init; } = "";
}

public record PublicImageDto
{
    public string Url { get; init; } = "";
    public string? Alt { get; init; }
}
