import { useState } from 'react';
import type { UnitFilters as Filters } from '../../types/rental';
import { SEMESTERS, GENDERS } from '../../types/rental';

interface UnitFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
}

export default function UnitFilters({ filters, onChange, resultCount }: UnitFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeCount = [
    filters.bedrooms !== null,
    filters.minRent !== null || filters.maxRent !== null,
    filters.furnished !== null,
    filters.petsAllowed !== null,
    filters.pricingModel !== null,
    filters.semester !== null,
    filters.gender !== null,
  ].filter(Boolean).length;

  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  function clearAll() {
    onChange({
      bedrooms: null,
      minRent: null,
      maxRent: null,
      furnished: null,
      petsAllowed: null,
      pricingModel: null,
      semester: null,
      gender: null,
    });
  }

  const bedroomOptions = [
    { value: null, label: 'Any' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4+' },
  ] as const;

  return (
    <div className="mb-6">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-heading">Available Units</h3>
          <span className="text-sm text-text-muted">
            {resultCount} {resultCount === 1 ? 'unit' : 'units'}
          </span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium text-text hover:bg-surface transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-xs rounded-full">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {open && (
        <div className="p-5 border border-border rounded-xl bg-surface mb-6 space-y-5">
          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Bedrooms</label>
            <div className="flex gap-1.5">
              {bedroomOptions.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => update({ bedrooms: opt.value })}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${
                    filters.bedrooms === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-bg text-text border-border hover:border-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Price Range</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.minRent ?? ''}
                onChange={(e) => update({ minRent: e.target.value ? Number(e.target.value) : null })}
                className="w-28 px-3 py-2 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary outline-none"
              />
              <span className="text-text-muted">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxRent ?? ''}
                onChange={(e) => update({ maxRent: e.target.value ? Number(e.target.value) : null })}
                className="w-28 px-3 py-2 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Row: toggles + dropdowns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Pricing model */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Pricing</label>
              <select
                value={filters.pricingModel || ''}
                onChange={(e) => update({ pricingModel: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text text-sm"
              >
                <option value="">Any</option>
                <option value="whole-unit">Whole Unit</option>
                <option value="per-bed">Per Bed</option>
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Semester</label>
              <select
                value={filters.semester || ''}
                onChange={(e) => update({ semester: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text text-sm"
              >
                <option value="">Any</option>
                {SEMESTERS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Gender</label>
              <select
                value={filters.gender || ''}
                onChange={(e) => update({ gender: e.target.value || null })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-bg text-text text-sm"
              >
                <option value="">Any</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text mb-2">Options</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.furnished === true}
                  onChange={(e) => update({ furnished: e.target.checked ? true : null })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">Furnished</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.petsAllowed === true}
                  onChange={(e) => update({ petsAllowed: e.target.checked ? true : null })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-text">Pets Allowed</span>
              </label>
            </div>
          </div>

          {/* Clear all */}
          {activeCount > 0 && (
            <div className="pt-2 border-t border-border">
              <button onClick={clearAll} className="text-sm text-primary hover:underline">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
