using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Setup;

/// <summary>
/// Organizes document types and element types into folders in the Settings tree.
/// </summary>
public static class FolderOrganization
{
    // Deterministic GUIDs for each folder (stable across runs)
    private static readonly Guid PagesFolderKey = Guid.Parse("a1b2c3d4-1111-4000-8000-000000000001");
    private static readonly Guid BlockElementsFolderKey = Guid.Parse("a1b2c3d4-2222-4000-8000-000000000002");
    private static readonly Guid BlockSettingsFolderKey = Guid.Parse("a1b2c3d4-3333-4000-8000-000000000003");
    private static readonly Guid GlobalFolderKey = Guid.Parse("a1b2c3d4-4444-4000-8000-000000000004");
    private static readonly Guid NestedElementsFolderKey = Guid.Parse("a1b2c3d4-6666-4000-8000-000000000006");
    private static readonly Guid RentalFolderKey = Guid.Parse("a1b2c3d4-5555-4000-8000-000000000005");

    private static readonly string[] PageAliases =
        ["home", "standardPage", "blogLanding", "blogPost"];

    private static readonly string[] BlockElementAliases =
    [
        "banner", "splitContent", "pods", "textBlock", "ctaStrip",
        "gridLayout", "accordionTabs", "gallery", "alertBox", "linksBlock",
        "embedBlock", "dataList", "anchorNav", "subpageListing", "formBlock",
        "featuredProperties"
    ];

    private static readonly string[] BlockSettingsAliases =
        ["blockSettings", "bannerSettings"];

    private static readonly string[] GlobalAliases =
        ["settings", "navigation", "footer", "design", "generalSettings"];

    private static readonly string[] NestedElementAliases =
    [
        "colorSchemeItem", "socialLinkItem", "podItem", "gridColumn",
        "accordionItem", "dataListItem", "anchorNavItem", "formField", "bannerItem",
        "typographyRule", "buttonStyleItem", "backgroundLayerItem"
    ];

    private static readonly string[] RentalAliases =
        ["propertyListing", "property", "unit"];

    public static void EnsureAll(IContentTypeService cts, ILogger logger)
    {
        var pagesId = EnsureContainer(cts, logger, -1, PagesFolderKey, "Pages");
        var blocksId = EnsureContainer(cts, logger, -1, BlockElementsFolderKey, "Block Elements");
        var settingsId = EnsureContainer(cts, logger, -1, BlockSettingsFolderKey, "Block Settings");
        var globalId = EnsureContainer(cts, logger, -1, GlobalFolderKey, "Global");
        var nestedId = EnsureContainer(cts, logger, -1, NestedElementsFolderKey, "Nested Elements");
        var rentalId = EnsureContainer(cts, logger, -1, RentalFolderKey, "Rental");

        MoveTypesToFolder(cts, logger, pagesId, PageAliases);
        MoveTypesToFolder(cts, logger, blocksId, BlockElementAliases);
        MoveTypesToFolder(cts, logger, settingsId, BlockSettingsAliases);
        MoveTypesToFolder(cts, logger, nestedId, NestedElementAliases);
        MoveTypesToFolder(cts, logger, globalId, GlobalAliases);
        MoveTypesToFolder(cts, logger, rentalId, RentalAliases);
    }

    private static int EnsureContainer(
        IContentTypeService cts, ILogger logger,
        int parentId, Guid key, string name)
    {
        var existing = cts.GetContainer(key);
        if (existing != null)
            return existing.Id;

        var result = cts.CreateContainer(parentId, key, name);
        if (result.Success && result.Result?.Entity != null)
        {
            logger.LogInformation("Rebraco: Created folder '{Name}' for document types", name);
            return result.Result.Entity.Id;
        }

        logger.LogWarning("Rebraco: Failed to create folder '{Name}': {Status}",
            name, result.Result?.Result.ToString() ?? "unknown");
        return -1;
    }

    private static void MoveTypesToFolder(
        IContentTypeService cts, ILogger logger,
        int folderId, string[] aliases)
    {
        if (folderId <= 0) return;

        foreach (var alias in aliases)
        {
            var type = cts.Get(alias);
            if (type == null) continue;

            // Skip if already in the correct folder
            if (type.ParentId == folderId) continue;

            type.ParentId = folderId;
            cts.Save(type);
            logger.LogInformation("Rebraco: Moved '{Alias}' into folder (ID {FolderId})", alias, folderId);
        }
    }
}
