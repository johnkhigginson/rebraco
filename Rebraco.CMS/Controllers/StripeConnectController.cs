using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;
using Rebraco.CMS.Services;
using Umbraco.Cms.Web.Common.Filters;

namespace Rebraco.CMS.Controllers;

[ApiController]
[Route("api/stripe")]
[UmbracoMemberAuthorize("", "PropertyManager", "")]
public class StripeConnectController : ControllerBase
{
    private readonly RebracoDbContext _db;
    private readonly IStripeConfigService _stripeConfig;
    private readonly IConfiguration _config;
    private readonly ILogger<StripeConnectController> _logger;

    public StripeConnectController(
        RebracoDbContext db,
        IStripeConfigService stripeConfig,
        IConfiguration config,
        ILogger<StripeConnectController> logger)
    {
        _db = db;
        _stripeConfig = stripeConfig;
        _config = config;
        _logger = logger;
    }

    /// <summary>Get current Stripe configuration status.</summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var mode = await _stripeConfig.GetModeAsync();
        var connectedAccountId = await _stripeConfig.GetConnectedAccountIdAsync();

        var hasDirectKeys = await _db.AppSettings
            .AnyAsync(s => s.Key == "stripe:secretKey");

        return Ok(new
        {
            Mode = mode.ToString(),
            ConnectedAccountId = connectedAccountId,
            HasDirectKeys = hasDirectKeys,
        });
    }

    /// <summary>Generate Stripe Connect OAuth URL for onboarding.</summary>
    [HttpGet("connect-url")]
    public IActionResult GetConnectUrl()
    {
        var clientId = _stripeConfig.GetConnectClientId();
        if (string.IsNullOrEmpty(clientId))
            return BadRequest(new { error = "Stripe Connect is not configured on this platform." });

        var redirectUri = $"{Request.Scheme}://{Request.Host}/api/stripe/connect-callback";

        var url = $"https://connect.stripe.com/oauth/authorize" +
                  $"?response_type=code" +
                  $"&client_id={Uri.EscapeDataString(clientId)}" +
                  $"&scope=read_write" +
                  $"&redirect_uri={Uri.EscapeDataString(redirectUri)}";

        return Ok(new { url });
    }

    /// <summary>OAuth callback — exchanges code for connected account ID.</summary>
    [HttpGet("connect-callback")]
    [AllowAnonymous]
    public async Task<IActionResult> ConnectCallback([FromQuery] string? code, [FromQuery] string? error)
    {
        if (!string.IsNullOrEmpty(error))
        {
            _logger.LogWarning("Rebraco: Stripe Connect OAuth error: {Error}", error);
            return Redirect("/manage/settings?stripe=error");
        }

        if (string.IsNullOrEmpty(code))
            return Redirect("/manage/settings?stripe=error");

        try
        {
            var platformSecretKey = _config["Stripe:PlatformSecretKey"];
            if (string.IsNullOrEmpty(platformSecretKey))
                return Redirect("/manage/settings?stripe=error");

            // Exchange the authorization code for a connected account ID
            using var httpClient = new HttpClient();
            var tokenResponse = await httpClient.PostAsync(
                "https://connect.stripe.com/oauth/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    ["client_secret"] = platformSecretKey,
                    ["code"] = code,
                    ["grant_type"] = "authorization_code",
                }));

            var json = await tokenResponse.Content.ReadAsStringAsync();

            if (!tokenResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("Rebraco: Stripe Connect token exchange failed: {Response}", json);
                return Redirect("/manage/settings?stripe=error");
            }

            var tokenData = JsonSerializer.Deserialize<JsonElement>(json);
            var stripeUserId = tokenData.GetProperty("stripe_user_id").GetString();

            if (string.IsNullOrEmpty(stripeUserId))
                return Redirect("/manage/settings?stripe=error");

            // Store connected account ID
            await UpsertSettingAsync("stripe:connectAccountId", stripeUserId);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Rebraco: Stripe Connect account {AccountId} linked successfully",
                stripeUserId);

            return Redirect("/manage/settings?stripe=connected");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Failed to complete Stripe Connect OAuth");
            return Redirect("/manage/settings?stripe=error");
        }
    }

    /// <summary>Disconnect Stripe Connect account.</summary>
    [HttpDelete("disconnect")]
    public async Task<IActionResult> Disconnect()
    {
        var setting = await _db.AppSettings.FindAsync("stripe:connectAccountId");
        if (setting != null)
        {
            _db.AppSettings.Remove(setting);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Rebraco: Stripe Connect account disconnected");
        }

        return Ok(new { success = true });
    }

    private async Task UpsertSettingAsync(string key, string value)
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
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }
    }
}
