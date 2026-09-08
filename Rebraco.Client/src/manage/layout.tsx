import { useState, useEffect, useCallback } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "./AuthContext";
import { ToastProvider } from "./shared";
import { manageFetch } from "./api";

interface BadgeCounts {
  newInquiries: number;
  requestedTours: number;
  openMaintenance: number;
  newApplications: number;
  overdueInvoices: number;
}

/** Map nav item paths to their badge count keys */
const BADGE_MAP: Record<string, keyof BadgeCounts> = {
  "/manage/inquiries": "newInquiries",
  "/manage/tours": "requestedTours",
  "/manage/maintenance": "openMaintenance",
  "/manage/invoices": "overdueInvoices",
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const publicPaths = ["/manage/login", "/manage/forgot-password", "/manage/reset-password"];
  const isPublicPage = publicPaths.includes(location.pathname);

  // Unauthenticated user on protected page → redirect to login
  if (!user && !isPublicPage) {
    return <Navigate to="/manage/login" replace />;
  }

  // Authenticated user on login page → redirect to dashboard
  if (user && location.pathname === "/manage/login") {
    return <Navigate to="/manage" replace />;
  }

  return <>{children}</>;
}

const navItems = [
  { to: "/manage/inquiries", label: "Inquiries", icon: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" },
  { to: "/manage/properties", label: "Properties", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { to: "/manage/tenants", label: "Tenants", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { to: "/manage/leases", label: "Leases", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { to: "/manage/invoices", label: "Invoices", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
  { to: "/manage/payments", label: "Payments", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { to: "/manage/tours", label: "Tours", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { to: "/manage/maintenance", label: "Maintenance", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/manage/settings", label: "Settings", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" },
];

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-red-500 text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function Sidebar({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [badges, setBadges] = useState<BadgeCounts | null>(null);

  const fetchBadges = useCallback(() => {
    manageFetch("/api/notifications/counts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setBadges(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBadges();
    // Refresh every 60 seconds
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  const handleLogout = async () => {
    await logout();
    navigate("/manage/login");
  };

  return (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-tight">Rebraco</h1>
        <p className="text-xs text-gray-400 mt-0.5">Management Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const badgeKey = BADGE_MAP[item.to];
          const badgeCount = badgeKey && badges ? badges[badgeKey] : 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`
              }
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {item.label}
              <Badge count={badgeCount} />
            </NavLink>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t border-gray-700">
        <NavLink
          to="/manage/profile"
          onClick={onNavClick}
          className={({ isActive }) =>
            `block px-3 py-2 rounded-lg text-sm mb-2 transition-colors ${
              isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
            }`
          }
        >
          <div className="font-medium">{user?.name || "User"}</div>
          <div className="text-xs text-gray-400 truncate">{user?.email}</div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg text-left transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

function AuthenticatedLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Login page renders without sidebar
  if (location.pathname === "/manage/login" || !user) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 bg-gray-900 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1 -ml-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">Rebraco</span>
        </div>
        <div className="p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function ManageLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate>
          <AuthenticatedLayout />
        </AuthGate>
      </ToastProvider>
    </AuthProvider>
  );
}
