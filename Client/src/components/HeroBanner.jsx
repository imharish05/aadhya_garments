import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { StaggeredText } from './animations';

const AUTOPLAY_INTERVAL = 4500;

const FALLBACK_SLIDES = [
  { id: 'fb-1', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=85', alt: 'Twin A Apparels collection', ctaLink: '/products' },
  { id: 'fb-2', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=85', alt: 'Twin A Apparels new arrivals', ctaLink: '/products' },
  { id: 'fb-3', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=85', alt: 'Twin A Apparels featured styles', ctaLink: '/products' },
];

const HeroBanner = () => {
  const { items: allBanners, loading } = useSelector((s) => s.banners);
  const [current, setCurrent] = useState(0);

  const slides = useMemo(() => {
    const hero = (allBanners || [])
      .filter((b) => b.type === 'HERO' && b.isActive !== false)
      .sort((a, b) => (Number(a.position) || 0) - (Number(b.position) || 0));

    if (hero.length === 0) return FALLBACK_SLIDES;
    return hero.map((b, i) => ({
      id: b.id || `banner-${i}`,
      image: getImageUrl(b.image),
      alt: b.title?.trim() || 'Twin A Apparels',
      title: b.title?.trim(),
      subtitle: b.subtitle?.trim(),
      ctaText: b.ctaText?.trim(),
      ctaLink: b.ctaLink || '/products',
    }));
  }, [allBanners]);

  const count = slides.length;
  const next = () => setCurrent((c) => (c + 1) % count);
  const prev = () => setCurrent((c) => (c - 1 + count) % count);

  // reset if slides change
  useEffect(() => {
    if (current >= count) setCurrent(0);
  }, [count, current]);

  // Automatic slide transition (re-arms after each slide transition or user interaction)
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => {
      setCurrent((prevIdx) => (prevIdx + 1) % count);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [count, current]);

  // Touch swipe support for mobile devices
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      next();
    } else if (distance < -50) {
      prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const height = 'hero-fullscreen';

  if (loading) {
    return <section className={`w-full animate-pulse bg-[#F3ECDB] ${height}`} aria-label="Loading banner" />;
  }

  return (
    <section
      className={`relative w-full overflow-hidden bg-[#F3ECDB] ${height}`}
      aria-label="Featured banners"
      aria-roledescription="carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Carousel Track */}
      <div
        className="flex h-full w-full transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((s, i) => {
          const hasCaption = Boolean(s.title || s.subtitle || s.ctaText);
          const active = i === current;
          return (
            <div
              key={s.id}
              className="relative h-full w-full flex-shrink-0 overflow-hidden"
              aria-hidden={!active}
            >
              <img
                src={s.image}
                alt={s.alt}
                className="h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />

              {/* Whole slide clickable if there is no button */}
              {!hasCaption && (
                <Link to={s.ctaLink} tabIndex={active ? 0 : -1} className="absolute inset-0" aria-label={s.alt} />
              )}

              {hasCaption && (
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div
                    key={`hero-caption-${s.id}-${current}`}
                    className="max-w-xl px-5 pb-12 text-center text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] sm:max-w-2xl sm:px-10 sm:pb-14 lg:pb-16"
                  >
                    {s.title && (
                      <StaggeredText
                        as="h2"
                        text={s.title}
                        segmentBy="chars"
                        startDelay={0.1}
                        className="font-playfair text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white"
                      />
                    )}
                    {s.subtitle && (
                      <StaggeredText
                        as="p"
                        text={s.subtitle}
                        segmentBy="words"
                        blur={false}
                        duration={0.4}
                        startDelay={0.25}
                        className="font-montserrat mt-2 text-sm text-white/90 sm:text-base leading-relaxed"
                      />
                    )}
                    {s.ctaText && (
                      <Link
                        to={s.ctaLink}
                        tabIndex={active ? 0 : -1}
                        className="font-inter mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#2A2014] hover:bg-[#BEA266] hover:text-white transition-colors"
                      >
                        {s.ctaText}
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2A2014] shadow hover:bg-white sm:flex transition-transform active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#2A2014] shadow hover:bg-white sm:flex transition-transform active:scale-95"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${current === i ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroBanner;
