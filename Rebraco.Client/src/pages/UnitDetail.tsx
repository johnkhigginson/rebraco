import type { ApiContentResponseModel } from '../api/umbraco';
import { parseUnitData, formatAddress, genderLabel, formatRentWithPeriod } from '../lib/rental';
import PropertyHero from '../components/rental/PropertyHero';
import AmenityList from '../components/rental/AmenityList';
import PricingCard from '../components/rental/PricingCard';
import InquiryForm from '../components/rental/InquiryForm';
import Breadcrumb from '../components/rental/Breadcrumb';
import BlockRenderer from '../components/BlockRenderer';
import { RichText } from '../lib/richtext';
import { resolveMediaUrl } from '../lib/utils';

interface UnitDetailProps {
  data: ApiContentResponseModel;
  parentName?: string;
  parentPath?: string;
  parentAddress?: string;
}

export default function UnitDetail({ data, parentName, parentPath, parentAddress }: UnitDetailProps) {
  const unit = parseUnitData(data);

  // Derive parent info from path if not provided
  const pathParts = data.route.path.split('/').filter(Boolean);
  const buildingPath = parentPath || '/' + pathParts.slice(0, -1).join('/');
  const listingPath = '/' + pathParts.slice(0, -2).join('/') || '/';
  const buildingName = parentName || pathParts[pathParts.length - 2]?.replace(/-/g, ' ') || 'Property';
  const address = parentAddress || formatAddress({ address: '', city: '', state: '', zip: '' });

  // Hero configuration
  const heroImages = unit.images.length > 0 ? unit.images : (unit.featuredImage ? [unit.featuredImage] : []);
  const heroStats = buildUnitStats(unit);
  const heroBadges = buildUnitBadges(unit);

  const priceBadge = unit.pricingModel === 'per-bed'
    ? formatRentWithPeriod(unit.bedPrice || unit.rent, unit.pricingPeriod) + '/bed'
    : formatRentWithPeriod(unit.rent, unit.pricingPeriod);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <Breadcrumb items={[
        { label: 'Properties', path: listingPath },
        { label: buildingName, path: buildingPath },
        { label: unit.name },
      ]} />

      <PropertyHero
        images={heroImages}
        name={unit.name}
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
          {unit.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-heading mb-4">About This Unit</h2>
              <RichText value={unit.description} className="prose prose-lg max-w-none" />
            </div>
          )}

          {/* Unit features */}
          <AmenityList items={unit.features} title="Unit Features" />

          {/* Utilities included */}
          {unit.utilitiesIncludedList.length > 0 && (
            <AmenityList items={unit.utilitiesIncludedList} title="Utilities Included" />
          )}

          {/* Floor plan */}
          {unit.floorPlan.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-heading mb-4">Floor Plan</h3>
              {unit.floorPlan.map((img, i) => {
                const src = resolveMediaUrl(img.url);
                if (!src) return null;
                return (
                  <img
                    key={i}
                    src={src}
                    alt={`Floor plan ${i + 1}`}
                    className="max-w-full rounded-xl border border-border"
                    loading="lazy"
                  />
                );
              })}
            </div>
          )}

          {/* Additional CMS content */}
          {unit.content && (
            <div className="mt-10">
              <BlockRenderer content={unit.content} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-24 space-y-6">
            <PricingCard unit={unit} />
            <InquiryForm
              propertyName={buildingName}
              propertyId={data.id}
              unitName={unit.name}
              unitId={unit.id}
              leaseTermOptions={unit.leaseTerm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---

function buildUnitStats(unit: ReturnType<typeof parseUnitData>): { label: string; value: string }[] {
  const stats: { label: string; value: string }[] = [];

  if (unit.bedrooms) stats.push({ label: 'Bedrooms', value: String(unit.bedrooms) });
  if (unit.bathrooms) stats.push({ label: 'Bathrooms', value: String(unit.bathrooms) });
  if (unit.squareFeet) stats.push({ label: 'Sq Ft', value: unit.squareFeet.toLocaleString() });

  if (unit.pricingModel === 'per-bed' && unit.totalBeds) {
    stats.push({ label: 'Total Beds', value: String(unit.totalBeds) });
    if (unit.availableBeds !== undefined) {
      stats.push({ label: 'Available Beds', value: String(unit.availableBeds) });
    }
  }

  return stats;
}

function buildUnitBadges(unit: ReturnType<typeof parseUnitData>): string[] {
  const badges: string[] = [];
  if (unit.furnished) badges.push('Furnished');
  if (unit.petsAllowed) badges.push('Pets OK');
  if (unit.parkingIncluded) badges.push('Parking Included');
  if (unit.utilitiesIncluded) badges.push('Utilities Included');
  const gender = genderLabel(unit.genderRestriction);
  if (gender) badges.push(gender);
  return badges;
}
