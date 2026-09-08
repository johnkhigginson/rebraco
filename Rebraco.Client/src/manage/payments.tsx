import { useState, useEffect } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { Pagination, useDebounce } from "./shared";

interface PaymentRow {
  id: number;
  amountCents: number;
  status: string;
  stripePaymentIntentId: string;
  failureReason: string | null;
  createdAt: string;
  tenantName: string;
  invoiceDescription: string;
  invoiceId: number;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-700",
  Succeeded: "bg-green-100 text-green-700",
  Failed: "bg-red-100 text-red-700",
  Refunded: "bg-purple-100 text-purple-700",
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);
  const pageSize = 25;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ skip: String(page * pageSize), take: String(pageSize) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);

    manageFetch(`/api/payments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.items);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, statusFilter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payments</h1>

      <div className="flex gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search payments..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Succeeded">Succeeded</option>
          <option value="Failed">Failed</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tenant</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                <p className="text-sm font-medium text-gray-900 mb-1">No payments found</p>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Payment records will appear here once tenants make payments on their invoices. Send an invoice to get started.</p>
                {search || statusFilter ? (
                  <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-4">Clear filters</button>
                ) : null}
              </td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.tenantName}</td>
                  <td className="px-4 py-3">
                    <Link to={`/manage/invoices/${p.invoiceId}`} className="text-blue-600 hover:text-blue-800">
                      {p.invoiceDescription}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCents(p.amountCents)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[p.status] || "bg-gray-100 text-gray-600"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination total={total} skip={page * pageSize} take={pageSize}
        onSkipChange={(newSkip: number) => setPage(Math.floor(newSkip / pageSize))} />
    </div>
  );
}
