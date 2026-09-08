import type { BlockContentProps, RichTextValue, MediaItem } from '../../types/blocks';
import { RichText } from '../../lib/richtext';
import { CmsImage } from '../../lib/media';

interface GridColumnItem {
  content: {
    properties: {
      content?: RichTextValue | null;
      image?: MediaItem[] | null;
    };
  };
}

interface GridLayoutData {
  columns?: string;
  items?: {
    items: GridColumnItem[];
  };
}

const GRID_COLS: Record<string, string> = {
  '2': 'grid-cols-1 md:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
};

export default function GridLayout({ data }: BlockContentProps<GridLayoutData>) {
  const columns = data.items?.items || [];
  if (columns.length === 0) return null;

  const gridClass = GRID_COLS[data.columns || '3'] || GRID_COLS['3'];

  return (
    <div className={`max-w-7xl mx-auto grid ${gridClass} gap-8`}>
      {columns.map((col, i) => (
        <div key={i}>
          <CmsImage
            media={col.content.properties.image}
            className="w-full rounded-[var(--border-radius,0.75rem)] mb-4 object-cover"
          />
          <RichText
            value={col.content.properties.content}
            className="prose prose-headings:text-heading prose-p:text-text-muted"
          />
        </div>
      ))}
    </div>
  );
}
