import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, ConfirmDialog } from "./shared";

interface PaymentRecord {
  id: number;
  amountCents: number;
  status: string;
  stripePaymentIntentId: string;
  failureReason: string | null;
  createdAt: string;
}

interface InvoiceDetail {
  id: number;
  description: string;
  amountCents: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  stripePaymentIntentId: string | null;
  tenantName: string;
  tenantId: number;
  leaseId: number;
  payments: PaymentRecord[];
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  Void: "bg-gray-100 text-gray-500",
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchInvoice = () => {
    manageFetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then(setInvoice)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchInvoice, [id]);

  const handleSend = async () => {
    setActionLoading(true);
    try {
      const res = await manageFetch(`/api/invoices/${id}/send`, { method: "PATCH" });
      if (res.ok) fetchInvoice();
    } catch {} finally { setActionLoading(false); }
  };

  const handleVoid = async () => {
    setActionLoading(true);
    try {
      const res = await manageFetch(`/api/invoices/${id}/void`, { method: "PATCH" });
      if (res.ok) {
        toast("Invoice voided.", "success");
        fetchInvoice();
      } else {
        toast("Failed to void invoice.", "error");
      }
    } catch {
      toast("Failed to void invoice.", "error");
    } finally {
      setActionLoading(false);
      setShowVoidConfirm(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await manageFetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Invoice deleted.", "success");
        navigate("/manage/invoices", { replace: true });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to delete invoice.", "error");
      }
    } catch {
      toast("Failed to delete invoice.", "error");
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!invoice) return <div className="text-gray-500 py-8">Invoice not found.</div>;

  const statusColor = STATUS_COLORS[invoice.status] || "bg-gray-100 text-gray-600";

  return (
    <div className="max-w-2xl">
      <Link to="/manage/invoices" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to invoices
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Invoice #{invoice.id}</h1>
            <p className="text-sm text-gray-500 mt-1">{invoice.description}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
            {invoice.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <span className="text-gray-500">Tenant</span>
            <p className="font-medium text-gray-900">
              <Link to={`/manage/tenants/${invoice.tenantId}`} className="text-blue-600 hover:text-blue-800">
                {invoice.tenantName}
              </Link>
            </p>
          </div>
          <div>
            <span className="text-gray-500">Amount</span>
            <p className="font-bold text-gray-900 text-lg">{formatCents(invoice.amountCents)}</p>
          </div>
          <div>
            <span className="text-gray-500">Due Date</span>
            <p className="font-medium text-gray-900">{invoice.dueDate}</p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p className="font-medium text-gray-900">
              {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
          {invoice.paidAt && (
            <div>
              <span className="text-gray-500">Paid</span>
              <p className="font-medium text-green-700">
                {new Date(invoice.paidAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-100 pt-4">
          {invoice.status === "Draft" && (
            <button onClick={handleSend} disabled={actionLoading}
              className="btn btn-primary disabled:opacity-50">
              Send to Tenant
            </button>
          )}
          {(invoice.status === "Draft" || invoice.status === "Sent") && (
            <button onClick={() => setShowVoidConfirm(true)} disabled={actionLoading}
              className="text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors">
              Void Invoice
            </button>
          )}
          {invoice.status === "Draft" && (
            <button onClick={() => setShowDeleteConfirm(true)} disabled={actionLoading}
              className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50">
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Attempts</h2>
          <div className="space-y-3">
            {invoice.payments.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{formatCents(p.amountCents)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === "Succeeded" ? "bg-green-100 text-green-700" :
                    p.status === "Failed" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{p.status}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(p.createdAt).toLocaleString()}
                </p>
                {p.failureReason && (
                  <p className="text-xs text-red-600 mt-1">{p.failureReason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showVoidConfirm}
        title="Void Invoice"
        message="Are you sure you want to void this invoice? This action cannot be undone."
        confirmLabel="Void"
        onConfirm={handleVoid}
        onCancel={() => setShowVoidConfirm(false)}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
