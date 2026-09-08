import { useState, useEffect, useCallback } from "react";
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { AuthProvider, useAuth } from "./AuthContext";
import { portalFetch } from "./api";

interface PortalBadgeCounts {
  unpaidInvoices: number;
  openMaintenance: number;
  upcomingTours: number;
}

const BADGE_MAP: Record<string, keyof PortalBadgeCounts> = {
  "/portal/invoices": "unpaidInvoices",
  "/portal/maintenance": "openMaintenance",
  "/portal/tours": "upcomingTours",
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

  const publicPaths = ["/portal/login", "/portal/forgot-password", "/portal/reset-password"];
  const isPublicPage = publicPaths.includes(location.pathname);

  if (!user && !isPublicPage) {
    return <Navigate to="/portal/login" replace />;
  }

  if (user && location.pathname === "/portal/login") {
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}

const navItems = [
  { to: "/portal", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", end: true },
  { to: "/portal/leases", label: "My Leases", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { to: "/portal/invoices", label: "Invoices", icon: "M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" },
  { to: "/portal/payments", label: "Payments", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { to: "/portal/maintenance", label: "Maintenance", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { to: "/portal/tours", label: "Tours", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { to: "/portal/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
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
  const [badges, setBadges] = useState<PortalBadgeCounts | null>(null);

  const fetchBadges = useCallback(() => {
    portalFetch("/api/portal/notifications/counts")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setBadges(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, [fetchBadges]);

  const handleLogout = async () => {
    await logout();
    navigate("/portal/login");
  };

  return (
    <>
      <div className="p-5 border-b border-slate-600">
        <h1 className="text-xl font-bold tracking-tight">Tenant Portal</h1>
        <p className="text-xs text-slate-400 mt-0.5">My Account</p>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const badgeKey = BADGE_MAP[item.to];
          const badgeCount = badgeKey && badges ? badges[badgeKey] : 0;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={"end" in item ? item.end : false}
              onClick={onNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
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

      <div className="p-4 border-t border-slate-600">
        <div className="px-3 py-2 text-sm mb-2">
          <div className="font-medium text-white">{user?.name || "Tenant"}</div>
          <div className="text-xs text-slate-400 truncate">{user?.email}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-left transition-colors"
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

  if (location.pathname === "/portal/login" || !user) {
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white flex flex-col transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 bg-slate-800 px-4 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white p-1 -ml-1"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-white font-semibold text-sm">Tenant Portal</span>
        </div>
        <div className="p-6 lg:p-8 max-w-5xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default function PortalLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <AuthenticatedLayout />
      </AuthGate>
    </AuthProvider>
  );
}
