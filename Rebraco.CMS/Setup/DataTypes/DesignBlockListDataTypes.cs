using Rebraco.CMS.Setup.Helpers;
using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Setup.DataTypes;

public static class DesignBlockListDataTypes
{
    public const string TypographyRules = "Rebraco - Typography Rules";
    public const string ButtonStyles = "Rebraco - Button Styles";
    public const string BackgroundLayers = "Rebraco - Background Layers";

    public static void EnsureAll(DataTypeHelper dt, IContentTypeService cts)
    {
        dt.GetOrCreateBlockList(TypographyRules,
            (cts.Get("typographyRule")!.Key, "{{selector}}"));

        dt.GetOrCreateBlockList(ButtonStyles,
            (cts.Get("buttonStyleItem")!.Key, "{{styleName}}"));

        dt.GetOrCreateBlockList(BackgroundLayers,
            (cts.Get("backgroundLayerItem")!.Key, "{{layerName}}"));
    }
}
