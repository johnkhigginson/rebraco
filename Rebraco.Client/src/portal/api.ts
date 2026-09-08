/**
 * Shared fetch wrapper for tenant portal API calls.
 * Auto-redirects to /portal/login on 401.
 */
export async function portalFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/portal/login";
    throw new Error("Unauthorized");
  }

  return res;
}
