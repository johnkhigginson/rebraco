import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { portalFetch } from "./api";

interface ActiveLease {
  id: number;
  unit: { id: number; unitNumber: string };
  property: { name: string };
}

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Appliance",
  "Structural",
  "Cleaning",
  "Pest",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export default function PortalMaintenanceForm() {
  const navigate = useNavigate();
  const [leases, setLeases] = useState<ActiveLease[]>([]);
  const [unitId, setUnitId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationDetail, setLocationDetail] = useState("");
  const [permissionToEnter, setPermissionToEnter] = useState(false);
  const [preferredAvailability, setPreferredAvailability] = useState("");
  const [urgencyNotes, setUrgencyNotes] = useState("");
  const [category, setCategory] = useState("Other");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch("/api/portal/leases")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.items || []).filter(
          (l: ActiveLease & { status: string }) => l.status === "Active"
        );
        setLeases(active);
        if (active.length === 1) {
          setUnitId(active[0].unit.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!unitId) {
      setError("Please select a unit.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await portalFetch("/api/portal/maintenance", {
        method: "POST",
        body: JSON.stringify({
          unitId, title, description,
          locationDetail: locationDetail || null,
          permissionToEnter,
          preferredAvailability: preferredAvailability || null,
          urgencyNotes: urgencyNotes || null,
          category, priority,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to submit request.");
        return;
      }

      const data = await res.json();
      navigate(`/portal/maintenance/${data.id}`);
    } catch {
      setError("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  if (leases.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Active Lease</h2>
        <p className="text-sm text-yellow-700">
          You need an active lease to submit a maintenance request.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <Link to="/portal/maintenance" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to requests
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Maintenance Request</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {leases.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(Number(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">Select unit...</option>
              {leases.map((l) => (
                <option key={l.unit.id} value={l.unit.id}>
                  {l.property.name} — Unit {l.unit.unitNumber}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="Brief description of the issue"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="Provide details about the issue, location in the unit, when it started, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location in Unit</label>
          <input
            type="text"
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            maxLength={200}
            placeholder="e.g. Kitchen sink, master bathroom"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={permissionToEnter}
            onChange={(e) => setPermissionToEnter(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Staff may enter when I'm not home</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Availability</label>
          <textarea
            value={preferredAvailability}
            onChange={(e) => setPreferredAvailability(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="e.g. Weekdays 9am–5pm"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Notes</label>
          <textarea
            value={urgencyNotes}
            onChange={(e) => setUrgencyNotes(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Additional urgency details beyond the priority level..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full btn btn-primary disabled:opacity-50 inline-flex items-center justify-center"
        >
          {submitting ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Submitting...</> : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
