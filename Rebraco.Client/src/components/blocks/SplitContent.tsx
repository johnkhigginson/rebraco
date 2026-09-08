import React from 'react';
import { resolveMediaUrl } from '../../lib/utils';
import { sanitizeHtml } from '../../lib/sanitize';

export interface SplitContentProps {
  data: {
    text?: {
      markup: string;
    };
    image?: Array<{ url: string; name: string }>;
  };
}

const SplitContent: React.FC<SplitContentProps> = ({ data }) => {
  const imageUrl = resolveMediaUrl(data.image?.[0]?.url);
  const htmlContent = data.text?.markup || '';

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
      {/* IMAGE SIDE */}
      <div className="w-full md:w-1/2">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={data.image?.[0]?.name || 'Section Image'}
            className="rounded-[var(--border-radius,0.75rem)] shadow-2xl w-full object-cover aspect-[4/3] hover:scale-[1.02] transition duration-500"
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-surface rounded-[var(--border-radius,0.75rem)] flex items-center justify-center text-text-muted">
            No Image Selected
          </div>
        )}
      </div>

      {/* TEXT SIDE */}
      <div className="w-full md:w-1/2">
        <div
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-heading prose-p:text-text-muted"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
        />
      </div>
    </div>
  );
};

export default SplitContent;
