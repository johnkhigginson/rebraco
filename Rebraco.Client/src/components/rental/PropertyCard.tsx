import { Link } from 'react-router';
import type { PropertySummary } from '../../types/rental';
import { resolveMediaUrl } from '../../lib/utils';
import {
  formatRentWithPeriod,
  propertyTypeLabel,
  genderLabel,
  formatAddress,
} from '../../lib/rental';

interface PropertyCardProps {
  property: PropertySummary;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const imgSrc = resolveMediaUrl(property.featuredImage?.url);
  const gender = genderLabel(property.genderRestriction);
  const address = formatAddress(property);
  const amenityPreview = property.buildingAmenities.slice(0, 4);

  return (
    <Link
      to={property.path}
      className="group bg-bg rounded-xl border border-border overflow-hidden hover:shadow-lg transition flex flex-col"
    >
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-surface">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 22h20M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1" />
            </svg>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {property.byuApproved && (
            <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded">
              BYU-I Approved
            </span>
          )}
          {gender && (
            <span className="px-2 py-0.5 text-xs font-semibold bg-white/90 text-slate-700 rounded backdrop-blur-sm">
              {gender}
            </span>
          )}
        </div>

        {/* Property type badge */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 text-xs font-semibold bg-black/60 text-white rounded backdrop-blur-sm">
            {propertyTypeLabel(property.propertyType)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-heading group-hover:text-primary transition mb-1">
          {property.name}
        </h3>
        <p className="text-sm text-text-muted mb-3">{address}</p>

        {/* Pricing + availability row */}
        <div className="flex items-baseline justify-between mb-3">
          {property.startingRent ? (
            <div>
              <span className="text-sm text-text-muted">From </span>
              <span className="text-xl font-bold text-primary">
                {formatRentWithPeriod(property.startingRent, property.pricingPeriod)}
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-muted">Contact for pricing</span>
          )}
          <span className="text-sm font-medium text-text-muted">
            {property.availableUnits > 0 ? (
              <span className="text-green-600">{property.availableUnits} available</span>
            ) : (
              <span className="text-red-500">Waitlist</span>
            )}
          </span>
        </div>

        {/* Campus proximity */}
        {property.campusProximity && (
          <div className="flex items-center gap-1.5 text-sm text-text-muted mb-3">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {property.campusProximity}
          </div>
        )}

        {/* Amenity chips */}
        {amenityPreview.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border">
            {amenityPreview.map((a) => (
              <span key={a} className="px-2 py-0.5 text-xs bg-surface text-text-muted rounded">
                {a}
              </span>
            ))}
            {property.buildingAmenities.length > 4 && (
              <span className="px-2 py-0.5 text-xs bg-surface text-text-muted rounded">
                +{property.buildingAmenities.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
