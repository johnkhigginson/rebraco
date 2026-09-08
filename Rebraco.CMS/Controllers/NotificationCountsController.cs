using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

/// <summary>Badge counts for the management portal sidebar.</summary>
[ApiController]
[Route("api/notifications/counts")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class NotificationCountsController : ControllerBase
{
    private readonly RebracoDbContext _db;

    public NotificationCountsController(RebracoDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetCounts()
    {
        var newInquiries = await _db.Inquiries
            .CountAsync(i => i.Status == InquiryStatus.New);

        var requestedTours = await _db.Tours
            .CountAsync(t => t.Status == TourStatus.Requested);

        var openMaintenance = await _db.MaintenanceRequests
            .CountAsync(m => m.Status == MaintenanceStatus.Open);

        var newApplications = await _db.Applications
            .CountAsync(a => a.Status == ApplicationStatus.Submitted);

        var overdueInvoices = await _db.Invoices
            .CountAsync(inv => inv.Status == InvoiceStatus.Overdue);

        return Ok(new
        {
            newInquiries,
            requestedTours,
            openMaintenance,
            newApplications,
            overdueInvoices,
        });
    }
}

/// <summary>Badge counts for the tenant portal sidebar.</summary>
[ApiController]
[Route("api/portal/notifications/counts")]
[UmbracoMemberAuthorize("", "Tenant", "")]
public class PortalNotificationCountsController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly IMemberManager _memberManager;

    public PortalNotificationCountsController(RebracoDbContext db, IMemberManager memberManager)
    {
        _db = db;
        _memberManager = memberManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetCounts()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        var memberKey = member.Key;

        // Find tenant by member key
        var tenant = await _db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.MemberKey == memberKey);

        if (tenant == null)
            return Ok(new { unpaidInvoices = 0, openMaintenance = 0, upcomingTours = 0 });

        var unpaidInvoices = await _db.Invoices
            .CountAsync(i => i.TenantId == tenant.Id
                && (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue));

        var openMaintenance = await _db.MaintenanceRequests
            .CountAsync(m => m.TenantId == tenant.Id
                && (m.Status == MaintenanceStatus.Open || m.Status == MaintenanceStatus.InProgress));

        var upcomingTours = await _db.Tours
            .CountAsync(t => t.ProspectMemberKey == memberKey
                && (t.Status == TourStatus.Requested || t.Status == TourStatus.Confirmed)
                && t.ScheduledDate >= DateTime.UtcNow.Date);

        return Ok(new
        {
            unpaidInvoices,
            openMaintenance,
            upcomingTours,
        });
    }
}
