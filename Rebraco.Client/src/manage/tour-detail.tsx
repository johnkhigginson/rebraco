import { useState, useEffect, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, StatusBadge } from "./shared";

const TOUR_STATUS_COLORS: Record<string, string> = {
  Requested: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
  NoShow: "bg-red-100 text-red-800",
};

interface TourDetail {
  id: number;
  propertyId: number;
  propertyName: string;
  unitId: number | null;
  unitNumber: string | null;
  inquiryId: number | null;
  fullName: string;
  email: string;
  phone: string | null;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  managerNotes: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export default function TourDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // Cancel dialog
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Reschedule form
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");

  const fetchTour = () => {
    manageFetch(`/api/tours/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/manage/tours", { replace: true }); return null; }
        return res.json();
      })
      .then((data) => data && setTour(data))
      .catch(() => toast("Failed to load tour.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchTour, [id]);

  const doAction = async (action: string, body?: object) => {
    setActing(true);
    try {
      const res = await manageFetch(`/api/tours/${id}/${action}`, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        toast(`Tour ${action === "no-show" ? "marked as no-show" : action + "ed"}.`, "success");
        fetchTour();
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || `Failed to ${action} tour.`, "error");
      }
    } catch {
      toast(`Failed to ${action} tour.`, "error");
    } finally {
      setActing(false);
    }
  };

  const handleConfirm = () => doAction("confirm");
  const handleComplete = () => doAction("complete");
  const handleNoShow = () => doAction("no-show");

  const handleCancel = async () => {
    await doAction("cancel", { reason: cancelReason || null });
    setShowCancel(false);
    setCancelReason("");
  };

  const handleReschedule = async (e: FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleStart || !rescheduleEnd) return;
    await doAction("reschedule", {
      scheduledDate: rescheduleDate,
      startTime: rescheduleStart,
      endTime: rescheduleEnd,
    });
    setShowReschedule(false);
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!tour) return null;

  const isRequested = tour.status === "Requested";
  const isConfirmed = tour.status === "Confirmed";
  const isTerminal = ["Completed", "Cancelled", "NoShow"].includes(tour.status);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to="/manage/tours" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">Tour #{tour.id}</h1>
        <StatusBadge value={tour.status} colors={TOUR_STATUS_COLORS} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Guest Information</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="text-gray-900 font-medium">{tour.fullName}</span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{" "}
                <a href={`mailto:${tour.email}`} className="text-blue-600 hover:text-blue-800">{tour.email}</a>
              </div>
              {tour.phone && (
                <div>
                  <span className="text-gray-500">Phone:</span>{" "}
                  <a href={`tel:${tour.phone}`} className="text-blue-600 hover:text-blue-800">{tour.phone}</a>
                </div>
              )}
            </div>
            {tour.notes && (
              <div className="mt-3 text-sm">
                <span className="text-gray-500">Notes from guest:</span>
                <p className="text-gray-700 whitespace-pre-wrap mt-1">{tour.notes}</p>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Schedule</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>{" "}
                <span className="text-gray-900 font-medium">{new Date(tour.scheduledDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>{" "}
                <span className="text-gray-900 font-medium">{formatTime(tour.startTime)} – {formatTime(tour.endTime)}</span>
              </div>
            </div>
          </div>

          {/* Manager Notes */}
          {tour.managerNotes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Manager Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{tour.managerNotes}</p>
            </div>
          )}

          {/* Actions */}
          {!isTerminal && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Actions</h2>
              <div className="flex flex-wrap gap-2">
                {isRequested && (
                  <button
                    onClick={handleConfirm}
                    disabled={acting}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    Confirm Tour
                  </button>
                )}
                {isConfirmed && (
                  <>
                    <button
                      onClick={handleComplete}
                      disabled={acting}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={handleNoShow}
                      disabled={acting}
                      className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      No Show
                    </button>
                    <button
                      onClick={() => {
                        setRescheduleDate(tour.scheduledDate.split("T")[0]);
                        setRescheduleStart(tour.startTime);
                        setRescheduleEnd(tour.endTime);
                        setShowReschedule(!showReschedule);
                      }}
                      disabled={acting}
                      className="btn btn-secondary disabled:opacity-50"
                    >
                      Reschedule
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={acting}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Cancel Tour
                </button>
              </div>

              {/* Reschedule form */}
              {showReschedule && (
                <form onSubmit={handleReschedule} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Reschedule To:</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                      <input
                        type="time"
                        required
                        value={rescheduleStart}
                        onChange={(e) => setRescheduleStart(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">End Time</label>
                      <input
                        type="time"
                        required
                        value={rescheduleEnd}
                        onChange={(e) => setRescheduleEnd(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={acting}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      {acting ? "Saving..." : "Reschedule"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReschedule(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Property</h2>
            <div className="text-sm space-y-1">
              <Link to={`/manage/properties/${tour.propertyId}`} className="text-blue-600 hover:text-blue-800 block">
                {tour.propertyName}
              </Link>
              {tour.unitNumber && (
                <Link to={`/manage/units/${tour.unitId}`} className="text-blue-600 hover:text-blue-800 block">
                  Unit {tour.unitNumber}
                </Link>
              )}
            </div>
          </div>

          {tour.inquiryId && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Inquiry</h2>
              <Link to={`/manage/inquiries/${tour.inquiryId}`} className="text-sm text-blue-600 hover:text-blue-800">
                View Inquiry #{tour.inquiryId}
              </Link>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            <div className="text-sm">
              <span className="text-gray-500">Created:</span>{" "}
              <span className="text-gray-900">{new Date(tour.createdAt).toLocaleDateString()}</span>
            </div>
            {tour.confirmedAt && (
              <div className="text-sm">
                <span className="text-gray-500">Confirmed:</span>{" "}
                <span className="text-gray-900">{new Date(tour.confirmedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="text-sm">
              <span className="text-gray-500">Updated:</span>{" "}
              <span className="text-gray-900">{new Date(tour.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel dialog with reason */}
      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Tour</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to cancel this tour? The guest will be notified.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              maxLength={2000}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowCancel(false); setCancelReason(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Keep Tour
              </button>
              <button
                onClick={handleCancel}
                disabled={acting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {acting ? "Cancelling..." : "Cancel Tour"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
