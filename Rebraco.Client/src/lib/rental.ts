import type { ApiContentResponseModel } from '../api/umbraco';
import type {
  PropertySummary,
  PropertyData,
  UnitSummary,
  UnitData,
  PropertyFilters,
  UnitFilters,
} from '../types/rental';
import type { MediaItem } from '../types/blocks';

// --- Helpers ---

function firstMedia(arr: any): MediaItem | null {
  const item = Array.isArray(arr) ? arr[0] : null;
  if (!item?.url) return null;
  return item as MediaItem;
}

function toStringArray(val: any): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

// --- Property (Building) Parsers ---

export function parsePropertySummary(item: ApiContentResponseModel): PropertySummary {
  const p = item.properties || {};
  return {
    id: item.id,
    name: p.title || item.name,
    path: item.route.path,
    propertyType: p.propertyType || 'apartment-complex',
    address: p.address || '',
    city: p.city || '',
    state: p.state || '',
    zip: p.zip || '',
    featuredImage: firstMedia(p.featuredImage),
    startingRent: p.startingRent ? Number(p.startingRent) : null,
    pricingPeriod: p.pricingPeriod || 'monthly',
    availableUnits: Number(p.availableUnits) || 0,
    totalUnits: Number(p.totalUnits) || 0,
    campusProximity: p.campusProximity || undefined,
    byuApproved: p.byuApproved === true,
    genderRestriction: p.genderRestriction || undefined,
    buildingAmenities: toStringArray(p.buildingAmenities),
  };
}

export function parsePropertyData(item: ApiContentResponseModel): PropertyData {
  const summary = parsePropertySummary(item);
  const p = item.properties || {};
  return {
    ...summary,
    description: p.description || null,
    images: Array.isArray(p.images) ? p.images : [],
    contactEmail: p.contactEmail || undefined,
    contactPhone: p.contactPhone || undefined,
    content: p.content || undefined,
  };
}

// --- Unit Parsers ---

export function parseUnitSummary(item: ApiContentResponseModel): UnitSummary {
  const p = item.properties || {};
  return {
    id: item.id,
    name: p.title || item.name,
    path: item.route.path,
    unitNumber: p.unitNumber || undefined,
    bedrooms: Number(p.bedrooms) || 0,
    bathrooms: Number(p.bathrooms) || 0,
    squareFeet: p.squareFeet ? Number(p.squareFeet) : undefined,
    rent: Number(p.rent) || 0,
    pricingModel: p.pricingModel || 'whole-unit',
    pricingPeriod: p.pricingPeriod || 'monthly',
    bedPrice: p.bedPrice ? Number(p.bedPrice) : undefined,
    totalBeds: p.totalBeds ? Number(p.totalBeds) : undefined,
    availableBeds: p.availableBeds ? Number(p.availableBeds) : undefined,
    featuredImage: firstMedia(p.featuredImage),
    availableDate: p.availableDate || undefined,
    furnished: p.furnished === true,
    petsAllowed: p.petsAllowed === true,
    utilitiesIncluded: p.utilitiesIncluded === true,
    genderRestriction: p.genderRestriction || undefined,
    semesterAvailability: toStringArray(p.semesterAvailability),
    leaseTerm: toStringArray(p.leaseTerm),
  };
}

export function parseUnitData(item: ApiContentResponseModel): UnitData {
  const summary = parseUnitSummary(item);
  const p = item.properties || {};
  return {
    ...summary,
    deposit: p.deposit ? Number(p.deposit) : undefined,
    description: p.description || null,
    features: toStringArray(p.features),
    images: Array.isArray(p.images) ? p.images : [],
    floorPlan: Array.isArray(p.floorPlan) ? p.floorPlan : [],
    utilitiesIncludedList: toStringArray(p.utilitiesIncludedList),
    parkingIncluded: p.parkingIncluded === true,
    content: p.content || undefined,
  };
}

// --- Filters ---

export function matchesPropertyFilters(p: PropertySummary, f: PropertyFilters): boolean {
  if (f.search) {
    const q = f.search.toLowerCase();
    const haystack = `${p.name} ${p.address} ${p.city} ${p.buildingAmenities.join(' ')}`.toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  if (f.propertyType && p.propertyType !== f.propertyType) return false;
  return true;
}

export function matchesUnitFilters(u: UnitSummary, f: UnitFilters): boolean {
  if (f.bedrooms !== null && u.bedrooms !== f.bedrooms) return false;
  const effectiveRent = u.pricingModel === 'per-bed' ? (u.bedPrice || u.rent) : u.rent;
  if (f.minRent !== null && effectiveRent < f.minRent) return false;
  if (f.maxRent !== null && effectiveRent > f.maxRent) return false;
  if (f.furnished === true && !u.furnished) return false;
  if (f.petsAllowed === true && !u.petsAllowed) return false;
  if (f.pricingModel && u.pricingModel !== f.pricingModel) return false;
  if (f.semester && !u.semesterAvailability.includes(f.semester)) return false;
  if (f.gender && u.genderRestriction && u.genderRestriction !== f.gender && u.genderRestriction !== 'coed') return false;
  return true;
}

// --- Formatting ---

export function formatRent(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

export function formatRentWithPeriod(amount: number, period: string): string {
  const suffix = period === 'semester' ? '/semester' : '/mo';
  return `${formatRent(amount)}${suffix}`;
}

export function formatAvailableDate(date: string | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  if (d <= now) return 'Available Now';
  return `Available ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function isAvailableSoon(date: string | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return d <= thirtyDays;
}

export function formatAddress(p: { address: string; city: string; state: string; zip: string }): string {
  const parts = [p.address, p.city, p.state].filter(Boolean);
  const line = parts.join(', ');
  return p.zip ? `${line} ${p.zip}` : line;
}

export function propertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'apartment-complex': 'Apartment Complex',
    'dorm': 'Dorm',
    'house': 'House',
    'townhouse': 'Townhouse',
  };
  return labels[type] || type;
}

export function genderLabel(restriction: string | undefined): string | null {
  if (!restriction || restriction === 'coed') return restriction === 'coed' ? 'Co-ed' : null;
  return restriction === 'male' ? "Men's Housing" : "Women's Housing";
}
