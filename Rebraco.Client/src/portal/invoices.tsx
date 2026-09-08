import { useState, useEffect } from "react";
import { Link } from "react-router";
import { portalFetch } from "./api";

interface InvoiceRow {
  id: number;
  description: string;
  amountCents: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Sent: "bg-blue-100 text-blue-700",
  Paid: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch("/api/portal/invoices")
      .then((r) => r.json())
      .then((data) => setInvoices(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  const unpaid = invoices.filter((i) => i.status === "Sent");
  const paid = invoices.filter((i) => i.status !== "Sent");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Invoices</h1>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
          <p className="text-sm font-medium text-gray-900 mb-1">No invoices yet</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">You're all caught up. When your property manager sends an invoice, it will appear here for review and payment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unpaid.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Outstanding</h2>
              <div className="space-y-3">
                {unpaid.map((inv) => (
                  <div key={inv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{inv.description}</p>
                      <p className="text-sm text-gray-500 mt-0.5">Due: {inv.dueDate}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900">{formatCents(inv.amountCents)}</span>
                      <Link to={`/portal/invoices/${inv.id}`}
                        className="btn btn-primary">
                        Pay Now
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {paid.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">History</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paid.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{inv.description}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCents(inv.amountCents)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600"}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : inv.dueDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
