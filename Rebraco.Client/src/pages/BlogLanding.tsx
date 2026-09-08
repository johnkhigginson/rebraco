import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ContentService, type ApiContentResponseModel } from '../api/umbraco';
import { resolveMediaUrl } from '../lib/utils';

interface BlogLandingProps {
  data: ApiContentResponseModel;
}

export default function BlogLanding({ data }: BlogLandingProps) {
  const props = data.properties;
  const postsPerPage = props?.postsPerPage || 10;
  const [posts, setPosts] = useState<ApiContentResponseModel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ContentService.getContent20(
      `children:${data.route.path}`,
      ['contentType:blogPost'],
      ['updateDate:desc'],
      page * postsPerPage,
      postsPerPage,
    )
      .then(res => {
        setPosts(res.items || []);
        setTotal(res.total || 0);
      })
      .catch(err => console.error('Blog listing fetch error:', err))
      .finally(() => setLoading(false));
  }, [data.route.path, page, postsPerPage]);

  const totalPages = Math.ceil(total / postsPerPage);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {props?.heading && (
          <h1 className="text-4xl font-bold text-slate-900 mb-10">{props.heading}</h1>
        )}

        {loading ? (
          <div className="text-center text-slate-400 animate-pulse py-20">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-slate-400 py-20">No blog posts yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      i === page
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    onClick={() => setPage(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function BlogCard({ post }: { post: ApiContentResponseModel }) {
  const props = post.properties;
  const featuredImage = resolveMediaUrl(props?.featuredImage?.[0]?.url);
  const excerpt = props?.excerpt || '';
  const publishDate = props?.publishDate
    ? new Date(props.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <Link
      to={post.route.path}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition"
    >
      {featuredImage && (
        <div className="h-52 overflow-hidden bg-slate-100">
          <img
            src={featuredImage}
            alt={props?.title || post.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-6">
        {(publishDate || props?.author) && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            {publishDate && <span>{publishDate}</span>}
            {publishDate && props?.author && <span>&middot;</span>}
            {props?.author && <span>{props.author}</span>}
          </div>
        )}
        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition mb-2">
          {props?.title || post.name}
        </h3>
        {excerpt && (
          <p className="text-slate-600 text-sm line-clamp-3">{excerpt}</p>
        )}
      </div>
    </Link>
  );
}
