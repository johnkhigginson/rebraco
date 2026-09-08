using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class BlockElementTypes
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt)
    {
        // Existing blocks (verify only - GetOrCreate is a no-op if they exist)
        ct.GetOrCreateElementType("splitContent", "Split Content", "icon-split");

        // New blocks
        CreateBanner(ct, dt);
        CreatePods(ct, dt);
        CreateTextBlock(ct, dt);
        CreateCtaStrip(ct, dt);
        CreateGridLayout(ct, dt);
        CreateAccordionTabs(ct, dt);
        CreateGallery(ct, dt);
        CreateAlertBox(ct, dt);
        CreateLinksBlock(ct, dt);
        CreateEmbedBlock(ct, dt);
        CreateDataList(ct, dt);
        CreateAnchorNav(ct, dt);
        CreateSubpageListing(ct, dt);
        CreateFormBlock(ct, dt);
        CreateFeaturedProperties(ct, dt);
        CreatePropertyGrid(ct, dt);
    }

    private static void CreateBanner(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("banner", "Banner", "icon-picture",
            "Banner/carousel block containing one or more slides");

        var bannerItems = dt.FindDataTypeByName(BlockListDataTypes.BannerItems)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "slides", "Slides",
            bannerItems, "Banner slides (add multiple for a carousel)", 0);

        ct.Save(type);
    }

    private static void CreatePods(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("pods", "Pods", "icon-thumbnail-list");

        var podItems = dt.FindDataTypeByName(BlockListDataTypes.PodItems)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "headline", "Headline", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "secondaryHeading", "Secondary Heading", dt.Textstring, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "items", "Items", podItems, "List of pod cards", 2);

        ct.Save(type);
    }

    private static void CreateTextBlock(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("textBlock", "Text Block", "icon-edit");

        var headingLevel = dt.FindDataTypeByName(DropdownDataTypes.HeadingLevel)!;
        var alignment = dt.FindDataTypeByName(DropdownDataTypes.TextAlignment)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "headingLevel", "Heading Level", headingLevel, "h1 through h4", 1);
        ct.AddPropertyIfMissing(type, g, gn, "text", "Text", dt.RichText, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "alignment", "Alignment", alignment, sortOrder: 3);

        ct.Save(type);
    }

    private static void CreateCtaStrip(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("ctaStrip", "CTA Strip", "icon-bullhorn");

        var singleUrl = dt.FindDataTypeByName(DropdownDataTypes.SingleUrlPicker)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "text", "Text", dt.Textstring, "Supporting text", 1);
        ct.AddPropertyIfMissing(type, g, gn, "primaryCta", "Primary CTA", singleUrl, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "secondaryCta", "Secondary CTA", singleUrl, sortOrder: 3);

        ct.Save(type);
    }

    private static void CreateGridLayout(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("gridLayout", "Grid Layout", "icon-grid");

        var columns = dt.FindDataTypeByName(DropdownDataTypes.GridColumnsCount)!;
        var gridCols = dt.FindDataTypeByName(BlockListDataTypes.GridColumns)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "columns", "Columns", columns, "Number of columns: 2, 3, 4", 0);
        ct.AddPropertyIfMissing(type, g, gn, "items", "Items", gridCols, sortOrder: 1);

        ct.Save(type);
    }

    private static void CreateAccordionTabs(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("accordionTabs", "Accordion / Tabs", "icon-list");

        var displayMode = dt.FindDataTypeByName(DropdownDataTypes.DisplayMode)!;
        var accItems = dt.FindDataTypeByName(BlockListDataTypes.AccordionItems)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "displayMode", "Display Mode", displayMode, "Accordion or tabs", 0);
        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "items", "Items", accItems, sortOrder: 2);

        ct.Save(type);
    }

    private static void CreateGallery(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("gallery", "Gallery", "icon-picture");

        var multiImages = dt.FindDataTypeByName(DropdownDataTypes.MultipleImages)!;
        var columns = dt.FindDataTypeByName(DropdownDataTypes.GalleryColumnsCount)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "images", "Images", multiImages, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "columns", "Columns", columns, "Grid columns: 2, 3, 4, 5", 2);

        ct.Save(type);
    }

    private static void CreateAlertBox(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("alertBox", "Alert Box", "icon-alert");

        var alertType = dt.FindDataTypeByName(DropdownDataTypes.AlertType)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "alertType", "Alert Type", alertType, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "text", "Text", dt.RichText, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "dismissible", "Dismissible", dt.Toggle, sortOrder: 3);

        ct.Save(type);
    }

    private static void CreateLinksBlock(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("linksBlock", "Links Block", "icon-link");

        var layout = dt.FindDataTypeByName(DropdownDataTypes.LinksLayout)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "layout", "Layout", layout, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "links", "Links", dt.MultiUrlPicker, sortOrder: 2);

        ct.Save(type);
    }

    private static void CreateEmbedBlock(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("embedBlock", "Embed Block", "icon-code");
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "embedCode", "Embed Code", dt.Textarea,
            "Raw HTML/embed code (iframe, script, etc.)", 0);
        ct.AddPropertyIfMissing(type, g, gn, "caption", "Caption", dt.Textstring, sortOrder: 1);

        ct.Save(type);
    }

    private static void CreateDataList(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("dataList", "Data List", "icon-ordered-list");

        var layout = dt.FindDataTypeByName(DropdownDataTypes.DataLayout)!;
        var items = dt.FindDataTypeByName(BlockListDataTypes.DataListItems)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "layout", "Layout", layout, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "items", "Items", items, sortOrder: 2);

        ct.Save(type);
    }

    private static void CreateAnchorNav(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("anchorNav", "Anchor Nav", "icon-anchor");

        var style = dt.FindDataTypeByName(DropdownDataTypes.AnchorNavStyle)!;
        var items = dt.FindDataTypeByName(BlockListDataTypes.AnchorNavItems)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "style", "Style", style, "bar or dots", 0);
        ct.AddPropertyIfMissing(type, g, gn, "items", "Items", items, sortOrder: 1);

        ct.Save(type);
    }

    private static void CreateSubpageListing(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("subpageListing", "Subpage Listing", "icon-nodes");

        var layout = dt.FindDataTypeByName(DropdownDataTypes.SubpageLayout)!;
        var sortOrder = dt.FindDataTypeByName(DropdownDataTypes.SortOrder)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "sourceNode", "Source Node", dt.ContentPicker,
            "Parent page whose children are listed", 1);
        ct.AddPropertyIfMissing(type, g, gn, "layout", "Layout", layout, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "maxItems", "Max Items", dt.Numeric, sortOrder: 3);
        ct.AddPropertyIfMissing(type, g, gn, "sortOrder", "Sort Order", sortOrder, sortOrder: 4);

        ct.Save(type);
    }

    private static void CreateFormBlock(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("formBlock", "Form Block", "icon-form");

        var formType = dt.FindDataTypeByName(DropdownDataTypes.FormType)!;
        var fields = dt.FindDataTypeByName(BlockListDataTypes.FormFields)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "description", "Description", dt.RichText, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "formType", "Form Type", formType, sortOrder: 2);
        ct.AddPropertyIfMissing(type, g, gn, "submitButtonText", "Submit Button Text", dt.Textstring,
            "Custom submit button label", 3);
        ct.AddPropertyIfMissing(type, g, gn, "successMessage", "Success Message", dt.Textstring,
            "Message shown after submission", 4);
        ct.AddPropertyIfMissing(type, g, gn, "recipientEmail", "Recipient Email", dt.Textstring,
            "Email address for submissions", 5);
        ct.AddPropertyIfMissing(type, g, gn, "fields", "Fields", fields, sortOrder: 6);

        ct.Save(type);
    }

    private static void CreateFeaturedProperties(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("featuredProperties", "Featured Properties", "icon-nodes",
            "Displays a grid of featured rental properties from the content tree or EF Core database");

        var singleUrl = dt.FindDataTypeByName(DropdownDataTypes.SingleUrlPicker)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "secondaryHeading", "Secondary Heading", dt.Textstring, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "viewAllLink", "View All Link", singleUrl,
            "Link to the full property listing page", 2);
        ct.AddPropertyIfMissing(type, g, gn, "maxItems", "Max Items", dt.Numeric,
            "Maximum number of properties to display (default: 3)", 3);
        ct.AddPropertyIfMissing(type, g, gn, "sourcePath", "Source Path", dt.Textstring,
            "Content path to fetch properties from (e.g. /properties)", 4);
        ct.AddPropertyIfMissing(type, g, gn, "useDatabase", "Use Database", dt.Toggle,
            "Fetch properties from EF Core database instead of content tree", 5);

        ct.Save(type);
    }

    private static void CreatePropertyGrid(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateElementType("propertyGrid", "Property Grid", "icon-grid",
            "Displays a filterable grid of published rental properties from the EF Core database");

        var propertyType = dt.FindDataTypeByName(RentalDataTypes.PropertyType)!;
        var columns = dt.FindDataTypeByName(DropdownDataTypes.GridColumnsCount)!;
        const string g = "content";
        const string gn = "Content";

        ct.AddPropertyIfMissing(type, g, gn, "heading", "Heading", dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, g, gn, "description", "Description", dt.RichText, sortOrder: 1);
        ct.AddPropertyIfMissing(type, g, gn, "maxItems", "Max Items", dt.Numeric,
            "Maximum number of properties to display (default: all)", 2);
        ct.AddPropertyIfMissing(type, g, gn, "showFilters", "Show Filters", dt.Toggle,
            "Show search and filter controls above the grid", 3);
        ct.AddPropertyIfMissing(type, g, gn, "propertyType", "Property Type", propertyType,
            "Optional pre-filter to only show a specific property type", 4);
        ct.AddPropertyIfMissing(type, g, gn, "layout", "Layout", columns,
            "Number of grid columns: 2, 3, 4", 5);

        ct.Save(type);
    }
}
