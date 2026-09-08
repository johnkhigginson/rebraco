import { useState, useEffect } from "react";

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  username: string;
  roles: string[];
}

/**
 * Lightweight client-only hook that checks auth state via /api/auth/me.
 * Returns null during SSR. No context provider needed.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setLoading(true);
    fetch("/api/auth/me", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Silently fail — user stays null
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
