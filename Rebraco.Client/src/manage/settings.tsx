import { useState, useEffect, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { manageFetch } from "./api";

interface EmailSettings {
  fromEmail: string;
  notifyEmail: string;
}

interface StripeSettings {
  publishableKey: string;
  maskedSecretKey: string;
  hasSecretKey: boolean;
  connectedAccountId: string;
}

interface StripeStatus {
  mode: string;
  connectedAccountId: string | null;
  hasDirectKeys: boolean;
}

interface TourSettings {
  defaultSlotDurationMinutes: number;
  maxAdvanceBookingDays: number;
  requireConfirmation: boolean;
  reminderEnabled: boolean;
}

interface PublicPagesSettings {
  publicPagesLabel: string;
  publicPagesSlug: string;
}

interface NotificationPref {
  notificationType: string;
  emailEnabled: boolean;
}

const NOTIFICATION_LABELS: Record<string, string> = {
  inquiry_new: "New inquiry received",
  tour_requested: "New tour requested",
  maintenance_submitted: "New maintenance request",
  application_received: "New application submitted",
  invoice_overdue: "Invoice past due",
  lease_expiring: "Lease expiring soon",
  renewal_response: "Tenant responded to renewal offer",
};

const SLUG_OPTIONS = [
  { value: "properties", label: "properties" },
  { value: "floor-plans", label: "floor-plans" },
  { value: "housing", label: "housing" },
  { value: "availability", label: "availability" },
  { value: "rooms", label: "rooms" },
];

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Email
  const [fromEmail, setFromEmail] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");

  // Stripe
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeSettings, setStripeSettings] = useState<StripeSettings | null>(null);
  const [stripePublishableKey, setStripePublishableKey] = useState("");
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [stripeSaving, setStripeSaving] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");

  // Tour settings
  const [tourSlotDuration, setTourSlotDuration] = useState(30);
  const [tourMaxDays, setTourMaxDays] = useState(30);
  const [tourRequireConfirm, setTourRequireConfirm] = useState(true);
  const [tourReminder, setTourReminder] = useState(true);
  const [tourSaving, setTourSaving] = useState(false);
  const [tourMessage, setTourMessage] = useState("");

  // Public pages
  const [publicLabel, setPublicLabel] = useState("Properties");
  const [publicSlug, setPublicSlug] = useState("properties");
  const [publicSaving, setPublicSaving] = useState(false);
  const [publicMessage, setPublicMessage] = useState("");

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPref[]>([]);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");

  useEffect(() => {
    Promise.all([
      manageFetch("/api/settings/email").then((r) => r.json()),
      manageFetch("/api/stripe/status").then((r) => r.json()),
      manageFetch("/api/settings/stripe").then((r) => r.json()),
      manageFetch("/api/settings/tour").then((r) => r.json()).catch(() => null),
      manageFetch("/api/settings/public-pages").then((r) => r.json()).catch(() => null),
      manageFetch("/api/notification-preferences").then((r) => r.json()).catch(() => null),
    ])
      .then(([email, status, stripe, tour, pub, notif]: [EmailSettings, StripeStatus, StripeSettings, TourSettings | null, PublicPagesSettings | null, { items: NotificationPref[] } | null]) => {
        setFromEmail(email.fromEmail);
        setNotifyEmail(email.notifyEmail);
        setStripeStatus(status);
        setStripeSettings(stripe);
        setStripePublishableKey(stripe.publishableKey);
        if (tour) {
          setTourSlotDuration(tour.defaultSlotDurationMinutes);
          setTourMaxDays(tour.maxAdvanceBookingDays);
          setTourRequireConfirm(tour.requireConfirmation);
          setTourReminder(tour.reminderEnabled);
        }
        if (pub) {
          setPublicLabel(pub.publicPagesLabel);
          setPublicSlug(pub.publicPagesSlug);
        }
        if (notif?.items) {
          setNotifPrefs(notif.items);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Check for Connect callback result
    const stripeParam = searchParams.get("stripe");
    if (stripeParam === "connected") {
      setStripeMessage("Stripe Connect account linked successfully!");
    } else if (stripeParam === "error") {
      setStripeMessage("Failed to connect Stripe account. Please try again.");
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await manageFetch("/api/settings/email", {
        method: "PATCH",
        body: JSON.stringify({ fromEmail, notifyEmail }),
      });
      if (res.ok) {
        setMessage("Email settings saved successfully.");
      } else {
        setMessage("Failed to save settings.");
      }
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleStripeConnect = async () => {
    try {
      const res = await manageFetch("/api/stripe/connect-url");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setStripeMessage("Failed to initiate Stripe Connect.");
    }
  };

  const handleStripeDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Stripe Connect account?")) return;
    try {
      await manageFetch("/api/stripe/disconnect", { method: "DELETE" });
      setStripeStatus({ mode: "NotConfigured", connectedAccountId: null, hasDirectKeys: stripeStatus?.hasDirectKeys ?? false });
      setStripeMessage("Stripe Connect disconnected.");
    } catch {
      setStripeMessage("Failed to disconnect.");
    }
  };

  const handleStripeKeysSave = async (e: FormEvent) => {
    e.preventDefault();
    setStripeSaving(true);
    setStripeMessage("");
    try {
      const body: Record<string, string> = { publishableKey: stripePublishableKey };
      if (stripeSecretKey) body.secretKey = stripeSecretKey;

      const res = await manageFetch("/api/settings/stripe", {
        method: "PATCH",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setStripeMessage("Stripe keys saved successfully.");
        setStripeSecretKey("");
        // Refresh status
        const [status, settings] = await Promise.all([
          manageFetch("/api/stripe/status").then((r) => r.json()),
          manageFetch("/api/settings/stripe").then((r) => r.json()),
        ]);
        setStripeStatus(status);
        setStripeSettings(settings);
      } else {
        const data = await res.json().catch(() => null);
        setStripeMessage(data?.error || "Failed to save Stripe keys.");
      }
    } catch {
      setStripeMessage("Failed to save Stripe keys.");
    } finally {
      setStripeSaving(false);
    }
  };

  const handleStripeKeysRemove = async () => {
    if (!confirm("Are you sure you want to remove your Stripe API keys?")) return;
    try {
      await manageFetch("/api/settings/stripe", { method: "DELETE" });
      setStripePublishableKey("");
      setStripeSettings(null);
      const status = await manageFetch("/api/stripe/status").then((r) => r.json());
      setStripeStatus(status);
      setStripeMessage("Stripe keys removed.");
    } catch {
      setStripeMessage("Failed to remove keys.");
    }
  };

  const handlePublicPagesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPublicSaving(true);
    setPublicMessage("");
    try {
      const res = await manageFetch("/api/settings/public-pages", {
        method: "PATCH",
        body: JSON.stringify({ publicPagesLabel: publicLabel, publicPagesSlug: publicSlug }),
      });
      setPublicMessage(res.ok ? "Public pages settings saved successfully." : "Failed to save settings.");
    } catch {
      setPublicMessage("Failed to save settings.");
    } finally {
      setPublicSaving(false);
    }
  };

  const handleNotifToggle = (type: string) => {
    setNotifPrefs((prev) =>
      prev.map((p) =>
        p.notificationType === type ? { ...p, emailEnabled: !p.emailEnabled } : p
      )
    );
  };

  const handleNotifSave = async () => {
    setNotifSaving(true);
    setNotifMessage("");
    try {
      const res = await manageFetch("/api/notification-preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: notifPrefs }),
      });
      setNotifMessage(res.ok ? "Notification preferences saved successfully." : "Failed to save preferences.");
    } catch {
      setNotifMessage("Failed to save preferences.");
    } finally {
      setNotifSaving(false);
    }
  };

  const handleTourSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTourSaving(true);
    setTourMessage("");
    try {
      const res = await manageFetch("/api/settings/tour", {
        method: "PATCH",
        body: JSON.stringify({
          defaultSlotDurationMinutes: tourSlotDuration,
          maxAdvanceBookingDays: tourMaxDays,
          requireConfirmation: tourRequireConfirm,
          reminderEnabled: tourReminder,
        }),
      });
      setTourMessage(res.ok ? "Tour settings saved successfully." : "Failed to save tour settings.");
    } catch {
      setTourMessage("Failed to save tour settings.");
    } finally {
      setTourSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;

  const isConnect = stripeStatus?.mode === "Connect";
  const isDirect = stripeStatus?.mode === "Direct";

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Email Settings */}
      <form
        onSubmit={handleEmailSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <h2 className="text-base font-semibold text-gray-900">Email Notifications</h2>
        <p className="text-sm text-gray-500 -mt-2">
          Configure where inquiry notifications are sent. Leave blank to use server defaults.
        </p>

        {message && (
          <div className={`text-sm px-3 py-2 rounded-lg border ${
            message.includes("success") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
          <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)}
            placeholder="rebraco@pm.mwsoutbound.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          <p className="text-xs text-gray-400 mt-1">Must be a verified sender in Postmark.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notification Recipients</label>
          <input type="text" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)}
            placeholder="manager@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          <p className="text-xs text-gray-400 mt-1">Comma-separate multiple addresses.</p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full btn btn-primary disabled:opacity-50">
          {saving ? "Saving..." : "Save Email Settings"}
        </button>
      </form>

      {/* Stripe Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Payment Processing</h2>
        <p className="text-sm text-gray-500 -mt-2">
          Configure Stripe to accept tenant payments. Connect via Stripe Connect or enter API keys directly.
        </p>

        {stripeMessage && (
          <div className={`text-sm px-3 py-2 rounded-lg border ${
            stripeMessage.includes("success") || stripeMessage.includes("linked")
              ? "bg-green-50 text-green-700 border-green-200"
              : stripeMessage.includes("removed") || stripeMessage.includes("disconnected")
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {stripeMessage}
          </div>
        )}

        {/* Mode badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Status:</span>
          {isConnect ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800">
              Connected via Stripe Connect
            </span>
          ) : isDirect ? (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              Using Direct API Keys
            </span>
          ) : (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              Not Configured
            </span>
          )}
        </div>

        {/* Stripe Connect section */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Stripe Connect</h3>
          {isConnect ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Account: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{stripeStatus?.connectedAccountId}</code></p>
              </div>
              <button onClick={handleStripeDisconnect}
                className="text-sm text-red-600 hover:text-red-800 font-medium">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={handleStripeConnect}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Connect with Stripe
            </button>
          )}
        </div>

        {/* Direct keys section */}
        {!isConnect && (
          <form onSubmit={handleStripeKeysSave} className="border-t border-gray-100 pt-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Direct API Keys</h3>
            {isConnect && (
              <p className="text-xs text-gray-400">Direct keys are ignored when Stripe Connect is active.</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
              <input type="text" value={stripePublishableKey} onChange={(e) => setStripePublishableKey(e.target.value)}
                placeholder="pk_test_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
              <input type="password" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)}
                placeholder={stripeSettings?.hasSecretKey ? `Current: ${stripeSettings.maskedSecretKey}` : "sk_test_..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono" />
              {stripeSettings?.hasSecretKey && (
                <p className="text-xs text-gray-400 mt-1">Leave blank to keep existing key.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={stripeSaving}
                className="flex-1 btn btn-primary disabled:opacity-50">
                {stripeSaving ? "Validating..." : "Save Keys"}
              </button>
              {stripeSettings?.hasSecretKey && (
                <button type="button" onClick={handleStripeKeysRemove}
                  className="px-4 py-2.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Remove
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Tour Settings */}
      <form
        onSubmit={handleTourSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <h2 className="text-base font-semibold text-gray-900">Tour Scheduling</h2>
        <p className="text-sm text-gray-500 -mt-2">
          Configure default settings for property tour scheduling.
        </p>

        {tourMessage && (
          <div className={`text-sm px-3 py-2 rounded-lg border ${
            tourMessage.includes("success") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {tourMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Default Slot Duration (minutes)</label>
          <input type="number" value={tourSlotDuration} onChange={(e) => setTourSlotDuration(Number(e.target.value))}
            min={15} max={240}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Advance Booking (days)</label>
          <input type="number" value={tourMaxDays} onChange={(e) => setTourMaxDays(Number(e.target.value))}
            min={1} max={180}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          <p className="text-xs text-gray-400 mt-1">How far in advance prospects can book a tour.</p>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="tourRequireConfirm" checked={tourRequireConfirm} onChange={(e) => setTourRequireConfirm(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="tourRequireConfirm" className="text-sm text-gray-700">Require manager confirmation for new bookings</label>
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="tourReminder" checked={tourReminder} onChange={(e) => setTourReminder(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="tourReminder" className="text-sm text-gray-700">Send reminder emails before tours</label>
        </div>

        <button type="submit" disabled={tourSaving}
          className="w-full btn btn-primary disabled:opacity-50">
          {tourSaving ? "Saving..." : "Save Tour Settings"}
        </button>
      </form>

      {/* Public Pages Settings */}
      <form
        onSubmit={handlePublicPagesSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <h2 className="text-base font-semibold text-gray-900">Public Pages</h2>
        <p className="text-sm text-gray-500 -mt-2">
          Configure the label and URL slug for your public property/room browser pages.
        </p>

        {publicMessage && (
          <div className={`text-sm px-3 py-2 rounded-lg border ${
            publicMessage.includes("success") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {publicMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Page Label</label>
          <input type="text" value={publicLabel} onChange={(e) => setPublicLabel(e.target.value)}
            placeholder="Properties"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          <p className="text-xs text-gray-400 mt-1">Used in page titles, breadcrumbs, and headings (e.g., "Floor Plans", "Housing", "Rooms").</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
          <select value={publicSlug} onChange={(e) => setPublicSlug(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            {SLUG_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>/{o.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            The URL path for your public pages. Make sure the CMS navigation link matches this slug.
          </p>
        </div>

        <button type="submit" disabled={publicSaving}
          className="w-full btn btn-primary disabled:opacity-50">
          {publicSaving ? "Saving..." : "Save Public Pages Settings"}
        </button>
      </form>

      {/* Notification Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900">My Notification Preferences</h2>
        <p className="text-sm text-gray-500 -mt-2">
          Choose which email notifications you want to receive.
        </p>

        {notifMessage && (
          <div className={`text-sm px-3 py-2 rounded-lg border ${
            notifMessage.includes("success") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {notifMessage}
          </div>
        )}

        <div className="space-y-3">
          {notifPrefs.map((pref) => (
            <div key={pref.notificationType} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`notif-${pref.notificationType}`}
                checked={pref.emailEnabled}
                onChange={() => handleNotifToggle(pref.notificationType)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor={`notif-${pref.notificationType}`} className="text-sm text-gray-700">
                {NOTIFICATION_LABELS[pref.notificationType] || pref.notificationType}
              </label>
            </div>
          ))}
        </div>

        <button onClick={handleNotifSave} disabled={notifSaving}
          className="w-full btn btn-primary disabled:opacity-50">
          {notifSaving ? "Saving..." : "Save Notification Preferences"}
        </button>
      </div>
    </div>
  );
}
