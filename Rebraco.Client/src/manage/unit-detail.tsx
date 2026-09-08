import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, StatusBadge, ConfirmDialog } from "./shared";

interface UnitDetail {
  id: number;
  propertyId: number;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  sqFt: number | null;
  capacity: number;
  monthlyRent: number;
  floorPlan: string | null;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  activeLeaseCount: number;
  property: { id: number; name: string };
  leases: {
    id: number;
    tenantId: number;
    tenantName: string;
    bedDesignation: string | null;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    status: string;
  }[];
}

export default function UnitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<UnitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    manageFetch(`/api/units/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/manage/properties", { replace: true }); return null; }
        return res.json();
      })
      .then((data) => data && setUnit(data))
      .catch(() => toast("Failed to load unit.", "error"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!unit) return;
    setStatusUpdating(true);
    try {
      const res = await manageFetch(`/api/units/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUnit((prev) => prev ? { ...prev, status: newStatus } : prev);
        toast("Status updated.", "success");
      } else {
        toast("Failed to update status.", "error");
      }
    } catch {
      toast("Failed to update status.", "error");
    }
    setStatusUpdating(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await manageFetch(`/api/units/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Unit deleted.", "success");
        navigate(`/manage/properties/${unit?.propertyId}`, { replace: true });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to delete unit.", "error");
      }
    } catch {
      toast("Failed to delete unit.", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!unit) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/manage/properties/${unit.propertyId}`} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">Unit {unit.unitNumber}</h1>
        <select
          value={unit.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={statusUpdating}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Offline">Offline</option>
        </select>
        <Link to={`/manage/units/${id}/edit`} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">Edit</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Unit Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Unit Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Floor Plan:</span> <span className="text-gray-900">{unit.floorPlan || "—"}</span></div>
              <div><span className="text-gray-500">Bedrooms:</span> <span className="text-gray-900">{unit.bedrooms}</span></div>
              <div><span className="text-gray-500">Bathrooms:</span> <span className="text-gray-900">{unit.bathrooms}</span></div>
              <div><span className="text-gray-500">Sq Ft:</span> <span className="text-gray-900">{unit.sqFt?.toLocaleString() || "—"}</span></div>
              <div><span className="text-gray-500">Capacity:</span> <span className="text-gray-900">{unit.capacity} beds</span></div>
              <div><span className="text-gray-500">Rent/bed:</span> <span className="text-gray-900">${unit.monthlyRent.toLocaleString()}</span></div>
              <div><span className="text-gray-500">Active Leases:</span> <span className="text-gray-900">{unit.activeLeaseCount} / {unit.capacity}</span></div>
            </div>
            {unit.description && <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{unit.description}</p>}
          </div>

          {/* Leases */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Leases <span className="text-gray-400 font-normal">({unit.leases.length})</span></h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Bed</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Rent</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {unit.leases.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No leases yet.</td></tr>
                ) : (
                  unit.leases.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <Link to={`/manage/tenants/${l.tenantId}`} className="text-sm text-blue-600 hover:text-blue-800">{l.tenantName}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{l.bedDesignation || "—"}</td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">
                        {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">${l.monthlyRent.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge value={l.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Property</h2>
            <Link to={`/manage/properties/${unit.property.id}`} className="text-sm text-blue-600 hover:text-blue-800">{unit.property.name}</Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            <div className="text-sm"><span className="text-gray-500">Created:</span> <span className="text-gray-900">{new Date(unit.createdAt).toLocaleDateString()}</span></div>
            <div className="text-sm"><span className="text-gray-500">Updated:</span> <span className="text-gray-900">{new Date(unit.updatedAt).toLocaleDateString()}</span></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h2>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete this unit
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Unit"
        message="Are you sure you want to delete this unit? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
