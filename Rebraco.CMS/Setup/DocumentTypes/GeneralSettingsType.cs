using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class GeneralSettingsType
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("generalSettings", "General", "icon-settings-alt",
            allowedAsRoot: false, description: "General site settings (child of Settings)");

        // --- Details tab ---
        ct.AddPropertyIfMissing(type, "details", "Details", "websiteName", "Website Name",
            dt.Textstring, "The name of the website", 0, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, "details", "Details", "defaultSocialShareImage", "Default Social Share Image",
            dt.MediaPicker, "Default image used for social media sharing (og:image)", 1, groupSortOrder: 10);

        // --- Marketing tab ---
        ct.AddPropertyIfMissing(type, "marketing", "Marketing", "googleTagManagerId", "Google Tag Manager ID",
            dt.Textstring, "GTM container ID (e.g., GTM-XXXXX)", 0, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, "marketing", "Marketing", "googleAnalyticsId", "Google Analytics ID",
            dt.Textstring, "GA4 measurement ID (e.g., G-XXXXX)", 1, groupSortOrder: 20);

        // --- Scripts tab ---
        ct.AddPropertyIfMissing(type, "scripts", "Scripts", "headerOpeningScripts", "Header Opening Scripts",
            dt.Textarea, "Scripts inserted immediately after the opening <head> tag", 0, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, "scripts", "Scripts", "headerClosingScripts", "Header Closing Scripts",
            dt.Textarea, "Scripts inserted immediately before the closing </head> tag", 1, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, "scripts", "Scripts", "bodyOpeningScripts", "Body Opening Scripts",
            dt.Textarea, "Scripts inserted immediately after the opening <body> tag", 2, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, "scripts", "Scripts", "bodyClosingScripts", "Body Closing Scripts",
            dt.Textarea, "Scripts inserted immediately before the closing </body> tag", 3, groupSortOrder: 30);

        ct.Save(type);
    }
}
