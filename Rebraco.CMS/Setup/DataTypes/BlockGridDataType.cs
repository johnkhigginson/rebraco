using Rebraco.CMS.Setup.Helpers;
using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Setup.DataTypes;

public static class BlockGridDataType
{
    public const string MainContent = "Rebraco - Main Content";
    public const string SidebarContent = "Rebraco - Sidebar Content";

    // All 17 block content type aliases
    private static readonly string[] BlockAliases =
    [
        "banner", "splitContent", "pods", "textBlock", "ctaStrip",
        "gridLayout", "accordionTabs", "gallery", "alertBox", "linksBlock",
        "embedBlock", "dataList", "anchorNav", "subpageListing", "formBlock",
        "featuredProperties", "propertyGrid"
    ];

    private static readonly string[] BlockLabels =
    [
        "Banner", "Split Content", "Pods", "Text Block", "CTA Strip",
        "Grid Layout", "Accordion / Tabs", "Gallery", "Alert Box", "Links Block",
        "Embed Block", "Data List", "Anchor Nav", "Subpage Listing", "Form Block",
        "Featured Properties", "Property Grid"
    ];

    public static void EnsureAll(DataTypeHelper dt, IContentTypeService cts)
    {
        var settingsKey = cts.Get("blockSettings")!.Key;
        var bannerSettingsKey = cts.Get("bannerSettings")!.Key;

        var blocks = new (Guid contentKey, string label, Guid? settingsKeyOverride)[BlockAliases.Length];
        for (int i = 0; i < BlockAliases.Length; i++)
        {
            var blockType = cts.Get(BlockAliases[i])
                ?? throw new InvalidOperationException($"Block element type '{BlockAliases[i]}' not found.");

            // Banner uses its own settings type; all others use the shared blockSettings
            Guid? settingsOverride = BlockAliases[i] == "banner" ? bannerSettingsKey : null;
            blocks[i] = (blockType.Key, BlockLabels[i], settingsOverride);
        }

        // Main Content Block Grid: 12-col, spans 12/6/4
        dt.GetOrCreateBlockGrid(MainContent, settingsKey, blocks, [12, 6, 4]);

        // Sidebar Content Block Grid: 12-col, spans 12 only
        dt.GetOrCreateBlockGrid(SidebarContent, settingsKey, blocks, [12]);
    }
}
