import { useState, useEffect, useRef } from "react";
import { manageFetch } from "./api";

// ─── MediaPickerDialog ───────────────────────────────────────────────

interface MediaPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder?: string;
}

interface MediaItem {
  url: string;
  name: string;
  createDate: string;
}

export function MediaPickerDialog({ open, onClose, onSelect, folder }: MediaPickerDialogProps) {
  const [tab, setTab] = useState<"upload" | "browse">("upload");
  const [images, setImages] = useState<MediaItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images when dialog opens or switches to browse tab
  useEffect(() => {
    if (!open) return;
    fetchImages();
  }, [open]);

  const fetchImages = () => {
    setLoadingImages(true);
    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : "";
    manageFetch(`/api/media${qs}`)
      .then((res) => res.json())
      .then((data) => setImages(data))
      .catch(() => setImages([]))
      .finally(() => setLoadingImages(false));
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");

    const form = new FormData();
    form.append("file", file);

    const qs = folder ? `?folder=${encodeURIComponent(folder)}` : "?folder=General";

    try {
      const res = await manageFetch(`/api/media/upload${qs}`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const data = await res.json();
        onSelect(data.url);
        onClose();
      } else {
        const data = await res.json().catch(() => null);
        setUploadError(data?.error || "Upload failed.");
      }
    } catch {
      setUploadError("Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelect = (url: string) => {
    onSelect(url);
    onClose();
  };

  if (!open) return null;

  const tabBase = "px-4 py-2 text-sm font-medium rounded-lg transition-colors";
  const tabActive = `${tabBase} bg-blue-600 text-white`;
  const tabInactive = `${tabBase} bg-gray-100 text-gray-600 hover:bg-gray-200`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Choose Image</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button className={tab === "upload" ? tabActive : tabInactive} onClick={() => setTab("upload")}>
            Upload New
          </button>
          <button
            className={tab === "browse" ? tabActive : tabInactive}
            onClick={() => {
              setTab("browse");
              if (images.length === 0) fetchImages();
            }}
          >
            Browse Existing
          </button>
        </div>

        {/* Upload Tab */}
        {tab === "upload" && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-400 mt-2">JPG, PNG, GIF, WebP, SVG — max 10 MB</p>
            </div>
            {uploadError && (
              <div className="text-sm px-3 py-2 rounded-lg border bg-red-50 text-red-700 border-red-200">{uploadError}</div>
            )}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full btn btn-primary disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}

        {/* Browse Tab */}
        {tab === "browse" && (
          <div>
            {loadingImages ? (
              <div className="text-center py-8 text-gray-500 text-sm">Loading images...</div>
            ) : images.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No images found. Upload one first.</div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto p-1">
                {images.map((img) => (
                  <button
                    key={img.url}
                    onClick={() => handleSelect(img.url)}
                    className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors focus:outline-none focus:border-blue-500"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">{img.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MediaPickerInput ────────────────────────────────────────────────

interface MediaPickerInputProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export function MediaPickerInput({ value, onChange, folder, label }: MediaPickerInputProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}

      {value ? (
        <div className="flex items-center gap-4 p-3 border border-gray-300 rounded-lg bg-white">
          <img
            src={value}
            alt="Selected"
            className="h-20 w-20 rounded-lg object-cover border border-gray-200 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 truncate">{value}</p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer"
        >
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <span className="text-sm text-gray-500 font-medium">Choose Image</span>
        </button>
      )}

      <MediaPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(url) => {
          onChange(url);
          setOpen(false);
        }}
        folder={folder}
      />
    </div>
  );
}
