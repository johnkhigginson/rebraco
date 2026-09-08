using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

// ─── Manager endpoints ──────────────────────────────────────────────

[ApiController]
[Route("api/notification-preferences")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class NotificationPreferencesController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly IMemberManager _memberManager;

    private static readonly string[] ManagerNotificationTypes =
    [
        "inquiry_new",
        "tour_requested",
        "maintenance_submitted",
        "application_received",
        "invoice_overdue",
        "lease_expiring",
        "renewal_response",
    ];

    public NotificationPreferencesController(RebracoDbContext db, IMemberManager memberManager)
    {
        _db = db;
        _memberManager = memberManager;
    }

    /// <summary>Get all notification preferences for the current manager.</summary>
    [HttpGet]
    public async Task<IActionResult> GetPreferences()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        var memberKey = member.Key;
        var saved = await _db.NotificationPreferences
            .AsNoTracking()
            .Where(p => p.MemberKey == memberKey)
            .ToListAsync();

        var result = ManagerNotificationTypes.Select(type =>
        {
            var existing = saved.FirstOrDefault(p => p.NotificationType == type);
            return new NotificationPreferenceDto
            {
                NotificationType = type,
                EmailEnabled = existing?.EmailEnabled ?? true,
            };
        });

        return Ok(new { items = result });
    }

    /// <summary>Bulk update notification preferences for the current manager.</summary>
    [HttpPut]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdateNotificationPreferencesRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        var memberKey = member.Key;
        await NotificationPreferenceUpsert.ExecuteAsync(_db, memberKey, request.Preferences, ManagerNotificationTypes);

        return Ok(new { success = true });
    }
}

// ─── Tenant portal endpoints ────────────────────────────────────────

[ApiController]
[Route("api/portal/notification-preferences")]
[UmbracoMemberAuthorize("", "Tenant", "")]
public class PortalNotificationPreferencesController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly IMemberManager _memberManager;

    private static readonly string[] TenantNotificationTypes =
    [
        "invoice_sent",
        "payment_confirmation",
        "maintenance_update",
        "lease_expiring",
        "renewal_offer",
        "tour_confirmation",
        "tour_reminder",
    ];

    public PortalNotificationPreferencesController(RebracoDbContext db, IMemberManager memberManager)
    {
        _db = db;
        _memberManager = memberManager;
    }

    /// <summary>Get all notification preferences for the current tenant.</summary>
    [HttpGet]
    public async Task<IActionResult> GetPreferences()
    {
        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        var memberKey = member.Key;
        var saved = await _db.NotificationPreferences
            .AsNoTracking()
            .Where(p => p.MemberKey == memberKey)
            .ToListAsync();

        var result = TenantNotificationTypes.Select(type =>
        {
            var existing = saved.FirstOrDefault(p => p.NotificationType == type);
            return new NotificationPreferenceDto
            {
                NotificationType = type,
                EmailEnabled = existing?.EmailEnabled ?? true,
            };
        });

        return Ok(new { items = result });
    }

    /// <summary>Bulk update notification preferences for the current tenant.</summary>
    [HttpPut]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdateNotificationPreferencesRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var member = await _memberManager.GetCurrentMemberAsync();
        if (member == null) return Unauthorized();

        var memberKey = member.Key;
        await NotificationPreferenceUpsert.ExecuteAsync(_db, memberKey, request.Preferences, TenantNotificationTypes);

        return Ok(new { success = true });
    }
}

// ─── Shared upsert logic ────────────────────────────────────────────

internal static class NotificationPreferenceUpsert
{
    internal static async Task ExecuteAsync(
        RebracoDbContext db,
        Guid memberKey,
        List<NotificationPreferenceDto> preferences,
        string[] allowedTypes)
    {
        var now = DateTimeOffset.UtcNow;

        // Only process known notification types
        var validPrefs = preferences
            .Where(p => allowedTypes.Contains(p.NotificationType))
            .ToList();

        var existing = await db.NotificationPreferences
            .Where(p => p.MemberKey == memberKey)
            .ToListAsync();

        foreach (var pref in validPrefs)
        {
            var record = existing.FirstOrDefault(e => e.NotificationType == pref.NotificationType);
            if (record != null)
            {
                record.EmailEnabled = pref.EmailEnabled;
                record.UpdatedAt = now;
            }
            else
            {
                db.NotificationPreferences.Add(new NotificationPreference
                {
                    MemberKey = memberKey,
                    NotificationType = pref.NotificationType,
                    EmailEnabled = pref.EmailEnabled,
                    UpdatedAt = now,
                });
            }
        }

        await db.SaveChangesAsync();
    }
}

// ─── Request / Response DTOs ────────────────────────────────────────

public class NotificationPreferenceDto
{
    [Required, MaxLength(50)]
    public string NotificationType { get; set; } = string.Empty;

    public bool EmailEnabled { get; set; } = true;
}

public class UpdateNotificationPreferencesRequest
{
    [Required]
    public List<NotificationPreferenceDto> Preferences { get; set; } = [];
}
