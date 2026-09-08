import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, Link } from "react-router";
import { manageFetch } from "./api";

interface LeaseOption {
  id: number;
  tenantId: number;
  tenantName: string;
  unitNumber: string;
  propertyName: string;
  monthlyRent: number;
  securityDeposit: number | null;
}

export default function InvoiceFormPage() {
  const navigate = useNavigate();
  const [leases, setLeases] = useState<LeaseOption[]>([]);
  const [leaseId, setLeaseId] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    manageFetch("/api/leases?status=Active&take=100")
      .then((r) => r.json())
      .then((data) => {
        const options = (data.items || []).map((l: any) => ({
          id: l.id,
          tenantId: l.tenantId,
          tenantName: l.tenantName || `${l.tenant?.firstName || ""} ${l.tenant?.lastName || ""}`.trim(),
          unitNumber: l.unitNumber || l.unit?.unitNumber || "",
          propertyName: l.propertyName || l.property?.name || "",
          monthlyRent: l.monthlyRent,
          securityDeposit: l.securityDeposit,
        }));
        setLeases(options);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedLease = leases.find((l) => l.id === leaseId);

  const fillMonthlyRent = () => {
    if (selectedLease) {
      setAmount((selectedLease.monthlyRent).toFixed(2));
      if (!description) setDescription("Monthly Rent");
    }
  };

  const fillDeposit = () => {
    if (selectedLease?.securityDeposit) {
      setAmount((selectedLease.securityDeposit).toFixed(2));
      if (!description) setDescription("Security Deposit");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!leaseId || !selectedLease) {
      setError("Please select a lease.");
      return;
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await manageFetch("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          leaseId,
          tenantId: selectedLease.tenantId,
          description,
          amountCents,
          dueDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to create invoice.");
        return;
      }

      const data = await res.json();
      navigate(`/manage/invoices/${data.id}`);
    } catch {
      setError("Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  return (
    <div className="max-w-lg">
      <Link to="/manage/invoices" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to invoices
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Invoice</h1>

      <form onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lease</label>
          <select value={leaseId} onChange={(e) => setLeaseId(Number(e.target.value))} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">Select lease...</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.tenantName} — {l.propertyName} Unit {l.unitNumber} (${l.monthlyRent}/mo)
              </option>
            ))}
          </select>
        </div>

        {selectedLease && (
          <div className="flex gap-2">
            <button type="button" onClick={fillMonthlyRent}
              className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              Monthly Rent (${selectedLease.monthlyRent})
            </button>
            {selectedLease.securityDeposit && (
              <button type="button" onClick={fillDeposit}
                className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                Security Deposit (${selectedLease.securityDeposit})
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
            required maxLength={500} placeholder="Monthly Rent — April 2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            required placeholder="1250.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full btn btn-primary disabled:opacity-50">
          {submitting ? "Creating..." : "Create Invoice"}
        </button>
      </form>
    </div>
  );
}
