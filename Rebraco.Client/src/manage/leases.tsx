import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { useDebounce, useToast, Pagination, TableSkeleton, StatusBadge } from "./shared";

interface Lease {
  id: number;
  unitId: number;
  unitNumber: string;
  propertyName: string;
  tenantId: number;
  tenantName: string;
  bedDesignation: string | null;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: string;
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [skip, setSkip] = useState(0);
  const take = 25;
  const { toast } = useToast();

  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const debouncedSearch = useDebounce(search, 300);

  const sorted = useMemo(() => {
    if (!sortField) return leases;
    return [...leases].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [leases, sortField, sortDir]);

  function SortHeader({ label, field }: { label: string; field: string }) {
    return (
      <th
        className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700 select-none"
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
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    params.set("skip", skip.toString());
    params.set("take", take.toString());

    manageFetch(`/api/leases?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setLeases(data.items);
        setTotal(data.total);
      })
      .catch(() => toast("Failed to load leases.", "error"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, skip]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
        <Link
          to="/manage/leases/new"
          className="btn btn-primary"
        >
          New Lease
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search leases..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="Property / Unit" field="propertyName" />
              <SortHeader label="Tenant" field="tenantName" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Bed</th>
              <SortHeader label="Start Date" field="startDate" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rent</th>
              <SortHeader label="Status" field="status" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton cols={6} />
            ) : leases.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                <p className="text-sm font-medium text-gray-900 mb-1">No leases found</p>
                <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Leases connect tenants to units with rent amounts and term dates. Create your first lease to start tracking occupancy and revenue.</p>
                {search || status ? (
                  <button onClick={() => { setSearch(""); setStatus(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear filters</button>
                ) : (
                  <Link to="/manage/leases/new" className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Create a lease
                  </Link>
                )}
              </td></tr>
            ) : (
              sorted.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/manage/leases/${l.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {l.propertyName} — {l.unitNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/manage/tenants/${l.tenantId}`} className="text-sm text-blue-600 hover:text-blue-800">
                      {l.tenantName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{l.bedDesignation || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(l.startDate).toLocaleDateString()} — {new Date(l.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">${l.monthlyRent.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={l.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination skip={skip} take={take} total={total} onSkipChange={setSkip} />
    </div>
  );
}
