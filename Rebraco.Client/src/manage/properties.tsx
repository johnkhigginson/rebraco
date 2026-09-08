import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { useDebounce, useToast, Pagination, TableSkeleton, StatusBadge, PROPERTY_TYPE_COLORS } from "./shared";

interface Property {
  id: number;
  name: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  type: string;
  totalUnits: number;
  createdAt: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [skip, setSkip] = useState(0);
  const take = 25;
  const { toast } = useToast();

  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const debouncedSearch = useDebounce(search, 300);

  const sorted = useMemo(() => {
    if (!sortField) return properties;
    return [...properties].sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortField] ?? "";
      const bVal = (b as unknown as Record<string, unknown>)[sortField] ?? "";
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [properties, sortField, sortDir]);

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
    if (type) params.set("type", type);
    params.set("skip", skip.toString());
    params.set("take", take.toString());

    manageFetch(`/api/properties?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setProperties(data.items);
        setTotal(data.total);
      })
      .catch(() => toast("Failed to load properties.", "error"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, type, skip]);

  const formatAddress = (p: Property) => {
    const parts = [p.street, p.city, p.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <Link
          to="/manage/properties/new"
          className="btn btn-primary"
        >
          Add Property
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSkip(0); }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setSkip(0); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">All Types</option>
          <option value="Apartment">Apartment</option>
          <option value="House">House</option>
          <option value="Townhome">Townhome</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <SortHeader label="Name" field="name" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <SortHeader label="Units" field="totalUnits" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableSkeleton cols={5} />
            ) : properties.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-16 text-center">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                <p className="text-sm font-medium text-gray-900 mb-1">No properties found</p>
                <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">Properties are the foundation of your rental portfolio. Add your first property to start managing units, tenants, and leases.</p>
                {search || type ? (
                  <button onClick={() => { setSearch(""); setType(""); }} className="text-sm text-blue-600 hover:text-blue-800 font-medium">Clear filters</button>
                ) : (
                  <Link to="/manage/properties/new" className="btn btn-primary inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add your first property
                  </Link>
                )}
              </td></tr>
            ) : (
              sorted.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/manage/properties/${p.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatAddress(p)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={p.type} colors={PROPERTY_TYPE_COLORS} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.totalUnits}</td>
                  <td className="px-4 py-3">
                    <Link to={`/manage/properties/${p.id}`} className="text-sm text-blue-600 hover:text-blue-800">View</Link>
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
