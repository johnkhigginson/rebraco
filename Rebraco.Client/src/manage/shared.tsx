import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from "react";

// ─── Status color maps (consolidated from all modules) ───

export const STATUS_COLORS: Record<string, string> = {
  // Tenants
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Evicted: "bg-red-100 text-red-700",
  // Leases
  Pending: "bg-yellow-100 text-yellow-700",
  Expired: "bg-gray-100 text-gray-600",
  Terminated: "bg-red-100 text-red-700",
  // Inquiries
  New: "bg-blue-100 text-blue-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Responded: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-600",
  // Maintenance
  Open: "bg-blue-100 text-blue-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-600",
  // Units
  Available: "bg-green-100 text-green-700",
  Occupied: "bg-blue-100 text-blue-700",
  Maintenance: "bg-yellow-100 text-yellow-700",
  Offline: "bg-gray-100 text-gray-600",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Emergency: "bg-red-100 text-red-700",
};

export const PROPERTY_TYPE_COLORS: Record<string, string> = {
  Apartment: "bg-blue-100 text-blue-700",
  House: "bg-green-100 text-green-700",
  Townhome: "bg-purple-100 text-purple-700",
  Commercial: "bg-orange-100 text-orange-700",
};

export function StatusBadge({ value, colors }: { value: string; colors?: Record<string, string> }) {
  const map = colors || STATUS_COLORS;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${map[value] || "bg-gray-100 text-gray-600"}`}>
      {value}
    </span>
  );
}

// ─── useDebounce hook ───

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Pagination component ───

export function Pagination({
  skip,
  take,
  total,
  onSkipChange,
}: {
  skip: number;
  take: number;
  total: number;
  onSkipChange: (skip: number) => void;
}) {
  const totalPages = Math.ceil(total / take);
  const currentPage = Math.floor(skip / take) + 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <button
        onClick={() => onSkipChange(Math.max(0, skip - take))}
        disabled={skip === 0}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages} ({total} total)
      </span>
      <button
        onClick={() => onSkipChange(skip + take)}
        disabled={currentPage >= totalPages}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
      >
        Next
      </button>
    </div>
  );
}

// ─── Table skeleton loader ───

export function TableSkeleton({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Toast notification system ───

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const TOAST_STYLES: Record<ToastType, string> = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-gray-800",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${TOAST_STYLES[t.type]} text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium pointer-events-auto animate-slide-up flex items-center gap-2 max-w-sm`}
            onClick={() => removeToast(t.id)}
          >
            {t.type === "success" && (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {t.type === "error" && (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3l9.66 16.59A1 1 0 0120.66 21H3.34a1 1 0 01-.86-1.41L12 3z" />
              </svg>
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Confirm dialog ───

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmClass = "bg-red-600 hover:bg-red-700",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
