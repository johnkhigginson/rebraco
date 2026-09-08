import { useState, useMemo } from 'react';
import { Link, useLoaderData, useLocation, isRouteErrorResponse, useRouteError } from 'react-router';
import type { Route } from './+types/PublicPropertyDetail';
import {
  fetchPropertyBySlug,
  fetchPublicSettings,
  type PublicPropertyDetail as PropertyDetail,
  type PublicUnitSummary,
  type PublicPagesSettings,
} from '../lib/publicApi';
import {
  formatRentWithPeriod,
  propertyTypeLabel,
  genderLabel,
  formatRent,
} from '../lib/rental';
import AmenityList from '../components/rental/AmenityList';
import Breadcrumb from '../components/rental/Breadcrumb';
import InquiryForm from '../components/rental/InquiryForm';
import TourBooking from '../components/rental/TourBooking';
import RoomFilters, { DEFAULT_ROOM_FILTERS, type RoomFilterState } from '../components/rental/RoomFilters';

// --- Loader (SSR) ---

export async function loader({ context, params }: Route.LoaderArgs) {
  const base = context.CMS_BASE_URL;
  const [data, settings] = await Promise.all([
    fetchPropertyBySlug(params.slug, base),
    fetchPublicSettings(base),
  ]);
  return { property: data, settings };
}

// --- Meta ---

export function meta({ data, matches }: Route.MetaArgs) {
  if (!data?.property) return [];

  const property = data.property;
  const rootData = matches.find((m: any) => m.id === 'root')?.data as
    | { siteName: string }
    | undefined;
  const siteName = rootData?.siteName || 'Rebraco';

  const title = property.metaTitle || `${property.name} | Student Housing`;
  const description = property.metaDescription || `${property.name} - ${property.address}, ${property.city}, ${property.state}. Browse available units and pricing.`;

  const tags: Record<string, string>[] = [
    { title: `${title} | ${siteName}` },
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
  ];

  if (property.featuredImageUrl) {
    tags.push({ property: 'og:image', content: property.featuredImageUrl });
  }

  return tags;
}

// --- Filter + Sort helpers ---

function getEffectiveRent(unit: PublicUnitSummary): number {
  return unit.pricingModel === 'perbed' ? (unit.bedPrice || unit.rent) : unit.rent;
}

function filterAndSortUnits(units: PublicUnitSummary[], filters: RoomFilterState): PublicUnitSummary[] {
  let result = units.filter((unit) => {
    // Gender
    if (filters.gender && (unit.genderRestriction || '').toLowerCase() !== filters.gender.toLowerCase()) {
      return false;
    }
    // Semesters
    if (filters.semesters.length > 0) {
      const unitSemesters = unit.semesterAvailability.map((s) => s.toLowerCase());
      if (!filters.semesters.some((s) => unitSemesters.includes(s))) return false;
    }
    // Price
    const rent = getEffectiveRent(unit);
    if (filters.minPrice && rent < Number(filters.minPrice)) return false;
    if (filters.maxPrice && rent > Number(filters.maxPrice)) return false;
    // Bedrooms
    if (filters.bedrooms) {
      if (filters.bedrooms === '4+') {
        if (unit.bedrooms < 4) return false;
      } else if (unit.bedrooms !== Number(filters.bedrooms)) {
        return false;
      }
    }
    // Furnished
    if (filters.furnished === 'yes' && !unit.furnished) return false;
    if (filters.furnished === 'no' && unit.furnished) return false;
    // Available before
    if (filters.availableBefore && unit.availableDate) {
      if (new Date(unit.availableDate) > new Date(filters.availableBefore)) return false;
    }
    // Lease term
    if (filters.leaseTerm) {
      const terms = unit.leaseTerms.map((t) => t.toLowerCase());
      if (!terms.includes(filters.leaseTerm.toLowerCase())) return false;
    }
    return true;
  });

  // Sort
  result.sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return getEffectiveRent(a) - getEffectiveRent(b);
      case 'price-desc':
        return getEffectiveRent(b) - getEffectiveRent(a);
      case 'beds-asc':
        return a.bedrooms - b.bedrooms;
      case 'beds-desc':
        return b.bedrooms - a.bedrooms;
      case 'available': {
        const da = a.availableDate ? new Date(a.availableDate).getTime() : Infinity;
        const db = b.availableDate ? new Date(b.availableDate).getTime() : Infinity;
        return da - db;
      }
      default:
        return 0;
    }
  });

  return result;
}

// --- Component ---

export default function PublicPropertyDetailPage() {
  const { property, settings } = useLoaderData<{ property: PropertyDetail; settings: PublicPagesSettings }>();
  const [activeImage, setActiveImage] = useState(0);
  const [filters, setFilters] = useState<RoomFilterState>(DEFAULT_ROOM_FILTERS);
  const location = useLocation();

  // Derive slug prefix from current URL for breadcrumb/links
  const slugPrefix = location.pathname.split('/').filter(Boolean)[0] || settings.publicPagesSlug;
  const pagesLabel = settings.publicPagesLabel || 'Properties';
  const roomLabel = pagesLabel === 'Properties' ? 'Available Rooms' : pagesLabel;

  // Hero images: featured image + gallery images
  const allImages = useMemo(() => {
    const imgs: { url: string; alt?: string | null }[] = [];
    if (property.featuredImageUrl) {
      imgs.push({ url: property.featuredImageUrl, alt: property.name });
    }
    imgs.push(...property.images);
    return imgs;
  }, [property]);

  // Filtered + sorted units
  const filteredUnits = useMemo(
    () => filterAndSortUnits(property.units, filters),
    [property.units, filters],
  );

  const address = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(', ');

  const gender = genderLabel(property.genderRestriction ?? undefined);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumb items={[
        { label: pagesLabel, path: `/${slugPrefix}` },
        { label: property.name },
      ]} />

      {/* Hero section - Image gallery */}
      <div className="mb-8">
        {allImages.length > 0 ? (
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden bg-surface">
              <img
                src={allImages[activeImage]?.url}
                alt={allImages[activeImage]?.alt || property.name}
                className="w-full h-full object-cover"
              />
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {property.byuApproved && (
                  <span className="px-3 py-1 text-sm font-bold bg-blue-600 text-white rounded-lg">
                    BYU-I Approved
                  </span>
                )}
                {gender && (
                  <span className="px-3 py-1 text-sm font-semibold bg-white/90 text-slate-700 rounded-lg backdrop-blur-sm">
                    {gender}
                  </span>
                )}
                <span className="px-3 py-1 text-sm font-semibold bg-black/60 text-white rounded-lg backdrop-blur-sm">
                  {propertyTypeLabel(property.propertyType)}
                </span>
              </div>
              {/* Price badge */}
              {property.startingRent && (
                <div className="absolute bottom-4 right-4">
                  <span className="px-4 py-2 text-lg font-bold bg-white/90 text-slate-900 rounded-lg backdrop-blur-sm shadow">
                    From {formatRentWithPeriod(property.startingRent, property.pricingPeriod)}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition ${
                      i === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-[300px] rounded-xl bg-surface flex items-center justify-center">
            <svg className="w-20 h-20 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 22h20M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
            </svg>
          </div>
        )}

        {/* Property name + address */}
        <div className="mt-4">
          <h1 className="text-3xl md:text-4xl font-bold text-heading">{property.name}</h1>
          <p className="text-lg text-text-muted mt-1">{address} {property.zip}</p>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 mt-4 text-sm">
          <div>
            <span className="text-text-muted">Total Units: </span>
            <span className="font-semibold text-text">{property.totalUnits}</span>
          </div>
          <div>
            <span className="text-text-muted">Available: </span>
            <span className={`font-semibold ${property.availableUnits > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {property.availableUnits > 0 ? `${property.availableUnits} units` : 'Waitlist'}
            </span>
          </div>
          {property.campusProximity && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-text-muted">{property.campusProximity}</span>
            </div>
          )}
        </div>
      </div>

      {/* Two column layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Description */}
          {property.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-heading mb-4">About This Property</h2>
              <div className="prose prose-lg max-w-none text-text">
                <p>{property.description}</p>
              </div>
            </div>
          )}

          {/* Building amenities */}
          <AmenityList items={property.buildingAmenities} title="Building Amenities" />

          {/* Room browser section */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-heading mb-4">
              {roomLabel}
            </h2>

            {property.units.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-xl bg-surface">
                <p className="text-text-muted">No rooms listed yet. Contact us for availability.</p>
              </div>
            ) : (
              <>
                <RoomFilters
                  filters={filters}
                  onChange={setFilters}
                  totalCount={property.units.length}
                  filteredCount={filteredUnits.length}
                  label="rooms"
                />

                {filteredUnits.length === 0 ? (
                  <div className="text-center py-12 border border-border rounded-xl bg-surface">
                    <p className="text-text-muted mb-2">No rooms match your filters.</p>
                    <button
                      onClick={() => setFilters(DEFAULT_ROOM_FILTERS)}
                      className="text-primary hover:underline text-sm"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredUnits.map((unit) => (
                      <PublicUnitCard key={unit.id} unit={unit} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            {/* Quick facts */}
            <div className="card">
              <h3 className="text-lg font-bold text-heading mb-4">Quick Facts</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Type</span>
                  <span className="font-medium text-text">{propertyTypeLabel(property.propertyType)}</span>
                </div>
                {property.campusProximity && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Campus</span>
                    <span className="font-medium text-text">{property.campusProximity}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Total Units</span>
                  <span className="font-medium text-text">{property.totalUnits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Available</span>
                  <span className={`font-medium ${property.availableUnits > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {property.availableUnits > 0 ? `${property.availableUnits} units` : 'Waitlist'}
                  </span>
                </div>
                {property.contactPhone && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Phone</span>
                    <a href={`tel:${property.contactPhone}`} className="font-medium text-primary hover:underline">
                      {property.contactPhone}
                    </a>
                  </div>
                )}
                {property.contactEmail && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Email</span>
                    <a href={`mailto:${property.contactEmail}`} className="font-medium text-primary hover:underline truncate ml-4">
                      {property.contactEmail}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <TourBooking
              propertyId={property.id}
              units={property.units.map((u) => ({ id: u.id, unitNumber: u.unitNumber }))}
            />

            <InquiryForm
              propertyName={property.name}
              propertyId={String(property.id)}
              efPropertyId={property.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Inline PublicUnitCard (simpler than full UnitCard, no Umbraco paths) ---

function PublicUnitCard({ unit }: { unit: PublicUnitSummary }) {
  const effectiveRent = unit.pricingModel === 'perbed' ? (unit.bedPrice || unit.rent) : unit.rent;
  const period = unit.pricingPeriod === 'semester' ? '/semester' : '/mo';
  const gender = genderLabel(unit.genderRestriction ?? undefined);
  const pricingLabel = unit.pricingModel === 'perbed' ? '/bed' : '';

  return (
    <div className="bg-bg rounded-xl border border-border overflow-hidden hover:shadow-md transition">
      {/* Unit image */}
      {unit.featuredImageUrl ? (
        <div className="h-44 overflow-hidden">
          <img
            src={unit.featuredImageUrl}
            alt={`Unit ${unit.unitNumber}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="h-28 bg-surface flex items-center justify-center">
          <svg className="w-8 h-8 text-text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4" />
          </svg>
        </div>
      )}

      <div className="p-4">
        {/* Unit number + price */}
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-base font-bold text-heading">Unit {unit.unitNumber}</h3>
          <span className="text-lg font-bold text-primary">
            {formatRent(effectiveRent)}
            <span className="text-sm font-normal text-text-muted">{pricingLabel}{period}</span>
          </span>
        </div>

        {/* Specs */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted mb-3">
          <span>{unit.bedrooms} bed{unit.bedrooms !== 1 ? 's' : ''}</span>
          <span>{unit.bathrooms} bath{unit.bathrooms !== 1 ? 's' : ''}</span>
          {unit.squareFeet && <span>{unit.squareFeet} sqft</span>}
          {unit.pricingModel === 'perbed' && unit.availableBeds != null && unit.totalBeds != null && (
            <span className={unit.availableBeds > 0 ? 'text-green-600' : 'text-red-500'}>
              {unit.availableBeds} of {unit.totalBeds} beds available
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {unit.furnished && (
            <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded">Furnished</span>
          )}
          {unit.petsAllowed && (
            <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded">Pets OK</span>
          )}
          {unit.utilitiesIncluded && (
            <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">Utilities Incl.</span>
          )}
          {gender && (
            <span className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded">{gender}</span>
          )}
          {unit.semesterAvailability.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded">
              {unit.semesterAvailability.join(', ')}
            </span>
          )}
          {unit.availableDate && (
            <span className="px-2 py-0.5 text-xs bg-surface text-text-muted rounded">
              Avail. {new Date(unit.availableDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Error Boundary ---

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-4xl font-bold text-red-500">404</h1>
        <p className="text-slate-500 mt-4">Property not found.</p>
        <Link to="/properties" className="text-primary hover:underline mt-4 inline-block">
          Browse all properties
        </Link>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold text-red-500">Error</h1>
      <p className="text-slate-500 mt-4">Unable to load this property. Please try again later.</p>
    </div>
  );
}
