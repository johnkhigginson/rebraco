import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { portalFetch } from "./api";

const STATUS_COLORS: Record<string, string> = {
  Requested: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
  NoShow: "bg-red-100 text-red-800",
};

interface TourDetail {
  id: number;
  propertyName: string;
  unitNumber: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  fullName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PortalTourDetail() {
  const { id } = useParams();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    portalFetch(`/api/portal/tours/${id}`)
      .then((r) => r.json())
      .then(setTour)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    setError("");
    try {
      const res = await portalFetch(`/api/portal/tours/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        const updated = await portalFetch(`/api/portal/tours/${id}`).then((r) => r.json());
        setTour(updated);
        setShowCancel(false);
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to cancel tour.");
      }
    } catch {
      setError("Failed to cancel tour.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!tour) return <div className="text-gray-500 py-8">Tour not found.</div>;

  const statusColor = STATUS_COLORS[tour.status] || "bg-gray-100 text-gray-600";
  const canCancel = tour.status === "Requested" || tour.status === "Confirmed";

  return (
    <div className="max-w-lg">
      <Link to="/portal/tours" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to tours
      </Link>

      {/* Main card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900">{tour.propertyName}</h1>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor}`}>
            {tour.status}
          </span>
        </div>

        {tour.unitNumber && (
          <p className="text-sm text-gray-500 mb-4">Unit {tour.unitNumber}</p>
        )}

        {/* Schedule */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-900">{formatDate(tour.scheduledDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-gray-600">{formatTime(tour.startTime)} – {formatTime(tour.endTime)}</span>
          </div>
        </div>

        {/* Notes */}
        {tour.notes && (
          <div className="mb-4">
            <span className="text-xs text-gray-500 uppercase font-medium">Notes</span>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{tour.notes}</p>
          </div>
        )}

        {/* Cancellation reason */}
        {tour.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            <span className="text-xs text-red-600 font-medium">Cancellation Reason</span>
            <p className="text-sm text-red-700 mt-0.5">{tour.cancellationReason}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="border-t border-gray-100 pt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Requested</span>
            <span className="text-gray-700">{new Date(tour.createdAt).toLocaleDateString()}</span>
          </div>
          {tour.confirmedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Confirmed</span>
              <span className="text-gray-700">{new Date(tour.confirmedAt).toLocaleDateString()}</span>
            </div>
          )}
          {tour.cancelledAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cancelled</span>
              <span className="text-gray-700">{new Date(tour.cancelledAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cancel action */}
      {canCancel && !showCancel && (
        <button
          onClick={() => setShowCancel(true)}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Cancel this tour
        </button>
      )}

      {showCancel && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
          <p className="text-sm text-gray-700 mb-3">Are you sure you want to cancel this tour?</p>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel Tour"}
            </button>
            <button
              onClick={() => setShowCancel(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Keep Tour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
