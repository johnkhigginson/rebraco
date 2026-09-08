namespace Rebraco.CMS.Services;

public enum StripeMode
{
    NotConfigured,
    Connect,
    Direct,
}

public interface IStripeConfigService
{
    /// <summary>Detects which Stripe mode is active based on stored settings.</summary>
    Task<StripeMode> GetModeAsync();

    /// <summary>Returns the Stripe secret key for the active mode.</summary>
    Task<string?> GetSecretKeyAsync();

    /// <summary>Returns the publishable key for the active mode (safe for frontend).</summary>
    Task<string?> GetPublishableKeyAsync();

    /// <summary>Returns the Stripe Connect connected account ID, or null if not in Connect mode.</summary>
    Task<string?> GetConnectedAccountIdAsync();

    /// <summary>Returns the platform's Connect OAuth client ID from config.</summary>
    string? GetConnectClientId();

    /// <summary>Returns the webhook signing secret.</summary>
    string? GetWebhookSecret();
}
