using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DataTypes;

public static class DesignDropdownDataTypes
{
    // Typography dropdowns
    public const string FontWeight = "Rebraco - Font Weight";
    public const string TextTransform = "Rebraco - Text Transform";
    public const string LetterSpacing = "Rebraco - Letter Spacing";
    public const string LineHeight = "Rebraco - Line Height";

    // Borders & Effects dropdowns
    public const string BorderRadius = "Rebraco - Border Radius";
    public const string ShadowSize = "Rebraco - Shadow Size";
    public const string BorderWidth = "Rebraco - Border Width";

    // Animation dropdowns
    public const string AnimationSpeed = "Rebraco - Animation Speed";
    public const string HoverEffect = "Rebraco - Hover Effect";

    // Font style
    public const string FontStyle = "Rebraco - Font Style";

    // Button dropdowns
    public const string ButtonRadius = "Rebraco - Button Radius";
    public const string ButtonSize = "Rebraco - Button Size";

    // Background dropdowns
    public const string BackgroundAttachment = "Rebraco - Background Attachment";
    public const string BackgroundSize = "Rebraco - Background Size";
    public const string BackgroundPosition = "Rebraco - Background Position";

    public static void EnsureAll(DataTypeHelper dt)
    {
        // Typography
        dt.GetOrCreateDropdown(FontWeight, false, "300", "400", "500", "600", "700", "800");
        dt.GetOrCreateDropdown(TextTransform, false, "none", "uppercase", "lowercase", "capitalize");
        dt.GetOrCreateDropdown(LetterSpacing, false, "tight", "normal", "wide", "wider");
        dt.GetOrCreateDropdown(LineHeight, false, "tight", "snug", "normal", "relaxed", "loose");

        // Font style
        dt.GetOrCreateDropdown(FontStyle, false, "normal", "italic");

        // Borders & Effects
        dt.GetOrCreateDropdown(BorderRadius, false, "none", "sm", "md", "lg", "xl", "full");
        dt.GetOrCreateDropdown(ShadowSize, false, "none", "sm", "md", "lg", "xl", "2xl");
        dt.GetOrCreateDropdown(BorderWidth, false, "0", "1", "2", "4");

        // Animations
        dt.GetOrCreateDropdown(AnimationSpeed, false, "none", "slow", "normal", "fast");
        dt.GetOrCreateDropdown(HoverEffect, false, "none", "lift", "glow", "scale", "darken");

        // Buttons
        dt.GetOrCreateDropdown(ButtonRadius, false, "none", "sm", "md", "lg", "full");
        dt.GetOrCreateDropdown(ButtonSize, false, "sm", "md", "lg");

        // Background
        dt.GetOrCreateDropdown(BackgroundAttachment, false, "scroll", "fixed");
        dt.GetOrCreateDropdown(BackgroundSize, false, "cover", "contain", "auto");
        dt.GetOrCreateDropdown(BackgroundPosition, false, "center", "top", "bottom", "left", "right");
    }
}
