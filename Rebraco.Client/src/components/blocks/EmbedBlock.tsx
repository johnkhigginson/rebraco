import type { BlockContentProps } from '../../types/blocks';
import { sanitizeHtml } from '../../lib/sanitize';

interface EmbedBlockData {
  embedCode?: string;
  caption?: string;
}

export default function EmbedBlock({ data }: BlockContentProps<EmbedBlockData>) {
  if (!data.embedCode) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div
        className="embed-responsive"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.embedCode) }}
      />
      {data.caption && (
        <p className="text-sm text-text-muted mt-4 text-center">{data.caption}</p>
      )}
    </div>
  );
}
