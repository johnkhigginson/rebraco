using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Models;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Setup.Helpers;

public class DataTypeHelper
{
    private readonly IDataTypeService _dts;
    private readonly PropertyEditorCollection _editors;
    private readonly IConfigurationEditorJsonSerializer _serializer;
    private readonly ILogger<DataTypeHelper> _logger;
    private readonly Dictionary<string, IDataType> _builtInCache = new();

    public DataTypeHelper(
        IDataTypeService dataTypeService,
        PropertyEditorCollection propertyEditors,
        IConfigurationEditorJsonSerializer serializer,
        ILogger<DataTypeHelper> logger)
    {
        _dts = dataTypeService;
        _editors = propertyEditors;
        _serializer = serializer;
        _logger = logger;
    }

    public IDataType? FindDataTypeByName(string name)
    {
        return _dts.GetAll().FirstOrDefault(dt => dt.Name == name);
    }

    public IDataType FindBuiltInDataType(string editorAlias)
    {
        if (_builtInCache.TryGetValue(editorAlias, out var cached))
            return cached;

        var dt = _dts.GetAll().FirstOrDefault(d => d.EditorAlias == editorAlias);
        if (dt == null)
        {
            // Umbraco 17 may not ship certain built-in data types — create on demand.
            if (!_editors.TryGet(editorAlias, out var editor))
                throw new InvalidOperationException($"Property editor '{editorAlias}' not found.");

            var uiAlias = editorAlias switch
            {
                Constants.PropertyEditors.Aliases.TextArea => "Umb.PropertyEditorUi.TextArea",
                Constants.PropertyEditors.Aliases.TextBox => "Umb.PropertyEditorUi.TextBox",
                Constants.PropertyEditors.Aliases.RichText => "Umb.PropertyEditorUi.Tiptap",
                Constants.PropertyEditors.Aliases.Boolean => "Umb.PropertyEditorUi.Toggle",
                Constants.PropertyEditors.Aliases.Integer => "Umb.PropertyEditorUi.Integer",
                Constants.PropertyEditors.Aliases.DateTime => "Umb.PropertyEditorUi.DatePicker",
                Constants.PropertyEditors.Aliases.Tags => "Umb.PropertyEditorUi.Tags",
                Constants.PropertyEditors.Aliases.MediaPicker3 => "Umb.PropertyEditorUi.MediaPicker",
                Constants.PropertyEditors.Aliases.MultiUrlPicker => "Umb.PropertyEditorUi.MultiUrlPicker",
                Constants.PropertyEditors.Aliases.ContentPicker => "Umb.PropertyEditorUi.ContentPicker",
                _ => $"Umb.PropertyEditorUi.{editorAlias.Replace("Umbraco.", "")}"
            };

            // Friendly name from alias: "Umbraco.TextArea" → "Textarea"
            var friendlyName = editorAlias.Replace("Umbraco.", "").Replace(".", " ");

            dt = new DataType(editor, _serializer, -1)
            {
                Name = friendlyName,
                EditorUiAlias = uiAlias
            };
            _dts.Save(dt);
            dt = _dts.GetDataType(dt.Id)!;
            _logger.LogInformation("Rebraco: Auto-created missing built-in data type '{Name}' ({Alias})", friendlyName, editorAlias);
        }

        _builtInCache[editorAlias] = dt;
        return dt;
    }

    // --- Textstring, Textarea, RichText, Boolean, MediaPicker, ContentPicker, DateTime, Integer, Tags ---

    public IDataType Textstring => FindBuiltInDataType(Constants.PropertyEditors.Aliases.TextBox);
    public IDataType Textarea => FindBuiltInDataType(Constants.PropertyEditors.Aliases.TextArea);
    public IDataType RichText => FindBuiltInDataType(Constants.PropertyEditors.Aliases.RichText);
    public IDataType Toggle => FindBuiltInDataType(Constants.PropertyEditors.Aliases.Boolean);
    public IDataType MediaPicker => FindBuiltInDataType(Constants.PropertyEditors.Aliases.MediaPicker3);
    public IDataType MultiUrlPicker => FindBuiltInDataType(Constants.PropertyEditors.Aliases.MultiUrlPicker);
    public IDataType ContentPicker => FindBuiltInDataType(Constants.PropertyEditors.Aliases.ContentPicker);
    public IDataType DatePicker => FindBuiltInDataType(Constants.PropertyEditors.Aliases.DateTime);
    public IDataType Numeric => FindBuiltInDataType(Constants.PropertyEditors.Aliases.Integer);
    public IDataType Tags => FindBuiltInDataType(Constants.PropertyEditors.Aliases.Tags);

    // --- Custom data type creation ---

    public IDataType GetOrCreateDropdown(string name, bool multiple, params string[] options)
    {
        var existing = FindDataTypeByName(name);
        if (existing != null)
        {
            // Ensure config uses v17 string list format (fix for legacy dict format)
            var cfg = existing.ConfigurationData;
            if (cfg == null || cfg.ContainsKey("items") && cfg["items"] is not List<string>)
            {
                existing.ConfigurationData = new Dictionary<string, object>
                {
                    ["multiple"] = multiple,
                    ["items"] = options.ToList()
                };
                _dts.Save(existing);
                _logger.LogInformation("Rebraco: Updated dropdown config for '{Name}'", name);
            }
            return existing;
        }

        var editor = _editors[Constants.PropertyEditors.Aliases.DropDownListFlexible];
        var dt = new DataType(editor, _serializer, -1)
        {
            Name = name,
            EditorUiAlias = "Umb.PropertyEditorUi.Dropdown"
        };
        _dts.Save(dt);

        // Re-fetch and configure (v17: items is a simple string list)
        var saved = _dts.GetDataType(dt.Id)!;
        saved.ConfigurationData = new Dictionary<string, object>
        {
            ["multiple"] = multiple,
            ["items"] = options.ToList()
        };
        _dts.Save(saved);

        _logger.LogInformation("Rebraco: Created dropdown data type '{Name}'", name);
        return saved;
    }

    public IDataType GetOrCreateEyeDropper(string name)
    {
        var existing = FindDataTypeByName(name);
        if (existing != null)
        {
            // Fix UI alias if it was set incorrectly (v17: Umb.PropertyEditorUi.EyeDropper)
            if (existing.EditorUiAlias != "Umb.PropertyEditorUi.EyeDropper")
            {
                existing.EditorUiAlias = "Umb.PropertyEditorUi.EyeDropper";
                _dts.Save(existing);
                _logger.LogInformation("Rebraco: Fixed EditorUiAlias for '{Name}'", name);
            }
            return existing;
        }

        var editor = _editors[Constants.PropertyEditors.Aliases.ColorPickerEyeDropper];
        var dt = new DataType(editor, _serializer, -1)
        {
            Name = name,
            EditorUiAlias = "Umb.PropertyEditorUi.EyeDropper"
        };
        _dts.Save(dt);

        var saved = _dts.GetDataType(dt.Id)!;
        saved.ConfigurationData = new Dictionary<string, object>
        {
            ["showAlpha"] = false,
            ["showPalette"] = true
        };
        _dts.Save(saved);

        _logger.LogInformation("Rebraco: Created eye dropper data type '{Name}'", name);
        return saved;
    }

    public IDataType GetOrCreateSingleUrlPicker(string name)
    {
        var existing = FindDataTypeByName(name);
        if (existing != null) return existing;

        var editor = _editors[Constants.PropertyEditors.Aliases.MultiUrlPicker];
        var dt = new DataType(editor, _serializer, -1)
        {
            Name = name,
            EditorUiAlias = "Umb.PropertyEditorUi.MultiUrlPicker"
        };
        _dts.Save(dt);

        var saved = _dts.GetDataType(dt.Id)!;
        saved.ConfigurationData = new Dictionary<string, object>
        {
            ["minNumber"] = 0,
            ["maxNumber"] = 1,
            ["overlaySize"] = "small"
        };
        _dts.Save(saved);

        _logger.LogInformation("Rebraco: Created single URL picker data type '{Name}'", name);
        return saved;
    }

    public IDataType GetOrCreateMultipleMediaPicker(string name)
    {
        var existing = FindDataTypeByName(name);
        if (existing != null) return existing;

        var editor = _editors[Constants.PropertyEditors.Aliases.MediaPicker3];
        var dt = new DataType(editor, _serializer, -1)
        {
            Name = name,
            EditorUiAlias = "Umb.PropertyEditorUi.MediaPicker"
        };
        _dts.Save(dt);

        var saved = _dts.GetDataType(dt.Id)!;
        saved.ConfigurationData = new Dictionary<string, object>
        {
            ["multiple"] = true,
            ["validationLimit"] = new Dictionary<string, object> { ["min"] = 0, ["max"] = 0 }
        };
        _dts.Save(saved);

        _logger.LogInformation("Rebraco: Created multiple media picker data type '{Name}'", name);
        return saved;
    }

    public IDataType GetOrCreateBlockList(string name, params (Guid contentKey, string label)[] blocks)
    {
        var existing = FindDataTypeByName(name);
        if (existing != null) return existing;

        var editor = _editors[Constants.PropertyEditors.Aliases.BlockList];
        var dt = new DataType(editor, _serializer, -1)
        {
            Name = name,
            EditorUiAlias = "Umb.PropertyEditorUi.BlockList"
        };
        _dts.Save(dt);

        var saved = _dts.GetDataType(dt.Id)!;
        saved.ConfigurationData = new Dictionary<string, object>
        {
            ["blocks"] = blocks.Select(b => new Dictionary<string, object>
            {
                ["contentElementTypeKey"] = b.contentKey.ToString(),
                ["label"] = b.label
            }).ToArray(),
            ["useSingleBlockMode"] = false,
            ["useLiveEditing"] = false,
            ["useInlineEditingAsDefault"] = false
        };
        _dts.Save(saved);

        _logger.LogInformation("Rebraco: Created Block List data type '{Name}'", name);
        return saved;
    }

    public IDataType GetOrCreateBlockGrid(
        string name, Guid settingsElementKey,
        (Guid contentKey, string label)[] blocks,
        int[]? columnSpans = null)
    {
        // Delegate to overload with no per-block settings overrides
        var blocksWithOverrides = blocks.Select(b =>
            (b.contentKey, b.label, (Guid?)null)).ToArray();
        return GetOrCreateBlockGrid(name, settingsElementKey, blocksWithOverrides, columnSpans);
    }

    public IDataType GetOrCreateBlockGrid(
        string name, Guid defaultSettingsKey,
        (Guid contentKey, string label, Guid? settingsKeyOverride)[] blocks,
        int[]? columnSpans = null)
    {
        var spans = columnSpans ?? [12, 6, 4];

        var blockConfig = blocks.Select(b => new Dictionary<string, object>
        {
            ["contentElementTypeKey"] = b.contentKey.ToString(),
            ["settingsElementTypeKey"] = (b.settingsKeyOverride ?? defaultSettingsKey).ToString(),
            ["label"] = b.label,
            ["columnSpanOptions"] = spans.Select(s => new Dictionary<string, object>
            {
                ["columnSpan"] = s
            }).ToArray(),
            ["rowMinSpan"] = 1,
            ["rowMaxSpan"] = 1,
            ["allowAtRoot"] = true,
            ["allowInAreas"] = true,
            ["editorSize"] = "medium",
            ["forceHideContentEditorInOverlay"] = false
        }).ToArray();

        var existing = FindDataTypeByName(name);
        if (existing != null)
        {
            // Update existing data type with latest block configuration
            existing.ConfigurationData = new Dictionary<string, object>
            {
                ["blocks"] = blockConfig,
                ["gridColumns"] = 12
            };
            _dts.Save(existing);
            _logger.LogInformation("Rebraco: Updated Block Grid data type '{Name}' ({Count} blocks)", name, blocks.Length);
            return existing;
        }

        var editor = _editors[Constants.PropertyEditors.Aliases.BlockGrid];
        var dt = new DataType(editor, _serializer, -1)
        {
            Name = name,
            EditorUiAlias = "Umb.PropertyEditorUi.BlockGrid"
        };
        _dts.Save(dt);

        var saved = _dts.GetDataType(dt.Id)!;
        saved.ConfigurationData = new Dictionary<string, object>
        {
            ["blocks"] = blockConfig,
            ["gridColumns"] = 12
        };
        _dts.Save(saved);

        _logger.LogInformation("Rebraco: Created Block Grid data type '{Name}' ({Count} blocks)", name, blocks.Length);
        return saved;
    }
}
