import { useState, useEffect, useCallback, type FormEvent } from "react";
import { portalFetch } from "./api";

interface NotificationPref {
  notificationType: string;
  emailEnabled: boolean;
}

const TENANT_NOTIFICATION_LABELS: Record<string, string> = {
  invoice_sent: "New invoice received",
  payment_confirmation: "Payment confirmed",
  maintenance_update: "Maintenance status changed",
  lease_expiring: "Lease expiring soon",
  renewal_offer: "New renewal offer",
  tour_confirmation: "Tour confirmed",
  tour_reminder: "Tour day-before reminder",
};

interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  moveInDate: string | null;
  status: string;
}

export default function PortalProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  useEffect(() => {
    portalFetch("/api/portal/me")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setPhone(data.phone || "");
        setEmergencyContactName(data.emergencyContactName || "");
        setEmergencyContactPhone(data.emergencyContactPhone || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await portalFetch("/api/portal/me", {
        method: "PATCH",
        body: JSON.stringify({
          phone: phone || null,
          emergencyContactName: emergencyContactName || null,
          emergencyContactPhone: emergencyContactPhone || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to update profile.");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-gray-500 py-8">Loading...</div>;
  if (!profile) return <div className="text-gray-500 py-8">Profile not found.</div>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Read-only info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Account Information</h2>
        <div className="space-y-3">
          <div>
            <span className="text-xs text-gray-500">Name</span>
            <p className="text-sm font-medium text-gray-900">
              {profile.firstName} {profile.lastName}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500">Email</span>
            <p className="text-sm font-medium text-gray-900">{profile.email}</p>
          </div>
          {profile.moveInDate && (
            <div>
              <span className="text-xs text-gray-500">Move-in Date</span>
              <p className="text-sm font-medium text-gray-900">
                {new Date(profile.moveInDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
          <div>
            <span className="text-xs text-gray-500">Status</span>
            <p className="text-sm font-medium text-gray-900">{profile.status}</p>
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5"
      >
        <h2 className="text-sm font-medium text-gray-500">Contact Information</h2>

        {success && (
          <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            Profile updated successfully.
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            placeholder="(555) 123-4567"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                maxLength={150}
                placeholder="Jane Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                maxLength={30}
                placeholder="(555) 987-6543"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full btn btn-primary disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <ChangePasswordCard />
      <NotificationPreferencesCard />
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Failed to change password.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5 mt-6"
    >
      <h2 className="text-sm font-medium text-gray-500">Change Password</h2>

      {success && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Password changed successfully.
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
      >
        {saving ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}

function NotificationPreferencesCard() {
  const [prefs, setPrefs] = useState<NotificationPref[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    portalFetch("/api/portal/notification-preferences")
      .then((r) => r.json())
      .then((data: { items: NotificationPref[] }) => setPrefs(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = useCallback((type: string) => {
    setPrefs((prev) =>
      prev.map((p) =>
        p.notificationType === type ? { ...p, emailEnabled: !p.emailEnabled } : p
      )
    );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await portalFetch("/api/portal/notification-preferences", {
        method: "PUT",
        body: JSON.stringify({ preferences: prefs }),
      });
      setMessage(res.ok ? "Preferences saved successfully." : "Failed to save preferences.");
    } catch {
      setMessage("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5 mt-6">
      <h2 className="text-sm font-medium text-gray-500">Email Notifications</h2>
      <p className="text-xs text-gray-400 -mt-2">Choose which email notifications you want to receive.</p>

      {message && (
        <div className={`text-sm px-3 py-2 rounded-lg border ${
          message.includes("success") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-3">
        {prefs.map((pref) => (
          <div key={pref.notificationType} className="flex items-center gap-3">
            <input
              type="checkbox"
              id={`notif-${pref.notificationType}`}
              checked={pref.emailEnabled}
              onChange={() => handleToggle(pref.notificationType)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={`notif-${pref.notificationType}`} className="text-sm text-gray-700">
              {TENANT_NOTIFICATION_LABELS[pref.notificationType] || pref.notificationType}
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full btn btn-primary disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Notification Preferences"}
      </button>
    </div>
  );
}
