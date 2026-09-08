import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ContentService } from '../../api/umbraco';
import type { PropertySummary } from '../../types/rental';
import { parsePropertySummary } from '../../lib/rental';
import PropertyCard from '../rental/PropertyCard';
import PublicPropertyCard from '../rental/PublicPropertyCard';
import { fetchProperties, type PublicPropertySummary } from '../../lib/publicApi';
import type { BlockContentProps, LinkItem } from '../../types/blocks';

interface FeaturedPropertiesData {
  heading?: string;
  secondaryHeading?: string;
  /** Content picker IDs — if empty, fetches latest properties */
  selectedProperties?: Array<{ id: string; route: { path: string } }>;
  /** Path to property listing page for "View All" link */
  viewAllLink?: LinkItem;
  maxItems?: number;
  /** Path to fetch children from (e.g. /properties) */
  sourcePath?: string;
  /** When true, fetch from EF Core public API instead of Umbraco content tree */
  useDatabase?: boolean;
}

export default function FeaturedProperties({ data }: BlockContentProps<FeaturedPropertiesData>) {
  const [umbracoProps, setUmbracoProps] = useState<PropertySummary[]>([]);
  const [dbProps, setDbProps] = useState<PublicPropertySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const maxItems = data.maxItems || 3;
  const sourcePath = data.sourcePath || '/properties';
  const useDb = data.useDatabase === true;

  useEffect(() => {
    setLoading(true);

    if (useDb) {
      // Fetch from EF Core public API
      fetchProperties({ take: maxItems, sort: 'newest' })
        .then((res) => setDbProps(res.items))
        .catch((err) => console.error('Featured properties (DB) fetch error:', err))
        .finally(() => setLoading(false));
    } else {
      // Fetch from Umbraco content tree (original behavior)
      ContentService.getContent20(
        `children:${sourcePath}`,
        ['contentType:property'],
        ['updateDate:desc'],
        0,
        maxItems,
      )
        .then((res) => {
          const parsed = (res.items || []).map(parsePropertySummary);
          setUmbracoProps(parsed);
        })
        .catch((err) => console.error('Featured properties fetch error:', err))
        .finally(() => setLoading(false));
    }
  }, [sourcePath, maxItems, useDb]);

  if (loading) {
    return (
      <div className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden animate-pulse">
                <div className="h-56 bg-border/50" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-border/50 rounded w-3/4" />
                  <div className="h-4 bg-border/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasItems = useDb ? dbProps.length > 0 : umbracoProps.length > 0;
  if (!hasItems) return null;

  return (
    <div className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(data.heading || data.secondaryHeading) && (
          <div className="text-center mb-12 max-w-3xl mx-auto">
            {data.heading && (
              <h2 className="text-3xl md:text-4xl font-bold text-heading mb-3">
                {data.heading}
              </h2>
            )}
            {data.secondaryHeading && (
              <p className="text-lg text-text-muted">{data.secondaryHeading}</p>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {useDb
            ? dbProps.map((p) => <PublicPropertyCard key={p.id} property={p} />)
            : umbracoProps.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>

        {/* View All CTA */}
        {data.viewAllLink?.url && (
          <div className="text-center mt-10">
            <Link
              to={data.viewAllLink.url}
              className="btn btn-secondary"
            >
              {data.viewAllLink.name || 'View All Properties'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
