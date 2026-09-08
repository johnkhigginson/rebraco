import { useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { manageFetch } from "./api";
import { useToast } from "./shared";
import { MediaPickerInput } from "./media-picker";

export default function BulkUnitFormPage() {
  const { id: propertyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Unit number generation ---
  const [unitNumbers, setUnitNumbers] = useState<string[]>([]);
  const [rangePrefix, setRangePrefix] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");
  const [padZeros, setPadZeros] = useState(false);
  const [padWidth, setPadWidth] = useState(3);
  const [manualEntry, setManualEntry] = useState("");

  // --- Shared config ---
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [sqFt, setSqFt] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [floorPlan, setFloorPlan] = useState("");
  const [status, setStatus] = useState("Available");
  const [description, setDescription] = useState("");
  const [pricingModel, setPricingModel] = useState("WholeUnit");
  const [pricingPeriod, setPricingPeriod] = useState("Monthly");
  const [bedPrice, setBedPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [furnished, setFurnished] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [parkingIncluded, setParkingIncluded] = useState(false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [features, setFeatures] = useState("");
  const [genderRestriction, setGenderRestriction] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [semesterAvailability, setSemesterAvailability] = useState<string[]>([]);
  const [leaseTerms, setLeaseTerms] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const addFromRange = () => {
    const from = parseInt(rangeFrom);
    const to = parseInt(rangeTo);
    if (isNaN(from) || isNaN(to) || from > to || to - from > 500) {
      setError("Invalid range. 'From' must be <= 'To' and max 500 units.");
      return;
    }
    const generated: string[] = [];
    for (let i = from; i <= to; i++) {
      const num = padZeros ? String(i).padStart(padWidth, "0") : String(i);
      generated.push(`${rangePrefix}${num}`);
    }
    setUnitNumbers((prev) => {
      const set = new Set(prev);
      const added = generated.filter((n) => !set.has(n));
      return [...prev, ...added];
    });
    setError("");
  };

  const addFromManual = () => {
    const parsed = manualEntry
      .split(/[,\n\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (parsed.length === 0) return;
    setUnitNumbers((prev) => {
      const set = new Set(prev);
      const added = parsed.filter((n) => !set.has(n));
      return [...prev, ...added];
    });
    setManualEntry("");
    setError("");
  };

  const removeUnit = (number: string) => {
    setUnitNumbers((prev) => prev.filter((n) => n !== number));
  };

  const toggleArrayValue = (arr: string[], value: string, setter: (v: string[]) => void) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (unitNumbers.length === 0) {
      setError("Add at least one unit number.");
      return;
    }
    setSaving(true);
    setError("");

    const body = {
      unitNumbers,
      bedrooms,
      bathrooms,
      sqFt: sqFt ? Number(sqFt) : null,
      capacity,
      monthlyRent: Number(monthlyRent),
      floorPlan: floorPlan || null,
      status,
      description: description || null,
      pricingModel,
      pricingPeriod,
      bedPrice: bedPrice ? Number(bedPrice) : null,
      deposit: deposit ? Number(deposit) : null,
      furnished,
      petsAllowed,
      parkingIncluded,
      utilitiesIncluded,
      features: features || null,
      genderRestriction: genderRestriction || null,
      availableDate: availableDate || null,
      semesterAvailability: semesterAvailability.length > 0 ? semesterAvailability.join(",") : null,
      leaseTerms: leaseTerms.length > 0 ? leaseTerms.join(",") : null,
      featuredImageUrl: featuredImageUrl || null,
      isPublished,
    };

    try {
      const res = await manageFetch(`/api/properties/${propertyId}/units/bulk`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        toast(`${data.created} units created successfully.`, "success");
        navigate(`/manage/properties/${propertyId}`);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to create units.");
      }
    } catch {
      setError("Failed to create units.");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "border-t border-gray-200 pt-5 mt-5";
  const sectionHeadingClass = "text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide";
  const checkboxClass = "rounded border-gray-300 text-blue-600 focus:ring-blue-500";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/manage/properties/${propertyId}`} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Add Units</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-sm px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200">{error}</div>}

        {/* --- Unit Numbers --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className={sectionHeadingClass}>Unit Numbers</h3>

          {/* Range Generator */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-3">Generate a range of unit numbers:</p>
            <div className="grid grid-cols-5 gap-3 items-end">
              <div>
                <label className={labelClass}>Prefix</label>
                <input type="text" value={rangePrefix} onChange={(e) => setRangePrefix(e.target.value)} className={inputClass} placeholder="e.g. A-" />
              </div>
              <div>
                <label className={labelClass}>From</label>
                <input type="number" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} className={inputClass} placeholder="101" />
              </div>
              <div>
                <label className={labelClass}>To</label>
                <input type="number" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} className={inputClass} placeholder="120" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer mb-2">
                  <input type="checkbox" checked={padZeros} onChange={(e) => setPadZeros(e.target.checked)} className={checkboxClass} />
                  Pad zeros
                </label>
                {padZeros && (
                  <input type="number" min={2} max={6} value={padWidth} onChange={(e) => setPadWidth(Number(e.target.value))} className={inputClass} />
                )}
              </div>
              <button type="button" onClick={addFromRange} className="btn btn-ghost">
                + Add Range
              </button>
            </div>
          </div>

          {/* Manual Entry */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Or type/paste unit numbers (comma, space, or newline separated):</p>
            <div className="flex gap-3">
              <textarea
                rows={2}
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="PH-1, PH-2, PH-3"
              />
              <button type="button" onClick={addFromManual} className="btn btn-ghost self-end">
                + Add
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                {unitNumbers.length === 0 ? "No units added yet" : `${unitNumbers.length} unit${unitNumbers.length === 1 ? "" : "s"} will be created`}
              </p>
              {unitNumbers.length > 0 && (
                <button type="button" onClick={() => setUnitNumbers([])} className="text-xs text-red-500 hover:text-red-700">
                  Clear All
                </button>
              )}
            </div>
            {unitNumbers.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                {unitNumbers.map((num) => (
                  <span key={num} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                    {num}
                    <button type="button" onClick={() => removeUnit(num)} className="text-blue-400 hover:text-blue-600 ml-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- Shared Configuration --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <h3 className={sectionHeadingClass}>Shared Configuration</h3>

          {/* Core Details */}
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Monthly Rent</label>
              <input type="number" step="0.01" min={0} value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Floor Plan</label>
              <input type="text" value={floorPlan} onChange={(e) => setFloorPlan(e.target.value)} className={inputClass} placeholder="e.g. 4-Bed Shared" />
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
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </div>

          {/* Pricing */}
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
                  <input type="number" step="0.01" min={0} value={bedPrice} onChange={(e) => setBedPrice(e.target.value)} className={inputClass} />
                </div>
              )}
              <div>
                <label className={labelClass}>Deposit</label>
                <input type="number" step="0.01" min={0} value={deposit} onChange={(e) => setDeposit(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Amenities */}
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

          {/* Availability */}
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

          {/* Media */}
          <div className={sectionClass}>
            <h3 className={sectionHeadingClass}>Media</h3>
            <MediaPickerInput value={featuredImageUrl} onChange={setFeaturedImageUrl} folder="Units" label="Featured Image" />
          </div>

          {/* Publishing */}
          <div className={sectionClass}>
            <h3 className={sectionHeadingClass}>Publishing</h3>
            <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
              <div>
                <span className="font-medium">Publish to public website</span>
                <p className="text-xs text-gray-400">When enabled, these units appear in public property detail pages and API</p>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || unitNumbers.length === 0}
          className="w-full btn btn-primary disabled:opacity-50 inline-flex items-center justify-center"
        >
          {saving ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</> : `Create ${unitNumbers.length} Unit${unitNumbers.length === 1 ? "" : "s"}`}
        </button>
      </form>
    </div>
  );
}
