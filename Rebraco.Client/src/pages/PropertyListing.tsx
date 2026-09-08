import { useEffect, useState, useMemo } from 'react';
import type { ApiContentResponseModel } from '../api/umbraco';
import { ContentService } from '../api/umbraco';
import type { PropertySummary, PropertyFilters as Filters } from '../types/rental';
import { DEFAULT_PROPERTY_FILTERS } from '../types/rental';
import { parsePropertySummary, matchesPropertyFilters } from '../lib/rental';
import PropertyCard from '../components/rental/PropertyCard';
import PropertyFilters from '../components/rental/PropertyFilters';
import { RichText } from '../lib/richtext';

interface PropertyListingProps {
  data: ApiContentResponseModel;
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'available';

export default function PropertyListing({ data }: PropertyListingProps) {
  const props = data.properties;
  const perPage = props?.propertiesPerPage || 24;

  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_PROPERTY_FILTERS);
  const [sort, setSort] = useState<SortOption>('newest');

  useEffect(() => {
    setLoading(true);
    ContentService.getContent20(
      `children:${data.route.path}`,
      ['contentType:property'],
      ['updateDate:desc'],
      0,
      100,
    )
      .then((res) => {
        const parsed = (res.items || []).map(parsePropertySummary);
        setProperties(parsed);
      })
      .catch((err) => console.error('Property listing fetch error:', err))
      .finally(() => setLoading(false));
  }, [data.route.path]);

  const filtered = useMemo(() => {
    let result = properties.filter((p) => matchesPropertyFilters(p, filters));

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return (a.startingRent || Infinity) - (b.startingRent || Infinity);
        case 'price-desc':
          return (b.startingRent || 0) - (a.startingRent || 0);
        case 'available':
          return b.availableUnits - a.availableUnits;
        default:
          return 0; // newest = API order
      }
    });

    return result;
  }, [properties, filters, sort]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      {props?.heading && (
        <h1 className="text-4xl font-bold text-heading mb-4">{props.heading}</h1>
      )}
      {props?.description && (
        <RichText value={props.description} className="prose prose-lg text-text-muted mb-8 max-w-3xl" />
      )}

      {/* Filters */}
      <PropertyFilters
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
      />

      {/* Sort */}
      <div className="flex items-center justify-end mb-6">
        <label className="text-sm text-text-muted mr-2">Sort by:</label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-1.5 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="available">Most Available</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
              <div className="h-56 bg-border/50" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-border/50 rounded w-3/4" />
                <div className="h-4 bg-border/50 rounded w-1/2" />
                <div className="h-6 bg-border/50 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 text-text-muted/30 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-lg text-text-muted mb-2">No properties found</p>
          <p className="text-sm text-text-muted">Try adjusting your filters or check back later.</p>
          {(filters.search || filters.propertyType) && (
            <button
              onClick={() => setFilters(DEFAULT_PROPERTY_FILTERS)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.slice(0, perPage).map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}

      {/* Pagination hint */}
      {!loading && filtered.length > perPage && (
        <p className="text-center text-sm text-text-muted mt-8">
          Showing {perPage} of {filtered.length} properties
        </p>
      )}
    </div>
  );
}
