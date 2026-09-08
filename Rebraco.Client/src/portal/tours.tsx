import { useState, useEffect } from "react";
import { Link } from "react-router";
import { portalFetch } from "./api";

const STATUS_COLORS: Record<string, string> = {
  Requested: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
  NoShow: "bg-red-100 text-red-800",
};

interface TourItem {
  id: number;
  propertyName: string;
  unitNumber: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export default function PortalToursPage() {
  const [tours, setTours] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch("/api/portal/tours")
      .then((r) => r.json())
      .then((data) => setTours(Array.isArray(data) ? data : data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Tours</h1>

      {loading ? (
        <div className="text-gray-500 py-8">Loading...</div>
      ) : tours.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
          <p className="text-sm font-medium text-gray-900 mb-1">No tours scheduled</p>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">You don't have any upcoming property tours. If you've requested a tour, check back soon for confirmation from your property manager.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tours.map((tour) => {
            const statusColor = STATUS_COLORS[tour.status] || "bg-gray-100 text-gray-600";
            return (
              <Link
                key={tour.id}
                to={`/portal/tours/${tour.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">{tour.propertyName}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                    {tour.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>{new Date(tour.scheduledDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                  <span>{formatTime(tour.startTime)} – {formatTime(tour.endTime)}</span>
                  {tour.unitNumber && <span>Unit {tour.unitNumber}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
