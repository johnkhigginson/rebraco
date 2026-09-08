import { isRouteErrorResponse, useRouteError } from "react-router";
import type { Route } from "./+types/Page";
import { resolveMediaUrl } from "../lib/utils";
import StandardPage from "./StandardPage";
import BlogLanding from "./BlogLanding";
import BlogPost from "./BlogPost";
import PropertyListing from "./PropertyListing";
import PropertyDetail from "./PropertyDetail";
import UnitDetail from "./UnitDetail";

// --- Loader (runs on server, replaces useEffect data fetching) ---

export async function loader({ context, params }: Route.LoaderArgs) {
  const path = `/${params["*"] || ""}`;
  const base = context.CMS_BASE_URL;
  const mediaBase = context.CMS_MEDIA_URL;

  const url = `${base}/umbraco/delivery/api/v2/content/item${path}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Response("Not found", { status: 404 });
  }

  const data: any = await res.json();

  // Pre-resolve OG image for meta tags (server needs explicit base URL)
  const ogImageRaw =
    data.properties?.ogImage?.[0]?.url ||
    data.properties?.featuredImage?.[0]?.url;
  const ogImageUrl = ogImageRaw ? resolveMediaUrl(ogImageRaw, mediaBase) : null;

  return { ...data, _ogImageUrl: ogImageUrl };
}

// --- Meta (replaces SEOHead component) ---

export function meta({ data, matches }: Route.MetaArgs) {
  if (!data) return [];

  const rootData = matches.find((m: any) => m.id === "root")?.data as
    | { siteName: string }
    | undefined;
  const siteName = rootData?.siteName || "Rebraco";

  const props = data.properties || {};
  const title = props.metaTitle || buildAutoTitle(data) || "Page";
  const description = props.metaDescription || props.excerpt || "";

  const tags: Record<string, string>[] = [
    { title: `${title} | ${siteName}` },
    { property: "og:title", content: title },
  ];
  if (description) {
    tags.push({ name: "description", content: description });
    tags.push({ property: "og:description", content: description });
  }
  if (data._ogImageUrl) {
    tags.push({ property: "og:image", content: data._ogImageUrl });
  }
  if (props.noIndex) {
    tags.push({ name: "robots", content: "noindex, nofollow" });
  }
  return tags;
}

// --- Component ---

export default function Page({ loaderData }: Route.ComponentProps) {
  switch (loaderData.contentType) {
    case "blogLanding":
      return <BlogLanding data={loaderData} />;
    case "blogPost":
      return <BlogPost data={loaderData} />;
    case "propertyListing":
      return <PropertyListing data={loaderData} />;
    case "property":
      return <PropertyDetail data={loaderData} />;
    case "unit":
      return <UnitDetail data={loaderData} />;
    default:
      return <StandardPage data={loaderData} />;
  }
}

// --- Error Boundary ---

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold text-red-500">404</h1>
        <p className="text-slate-500 mt-4">We couldn&apos;t find that page.</p>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold text-red-500">Error</h1>
      <p className="text-slate-500 mt-4">Something went wrong loading this page.</p>
    </div>
  );
}

// --- Helpers ---

function buildAutoTitle(data: any): string {
  const props = data.properties || {};
  const name = props.title || data.name;

  if (data.contentType === "unit" && props.rent) {
    const beds = props.bedrooms ? `${props.bedrooms}BR ` : "";
    const price = `$${Number(props.rent).toLocaleString()}`;
    const period = props.pricingPeriod === "semester" ? "/semester" : "/mo";
    return `${beds}${name} - ${price}${period}`;
  }

  if (data.contentType === "property") {
    const type = props.propertyType === "dorm" ? "Dorm" : "Apartments";
    return `${name} | Student Housing ${type}`;
  }

  return name;
}
