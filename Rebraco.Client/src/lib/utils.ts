/** Resolves a relative Umbraco media URL to an absolute URL.
 *  Pass `baseUrl` explicitly in SSR loaders; falls back to Vite env vars on the client. */
export function resolveMediaUrl(relativeUrl: string | undefined | null, baseUrl?: string): string | null {
  if (!relativeUrl) return null;
  const base = baseUrl || import.meta.env.VITE_CMS_MEDIA_URL || import.meta.env.VITE_CMS_BASE_URL || '';
  return `${base}${relativeUrl}`;
}
