import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ContentService, type ApiContentResponseModel } from '../../api/umbraco';
import type { BlockContentProps } from '../../types/blocks';
import { resolveMediaUrl } from '../../lib/utils';

interface SubpageListingData {
  heading?: string;
  sourceNode?: { route?: { path: string } } | null;
  layout?: string;
  maxItems?: number;
  sortOrder?: string;
}

const SORT_MAP: Record<string, string> = {
  'date-desc': 'updateDate:desc',
  'date-asc': 'updateDate:asc',
  'name-asc': 'name:asc',
};

export default function SubpageListing({ data }: BlockContentProps<SubpageListingData>) {
  const [pages, setPages] = useState<ApiContentResponseModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sourcePath = data.sourceNode?.route?.path;
    if (!sourcePath) {
      setLoading(false);
      return;
    }

    const sort = SORT_MAP[data.sortOrder || ''] ? [SORT_MAP[data.sortOrder!]] : undefined;

    ContentService.getContent20(
      `children:${sourcePath}`,
      undefined,
      sort,
      0,
      data.maxItems || 6,
    )
      .then(res => setPages(res.items || []))
      .catch(err => console.error('SubpageListing fetch error:', err))
      .finally(() => setLoading(false));
  }, [data.sourceNode, data.maxItems, data.sortOrder]);

  if (loading) {
    return (
      <div className="text-center text-text-muted animate-pulse">
        Loading...
      </div>
    );
  }

  if (pages.length === 0) return null;

  const layout = data.layout || 'cards';

  return (
    <div className="max-w-7xl mx-auto">
        {data.heading && (
          <h2 className="text-3xl font-bold text-heading mb-8">{data.heading}</h2>
        )}

        {layout === 'list' ? (
          <div className="divide-y divide-border">
            {pages.map(page => (
              <Link
                key={page.id}
                to={page.route.path}
                className="block py-4 hover:bg-surface transition -mx-4 px-4 rounded-lg"
              >
                <h3 className="font-semibold text-heading">{page.name}</h3>
                <p className="text-sm text-text-muted mt-1">{page.route.path}</p>
              </Link>
            ))}
          </div>
        ) : layout === 'tiles' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pages.map(page => (
              <Link
                key={page.id}
                to={page.route.path}
                className="card !p-6 hover:border-primary transition text-center group"
              >
                <h3 className="font-semibold text-heading group-hover:text-primary transition">
                  {page.name}
                </h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map(page => {
              const featuredImage = resolveMediaUrl(page.properties?.featuredImage?.[0]?.url);
              return (
                <Link
                  key={page.id}
                  to={page.route.path}
                  className="group card !p-0 overflow-hidden"
                >
                  {featuredImage && (
                    <div className="h-48 overflow-hidden bg-surface">
                      <img
                        src={featuredImage}
                        alt={page.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="font-semibold text-heading group-hover:text-primary transition">
                      {page.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
    </div>
  );
}
