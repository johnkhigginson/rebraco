import { useState, useCallback } from 'react';
import type { MediaItem } from '../../types/blocks';
import { resolveMediaUrl } from '../../lib/utils';

interface StatItem {
  label: string;
  value: string;
}

interface PropertyHeroProps {
  images: MediaItem[];
  name: string;
  address: string;
  stats: StatItem[];
  badges: string[];
  priceBadge?: string;
}

export default function PropertyHero({ images, name, address, stats, badges, priceBadge }: PropertyHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const resolvedImages = images
    .map((img) => ({ ...img, resolved: resolveMediaUrl(img.url) }))
    .filter((img) => img.resolved);

  const activeImage = resolvedImages[activeIndex];

  const goTo = useCallback((index: number) => {
    setActiveIndex(Math.max(0, Math.min(index, resolvedImages.length - 1)));
  }, [resolvedImages.length]);

  return (
    <>
      <div className="mb-8">
        {/* Image gallery */}
        {resolvedImages.length > 0 && (
          <div className="mb-6">
            {/* Main image */}
            <div
              className="relative rounded-xl overflow-hidden bg-surface cursor-pointer group"
              onClick={() => setLightbox(true)}
            >
              <img
                src={activeImage?.resolved || ''}
                alt={`${name} - Photo ${activeIndex + 1}`}
                className="w-full h-[400px] lg:h-[500px] object-cover group-hover:scale-[1.02] transition duration-500"
              />

              {/* Photo count */}
              <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg backdrop-blur-sm">
                {activeIndex + 1} / {resolvedImages.length}
              </div>

              {/* Nav arrows */}
              {resolvedImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition ${activeIndex === 0 ? 'opacity-30 pointer-events-none' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition ${activeIndex === resolvedImages.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {resolvedImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {resolvedImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition ${
                      i === activeIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.resolved!}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info section */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-heading mb-2">{name}</h1>
            <p className="text-lg text-text-muted flex items-center gap-1.5">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {address}
            </p>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {badges.map((badge) => (
                  <span key={badge} className="px-3 py-1 text-sm font-medium bg-surface text-text border border-border rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Price badge */}
          {priceBadge && (
            <div className="shrink-0 px-5 py-3 bg-primary text-white rounded-xl text-center">
              <div className="text-sm font-medium opacity-90">Starting at</div>
              <div className="text-2xl font-bold">{priceBadge}</div>
            </div>
          )}
        </div>

        {/* Stats bar */}
        {stats.length > 0 && (
          <div className="flex flex-wrap gap-6 mt-5 pt-5 border-t border-border">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-heading">{stat.value}</div>
                <div className="text-sm text-text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && resolvedImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition"
            onClick={() => setLightbox(false)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <img
            src={resolvedImages[activeIndex]?.resolved || ''}
            alt={`${name} - Photo ${activeIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {resolvedImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition ${activeIndex === 0 ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
                className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition ${activeIndex === resolvedImages.length - 1 ? 'opacity-30 pointer-events-none' : ''}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg">
            {activeIndex + 1} / {resolvedImages.length}
          </div>
        </div>
      )}
    </>
  );
}
