import { useState, useEffect, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, StatusBadge, ConfirmDialog } from "./shared";

interface AvailabilityWindow {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  maxToursPerSlot: number;
  isActive: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface PropertyDetail {
  id: number;
  name: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  type: string;
  description: string | null;
  totalUnits: number;
  createdAt: string;
  updatedAt: string;
  inquiryCount: number;
  units: {
    id: number;
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    sqFt: number | null;
    capacity: number;
    monthlyRent: number;
    floorPlan: string | null;
    status: string;
  }[];
}

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Tour availability state
  const [windows, setWindows] = useState<AvailabilityWindow[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addDay, setAddDay] = useState(1);
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("17:00");
  const [addDuration, setAddDuration] = useState(30);
  const [addMax, setAddMax] = useState(1);
  const [savingWindow, setSavingWindow] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDay, setEditDay] = useState(1);
  const [editStart, setEditStart] = useState("09:00");
  const [editEnd, setEditEnd] = useState("17:00");
  const [editDuration, setEditDuration] = useState(30);
  const [editMax, setEditMax] = useState(1);

  const fetchAvailability = () => {
    manageFetch(`/api/properties/${id}/tour-availability`)
      .then((r) => r.json())
      .then((data) => setWindows(Array.isArray(data) ? data : []))
      .catch(() => {});
  };

  useEffect(() => {
    manageFetch(`/api/properties/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/manage/properties", { replace: true }); return null; }
        return res.json();
      })
      .then((data) => data && setProperty(data))
      .catch(() => toast("Failed to load property.", "error"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => { if (id) fetchAvailability(); }, [id]);

  const handleAddWindow = async (e: FormEvent) => {
    e.preventDefault();
    setSavingWindow(true);
    try {
      const res = await manageFetch(`/api/properties/${id}/tour-availability`, {
        method: "POST",
        body: JSON.stringify({ dayOfWeek: addDay, startTime: addStart, endTime: addEnd, slotDurationMinutes: addDuration, maxToursPerSlot: addMax }),
      });
      if (res.ok) {
        fetchAvailability();
        setShowAddForm(false);
        setAddDay(1); setAddStart("09:00"); setAddEnd("17:00"); setAddDuration(30); setAddMax(1);
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to add window.", "error");
      }
    } catch { toast("Failed to add window.", "error"); }
    setSavingWindow(false);
  };

  const handleUpdateWindow = async (wId: number) => {
    setSavingWindow(true);
    try {
      const res = await manageFetch(`/api/tour-availability/${wId}`, {
        method: "PATCH",
        body: JSON.stringify({ dayOfWeek: editDay, startTime: editStart, endTime: editEnd, slotDurationMinutes: editDuration, maxToursPerSlot: editMax }),
      });
      if (res.ok) { fetchAvailability(); setEditingId(null); }
      else { const data = await res.json().catch(() => null); toast(data?.error || "Failed to update.", "error"); }
    } catch { toast("Failed to update.", "error"); }
    setSavingWindow(false);
  };

  const handleDeleteWindow = async (wId: number) => {
    try {
      const res = await manageFetch(`/api/tour-availability/${wId}`, { method: "DELETE" });
      if (res.ok) fetchAvailability();
      else toast("Failed to delete window.", "error");
    } catch { toast("Failed to delete window.", "error"); }
  };

  const handleToggleActive = async (w: AvailabilityWindow) => {
    try {
      const res = await manageFetch(`/api/tour-availability/${w.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !w.isActive }),
      });
      if (res.ok) fetchAvailability();
    } catch {}
  };

  const startEdit = (w: AvailabilityWindow) => {
    setEditingId(w.id);
    setEditDay(DAYS.indexOf(w.dayOfWeek));
    setEditStart(w.startTime.slice(0, 5));
    setEditEnd(w.endTime.slice(0, 5));
    setEditDuration(w.slotDurationMinutes);
    setEditMax(w.maxToursPerSlot);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await manageFetch(`/api/properties/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Property deleted.", "success");
        navigate("/manage/properties", { replace: true });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to delete property.", "error");
      }
    } catch {
      toast("Failed to delete property.", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!property) return null;

  const address = [property.street, property.city, property.state, property.zip].filter(Boolean).join(", ");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/manage/properties" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{property.name}</h1>
        <Link
          to={`/manage/properties/${id}/edit`}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          {address && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Address</h2>
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          {/* Units Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Units <span className="text-gray-400 font-normal">({property.units.length})</span>
              </h2>
              <div className="flex items-center gap-3">
                <Link
                  to={`/manage/properties/${id}/units/bulk`}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  + Bulk Add
                </Link>
                <Link
                  to={`/manage/properties/${id}/units/new`}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Unit
                </Link>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Floor Plan</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Beds</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Rent</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {property.units.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">No units yet.</td></tr>
                ) : (
                  property.units.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <Link to={`/manage/units/${u.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {u.unitNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{u.floorPlan || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{u.bedrooms}bd / {u.bathrooms}ba</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{u.capacity}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">${u.monthlyRent.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge value={u.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Tour Availability */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Tour Availability <span className="text-gray-400 font-normal">({windows.length})</span>
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAddForm ? "Cancel" : "+ Add Window"}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddWindow} className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Day</label>
                  <select value={addDay} onChange={(e) => setAddDay(Number(e.target.value))} className="px-2 py-1.5 border border-gray-300 rounded text-sm">
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Start</label>
                  <input type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">End</label>
                  <input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Duration (min)</label>
                  <input type="number" value={addDuration} onChange={(e) => setAddDuration(Number(e.target.value))} min={15} max={240} className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max/Slot</label>
                  <input type="number" value={addMax} onChange={(e) => setAddMax(Number(e.target.value))} min={1} max={20} className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                </div>
                <button type="submit" disabled={savingWindow} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {savingWindow ? "Saving..." : "Add"}
                </button>
              </form>
            )}

            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Day</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">End</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Max</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {windows.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-400">No availability windows configured.</td></tr>
                ) : (
                  windows.map((w) =>
                    editingId === w.id ? (
                      <tr key={w.id} className="bg-blue-50">
                        <td className="px-4 py-2">
                          <select value={editDay} onChange={(e) => setEditDay(Number(e.target.value))} className="px-1 py-1 border border-gray-300 rounded text-sm">
                            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2"><input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="px-1 py-1 border border-gray-300 rounded text-sm" /></td>
                        <td className="px-4 py-2"><input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="px-1 py-1 border border-gray-300 rounded text-sm" /></td>
                        <td className="px-4 py-2"><input type="number" value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} min={15} max={240} className="w-16 px-1 py-1 border border-gray-300 rounded text-sm" /></td>
                        <td className="px-4 py-2"><input type="number" value={editMax} onChange={(e) => setEditMax(Number(e.target.value))} min={1} max={20} className="w-14 px-1 py-1 border border-gray-300 rounded text-sm" /></td>
                        <td className="px-4 py-2" />
                        <td className="px-4 py-2 flex gap-2">
                          <button onClick={() => handleUpdateWindow(w.id)} disabled={savingWindow} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-sm text-gray-900">{w.dayOfWeek}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{w.startTime.slice(0, 5)}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{w.endTime.slice(0, 5)}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{w.slotDurationMinutes}m</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{w.maxToursPerSlot}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleToggleActive(w)} className={`text-xs font-medium px-2 py-0.5 rounded-full ${w.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {w.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 flex gap-2">
                          <button onClick={() => startEdit(w)} className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                          <button onClick={() => handleDeleteWindow(w.id)} className="text-xs text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Details</h2>
            <div className="text-sm"><span className="text-gray-500">Type:</span> <span className="text-gray-900">{property.type}</span></div>
            <div className="text-sm"><span className="text-gray-500">Total Units:</span> <span className="text-gray-900">{property.totalUnits}</span></div>
            <div className="text-sm"><span className="text-gray-500">Inquiries:</span> <span className="text-gray-900">{property.inquiryCount}</span></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            <div className="text-sm"><span className="text-gray-500">Created:</span> <span className="text-gray-900">{new Date(property.createdAt).toLocaleDateString()}</span></div>
            <div className="text-sm"><span className="text-gray-500">Updated:</span> <span className="text-gray-900">{new Date(property.updatedAt).toLocaleDateString()}</span></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h2>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete this property
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Property"
        message="Are you sure you want to delete this property? All associated units must be removed first."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
