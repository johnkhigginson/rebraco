/**
 * Script injection utilities for GTM, GA4, and custom head/body scripts.
 * Called from SiteContext after fetching generalSettings data.
 */

export interface GeneralData {
  websiteName: string;
  defaultSocialShareImage: string | null;
  googleTagManagerId: string;
  googleAnalyticsId: string;
  headerOpeningScripts: string;
  headerClosingScripts: string;
  bodyOpeningScripts: string;
  bodyClosingScripts: string;
}

// --- Pure HTML string renderers (SSR-safe, no DOM) ---

/** Returns GTM head script as an HTML string for SSR. */
export function renderGtmHeadScript(gtmId: string): string {
  if (!gtmId) return '';
  return `<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>`;
}

/** Returns GTM body noscript as an HTML string for SSR. */
export function renderGtmBodyNoscript(gtmId: string): string {
  if (!gtmId) return '';
  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

/** Returns GA4 scripts as an HTML string for SSR. */
export function renderGa4Scripts(gaId: string): string {
  if (!gaId) return '';
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');</script>`;
}

// --- DOM injection functions (client only) ---

/** Inject Google Tag Manager (head snippet + body noscript) */
function injectGTM(gtmId: string) {
  if (!gtmId) return;

  // Head script
  const script = document.createElement('script');
  script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`;
  document.head.insertBefore(script, document.head.firstChild);

  // Body noscript
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);
}

/** Inject Google Analytics 4 (gtag.js) */
function injectGA4(gaId: string) {
  if (!gaId) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(script);

  const inline = document.createElement('script');
  inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
  document.head.appendChild(inline);
}

/**
 * Inject an HTML string as DOM nodes at a given position.
 * TRUST BOUNDARY: This content is authored by CMS admins (General Settings) and
 * intentionally allows scripts (GTM, analytics, tracking pixels, etc.).
 * Do NOT sanitize — it would break the injected scripts.
 */
function injectHTML(html: string, parent: HTMLElement, position: 'prepend' | 'append') {
  if (!html?.trim()) return;

  const container = document.createElement('div');
  container.innerHTML = html;

  // Move child nodes (scripts, noscripts, links, etc.) into the parent
  while (container.firstChild) {
    const node = container.firstChild;

    // Script tags inserted via innerHTML don't execute — recreate them
    if (node instanceof HTMLScriptElement) {
      const newScript = document.createElement('script');
      if (node.src) {
        newScript.src = node.src;
        newScript.async = node.async;
      } else {
        newScript.textContent = node.textContent;
      }
      // Copy attributes
      for (const attr of Array.from(node.attributes)) {
        if (attr.name !== 'src' && attr.name !== 'async') {
          newScript.setAttribute(attr.name, attr.value);
        }
      }
      container.removeChild(node);
      if (position === 'prepend') {
        parent.insertBefore(newScript, parent.firstChild);
      } else {
        parent.appendChild(newScript);
      }
    } else {
      container.removeChild(node);
      if (position === 'prepend') {
        parent.insertBefore(node, parent.firstChild);
      } else {
        parent.appendChild(node);
      }
    }
  }
}

/**
 * Inject all scripts from General Settings.
 * Called once after generalSettings data is fetched (CSR-only path).
 */
export function injectGeneralScripts(general: GeneralData) {
  // GTM & GA4
  injectGTM(general.googleTagManagerId);
  injectGA4(general.googleAnalyticsId);

  // Custom script positions
  injectHTML(general.headerOpeningScripts, document.head, 'prepend');
  injectHTML(general.headerClosingScripts, document.head, 'append');
  injectHTML(general.bodyOpeningScripts, document.body, 'prepend');
  injectHTML(general.bodyClosingScripts, document.body, 'append');
}

/**
 * Inject only custom admin scripts (NOT GTM/GA4 which are SSR'd in root.tsx).
 * Called on client after hydration.
 */
export function injectCustomScripts(general: GeneralData) {
  injectHTML(general.headerOpeningScripts, document.head, 'prepend');
  injectHTML(general.headerClosingScripts, document.head, 'append');
  injectHTML(general.bodyOpeningScripts, document.body, 'prepend');
  injectHTML(general.bodyClosingScripts, document.body, 'append');
}
