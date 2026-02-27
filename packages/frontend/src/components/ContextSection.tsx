import { useEffect, useState } from 'react';

/**
 * Editorial Context Sections - News Headlines & Construction Imagery
 *
 * Two separate visual sections:
 * 1. HeadlinesSection - News coverage, slower motion, larger images for readability
 * 2. ConstructionSection - Ambient construction imagery, faster motion, atmospheric
 *
 * MOTION PATTERN:
 * - Continuous horizontal film-strip drift
 * - Headlines: Slower (100s cycle), larger cards
 * - Construction: Faster (60s cycle), smaller cards, more atmospheric
 *
 * IMAGE HANDLING:
 * - All images normalized via object-fit: cover
 * - Fixed height containers adapt to varying aspect ratios
 * - No distortion regardless of source image size
 *
 * TO ADD IMAGES:
 * - Add files to public/assets/news/ or public/assets/construction/
 * - Update the arrays below with the new filenames
 */

// =============================================================================
// NEWS HEADLINES - 17 images
// =============================================================================
const NEWS_IMAGES = [
  { src: '/assets/news/headline-1.jpg', alt: 'UK housing and building safety news' },
  { src: '/assets/news/headline-2.jpg', alt: 'BSR regulatory coverage' },
  { src: '/assets/news/headline-3.jpg', alt: 'Gateway approval news' },
  { src: '/assets/news/headline-4.jpg', alt: 'Planning delays headline' },
  { src: '/assets/news/headline-5.jpg', alt: 'Building safety news' },
  { src: '/assets/news/headline-6.jpg', alt: 'Housing sector coverage' },
  { src: '/assets/news/headline-7.jpg', alt: 'Regulatory news' },
  { src: '/assets/news/headline-8.jpg', alt: 'Construction industry news' },
  { src: '/assets/news/headline-9.jpg', alt: 'Development approval news' },
  { src: '/assets/news/headline-10.jpg', alt: 'UK housing crisis coverage' },
  { src: '/assets/news/headline-11.jpg', alt: 'Building regulations news' },
  { src: '/assets/news/headline-12.jpg', alt: 'Industry headline' },
  { src: '/assets/news/headline-13.jpg', alt: 'Safety compliance news' },
  { src: '/assets/news/headline-14.jpg', alt: 'Sector news coverage' },
  { src: '/assets/news/headline-15.jpg', alt: 'Regulatory update' },
  { src: '/assets/news/headline-16.jpg', alt: 'Housing delivery news' },
  { src: '/assets/news/headline-17.jpg', alt: 'Building safety headline' },
];

// =============================================================================
// CONSTRUCTION IMAGERY - 11 images
// =============================================================================
const CONSTRUCTION_IMAGES = [
  { src: '/assets/construction/site-1.jpg', alt: 'High-rise construction' },
  { src: '/assets/construction/site-2.jpg', alt: 'Urban development' },
  { src: '/assets/construction/site-3.jpg', alt: 'Residential tower' },
  { src: '/assets/construction/site-4.jpg', alt: 'Construction site' },
  { src: '/assets/construction/site-5.jpg', alt: 'Building project' },
  { src: '/assets/construction/site-6.jpg', alt: 'Development site' },
  { src: '/assets/construction/site-7.jpg', alt: 'Tower construction' },
  { src: '/assets/construction/site-8.jpg', alt: 'Urban construction' },
  { src: '/assets/construction/site-9.jpg', alt: 'High-rise development' },
  { src: '/assets/construction/site-10.jpg', alt: 'Construction project' },
  { src: '/assets/construction/site-11.jpg', alt: 'Building site' },
];

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

interface ImageCardProps {
  src: string;
  alt: string;
  size: 'large' | 'medium' | 'small';
  isVisible: boolean;
  muted?: boolean;
}

function ImageCard({ src, alt, size, isVisible, muted = false }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const isHeadline = size === 'large' || size === 'medium';

  if (error) {
    return (
      <div className="context-image-card flex-shrink-0 rounded-lg overflow-hidden w-64 h-40 bg-slate-800" />
    );
  }

  // For headlines: show full image at natural aspect ratio
  // Fixed height, width scales naturally - no cropping
  if (isHeadline) {
    return (
      <div
        className={`
          context-image-card flex-shrink-0 rounded-lg overflow-hidden shadow-lg
          bg-white
          transition-opacity duration-700
          ${loaded ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ height: '180px' }}
      >
        <img
          src={src}
          alt={alt}
          loading={isVisible ? 'eager' : 'lazy'}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            height: '100%',
            width: 'auto',
            display: 'block',
          }}
        />
      </div>
    );
  }

  // For construction: fixed size with cover (cropping ok)
  return (
    <div
      className={`
        context-image-card flex-shrink-0 rounded-lg overflow-hidden shadow-lg
        w-48 h-32
        transition-opacity duration-700
        ${loaded ? 'opacity-100' : 'opacity-0'}
        ${muted ? 'opacity-60' : ''}
      `}
    >
      <img
        src={src}
        alt={alt}
        loading={isVisible ? 'eager' : 'lazy'}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
}

interface FilmStripProps {
  images: Array<{ src: string; alt: string }>;
  direction: 'left' | 'right';
  speed: number;
  size: 'large' | 'medium' | 'small';
  reducedMotion: boolean;
  muted?: boolean;
}

function FilmStrip({ images, direction, speed, size, reducedMotion, muted = false }: FilmStripProps) {
  // Duplicate for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <div className="relative overflow-hidden py-2">
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

      <div
        className={`flex gap-4 ${reducedMotion ? '' : 'context-filmstrip'}`}
        style={{
          '--filmstrip-direction': direction === 'left' ? 'normal' : 'reverse',
          '--filmstrip-duration': `${speed}s`,
        } as React.CSSProperties}
      >
        {duplicatedImages.map((image, index) => (
          <ImageCard
            key={`${image.src}-${index}`}
            src={image.src}
            alt={image.alt}
            size={size}
            isVisible={index < images.length}
            muted={muted}
          />
        ))}
      </div>
    </div>
  );
}

function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

// =============================================================================
// HEADLINES SECTION
// Slower motion, larger images, editorial feel
// Place after Problem Section stats
// =============================================================================

export function HeadlinesSection() {
  const reducedMotion = useReducedMotion();

  // Split images into two rows for visual variety
  const row1 = NEWS_IMAGES.slice(0, 9);
  const row2 = NEWS_IMAGES.slice(9);

  return (
    <section
      id="headlines"
      className="relative bg-slate-900 py-10 overflow-hidden"
      aria-label="Recent news coverage of UK building safety and housing"
    >
      {/* Section label */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-slate-500 text-xs font-medium tracking-widest uppercase">
            In The News
          </span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>
      </div>

      {/* Film strips - slow motion for readability */}
      <div className="space-y-3">
        <FilmStrip
          images={row1}
          direction="left"
          speed={120}
          size="large"
          reducedMotion={reducedMotion}
        />
        <FilmStrip
          images={row2}
          direction="right"
          speed={140}
          size="large"
          reducedMotion={reducedMotion}
        />
      </div>
    </section>
  );
}

// =============================================================================
// CONSTRUCTION SECTION
// Faster motion, smaller images, ambient/atmospheric
// Place later in page for visual break
// =============================================================================

export function ConstructionSection() {
  const reducedMotion = useReducedMotion();

  // Split for two rows
  const row1 = CONSTRUCTION_IMAGES.slice(0, 6);
  const row2 = CONSTRUCTION_IMAGES.slice(6);

  return (
    <section
      id="construction"
      className="relative bg-slate-800 py-8 overflow-hidden"
      aria-label="UK construction and development imagery"
    >
      {/* Minimal label */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-slate-600 text-xs font-medium tracking-widest uppercase">
            The Physical Reality
          </span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>
      </div>

      {/* Film strips - faster, more atmospheric */}
      <div className="space-y-2">
        <FilmStrip
          images={row1}
          direction="right"
          speed={70}
          size="small"
          reducedMotion={reducedMotion}
          muted
        />
        <FilmStrip
          images={row2}
          direction="left"
          speed={80}
          size="small"
          reducedMotion={reducedMotion}
          muted
        />
      </div>
    </section>
  );
}

// =============================================================================
// TIMELAPSE VIDEO SECTION
// Embedded YouTube video of London high-rise construction
// =============================================================================

// Configure your YouTube video here
// Use the video ID from the YouTube URL (e.g., for https://youtube.com/watch?v=ABC123, use "ABC123")
const TIMELAPSE_CONFIG = {
  videoId: 'UOl10AknR_0',
  title: 'London High-Rise Construction',
  caption: 'The reality of high-rise development in the UK',
};

export function TimelapseSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  // YouTube params for seamless autoplay:
  // autoplay=1, mute=1 (required for autoplay), loop=1, controls=0, showinfo=0
  // playlist param needed for loop to work
  const embedParams = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    controls: '0',
    showinfo: '0',
    rel: '0',
    modestbranding: '1',
    playlist: TIMELAPSE_CONFIG.videoId, // Required for loop
  }).toString();

  return (
    <section
      id="timelapse"
      className="relative bg-slate-900 overflow-hidden"
      aria-label="Construction timelapse video"
    >
      {/* Full-width immersive video - no container padding */}
      <div className="relative w-full bg-slate-900">
        {/* 21:9 cinematic aspect ratio for more immersive feel */}
        <div className="relative w-full" style={{ paddingBottom: '42.85%' }}>
          {/* Loading placeholder */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
              <div className="text-slate-600 text-sm animate-pulse">Loading...</div>
            </div>
          )}

          {/* YouTube embed - autoplay, muted, looping, no controls */}
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${TIMELAPSE_CONFIG.videoId}?${embedParams}`}
            title={TIMELAPSE_CONFIG.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            style={{ border: 'none' }}
          />

          {/* Transparent overlay to block all YouTube UI and interactions */}
          <div className="absolute inset-0 z-10 cursor-default" style={{ pointerEvents: 'auto' }} />
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// DEFAULT EXPORT - Combined section (legacy support)
// =============================================================================

export default function ContextSection() {
  return (
    <>
      <HeadlinesSection />
    </>
  );
}
