import { useState } from 'react';
import type { PropertyFilters as Filters } from '../../types/rental';
import { PROPERTY_TYPES } from '../../types/rental';

interface PropertyFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  resultCount: number;
}

export default function PropertyFilters({ filters, onChange, resultCount }: PropertyFiltersProps) {
  const [open, setOpen] = useState(false);

  const hasActiveFilters = filters.search || filters.propertyType;

  function update(patch: Partial<Filters>) {
    onChange({ ...filters, ...patch });
  }

  function clearAll() {
    onChange({ search: '', propertyType: null });
  }

  return (
    <div className="mb-8">
      {/* Desktop filters */}
      <div className="hidden md:flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
          />
        </div>

        {/* Property type */}
        <select
          value={filters.propertyType || ''}
          onChange={(e) => update({ propertyType: e.target.value || null })}
          className="px-4 py-2.5 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary outline-none transition"
        >
          <option value="">All Types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {/* Result count + clear */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-sm text-text-muted">
            {resultCount} {resultCount === 1 ? 'property' : 'properties'}
          </span>
          {hasActiveFilters && (
            <button onClick={clearAll} className="text-sm text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Mobile filters */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-bg text-text focus:ring-2 focus:ring-primary outline-none transition"
            />
          </div>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-text hover:bg-surface transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 flex items-center justify-center bg-primary text-white text-xs rounded-full">
                1
              </span>
            )}
          </button>
        </div>

        {open && (
          <div className="p-4 border border-border rounded-lg bg-surface mb-3 space-y-3">
            <select
              value={filters.propertyType || ''}
              onChange={(e) => update({ propertyType: e.target.value || null })}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg text-text"
            >
              <option value="">All Types</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button onClick={clearAll} className="text-sm text-primary hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}

        <p className="text-sm text-text-muted">
          {resultCount} {resultCount === 1 ? 'property' : 'properties'}
        </p>
      </div>
    </div>
  );
}
