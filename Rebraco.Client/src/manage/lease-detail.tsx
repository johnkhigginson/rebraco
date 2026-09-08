import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, StatusBadge, ConfirmDialog } from "./shared";

interface LeaseDetail {
  id: number;
  unitId: number;
  unitNumber: string;
  propertyId: number;
  propertyName: string;
  tenantId: number;
  tenantName: string;
  bedDesignation: string | null;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number | null;
  status: string;
  leaseType: string;
  createdAt: string;
  updatedAt: string;
}

export default function LeaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    manageFetch(`/api/leases/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/manage/leases", { replace: true }); return null; }
        return res.json();
      })
      .then((data) => data && setLease(data))
      .catch(() => toast("Failed to load lease.", "error"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lease) return;
    setStatusUpdating(true);
    try {
      const res = await manageFetch(`/api/leases/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setLease((prev) => prev ? { ...prev, status: data.status } : prev);
        toast("Status updated.", "success");
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to update status.", "error");
      }
    } catch {
      toast("Failed to update status.", "error");
    }
    setStatusUpdating(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await manageFetch(`/api/leases/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Lease deleted.", "success");
        navigate("/manage/leases", { replace: true });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to delete lease.", "error");
      }
    } catch {
      toast("Failed to delete lease.", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!lease) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/manage/leases" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">
          Lease #{lease.id}
        </h1>
        <select
          value={lease.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={statusUpdating}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Terminated">Terminated</option>
        </select>
        <Link
          to={`/manage/leases/${id}/edit`}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Lease Terms */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Lease Terms</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Start Date:</span> <span className="text-gray-900">{new Date(lease.startDate).toLocaleDateString()}</span></div>
              <div><span className="text-gray-500">End Date:</span> <span className="text-gray-900">{new Date(lease.endDate).toLocaleDateString()}</span></div>
              <div><span className="text-gray-500">Monthly Rent:</span> <span className="text-gray-900">${lease.monthlyRent.toLocaleString()}</span></div>
              <div><span className="text-gray-500">Security Deposit:</span> <span className="text-gray-900">{lease.securityDeposit != null ? `$${lease.securityDeposit.toLocaleString()}` : "—"}</span></div>
              <div><span className="text-gray-500">Lease Type:</span> <span className="text-gray-900">{lease.leaseType}</span></div>
              <div><span className="text-gray-500">Bed Designation:</span> <span className="text-gray-900">{lease.bedDesignation || "—"}</span></div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Status</h2>
            <StatusBadge value={lease.status} />
          </div>

          {/* Delete */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h2>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete this lease
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Property / Unit</h2>
            <div className="text-sm space-y-1">
              <Link to={`/manage/properties/${lease.propertyId}`} className="text-blue-600 hover:text-blue-800 block">{lease.propertyName}</Link>
              <Link to={`/manage/units/${lease.unitId}`} className="text-blue-600 hover:text-blue-800 block">Unit {lease.unitNumber}</Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Tenant</h2>
            <Link to={`/manage/tenants/${lease.tenantId}`} className="text-sm text-blue-600 hover:text-blue-800">{lease.tenantName}</Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            <div className="text-sm"><span className="text-gray-500">Created:</span> <span className="text-gray-900">{new Date(lease.createdAt).toLocaleDateString()}</span></div>
            <div className="text-sm"><span className="text-gray-500">Updated:</span> <span className="text-gray-900">{new Date(lease.updatedAt).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Lease"
        message="Are you sure you want to delete this lease? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
