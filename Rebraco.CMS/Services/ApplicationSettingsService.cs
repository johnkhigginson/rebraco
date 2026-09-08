using Microsoft.EntityFrameworkCore;
using Rebraco.CMS.Data;
using Rebraco.CMS.Models;

namespace Rebraco.CMS.Services;

/// <summary>
/// Reads/writes application-related configuration from the AppSettings table.
/// Keys are prefixed with "application:".
/// </summary>
public class ApplicationSettingsService
{
    private readonly RebracoDbContext _db;

    public ApplicationSettingsService(RebracoDbContext db)
    {
        _db = db;
    }

    public async Task<ApplicationSettingsDto> GetSettingsAsync()
    {
        var prefix = "application:";
        var settings = await _db.AppSettings
            .AsNoTracking()
            .Where(s => s.Key.StartsWith(prefix))
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        return new ApplicationSettingsDto
        {
            FeeAmountCents = long.TryParse(settings.GetValueOrDefault("application:feeAmountCents"), out var fee) ? fee : 0,
            RequireEmployment = ParseBool(settings.GetValueOrDefault("application:requireEmployment"), true),
            RequireRentalHistory = ParseBool(settings.GetValueOrDefault("application:requireRentalHistory"), true),
            RequireReferences = ParseBool(settings.GetValueOrDefault("application:requireReferences"), true),
            RequireEmergencyContact = ParseBool(settings.GetValueOrDefault("application:requireEmergencyContact"), true),
            RequireVehicle = ParseBool(settings.GetValueOrDefault("application:requireVehicle"), false),
            RequireCoSigner = ParseBool(settings.GetValueOrDefault("application:requireCoSigner"), false),
            RequirePets = ParseBool(settings.GetValueOrDefault("application:requirePets"), false),
            RequireAdditionalNotes = ParseBool(settings.GetValueOrDefault("application:requireAdditionalNotes"), false),
        };
    }

    public async Task UpdateSettingsAsync(UpdateApplicationSettingsDto dto)
    {
        if (dto.FeeAmountCents.HasValue)
            await UpsertAsync("application:feeAmountCents", dto.FeeAmountCents.Value.ToString());
        if (dto.RequireEmployment.HasValue)
            await UpsertAsync("application:requireEmployment", dto.RequireEmployment.Value.ToString());
        if (dto.RequireRentalHistory.HasValue)
            await UpsertAsync("application:requireRentalHistory", dto.RequireRentalHistory.Value.ToString());
        if (dto.RequireReferences.HasValue)
            await UpsertAsync("application:requireReferences", dto.RequireReferences.Value.ToString());
        if (dto.RequireEmergencyContact.HasValue)
            await UpsertAsync("application:requireEmergencyContact", dto.RequireEmergencyContact.Value.ToString());
        if (dto.RequireVehicle.HasValue)
            await UpsertAsync("application:requireVehicle", dto.RequireVehicle.Value.ToString());
        if (dto.RequireCoSigner.HasValue)
            await UpsertAsync("application:requireCoSigner", dto.RequireCoSigner.Value.ToString());
        if (dto.RequirePets.HasValue)
            await UpsertAsync("application:requirePets", dto.RequirePets.Value.ToString());
        if (dto.RequireAdditionalNotes.HasValue)
            await UpsertAsync("application:requireAdditionalNotes", dto.RequireAdditionalNotes.Value.ToString());

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

    private static bool ParseBool(string? value, bool defaultValue)
    {
        if (string.IsNullOrEmpty(value)) return defaultValue;
        return bool.TryParse(value, out var result) ? result : defaultValue;
    }
}

// ── DTOs ──────────────────────────────────────────────────────────────

public class ApplicationSettingsDto
{
    public long FeeAmountCents { get; set; }
    public bool RequireEmployment { get; set; }
    public bool RequireRentalHistory { get; set; }
    public bool RequireReferences { get; set; }
    public bool RequireEmergencyContact { get; set; }
    public bool RequireVehicle { get; set; }
    public bool RequireCoSigner { get; set; }
    public bool RequirePets { get; set; }
    public bool RequireAdditionalNotes { get; set; }
}

public class UpdateApplicationSettingsDto
{
    public long? FeeAmountCents { get; set; }
    public bool? RequireEmployment { get; set; }
    public bool? RequireRentalHistory { get; set; }
    public bool? RequireReferences { get; set; }
    public bool? RequireEmergencyContact { get; set; }
    public bool? RequireVehicle { get; set; }
    public bool? RequireCoSigner { get; set; }
    public bool? RequirePets { get; set; }
    public bool? RequireAdditionalNotes { get; set; }
}
