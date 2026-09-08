import { useState, useEffect } from "react";
import { Link } from "react-router";
import { manageFetch } from "./api";
import { StatusBadge, useToast } from "./shared";

interface DashboardData {
  propertyCount: number;
  unitCount: number;
  occupiedUnitCount: number;
  activeTenantCount: number;
  activeLeaseCount: number;
  openMaintenanceCount: number;
  totalMonthlyRevenue: number;
  vacancyCost: number;
  maintenanceEstimated: number;
  maintenanceActualThisMonth: number;
  unitsByStatus: { available: number; occupied: number; maintenance: number; offline: number };
  maintenanceByPriority: { low: number; medium: number; high: number; emergency: number };
  expiringLeases: { id: number; tenantName: string; unitNumber: string; propertyName: string; endDate: string; monthlyRent: number }[];
  recentInquiries: { id: number; fullName: string; propertyName: string | null; status: string; createdAt: string }[];
}

const INQUIRY_STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  Contacted: "bg-indigo-100 text-indigo-700",
  Touring: "bg-purple-100 text-purple-700",
  Applied: "bg-teal-100 text-teal-700",
  Closed: "bg-gray-100 text-gray-600",
  Spam: "bg-red-100 text-red-600",
};

function fmt$(n: number) {
  return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    manageFetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .catch(() => toast("Failed to load dashboard data.", "error"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-gray-400 text-center py-12">Unable to load dashboard.</p>;

  const occupancyRate = data.unitCount > 0 ? Math.round((data.occupiedUnitCount / data.unitCount) * 100) : 0;

  const statCards = [
    { label: "Properties", value: data.propertyCount, icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", color: "text-blue-600 bg-blue-50" },
    { label: "Units", value: data.unitCount, icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "text-purple-600 bg-purple-50" },
    { label: "Occupancy", value: `${occupancyRate}%`, icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: occupancyRate >= 80 ? "text-green-600 bg-green-50" : occupancyRate >= 50 ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50" },
    { label: "Active Tenants", value: data.activeTenantCount, icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "text-teal-600 bg-teal-50" },
    { label: "Open Maintenance", value: data.openMaintenanceCount, icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", color: data.openMaintenanceCount > 0 ? "text-orange-600 bg-orange-50" : "text-green-600 bg-green-50" },
  ];

  const financeCards = [
    { label: "Monthly Revenue", value: fmt$(data.totalMonthlyRevenue), sub: `${data.activeLeaseCount} active leases`, color: "text-green-600" },
    { label: "Vacancy Cost", value: fmt$(data.vacancyCost), sub: `${data.unitsByStatus.available} units available`, color: data.vacancyCost > 0 ? "text-red-600" : "text-green-600" },
    { label: "Maint. Estimated", value: fmt$(data.maintenanceEstimated), sub: `${data.openMaintenanceCount} open requests`, color: "text-orange-600" },
    { label: "Maint. Spent (MTD)", value: fmt$(data.maintenanceActualThisMonth), sub: "completed this month", color: "text-blue-600" },
  ];

  const unitStatusItems = [
    { label: "Available", count: data.unitsByStatus.available, color: "bg-green-500" },
    { label: "Occupied", count: data.unitsByStatus.occupied, color: "bg-blue-500" },
    { label: "Maintenance", count: data.unitsByStatus.maintenance, color: "bg-yellow-500" },
    { label: "Offline", count: data.unitsByStatus.offline, color: "bg-gray-400" },
  ];

  const priorityItems = [
    { label: "Emergency", count: data.maintenanceByPriority.emergency, color: "bg-red-100 text-red-700" },
    { label: "High", count: data.maintenanceByPriority.high, color: "bg-orange-100 text-orange-700" },
    { label: "Medium", count: data.maintenanceByPriority.medium, color: "bg-blue-100 text-blue-700" },
    { label: "Low", count: data.maintenanceByPriority.low, color: "bg-gray-100 text-gray-600" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Link to="/manage/properties/new" className="btn btn-primary text-sm">+ Property</Link>
          <Link to="/manage/maintenance/new" className="btn btn-ghost text-sm">+ Maintenance</Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500 uppercase">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Finance Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {financeCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-xs font-medium text-gray-500 uppercase mb-1">{card.label}</div>
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-400 mt-1">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Expiring Leases */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Expiring Leases <span className="text-gray-400 font-normal">(next 30 days)</span></h2>
            <Link to="/manage/leases" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View All</Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Rent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.expiringLeases.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm font-medium text-gray-500">All clear</p>
                  <p className="text-xs text-gray-400 mt-1">No leases expiring in the next 30 days.</p>
                </td></tr>
              ) : (
                data.expiringLeases.map((l) => {
                  const endDate = new Date(l.endDate);
                  const daysLeft = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <Link to={`/manage/leases/${l.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">{l.tenantName}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{l.propertyName} — {l.unitNumber}</td>
                      <td className="px-4 py-2.5 text-sm">
                        <span className={daysLeft <= 7 ? "text-red-600 font-medium" : daysLeft <= 14 ? "text-yellow-600" : "text-gray-600"}>
                          {endDate.toLocaleDateString()}
                          {daysLeft <= 7 && <span className="ml-1 text-xs">({daysLeft}d)</span>}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-gray-600">{fmt$(l.monthlyRent)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Sidebar: Unit Status + Maintenance Priority */}
        <div className="space-y-6">
          {/* Unit Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Unit Status</h2>
            {data.unitCount === 0 ? (
              <div className="text-center py-2">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg>
                <p className="text-sm text-gray-500">No units yet</p>
                <Link to="/manage/properties" className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 inline-block">Add a property to get started</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bar */}
                <div className="flex rounded-full overflow-hidden h-3">
                  {unitStatusItems.map((item) => {
                    const pct = (item.count / data.unitCount) * 100;
                    return pct > 0 ? (
                      <div key={item.label} className={`${item.color}`} style={{ width: `${pct}%` }} title={`${item.label}: ${item.count}`} />
                    ) : null;
                  })}
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 gap-2">
                  {unitStatusItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      <span className="text-xs text-gray-600">{item.label}</span>
                      <span className="text-xs font-semibold text-gray-900 ml-auto">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Priority */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Open Maintenance</h2>
            {data.openMaintenanceCount === 0 ? (
              <div className="text-center py-2">
                <svg className="w-8 h-8 text-green-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-gray-500">No open requests</p>
                <p className="text-xs text-gray-400 mt-1">All maintenance is up to date.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {priorityItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${item.color}`}>
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Inquiries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Recent Inquiries</h2>
          <Link to="/manage/inquiries" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View All</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.recentInquiries.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-12 text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                <p className="text-sm font-medium text-gray-500">No inquiries yet</p>
                <p className="text-xs text-gray-400 mt-1">Inquiries from your public listings will appear here.</p>
              </td></tr>
            ) : (
              data.recentInquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link to={`/manage/inquiries/${inq.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {inq.fullName}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">{inq.propertyName || "—"}</td>
                  <td className="px-4 py-2.5">
                    <StatusBadge value={inq.status} colors={INQUIRY_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">{new Date(inq.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
