import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { useDebounce, useToast, Pagination, TableSkeleton, StatusBadge } from "./shared";

const TOUR_STATUS_COLORS: Record<string, string> = {
  Requested: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
  NoShow: "bg-red-100 text-red-800",
};

interface TourItem {
  id: number;
  fullName: string;
  email: string;
  propertyName: string;
  unitNumber: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

interface PropertyOption {
  id: number;
  name: string;
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export default function ToursPage() {
  const { toast } = useToast();
  const [tours, setTours] = useState<TourItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [skip, setSkip] = useState(0);
  const take = 25;

  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const debouncedSearch = useDebounce(search, 300);

  const sorted = useMemo(() => {
    if (!sortField) return tours;
    return [...tours].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tours, sortField, sortDir]);

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
    manageFetch("/api/properties?take=500")
      .then((r) => r.json())
      .then((data) => setProperties(data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    if (propertyId) params.set("propertyId", propertyId);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("skip", skip.toString());
    params.set("take", take.toString());

    manageFetch(`/api/tours?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTours(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => toast("Failed to load tours.", "error"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, propertyId, dateFrom, dateTo, skip]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          placeholder="Search guest name or email..."
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="Requested">Requested</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="NoShow">No Show</option>
        </select>
        <select
          value={propertyId}
          onChange={(e) => { setPropertyId(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          title="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          title="To date"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="Guest" field="fullName" />
              <SortHeader label="Property" field="propertyName" />
              <SortHeader label="Date" field="scheduledDate" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
              <SortHeader label="Status" field="status" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton cols={6} />
            ) : tours.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  <p className="text-sm font-medium text-gray-900 mb-1">No tours found</p>
                  <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Property tours scheduled by prospective tenants through your public listings will appear here for you to confirm or reschedule.</p>
                  {search || status || propertyId || dateFrom || dateTo ? (
                    <button onClick={() => { setSearch(""); setStatus(""); setPropertyId(""); setDateFrom(""); setDateTo(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear filters</button>
                  ) : null}
                </td>
              </tr>
            ) : (
              sorted.map((tour) => (
                <tr key={tour.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/manage/tours/${tour.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {tour.fullName}
                    </Link>
                    <div className="text-xs text-gray-400">{tour.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tour.propertyName}
                    {tour.unitNumber && <span className="text-gray-400"> · Unit {tour.unitNumber}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(tour.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatTime(tour.startTime)} – {formatTime(tour.endTime)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={tour.status} colors={TOUR_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(tour.createdAt).toLocaleDateString()}
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
