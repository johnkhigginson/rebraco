import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { manageFetch } from "./api";

interface UnitOption { id: number; unitNumber: string; propertyName: string; }
interface TenantOption { id: number; firstName: string; lastName: string; }

export default function MaintenanceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [units, setUnits] = useState<UnitOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [description, setDescription] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [permissionToEnter, setPermissionToEnter] = useState(false);
  const [preferredAvailability, setPreferredAvailability] = useState("");
  const [urgencyNotes, setUrgencyNotes] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Other");
  const [scheduledDate, setScheduledDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [actualCost, setActualCost] = useState("");

  useEffect(() => {
    const promises: Promise<void>[] = [
      manageFetch("/api/units?take=500")
        .then((res) => res.json())
        .then((data) => setUnits(data.items || [])),
      manageFetch("/api/tenants?take=500")
        .then((res) => res.json())
        .then((data) => setTenants(data.items || [])),
    ];

    if (isEdit) {
      promises.push(
        manageFetch(`/api/maintenance/${id}`)
          .then((res) => res.json())
          .then((data) => {
            setTitle(data.title);
            setUnitId(data.unitId.toString());
            setTenantId(data.tenantId?.toString() || "");
            setDescription(data.description || "");
            setLocationDetail(data.locationDetail || "");
            setPermissionToEnter(data.permissionToEnter || false);
            setPreferredAvailability(data.preferredAvailability || "");
            setUrgencyNotes(data.urgencyNotes || "");
            setPriority(data.priority);
            setCategory(data.category);
            setScheduledDate(data.scheduledDate ? data.scheduledDate.split("T")[0] : "");
            setEstimatedCost(data.estimatedCost?.toString() || "");
            setActualCost(data.actualCost?.toString() || "");
          })
      );
    }

    Promise.all(promises)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      title,
      unitId: Number(unitId),
      tenantId: tenantId ? Number(tenantId) : null,
      description: description || null,
      locationDetail: locationDetail || null,
      permissionToEnter,
      preferredAvailability: preferredAvailability || null,
      urgencyNotes: urgencyNotes || null,
      priority,
      category,
      scheduledDate: scheduledDate || null,
      estimatedCost: estimatedCost ? Number(estimatedCost) : null,
      actualCost: actualCost ? Number(actualCost) : null,
    };

    try {
      const res = isEdit
        ? await manageFetch(`/api/maintenance/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : await manageFetch("/api/maintenance", { method: "POST", body: JSON.stringify(body) });

      if (res.ok) {
        const data = await res.json();
        navigate(isEdit ? `/manage/maintenance/${id}` : `/manage/maintenance/${data.id}`);
      } else {
        setError("Failed to save request.");
      }
    } catch {
      setError("Failed to save request.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  const backTo = isEdit ? `/manage/maintenance/${id}` : "/manage/maintenance";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={backTo} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Request" : "New Request"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {error && <div className="text-sm px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Brief description of the issue" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select required value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">Select unit...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.propertyName} — {u.unitNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reported By (Tenant)</label>
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">None</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="Hvac">HVAC</option>
              <option value="Appliance">Appliance</option>
              <option value="Structural">Structural</option>
              <option value="Pest">Pest</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Detailed description of the issue..." />
        </div>

        {/* Tenant Detail Fields */}
        <div className="border-t border-gray-200 pt-5 mt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">Tenant Details</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location in Unit</label>
              <input type="text" maxLength={200} value={locationDetail} onChange={(e) => setLocationDetail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. Kitchen sink, master bathroom" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={permissionToEnter} onChange={(e) => setPermissionToEnter(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Permission to enter when tenant is not home</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Availability</label>
              <textarea rows={2} maxLength={500} value={preferredAvailability} onChange={(e) => setPreferredAvailability(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. Weekdays 9am–5pm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Notes</label>
              <textarea rows={2} maxLength={500} value={urgencyNotes} onChange={(e) => setUrgencyNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Additional urgency details beyond the priority level..." />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
            <input type="number" step="0.01" min={0} value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cost</label>
            <input type="number" step="0.01" min={0} value={actualCost} onChange={(e) => setActualCost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full btn btn-primary disabled:opacity-50 inline-flex items-center justify-center">
          {saving ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</> : isEdit ? "Save Changes" : "Create Request"}
        </button>
      </form>
    </div>
  );
}
