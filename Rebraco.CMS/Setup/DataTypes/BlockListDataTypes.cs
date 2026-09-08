using Rebraco.CMS.Setup.Helpers;
using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Setup.DataTypes;

public static class BlockListDataTypes
{
    public const string ColorSchemes = "Rebraco - Color Schemes";
    public const string SocialLinks = "Rebraco - Social Links";
    public const string PodItems = "Rebraco - Pod Items";
    public const string GridColumns = "Rebraco - Grid Columns";
    public const string AccordionItems = "Rebraco - Accordion Items";
    public const string DataListItems = "Rebraco - Data List Items";
    public const string AnchorNavItems = "Rebraco - Anchor Nav Items";
    public const string FormFields = "Rebraco - Form Fields";
    public const string BannerItems = "Rebraco - Banner Items";

    public static void EnsureAll(DataTypeHelper dt, IContentTypeService cts)
    {
        dt.GetOrCreateBlockList(ColorSchemes,
            (cts.Get("colorSchemeItem")!.Key, "{{schemeName}}"));

        dt.GetOrCreateBlockList(SocialLinks,
            (cts.Get("socialLinkItem")!.Key, "{{platform}}"));

        dt.GetOrCreateBlockList(PodItems,
            (cts.Get("podItem")!.Key, "{{heading}}"));

        dt.GetOrCreateBlockList(GridColumns,
            (cts.Get("gridColumn")!.Key, "Column"));

        dt.GetOrCreateBlockList(AccordionItems,
            (cts.Get("accordionItem")!.Key, "{{title}}"));

        dt.GetOrCreateBlockList(DataListItems,
            (cts.Get("dataListItem")!.Key, "{{label}}"));

        dt.GetOrCreateBlockList(AnchorNavItems,
            (cts.Get("anchorNavItem")!.Key, "{{label}}"));

        dt.GetOrCreateBlockList(FormFields,
            (cts.Get("formField")!.Key, "{{fieldLabel}}"));

        dt.GetOrCreateBlockList(BannerItems,
            (cts.Get("bannerItem")!.Key, "{{heading}}"));
    }
}
