import { useState, useEffect } from "react";
import { Link } from "react-router";
import { portalFetch } from "./api";

interface MaintenanceRequest {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  scheduledDate: string | null;
  completedDate: string | null;
  unitNumber: string;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  InProgress: "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-600",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

export default function PortalMaintenance() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalFetch("/api/portal/maintenance")
      .then((r) => r.json())
      .then((data) => setRequests(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
        <Link
          to="/portal/maintenance/new"
          className="btn btn-primary"
        >
          New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.58 3.2a.75.75 0 01-1.09-.62V4.6a.75.75 0 01.42-.67l5.58-3.2a.75.75 0 01.66 0l5.58 3.2a.75.75 0 01.42.67v13.15a.75.75 0 01-1.09.62l-5.58-3.2a.75.75 0 00-.66 0z M21.75 12a.75.75 0 00-.75-.75h-3m3 .75a.75.75 0 01-.75.75h-3" /><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.58 3.2M11.42 15.17V4.6m0 10.57l5.58 3.2" /></svg>
          <p className="text-sm font-medium text-gray-900 mb-1">No maintenance requests yet</p>
          <p className="text-sm text-gray-500 mb-4 max-w-xs mx-auto">Something broken or not working right? Submit a maintenance request and your property manager will take care of it.</p>
          <Link
            to="/portal/maintenance/new"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Submit a request
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/portal/maintenance/${r.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {r.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[r.priority] || "bg-gray-100 text-gray-600"}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
