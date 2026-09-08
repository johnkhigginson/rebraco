using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

/// <summary>
/// Reads/writes lease renewal configuration from the AppSettings table.
/// Keys are prefixed with "renewal:".
/// </summary>
public class RenewalSettingsService
{
    private readonly RebracoDbContext _db;

    public RenewalSettingsService(RebracoDbContext db)
    {
        _db = db;
    }

    public async Task<RenewalSettingsDto> GetSettingsAsync()
    {
        var prefix = "renewal:";
        var settings = await _db.AppSettings
            .AsNoTracking()
            .Where(s => s.Key.StartsWith(prefix))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return new RenewalSettingsDto
        {
            AutoDetectDays = int.TryParse(settings.GetValueOrDefault("renewal:autoDetectDays"), out var ad) ? ad : 60,
            OfferExpiryDays = int.TryParse(settings.GetValueOrDefault("renewal:offerExpiryDays"), out var oe) ? oe : 30,
        };
    }

    public async Task UpdateSettingsAsync(UpdateRenewalSettingsDto dto)
    {
        if (dto.AutoDetectDays.HasValue)
            await UpsertAsync("renewal:autoDetectDays", dto.AutoDetectDays.Value.ToString());
        if (dto.OfferExpiryDays.HasValue)
            await UpsertAsync("renewal:offerExpiryDays", dto.OfferExpiryDays.Value.ToString());

        await _db.SaveChangesAsync();
    }

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
                UpdatedAt = DateTimeOffset.UtcNow,
            });
        }
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────

public class RenewalSettingsDto
{
    public int AutoDetectDays { get; set; }
    public int OfferExpiryDays { get; set; }
}

public class UpdateRenewalSettingsDto
{
    public int? AutoDetectDays { get; set; }
    public int? OfferExpiryDays { get; set; }
}
