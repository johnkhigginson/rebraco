using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class UnitService
{
    private readonly RebracoDbContext _db;
    private readonly ILogger<UnitService> _logger;

    public UnitService(RebracoDbContext db, ILogger<UnitService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<Unit?> CreateAsync(int propertyId, CreateUnitDto dto)
    {
        var property = await _db.Properties.FindAsync(propertyId);
        if (property == null) return null;

        var unit = new Unit
        {
            PropertyId = propertyId,
            UnitNumber = dto.UnitNumber,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            SqFt = dto.SqFt,
            Capacity = dto.Capacity,
            MonthlyRent = dto.MonthlyRent,
            FloorPlan = dto.FloorPlan,
            Status = dto.Status,
            Description = dto.Description,
            Furnished = dto.Furnished,
            PetsAllowed = dto.PetsAllowed,
            ParkingIncluded = dto.ParkingIncluded,
            UtilitiesIncluded = dto.UtilitiesIncluded,
            GenderRestriction = dto.GenderRestriction,
            AvailableDate = dto.AvailableDate,
            PricingModel = dto.PricingModel,
            PricingPeriod = dto.PricingPeriod,
            BedPrice = dto.BedPrice,
            Deposit = dto.Deposit,
            FeaturedImageUrl = dto.FeaturedImageUrl,
            Features = dto.Features,
            SemesterAvailability = dto.SemesterAvailability,
            LeaseTerms = dto.LeaseTerms,
            IsPublished = dto.IsPublished,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        _db.Units.Add(unit);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Unit #{Id} '{Number}' created for Property #{PropId}",
            unit.Id, unit.UnitNumber, propertyId);
        return unit;
    }

    public async Task<(List<Unit> Items, int Total)> GetAllByPropertyAsync(int propertyId, UnitFilterDto filter)
    {
        var query = _db.Units.AsNoTracking()
            .Where(u => u.PropertyId == propertyId);

        if (filter.Status.HasValue)
            query = query.Where(u => u.Status == filter.Status.Value);

        if (!string.IsNullOrWhiteSpace(filter.FloorPlan))
            query = query.Where(u => u.FloorPlan == filter.FloorPlan);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(u =>
                u.UnitNumber.ToLower().Contains(search) ||
                (u.FloorPlan != null && u.FloorPlan.ToLower().Contains(search)));
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(u => u.UnitNumber)
            .Skip(filter.Skip)
            .Take(filter.Take)
            .ToListAsync();

        return (items, total);
    }

    /// <summary>Flat list of all units (for dropdowns in lease/maintenance forms).</summary>
    public async Task<List<Unit>> GetAllAsync()
    {
        return await _db.Units.AsNoTracking()
            .Include(u => u.Property)
            .OrderBy(u => u.Property.Name)
            .ThenBy(u => u.UnitNumber)
            .ToListAsync();
    }

    public async Task<Unit?> GetByIdAsync(int id)
    {
        return await _db.Units
            .Include(u => u.Property)
            .Include(u => u.Images.OrderBy(i => i.SortOrder))
            .Include(u => u.Leases.OrderByDescending(l => l.StartDate))
                .ThenInclude(l => l.Tenant)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<Unit?> UpdateAsync(int id, UpdateUnitDto dto)
    {
        var unit = await _db.Units.FindAsync(id);
        if (unit == null) return null;

        if (dto.UnitNumber != null) unit.UnitNumber = dto.UnitNumber;
        if (dto.Bedrooms.HasValue) unit.Bedrooms = dto.Bedrooms.Value;
        if (dto.Bathrooms.HasValue) unit.Bathrooms = dto.Bathrooms.Value;
        if (dto.SqFt.HasValue) unit.SqFt = dto.SqFt.Value;
        if (dto.Capacity.HasValue) unit.Capacity = dto.Capacity.Value;
        if (dto.MonthlyRent.HasValue) unit.MonthlyRent = dto.MonthlyRent.Value;
        if (dto.FloorPlan != null) unit.FloorPlan = dto.FloorPlan;
        if (dto.Status.HasValue) unit.Status = dto.Status.Value;
        if (dto.Description != null) unit.Description = dto.Description;
        if (dto.Furnished.HasValue) unit.Furnished = dto.Furnished.Value;
        if (dto.PetsAllowed.HasValue) unit.PetsAllowed = dto.PetsAllowed.Value;
        if (dto.ParkingIncluded.HasValue) unit.ParkingIncluded = dto.ParkingIncluded.Value;
        if (dto.UtilitiesIncluded.HasValue) unit.UtilitiesIncluded = dto.UtilitiesIncluded.Value;
        if (dto.GenderRestriction.HasValue) unit.GenderRestriction = dto.GenderRestriction.Value;
        if (dto.AvailableDate.HasValue) unit.AvailableDate = dto.AvailableDate.Value;
        if (dto.PricingModel.HasValue) unit.PricingModel = dto.PricingModel.Value;
        if (dto.PricingPeriod.HasValue) unit.PricingPeriod = dto.PricingPeriod.Value;
        if (dto.BedPrice.HasValue) unit.BedPrice = dto.BedPrice.Value;
        if (dto.Deposit.HasValue) unit.Deposit = dto.Deposit.Value;
        if (dto.FeaturedImageUrl != null) unit.FeaturedImageUrl = dto.FeaturedImageUrl;
        if (dto.Features != null) unit.Features = dto.Features;
        if (dto.SemesterAvailability != null) unit.SemesterAvailability = dto.SemesterAvailability;
        if (dto.LeaseTerms != null) unit.LeaseTerms = dto.LeaseTerms;
        if (dto.IsPublished.HasValue) unit.IsPublished = dto.IsPublished.Value;

        unit.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Unit #{Id} updated", id);
        return unit;
    }

    public async Task<Unit?> UpdateStatusAsync(int id, UnitStatus status)
    {
        var unit = await _db.Units.FindAsync(id);
        if (unit == null) return null;

        unit.Status = status;
        unit.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Unit #{Id} status updated to {Status}", id, status);
        return unit;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var unit = await _db.Units
            .Include(u => u.Leases)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (unit == null) return false;
        if (unit.Leases.Any()) return false; // Cannot delete unit with lease history

        _db.Units.Remove(unit);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: Unit #{Id} deleted", id);
        return true;
    }

    public async Task<int> GetActiveLeaseCountAsync(int unitId)
    {
        return await _db.Leases.CountAsync(l => l.UnitId == unitId && l.Status == LeaseStatus.Active);
    }

    public async Task<List<Unit>?> CreateBulkAsync(int propertyId, BulkCreateUnitDto dto)
    {
        var property = await _db.Properties.FindAsync(propertyId);
        if (property == null) return null;

        var now = DateTimeOffset.UtcNow;
        var units = dto.UnitNumbers.Select(number => new Unit
        {
            PropertyId = propertyId,
            UnitNumber = number,
            Bedrooms = dto.Bedrooms,
            Bathrooms = dto.Bathrooms,
            SqFt = dto.SqFt,
            Capacity = dto.Capacity,
            MonthlyRent = dto.MonthlyRent,
            FloorPlan = dto.FloorPlan,
            Status = dto.Status,
            Description = dto.Description,
            Furnished = dto.Furnished,
            PetsAllowed = dto.PetsAllowed,
            ParkingIncluded = dto.ParkingIncluded,
            UtilitiesIncluded = dto.UtilitiesIncluded,
            GenderRestriction = dto.GenderRestriction,
            AvailableDate = dto.AvailableDate,
            PricingModel = dto.PricingModel,
            PricingPeriod = dto.PricingPeriod,
            BedPrice = dto.BedPrice,
            Deposit = dto.Deposit,
            FeaturedImageUrl = dto.FeaturedImageUrl,
            Features = dto.Features,
            SemesterAvailability = dto.SemesterAvailability,
            LeaseTerms = dto.LeaseTerms,
            IsPublished = dto.IsPublished,
            CreatedAt = now,
            UpdatedAt = now,
        }).ToList();

        _db.Units.AddRange(units);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Rebraco: {Count} units bulk-created for Property #{PropId}",
            units.Count, propertyId);
        return units;
    }
}

// --- DTOs ---

public record CreateUnitDto
{
    public required string UnitNumber { get; init; }
    public int Bedrooms { get; init; }
    public int Bathrooms { get; init; }
    public int? SqFt { get; init; }
    public int Capacity { get; init; } = 1;
    public decimal MonthlyRent { get; init; }
    public string? FloorPlan { get; init; }
    public UnitStatus Status { get; init; } = UnitStatus.Available;
    public string? Description { get; init; }
    // Public-facing fields
    public bool Furnished { get; init; }
    public bool PetsAllowed { get; init; }
    public bool ParkingIncluded { get; init; }
    public bool UtilitiesIncluded { get; init; }
    public GenderRestriction? GenderRestriction { get; init; }
    public DateTime? AvailableDate { get; init; }
    public PricingModel PricingModel { get; init; } = PricingModel.WholeUnit;
    public PricingPeriod PricingPeriod { get; init; } = PricingPeriod.Monthly;
    public decimal? BedPrice { get; init; }
    public decimal? Deposit { get; init; }
    public string? FeaturedImageUrl { get; init; }
    public string? Features { get; init; }
    public string? SemesterAvailability { get; init; }
    public string? LeaseTerms { get; init; }
    public bool IsPublished { get; init; }
}

public record UpdateUnitDto
{
    public string? UnitNumber { get; init; }
    public int? Bedrooms { get; init; }
    public int? Bathrooms { get; init; }
    public int? SqFt { get; init; }
    public int? Capacity { get; init; }
    public decimal? MonthlyRent { get; init; }
    public string? FloorPlan { get; init; }
    public UnitStatus? Status { get; init; }
    public string? Description { get; init; }
    // Public-facing fields
    public bool? Furnished { get; init; }
    public bool? PetsAllowed { get; init; }
    public bool? ParkingIncluded { get; init; }
    public bool? UtilitiesIncluded { get; init; }
    public GenderRestriction? GenderRestriction { get; init; }
    public DateTime? AvailableDate { get; init; }
    public PricingModel? PricingModel { get; init; }
    public PricingPeriod? PricingPeriod { get; init; }
    public decimal? BedPrice { get; init; }
    public decimal? Deposit { get; init; }
    public string? FeaturedImageUrl { get; init; }
    public string? Features { get; init; }
    public string? SemesterAvailability { get; init; }
    public string? LeaseTerms { get; init; }
    public bool? IsPublished { get; init; }
}

public record BulkCreateUnitDto
{
    public required string[] UnitNumbers { get; init; }
    public int Bedrooms { get; init; }
    public int Bathrooms { get; init; }
    public int? SqFt { get; init; }
    public int Capacity { get; init; } = 1;
    public decimal MonthlyRent { get; init; }
    public string? FloorPlan { get; init; }
    public UnitStatus Status { get; init; } = UnitStatus.Available;
    public string? Description { get; init; }
    public bool Furnished { get; init; }
    public bool PetsAllowed { get; init; }
    public bool ParkingIncluded { get; init; }
    public bool UtilitiesIncluded { get; init; }
    public GenderRestriction? GenderRestriction { get; init; }
    public DateTime? AvailableDate { get; init; }
    public PricingModel PricingModel { get; init; } = PricingModel.WholeUnit;
    public PricingPeriod PricingPeriod { get; init; } = PricingPeriod.Monthly;
    public decimal? BedPrice { get; init; }
    public decimal? Deposit { get; init; }
    public string? FeaturedImageUrl { get; init; }
    public string? Features { get; init; }
    public string? SemesterAvailability { get; init; }
    public string? LeaseTerms { get; init; }
    public bool IsPublished { get; init; }
}

public record UnitFilterDto
{
    public UnitStatus? Status { get; init; }
    public string? FloorPlan { get; init; }
    public string? Search { get; init; }
    public int Skip { get; init; } = 0;
    public int Take { get; init; } = 25;
}
