import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { useDebounce, useToast, Pagination, TableSkeleton, StatusBadge } from "./shared";

interface Inquiry {
  id: number;
  propertyName: string | null;
  unitName: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  source: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "New", label: "New" },
  { value: "InProgress", label: "In Progress" },
  { value: "Responded", label: "Responded" },
  { value: "Closed", label: "Closed" },
];

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const take = 25;
  const { toast } = useToast();

  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const debouncedSearch = useDebounce(search, 300);

  const sorted = useMemo(() => {
    if (!sortField) return inquiries;
    return [...inquiries].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [inquiries, sortField, sortDir]);

  function SortHeader({ label, field }: { label: string; field: string }) {
    return (
      <th
        className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-800 select-none"
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
    if (status) params.set("status", status);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("skip", String(skip));
    params.set("take", String(take));

    manageFetch(`/api/inquiries?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setInquiries(data.items);
        setTotal(data.total);
      })
      .catch(() => toast("Failed to load inquiries.", "error"))
      .finally(() => setLoading(false));
  }, [status, debouncedSearch, skip]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, property..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          className="flex-1 max-w-sm px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="Name" field="fullName" />
              <SortHeader label="Property" field="propertyName" />
              <SortHeader label="Status" field="status" />
              <SortHeader label="Date" field="createdAt" />
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={5} />
            ) : inquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  <p className="text-sm font-medium text-gray-900 mb-1">No inquiries found</p>
                  <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">When prospective tenants reach out through your property listings, their inquiries will show up here.</p>
                  {search || status ? (
                    <button onClick={() => { setSearch(""); setStatus(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear filters</button>
                  ) : null}
                </td>
              </tr>
            ) : (
              sorted.map((inq) => (
                <tr key={inq.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{inq.fullName}</div>
                    <div className="text-xs text-gray-500">{inq.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {inq.propertyName || "—"}
                    {inq.unitName && (
                      <span className="text-gray-400"> / {inq.unitName}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={inq.status} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(inq.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/manage/inquiries/${inq.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </Link>
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
