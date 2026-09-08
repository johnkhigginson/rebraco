using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class DesignDocumentType
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("design", "Design", "icon-brush",
            allowedAsRoot: true, description: "Comprehensive design system configuration (singleton)");

        var eyeDropper = dt.FindDataTypeByName(DropdownDataTypes.EyeDropperColor)!;

        CreateBrandingTab(ct, dt, type);
        CreateColorSchemesTab(ct, dt, type);
        CreateTypographyTab(ct, dt, type, eyeDropper);
        CreateColorsTab(ct, type, eyeDropper);
        CreateHeaderFooterTab(ct, type, eyeDropper);
        CreateButtonsTab(ct, dt, type);
        CreateFormsTab(ct, dt, type, eyeDropper);
        CreateSpacingTab(ct, dt, type);
        CreateComponentTokensTab(ct, dt, type, eyeDropper);
        CreateBordersEffectsTab(ct, dt, type, eyeDropper);
        CreateAnimationsTab(ct, dt, type);
        CreateCustomCodeTab(ct, dt, type);

        ct.Save(type);
    }

    private static void CreateBrandingTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type)
    {
        const string g = "branding";
        const string gn = "Branding";

        ct.AddPropertyIfMissing(type, g, gn, "logo", "Logo", dt.MediaPicker,
            "Site logo displayed in the header", 0, groupSortOrder: 5);
        ct.AddPropertyIfMissing(type, g, gn, "favicon", "Favicon", dt.MediaPicker,
            "Site favicon (ICO, PNG, or SVG)", 1, groupSortOrder: 5);
    }

    private static void CreateColorSchemesTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type)
    {
        var colorSchemes = dt.FindDataTypeByName(BlockListDataTypes.ColorSchemes)!;
        const string g = "colorSchemesTab";
        const string gn = "Color Schemes";

        ct.AddPropertyIfMissing(type, g, gn, "colorSchemes", "Color Schemes",
            colorSchemes, "Named color scheme definitions", 0, groupSortOrder: 7);
    }

    private static void CreateTypographyTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type, Umbraco.Cms.Core.Models.IDataType eyeDropper)
    {
        var typographyRules = dt.FindDataTypeByName(DesignBlockListDataTypes.TypographyRules)!;
        var letterSpacing = dt.FindDataTypeByName(DesignDropdownDataTypes.LetterSpacing)!;
        var textTransform = dt.FindDataTypeByName(DesignDropdownDataTypes.TextTransform)!;
        var lineHeight = dt.FindDataTypeByName(DesignDropdownDataTypes.LineHeight)!;
        var fontStyle = dt.FindDataTypeByName(DesignDropdownDataTypes.FontStyle)!;
        const string g = "typography";
        const string gn = "Typography";

        ct.AddPropertyIfMissing(type, g, gn, "headingFont", "Heading Font", dt.Textstring,
            "Google Font family for headings", 0, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "bodyFont", "Body Font", dt.Textstring,
            "Google Font family for body text", 1, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "displayFont", "Display Font", dt.Textstring,
            "Google Font for hero/display headings", 2, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "monoFont", "Mono Font", dt.Textstring,
            "Google Font family for code blocks", 3, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "baseFontSize", "Base Font Size", dt.Textstring,
            "e.g., 16px", 4, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "typographyRules", "Typography Rules", typographyRules,
            "Per-selector overrides (H1-H6, body, small, etc.)", 5, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "headingLetterSpacing", "Heading Letter Spacing", letterSpacing,
            "Global letter spacing for headings", 6, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "headingTextTransform", "Heading Text Transform", textTransform,
            "Global text transform for headings", 7, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "bodyLineHeight", "Body Line Height", lineHeight,
            "Default line height for body text", 8, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "blockquoteFontStyle", "Blockquote Style", fontStyle,
            "Font style for blockquotes", 9, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "blockquoteBorderColor", "Blockquote Border", eyeDropper,
            "Blockquote left border color", 10, groupSortOrder: 10);
        ct.AddPropertyIfMissing(type, g, gn, "leadFontSize", "Lead Paragraph Size", dt.Textstring,
            "e.g., 1.25rem", 11, groupSortOrder: 10);
    }

    private static void CreateColorsTab(ContentTypeHelper ct,
        Umbraco.Cms.Core.Models.IContentType type, Umbraco.Cms.Core.Models.IDataType eyeDropper)
    {
        const string g = "colors";
        const string gn = "Colors";

        ct.AddPropertyIfMissing(type, g, gn, "primaryColor", "Primary Color", eyeDropper,
            "Brand primary color", 0, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "secondaryColor", "Secondary Color", eyeDropper,
            "Brand secondary color", 1, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "accentColor", "Accent Color", eyeDropper,
            "Highlights and CTAs", 2, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "textColor", "Text Color", eyeDropper,
            "Default body text color", 3, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "textMutedColor", "Text Muted Color", eyeDropper,
            "Secondary/muted text color", 4, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "headingColor", "Heading Color", eyeDropper,
            "Default heading color", 5, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "linkColor", "Link Color", eyeDropper,
            "Inline link color", 6, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "linkHoverColor", "Link Hover Color", eyeDropper,
            "Link hover state color", 7, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "backgroundColor", "Background Color", eyeDropper,
            "Site background color", 8, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "surfaceColor", "Surface Color", eyeDropper,
            "Cards, panels background color", 9, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "borderColor", "Border Color", eyeDropper,
            "Default border color", 10, groupSortOrder: 20);
        // Expanded colors
        ct.AddPropertyIfMissing(type, g, gn, "linkVisitedColor", "Link Visited Color", eyeDropper,
            "Visited link color", 11, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "overlayColor", "Overlay Color", eyeDropper,
            "Modal/lightbox backdrop color", 12, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "dividerColor", "Divider Color", eyeDropper,
            "Section separator/divider color", 13, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "shadowColor", "Shadow Color", eyeDropper,
            "Box-shadow tint color", 14, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "selectionBgColor", "Selection Background", eyeDropper,
            "Text selection highlight color", 15, groupSortOrder: 20);
        ct.AddPropertyIfMissing(type, g, gn, "selectionTextColor", "Selection Text", eyeDropper,
            "Text color when selected", 16, groupSortOrder: 20);
    }

    private static void CreateHeaderFooterTab(ContentTypeHelper ct,
        Umbraco.Cms.Core.Models.IContentType type, Umbraco.Cms.Core.Models.IDataType eyeDropper)
    {
        const string g = "headerFooter";
        const string gn = "Header & Footer";

        // Header colors
        ct.AddPropertyIfMissing(type, g, gn, "headerBgColor", "Header Background", eyeDropper,
            "Header background color", 0, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "headerTextColor", "Header Text", eyeDropper,
            "Header text/logo color", 1, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "headerNavColor", "Nav Link Color", eyeDropper,
            "Navigation link default color", 2, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "headerNavHoverColor", "Nav Link Hover", eyeDropper,
            "Navigation link hover color", 3, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "headerNavActiveColor", "Nav Link Active", eyeDropper,
            "Active navigation link color", 4, groupSortOrder: 30);

        // Footer colors
        ct.AddPropertyIfMissing(type, g, gn, "footerBgColor", "Footer Background", eyeDropper,
            "Footer background color", 5, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "footerTextColor", "Footer Text", eyeDropper,
            "Footer text color", 6, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "footerHeadingColor", "Footer Heading", eyeDropper,
            "Footer section heading color", 7, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "footerLinkColor", "Footer Link Color", eyeDropper,
            "Footer link color", 8, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "footerLinkHoverColor", "Footer Link Hover", eyeDropper,
            "Footer link hover color", 9, groupSortOrder: 30);
        ct.AddPropertyIfMissing(type, g, gn, "footerBorderColor", "Footer Border", eyeDropper,
            "Footer border/separator color", 10, groupSortOrder: 30);
    }

    private static void CreateButtonsTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type)
    {
        var buttonRadius = dt.FindDataTypeByName(DesignDropdownDataTypes.ButtonRadius)!;
        var buttonSize = dt.FindDataTypeByName(DesignDropdownDataTypes.ButtonSize)!;
        var fontWeight = dt.FindDataTypeByName(DesignDropdownDataTypes.FontWeight)!;
        var textTransform = dt.FindDataTypeByName(DesignDropdownDataTypes.TextTransform)!;
        var buttonStyles = dt.FindDataTypeByName(DesignBlockListDataTypes.ButtonStyles)!;
        const string g = "buttons";
        const string gn = "Buttons";

        ct.AddPropertyIfMissing(type, g, gn, "buttonRadius", "Button Radius", buttonRadius,
            "Global button border radius", 0, groupSortOrder: 40);
        ct.AddPropertyIfMissing(type, g, gn, "buttonSize", "Default Button Size", buttonSize,
            "sm, md, lg", 1, groupSortOrder: 40);
        ct.AddPropertyIfMissing(type, g, gn, "buttonFontWeight", "Button Font Weight", fontWeight,
            sortOrder: 2, groupSortOrder: 40);
        ct.AddPropertyIfMissing(type, g, gn, "buttonTextTransform", "Button Text Transform", textTransform,
            sortOrder: 3, groupSortOrder: 40);
        ct.AddPropertyIfMissing(type, g, gn, "buttonStyles", "Button Styles", buttonStyles,
            "Define Primary, Secondary, Ghost button styles", 4, groupSortOrder: 40);
    }

    private static void CreateFormsTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type, Umbraco.Cms.Core.Models.IDataType eyeDropper)
    {
        var borderRadius = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderRadius)!;
        var borderWidth = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderWidth)!;
        var fontWeight = dt.FindDataTypeByName(DesignDropdownDataTypes.FontWeight)!;
        const string g = "forms";
        const string gn = "Forms & Inputs";

        ct.AddPropertyIfMissing(type, g, gn, "inputBgColor", "Input Background", eyeDropper,
            "Form field background color", 0, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputBorderColor", "Input Border Color", eyeDropper,
            "Form field border color", 1, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputTextColor", "Input Text Color", eyeDropper,
            "Form field text color", 2, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputPlaceholderColor", "Placeholder Color", eyeDropper,
            "Placeholder text color", 3, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputFocusBorderColor", "Focus Border Color", eyeDropper,
            "Border color on focus", 4, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputErrorBorderColor", "Error Border Color", eyeDropper,
            "Border color on validation error", 5, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputBorderRadius", "Input Border Radius", borderRadius,
            "Form field border radius", 6, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputBorderWidth", "Input Border Width", borderWidth,
            "Form field border width", 7, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputPaddingX", "Horizontal Padding", dt.Textstring,
            "e.g., 1rem", 8, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "inputPaddingY", "Vertical Padding", dt.Textstring,
            "e.g., 0.75rem", 9, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "labelFontSize", "Label Font Size", dt.Textstring,
            "e.g., 0.875rem", 10, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "labelFontWeight", "Label Font Weight", fontWeight,
            "Label text weight", 11, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "labelColor", "Label Color", eyeDropper,
            "Label text color", 12, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "formFieldGap", "Field Spacing", dt.Textstring,
            "Gap between form fields, e.g., 1.5rem", 13, groupSortOrder: 45);
        ct.AddPropertyIfMissing(type, g, gn, "checkboxAccentColor", "Checkbox/Radio Accent", eyeDropper,
            "Accent color for checkboxes and radios", 14, groupSortOrder: 45);
    }

    private static void CreateSpacingTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type)
    {
        var borderRadius = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderRadius)!;
        var shadowSize = dt.FindDataTypeByName(DesignDropdownDataTypes.ShadowSize)!;
        var borderWidth = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderWidth)!;
        const string g = "spacingLayout";
        const string gn = "Spacing & Layout";

        ct.AddPropertyIfMissing(type, g, gn, "maxContentWidth", "Max Content Width", dt.Textstring,
            "e.g., 1280px", 0, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "siteGutter", "Site Gutter", dt.Textstring,
            "Horizontal padding, e.g., 1.5rem", 1, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "sectionSpacingSmall", "Section Spacing Small", dt.Textstring,
            "e.g., 1.5rem", 2, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "sectionSpacingMedium", "Section Spacing Medium", dt.Textstring,
            "e.g., 3rem", 3, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "sectionSpacingLarge", "Section Spacing Large", dt.Textstring,
            "e.g., 5rem", 4, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "sectionSpacingXl", "Section Spacing XL", dt.Textstring,
            "e.g., 8rem", 5, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "cardPadding", "Card Padding", dt.Textstring,
            "e.g., 2rem", 6, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "cardGap", "Card Gap", dt.Textstring,
            "Grid gap between cards, e.g., 2rem", 7, groupSortOrder: 50);
        // Card-specific design tokens
        ct.AddPropertyIfMissing(type, g, gn, "cardBorderRadius", "Card Border Radius", borderRadius,
            "Card border radius override", 8, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "cardShadow", "Card Shadow", shadowSize,
            "Card box-shadow size", 9, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "cardHoverShadow", "Card Hover Shadow", shadowSize,
            "Card shadow on hover", 10, groupSortOrder: 50);
        ct.AddPropertyIfMissing(type, g, gn, "cardBorderWidth", "Card Border Width", borderWidth,
            "Card border width", 11, groupSortOrder: 50);
    }

    private static void CreateComponentTokensTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type, Umbraco.Cms.Core.Models.IDataType eyeDropper)
    {
        var borderRadius = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderRadius)!;
        var shadowSize = dt.FindDataTypeByName(DesignDropdownDataTypes.ShadowSize)!;
        var borderWidth = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderWidth)!;
        const string g = "componentTokens";
        const string gn = "Component Tokens";

        // Badges
        ct.AddPropertyIfMissing(type, g, gn, "badgeRadius", "Badge Border Radius", borderRadius,
            "Badge/tag border radius", 0, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "badgePadding", "Badge Padding", dt.Textstring,
            "e.g., 0.25rem 0.75rem", 1, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "badgeFontSize", "Badge Font Size", dt.Textstring,
            "e.g., 0.75rem", 2, groupSortOrder: 55);

        // Tables
        ct.AddPropertyIfMissing(type, g, gn, "tableHeaderBg", "Table Header Background", eyeDropper,
            "Table header row background", 3, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "tableBorderColor", "Table Border Color", eyeDropper,
            "Table border/separator color", 4, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "tableStripeBg", "Table Stripe Background", eyeDropper,
            "Alternating row background", 5, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "tableHoverBg", "Table Row Hover", eyeDropper,
            "Row hover background", 6, groupSortOrder: 55);

        // Modals
        ct.AddPropertyIfMissing(type, g, gn, "modalBg", "Modal Background", eyeDropper,
            "Modal/dialog background", 7, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "modalRadius", "Modal Border Radius", borderRadius,
            "Modal border radius", 8, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "modalShadow", "Modal Shadow", shadowSize,
            "Modal box-shadow", 9, groupSortOrder: 55);

        // Tooltips
        ct.AddPropertyIfMissing(type, g, gn, "tooltipBg", "Tooltip Background", eyeDropper,
            "Tooltip background color", 10, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "tooltipTextColor", "Tooltip Text", eyeDropper,
            "Tooltip text color", 11, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "tooltipRadius", "Tooltip Border Radius", borderRadius,
            "Tooltip border radius", 12, groupSortOrder: 55);

        // Alerts
        ct.AddPropertyIfMissing(type, g, gn, "alertRadius", "Alert Border Radius", borderRadius,
            "Alert/notification border radius", 13, groupSortOrder: 55);
        ct.AddPropertyIfMissing(type, g, gn, "alertBorderWidth", "Alert Border Width", borderWidth,
            "Alert/notification border width", 14, groupSortOrder: 55);
    }

    private static void CreateBordersEffectsTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type, Umbraco.Cms.Core.Models.IDataType eyeDropper)
    {
        var borderRadius = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderRadius)!;
        var shadowSize = dt.FindDataTypeByName(DesignDropdownDataTypes.ShadowSize)!;
        var borderWidth = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderWidth)!;
        const string g = "bordersEffects";
        const string gn = "Borders & Effects";

        ct.AddPropertyIfMissing(type, g, gn, "defaultBorderRadius", "Default Border Radius", borderRadius,
            "Cards, inputs border radius", 0, groupSortOrder: 60);
        ct.AddPropertyIfMissing(type, g, gn, "defaultShadow", "Default Shadow", shadowSize,
            "Cards, panels shadow", 1, groupSortOrder: 60);
        ct.AddPropertyIfMissing(type, g, gn, "hoverShadow", "Hover Shadow", shadowSize,
            "Cards on hover", 2, groupSortOrder: 60);
        ct.AddPropertyIfMissing(type, g, gn, "defaultBorderWidth", "Default Border Width", borderWidth,
            sortOrder: 3, groupSortOrder: 60);
        ct.AddPropertyIfMissing(type, g, gn, "focusRingColor", "Focus Ring Color", eyeDropper,
            "Form focus ring color", 4, groupSortOrder: 60);
        ct.AddPropertyIfMissing(type, g, gn, "focusRingWidth", "Focus Ring Width", dt.Textstring,
            "e.g., 2px", 5, groupSortOrder: 60);
    }

    private static void CreateAnimationsTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type)
    {
        var animationSpeed = dt.FindDataTypeByName(DesignDropdownDataTypes.AnimationSpeed)!;
        var hoverEffect = dt.FindDataTypeByName(DesignDropdownDataTypes.HoverEffect)!;
        const string g = "animations";
        const string gn = "Animations";

        ct.AddPropertyIfMissing(type, g, gn, "animationSpeed", "Global Animation Speed", animationSpeed,
            "Transition duration for all interactive elements", 0, groupSortOrder: 70);
        ct.AddPropertyIfMissing(type, g, gn, "hoverEffect", "Default Hover Effect", hoverEffect,
            "Card/link hover effect", 1, groupSortOrder: 70);
        ct.AddPropertyIfMissing(type, g, gn, "enableScrollAnimations", "Enable Scroll Animations", dt.Toggle,
            "Fade-in elements on scroll", 2, groupSortOrder: 70);
        ct.AddPropertyIfMissing(type, g, gn, "reducedMotion", "Respect Reduced Motion", dt.Toggle,
            "Honor prefers-reduced-motion setting", 3, groupSortOrder: 70);
    }

    private static void CreateCustomCodeTab(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type)
    {
        const string g = "customCode";
        const string gn = "Custom Code";

        ct.AddPropertyIfMissing(type, g, gn, "customCss", "Custom CSS", dt.Textarea,
            "Custom CSS injected into the page", 0, groupSortOrder: 80);
        ct.AddPropertyIfMissing(type, g, gn, "customHeadHtml", "Custom Head HTML", dt.Textarea,
            "HTML injected into <head>", 1, groupSortOrder: 80);
        ct.AddPropertyIfMissing(type, g, gn, "customBodyEndHtml", "Custom Body End HTML", dt.Textarea,
            "HTML injected before </body>", 2, groupSortOrder: 80);
    }
}
