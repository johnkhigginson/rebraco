import type { UnitData } from '../../types/rental';
import { LEASE_TERMS } from '../../types/rental';
import { formatRent, formatRentWithPeriod, formatAvailableDate, isAvailableSoon } from '../../lib/rental';

interface PricingCardProps {
  unit: UnitData;
}

export default function PricingCard({ unit }: PricingCardProps) {
  const availability = formatAvailableDate(unit.availableDate);
  const soon = isAvailableSoon(unit.availableDate);

  const moveInCost = unit.rent + (unit.deposit || 0);

  return (
    <div className="card">
      {/* Main price */}
      <div className="mb-5">
        {unit.pricingModel === 'per-bed' ? (
          <>
            <div className="text-3xl font-bold text-primary">
              {formatRentWithPeriod(unit.bedPrice || unit.rent, unit.pricingPeriod)}
            </div>
            <div className="text-sm text-text-muted mt-1">per bed</div>
            {unit.availableBeds !== undefined && unit.totalBeds !== undefined && (
              <div className="mt-2">
                <span className={`text-sm font-medium ${unit.availableBeds > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {unit.availableBeds > 0
                    ? `${unit.availableBeds} of ${unit.totalBeds} beds available`
                    : 'No beds available'
                  }
                </span>
              </div>
            )}
            <div className="text-sm text-text-muted mt-1">
              Full unit: {formatRentWithPeriod(unit.rent, unit.pricingPeriod)}
            </div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-primary">
              {formatRentWithPeriod(unit.rent, unit.pricingPeriod)}
            </div>
          </>
        )}
      </div>

      {/* Details */}
      <div className="space-y-3 py-4 border-t border-border">
        {/* Deposit */}
        {unit.deposit !== undefined && unit.deposit > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Security Deposit</span>
            <span className="font-medium text-text">{formatRent(unit.deposit)}</span>
          </div>
        )}

        {/* Availability */}
        {availability && (
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Availability</span>
            <span className={`font-medium ${soon ? 'text-green-600' : 'text-text'}`}>
              {availability}
            </span>
          </div>
        )}

        {/* Utilities */}
        {unit.utilitiesIncluded && (
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Utilities</span>
            <span className="font-medium text-green-600">Included</span>
          </div>
        )}
      </div>

      {/* Lease terms */}
      {unit.leaseTerm.length > 0 && (
        <div className="py-4 border-t border-border">
          <div className="text-sm text-text-muted mb-2">Lease Terms</div>
          <div className="flex flex-wrap gap-1.5">
            {unit.leaseTerm.map((term) => {
              const label = LEASE_TERMS.find(t => t.value === term)?.label || term;
              return (
                <span key={term} className="px-2.5 py-1 text-xs font-medium bg-surface text-text rounded-full border border-border">
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Semesters */}
      {unit.semesterAvailability.length > 0 && (
        <div className="py-4 border-t border-border">
          <div className="text-sm text-text-muted mb-2">Semesters</div>
          <div className="flex flex-wrap gap-1.5">
            {unit.semesterAvailability.map((s) => (
              <span key={s} className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full capitalize">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Move-in cost summary */}
      {unit.pricingModel !== 'per-bed' && unit.deposit !== undefined && unit.deposit > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="text-sm text-text-muted mb-2">Estimated Move-In Cost</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">First {unit.pricingPeriod === 'semester' ? 'semester' : 'month'}</span>
              <span className="text-text">{formatRent(unit.rent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Deposit</span>
              <span className="text-text">{formatRent(unit.deposit)}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-border font-bold">
              <span className="text-heading">Total</span>
              <span className="text-heading">{formatRent(moveInCost)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
