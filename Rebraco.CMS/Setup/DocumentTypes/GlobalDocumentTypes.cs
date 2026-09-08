using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class GlobalDocumentTypes
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt)
    {
        EnsureSettings(ct);
        CreateNavigation(ct, dt);
        CreateFooter(ct, dt);
    }

    /// <summary>
    /// Configure parent-child relationships and AllowedAsRoot flags.
    /// Called after GeneralSettingsType has been created (Phase 14).
    /// </summary>
    public static void ConfigureParentChild(ContentTypeHelper ct)
    {
        var settings = ct.GetOrCreateDocumentType("settings", "Settings", "icon-settings", allowedAsRoot: true);
        var navigation = ct.GetOrCreateDocumentType("navigation", "Navigation", "icon-navigation");
        var footer = ct.GetOrCreateDocumentType("footer", "Footer", "icon-footer");
        var general = ct.GetOrCreateDocumentType("generalSettings", "General", "icon-settings-alt");

        // Settings stays root-level, acts as container for children
        ct.EnsureAllowedAsRoot(settings, true);

        // Navigation, Footer, General are children of Settings (not root-level)
        ct.EnsureAllowedAsRoot(navigation, false);
        ct.EnsureAllowedAsRoot(footer, false);
        ct.EnsureAllowedAsRoot(general, false);

        // Set allowed children on settings
        ct.SetAllowedContentTypes(settings, "navigation", "footer", "generalSettings");
        ct.Save(settings);
    }

    private static void EnsureSettings(ContentTypeHelper ct)
    {
        // Settings is a pure container node — no properties of its own.
        // All content lives on children (Navigation, Footer, General) or Design.
        ct.GetOrCreateDocumentType("settings", "Settings", "icon-settings", allowedAsRoot: true);
    }

    /// <summary>
    /// Removes legacy properties from Settings that have been migrated elsewhere.
    /// Called as a migration step after all document types are created.
    /// </summary>
    public static void MigrateSettingsProperties(ContentTypeHelper ct)
    {
        var type = ct.GetOrCreateDocumentType("settings", "Settings", "icon-settings", allowedAsRoot: true);

        // Properties moved to Design / General doc types
        var removed = false;
        removed |= ct.RemovePropertyIfExists(type, "siteName");
        removed |= ct.RemovePropertyIfExists(type, "headingFont");
        removed |= ct.RemovePropertyIfExists(type, "bodyFont");
        removed |= ct.RemovePropertyIfExists(type, "accentColor");
        removed |= ct.RemovePropertyIfExists(type, "textColor");
        removed |= ct.RemovePropertyIfExists(type, "backgroundColor");
        removed |= ct.RemovePropertyIfExists(type, "baseFontSize");
        removed |= ct.RemovePropertyIfExists(type, "maxContentWidth");
        removed |= ct.RemovePropertyIfExists(type, "colorSchemes");

        if (removed)
        {
            ct.Save(type);
        }
    }

    private static void CreateNavigation(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("navigation", "Navigation", "icon-navigation",
            allowedAsRoot: false, description: "Site navigation configuration (child of Settings)");

        var headerVariant = dt.FindDataTypeByName(DropdownDataTypes.HeaderVariant)!;
        var singleUrl = dt.FindDataTypeByName(DropdownDataTypes.SingleUrlPicker)!;
        const string g = "navigation";
        const string gn = "Navigation";

        ct.AddPropertyIfMissing(type, g, gn, "headerVariant", "Header Variant", headerVariant,
            "Header style: standard, centered, minimal, transparent", 0);
        ct.AddPropertyIfMissing(type, g, gn, "stickyHeader", "Sticky Header", dt.Toggle,
            "Keep header fixed on scroll", 1);
        ct.AddPropertyIfMissing(type, g, gn, "primaryNav", "Primary Navigation", dt.MultiUrlPicker,
            "Main navigation links", 2);
        ct.AddPropertyIfMissing(type, g, gn, "ctaButton", "CTA Button", singleUrl,
            "Optional call-to-action button in header", 3);

        ct.Save(type);
    }

    private static void CreateFooter(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("footer", "Footer", "icon-footer",
            allowedAsRoot: false, description: "Site footer configuration (child of Settings)");

        var socialLinks = dt.FindDataTypeByName(BlockListDataTypes.SocialLinks)!;
        const string g = "footer";
        const string gn = "Footer";

        ct.AddPropertyIfMissing(type, g, gn, "footerText", "Footer Text", dt.RichText, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "footerLinks", "Footer Links", dt.MultiUrlPicker, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "copyrightText", "Copyright Text", dt.Textstring, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "socialLinks", "Social Links", socialLinks, sortOrder: 3);

        ct.Save(type);
    }
}
