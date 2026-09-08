import type { MediaItem, RichTextValue } from './blocks';

// --- Building / Complex (property document type) ---

/** Summary data for building cards on the listing page */
export interface PropertySummary {
  id: string;
  name: string;
  path: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  featuredImage: MediaItem | null;
  startingRent: number | null;
  pricingPeriod: string;          // 'monthly' | 'semester'
  availableUnits: number;
  totalUnits: number;
  campusProximity?: string;
  byuApproved: boolean;
  genderRestriction?: string;     // building-level: male | female | coed
  buildingAmenities: string[];
}

/** Full building data for the detail page */
export interface PropertyData extends PropertySummary {
  description: RichTextValue | null;
  images: MediaItem[];
  contactEmail?: string;
  contactPhone?: string;
  content?: any;
}

// --- Unit (unit document type, child of property) ---

/** Summary data for unit cards within a building page */
export interface UnitSummary {
  id: string;
  name: string;
  path: string;
  unitNumber?: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rent: number;
  pricingModel: string;           // 'whole-unit' | 'per-bed'
  pricingPeriod: string;          // 'monthly' | 'semester'
  bedPrice?: number;
  totalBeds?: number;
  availableBeds?: number;
  featuredImage: MediaItem | null;
  availableDate?: string;
  furnished: boolean;
  petsAllowed: boolean;
  utilitiesIncluded: boolean;     // all-inclusive pricing flag
  genderRestriction?: string;
  semesterAvailability: string[];
  leaseTerm: string[];
}

/** Full unit data for the detail page */
export interface UnitData extends UnitSummary {
  deposit?: number;
  description: RichTextValue | null;
  features: string[];
  images: MediaItem[];
  floorPlan: MediaItem[];
  utilitiesIncludedList: string[];
  parkingIncluded: boolean;
  content?: any;
}

// --- Filters ---

/** Filter state for the building listing page */
export interface PropertyFilters {
  search: string;
  propertyType: string | null;
}

/** Filter state for units within a building */
export interface UnitFilters {
  bedrooms: number | null;
  minRent: number | null;
  maxRent: number | null;
  furnished: boolean | null;
  petsAllowed: boolean | null;
  pricingModel: string | null;
  semester: string | null;
  gender: string | null;
}

// --- Constants ---

export const PROPERTY_TYPES = [
  { value: 'apartment-complex', label: 'Apartment Complex' },
  { value: 'dorm', label: 'Dorm' },
  { value: 'house', label: 'House' },
  { value: 'townhouse', label: 'Townhouse' },
] as const;

export const SEMESTERS = [
  { value: 'fall', label: 'Fall' },
  { value: 'winter', label: 'Winter' },
  { value: 'spring', label: 'Spring/Summer' },
] as const;

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'coed', label: 'Co-ed' },
] as const;

export const PRICING_PERIODS = [
  { value: 'monthly', label: '/mo' },
  { value: 'semester', label: '/semester' },
] as const;

export const LEASE_TERMS = [
  { value: 'semester', label: 'Semester' },
  { value: '6-month', label: '6 Month' },
  { value: '12-month', label: '12 Month' },
] as const;

export const DEFAULT_PROPERTY_FILTERS: PropertyFilters = {
  search: '',
  propertyType: null,
};

export const DEFAULT_UNIT_FILTERS: UnitFilters = {
  bedrooms: null,
  minRent: null,
  maxRent: null,
  furnished: null,
  petsAllowed: null,
  pricingModel: null,
  semester: null,
  gender: null,
};
