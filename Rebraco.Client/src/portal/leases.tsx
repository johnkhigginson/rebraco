import { useState, useEffect } from "react";
import { Link } from "react-router";
import { portalFetch } from "./api";

interface Lease {
  id: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number | null;
  bedDesignation: string | null;
  status: string;
  leaseType: string;
  unit: { id: number; unitNumber: string; bedrooms: number; bathrooms: number };
  property: { name: string; city: string; state: string };
}

export default function PortalLeases() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch("/api/portal/leases")
      .then((r) => r.json())
      .then((data) => setLeases(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Leases</h1>

      {leases.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          <p className="text-sm font-medium text-gray-900 mb-1">No leases found</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">Your lease agreements will show up here once your property manager creates one. Contact them if you believe this is an error.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leases.map((lease) => {
            const isActive = lease.status === "Active";
            return (
              <Link
                key={lease.id}
                to={`/portal/leases/${lease.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {lease.property.name} — Unit {lease.unit.unitNumber}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {lease.unit.bedrooms} bed / {lease.unit.bathrooms} bath
                      {lease.bedDesignation && ` · Bed ${lease.bedDesignation}`}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(lease.startDate).toLocaleDateString()} — {new Date(lease.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        isActive
                          ? "bg-green-100 text-green-700"
                          : lease.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {lease.status}
                    </span>
                    <div className="text-lg font-bold text-gray-900 mt-2">
                      ${lease.monthlyRent.toLocaleString()}/mo
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
