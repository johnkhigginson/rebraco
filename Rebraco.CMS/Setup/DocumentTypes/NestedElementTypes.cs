using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class NestedElementTypes
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt)
    {
        CreateColorSchemeItem(ct, dt);
        CreateSocialLinkItem(ct, dt);
        CreatePodItem(ct, dt);
        CreateGridColumn(ct, dt);
        CreateAccordionItem(ct, dt);
        CreateDataListItem(ct, dt);
        CreateAnchorNavItem(ct, dt);
        CreateFormField(ct, dt);
        CreateBannerItem(ct, dt);
    }

    private static void CreateColorSchemeItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("colorSchemeItem", "Color Scheme Item", "icon-palette",
            "A named color scheme for section theming");

        var eyeDropper = dt.FindDataTypeByName(DropdownDataTypes.EyeDropperColor)!;
        const string g = "colorScheme";
        const string gn = "Color Scheme";

        ct.AddPropertyIfMissing(type, g, gn, "schemeName", "Scheme Name", dt.Textstring, "Display name", 0, true);
        ct.AddPropertyIfMissing(type, g, gn, "schemeSlug", "Scheme Slug", dt.Textstring, "URL-friendly identifier", 1, true);
        ct.AddPropertyIfMissing(type, g, gn, "bgColor", "Background Color", eyeDropper, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "textColor", "Text Color", eyeDropper, sortOrder: 3);
        ct.AddPropertyIfMissing(type, g, gn, "headingColor", "Heading Color", eyeDropper, sortOrder: 4);
        ct.AddPropertyIfMissing(type, g, gn, "linkColor", "Link Color", eyeDropper, sortOrder: 5);
        ct.AddPropertyIfMissing(type, g, gn, "buttonBgColor", "Button Background", eyeDropper, sortOrder: 6);
        ct.AddPropertyIfMissing(type, g, gn, "buttonTextColor", "Button Text Color", eyeDropper, sortOrder: 7);

        // Extended design tokens per color scheme
        ct.AddPropertyIfMissing(type, g, gn, "accentColor", "Accent Color", eyeDropper,
            "Per-scheme accent color", 8);
        ct.AddPropertyIfMissing(type, g, gn, "surfaceColor", "Surface Color", eyeDropper,
            "Per-scheme card/panel background", 9);
        ct.AddPropertyIfMissing(type, g, gn, "borderColor", "Border Color", eyeDropper,
            "Per-scheme border color", 10);
        ct.AddPropertyIfMissing(type, g, gn, "mutedTextColor", "Muted Text Color", eyeDropper,
            "Per-scheme secondary text color", 11);
        ct.AddPropertyIfMissing(type, g, gn, "dividerColor", "Divider Color", eyeDropper,
            "Per-scheme divider/separator color", 12);
        ct.AddPropertyIfMissing(type, g, gn, "inputBorderColor", "Input Border", eyeDropper,
            "Per-scheme form input border color", 13);
        ct.AddPropertyIfMissing(type, g, gn, "inputBgColor", "Input Background", eyeDropper,
            "Per-scheme form input background", 14);

        ct.Save(type);
    }

    private static void CreateSocialLinkItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("socialLinkItem", "Social Link Item", "icon-share-alt");

        var platform = dt.FindDataTypeByName(DropdownDataTypes.SocialPlatform)!;
        var urlPicker = dt.FindDataTypeByName(DropdownDataTypes.SingleUrlPicker)!;
        const string g = "socialLink";
        const string gn = "Social Link";

        ct.AddPropertyIfMissing(type, g, gn, "platform", "Platform", platform, "Social network", 0, true);
        ct.AddPropertyIfMissing(type, g, gn, "url", "URL", urlPicker, "Link to social profile", 1, true);

        ct.Save(type);
    }

    private static void CreatePodItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("podItem", "Pod Item", "icon-thumbnail-list");

        var urlPicker = dt.FindDataTypeByName(DropdownDataTypes.SingleUrlPicker)!;
        const string g = "pod";
        const string gn = "Pod";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "text", "Text", dt.Textarea, "Plain text description", 1);
        ct.AddPropertyIfMissing(type, g, gn, "image", "Image", dt.MediaPicker, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "link", "Link", urlPicker, sortOrder: 3);

        ct.Save(type);
    }

    private static void CreateGridColumn(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("gridColumn", "Grid Column", "icon-layout");
        const string g = "columnContent";
        const string gn = "Column Content";

        ct.AddPropertyIfMissing(type, g, gn, "content", "Content", dt.RichText, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "image", "Image", dt.MediaPicker, sortOrder: 1);

        ct.Save(type);
    }

    private static void CreateAccordionItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("accordionItem", "Accordion Item", "icon-list");
        const string g = "item";
        const string gn = "Item";

        ct.AddPropertyIfMissing(type, g, gn, "title", "Title", dt.Textstring, sortOrder: 0, mandatory: true);
        ct.AddPropertyIfMissing(type, g, gn, "content", "Content", dt.RichText, sortOrder: 1);

        ct.Save(type);
    }

    private static void CreateDataListItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("dataListItem", "Data List Item", "icon-ordered-list");
        const string g = "dataItem";
        const string gn = "Data Item";

        ct.AddPropertyIfMissing(type, g, gn, "label", "Label", dt.Textstring, sortOrder: 0, mandatory: true);
        ct.AddPropertyIfMissing(type, g, gn, "value", "Value", dt.Textstring, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "description", "Description", dt.Textarea, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "highlighted", "Highlighted", dt.Toggle, sortOrder: 3);

        ct.Save(type);
    }

    private static void CreateAnchorNavItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("anchorNavItem", "Anchor Nav Item", "icon-anchor");
        const string g = "anchor";
        const string gn = "Anchor";

        ct.AddPropertyIfMissing(type, g, gn, "label", "Label", dt.Textstring, sortOrder: 0, mandatory: true);
        ct.AddPropertyIfMissing(type, g, gn, "targetAnchor", "Target Anchor", dt.Textstring,
            "HTML ID of the target section", 1, true);

        ct.Save(type);
    }

    private static void CreateBannerItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("bannerItem", "Banner Item", "icon-picture",
            "A single slide within a banner carousel");

        var bannerHeadingLevel = dt.FindDataTypeByName(DropdownDataTypes.BannerHeadingLevel)!;
        var secondarySize = dt.FindDataTypeByName(DropdownDataTypes.SecondaryHeadingSize)!;
        var bannerStyle = dt.FindDataTypeByName(DropdownDataTypes.BannerStyle)!;
        var alignment = dt.FindDataTypeByName(DropdownDataTypes.TextAlignment)!;
        var textPosition = dt.FindDataTypeByName(DropdownDataTypes.TextPosition)!;

        // --- Content group ---
        const string cg = "content";
        const string cgn = "Content";

        ct.AddPropertyIfMissing(type, cg, cgn, "image", "Image",
            dt.MediaPicker, "Background image for this slide", 0);
        ct.AddPropertyIfMissing(type, cg, cgn, "heading", "Heading",
            dt.Textstring, sortOrder: 1);
        ct.AddPropertyIfMissing(type, cg, cgn, "headingLevel", "Heading Level",
            bannerHeadingLevel, "h1-h6 or size S, M, L", 2);
        ct.AddPropertyIfMissing(type, cg, cgn, "secondaryHeading", "Secondary Heading",
            dt.Textstring, sortOrder: 3);
        ct.AddPropertyIfMissing(type, cg, cgn, "secondaryHeadingSize", "Secondary Heading Size",
            secondarySize, "S, M, L", 4);
        ct.AddPropertyIfMissing(type, cg, cgn, "text", "Text",
            dt.RichText, sortOrder: 5);
        ct.AddPropertyIfMissing(type, cg, cgn, "buttons", "Buttons",
            dt.MultiUrlPicker, "CTA buttons/links", 6);

        // --- Design & Layout group (per-slide settings) ---
        const string dg = "design";
        const string dgn = "Design & Layout";

        ct.AddPropertyIfMissing(type, dg, dgn, "colorScheme", "Color Scheme",
            dt.Textstring, "Slug matching a color scheme", 0, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, dg, dgn, "bannerStyle", "Banner Style",
            bannerStyle, "takeover, medium, short, scale", 1, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, dg, dgn, "textAlignment", "Text Alignment",
            alignment, "left, center, right", 2, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, dg, dgn, "textPosition", "Text Position",
            textPosition, "3x3 grid position for text overlay", 3, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, dg, dgn, "addColorOverlay", "Add Color Overlay",
            dt.Toggle, "Uses background color from selected color scheme", 4, groupSortOrder: 1);

        // --- Advanced group ---
        const string ag = "advanced";
        const string agn = "Advanced";

        ct.AddPropertyIfMissing(type, ag, agn, "componentName", "Component Name",
            dt.Textstring, "Internal label for this slide", 0, groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, ag, agn, "cssClasses", "Custom Classes",
            dt.Textstring, sortOrder: 1, groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, ag, agn, "hideFromWebsite", "Hide from Website",
            dt.Toggle, sortOrder: 2, groupSortOrder: 2);

        ct.Save(type);
    }

    private static void CreateFormField(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("formField", "Form Field", "icon-autofill");

        var fieldType = dt.FindDataTypeByName(DropdownDataTypes.FormFieldType)!;
        const string g = "field";
        const string gn = "Field";

        ct.AddPropertyIfMissing(type, g, gn, "fieldLabel", "Field Label", dt.Textstring, sortOrder: 0, mandatory: true);
        ct.AddPropertyIfMissing(type, g, gn, "fieldType", "Field Type", fieldType, "text, email, tel, textarea, select, checkbox", 1);
        ct.AddPropertyIfMissing(type, g, gn, "required", "Required", dt.Toggle, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "placeholder", "Placeholder", dt.Textstring, sortOrder: 3);
        ct.AddPropertyIfMissing(type, g, gn, "options", "Options", dt.Textarea, "One option per line (for select fields)", 4);

        ct.Save(type);
    }
}
