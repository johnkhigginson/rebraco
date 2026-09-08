import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { useDebounce, useToast, Pagination, TableSkeleton, StatusBadge } from "./shared";

interface Tenant {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  moveInDate: string | null;
  status: string;
  createdAt: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
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
    if (!sortField) return tenants;
    return [...tenants].sort((a, b) => {
      let aVal: unknown, bVal: unknown;
      if (sortField === "name") {
        aVal = `${a.firstName} ${a.lastName}`;
        bVal = `${b.firstName} ${b.lastName}`;
      } else {
        aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
        bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
      }
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tenants, sortField, sortDir]);

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

    manageFetch(`/api/tenants?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setTenants(data.items);
        setTotal(data.total);
      })
      .catch(() => toast("Failed to load tenants.", "error"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, skip]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <Link
          to="/manage/tenants/new"
          className="btn btn-primary"
        >
          Add Tenant
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search tenants..."
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
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Evicted">Evicted</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="Name" field="name" />
              <SortHeader label="Email" field="email" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Move-in</th>
              <SortHeader label="Status" field="status" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton cols={6} />
            ) : tenants.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                <p className="text-sm font-medium text-gray-900 mb-1">No tenants found</p>
                <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Keep track of your tenants, their contact information, and lease history all in one place.</p>
                {search || status ? (
                  <button onClick={() => { setSearch(""); setStatus(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear filters</button>
                ) : (
                  <Link to="/manage/tenants/new" className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add your first tenant
                  </Link>
                )}
              </td></tr>
            ) : (
              sorted.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/manage/tenants/${t.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {t.firstName} {t.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.phone || "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {t.moveInDate ? new Date(t.moveInDate).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/manage/tenants/${t.id}`} className="text-sm text-blue-600 hover:text-blue-800">View</Link>
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
