import React from 'react';
import { resolveMediaUrl } from '../../lib/utils';

export interface PodsProps {
  data: {
    headline?: string;
    secondaryHeading?: string;
    items: {
      contentData: Array<{
        contentTypeKey: string;
        udt: string;
        heading: string;
        text: string;
        image: Array<{ url: string }>;
        link: Array<{ url: string; title: string }>;
      }>;
    };
  };
}

const Pods: React.FC<PodsProps> = ({ data }) => {
  const pods = data.items?.contentData || [];
  if (pods.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* HEADER Section */}
      {(data.headline || data.secondaryHeading) && (
        <div className="text-center mb-16 max-w-3xl mx-auto">
          {data.headline && (
            <h2 className="text-3xl md:text-4xl font-bold text-heading mb-4">
              {data.headline}
            </h2>
          )}
          {data.secondaryHeading && (
            <p className="text-xl text-text-muted">
              {data.secondaryHeading}
            </p>
          )}
        </div>
      )}

      {/* THE PODS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pods.map((pod, index) => {
          const imgUrl = resolveMediaUrl(pod.image?.[0]?.url);
          const linkUrl = pod.link?.[0]?.url;
          const Wrapper = linkUrl ? 'a' : 'div';
          const wrapperProps = linkUrl
            ? { href: linkUrl, className: 'group block h-full' }
            : { className: 'h-full' };

          return (
            <Wrapper key={index} {...wrapperProps}>
              <div className="card h-full overflow-hidden flex flex-col !p-0">
                {/* Image Area */}
                <div className="h-56 overflow-hidden bg-surface relative">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={pod.heading}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-text-muted">
                      No Image
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-8 flex-grow flex flex-col">
                  <h3 className="text-xl font-bold text-heading mb-3 group-hover:text-link transition">
                    {pod.heading}
                  </h3>
                  <p className="text-text-muted leading-relaxed flex-grow">
                    {pod.text}
                  </p>

                  {linkUrl && (
                    <span className="mt-6 inline-block text-link font-bold group-hover:underline">
                      Read More &rarr;
                    </span>
                  )}
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
};

export default Pods;
