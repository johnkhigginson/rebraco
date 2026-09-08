import { useState, useEffect, useRef, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { manageFetch } from "./api";
import { useToast, StatusBadge, PRIORITY_COLORS, ConfirmDialog } from "./shared";

interface ImageItem {
  id: number;
  url: string;
  alt: string | null;
  sortOrder: number;
}

interface Note {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  images: ImageItem[];
}

interface MaintenanceDetail {
  id: number;
  unitId: number;
  unitNumber: string;
  propertyId: number;
  propertyName: string;
  tenantId: number | null;
  tenantName: string | null;
  title: string;
  description: string | null;
  locationDetail: string | null;
  permissionToEnter: boolean;
  preferredAvailability: string | null;
  urgencyNotes: string | null;
  priority: string;
  status: string;
  category: string;
  scheduledDate: string | null;
  completedDate: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  createdAt: string;
  updatedAt: string;
  images: ImageItem[];
  notes: Note[];
}

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [request, setRequest] = useState<MaintenanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<{ imageId: number; noteId?: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const noteFileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchRequest = () => {
    manageFetch(`/api/maintenance/${id}`)
      .then((res) => {
        if (res.status === 404) { navigate("/manage/maintenance", { replace: true }); return null; }
        return res.json();
      })
      .then((data) => data && setRequest(data))
      .catch(() => toast("Failed to load request.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!request) return;
    setStatusUpdating(true);
    try {
      const res = await manageFetch(`/api/maintenance/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast("Status updated.", "success");
        fetchRequest();
      } else {
        toast("Failed to update status.", "error");
      }
    } catch {
      toast("Failed to update status.", "error");
    }
    setStatusUpdating(false);
  };

  const handleAddNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await manageFetch(`/api/maintenance/${id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        setNoteContent("");
        toast("Note added.", "success");
        fetchRequest();
      } else {
        toast("Failed to add note.", "error");
      }
    } catch {
      toast("Failed to add note.", "error");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await manageFetch(`/api/maintenance/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast("Request deleted.", "success");
        navigate("/manage/maintenance", { replace: true });
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to delete request.", "error");
      }
    } catch {
      toast("Failed to delete request.", "error");
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  // Image upload for request
  const handleImageUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await manageFetch(`/api/maintenance/${id}/images`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        toast("Photo uploaded.", "success");
        fetchRequest();
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to upload photo.", "error");
      }
    } catch {
      toast("Failed to upload photo.", "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Image upload for note
  const handleNoteImageUpload = async (noteId: number, file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await manageFetch(`/api/maintenance/${id}/notes/${noteId}/images`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        toast("Photo uploaded.", "success");
        fetchRequest();
      } else {
        const data = await res.json().catch(() => null);
        toast(data?.error || "Failed to upload photo.", "error");
      }
    } catch {
      toast("Failed to upload photo.", "error");
    } finally {
      setUploading(false);
      const ref = noteFileRefs.current[noteId];
      if (ref) ref.value = "";
    }
  };

  // Delete image
  const handleDeleteImage = async () => {
    if (!deleteImageId) return;
    const { imageId, noteId } = deleteImageId;
    try {
      const url = noteId
        ? `/api/maintenance/${id}/notes/${noteId}/images/${imageId}`
        : `/api/maintenance/${id}/images/${imageId}`;
      const res = await manageFetch(url, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        toast("Photo deleted.", "success");
        fetchRequest();
      } else {
        toast("Failed to delete photo.", "error");
      }
    } catch {
      toast("Failed to delete photo.", "error");
    }
    setDeleteImageId(null);
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!request) return null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/manage/maintenance" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{request.title}</h1>
        <select
          value={request.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={statusUpdating}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="Open">Open</option>
          <option value="InProgress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        <Link
          to={`/manage/maintenance/${id}/edit`}
          className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {request.description && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {/* Photos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Photos ({request.images.length})</h2>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
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
                  <div key={img.id} className="relative group">
                    <img src={img.url} alt={img.alt || ""} className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setDeleteImageId({ imageId: img.id })}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete photo"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No photos attached.</p>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Category:</span> <span className="text-gray-900">{request.category}</span></div>
              <div>
                <span className="text-gray-500">Priority:</span>{" "}
                <StatusBadge value={request.priority} colors={PRIORITY_COLORS} />
              </div>
              <div><span className="text-gray-500">Location:</span> <span className="text-gray-900">{request.locationDetail || "—"}</span></div>
              <div>
                <span className="text-gray-500">Permission to Enter:</span>{" "}
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${request.permissionToEnter ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {request.permissionToEnter ? "Yes" : "No"}
                </span>
              </div>
              <div><span className="text-gray-500">Scheduled:</span> <span className="text-gray-900">{request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString() : "—"}</span></div>
              <div><span className="text-gray-500">Completed:</span> <span className="text-gray-900">{request.completedDate ? new Date(request.completedDate).toLocaleDateString() : "—"}</span></div>
              <div><span className="text-gray-500">Est. Cost:</span> <span className="text-gray-900">{request.estimatedCost != null ? `$${request.estimatedCost.toLocaleString()}` : "—"}</span></div>
              <div><span className="text-gray-500">Actual Cost:</span> <span className="text-gray-900">{request.actualCost != null ? `$${request.actualCost.toLocaleString()}` : "—"}</span></div>
            </div>
            {request.preferredAvailability && (
              <div className="mt-3 text-sm">
                <span className="text-gray-500">Preferred Availability:</span>
                <p className="text-gray-900 whitespace-pre-wrap mt-1">{request.preferredAvailability}</p>
              </div>
            )}
            {request.urgencyNotes && (
              <div className="mt-3 text-sm">
                <span className="text-gray-500">Urgency Notes:</span>
                <p className="text-gray-900 whitespace-pre-wrap mt-1">{request.urgencyNotes}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Notes ({request.notes.length})
            </h2>

            {request.notes.length > 0 && (
              <div className="space-y-3 mb-4">
                {request.notes.map((note) => (
                  <div key={note.id} className="border-l-2 border-gray-200 pl-3 py-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-700">{note.author}</span>
                      <span>&middot;</span>
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>

                    {/* Note images */}
                    {note.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {note.images.map((img) => (
                          <div key={img.id} className="relative group">
                            <img src={img.url} alt={img.alt || ""} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                            <button
                              type="button"
                              onClick={() => setDeleteImageId({ imageId: img.id, noteId: note.id })}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete photo"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add photo to note */}
                    <button
                      type="button"
                      onClick={() => noteFileRefs.current[note.id]?.click()}
                      disabled={uploading}
                      className="text-xs text-gray-400 hover:text-blue-600 mt-1 disabled:opacity-50"
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

          {/* Delete */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Danger Zone</h2>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={deleting}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Delete this request
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Status</h2>
            <StatusBadge value={request.status} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Property / Unit</h2>
            <div className="text-sm space-y-1">
              <Link to={`/manage/properties/${request.propertyId}`} className="text-blue-600 hover:text-blue-800 block">{request.propertyName}</Link>
              <Link to={`/manage/units/${request.unitId}`} className="text-blue-600 hover:text-blue-800 block">Unit {request.unitNumber}</Link>
            </div>
          </div>

          {request.tenantName && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Reported By</h2>
              <Link to={`/manage/tenants/${request.tenantId}`} className="text-sm text-blue-600 hover:text-blue-800">{request.tenantName}</Link>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
            <div className="text-sm"><span className="text-gray-500">Created:</span> <span className="text-gray-900">{new Date(request.createdAt).toLocaleDateString()}</span></div>
            <div className="text-sm"><span className="text-gray-500">Updated:</span> <span className="text-gray-900">{new Date(request.updatedAt).toLocaleDateString()}</span></div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Request"
        message="Are you sure you want to delete this maintenance request? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={!!deleteImageId}
        title="Delete Photo"
        message="Are you sure you want to delete this photo?"
        confirmLabel="Delete"
        onConfirm={handleDeleteImage}
        onCancel={() => setDeleteImageId(null)}
      />
    </div>
  );
}
