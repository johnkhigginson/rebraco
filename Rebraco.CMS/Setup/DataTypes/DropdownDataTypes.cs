using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DataTypes;

public static class DropdownDataTypes
{
    // Data type names as constants for referencing from other phases
    public const string HeaderVariant = "Rebraco - Header Variant";
    public const string PageLayout = "Rebraco - Page Layout";
    public const string HeadingLevel = "Rebraco - Heading Level";
    public const string TextAlignment = "Rebraco - Text Alignment";
    public const string GridColumnsCount = "Rebraco - Grid Columns Count";
    public const string GalleryColumnsCount = "Rebraco - Gallery Columns Count";
    public const string AlertType = "Rebraco - Alert Type";
    public const string LinksLayout = "Rebraco - Links Layout";
    public const string DisplayMode = "Rebraco - Display Mode";
    public const string DataLayout = "Rebraco - Data Layout";
    public const string AnchorNavStyle = "Rebraco - Anchor Nav Style";
    public const string SubpageLayout = "Rebraco - Subpage Layout";
    public const string SortOrder = "Rebraco - Sort Order";
    public const string Padding = "Rebraco - Padding";
    public const string ContainerWidth = "Rebraco - Container Width";
    public const string SocialPlatform = "Rebraco - Social Platform";
    public const string FormFieldType = "Rebraco - Form Field Type";
    public const string FormType = "Rebraco - Form Type";
    public const string EyeDropperColor = "Rebraco - Eye Dropper Color";
    public const string SingleUrlPicker = "Rebraco - Single URL Picker";
    public const string MultipleImages = "Rebraco - Multiple Images";
    public const string BannerHeadingLevel = "Rebraco - Banner Heading Level";
    public const string BannerStyle = "Rebraco - Banner Style";
    public const string TextPosition = "Rebraco - Text Position";
    public const string SecondaryHeadingSize = "Rebraco - Secondary Heading Size";

    public static void EnsureAll(DataTypeHelper dt)
    {
        // --- Dropdowns ---
        dt.GetOrCreateDropdown(HeaderVariant, false, "standard", "centered", "minimal", "transparent");
        dt.GetOrCreateDropdown(PageLayout, false, "fullWidth", "leftSidebar", "rightSidebar");
        dt.GetOrCreateDropdown(HeadingLevel, false, "h1", "h2", "h3", "h4");
        dt.GetOrCreateDropdown(TextAlignment, false, "left", "center", "right");
        dt.GetOrCreateDropdown(GridColumnsCount, false, "2", "3", "4");
        dt.GetOrCreateDropdown(GalleryColumnsCount, false, "2", "3", "4", "5");
        dt.GetOrCreateDropdown(AlertType, false, "info", "success", "warning", "error");
        dt.GetOrCreateDropdown(LinksLayout, false, "list", "buttons", "cards");
        dt.GetOrCreateDropdown(DisplayMode, false, "accordion", "tabs");
        dt.GetOrCreateDropdown(DataLayout, false, "table", "cards", "definition-list");
        dt.GetOrCreateDropdown(AnchorNavStyle, false, "bar", "dots");
        dt.GetOrCreateDropdown(SubpageLayout, false, "cards", "list", "tiles");
        dt.GetOrCreateDropdown(SortOrder, false, "date-desc", "date-asc", "name-asc");
        dt.GetOrCreateDropdown(Padding, false, "none", "small", "medium", "large", "xl");
        dt.GetOrCreateDropdown(ContainerWidth, false, "full", "wide", "standard", "narrow");
        dt.GetOrCreateDropdown(SocialPlatform, false, "facebook", "twitter", "instagram", "linkedin", "youtube");
        dt.GetOrCreateDropdown(FormFieldType, false, "text", "email", "tel", "textarea", "select", "checkbox");
        dt.GetOrCreateDropdown(FormType, false, "contact", "newsletter", "callback", "custom");

        // --- Banner-specific dropdowns ---
        dt.GetOrCreateDropdown(BannerHeadingLevel, false,
            "h1", "h2", "h3", "h4", "h5", "h6", "S", "M", "L");
        dt.GetOrCreateDropdown(BannerStyle, false,
            "takeover", "medium", "short", "scale");
        dt.GetOrCreateDropdown(TextPosition, false,
            "top-left", "top-center", "top-right",
            "center-left", "center", "center-right",
            "bottom-left", "bottom-center", "bottom-right");
        dt.GetOrCreateDropdown(SecondaryHeadingSize, false, "S", "M", "L");

        // --- Eye Dropper Color ---
        dt.GetOrCreateEyeDropper(EyeDropperColor);

        // --- Single URL Picker (max 1) ---
        dt.GetOrCreateSingleUrlPicker(SingleUrlPicker);

        // --- Multiple Images (media picker 3, multiple) ---
        dt.GetOrCreateMultipleMediaPicker(MultipleImages);
    }
}
