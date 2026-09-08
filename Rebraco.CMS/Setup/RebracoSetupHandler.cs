using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.DocumentTypes;
using Rebraco.CMS.Setup.Helpers;
using Umbraco.Cms.Core.Events;
using Umbraco.Cms.Core.Notifications;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Serialization;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;

namespace Rebraco.CMS.Setup;

public class RebracoSetupHandler : INotificationHandler<UmbracoApplicationStartedNotification>
{
    private readonly IContentTypeService _cts;
    private readonly IDataTypeService _dts;
    private readonly IShortStringHelper _ssh;
    private readonly PropertyEditorCollection _editors;
    private readonly IConfigurationEditorJsonSerializer _serializer;
    private readonly ILogger<RebracoSetupHandler> _logger;
    private readonly ILoggerFactory _loggerFactory;

    public RebracoSetupHandler(
        IContentTypeService contentTypeService,
        IDataTypeService dataTypeService,
        IShortStringHelper shortStringHelper,
        PropertyEditorCollection propertyEditors,
        IConfigurationEditorJsonSerializer serializer,
        ILogger<RebracoSetupHandler> logger,
        ILoggerFactory loggerFactory)
    {
        _cts = contentTypeService;
        _dts = dataTypeService;
        _ssh = shortStringHelper;
        _editors = propertyEditors;
        _serializer = serializer;
        _logger = logger;
        _loggerFactory = loggerFactory;
    }

    public void Handle(UmbracoApplicationStartedNotification notification)
    {
        var dtHelper = new DataTypeHelper(_dts, _editors, _serializer,
            _loggerFactory.CreateLogger<DataTypeHelper>());

        var ctHelper = new ContentTypeHelper(_cts, _ssh,
            _loggerFactory.CreateLogger<ContentTypeHelper>());

        // Early-exit: if the last types exist, setup has already run.
        // Still run idempotent updates for migrations and new features.
        if (_cts.Get("formBlock") != null && _cts.Get("blogPost") != null
            && _cts.Get("design") != null && _cts.Get("generalSettings") != null)
        {
            // Idempotent updates — all use GetOrCreate, fast no-ops when already present.
            // Run full Phases 1-8 + extras so new blocks/properties are always applied.
            DropdownDataTypes.EnsureAll(dtHelper);
            DesignDropdownDataTypes.EnsureAll(dtHelper);
            GlobalDocumentTypes.MigrateSettingsProperties(ctHelper);
            DesignDocumentType.EnsureAll(ctHelper, dtHelper);

            // Phases 2-8: block pipeline (nested elements → block lists → settings → blocks → grids → pages)
            NestedElementTypes.EnsureAll(ctHelper, dtHelper);
            BlockListDataTypes.EnsureAll(dtHelper, _cts);
            BlockSettingsType.EnsureAll(ctHelper, dtHelper);
            BlockElementTypes.EnsureAll(ctHelper, dtHelper);
            BlockGridDataType.EnsureAll(dtHelper, _cts);
            PageDocumentTypes.EnsureAll(ctHelper, dtHelper, _cts);

            // Rental types
            RentalDataTypes.EnsureAll(dtHelper);
            RentalDocumentTypes.EnsureAll(ctHelper, dtHelper, _cts);

            // Folder organization
            FolderOrganization.EnsureAll(_cts, _logger);

            _logger.LogInformation("Rebraco: Document types already exist, ran idempotent updates.");
            return;
        }

        _logger.LogInformation("Rebraco: Starting document type setup...");

        try
        {
            // Phase 1: Custom dropdown/picker data types
            DropdownDataTypes.EnsureAll(dtHelper);
            _logger.LogInformation("Rebraco: Phase 1 complete - Custom data types");

            // Phase 2: Nested element types (colorSchemeItem, podItem, etc.)
            NestedElementTypes.EnsureAll(ctHelper, dtHelper);
            _logger.LogInformation("Rebraco: Phase 2 complete - Nested element types");

            // Phase 3: Block List data types (configured with nested element keys)
            BlockListDataTypes.EnsureAll(dtHelper, _cts);
            _logger.LogInformation("Rebraco: Phase 3 complete - Block List data types");

            // Phase 4: Block settings element type
            BlockSettingsType.EnsureAll(ctHelper, dtHelper);
            _logger.LogInformation("Rebraco: Phase 4 complete - Block settings type");

            // Phase 5: Block content element types (15 blocks)
            BlockElementTypes.EnsureAll(ctHelper, dtHelper);
            _logger.LogInformation("Rebraco: Phase 5 complete - Block element types");

            // Phase 6: Block Grid data types
            BlockGridDataType.EnsureAll(dtHelper, _cts);
            _logger.LogInformation("Rebraco: Phase 6 complete - Block Grid data types");

            // Phase 7: Global document types (settings, navigation, footer)
            GlobalDocumentTypes.EnsureAll(ctHelper, dtHelper);
            _logger.LogInformation("Rebraco: Phase 7 complete - Global document types");

            // Phase 8: Page document types (standardPage, blogLanding, blogPost, home update)
            PageDocumentTypes.EnsureAll(ctHelper, dtHelper, _cts);
            _logger.LogInformation("Rebraco: Phase 8 complete - Page document types");

            // Phase 9: Design dropdown data types
            DesignDropdownDataTypes.EnsureAll(dtHelper);
            _logger.LogInformation("Rebraco: Phase 9 complete - Design dropdown data types");

            // Phase 10: Design nested element types (typographyRule, buttonStyleItem, backgroundLayerItem)
            DesignNestedElements.EnsureAll(ctHelper, dtHelper);
            _logger.LogInformation("Rebraco: Phase 10 complete - Design nested element types");

            // Phase 11: Design Block List data types
            DesignBlockListDataTypes.EnsureAll(dtHelper, _cts);
            _logger.LogInformation("Rebraco: Phase 11 complete - Design Block List data types");

            // Phase 12: Design document type (comprehensive design system)
            DesignDocumentType.EnsureAll(ctHelper, dtHelper);
            _logger.LogInformation("Rebraco: Phase 12 complete - Design document type");

            // Phase 13: General Settings document type (child of Settings)
            GeneralSettingsType.EnsureAll(ctHelper, dtHelper);
            _logger.LogInformation("Rebraco: Phase 13 complete - General Settings type");

            // Phase 14: Configure parent-child relationships (Settings → Navigation, Footer, General)
            GlobalDocumentTypes.ConfigureParentChild(ctHelper);
            _logger.LogInformation("Rebraco: Phase 14 complete - Parent-child relationships");

            // Phase 15: Rental data types (dropdowns for property type, pricing, gender, etc.)
            RentalDataTypes.EnsureAll(dtHelper);
            _logger.LogInformation("Rebraco: Phase 15 complete - Rental data types");

            // Phase 16: Rental document types (propertyListing, property, unit) + parent-child
            RentalDocumentTypes.EnsureAll(ctHelper, dtHelper, _cts);
            _logger.LogInformation("Rebraco: Phase 16 complete - Rental document types");

            // Phase 17: Organize document types into folders in Settings tree
            FolderOrganization.EnsureAll(_cts, _logger);
            _logger.LogInformation("Rebraco: Phase 17 complete - Folder organization");

            _logger.LogInformation("Rebraco: Document type setup complete (17 phases).");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Rebraco: Document type setup failed at a phase.");
            throw;
        }
    }
}
