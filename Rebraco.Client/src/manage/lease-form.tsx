import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { manageFetch } from "./api";

interface UnitOption { id: number; unitNumber: string; propertyName: string; }
interface TenantOption { id: number; firstName: string; lastName: string; }

export default function LeaseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [units, setUnits] = useState<UnitOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);

  const [unitId, setUnitId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [bedDesignation, setBedDesignation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [leaseType, setLeaseType] = useState("Fixed");
  const [status, setStatus] = useState("Pending");

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
        manageFetch(`/api/leases/${id}`)
          .then((res) => res.json())
          .then((data) => {
            setUnitId(data.unitId.toString());
            setTenantId(data.tenantId.toString());
            setBedDesignation(data.bedDesignation || "");
            setStartDate(data.startDate.split("T")[0]);
            setEndDate(data.endDate.split("T")[0]);
            setMonthlyRent(data.monthlyRent.toString());
            setSecurityDeposit(data.securityDeposit?.toString() || "");
            setLeaseType(data.leaseType);
            setStatus(data.status);
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
      unitId: Number(unitId),
      tenantId: Number(tenantId),
      bedDesignation: bedDesignation || null,
      startDate,
      endDate,
      monthlyRent: Number(monthlyRent),
      securityDeposit: securityDeposit ? Number(securityDeposit) : null,
      leaseType,
      status,
    };

    try {
      const res = isEdit
        ? await manageFetch(`/api/leases/${id}`, { method: "PATCH", body: JSON.stringify(body) })
        : await manageFetch("/api/leases", { method: "POST", body: JSON.stringify(body) });

      if (res.ok) {
        const data = await res.json();
        navigate(isEdit ? `/manage/leases/${id}` : `/manage/leases/${data.id}`);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to save lease.");
      }
    } catch {
      setError("Failed to save lease.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  const backTo = isEdit ? `/manage/leases/${id}` : "/manage/leases";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={backTo} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Lease" : "New Lease"}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {error && <div className="text-sm px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200">{error}</div>}

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenant *</label>
            <select required value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">Select tenant...</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bed Designation</label>
            <input type="text" value={bedDesignation} onChange={(e) => setBedDesignation(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. Bed A" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent *</label>
            <input type="number" step="0.01" min={0} required value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit</label>
            <input type="number" step="0.01" min={0} value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lease Type</label>
            <select value={leaseType} onChange={(e) => setLeaseType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="Fixed">Fixed</option>
              <option value="MonthToMonth">Month-to-Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full btn btn-primary disabled:opacity-50 inline-flex items-center justify-center">
          {saving ? <><svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</> : isEdit ? "Save Changes" : "Create Lease"}
        </button>
      </form>
    </div>
  );
}
