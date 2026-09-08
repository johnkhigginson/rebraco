import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, StatusBadge, ConfirmDialog } from "./shared";

interface TenantDetail {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  moveInDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  leases: {
    id: number;
    unitId: number;
    unitNumber: string;
    propertyName: string;
    bedDesignation: string | null;
    startDate: string;
    endDate: string;
    monthlyRent: number;
    status: string;
  }[];
}

export default function TenantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    manageFetch(`/api/tenants/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/manage/tenants", { replace: true }); return null; }
        return res.json();
      })
      .then((data) => data && setTenant(data))
      .catch(() => toast("Failed to load tenant.", "error"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!tenant) return;
    setStatusUpdating(true);
    try {
      const res = await manageFetch(`/api/tenants/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTenant((prev) => prev ? { ...prev, status: newStatus } : prev);
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
      const res = await manageFetch(`/api/tenants/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Tenant deleted.", "success");
        navigate("/manage/tenants", { replace: true });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to delete tenant.", "error");
      }
    } catch {
      toast("Failed to delete tenant.", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!tenant) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/manage/tenants" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{tenant.firstName} {tenant.lastName}</h1>
        <select
          value={tenant.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={statusUpdating}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Evicted">Evicted</option>
        </select>
        <Link to={`/manage/tenants/${id}/edit`} className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">Edit</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Email:</span> <a href={`mailto:${tenant.email}`} className="text-blue-600 hover:underline">{tenant.email}</a></div>
              <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{tenant.phone || "—"}</span></div>
              <div><span className="text-gray-500">Move-in Date:</span> <span className="text-gray-900">{tenant.moveInDate ? new Date(tenant.moveInDate).toLocaleDateString() : "—"}</span></div>
            </div>
          </div>

          {/* Emergency Contact */}
          {(tenant.emergencyContactName || tenant.emergencyContactPhone) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Emergency Contact</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Name:</span> <span className="text-gray-900">{tenant.emergencyContactName || "—"}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="text-gray-900">{tenant.emergencyContactPhone || "—"}</span></div>
              </div>
            </div>
          )}

          {/* Leases */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">Leases <span className="text-gray-400 font-normal">({tenant.leases.length})</span></h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Property / Unit</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Bed</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Rent</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenant.leases.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No leases yet.</td></tr>
                ) : (
                  tenant.leases.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <Link to={`/manage/units/${l.unitId}`} className="text-sm text-blue-600 hover:text-blue-800">
                          {l.propertyName} — {l.unitNumber}
                        </Link>
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
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Status</h2>
            <StatusBadge value={tenant.status} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            <div className="text-sm"><span className="text-gray-500">Created:</span> <span className="text-gray-900">{new Date(tenant.createdAt).toLocaleDateString()}</span></div>
            <div className="text-sm"><span className="text-gray-500">Updated:</span> <span className="text-gray-900">{new Date(tenant.updatedAt).toLocaleDateString()}</span></div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h2>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete this tenant
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Tenant"
        message="Are you sure you want to delete this tenant? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
