using Microsoft.EntityFrameworkCore;

namespace Rebraco.CMS.Data;

/// <summary>
/// Applies pending EF Core migrations on startup.
/// Ensures each client instance auto-migrates without manual steps.
/// </summary>
public class DatabaseMigrator : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DatabaseMigrator> _logger;

    public DatabaseMigrator(IServiceProvider serviceProvider, ILogger<DatabaseMigrator> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<RebracoDbContext>();

        try
        {
            var pending = await context.Database.GetPendingMigrationsAsync(cancellationToken);
            var migrations = pending.ToList();

            if (migrations.Count > 0)
            {
                _logger.LogInformation("Rebraco: Applying {Count} pending migration(s)...", migrations.Count);
                await context.Database.MigrateAsync(cancellationToken);
                _logger.LogInformation("Rebraco: Database migration complete.");
            }
            else
            {
                _logger.LogInformation("Rebraco: Database is up to date.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Database migration failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
