import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { portalFetch } from "./api";

interface LeaseDetail {
  id: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  securityDeposit: number | null;
  bedDesignation: string | null;
  status: string;
  leaseType: string;
  unit: {
    id: number;
    unitNumber: string;
    bedrooms: number;
    bathrooms: number;
    sqFt: number;
    capacity: number;
    furnished: boolean;
    petsAllowed: boolean;
    parkingIncluded: boolean;
    utilitiesIncluded: boolean;
    features: string | null;
    featuredImageUrl: string | null;
  };
  property: {
    id: number;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    contactEmail: string | null;
    contactPhone: string | null;
    buildingAmenities: string | null;
  };
}

export default function PortalLeaseDetail() {
  const { id } = useParams();
  const [lease, setLease] = useState<LeaseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch(`/api/portal/leases/${id}`)
      .then((r) => r.json())
      .then(setLease)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!lease) return <div className="text-gray-500 py-8">Lease not found.</div>;

  const rows = [
    ["Status", lease.status],
    ["Type", lease.leaseType],
    ["Start Date", new Date(lease.startDate).toLocaleDateString()],
    ["End Date", new Date(lease.endDate).toLocaleDateString()],
    ["Monthly Rent", `$${lease.monthlyRent.toLocaleString()}`],
    lease.securityDeposit ? ["Security Deposit", `$${lease.securityDeposit.toLocaleString()}`] : null,
    lease.bedDesignation ? ["Bed Designation", lease.bedDesignation] : null,
  ].filter(Boolean) as [string, string][];

  const unitRows = [
    ["Unit", lease.unit.unitNumber],
    ["Layout", `${lease.unit.bedrooms} bed / ${lease.unit.bathrooms} bath`],
    lease.unit.sqFt ? ["Size", `${lease.unit.sqFt} sqft`] : null,
    ["Furnished", lease.unit.furnished ? "Yes" : "No"],
    ["Parking", lease.unit.parkingIncluded ? "Included" : "Not included"],
    ["Utilities", lease.unit.utilitiesIncluded ? "Included" : "Not included"],
    ["Pets", lease.unit.petsAllowed ? "Allowed" : "Not allowed"],
    lease.unit.features ? ["Features", lease.unit.features] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div>
      <Link to="/portal/leases" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to leases
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {lease.property.name} — Unit {lease.unit.unitNumber}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lease Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lease Details</h2>
          <div className="space-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unit Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Unit Details</h2>
          <div className="space-y-3">
            {unitRows.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="text-gray-900 font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Property & Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Property & Contact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500 mb-1">Property</div>
              <div className="text-gray-900 font-medium">{lease.property.name}</div>
              <div className="text-gray-600 mt-1">
                {lease.property.street}<br />
                {lease.property.city}, {lease.property.state} {lease.property.zip}
              </div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Contact</div>
              {lease.property.contactEmail && (
                <div className="mt-1">
                  <a href={`mailto:${lease.property.contactEmail}`} className="text-blue-600 hover:text-blue-800">
                    {lease.property.contactEmail}
                  </a>
                </div>
              )}
              {lease.property.contactPhone && (
                <div className="mt-1">
                  <a href={`tel:${lease.property.contactPhone}`} className="text-blue-600 hover:text-blue-800">
                    {lease.property.contactPhone}
                  </a>
                </div>
              )}
            </div>
          </div>
          {lease.property.buildingAmenities && (
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-1">Building Amenities</div>
              <div className="text-sm text-gray-900">{lease.property.buildingAmenities}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
