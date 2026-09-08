import { useState, useEffect, useRef, type FormEvent } from "react";
import { useParams, Link } from "react-router";
import { portalFetch } from "./api";

interface ImageItem {
  id: number;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface MaintenanceNote {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  images: ImageItem[];
}

interface MaintenanceDetail {
  id: number;
  title: string;
  description: string | null;
  locationDetail: string | null;
  permissionToEnter: boolean;
  preferredAvailability: string | null;
  urgencyNotes: string | null;
  priority: string;
  status: string;
  category: string;
  createdAt: string;
  scheduledDate: string | null;
  completedDate: string | null;
  unitNumber: string;
  images: ImageItem[];
  notes: MaintenanceNote[];
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-800",
  InProgress: "bg-yellow-100 text-yellow-800",
  Scheduled: "bg-purple-100 text-purple-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PortalMaintenanceDetail() {
  const { id } = useParams();
  const [request, setRequest] = useState<MaintenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const noteFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchRequest = () => {
    portalFetch(`/api/portal/maintenance/${id}`)
      .then((r) => r.json())
      .then(setRequest)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(fetchRequest, [id]);

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setAddingNote(true);
    setError("");

    try {
      const res = await portalFetch(`/api/portal/maintenance/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: noteContent }),
      });

      if (!res.ok) {
        setError("Failed to add note.");
        return;
      }

      setNoteContent("");
      fetchRequest();
    } catch {
      setError("Failed to add note.");
    } finally {
      setAddingNote(false);
    }
  };

  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await portalFetch(`/api/portal/maintenance/${id}/images`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        fetchRequest();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to upload photo.");
      }
    } catch {
      setError("Failed to upload photo.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleNoteImageUpload = async (noteId: number, file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await portalFetch(`/api/portal/maintenance/${id}/notes/${noteId}/images`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        fetchRequest();
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to upload photo.");
      }
    } catch {
      setError("Failed to upload photo.");
    } finally {
      setUploading(false);
      const ref = noteFileRefs.current[noteId];
      if (ref) ref.value = "";
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!request) return <div className="text-gray-500 py-8">Request not found.</div>;

  const statusColor = STATUS_COLORS[request.status] || "bg-gray-100 text-gray-600";
  const priorityColor = PRIORITY_COLORS[request.priority] || "bg-gray-100 text-gray-600";

  return (
    <div className="max-w-2xl">
      <Link to="/portal/maintenance" className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
        &larr; Back to requests
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900">{request.title}</h1>
          <span className="text-xs text-gray-500">#{request.id}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
            {request.status}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${priorityColor}`}>
            {request.priority}
          </span>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            {request.category}
          </span>
        </div>

        {request.description && (
          <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">{request.description}</p>
        )}

        {/* New detail fields */}
        {(request.locationDetail || request.permissionToEnter || request.preferredAvailability || request.urgencyNotes) && (
          <div className="border-t border-gray-100 pt-4 mb-4 space-y-2 text-sm">
            {request.locationDetail && (
              <div>
                <span className="text-gray-500">Location:</span>{" "}
                <span className="text-gray-900">{request.locationDetail}</span>
              </div>
            )}
            {request.permissionToEnter && (
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-700">Permission to enter when not home</span>
              </div>
            )}
            {request.preferredAvailability && (
              <div>
                <span className="text-gray-500">Availability:</span>{" "}
                <span className="text-gray-900">{request.preferredAvailability}</span>
              </div>
            )}
            {request.urgencyNotes && (
              <div>
                <span className="text-gray-500">Urgency Notes:</span>{" "}
                <span className="text-gray-900">{request.urgencyNotes}</span>
              </div>
            )}
          </div>
        )}

        {/* Photos */}
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Photos ({request.images.length})</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "+ Add Photo"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files?.[0])}
            />
          </div>
          {request.images.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {request.images.map((img) => (
                <img key={img.id} src={img.url} alt={img.alt || ""} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No photos attached.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Unit</span>
            <p className="font-medium text-gray-900">{request.unitNumber}</p>
          </div>
          <div>
            <span className="text-gray-500">Submitted</span>
            <p className="font-medium text-gray-900">{formatDate(request.createdAt)}</p>
          </div>
          {request.scheduledDate && (
            <div>
              <span className="text-gray-500">Scheduled</span>
              <p className="font-medium text-gray-900">{formatDate(request.scheduledDate)}</p>
            </div>
          )}
          {request.completedDate && (
            <div>
              <span className="text-gray-500">Completed</span>
              <p className="font-medium text-gray-900">{formatDate(request.completedDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Notes ({request.notes.length})
        </h2>

        {request.notes.length > 0 ? (
          <div className="space-y-4 mb-6">
            {request.notes.map((note) => (
              <div key={note.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{note.author}</span>
                  <span className="text-xs text-gray-500">{formatDateTime(note.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>

                {/* Note images */}
                {note.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {note.images.map((img) => (
                      <img key={img.id} src={img.url} alt={img.alt || ""} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                )}

                {/* Add photo to note */}
                <button
                  type="button"
                  onClick={() => noteFileRefs.current[note.id]?.click()}
                  disabled={uploading}
                  className="text-xs text-gray-400 hover:text-blue-600 mt-2 disabled:opacity-50"
                >
                  + Photo
                </button>
                <input
                  ref={(el) => { noteFileRefs.current[note.id] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleNoteImageUpload(note.id, e.target.files?.[0])}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-6">No notes yet.</p>
        )}

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="border-t border-gray-100 pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Add a note</label>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Type your message..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mb-3"
          />

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={addingNote || !noteContent.trim()}
            className="btn btn-primary disabled:opacity-50"
          >
            {addingNote ? "Sending..." : "Add Note"}
          </button>
        </form>
      </div>
    </div>
  );
}
