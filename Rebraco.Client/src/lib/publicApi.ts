// --- Public API Client ---
// Fetches rental property data from the EF Core public API endpoints.
// Accepts an optional baseUrl for SSR (loaders pass context.CMS_BASE_URL).

// --- TypeScript Interfaces (match C# DTOs) ---

export interface PublicImage {
  url: string;
  alt?: string | null;
}

export interface PublicPropertySummary {
  id: number;
  name: string;
  slug: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  featuredImageUrl?: string | null;
  startingRent?: number | null;
  pricingPeriod: string;
  availableUnits: number;
  totalUnits: number;
  campusProximity?: string | null;
  byuApproved: boolean;
  genderRestriction?: string | null;
  buildingAmenities: string[];
}

export interface PublicPropertyDetail extends PublicPropertySummary {
  description?: string | null;
  images: PublicImage[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  units: PublicUnitSummary[];
}

export interface PublicUnitSummary {
  id: number;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number | null;
  rent: number;
  pricingModel: string;
  pricingPeriod: string;
  bedPrice?: number | null;
  totalBeds?: number | null;
  availableBeds?: number | null;
  featuredImageUrl?: string | null;
  availableDate?: string | null;
  furnished: boolean;
  petsAllowed: boolean;
  utilitiesIncluded: boolean;
  genderRestriction?: string | null;
  semesterAvailability: string[];
  leaseTerms: string[];
}

export interface PublicUnitDetail extends PublicUnitSummary {
  parkingIncluded: boolean;
  description?: string | null;
  features: string[];
  deposit?: number | null;
  images: PublicImage[];
  floorPlanImages: PublicImage[];
  propertyName: string;
  propertySlug: string;
}

export interface PublicPropertyListResponse {
  items: PublicPropertySummary[];
  total: number;
  skip: number;
  take: number;
}

export interface PublicPropertyFilterParams {
  type?: string;
  gender?: string;
  search?: string;
  sort?: string;
  skip?: number;
  take?: number;
}

export interface PublicPagesSettings {
  publicPagesLabel: string;
  publicPagesSlug: string;
}

// --- Fetch functions ---

function buildUrl(path: string, params?: Record<string, string | number | undefined>, baseUrl?: string): string {
  const base = baseUrl || import.meta.env.VITE_CMS_BASE_URL || '';
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== '') {
        url.searchParams.set(key, String(val));
      }
    }
  }
  return url.toString();
}

export async function fetchProperties(
  filter?: PublicPropertyFilterParams,
  baseUrl?: string,
): Promise<PublicPropertyListResponse> {
  const url = buildUrl('/api/public/properties', filter as Record<string, string | number | undefined>, baseUrl);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch properties: ${res.status}`);
  return res.json();
}

export async function fetchPropertyBySlug(
  slug: string,
  baseUrl?: string,
): Promise<PublicPropertyDetail> {
  const url = buildUrl(`/api/public/properties/${encodeURIComponent(slug)}`, undefined, baseUrl);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch property: ${res.status}`);
  return res.json();
}

export async function fetchPublicSettings(
  baseUrl?: string,
): Promise<PublicPagesSettings> {
  const url = buildUrl('/api/public/properties/settings', undefined, baseUrl);
  const res = await fetch(url);
  if (!res.ok) return { publicPagesLabel: 'Properties', publicPagesSlug: 'properties' };
  return res.json();
}

export async function fetchUnit(
  unitId: number,
  baseUrl?: string,
): Promise<PublicUnitDetail> {
  const url = buildUrl(`/api/public/properties/units/${unitId}`, undefined, baseUrl);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch unit: ${res.status}`);
  return res.json();
}
