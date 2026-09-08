export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  roles: string[];
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.authenticated) return null;
    return data.user as User;
  } catch {
    return null;
  }
}

export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    return { success: false, error: data?.error || "Login failed." };
  }

  const data = await res.json();
  return { success: true, user: data.user };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
