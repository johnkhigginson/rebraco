using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

/// <summary>
/// Reads/writes tour scheduling configuration from the AppSettings table.
/// Keys are prefixed with "tour:".
/// </summary>
public class TourSettingsService
{
    private readonly RebracoDbContext _db;

    public TourSettingsService(RebracoDbContext db)
    {
        _db = db;
    }

    public async Task<TourSettingsDto> GetSettingsAsync()
    {
        var prefix = "tour:";
        var settings = await _db.AppSettings
            .AsNoTracking()
            .Where(s => s.Key.StartsWith(prefix))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return new TourSettingsDto
        {
            DefaultSlotDurationMinutes = int.TryParse(settings.GetValueOrDefault("tour:defaultSlotDurationMinutes"), out var sd) ? sd : 30,
            MaxAdvanceBookingDays = int.TryParse(settings.GetValueOrDefault("tour:maxAdvanceBookingDays"), out var ma) ? ma : 30,
            RequireConfirmation = !bool.TryParse(settings.GetValueOrDefault("tour:requireConfirmation"), out var rc) || rc, // default true
            ReminderEnabled = !bool.TryParse(settings.GetValueOrDefault("tour:reminderEnabled"), out var re) || re, // default true
        };
    }

    public async Task UpdateSettingsAsync(UpdateTourSettingsDto dto)
    {
        if (dto.DefaultSlotDurationMinutes.HasValue)
            await UpsertAsync("tour:defaultSlotDurationMinutes", dto.DefaultSlotDurationMinutes.Value.ToString());
        if (dto.MaxAdvanceBookingDays.HasValue)
            await UpsertAsync("tour:maxAdvanceBookingDays", dto.MaxAdvanceBookingDays.Value.ToString());
        if (dto.RequireConfirmation.HasValue)
            await UpsertAsync("tour:requireConfirmation", dto.RequireConfirmation.Value.ToString());
        if (dto.ReminderEnabled.HasValue)
            await UpsertAsync("tour:reminderEnabled", dto.ReminderEnabled.Value.ToString());

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

public class TourSettingsDto
{
    public int DefaultSlotDurationMinutes { get; set; }
    public int MaxAdvanceBookingDays { get; set; }
    public bool RequireConfirmation { get; set; }
    public bool ReminderEnabled { get; set; }
}

public class UpdateTourSettingsDto
{
    public int? DefaultSlotDurationMinutes { get; set; }
    public int? MaxAdvanceBookingDays { get; set; }
    public bool? RequireConfirmation { get; set; }
    public bool? ReminderEnabled { get; set; }
}
