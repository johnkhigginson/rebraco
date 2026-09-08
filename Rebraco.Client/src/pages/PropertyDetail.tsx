import { useEffect, useState, useMemo } from 'react';
import type { ApiContentResponseModel } from '../api/umbraco';
import { ContentService } from '../api/umbraco';
import type { PropertyData, UnitSummary, UnitFilters as Filters } from '../types/rental';
import { DEFAULT_UNIT_FILTERS } from '../types/rental';
import {
  parsePropertyData,
  parseUnitSummary,
  matchesUnitFilters,
  formatRentWithPeriod,
  formatAddress,
  propertyTypeLabel,
  genderLabel,
} from '../lib/rental';
import PropertyHero from '../components/rental/PropertyHero';
import AmenityList from '../components/rental/AmenityList';
import UnitCard from '../components/rental/UnitCard';
import UnitFilters from '../components/rental/UnitFilters';
import InquiryForm from '../components/rental/InquiryForm';
import Breadcrumb from '../components/rental/Breadcrumb';
import BlockRenderer from '../components/BlockRenderer';
import { RichText } from '../lib/richtext';

interface PropertyDetailProps {
  data: ApiContentResponseModel;
}

export default function PropertyDetail({ data }: PropertyDetailProps) {
  const property = parsePropertyData(data);
  const [units, setUnits] = useState<UnitSummary[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [unitFilters, setUnitFilters] = useState<Filters>(DEFAULT_UNIT_FILTERS);

  useEffect(() => {
    setLoadingUnits(true);
    ContentService.getContent20(
      `children:${data.route.path}`,
      ['contentType:unit'],
      ['updateDate:desc'],
      0,
      200,
    )
      .then((res) => {
        const parsed = (res.items || []).map(parseUnitSummary);
        setUnits(parsed);
      })
      .catch((err) => console.error('Unit listing fetch error:', err))
      .finally(() => setLoadingUnits(false));
  }, [data.route.path]);

  const filteredUnits = useMemo(
    () => units.filter((u) => matchesUnitFilters(u, unitFilters)),
    [units, unitFilters],
  );

  // Hero data
  const address = formatAddress(property);
  const heroStats = buildHeroStats(property, units);
  const heroBadges = buildHeroBadges(property);
  const priceBadge = property.startingRent
    ? formatRentWithPeriod(property.startingRent, property.pricingPeriod)
    : undefined;

  // Listing path (parent)
  const listingPath = data.route.path.split('/').slice(0, -1).join('/') || '/';

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumb items={[
        { label: 'Properties', path: listingPath },
        { label: property.name },
      ]} />

      <PropertyHero
        images={property.images}
        name={property.name}
        address={address}
        stats={heroStats}
        badges={heroBadges}
        priceBadge={priceBadge}
      />

      {/* Two column layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-8 mt-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Description */}
          {property.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-heading mb-4">About This Property</h2>
              <RichText value={property.description} className="prose prose-lg max-w-none" />
            </div>
          )}

          {/* Building amenities */}
          <AmenityList items={property.buildingAmenities} title="Building Amenities" />

          {/* Units section */}
          <div className="mt-10">
            <UnitFilters
              filters={unitFilters}
              onChange={setUnitFilters}
              resultCount={filteredUnits.length}
            />

            {loadingUnits ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
                    <div className="h-44 bg-border/50" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-border/50 rounded w-2/3" />
                      <div className="h-5 bg-border/50 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-xl bg-surface">
                <p className="text-text-muted">
                  {units.length === 0
                    ? 'No units listed yet. Contact us for availability.'
                    : 'No units match your filters.'}
                </p>
                {unitFilters !== DEFAULT_UNIT_FILTERS && units.length > 0 && (
                  <button
                    onClick={() => setUnitFilters(DEFAULT_UNIT_FILTERS)}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnits.map((unit) => (
                  <UnitCard key={unit.id} unit={unit} />
                ))}
              </div>
            )}
          </div>

          {/* Additional CMS content */}
          {property.content && (
            <div className="mt-10">
              <BlockRenderer content={property.content} />
            </div>
          )}
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

            {/* Inquiry form */}
            <InquiryForm
              propertyName={property.name}
              propertyId={property.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---

function buildHeroStats(property: PropertyData, units: UnitSummary[]): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];

  stats.push({ label: 'Total Units', value: String(property.totalUnits || units.length) });

  if (property.availableUnits > 0) {
    stats.push({ label: 'Available', value: String(property.availableUnits) });
  }

  // Bedroom range from loaded units
  if (units.length > 0) {
    const beds = units.map((u) => u.bedrooms).filter(Boolean);
    if (beds.length > 0) {
      const min = Math.min(...beds);
      const max = Math.max(...beds);
      stats.push({
        label: 'Bedrooms',
        value: min === max ? `${min} BR` : `${min}-${max} BR`,
      });
    }
  }

  return stats;
}

function buildHeroBadges(property: PropertyData): string[] {
  const badges: string[] = [];
  if (property.byuApproved) badges.push('BYU-I Approved');
  const gender = genderLabel(property.genderRestriction);
  if (gender) badges.push(gender);
  badges.push(propertyTypeLabel(property.propertyType));
  return badges;
}
