import { Link } from 'react-router';
import type { UnitSummary } from '../../types/rental';
import { resolveMediaUrl } from '../../lib/utils';
import {
  formatRentWithPeriod,
  formatAvailableDate,
  isAvailableSoon,
  genderLabel,
} from '../../lib/rental';

interface UnitCardProps {
  unit: UnitSummary;
}

export default function UnitCard({ unit }: UnitCardProps) {
  const imgSrc = resolveMediaUrl(unit.featuredImage?.url);
  const gender = genderLabel(unit.genderRestriction);
  const availability = formatAvailableDate(unit.availableDate);
  const availableSoon = isAvailableSoon(unit.availableDate);

  return (
    <Link
      to={unit.path}
      className="group bg-bg rounded-xl border border-border overflow-hidden hover:shadow-lg transition flex flex-col"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-surface">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={unit.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-text-muted">
            <svg className="w-10 h-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        )}

        {/* Availability badge */}
        {availability && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
              availableSoon
                ? 'bg-green-500 text-white'
                : 'bg-white/90 text-slate-700 backdrop-blur-sm'
            }`}>
              {availability}
            </span>
          </div>
        )}

        {/* Gender badge */}
        {gender && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-0.5 text-xs font-semibold bg-white/90 text-slate-700 rounded backdrop-blur-sm">
              {gender}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Unit name */}
        <h3 className="text-base font-bold text-heading group-hover:text-primary transition mb-1">
          {unit.name}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-sm text-text-muted mb-3">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            {unit.bedrooms} bed
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4" />
            </svg>
            {unit.bathrooms} bath
          </span>
          {unit.squareFeet && (
            <span>{unit.squareFeet.toLocaleString()} sqft</span>
          )}
        </div>

        {/* Pricing */}
        <div className="mb-3">
          {unit.pricingModel === 'per-bed' ? (
            <div>
              <span className="text-lg font-bold text-primary">
                {formatRentWithPeriod(unit.bedPrice || unit.rent, unit.pricingPeriod)}
              </span>
              <span className="text-sm text-text-muted"> /bed</span>
              {unit.availableBeds !== undefined && unit.totalBeds !== undefined && (
                <div className="text-sm text-text-muted mt-0.5">
                  <span className={unit.availableBeds > 0 ? 'text-green-600 font-medium' : 'text-red-500'}>
                    {unit.availableBeds} of {unit.totalBeds} beds available
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-lg font-bold text-primary">
              {formatRentWithPeriod(unit.rent, unit.pricingPeriod)}
            </span>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {unit.furnished && (
            <span className="px-2 py-0.5 text-xs bg-surface text-text-muted rounded">Furnished</span>
          )}
          {unit.petsAllowed && (
            <span className="px-2 py-0.5 text-xs bg-surface text-text-muted rounded">Pets OK</span>
          )}
          {unit.utilitiesIncluded && (
            <span className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded">Utilities Included</span>
          )}
          {unit.semesterAvailability.length > 0 && (
            unit.semesterAvailability.map((s) => (
              <span key={s} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded capitalize">
                {s}
              </span>
            ))
          )}
        </div>
      </div>
    </Link>
  );
}
