using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/settings")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class SettingsController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly IMemberManager _memberManager;
    private readonly ApplicationSettingsService _appSettings;
    private readonly RenewalSettingsService _renewalSettings;
    private readonly TourSettingsService _tourSettings;

    public SettingsController(
        RebracoDbContext db,
        IMemberManager memberManager,
        ApplicationSettingsService appSettings,
        RenewalSettingsService renewalSettings,
        TourSettingsService tourSettings)
    {
        _db = db;
        _memberManager = memberManager;
        _appSettings = appSettings;
        _renewalSettings = renewalSettings;
        _tourSettings = tourSettings;
    }

    /// <summary>Get email notification settings.</summary>
    [HttpGet("email")]
    public async Task<IActionResult> GetEmailSettings()
    {
        var keys = new[] { "email:fromEmail", "email:notifyEmail" };
        var settings = await _db.AppSettings
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return Ok(new
        {
            fromEmail = settings.GetValueOrDefault("email:fromEmail", ""),
            notifyEmail = settings.GetValueOrDefault("email:notifyEmail", ""),
        });
    }

    /// <summary>Update email notification settings.</summary>
    [HttpPatch("email")]
    public async Task<IActionResult> UpdateEmailSettings([FromBody] UpdateEmailSettingsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (request.FromEmail != null)
            await UpsertAsync("email:fromEmail", request.FromEmail);
        if (request.NotifyEmail != null)
            await UpsertAsync("email:notifyEmail", request.NotifyEmail);

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ─── Stripe Settings ────────────────────────────────────────

    /// <summary>Get Stripe payment settings (never returns full secret key).</summary>
    [HttpGet("stripe")]
    public async Task<IActionResult> GetStripeSettings()
    {
        var keys = new[] { "stripe:secretKey", "stripe:publishableKey", "stripe:connectAccountId" };
        var settings = await _db.AppSettings
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        var secretKey = settings.GetValueOrDefault("stripe:secretKey", "");
        var maskedSecretKey = secretKey.Length > 8
            ? $"sk_...{secretKey[^4..]}"
            : (secretKey.Length > 0 ? "sk_...****" : "");

        return Ok(new
        {
            publishableKey = settings.GetValueOrDefault("stripe:publishableKey", ""),
            maskedSecretKey,
            hasSecretKey = !string.IsNullOrEmpty(secretKey),
            connectedAccountId = settings.GetValueOrDefault("stripe:connectAccountId", ""),
        });
    }

    /// <summary>Save direct Stripe keys (validates by making a test API call).</summary>
    [HttpPatch("stripe")]
    public async Task<IActionResult> UpdateStripeSettings([FromBody] UpdateStripeSettingsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        // Validate the secret key by making a test API call
        if (!string.IsNullOrWhiteSpace(request.SecretKey))
        {
            try
            {
                var client = new Stripe.StripeClient(request.SecretKey);
                var balanceService = new Stripe.BalanceService(client);
                await balanceService.GetAsync();
            }
            catch
            {
                return BadRequest(new { error = "Invalid Stripe secret key." });
            }

            await UpsertAsync("stripe:secretKey", request.SecretKey);
        }

        if (request.PublishableKey != null)
            await UpsertAsync("stripe:publishableKey", request.PublishableKey);

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    /// <summary>Remove direct Stripe keys.</summary>
    [HttpDelete("stripe")]
    public async Task<IActionResult> DeleteStripeSettings()
    {
        var keys = new[] { "stripe:secretKey", "stripe:publishableKey" };
        var settings = await _db.AppSettings
            .Where(s => keys.Contains(s.Key))
            .ToListAsync();

        _db.AppSettings.RemoveRange(settings);
        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ─── Application Settings ────────────────────────────────────

    /// <summary>Get application form settings (fee, required sections).</summary>
    [HttpGet("application")]
    public async Task<IActionResult> GetApplicationSettings()
    {
        var settings = await _appSettings.GetSettingsAsync();
        return Ok(settings);
    }

    /// <summary>Update application form settings.</summary>
    [HttpPatch("application")]
    public async Task<IActionResult> UpdateApplicationSettings([FromBody] UpdateApplicationSettingsDto request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        await _appSettings.UpdateSettingsAsync(request);
        return Ok(new { success = true });
    }

    // ─── Renewal Settings ──────────────────────────────────────────

    /// <summary>Get renewal workflow settings (auto-detect window, offer expiry).</summary>
    [HttpGet("renewal")]
    public async Task<IActionResult> GetRenewalSettings()
    {
        var settings = await _renewalSettings.GetSettingsAsync();
        return Ok(settings);
    }

    /// <summary>Update renewal workflow settings.</summary>
    [HttpPatch("renewal")]
    public async Task<IActionResult> UpdateRenewalSettings([FromBody] UpdateRenewalSettingsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        await _renewalSettings.UpdateSettingsAsync(new UpdateRenewalSettingsDto
        {
            AutoDetectDays = request.AutoDetectDays,
            OfferExpiryDays = request.OfferExpiryDays,
        });

        return Ok(new { success = true });
    }

    // ─── Tour Settings ──────────────────────────────────────────────

    /// <summary>Get tour scheduling settings.</summary>
    [HttpGet("tour")]
    public async Task<IActionResult> GetTourSettings()
    {
        var settings = await _tourSettings.GetSettingsAsync();
        return Ok(settings);
    }

    /// <summary>Update tour scheduling settings.</summary>
    [HttpPatch("tour")]
    public async Task<IActionResult> UpdateTourSettings([FromBody] UpdateTourSettingsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        await _tourSettings.UpdateSettingsAsync(new UpdateTourSettingsDto
        {
            DefaultSlotDurationMinutes = request.DefaultSlotDurationMinutes,
            MaxAdvanceBookingDays = request.MaxAdvanceBookingDays,
            RequireConfirmation = request.RequireConfirmation,
            ReminderEnabled = request.ReminderEnabled,
        });

        return Ok(new { success = true });
    }

    // ─── Public Pages Settings ────────────────────────────────────

    private static readonly string[] AllowedSlugs = ["properties", "floor-plans", "housing", "availability", "rooms"];

    /// <summary>Get public pages label and URL slug.</summary>
    [HttpGet("public-pages")]
    public async Task<IActionResult> GetPublicPagesSettings()
    {
        var keys = new[] { "public:pagesLabel", "public:pagesSlug" };
        var settings = await _db.AppSettings
            .Where(s => keys.Contains(s.Key))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return Ok(new
        {
            publicPagesLabel = settings.GetValueOrDefault("public:pagesLabel", "Properties"),
            publicPagesSlug = settings.GetValueOrDefault("public:pagesSlug", "properties"),
        });
    }

    /// <summary>Update public pages label and URL slug.</summary>
    [HttpPatch("public-pages")]
    public async Task<IActionResult> UpdatePublicPagesSettings([FromBody] UpdatePublicPagesSettingsRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        if (request.PublicPagesSlug != null && !AllowedSlugs.Contains(request.PublicPagesSlug))
            return BadRequest(new { error = $"Slug must be one of: {string.Join(", ", AllowedSlugs)}" });

        if (request.PublicPagesLabel != null)
            await UpsertAsync("public:pagesLabel", request.PublicPagesLabel);
        if (request.PublicPagesSlug != null)
            await UpsertAsync("public:pagesSlug", request.PublicPagesSlug);

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private async Task UpsertAsync(string key, string value)
    {
        var existing = await _db.AppSettings.FindAsync(key);
        if (existing != null)
        {
            existing.Value = value;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            _db.AppSettings.Add(new AppSetting
            {
                Key = key,
                Value = value,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }
    }
}

public class UpdateEmailSettingsRequest
{
    [MaxLength(254), EmailAddress]
    public string? FromEmail { get; set; }

    [MaxLength(500)]
    public string? NotifyEmail { get; set; }
}

public class UpdateStripeSettingsRequest
{
    [MaxLength(200)]
    public string? SecretKey { get; set; }

    [MaxLength(200)]
    public string? PublishableKey { get; set; }
}

public class UpdateRenewalSettingsRequest
{
    [Range(1, 365)]
    public int? AutoDetectDays { get; set; }

    [Range(1, 365)]
    public int? OfferExpiryDays { get; set; }
}

public class UpdateTourSettingsRequest
{
    [Range(15, 240)]
    public int? DefaultSlotDurationMinutes { get; set; }

    [Range(1, 180)]
    public int? MaxAdvanceBookingDays { get; set; }

    public bool? RequireConfirmation { get; set; }

    public bool? ReminderEnabled { get; set; }
}

public class UpdatePublicPagesSettingsRequest
{
    [MaxLength(100)]
    public string? PublicPagesLabel { get; set; }

    [MaxLength(50)]
    public string? PublicPagesSlug { get; set; }
}
