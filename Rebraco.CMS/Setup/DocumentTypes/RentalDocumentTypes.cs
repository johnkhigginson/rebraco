using Rebraco.CMS.Setup.DataTypes;
using Rebraco.CMS.Setup.Helpers;
using Umbraco.Cms.Core.Services;

namespace Rebraco.CMS.Setup.DocumentTypes;

public static class RentalDocumentTypes
{
    public static void EnsureAll(ContentTypeHelper ct, DataTypeHelper dt, IContentTypeService cts)
    {
        CreatePropertyListing(ct, dt);
        CreateProperty(ct, dt);
        CreateUnit(ct, dt);

        ConfigureAllowedChildren(ct, cts);
    }

    private static void CreatePropertyListing(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("propertyListing", "Property Listing", "icon-nodes",
            description: "Listing page that shows child property/building cards");

        ct.AddPropertyIfMissing(type, "content", "Content", "heading", "Heading",
            dt.Textstring, sortOrder: 0);
        ct.AddPropertyIfMissing(type, "content", "Content", "description", "Description",
            dt.RichText, "Intro text above the property grid", 1);
        ct.AddPropertyIfMissing(type, "content", "Content", "propertiesPerPage", "Properties Per Page",
            dt.Numeric, "Default: 24", 2);

        AddSeoProperties(ct, dt, type);
        ct.Save(type);
    }

    private static void CreateProperty(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("property", "Property", "icon-umb-members",
            description: "A building or complex (apartment, dorm, house, townhouse)");

        var propertyType = dt.FindDataTypeByName(RentalDataTypes.PropertyType)!;
        var pricingPeriod = dt.FindDataTypeByName(RentalDataTypes.PricingPeriod)!;
        var genderRestriction = dt.FindDataTypeByName(RentalDataTypes.GenderRestriction)!;
        var multipleImages = dt.FindDataTypeByName(DropdownDataTypes.MultipleImages)!;
        var mainGrid = dt.FindDataTypeByName(BlockGridDataType.MainContent)!;

        // --- Details tab ---
        const string d = "details";
        const string dn = "Details";

        ct.AddPropertyIfMissing(type, d, dn, "propertyType", "Property Type", propertyType,
            "apartment-complex, dorm, house, townhouse", 0);
        ct.AddPropertyIfMissing(type, d, dn, "address", "Address", dt.Textstring, sortOrder: 1);
        ct.AddPropertyIfMissing(type, d, dn, "city", "City", dt.Textstring, sortOrder: 2);
        ct.AddPropertyIfMissing(type, d, dn, "state", "State", dt.Textstring, sortOrder: 3);
        ct.AddPropertyIfMissing(type, d, dn, "zip", "Zip", dt.Textstring, sortOrder: 4);
        ct.AddPropertyIfMissing(type, d, dn, "campusProximity", "Campus Proximity", dt.Textstring,
            "e.g. '0.5 miles to BYU-Idaho'", 5);
        ct.AddPropertyIfMissing(type, d, dn, "genderRestriction", "Gender Restriction", genderRestriction,
            sortOrder: 6);
        ct.AddPropertyIfMissing(type, d, dn, "byuApproved", "BYU-I Approved", dt.Toggle, sortOrder: 7);

        // --- Pricing & Availability tab ---
        const string p = "pricing";
        const string pn = "Pricing & Availability";

        ct.AddPropertyIfMissing(type, p, pn, "startingRent", "Starting Rent", dt.Numeric,
            "Cheapest available unit rent (manually maintained)", 0, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "pricingPeriod", "Pricing Period", pricingPeriod,
            "monthly or semester", 1, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "totalUnits", "Total Units", dt.Numeric, sortOrder: 2,
            groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "availableUnits", "Available Units", dt.Numeric,
            "Manually maintained availability count", 3, groupSortOrder: 1);

        // --- Content tab ---
        const string c = "content";
        const string cn = "Content";

        ct.AddPropertyIfMissing(type, c, cn, "description", "Description", dt.RichText, sortOrder: 0,
            groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, c, cn, "featuredImage", "Featured Image", dt.MediaPicker,
            sortOrder: 1, groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, c, cn, "images", "Images", multipleImages,
            "Photo gallery images", 2, groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, c, cn, "buildingAmenities", "Building Amenities", dt.Tags,
            "pool, gym, laundry, clubhouse, etc.", 3, groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, c, cn, "content", "Additional Content", mainGrid,
            "Block grid for extra content sections", 4, groupSortOrder: 2);

        // --- Contact tab ---
        const string ct2 = "contact";
        const string ct2n = "Contact";

        ct.AddPropertyIfMissing(type, ct2, ct2n, "contactEmail", "Contact Email", dt.Textstring,
            sortOrder: 0, groupSortOrder: 3);
        ct.AddPropertyIfMissing(type, ct2, ct2n, "contactPhone", "Contact Phone", dt.Textstring,
            sortOrder: 1, groupSortOrder: 3);

        AddSeoProperties(ct, dt, type);
        ct.Save(type);
    }

    private static void CreateUnit(ContentTypeHelper ct, DataTypeHelper dt)
    {
        var type = ct.GetOrCreateDocumentType("unit", "Unit", "icon-box",
            description: "A rentable space within a property (apartment, room, bed)");

        var pricingModel = dt.FindDataTypeByName(RentalDataTypes.PricingModel)!;
        var pricingPeriod = dt.FindDataTypeByName(RentalDataTypes.PricingPeriod)!;
        var genderRestriction = dt.FindDataTypeByName(RentalDataTypes.GenderRestriction)!;
        var leaseTerm = dt.FindDataTypeByName(RentalDataTypes.LeaseTerm)!;
        var semesterAvailability = dt.FindDataTypeByName(RentalDataTypes.SemesterAvailability)!;
        var multipleImages = dt.FindDataTypeByName(DropdownDataTypes.MultipleImages)!;
        var mainGrid = dt.FindDataTypeByName(BlockGridDataType.MainContent)!;

        // --- Details tab ---
        const string d = "details";
        const string dn = "Details";

        ct.AddPropertyIfMissing(type, d, dn, "unitNumber", "Unit Number", dt.Textstring,
            "e.g. '204' or '3B'", 0);
        ct.AddPropertyIfMissing(type, d, dn, "bedrooms", "Bedrooms", dt.Numeric, sortOrder: 1);
        ct.AddPropertyIfMissing(type, d, dn, "bathrooms", "Bathrooms", dt.Numeric, sortOrder: 2);
        ct.AddPropertyIfMissing(type, d, dn, "squareFeet", "Square Feet", dt.Numeric, sortOrder: 3);
        ct.AddPropertyIfMissing(type, d, dn, "furnished", "Furnished", dt.Toggle, sortOrder: 4);
        ct.AddPropertyIfMissing(type, d, dn, "petsAllowed", "Pets Allowed", dt.Toggle, sortOrder: 5);
        ct.AddPropertyIfMissing(type, d, dn, "parkingIncluded", "Parking Included", dt.Toggle, sortOrder: 6);
        ct.AddPropertyIfMissing(type, d, dn, "genderRestriction", "Gender Restriction", genderRestriction,
            sortOrder: 7);

        // --- Pricing tab ---
        const string p = "pricing";
        const string pn = "Pricing";

        ct.AddPropertyIfMissing(type, p, pn, "pricingModel", "Pricing Model", pricingModel,
            "whole-unit or per-bed", 0, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "pricingPeriod", "Pricing Period", pricingPeriod,
            "monthly or semester", 1, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "rent", "Rent", dt.Numeric,
            "Monthly or semester rent for the whole unit", 2, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "bedPrice", "Bed Price", dt.Numeric,
            "Per-bed price (for per-bed model)", 3, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "totalBeds", "Total Beds", dt.Numeric,
            "Number of beds in unit (for per-bed model)", 4, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "availableBeds", "Available Beds", dt.Numeric,
            "Currently available beds", 5, groupSortOrder: 1);
        ct.AddPropertyIfMissing(type, p, pn, "deposit", "Deposit", dt.Numeric, sortOrder: 6,
            groupSortOrder: 1);

        // --- Availability tab ---
        const string a = "availability";
        const string an = "Availability";

        ct.AddPropertyIfMissing(type, a, an, "availableDate", "Available Date", dt.DatePicker,
            "When the unit becomes available", 0, groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, a, an, "leaseTerm", "Lease Terms", leaseTerm,
            "semester, 6-month, 12-month", 1, groupSortOrder: 2);
        ct.AddPropertyIfMissing(type, a, an, "semesterAvailability", "Semester Availability",
            semesterAvailability, "fall, winter, spring", 2, groupSortOrder: 2);

        // --- Utilities tab ---
        const string u = "utilities";
        const string un = "Utilities";

        ct.AddPropertyIfMissing(type, u, un, "utilitiesIncluded", "All Utilities Included", dt.Toggle,
            "Toggle on if all utilities are included in rent", 0, groupSortOrder: 3);
        ct.AddPropertyIfMissing(type, u, un, "utilitiesIncludedList", "Included Utilities", dt.Tags,
            "water, electric, internet, gas, trash, etc.", 1, groupSortOrder: 3);

        // --- Content tab ---
        const string c = "content";
        const string cn = "Content";

        ct.AddPropertyIfMissing(type, c, cn, "description", "Description", dt.RichText, sortOrder: 0,
            groupSortOrder: 4);
        ct.AddPropertyIfMissing(type, c, cn, "features", "Unit Features", dt.Tags,
            "in-unit washer, dishwasher, A/C, etc.", 1, groupSortOrder: 4);
        ct.AddPropertyIfMissing(type, c, cn, "featuredImage", "Featured Image", dt.MediaPicker,
            sortOrder: 2, groupSortOrder: 4);
        ct.AddPropertyIfMissing(type, c, cn, "images", "Images", multipleImages,
            "Photo gallery images", 3, groupSortOrder: 4);
        ct.AddPropertyIfMissing(type, c, cn, "floorPlan", "Floor Plan", multipleImages,
            "Floor plan image(s)", 4, groupSortOrder: 4);
        ct.AddPropertyIfMissing(type, c, cn, "content", "Additional Content", mainGrid,
            "Block grid for extra content sections", 5, groupSortOrder: 4);

        AddSeoProperties(ct, dt, type);
        ct.Save(type);
    }

    private static void ConfigureAllowedChildren(ContentTypeHelper ct, IContentTypeService cts)
    {
        // PropertyListing allows Property children
        var listing = cts.Get("propertyListing");
        if (listing != null)
        {
            ct.SetAllowedContentTypes(listing, "property");
            ct.Save(listing);
        }

        // Property allows Unit children
        var property = cts.Get("property");
        if (property != null)
        {
            ct.SetAllowedContentTypes(property, "unit");
            ct.Save(property);
        }

        // Home should also allow PropertyListing as a child
        var home = cts.Get("home");
        if (home != null)
        {
            // Preserve existing allowed children + add propertyListing
            var existing = home.AllowedContentTypes?.Select(a => a.Alias).ToList() ?? new List<string>();
            if (!existing.Contains("propertyListing"))
            {
                existing.Add("propertyListing");
                ct.SetAllowedContentTypes(home, existing.ToArray());
                ct.Save(home);
            }
        }
    }

    private static void AddSeoProperties(ContentTypeHelper ct, DataTypeHelper dt,
        Umbraco.Cms.Core.Models.IContentType type)
    {
        ct.AddPropertyIfMissing(type, "seo", "SEO", "metaTitle", "Meta Title",
            dt.Textstring, "SEO page title", 0, groupSortOrder: 100);
        ct.AddPropertyIfMissing(type, "seo", "SEO", "metaDescription", "Meta Description",
            dt.Textarea, "SEO meta description", 1, groupSortOrder: 100);
        ct.AddPropertyIfMissing(type, "seo", "SEO", "ogImage", "OG Image",
            dt.MediaPicker, "Social sharing image", 2, groupSortOrder: 100);
        ct.AddPropertyIfMissing(type, "seo", "SEO", "noIndex", "No Index",
            dt.Toggle, "Prevent search engine indexing", 3, groupSortOrder: 100);
    }
}
