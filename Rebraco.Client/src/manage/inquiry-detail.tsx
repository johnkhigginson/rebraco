import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, ConfirmDialog } from "./shared";

interface Note {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

interface InquiryDetail {
  id: number;
  propertyId: string | null;
  propertyName: string | null;
  unitId: string | null;
  unitName: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  preferredMoveInDate: string | null;
  preferredLeaseTerm: string | null;
  message: string | null;
  status: string;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  notes: Note[];
}

interface UnitOption {
  id: number;
  unitNumber: string;
  propertyName: string;
  monthlyRent: number;
}

const STATUS_OPTIONS = ["New", "InProgress", "Responded", "Closed"];

const STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Responded: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-600",
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, spaceIdx), lastName: trimmed.slice(spaceIdx + 1) };
}

export default function InquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Conversion form state
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [unitId, setUnitId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [bedDesignation, setBedDesignation] = useState("");
  const [leaseType, setLeaseType] = useState("Fixed");

  const fetchInquiry = () => {
    manageFetch(`/api/inquiries/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setInquiry)
      .catch(() => navigate("/manage/inquiries", { replace: true }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInquiry();
  }, [id]);

  // Pre-fill conversion form when inquiry loads or convert form opens
  const openConvertForm = () => {
    if (!inquiry) return;
    const { firstName: fn, lastName: ln } = splitName(inquiry.fullName);
    setFirstName(fn);
    setLastName(ln);
    setEmail(inquiry.email);
    setPhone(inquiry.phone || "");
    setMoveInDate(inquiry.preferredMoveInDate ? inquiry.preferredMoveInDate.split("T")[0] : "");
    setStartDate(inquiry.preferredMoveInDate ? inquiry.preferredMoveInDate.split("T")[0] : "");
    setEndDate("");
    setUnitId("");
    setMonthlyRent("");
    setSecurityDeposit("");
    setBedDesignation("");
    setLeaseType("Fixed");
    setConvertError("");
    setShowConvertForm(true);

    // Fetch units for dropdown
    manageFetch("/api/units?take=500")
      .then((res) => res.json())
      .then((data) => setUnits(data.items || []))
      .catch(() => {});
  };

  // Auto-fill rent when unit changes
  const handleUnitChange = (newUnitId: string) => {
    setUnitId(newUnitId);
    const unit = units.find((u) => u.id === Number(newUnitId));
    if (unit) {
      setMonthlyRent(unit.monthlyRent.toString());
    }
  };

  const handleConvert = async (e: FormEvent) => {
    e.preventDefault();
    setConverting(true);
    setConvertError("");

    try {
      const res = await manageFetch(`/api/inquiries/${id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone: phone || null,
          moveInDate: moveInDate || null,
          unitId: Number(unitId),
          startDate,
          endDate,
          monthlyRent: Number(monthlyRent),
          securityDeposit: securityDeposit ? Number(securityDeposit) : null,
          bedDesignation: bedDesignation || null,
          leaseType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        navigate(`/manage/tenants/${data.tenantId}`);
      } else {
        const data = await res.json().catch(() => null);
        setConvertError(data?.error || "Failed to convert inquiry.");
      }
    } catch {
      setConvertError("Failed to convert inquiry.");
    } finally {
      setConverting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true);
    try {
      const res = await manageFetch(`/api/inquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setInquiry((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await manageFetch(`/api/inquiries/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setNoteContent("");
        fetchInquiry();
      }
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await manageFetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Inquiry deleted.", "success");
        navigate("/manage/inquiries", { replace: true });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to delete inquiry.", "error");
      }
    } catch {
      toast("Failed to delete inquiry.", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  if (loading) {
    return <div className="text-gray-500 py-8">Loading...</div>;
  }

  if (!inquiry) return null;

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate("/manage/inquiries")}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Inquiries
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{inquiry.fullName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Inquiry #{inquiry.id} &middot; {new Date(inquiry.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={inquiry.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={statusUpdating}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer ${
              STATUS_COLORS[inquiry.status] || "bg-gray-100"
            }`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="text-gray-900 font-medium">
                  <a href={`mailto:${inquiry.email}`} className="text-blue-600 hover:underline">
                    {inquiry.email}
                  </a>
                </dd>
              </div>
              {inquiry.phone && (
                <div>
                  <dt className="text-gray-500">Phone</dt>
                  <dd className="text-gray-900 font-medium">{inquiry.phone}</dd>
                </div>
              )}
              {inquiry.preferredMoveInDate && (
                <div>
                  <dt className="text-gray-500">Preferred Move-in</dt>
                  <dd className="text-gray-900">
                    {new Date(inquiry.preferredMoveInDate).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {inquiry.preferredLeaseTerm && (
                <div>
                  <dt className="text-gray-500">Lease Term</dt>
                  <dd className="text-gray-900">{inquiry.preferredLeaseTerm}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Convert to Tenant */}
          {inquiry.status !== "Closed" && !showConvertForm && (
            <button
              onClick={openConvertForm}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Convert to Tenant
            </button>
          )}

          {showConvertForm && (
            <form onSubmit={handleConvert} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Convert to Tenant &amp; Create Lease</h2>
                <button
                  type="button"
                  onClick={() => setShowConvertForm(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>

              {convertError && (
                <div className="text-sm px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200">
                  {convertError}
                </div>
              )}

              {/* Tenant section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tenant Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>First Name *</label>
                    <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Last Name *</label>
                    <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Move-in Date</label>
                    <input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Lease section */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lease Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelCls}>Unit *</label>
                    <select required value={unitId} onChange={(e) => handleUnitChange(e.target.value)} className={inputCls}>
                      <option value="">Select unit...</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>{u.propertyName} — {u.unitNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Start Date *</label>
                    <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>End Date *</label>
                    <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Monthly Rent *</label>
                    <input type="number" step="0.01" min={0} required value={monthlyRent} onChange={(e) => setMonthlyRent(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Security Deposit</label>
                    <input type="number" step="0.01" min={0} value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Bed Designation</label>
                    <input type="text" value={bedDesignation} onChange={(e) => setBedDesignation(e.target.value)} className={inputCls} placeholder="e.g. Bed A" />
                  </div>
                  <div>
                    <label className={labelCls}>Lease Type</label>
                    <select value={leaseType} onChange={(e) => setLeaseType(e.target.value)} className={inputCls}>
                      <option value="Fixed">Fixed</option>
                      <option value="MonthToMonth">Month-to-Month</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={converting}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {converting ? "Converting..." : "Convert to Tenant & Create Lease"}
              </button>
            </form>
          )}

          {/* Message */}
          {inquiry.message && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Message</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Notes ({inquiry.notes.length})
            </h2>

            {inquiry.notes.length > 0 && (
              <div className="space-y-3 mb-4">
                {inquiry.notes.map((note) => (
                  <div key={note.id} className="border-l-2 border-gray-200 pl-3 py-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-700">{note.author}</span>
                      <span>&middot;</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={noteSubmitting || !noteContent.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                Add
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Property</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-gray-500">Property</dt>
                <dd className="text-gray-900">{inquiry.propertyName || "—"}</dd>
              </div>
              {inquiry.unitName && (
                <div>
                  <dt className="text-gray-500">Unit</dt>
                  <dd className="text-gray-900">{inquiry.unitName}</dd>
                </div>
              )}
              {inquiry.source && (
                <div>
                  <dt className="text-gray-500">Source</dt>
                  <dd className="text-gray-900">{inquiry.source}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h2>
            <dl className="text-sm space-y-2">
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {new Date(inquiry.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="text-gray-900">
                  {new Date(inquiry.updatedAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h2>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete this inquiry
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Inquiry"
        message="Are you sure you want to delete this inquiry? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
