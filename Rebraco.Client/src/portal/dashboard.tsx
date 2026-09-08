import { useState, useEffect } from "react";
import { Link } from "react-router";
import { portalFetch } from "./api";
import { useAuth } from "./AuthContext";

interface UnitInfo {
  id: number;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  sqFt: number;
  furnished: boolean;
  parkingIncluded: boolean;
  utilitiesIncluded: boolean;
  features: string | null;
  propertyName: string;
  propertyAddress: string;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface LeaseInfo {
  id: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  bedDesignation: string | null;
  status: string;
}

interface InvoiceSummary {
  id: number;
  description: string;
  amountCents: number;
  dueDate: string;
}

interface MaintenanceItem {
  id: number;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function PortalDashboard() {
  const { user } = useAuth();
  const [unit, setUnit] = useState<UnitInfo | null>(null);
  const [lease, setLease] = useState<LeaseInfo | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceItem[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      portalFetch("/api/portal/unit").then((r) => r.json()),
      portalFetch("/api/portal/maintenance").then((r) => r.json()),
      portalFetch("/api/portal/invoices").then((r) => r.json()),
    ])
      .then(([unitData, maintenanceData, invoiceData]) => {
        setUnit(unitData.unit);
        setLease(unitData.lease);
        setMaintenance(maintenanceData.items?.slice(0, 5) || []);
        const unpaid = (invoiceData.items || []).filter((i: any) => i.status === "Sent");
        setOutstandingInvoices(unpaid);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-500 py-8">Loading...</div>;
  }

  const daysLeft = lease
    ? Math.max(0, Math.ceil((new Date(lease.endDate).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome, {user?.name?.split(" ")[0] || "Tenant"}
      </h1>

      {/* Active Lease Summary */}
      {lease && unit ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">Monthly Rent</div>
            <div className="text-2xl font-bold text-gray-900">
              ${lease.monthlyRent.toLocaleString()}
            </div>
            {lease.bedDesignation && (
              <div className="text-xs text-gray-400 mt-1">Bed: {lease.bedDesignation}</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">Lease Ends</div>
            <div className="text-2xl font-bold text-gray-900">
              {new Date(lease.endDate).toLocaleDateString()}
            </div>
            {daysLeft !== null && (
              <div className={`text-xs mt-1 ${daysLeft < 30 ? "text-red-500" : "text-gray-400"}`}>
                {daysLeft} days remaining
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="text-sm text-gray-500 mb-1">Unit</div>
            <div className="text-2xl font-bold text-gray-900">{unit.unitNumber}</div>
            <div className="text-xs text-gray-400 mt-1">{unit.propertyName}</div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 text-center">
          <svg className="w-10 h-10 text-yellow-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          <p className="text-sm font-medium text-yellow-800 mb-1">No active lease found</p>
          <p className="text-sm text-yellow-700">Your lease may not have started yet, or it may have expired. Please contact your property manager for assistance.</p>
        </div>
      )}

      {/* Outstanding Invoices */}
      {outstandingInvoices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Outstanding Invoices</h2>
            <span className="text-sm font-medium text-blue-600">
              {outstandingInvoices.length} unpaid &middot; ${(outstandingInvoices.reduce((sum, i) => sum + i.amountCents, 0) / 100).toFixed(2)}
            </span>
          </div>
          <div className="space-y-2">
            {outstandingInvoices.slice(0, 3).map((inv) => (
              <Link
                key={inv.id}
                to={`/portal/invoices/${inv.id}`}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-blue-50 transition -mx-3"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">{inv.description}</div>
                  <div className="text-xs text-gray-400">Due: {inv.dueDate}</div>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  ${(inv.amountCents / 100).toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
          {outstandingInvoices.length > 3 && (
            <Link to="/portal/invoices" className="block mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all invoices
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Details */}
        {unit && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Unit</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Property</span>
                <span className="text-gray-900 font-medium">{unit.propertyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="text-gray-900 text-right">{unit.propertyAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Layout</span>
                <span className="text-gray-900">
                  {unit.bedrooms} bed / {unit.bathrooms} bath
                  {unit.sqFt ? ` / ${unit.sqFt} sqft` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amenities</span>
                <span className="text-gray-900">
                  {[
                    unit.furnished && "Furnished",
                    unit.parkingIncluded && "Parking",
                    unit.utilitiesIncluded && "Utilities",
                  ]
                    .filter(Boolean)
                    .join(", ") || "None listed"}
                </span>
              </div>
              {unit.contactEmail && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Contact</span>
                  <a href={`mailto:${unit.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                    {unit.contactEmail}
                  </a>
                </div>
              )}
              {unit.contactPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone</span>
                  <a href={`tel:${unit.contactPhone}`} className="text-blue-600 hover:text-blue-800">
                    {unit.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Maintenance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Maintenance Requests</h2>
            <Link
              to="/portal/maintenance/new"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + New Request
            </Link>
          </div>
          {maintenance.length === 0 ? (
            <div className="text-center py-4">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.58 3.2a.75.75 0 01-1.09-.62V4.6a.75.75 0 01.42-.67l5.58-3.2a.75.75 0 01.66 0l5.58 3.2a.75.75 0 01.42.67v13.15a.75.75 0 01-1.09.62l-5.58-3.2a.75.75 0 00-.66 0z" /></svg>
              <p className="text-sm text-gray-500 mb-2">No maintenance requests yet</p>
              <Link to="/portal/maintenance/new" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Submit a request</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenance.map((m) => (
                <Link
                  key={m.id}
                  to={`/portal/maintenance/${m.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition -mx-3"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{m.title}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.status === "Open"
                        ? "bg-blue-100 text-blue-700"
                        : m.status === "InProgress"
                        ? "bg-yellow-100 text-yellow-700"
                        : m.status === "Completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {maintenance.length > 0 && (
            <Link
              to="/portal/maintenance"
              className="block mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View all requests
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
