import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { manageFetch } from "./api";
import { MediaPickerInput } from "./media-picker";

export default function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --- Core fields ---
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [type, setType] = useState("Apartment");
  const [description, setDescription] = useState("");
  const [totalUnits, setTotalUnits] = useState(0);

  // --- Public listing fields ---
  const [slug, setSlug] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [campusProximity, setCampusProximity] = useState("");
  const [byuApproved, setByuApproved] = useState(false);
  const [genderRestriction, setGenderRestriction] = useState("");
  const [buildingAmenities, setBuildingAmenities] = useState("");
  const [pricingPeriod, setPricingPeriod] = useState("Monthly");
  const [startingRent, setStartingRent] = useState("");

  // --- Contact fields ---
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // --- SEO fields ---
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");

  // --- Publishing ---
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    manageFetch(`/api/properties/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.name);
        setStreet(data.street || "");
        setCity(data.city || "");
        setState(data.state || "");
        setZip(data.zip || "");
        setType(data.type);
        setDescription(data.description || "");
        setTotalUnits(data.totalUnits);
        // Public listing
        setSlug(data.slug || "");
        setFeaturedImageUrl(data.featuredImageUrl || "");
        setCampusProximity(data.campusProximity || "");
        setByuApproved(data.byuApproved ?? false);
        setGenderRestriction(data.genderRestriction || "");
        setBuildingAmenities(data.buildingAmenities || "");
        setPricingPeriod(data.pricingPeriod || "Monthly");
        setStartingRent(data.startingRent?.toString() || "");
        // Contact
        setContactEmail(data.contactEmail || "");
        setContactPhone(data.contactPhone || "");
        // SEO
        setMetaTitle(data.metaTitle || "");
        setMetaDescription(data.metaDescription || "");
        // Publishing
        setIsPublished(data.isPublished ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      name,
      street: street || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      type,
      description: description || null,
      totalUnits,
      // Public listing
      ...(isEdit && slug ? { slug } : {}),
      featuredImageUrl: featuredImageUrl || null,
      campusProximity: campusProximity || null,
      byuApproved,
      genderRestriction: genderRestriction || null,
      buildingAmenities: buildingAmenities || null,
      pricingPeriod,
      startingRent: startingRent ? Number(startingRent) : null,
      // Contact
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      // SEO
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      // Publishing
      isPublished,
    };

    try {
      const res = isEdit
        ? await manageFetch(`/api/properties/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : await manageFetch("/api/properties", { method: "POST", body: JSON.stringify(body) });

      if (res.ok) {
        const data = await res.json();
        navigate(isEdit ? `/manage/properties/${id}` : `/manage/properties/${data.id}`);
      } else {
        setError("Failed to save property.");
      }
    } catch {
      setError("Failed to save property.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const sectionClass = "border-t border-gray-200 pt-5 mt-5";
  const sectionHeadingClass = "text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={isEdit ? `/manage/properties/${id}` : "/manage/properties"} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Property" : "New Property"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {error && <div className="text-sm px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200">{error}</div>}

        {/* --- Core Details --- */}
        <div>
          <label className={labelClass}>Property Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option value="Apartment">Apartment</option>
              <option value="Dorm">Dorm</option>
              <option value="House">House</option>
              <option value="Townhome">Townhome</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Total Units</label>
            <input type="number" min={0} value={totalUnits} onChange={(e) => setTotalUnits(Number(e.target.value))} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Street Address</label>
          <input type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>City</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>State</label>
            <input type="text" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} className={inputClass} placeholder="ID" />
          </div>
          <div>
            <label className={labelClass}>Zip</label>
            <input type="text" maxLength={10} value={zip} onChange={(e) => setZip(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </div>

        {/* --- Public Listing --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Public Listing</h3>

          {isEdit && (
            <div className="mb-4">
              <label className={labelClass}>URL Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">/properties/</span>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} placeholder="auto-generated-from-name" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Auto-generated from name. Edit to customize the URL.</p>
            </div>
          )}

          <div className="mb-4">
            <MediaPickerInput value={featuredImageUrl} onChange={setFeaturedImageUrl} folder="Properties" label="Featured Image" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Campus Proximity</label>
              <input type="text" value={campusProximity} onChange={(e) => setCampusProximity(e.target.value)} className={inputClass} placeholder="e.g. 0.3 miles from BYU-I" />
            </div>
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>Pricing Period</label>
              <select value={pricingPeriod} onChange={(e) => setPricingPeriod(e.target.value)} className={inputClass}>
                <option value="Monthly">Monthly</option>
                <option value="Semester">Semester</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Starting Rent Override</label>
              <input type="number" step="0.01" min={0} value={startingRent} onChange={(e) => setStartingRent(e.target.value)} className={inputClass} placeholder="Auto-computed from units if blank" />
            </div>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={byuApproved} onChange={(e) => setByuApproved(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              BYU Approved
            </label>
          </div>

          <div>
            <label className={labelClass}>Building Amenities</label>
            <textarea rows={2} value={buildingAmenities} onChange={(e) => setBuildingAmenities(e.target.value)} className={inputClass} placeholder="pool, gym, laundry, clubhouse (comma-separated)" />
          </div>
        </div>

        {/* --- Contact --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact Email</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contact Phone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className={inputClass} placeholder="(208) 555-1234" />
            </div>
          </div>
        </div>

        {/* --- SEO --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>SEO</h3>
          <div className="mb-4">
            <label className={labelClass}>Meta Title</label>
            <input type="text" maxLength={160} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} placeholder="Defaults to property name if blank" />
            <p className="text-xs text-gray-400 mt-1">{metaTitle.length}/160 characters</p>
          </div>
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea rows={2} maxLength={300} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className={inputClass} placeholder="Brief description for search engines" />
            <p className="text-xs text-gray-400 mt-1">{metaDescription.length}/300 characters</p>
          </div>
        </div>

        {/* --- Publishing --- */}
        <div className={sectionClass}>
          <h3 className={sectionHeadingClass}>Publishing</h3>
          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
            <div>
              <span className="font-medium">Publish to public website</span>
              <p className="text-xs text-gray-400">When enabled, this property appears on the public listing pages and API</p>
            </div>
          </label>
        </div>

        <button type="submit" disabled={saving} className="w-full btn btn-primary disabled:opacity-50 inline-flex items-center justify-center">
          {saving ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</> : isEdit ? "Save Changes" : "Create Property"}
        </button>
      </form>
    </div>
  );
}
