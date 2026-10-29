import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

const AUTOPLAY_INTERVAL = 6000;

// Curated high-fashion editorial campaign slides inspired by VÉLUNE
const EDITORIAL_SLIDES = [
  {
    id: 'editorial-1',
    eyebrow: 'NEW SEASON / 2026',
    title: 'Define Your Presence',
    subtitle: 'Discover considered silhouettes and contemporary essentials designed to make every moment feel distinctive.',
    ctaText: 'Explore Collection',
    ctaLink: '/products',
    secondaryCtaText: 'View Atelier',
    secondaryCtaLink: '/products?featured=true',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=85',
    focalPosition: 'object-center md:object-[center_35%]',
  },
  {
    id: 'editorial-2',
    eyebrow: 'THE NEW EDIT',
    title: 'Made to Move With You',
    subtitle: 'Explore refined shapes, expressive textures, and effortless everyday elegance crafted for modern living.',
    ctaText: 'Discover the Edit',
    ctaLink: '/products?featured=true',
    secondaryCtaText: 'New Arrivals',
    secondaryCtaLink: '/products?newArrival=true',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=85',
    focalPosition: 'object-center md:object-[center_30%]',
  },
  {
    id: 'editorial-3',
    eyebrow: 'SIGNATURE STYLE',
    title: 'A Different Kind of Classic',
    subtitle: 'Timeless pieces reimagined through modern proportions, thoughtful details, and artisanal precision.',
    ctaText: 'Shop the Collection',
    ctaLink: '/products',
    secondaryCtaText: 'Explore Occasion',
    secondaryCtaLink: '/products?category=party-wear',
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=85',
    focalPosition: 'object-center md:object-[center_40%]',
  },
];

const HeroBanner = () => {
  const { items: allBanners, loading } = useSelector(s => s.banners);
  const prefersReducedMotion = useReducedMotion();

  // Combine backend HERO banners with editorial slides so there are always at least 3 campaign slides
  const slides = useMemo(() => {
    const heroBanners = (allBanners || []).filter(b => b.type === 'HERO');
    if (!heroBanners || heroBanners.length === 0) {
      return EDITORIAL_SLIDES;
    }
    const formattedBanners = heroBanners.map((b, idx) => ({
      id: b.id || `banner-${idx}`,
      eyebrow: b.badgeText?.trim() || 'ATELIER COLLECTION',
      title: b.title?.trim() || 'Luxury Redefined',
      subtitle: b.subtitle?.trim() || 'Discover handcrafted elegance from fine artisans.',
      ctaText: b.ctaText?.trim() || 'Explore Collection',
      ctaLink: b.ctaLink || '/products',
      secondaryCtaText: 'View Edit',
      secondaryCtaLink: '/products?featured=true',
      image: getImageUrl(b.image) || EDITORIAL_SLIDES[idx % EDITORIAL_SLIDES.length].image,
      focalPosition: 'object-center',
    }));

    if (formattedBanners.length >= 3) {
      return formattedBanners;
    }
    // Fill remaining up to 3 slides from editorial defaults
    const combined = [...formattedBanners];
    for (let i = 0; combined.length < 3 && i < EDITORIAL_SLIDES.length; i++) {
      combined.push(EDITORIAL_SLIDES[i]);
    }
    return combined;
  }, [allBanners]);

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  const sectionRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Monitor visibility of hero in viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Monitor document tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const goTo = useCallback((index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const next = useCallback(() => {
    if (slides.length <= 1) return;
    setDirection(1);
    setCurrent(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (slides.length <= 1) return;
    setDirection(-1);
    setCurrent(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Autoplay handler with strict pausing on hover, off-screen, or hidden tab
  useEffect(() => {
    if (
      slides.length <= 1 ||
      isHovered ||
      !isVisible ||
      !isDocumentVisible ||
      prefersReducedMotion
    ) {
      return;
    }

    const timer = setInterval(() => {
      next();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(timer);
  }, [slides.length, isHovered, isVisible, isDocumentVisible, prefersReducedMotion, next]);

  // Touch swipe support for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 45) {
      if (diff > 0) next();
      else prev();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      next();
    } else if (e.key === 'ArrowLeft') {
      prev();
    }
  };

  if (loading) {
    return (
      <section
        ref={sectionRef}
        className="hero-banner-section bg-neutral-950 flex items-center justify-center"
        aria-label="Loading campaign banner"
      >
        <div className="absolute inset-0 skeleton opacity-15" />
      </section>
    );
  }

  const activeSlide = slides[current] || slides[0];
  const words = activeSlide.title.trim().split(/\s+/).filter(Boolean);

  return (
    <section
      ref={sectionRef}
      className="hero-banner-section relative w-full bg-neutral-950 text-white select-none focus:outline-none"
      aria-label="Editorial fashion campaign carousel"
      role="region"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* ── Background Slide Imagery with Restrained Zoom & Crossfade ─────── */}
      <div
        className="absolute inset-0 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeSlide.id || current}
            custom={direction}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.3 : 0.95,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={activeSlide.image}
              alt={activeSlide.title}
              className={`w-full h-full object-cover ${activeSlide.focalPosition || 'object-center'} brightness-[0.92]`}
              fetchpriority={current === 0 ? 'high' : 'auto'}
              loading={current === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
            {/* Carefully balanced editorial gradient overlay: maintains full text legibility without over-darkening the subject */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/30 md:bg-gradient-to-r md:from-black/75 md:via-black/40 md:to-transparent" />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Editorial Typography & Content Safe-Area ─────────────────────── */}
      <div className="relative z-10 max-w-site mx-auto px-6 sm:px-10 md:px-16 lg:px-20 w-full py-12 md:py-0 pointer-events-none">
        <div className="max-w-xl lg:max-w-2xl pointer-events-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${activeSlide.id || current}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              className="flex flex-col items-start"
            >
              {/* A. Eyebrow animation */}
              {activeSlide.eyebrow && (
                <div className="overflow-hidden mb-3 md:mb-4">
                  <motion.div
                    initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.1,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="inline-flex items-center gap-2"
                  >
                    <span className="w-6 h-px bg-white/60 hidden sm:inline-block" />
                    <span className="text-white/90 text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase font-inter">
                      {activeSlide.eyebrow}
                    </span>
                  </motion.div>
                </div>
              )}

              {/* B. Masked Headline Text Reveal */}
              <h1 className="relative font-playfair font-normal text-white text-3xl sm:text-5xl md:text-6xl lg:text-[68px] leading-[1.08] tracking-[-0.015em] mb-4 sm:mb-5">
                {/* Accessible text for screen readers */}
                <span className="sr-only">{activeSlide.title}</span>

                {/* Visual masked word reveal */}
                <span aria-hidden="true" className="inline-block">
                  {words.map((word, i) => (
                    <span
                      key={`${word}-${i}`}
                      className="inline-block overflow-hidden align-top mr-[0.24em] last:mr-0 pb-[0.06em]"
                    >
                      <motion.span
                        className="inline-block"
                        initial={
                          prefersReducedMotion
                            ? { opacity: 0 }
                            : { y: '115%', opacity: 0 }
                        }
                        animate={{ y: '0%', opacity: 1 }}
                        transition={{
                          duration: 0.85,
                          delay: 0.18 + i * 0.09,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </span>
              </h1>

              {/* C. Description animation */}
              {activeSlide.subtitle && (
                <motion.p
                  initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.55,
                    delay: 0.38,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="font-inter text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-lg mb-6 sm:mb-8 font-light"
                >
                  {activeSlide.subtitle}
                </motion.p>
              )}

              {/* D. CTA Action Buttons with refined hover states */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.48,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-wrap items-center gap-3 sm:gap-4"
              >
                <Link
                  to={activeSlide.ctaLink}
                  className="group relative inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 bg-white text-neutral-950 font-inter text-xs font-semibold uppercase tracking-[0.15em] border border-white hover:bg-neutral-100 transition-all duration-300 shadow-sm focus-visible:outline-white"
                  id={`hero-cta-primary-${current}`}
                >
                  <span>{activeSlide.ctaText}</span>
                  <ArrowRight
                    size={14}
                    className="transform transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                {activeSlide.secondaryCtaText && (
                  <Link
                    to={activeSlide.secondaryCtaLink}
                    className="group inline-flex items-center gap-2 px-5 sm:px-7 py-3 sm:py-3.5 bg-transparent text-white/90 hover:text-white font-inter text-xs font-medium uppercase tracking-[0.15em] border border-white/30 hover:border-white/80 transition-all duration-300 focus-visible:outline-white"
                    id={`hero-cta-secondary-${current}`}
                  >
                    <span>{activeSlide.secondaryCtaText}</span>
                  </Link>
                )}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Slide Counter & Restrained Controls (VÉLUNE Style) ─────────────── */}
      <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 md:left-16 lg:left-20 z-20 flex items-center gap-4 text-white/70">
        <span className="font-inter text-xs tracking-widest font-medium text-white">
          {String(current + 1).padStart(2, '0')}
        </span>
        <div className="w-10 sm:w-16 h-[2px] bg-white/20 relative overflow-hidden">
          <motion.div
            key={`progress-${current}`}
            className="absolute top-0 bottom-0 left-0 bg-white"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: prefersReducedMotion || isHovered ? 0 : AUTOPLAY_INTERVAL / 1000,
              ease: 'linear',
            }}
          />
        </div>
        <span className="font-inter text-xs tracking-widest text-white/40">
          {String(slides.length).padStart(2, '0')}
        </span>
      </div>

      {/* ── Slide Indicator Dots / Navigation Bar ─────────────────────────── */}
      <div
        className="absolute bottom-6 sm:bottom-10 right-6 sm:right-10 md:right-16 lg:right-20 z-20 flex items-center gap-2"
        role="tablist"
        aria-label="Campaign slides"
      >
        {slides.map((slide, i) => (
          <button
            key={slide.id || i}
            onClick={() => goTo(i)}
            role="tab"
            aria-selected={current === i}
            aria-label={`Go to slide ${i + 1}: ${slide.title}`}
            className={`group h-8 px-1.5 flex items-center focus-visible:outline-white focus-visible:outline-offset-2`}
          >
            <span
              className={`block h-[2px] transition-all duration-400 ${
                current === i
                  ? 'w-8 bg-white'
                  : 'w-3.5 bg-white/35 group-hover:bg-white/70'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ── Minimal Prev/Next Desktop Arrows ─────────────────────────────── */}
      {slides.length > 1 && (
        <div className="hidden md:flex absolute right-16 lg:right-20 top-1/2 -translate-y-1/2 z-20 flex-col gap-2">
          <button
            onClick={prev}
            className="w-10 h-10 flex items-center justify-center border border-white/25 text-white/80 hover:text-white hover:border-white/80 bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 focus-visible:outline-white"
            aria-label="Previous campaign slide"
            id="hero-arrow-prev"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={next}
            className="w-10 h-10 flex items-center justify-center border border-white/25 text-white/80 hover:text-white hover:border-white/80 bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-200 focus-visible:outline-white"
            aria-label="Next campaign slide"
            id="hero-arrow-next"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
