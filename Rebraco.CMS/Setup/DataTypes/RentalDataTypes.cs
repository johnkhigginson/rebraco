using Rebraco.CMS.Setup.Helpers;

namespace Rebraco.CMS.Setup.DataTypes;

public static class RentalDataTypes
{
    // Data type names as constants for referencing from document type phases
    public const string PropertyType = "Rebraco - Property Type";
    public const string PricingPeriod = "Rebraco - Pricing Period";
    public const string PricingModel = "Rebraco - Pricing Model";
    public const string GenderRestriction = "Rebraco - Gender Restriction";
    public const string LeaseTerm = "Rebraco - Lease Term";
    public const string SemesterAvailability = "Rebraco - Semester Availability";
    public const string MultipleImages = "Rebraco - Multiple Images"; // reuse existing

    public static void EnsureAll(DataTypeHelper dt)
    {
        dt.GetOrCreateDropdown(PropertyType, false,
            "apartment-complex", "dorm", "house", "townhouse");

        dt.GetOrCreateDropdown(PricingPeriod, false,
            "monthly", "semester");

        dt.GetOrCreateDropdown(PricingModel, false,
            "whole-unit", "per-bed");

        dt.GetOrCreateDropdown(GenderRestriction, false,
            "male", "female", "coed");

        // Multiple-select dropdowns for checkbox-style fields
        dt.GetOrCreateDropdown(LeaseTerm, true,
            "semester", "6-month", "12-month");

        dt.GetOrCreateDropdown(SemesterAvailability, true,
            "fall", "winter", "spring");
    }
}
