import { useEffect } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
  useRouteLoaderData,
} from "react-router";
import type { Route } from "./+types/root";
import "./index.css";

import { parseNavigation, parseFooter, parseGeneral } from "./lib/siteData";
import {
  parseDesign,
  generateDesignCSS,
  generateTypographyCss,
  buildGoogleFontsUrl,
  injectCustomCode,
} from "./lib/designTokens";
import { injectCustomScripts } from "./lib/scripts";
import { SiteProvider } from "./contexts/SiteContext";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

// --- Helpers ---

async function fetchUmbracoContent(baseUrl: string, contentType: string): Promise<Record<string, any> | null> {
  const url = `${baseUrl}/umbraco/delivery/api/v2/content?filter=${encodeURIComponent(`contentType:${contentType}`)}&skip=0&take=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json: any = await res.json();
  return json?.items?.[0]?.properties ?? null;
}

// --- Loader ---

export async function loader({ context }: Route.LoaderArgs) {
  const base = context.CMS_BASE_URL;
  const mediaBase = context.CMS_MEDIA_URL;

  const [navProps, footerProps, designProps, generalProps] = await Promise.all([
    fetchUmbracoContent(base, "navigation"),
    fetchUmbracoContent(base, "footer"),
    fetchUmbracoContent(base, "design"),
    fetchUmbracoContent(base, "generalSettings"),
  ]);

  const navigation = navProps ? parseNavigation(navProps) : null;
  const footer = footerProps ? parseFooter(footerProps) : null;
  const design = designProps ? parseDesign(designProps, mediaBase) : null;
  const general = generalProps ? parseGeneral(generalProps, mediaBase) : null;

  return {
    siteName: general?.websiteName || "Rebraco",
    navigation,
    footer,
    design,
    general,
    googleFontsUrl: design ? buildGoogleFontsUrl(design) : null,
    designCss: design ? generateDesignCSS(design) : "",
    typographyCss: design ? generateTypographyCss(design.typographyRules) : "",
  };
}

export function shouldRevalidate() {
  return false;
}

// --- Meta ---

export function meta({ data }: Route.MetaArgs) {
  const tags: ReturnType<typeof Array<Record<string, string>>> = [
    { title: data?.siteName || "Rebraco" },
    { property: "og:site_name", content: data?.siteName || "Rebraco" },
  ];
  if (data?.general?.defaultSocialShareImage) {
    tags.push({ property: "og:image", content: data.general.defaultSocialShareImage });
    tags.push({ name: "twitter:image", content: data.general.defaultSocialShareImage });
  }
  return tags;
}

// --- Layout (HTML shell, wraps both route and error boundary) ---

export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {data?.design?.favicon && <link rel="icon" href={data.design.favicon} />}
        {data?.design?.favicon && (
          <link rel="apple-touch-icon" href={data.design.favicon} />
        )}
        {data?.googleFontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin=""
            />
            <link rel="stylesheet" href={data.googleFontsUrl} />
          </>
        )}
        {data?.designCss && (
          <style dangerouslySetInnerHTML={{ __html: data.designCss }} />
        )}
        {data?.typographyCss && (
          <style dangerouslySetInnerHTML={{ __html: data.typographyCss }} />
        )}
        {data?.design?.customCss && (
          <style dangerouslySetInnerHTML={{ __html: data.design.customCss }} />
        )}
        {data?.general?.googleTagManagerId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${data.general.googleTagManagerId}');`,
            }}
          />
        )}
        {data?.general?.googleAnalyticsId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${data.general.googleAnalyticsId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${data.general.googleAnalyticsId}');`,
              }}
            />
          </>
        )}
        <Meta />
        <Links />
      </head>
      <body>
        {data?.general?.googleTagManagerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${data.general.googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// --- Root Component ---

export default function Root({ loaderData }: Route.ComponentProps) {
  const location = useLocation();
  const isManage = location.pathname.startsWith("/manage");

  // Client-only: inject admin custom HTML that can't be SSR'd in React
  useEffect(() => {
    if (loaderData.design) injectCustomCode(loaderData.design);
    if (loaderData.general) injectCustomScripts(loaderData.general);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Management area has its own layout — skip public Header/Footer
  if (isManage) {
    return <Outlet />;
  }

  return (
    <SiteProvider data={loaderData}>
      <div className="min-h-screen flex flex-col font-body text-slate-900">
        <Header />
        <main className="flex-grow">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SiteProvider>
  );
}

// --- Error Boundary ---

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold text-red-500">{error.status}</h1>
        <p className="text-slate-500 mt-4">{error.statusText}</p>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold text-red-500">Error</h1>
      <p className="text-slate-500 mt-4">Something went wrong.</p>
    </div>
  );
}
