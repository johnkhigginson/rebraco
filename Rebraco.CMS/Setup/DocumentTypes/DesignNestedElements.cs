using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class DesignNestedElements
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt)
    {
        CreateTypographyRule(ct, dt);
        CreateButtonStyleItem(ct, dt);
        CreateBackgroundLayerItem(ct, dt);
    }

    private static void CreateTypographyRule(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("typographyRule", "Typography Rule", "icon-font",
            "Per-selector typography override (H1-H6, body, small, etc.)");

        var eyeDropper = dt.FindDataTypeByName(DropdownDataTypes.EyeDropperColor)!;
        var fontWeight = dt.FindDataTypeByName(DesignDropdownDataTypes.FontWeight)!;
        var lineHeight = dt.FindDataTypeByName(DesignDropdownDataTypes.LineHeight)!;
        var letterSpacing = dt.FindDataTypeByName(DesignDropdownDataTypes.LetterSpacing)!;
        var textTransform = dt.FindDataTypeByName(DesignDropdownDataTypes.TextTransform)!;
        const string g = "typography";
        const string gn = "Typography";

        ct.AddPropertyIfMissing(type, g, gn, "selector", "Selector", dt.Textstring,
            "CSS selector label (e.g., H1, H2, Body, Small)", 0, mandatory: true);
        ct.AddPropertyIfMissing(type, g, gn, "fontFamily", "Font Family", dt.Textstring,
            "Google Font family override", 1);
        ct.AddPropertyIfMissing(type, g, gn, "fontSize", "Font Size", dt.Textstring,
            "e.g., 3rem, 48px", 2);
        ct.AddPropertyIfMissing(type, g, gn, "fontSizeMobile", "Font Size (Mobile)", dt.Textstring,
            "Responsive override for smaller screens", 3);
        ct.AddPropertyIfMissing(type, g, gn, "fontWeight", "Font Weight", fontWeight, sortOrder: 4);
        ct.AddPropertyIfMissing(type, g, gn, "lineHeight", "Line Height", lineHeight, sortOrder: 5);
        ct.AddPropertyIfMissing(type, g, gn, "letterSpacing", "Letter Spacing", letterSpacing, sortOrder: 6);
        ct.AddPropertyIfMissing(type, g, gn, "textTransform", "Text Transform", textTransform, sortOrder: 7);
        ct.AddPropertyIfMissing(type, g, gn, "color", "Color", eyeDropper,
            "Default color for this element", 8);
        ct.AddPropertyIfMissing(type, g, gn, "marginTop", "Margin Top", dt.Textstring,
            "e.g., 0.5em", 9);
        ct.AddPropertyIfMissing(type, g, gn, "marginBottom", "Margin Bottom", dt.Textstring,
            "e.g., 1em", 10);

        ct.Save(type);
    }

    private static void CreateButtonStyleItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("buttonStyleItem", "Button Style", "icon-brush",
            "Named button style definition (Primary, Secondary, Ghost)");

        var eyeDropper = dt.FindDataTypeByName(DropdownDataTypes.EyeDropperColor)!;
        var borderWidth = dt.FindDataTypeByName(DesignDropdownDataTypes.BorderWidth)!;
        const string g = "button";
        const string gn = "Button";

        ct.AddPropertyIfMissing(type, g, gn, "styleName", "Style Name", dt.Textstring,
            "e.g., Primary, Secondary, Ghost", 0, mandatory: true);
        ct.AddPropertyIfMissing(type, g, gn, "bgColor", "Background Color", eyeDropper, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "textColor", "Text Color", eyeDropper, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "borderColor", "Border Color", eyeDropper, sortOrder: 3);
        ct.AddPropertyIfMissing(type, g, gn, "hoverBgColor", "Hover Background", eyeDropper, sortOrder: 4);
        ct.AddPropertyIfMissing(type, g, gn, "hoverTextColor", "Hover Text Color", eyeDropper, sortOrder: 5);
        ct.AddPropertyIfMissing(type, g, gn, "hoverBorderColor", "Hover Border Color", eyeDropper, sortOrder: 6);
        ct.AddPropertyIfMissing(type, g, gn, "borderWidth", "Border Width", borderWidth, sortOrder: 7);

        ct.Save(type);
    }

    private static void CreateBackgroundLayerItem(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("backgroundLayerItem", "Background Layer", "icon-picture",
            "Background image layer configuration");

        var bgSize = dt.FindDataTypeByName(DesignDropdownDataTypes.BackgroundSize)!;
        var bgPosition = dt.FindDataTypeByName(DesignDropdownDataTypes.BackgroundPosition)!;
        var bgAttachment = dt.FindDataTypeByName(DesignDropdownDataTypes.BackgroundAttachment)!;
        const string g = "background";
        const string gn = "Background";

        ct.AddPropertyIfMissing(type, g, gn, "layerName", "Layer Name", dt.Textstring,
            "Descriptive label for this layer", 0);
        ct.AddPropertyIfMissing(type, g, gn, "bgImage", "Background Image", dt.MediaPicker, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "bgSize", "Background Size", bgSize, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "bgPosition", "Background Position", bgPosition, sortOrder: 3);
        ct.AddPropertyIfMissing(type, g, gn, "bgAttachment", "Background Attachment", bgAttachment, sortOrder: 4);

        ct.Save(type);
    }
}
