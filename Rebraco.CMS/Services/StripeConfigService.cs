using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;

namespace Rebraco.CMS.Services;

public class StripeConfigService : IStripeConfigService
{
    private readonly RebracoDbContext _db;
    private readonly IConfiguration _config;

    public StripeConfigService(RebracoDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<StripeMode> GetModeAsync()
    {
        // Check for Stripe Connect first (takes priority)
        var connectAccountId = await GetSettingAsync("stripe:connectAccountId");
        if (!string.IsNullOrWhiteSpace(connectAccountId))
            return StripeMode.Connect;

        // Check for direct keys
        var directSecretKey = await GetSettingAsync("stripe:secretKey");
        if (!string.IsNullOrWhiteSpace(directSecretKey))
            return StripeMode.Direct;

        return StripeMode.NotConfigured;
    }

    public async Task<string?> GetSecretKeyAsync()
    {
        var mode = await GetModeAsync();
        return mode switch
        {
            StripeMode.Connect => _config["Stripe:PlatformSecretKey"],
            StripeMode.Direct => await GetSettingAsync("stripe:secretKey"),
            _ => null,
        };
    }

    public async Task<string?> GetPublishableKeyAsync()
    {
        var mode = await GetModeAsync();
        return mode switch
        {
            StripeMode.Connect => _config["Stripe:PlatformPublishableKey"],
            StripeMode.Direct => await GetSettingAsync("stripe:publishableKey"),
            _ => null,
        };
    }

    public async Task<string?> GetConnectedAccountIdAsync()
    {
        return await GetSettingAsync("stripe:connectAccountId");
    }

    public string? GetConnectClientId() => _config["Stripe:ConnectClientId"];

    public string? GetWebhookSecret() => _config["Stripe:WebhookSecret"];

    private async Task<string?> GetSettingAsync(string key)
    {
        var setting = await _db.AppSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key);
        return setting?.Value;
    }
}
