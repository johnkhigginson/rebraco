import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { manageFetch } from "./api";
import { MediaPickerInput } from "./media-picker";

export default function UnitFormPage() {
  const { id, propertyId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [parentPropertyId, setParentPropertyId] = useState(propertyId || "");

  // --- Core fields ---
  const [unitNumber, setUnitNumber] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [sqFt, setSqFt] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [floorPlan, setFloorPlan] = useState("");
  const [status, setStatus] = useState("Available");
  const [description, setDescription] = useState("");

  // --- Pricing fields ---
  const [pricingModel, setPricingModel] = useState("WholeUnit");
  const [pricingPeriod, setPricingPeriod] = useState("Monthly");
  const [bedPrice, setBedPrice] = useState("");
  const [deposit, setDeposit] = useState("");

  // --- Amenities/features ---
  const [furnished, setFurnished] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [parkingIncluded, setParkingIncluded] = useState(false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [features, setFeatures] = useState("");
  const [genderRestriction, setGenderRestriction] = useState("");

  // --- Availability ---
  const [availableDate, setAvailableDate] = useState("");
  const [semesterAvailability, setSemesterAvailability] = useState<string[]>([]);
  const [leaseTerms, setLeaseTerms] = useState<string[]>([]);

  // --- Media ---
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");

  // --- Publishing ---
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    manageFetch(`/api/units/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setParentPropertyId(data.propertyId.toString());
        setUnitNumber(data.unitNumber);
        setBedrooms(data.bedrooms);
        setBathrooms(data.bathrooms);
        setSqFt(data.sqFt?.toString() || "");
        setCapacity(data.capacity);
        setMonthlyRent(data.monthlyRent.toString());
        setFloorPlan(data.floorPlan || "");
        setStatus(data.status);
        setDescription(data.description || "");
        // Pricing
        setPricingModel(data.pricingModel || "WholeUnit");
        setPricingPeriod(data.pricingPeriod || "Monthly");
        setBedPrice(data.bedPrice?.toString() || "");
        setDeposit(data.deposit?.toString() || "");
        // Amenities
        setFurnished(data.furnished ?? false);
        setPetsAllowed(data.petsAllowed ?? false);
        setParkingIncluded(data.parkingIncluded ?? false);
        setUtilitiesIncluded(data.utilitiesIncluded ?? false);
        setFeatures(data.features || "");
        setGenderRestriction(data.genderRestriction || "");
        // Availability
        setAvailableDate(data.availableDate ? data.availableDate.split("T")[0] : "");
        setSemesterAvailability(data.semesterAvailability ? data.semesterAvailability.split(",").map((s: string) => s.trim()) : []);
        setLeaseTerms(data.leaseTerms ? data.leaseTerms.split(",").map((s: string) => s.trim()) : []);
        // Media
        setFeaturedImageUrl(data.featuredImageUrl || "");
        // Publishing
        setIsPublished(data.isPublished ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const toggleArrayValue = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      unitNumber,
      bedrooms,
      bathrooms,
      sqFt: sqFt ? Number(sqFt) : null,
      capacity,
      monthlyRent: Number(monthlyRent),
      floorPlan: floorPlan || null,
      status,
      description: description || null,
      // Pricing
      pricingModel,
      pricingPeriod,
      bedPrice: bedPrice ? Number(bedPrice) : null,
      deposit: deposit ? Number(deposit) : null,
      // Amenities
      furnished,
      petsAllowed,
      parkingIncluded,
      utilitiesIncluded,
      features: features || null,
      genderRestriction: genderRestriction || null,
      // Availability
      availableDate: availableDate || null,
      semesterAvailability: semesterAvailability.length > 0 ? semesterAvailability.join(",") : null,
      leaseTerms: leaseTerms.length > 0 ? leaseTerms.join(",") : null,
      // Media
      featuredImageUrl: featuredImageUrl || null,
      // Publishing
      isPublished,
    };

    try {
      const res = isEdit
        ? await manageFetch(`/api/units/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : await manageFetch(`/api/properties/${parentPropertyId}/units`, { method: "POST", body: JSON.stringify(body) });

      if (res.ok) {
        const data = await res.json();
        navigate(isEdit ? `/manage/units/${id}` : `/manage/units/${data.id}`);
      } else {
        setError("Failed to save unit.");
      }
    } catch {
      setError("Failed to save unit.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  const backTo = isEdit ? `/manage/units/${id}` : `/manage/properties/${parentPropertyId}`;
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "border-t border-gray-200 pt-5 mt-5";
  const sectionHeadingClass = "text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide";
  const checkboxClass = "rounded border-gray-300 text-blue-600 focus:ring-blue-500";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={backTo} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Unit" : "New Unit"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {error && <div className="text-sm px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200">{error}</div>}

        {/* --- Core Details --- */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Unit Number *</label>
            <input type="text" required value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} className={inputClass} placeholder="e.g. 201" />
          </div>
          <div>
            <label className={labelClass}>Floor Plan</label>
            <input type="text" value={floorPlan} onChange={(e) => setFloorPlan(e.target.value)} className={inputClass} placeholder="e.g. 4-Bed Shared" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Bedrooms</label>
            <input type="number" min={0} value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bathrooms</label>
            <input type="number" min={0} value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Capacity</label>
            <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Sq Ft</label>
            <input type="number" min={0} value={sqFt} onChange={(e) => setSqFt(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Monthly Rent</label>
            <input type="number" step="0.01" min={0} value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Offline">Offline</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </div>

        {/* --- Pricing --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Pricing</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Pricing Model</label>
              <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value)} className={inputClass}>
                <option value="WholeUnit">Whole Unit</option>
                <option value="PerBed">Per Bed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Pricing Period</label>
              <select value={pricingPeriod} onChange={(e) => setPricingPeriod(e.target.value)} className={inputClass}>
                <option value="Monthly">Monthly</option>
                <option value="Semester">Semester</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {pricingModel === "PerBed" && (
              <div>
                <label className={labelClass}>Bed Price</label>
                <input type="number" step="0.01" min={0} value={bedPrice} onChange={(e) => setBedPrice(e.target.value)} className={inputClass} placeholder="Price per bed" />
              </div>
            )}
            <div>
              <label className={labelClass}>Deposit</label>
              <input type="number" step="0.01" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* --- Amenities --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Amenities</h3>

          <div className="flex flex-wrap gap-x-6 gap-y-3 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} className={checkboxClass} />
              Furnished
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={petsAllowed} onChange={(e) => setPetsAllowed(e.target.checked)} className={checkboxClass} />
              Pets Allowed
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={parkingIncluded} onChange={(e) => setParkingIncluded(e.target.checked)} className={checkboxClass} />
              Parking Included
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={utilitiesIncluded} onChange={(e) => setUtilitiesIncluded(e.target.checked)} className={checkboxClass} />
              Utilities Included
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Gender Restriction</label>
              <select value={genderRestriction} onChange={(e) => setGenderRestriction(e.target.value)} className={inputClass}>
                <option value="">None (Coed)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Coed">Coed</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Features</label>
            <textarea rows={2} value={features} onChange={(e) => setFeatures(e.target.value)} className={inputClass} placeholder="washer/dryer, dishwasher, air conditioning (comma-separated)" />
          </div>
        </div>

        {/* --- Availability --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Availability</h3>

          <div className="mb-4">
            <label className={labelClass}>Available Date</label>
            <input type="date" value={availableDate} onChange={(e) => setAvailableDate(e.target.value)} className={inputClass} />
          </div>

          <div className="mb-4">
            <label className={labelClass}>Semester Availability</label>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {["fall", "winter", "spring", "summer"].map((sem) => (
                <label key={sem} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={semesterAvailability.includes(sem)} onChange={() => toggleArrayValue(semesterAvailability, sem, setSemesterAvailability)} className={checkboxClass} />
                  {sem.charAt(0).toUpperCase() + sem.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Lease Terms</label>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {["semester", "6-month", "12-month"].map((term) => (
                <label key={term} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={leaseTerms.includes(term)} onChange={() => toggleArrayValue(leaseTerms, term, setLeaseTerms)} className={checkboxClass} />
                  {term.charAt(0).toUpperCase() + term.slice(1)}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* --- Media --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Media</h3>
          <MediaPickerInput value={featuredImageUrl} onChange={setFeaturedImageUrl} folder="Units" label="Featured Image" />
        </div>

        {/* --- Publishing --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Publishing</h3>
          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
            <div>
              <span className="font-medium">Publish to public website</span>
              <p className="text-xs text-gray-400">When enabled, this unit appears in public property detail pages and API</p>
            </div>
          </label>
        </div>

        <button type="submit" disabled={saving} className="w-full btn btn-primary disabled:opacity-50 inline-flex items-center justify-center">
          {saving ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</> : isEdit ? "Save Changes" : "Create Unit"}
        </button>
      </form>
    </div>
  );
}
