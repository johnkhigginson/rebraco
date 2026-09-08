import { useState, useEffect } from 'react';
import { useLoaderData, redirect } from 'react-router';
import type { Route } from './+types/PublicPropertyListing';
import {
  fetchProperties,
  fetchPublicSettings,
  type PublicPropertySummary,
  type PublicPropertyListResponse,
  type PublicPagesSettings,
} from '../lib/publicApi';
import PublicPropertyCard from '../components/rental/PublicPropertyCard';
import { PROPERTY_TYPES, GENDERS } from '../types/rental';

// --- Loader (SSR) ---

export async function loader({ context, request }: Route.LoaderArgs) {
  const base = context.CMS_BASE_URL;
  const [data, settings] = await Promise.all([
    fetchProperties({ take: 24, sort: 'name' }, base),
    fetchPublicSettings(base),
  ]);

  // Auto-redirect to detail page if only one property exists
  if (data.total === 1 && data.items.length === 1) {
    const url = new URL(request.url);
    const slugPrefix = url.pathname.split('/').filter(Boolean)[0] || settings.publicPagesSlug;
    throw redirect(`/${slugPrefix}/${data.items[0].slug}`);
  }

  return { ...data, settings };
}

// --- Meta ---

export function meta({ data, matches }: Route.MetaArgs) {
  const rootData = matches.find((m: any) => m.id === 'root')?.data as
    | { siteName: string }
    | undefined;
  const siteName = rootData?.siteName || 'Rebraco';
  const label = data?.settings?.publicPagesLabel || 'Properties';

  return [
    { title: `Browse ${label} | ${siteName}` },
    { name: 'description', content: `Browse available ${label.toLowerCase()} near campus. Filter by type, gender, and price.` },
  ];
}

// --- Sort options ---

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'price-asc', label: 'Price (Low-High)' },
  { value: 'price-desc', label: 'Price (High-Low)' },
  { value: 'newest', label: 'Newest' },
];

// --- Component ---

export default function PublicPropertyListing() {
  const initialData = useLoaderData<PublicPropertyListResponse & { settings: PublicPagesSettings }>();
  const [properties, setProperties] = useState<PublicPropertySummary[]>(initialData.items);
  const [total, setTotal] = useState(initialData.total);
  const [loading, setLoading] = useState(false);
  const label = initialData.settings?.publicPagesLabel || 'Properties';

  // Filter state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [sort, setSort] = useState('name');

  // Re-fetch when filters change (client-side)
  useEffect(() => {
    setLoading(true);
    fetchProperties({
      type: typeFilter || undefined,
      gender: genderFilter || undefined,
      search: search.trim() || undefined,
      sort,
      take: 100,
    })
      .then((res) => {
        setProperties(res.items);
        setTotal(res.total);
      })
      .catch((err) => console.error('Property fetch error:', err))
      .finally(() => setLoading(false));
  }, [typeFilter, genderFilter, search, sort]);

  return (
    <div className="py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-heading mb-3">Browse {label}</h1>
          <p className="text-lg text-text-muted">
            Find the perfect student housing near campus.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, address, amenities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-bg text-text text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
            />
          </div>

          {/* Type filter */}
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

        {/* Results count */}
        <p className="text-sm text-text-muted mb-4">
          {loading ? 'Loading...' : `${total} ${total === 1 ? label.replace(/s$/i, '') : label.toLowerCase()} found`}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => (
              <PublicPropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="w-16 h-16 mx-auto text-text-muted/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 22h20M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
            </svg>
            <p className="text-lg font-medium text-heading mb-1">No {label.toLowerCase()} found</p>
            <p className="text-text-muted">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Error Boundary ---

export function ErrorBoundary() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-4xl font-bold text-red-500">Error</h1>
      <p className="text-slate-500 mt-4">Unable to load listings. Please try again later.</p>
    </div>
  );
}
