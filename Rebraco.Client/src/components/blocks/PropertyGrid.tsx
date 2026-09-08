import { useEffect, useState } from 'react';
import type { PublicPropertySummary } from '../../lib/publicApi';
import { fetchProperties } from '../../lib/publicApi';
import PublicPropertyCard from '../rental/PublicPropertyCard';
import { PROPERTY_TYPES, GENDERS } from '../../types/rental';
import type { BlockContentProps, RichTextValue } from '../../types/blocks';
import { sanitizeHtml } from '../../lib/sanitize';

interface PropertyGridData {
  heading?: string;
  description?: RichTextValue;
  maxItems?: number;
  showFilters?: boolean;
  propertyType?: string;   // optional pre-filter from Umbraco dropdown
  layout?: string;         // '2' | '3' | '4'
}

const COLS_MAP: Record<string, string> = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 lg:grid-cols-4',
};

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'price-asc', label: 'Price (Low-High)' },
  { value: 'price-desc', label: 'Price (High-Low)' },
  { value: 'newest', label: 'Newest' },
];

export default function PropertyGrid({ data }: BlockContentProps<PropertyGridData>) {
  const [properties, setProperties] = useState<PublicPropertySummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(data.propertyType || '');
  const [genderFilter, setGenderFilter] = useState('');
  const [sort, setSort] = useState('name');

  const maxItems = data.maxItems || 100;
  const showFilters = data.showFilters ?? true;
  const gridCols = COLS_MAP[data.layout || '3'] || COLS_MAP['3'];

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchProperties({
      type: typeFilter || undefined,
      gender: genderFilter || undefined,
      search: search.trim() || undefined,
      sort,
      take: maxItems,
    })
      .then((res) => {
        setProperties(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        console.error('PropertyGrid fetch error:', err);
        setError('Unable to load properties.');
      })
      .finally(() => setLoading(false));
  }, [typeFilter, genderFilter, search, sort, maxItems]);

  // Skeleton loading state
  const skeletonCount = Math.min(maxItems, 6);

  return (
    <div className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(data.heading || data.description) && (
          <div className="text-center mb-10 max-w-3xl mx-auto">
            {data.heading && (
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-3">
                {data.heading}
              </h2>
            )}
            {data.description?.markup && (
              <div
                className="text-text-muted prose prose-lg mx-auto"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.description.markup) }}
              />
            )}
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 mb-8">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>

            {/* Type filter — only show if no pre-filter set */}
            {!data.propertyType && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2.5 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              >
                <option value="">All Types</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            )}

            {/* Gender filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="px-4 py-2.5 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            >
              <option value="">Any Gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
                <div className="h-56 bg-border/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-border/50 rounded w-3/4" />
                  <div className="h-4 bg-border/50 rounded w-1/2" />
                  <div className="h-4 bg-border/50 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-12 text-red-500">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && properties.length > 0 && (
          <>
            {showFilters && (
              <p className="text-sm text-text-muted mb-4">
                Showing {properties.length} of {total} {total === 1 ? 'property' : 'properties'}
              </p>
            )}
            <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
              {properties.map((p) => (
                <PublicPropertyCard key={p.id} property={p} />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && properties.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 22h20M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
            </svg>
            <p className="text-lg font-medium text-heading mb-1">No properties found</p>
            <p className="text-text-muted">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
