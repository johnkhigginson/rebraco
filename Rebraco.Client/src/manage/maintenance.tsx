import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { useDebounce, useToast, Pagination, TableSkeleton, StatusBadge, PRIORITY_COLORS } from "./shared";

interface MaintenanceRequest {
  id: number;
  unitId: number;
  unitNumber: string;
  propertyName: string;
  title: string;
  priority: string;
  status: string;
  category: string;
  createdAt: string;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [skip, setSkip] = useState(0);
  const take = 25;
  const { toast } = useToast();

  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const debouncedSearch = useDebounce(search, 300);

  const sorted = useMemo(() => {
    if (!sortField) return requests;
    return [...requests].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [requests, sortField, sortDir]);

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
    if (priority) params.set("priority", priority);
    params.set("skip", skip.toString());
    params.set("take", take.toString());

    manageFetch(`/api/maintenance?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setRequests(data.items);
        setTotal(data.total);
      })
      .catch(() => toast("Failed to load maintenance requests.", "error"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, priority, skip]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
        <Link
          to="/manage/maintenance/new"
          className="btn btn-primary"
        >
          New Request
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search requests..."
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
          <option value="Open">Open</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <select
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Emergency">Emergency</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="Title" field="title" />
              <SortHeader label="Property" field="propertyName" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <SortHeader label="Priority" field="priority" />
              <SortHeader label="Status" field="status" />
              <SortHeader label="Date" field="createdAt" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton cols={6} />
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-16 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.58 3.2a.75.75 0 01-1.09-.62V4.6a.75.75 0 01.42-.67l5.58-3.2a.75.75 0 01.66 0l5.58 3.2a.75.75 0 01.42.67v13.15a.75.75 0 01-1.09.62l-5.58-3.2a.75.75 0 00-.66 0z M21.75 12a.75.75 0 00-.75-.75h-3m3 .75a.75.75 0 01-.75.75h-3" /><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.58 3.2M11.42 15.17V4.6m0 10.57l5.58 3.2" /></svg>
                <p className="text-sm font-medium text-gray-900 mb-1">No maintenance requests found</p>
                <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Track repair requests, assign priorities, and keep your properties in top shape. Tenants can also submit requests through their portal.</p>
                {search || status || priority ? (
                  <button onClick={() => { setSearch(""); setStatus(""); setPriority(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear filters</button>
                ) : (
                  <Link to="/manage/maintenance/new" className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Create a request
                  </Link>
                )}
              </td></tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/manage/maintenance/${r.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.propertyName} — {r.unitNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.category}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.priority} colors={PRIORITY_COLORS} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={r.status} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(r.createdAt).toLocaleDateString()}</td>
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
