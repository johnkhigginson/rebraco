import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { Pagination, useDebounce } from "./shared";

interface InvoiceRow {
  id: number;
  description: string;
  amountCents: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  tenantName: string;
  tenantId: number;
  leaseId: number;
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

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const debouncedSearch = useDebounce(search, 300);
  const pageSize = 25;

  const sorted = useMemo(() => {
    if (!sortField) return invoices;
    return [...invoices].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [invoices, sortField, sortDir]);

  function SortHeader({ label, field, align }: { label: string; field: string; align?: string }) {
    return (
      <th
        className={`${align === "right" ? "text-right" : "text-left"} px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-800 select-none`}
        onClick={() => {
          if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
          else { setSortField(field); setSortDir("asc"); }
        }}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {sortField === field && (sortDir === "asc" ? " ▲" : " ▼")}
        </span>
      </th>
    );
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ skip: String(page * pageSize), take: String(pageSize) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter) params.set("status", statusFilter);

    manageFetch(`/api/invoices?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data.items);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link to="/manage/invoices/new"
          className="btn btn-primary">
          Create Invoice
        </Link>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search invoices..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Paid">Paid</option>
          <option value="Failed">Failed</option>
          <option value="Void">Void</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <SortHeader label="Tenant" field="tenantName" />
              <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
              <SortHeader label="Amount" field="amountCents" align="right" />
              <SortHeader label="Due Date" field="dueDate" />
              <SortHeader label="Status" field="status" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                <p className="text-sm font-medium text-gray-900 mb-1">No invoices found</p>
                <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Create invoices for rent, fees, or other charges. Tenants will be able to view and pay them through their portal.</p>
                {search || statusFilter ? (
                  <button onClick={() => { setSearch(""); setStatusFilter(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear filters</button>
                ) : (
                  <Link to="/manage/invoices/new" className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Create your first invoice
                  </Link>
                )}
              </td></tr>
            ) : (
              sorted.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/manage/invoices/${inv.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      {inv.tenantName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{inv.description}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCents(inv.amountCents)}</td>
                  <td className="px-4 py-3 text-gray-600">{inv.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[inv.status] || "bg-gray-100 text-gray-600"}`}>
                      {inv.status}
                    </span>
                  </td>
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
