import { Link } from 'react-router';
import type { ApiContentResponseModel } from '../api/umbraco';
import BlockRenderer from '../components/BlockRenderer';
import { resolveMediaUrl } from '../lib/utils';

interface BlogPostProps {
  data: ApiContentResponseModel;
}

export default function BlogPost({ data }: BlogPostProps) {
  const props = data.properties;
  const featuredImage = resolveMediaUrl(props?.featuredImage?.[0]?.url);
  const publishDate = props?.publishDate
    ? new Date(props.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const categories: string[] = props?.categories || [];

  return (
    <>
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link
          to=".."
          className="text-sm text-primary hover:underline mb-6 inline-block"
        >
          &larr; Back to blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {props?.title || data.name}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {publishDate && <time>{publishDate}</time>}
            {props?.author && (
              <>
                <span>&middot;</span>
                <span>By {props.author}</span>
              </>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Featured Image */}
        {featuredImage && (
          <div className="mb-10 overflow-hidden rounded-2xl">
            <img
              src={featuredImage}
              alt={props?.title || data.name}
              className="w-full object-cover max-h-[500px]"
            />
          </div>
        )}

        {/* Content */}
        {props?.mainContent ? (
          <BlockRenderer content={props.mainContent} />
        ) : (
          <div className="text-center text-slate-400 py-12">
            No content yet.
          </div>
        )}
      </article>
    </>
  );
}
