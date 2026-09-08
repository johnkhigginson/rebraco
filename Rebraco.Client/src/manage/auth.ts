export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

const API_BASE = "/api/auth";

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_BASE}/me`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.authenticated ? data.user : null;
}

export async function login(
  username: string,
  password: string
): Promise<User> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || "Login failed");
  }
  const data = await res.json();
  return data.user;
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/logout`, {
    method: "POST",
    credentials: "include",
  });
}
