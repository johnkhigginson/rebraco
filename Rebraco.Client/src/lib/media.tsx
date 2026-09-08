import type { MediaItem } from '../types/blocks';
import { resolveMediaUrl } from './utils';

interface CmsImageProps {
  media?: MediaItem[] | null;
  className?: string;
  alt?: string;
  sizes?: string;
}

/** CMS-aware image component with focal point support */
export function CmsImage({ media, className, alt, sizes }: CmsImageProps) {
  const item = media?.[0];
  if (!item) return null;

  const src = resolveMediaUrl(item.url);
  if (!src) return null;

  const objectPosition = item.focalPoint
    ? `${item.focalPoint.left * 100}% ${item.focalPoint.top * 100}%`
    : undefined;

  return (
    <img
      src={src}
      alt={alt || item.name || ''}
      className={className}
      style={objectPosition ? { objectPosition } : undefined}
      loading="lazy"
      sizes={sizes}
    />
  );
}
