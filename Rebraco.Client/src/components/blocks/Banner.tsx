import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { resolveMediaUrl } from '../../lib/utils';
import { sanitizeHtml } from '../../lib/sanitize';
import { useSite } from '../../contexts/SiteContext';
import type { BannerItemData, BannerSettingsData } from '../../types/blocks';

// --- Props ---

export interface BannerProps {
  data: {
    slides?: {
      contentData: BannerItemData[];
    };
  };
  settings?: BannerSettingsData;
}

// --- Style Maps ---

const BANNER_STYLE_HEIGHT: Record<string, string> = {
  takeover: 'min-h-screen',
  medium: 'min-h-[60vh]',
  short: 'min-h-[40vh]',
  scale: '',
};

const TEXT_POSITION_CLASSES: Record<string, string> = {
  'top-left': 'items-start justify-start',
  'top-center': 'items-start justify-center',
  'top-right': 'items-start justify-end',
  'center-left': 'items-center justify-start',
  'center': 'items-center justify-center',
  'center-right': 'items-center justify-end',
  'bottom-left': 'items-end justify-start',
  'bottom-center': 'items-end justify-center',
  'bottom-right': 'items-end justify-end',
};

const TEXT_ALIGNMENT_CLASSES: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

const HEADING_SIZE_CLASSES: Record<string, string> = {
  S: 'text-2xl md:text-3xl',
  M: 'text-3xl md:text-4xl',
  L: 'text-4xl md:text-5xl lg:text-6xl',
};

const SECONDARY_SIZE_CLASSES: Record<string, string> = {
  S: 'text-base md:text-lg',
  M: 'text-lg md:text-xl',
  L: 'text-xl md:text-2xl',
};

// --- Helpers ---

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// --- Slide Component ---

function BannerSlide({ slide }: { slide: BannerItemData }) {
  const { getColorScheme } = useSite();
  const bgImage = resolveMediaUrl(slide.image?.[0]?.url);
  const scheme = slide.colorScheme ? getColorScheme(slide.colorScheme) : undefined;

  const heightClass = BANNER_STYLE_HEIGHT[slide.bannerStyle || 'medium'] ?? BANNER_STYLE_HEIGHT.medium;
  const positionClasses = TEXT_POSITION_CLASSES[slide.textPosition || 'center'] ?? TEXT_POSITION_CLASSES.center;
  const alignClasses = TEXT_ALIGNMENT_CLASSES[slide.textAlignment || 'center'] ?? TEXT_ALIGNMENT_CLASSES.center;

  // Heading element & size
  const headingLevel = slide.headingLevel || 'h1';
  const isSemanticHeading = headingLevel.startsWith('h');
  const HeadingTag = (isSemanticHeading ? headingLevel : 'p') as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  const headingSizeClass = isSemanticHeading
    ? 'text-4xl md:text-5xl lg:text-6xl'
    : HEADING_SIZE_CLASSES[headingLevel] || HEADING_SIZE_CLASSES.L;

  const secondarySizeClass = SECONDARY_SIZE_CLASSES[slide.secondaryHeadingSize || 'M'] ?? SECONDARY_SIZE_CLASSES.M;

  const htmlContent = slide.text?.markup || '';

  // Color overlay style
  const overlayStyle: React.CSSProperties = {};
  if (slide.addColorOverlay && scheme?.bgColor) {
    overlayStyle.backgroundColor = scheme.bgColor;
    overlayStyle.opacity = 0.6;
  }

  // Text color from scheme
  const contentStyle: React.CSSProperties = {};
  if (scheme) {
    contentStyle.color = scheme.textColor;
  }

  return (
    <div
      className={`relative flex ${heightClass} ${positionClasses} ${slide.cssClasses || ''}`}
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* Color overlay */}
      {slide.addColorOverlay && (
        <div className="absolute inset-0" style={overlayStyle} />
      )}
      {/* Default dark overlay when no color overlay but has background image */}
      {!slide.addColorOverlay && bgImage && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Content */}
      <div className={`relative z-10 w-full max-w-4xl p-8 md:p-16 ${alignClasses}`} style={contentStyle}>
        {slide.heading && (
          <HeadingTag className={`${headingSizeClass} font-bold mb-4`}>
            {slide.heading}
          </HeadingTag>
        )}

        {slide.secondaryHeading && (
          <p className={`${secondarySizeClass} mb-4 opacity-90`}>
            {slide.secondaryHeading}
          </p>
        )}

        {htmlContent && (
          <div
            className="prose prose-invert max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }}
          />
        )}

        {slide.buttons && slide.buttons.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-6" style={{ justifyContent: slide.textAlignment === 'right' ? 'flex-end' : slide.textAlignment === 'center' ? 'center' : 'flex-start' }}>
            {slide.buttons.map((btn, i) => (
              <a
                key={i}
                href={btn.url}
                target={btn.target || undefined}
                className={i === 0 ? 'btn btn-primary' : 'btn btn-secondary'}
              >
                {btn.name || btn.title || 'Learn More'}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Banner Component ---

const Banner: React.FC<BannerProps> = ({ data, settings }) => {
  const allSlides = data.slides?.contentData || [];

  // Filter hidden slides and optionally shuffle
  const slides = useMemo(() => {
    const visible = allSlides.filter(s => !s.hideFromWebsite);
    return settings?.enableRandomOrder ? shuffleArray(visible) : visible;
  }, [allSlides, settings?.enableRandomOrder]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const slideCount = slides.length;
  const hasMultiple = slideCount > 1;

  const goNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slideCount);
  }, [slideCount]);

  const goPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slideCount) % slideCount);
  }, [slideCount]);

  // Auto-rotate
  const speed = settings?.autoRotateSpeed || 0;
  useEffect(() => {
    if (!hasMultiple || speed <= 0 || speed > 10) return;
    const timer = setInterval(goNext, speed * 1000);
    return () => clearInterval(timer);
  }, [hasMultiple, speed, goNext]);

  if (slides.length === 0) return null;

  const stickyClass = settings?.sticky ? 'sticky top-0 z-40' : '';

  return (
    <div className={`relative overflow-hidden ${stickyClass}`}>
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full flex-shrink-0">
            <BannerSlide slide={slide} />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {hasMultiple && settings?.showArrows && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition"
            aria-label="Previous slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 transition"
            aria-label="Next slide"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide indicators */}
      {hasMultiple && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition ${
                i === currentIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Banner;
