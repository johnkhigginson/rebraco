/**
 * Shared fetch wrapper for management API calls.
 * Auto-redirects to /manage/login on 401.
 */
export async function manageFetch(
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
    window.location.href = "/manage/login";
    throw new Error("Unauthorized");
  }

  return res;
}
