import { useState, useEffect, useCallback } from 'react';
import type { BlockContentProps, MediaItem } from '../../types/blocks';
import { resolveMediaUrl } from '../../lib/utils';

interface GalleryData {
  heading?: string;
  layout?: string;
  images?: MediaItem[] | null;
  columns?: string;
}

const COL_MAP: Record<string, string> = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '5': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

export default function Gallery({ data }: BlockContentProps<GalleryData>) {
  const images = data.images || [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const goNext = useCallback(() => {
    setLightboxIndex(prev => prev !== null && prev < images.length - 1 ? prev + 1 : prev);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev);
  }, []);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, goNext, goPrev, closeLightbox]);

  if (images.length === 0) return null;

  const colClass = COL_MAP[data.columns || '3'] || COL_MAP['3'];

  return (
    <div className="max-w-7xl mx-auto">
      {data.heading && (
        <h2 className="text-3xl font-bold text-heading mb-8">{data.heading}</h2>
      )}

      <div className={`grid ${colClass} gap-4`}>
        {images.map((img, i) => {
          const src = resolveMediaUrl(img.url);
          if (!src) return null;
          return (
            <button
              key={i}
              className="group overflow-hidden rounded-[var(--border-radius,0.75rem)] aspect-square bg-surface"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={src}
                alt={img.name || ''}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
              />
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="lightbox-backdrop fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {lightboxIndex < images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <img
            src={resolveMediaUrl(images[lightboxIndex].url) || ''}
            alt={images[lightboxIndex].name || ''}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
