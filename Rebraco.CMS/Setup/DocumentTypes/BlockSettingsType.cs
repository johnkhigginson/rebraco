using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class BlockSettingsType
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("blockSettings", "Block Settings", "icon-settings",
            "Shared settings for all block components (padding, color scheme, visibility)");

        var padding = dt.FindDataTypeByName(DropdownDataTypes.Padding)!;
        var containerWidth = dt.FindDataTypeByName(DropdownDataTypes.ContainerWidth)!;
        const string g = "settings";
        const string gn = "Settings";

        ct.AddPropertyIfMissing(type, g, gn, "anchorName", "Anchor Name", dt.Textstring,
            "HTML anchor ID for this section", 0);
        ct.AddPropertyIfMissing(type, g, gn, "cssClasses", "CSS Classes", dt.Textstring,
            "Additional CSS classes", 1);
        ct.AddPropertyIfMissing(type, g, gn, "colorScheme", "Color Scheme", dt.Textstring,
            "Slug matching a color scheme from site settings", 2);
        ct.AddPropertyIfMissing(type, g, gn, "hideComponent", "Hide Component", dt.Toggle,
            "Hide this block on the frontend", 3);
        ct.AddPropertyIfMissing(type, g, gn, "paddingTop", "Padding Top", padding, sortOrder: 4);
        ct.AddPropertyIfMissing(type, g, gn, "paddingBottom", "Padding Bottom", padding, sortOrder: 5);
        ct.AddPropertyIfMissing(type, g, gn, "containerWidth", "Container Width", containerWidth, sortOrder: 6);

        ct.Save(type);

        // --- Banner-specific settings (shared blockSettings properties + banner options) ---
        var bannerType = ct.GetOrCreateElementType("bannerSettings", "Banner Settings", "icon-picture",
            "Settings for the banner/carousel block (shared settings + banner-specific options)");

        // Shared settings (duplicated because block grid settings are per element type)
        ct.AddPropertyIfMissing(bannerType, g, gn, "anchorName", "Anchor Name", dt.Textstring,
            "HTML anchor ID for this section", 0);
        ct.AddPropertyIfMissing(bannerType, g, gn, "cssClasses", "CSS Classes", dt.Textstring,
            "Additional CSS classes", 1);
        ct.AddPropertyIfMissing(bannerType, g, gn, "colorScheme", "Color Scheme", dt.Textstring,
            "Slug matching a color scheme from site settings", 2);
        ct.AddPropertyIfMissing(bannerType, g, gn, "hideComponent", "Hide Component", dt.Toggle,
            "Hide this block on the frontend", 3);
        ct.AddPropertyIfMissing(bannerType, g, gn, "paddingTop", "Padding Top", padding, sortOrder: 4);
        ct.AddPropertyIfMissing(bannerType, g, gn, "paddingBottom", "Padding Bottom", padding, sortOrder: 5);
        ct.AddPropertyIfMissing(bannerType, g, gn, "containerWidth", "Container Width", containerWidth, sortOrder: 6);

        // Banner-specific parent settings
        const string bg = "bannerOptions";
        const string bgn = "Banner Options";

        ct.AddPropertyIfMissing(bannerType, bg, bgn, "componentName", "Component Name",
            dt.Textstring, "Internal label for this banner", 0, groupSortOrder: 1);
        ct.AddPropertyIfMissing(bannerType, bg, bgn, "enableRandomOrder", "Enable Random Order",
            dt.Toggle, "Randomize slide order on each page load", 1, groupSortOrder: 1);
        ct.AddPropertyIfMissing(bannerType, bg, bgn, "showArrows", "Show Arrows",
            dt.Toggle, "Display prev/next navigation arrows", 2, groupSortOrder: 1);
        ct.AddPropertyIfMissing(bannerType, bg, bgn, "autoRotateSpeed", "Auto Rotate Speed",
            dt.Numeric, "Seconds between slides (0 = disabled, max 10)", 3, groupSortOrder: 1);
        ct.AddPropertyIfMissing(bannerType, bg, bgn, "sticky", "Sticky",
            dt.Toggle, "Keep banner fixed at top while scrolling", 4, groupSortOrder: 1);

        ct.Save(bannerType);
    }
}
