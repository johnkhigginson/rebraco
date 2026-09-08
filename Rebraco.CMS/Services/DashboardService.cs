using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

public class DashboardService
{
    private readonly RebracoDbContext _db;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(RebracoDbContext db, ILogger<DashboardService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<DashboardSummary> GetSummaryAsync()
    {
        var today = DateTime.UtcNow.Date;
        var thirtyDaysOut = today.AddDays(30);

        // Counts
        var propertyCount = await _db.Properties.CountAsync();
        var unitCount = await _db.Units.CountAsync();
        var activeTenantCount = await _db.Tenants.CountAsync(t => t.Status == TenantStatus.Active);
        var activeLeaseCount = await _db.Leases.CountAsync(l => l.Status == LeaseStatus.Active);

        // Unit status breakdown
        var unitGroups = await _db.Units
            .GroupBy(u => u.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var unitsByStatus = new StatusCounts
        {
            Available = unitGroups.FirstOrDefault(g => g.Status == UnitStatus.Available)?.Count ?? 0,
            Occupied = unitGroups.FirstOrDefault(g => g.Status == UnitStatus.Occupied)?.Count ?? 0,
            Maintenance = unitGroups.FirstOrDefault(g => g.Status == UnitStatus.Maintenance)?.Count ?? 0,
            Offline = unitGroups.FirstOrDefault(g => g.Status == UnitStatus.Offline)?.Count ?? 0,
        };

        // Open maintenance by priority
        var maintGroups = await _db.MaintenanceRequests
            .Where(m => m.Status == MaintenanceStatus.Open || m.Status == MaintenanceStatus.InProgress)
            .GroupBy(m => m.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync();

        var openMaintenanceCount = maintGroups.Sum(g => g.Count);

        var maintenanceByPriority = new PriorityCounts
        {
            Low = maintGroups.FirstOrDefault(g => g.Priority == MaintenancePriority.Low)?.Count ?? 0,
            Medium = maintGroups.FirstOrDefault(g => g.Priority == MaintenancePriority.Medium)?.Count ?? 0,
            High = maintGroups.FirstOrDefault(g => g.Priority == MaintenancePriority.High)?.Count ?? 0,
            Emergency = maintGroups.FirstOrDefault(g => g.Priority == MaintenancePriority.Emergency)?.Count ?? 0,
        };

        // Revenue: total monthly rent from active leases
        var totalMonthlyRevenue = await _db.Leases
            .Where(l => l.Status == LeaseStatus.Active)
            .SumAsync(l => (decimal?)l.MonthlyRent) ?? 0m;

        // Vacancy cost: available units × their listed monthly rent
        var vacancyCost = await _db.Units
            .Where(u => u.Status == UnitStatus.Available)
            .SumAsync(u => (decimal?)u.MonthlyRent) ?? 0m;

        // Maintenance costs: estimated total for open/in-progress, and actual total for completed this month
        var maintenanceEstimated = await _db.MaintenanceRequests
            .Where(m => m.Status == MaintenanceStatus.Open || m.Status == MaintenanceStatus.InProgress)
            .SumAsync(m => (decimal?)m.EstimatedCost) ?? 0m;

        var firstOfMonth = new DateTimeOffset(today.Year, today.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var maintenanceActual = await _db.MaintenanceRequests
            .Where(m => m.Status == MaintenanceStatus.Completed && m.UpdatedAt >= firstOfMonth)
            .SumAsync(m => (decimal?)m.ActualCost) ?? 0m;

        // Expiring leases (active leases ending within 30 days)
        var expiringLeases = await _db.Leases
            .Where(l => l.Status == LeaseStatus.Active && l.EndDate <= thirtyDaysOut)
            .OrderBy(l => l.EndDate)
            .Take(10)
            .Select(l => new ExpiringLease
            {
                Id = l.Id,
                TenantName = l.Tenant.FirstName + " " + l.Tenant.LastName,
                UnitNumber = l.Unit.UnitNumber,
                PropertyName = l.Unit.Property.Name,
                EndDate = l.EndDate,
                MonthlyRent = l.MonthlyRent,
            })
            .ToListAsync();

        // Recent inquiries
        var recentInquiries = await _db.Inquiries
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new RecentInquiry
            {
                Id = i.Id,
                FullName = i.FullName,
                PropertyName = i.PropertyName,
                Status = i.Status.ToString(),
                CreatedAt = i.CreatedAt.UtcDateTime,
            })
            .ToListAsync();

        return new DashboardSummary
        {
            PropertyCount = propertyCount,
            UnitCount = unitCount,
            OccupiedUnitCount = unitsByStatus.Occupied,
            ActiveTenantCount = activeTenantCount,
            ActiveLeaseCount = activeLeaseCount,
            OpenMaintenanceCount = openMaintenanceCount,
            TotalMonthlyRevenue = totalMonthlyRevenue,
            VacancyCost = vacancyCost,
            MaintenanceEstimated = maintenanceEstimated,
            MaintenanceActualThisMonth = maintenanceActual,
            UnitsByStatus = unitsByStatus,
            MaintenanceByPriority = maintenanceByPriority,
            ExpiringLeases = expiringLeases,
            RecentInquiries = recentInquiries,
        };
    }
}

// --- DTOs ---

public record DashboardSummary
{
    public int PropertyCount { get; init; }
    public int UnitCount { get; init; }
    public int OccupiedUnitCount { get; init; }
    public int ActiveTenantCount { get; init; }
    public int ActiveLeaseCount { get; init; }
    public int OpenMaintenanceCount { get; init; }
    public decimal TotalMonthlyRevenue { get; init; }
    public decimal VacancyCost { get; init; }
    public decimal MaintenanceEstimated { get; init; }
    public decimal MaintenanceActualThisMonth { get; init; }
    public StatusCounts UnitsByStatus { get; init; } = new();
    public PriorityCounts MaintenanceByPriority { get; init; } = new();
    public List<ExpiringLease> ExpiringLeases { get; init; } = [];
    public List<RecentInquiry> RecentInquiries { get; init; } = [];
}

public record StatusCounts
{
    public int Available { get; init; }
    public int Occupied { get; init; }
    public int Maintenance { get; init; }
    public int Offline { get; init; }
}

public record PriorityCounts
{
    public int Low { get; init; }
    public int Medium { get; init; }
    public int High { get; init; }
    public int Emergency { get; init; }
}

public record ExpiringLease
{
    public int Id { get; init; }
    public string TenantName { get; init; } = "";
    public string UnitNumber { get; init; } = "";
    public string PropertyName { get; init; } = "";
    public DateTime EndDate { get; init; }
    public decimal MonthlyRent { get; init; }
}

public record RecentInquiry
{
    public int Id { get; init; }
    public string FullName { get; init; } = "";
    public string? PropertyName { get; init; }
    public string Status { get; init; } = "";
    public DateTime CreatedAt { get; init; }
}
