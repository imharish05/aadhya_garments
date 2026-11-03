import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { CountdownBannerSkeleton } from './skeletons';

/* ── Compact Countdown Digit Box ─────────────────────────────────────────── */
const CountBox = ({ value, label }) => (
  <div className="bg-white/[0.07] border border-white/10 rounded-lg py-1.5 px-1.5 sm:px-2 text-center min-w-[44px] sm:min-w-[50px] transition-colors">
    <span className="font-playfair text-base sm:text-lg md:text-xl font-bold text-white block tracking-wider leading-none">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[8px] sm:text-[9px] font-montserrat font-semibold tracking-[0.14em] text-brand-gold uppercase block mt-0.5">
      {label}
    </span>
  </div>
);

/* ── Compact Single Offer Slide ───────────────────────────────────────────── */
const OfferSlide = ({ banner }) => {
  const calcTimeLeft = useCallback(() => {
    if (!banner?.countdown) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    const diff = new Date(banner.countdown).getTime() - Date.now();
    if (isNaN(diff) || diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      expired: false,
    };
  }, [banner?.countdown]);

  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft());

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    if (!banner?.countdown) return;

    const interval = setInterval(() => {
      setTimeLeft(calcTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [banner?.countdown, calcTimeLeft]);

  return (
    <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800/90 shadow-xl flex flex-col md:flex-row items-stretch min-h-[190px] md:min-h-[210px] md:max-h-[240px]">
      {/* ── Left Side: Compact Editorial Image ── */}
      <div className="w-full md:w-[36%] lg:w-[32%] relative h-40 sm:h-44 md:h-auto overflow-hidden group flex-shrink-0">
        <img
          src={getImageUrl(banner.image)}
          alt={banner.title || 'Special Offer'}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle Vignette Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-neutral-950/80 pointer-events-none" />

        {/* Floating Badge on Image */}
        {banner.badgeText && (
          <div className="absolute top-3 left-3 sm:top-3.5 sm:left-3.5 z-10">
            <span className="inline-flex items-center gap-1 bg-brand-gold text-neutral-950 font-montserrat font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full shadow-md">
              <Sparkles size={11} className="text-neutral-950" />
              {banner.badgeText}
            </span>
          </div>
        )}
      </div>

      {/* ── Right Side: Compact Editorial Content & Live Countdown ── */}
      <div className="w-full md:w-[64%] lg:w-[68%] p-4 sm:p-5 lg:p-6 flex flex-col justify-between bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-950 text-white relative">
        {/* Ambient Gold Corner Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 blur-2xl pointer-events-none rounded-full" />

        {/* Header & Titles */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] sm:text-[10px] font-montserrat font-semibold uppercase tracking-[0.2em] text-brand-gold/90">
              Limited Offer
            </span>
          </div>
          <h3 className="font-playfair text-lg sm:text-xl md:text-2xl font-normal leading-snug text-white tracking-[-0.01em] line-clamp-1">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="font-montserrat text-white/70 text-xs sm:text-[13px] font-light leading-relaxed mt-1 line-clamp-1 sm:line-clamp-2">
              {banner.subtitle}
            </p>
          )}
        </div>

        {/* Bottom Row: Countdown Timer & CTA Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-white/10">
          {/* Countdown Blocks */}
          <div className="flex items-center gap-2">
            <span className="text-brand-gold text-[10px] font-montserrat font-semibold tracking-[0.16em] uppercase hidden xl:inline-flex items-center gap-1 mr-1">
              <Clock size={12} className="animate-pulse" /> Ends:
            </span>
            <div className="flex items-center gap-1.5">
              <CountBox value={timeLeft.d} label="Days" />
              <CountBox value={timeLeft.h} label="Hours" />
              <CountBox value={timeLeft.m} label="Mins" />
              <CountBox value={timeLeft.s} label="Secs" />
            </div>
          </div>

          {/* Action Button */}
          <div className="self-start sm:self-auto flex-shrink-0">
            {timeLeft.expired ? (
              <button
                type="button"
                disabled
                className="px-4 py-1.5 sm:py-2 rounded-full bg-neutral-800 text-neutral-500 font-montserrat font-semibold text-[10px] sm:text-[11px] uppercase tracking-wider cursor-not-allowed border border-neutral-700/80"
              >
                Deal Expired
              </button>
            ) : (
              <Link
                to={banner.ctaLink || '/products'}
                className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-brand-gold hover:bg-white text-neutral-950 font-montserrat font-semibold text-[10px] sm:text-[11px] tracking-[0.14em] uppercase transition-all duration-300 shadow-sm hover:shadow-brand-gold/20 group cursor-pointer"
              >
                <span>{banner.ctaText || 'Claim Offer'}</span>
                <ArrowRight size={13} className="transform transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Main Compact Offer Section (Above New Arrivals) ──────────────────────── */
const OfferCountdownCarousel = ({ banners = [], loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  // Extract all active COUNTDOWN banners sorted by position
  const offerBanners = useMemo(() => {
    return (banners || [])
      .filter((b) => b.type === 'COUNTDOWN' && b.isActive)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [banners]);

  // Keep index within bounds
  useEffect(() => {
    if (offerBanners.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= offerBanners.length) {
      setCurrentIndex(0);
    }
  }, [offerBanners.length, currentIndex]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? offerBanners.length - 1 : prev - 1));
  }, [offerBanners.length]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev >= offerBanners.length - 1 ? 0 : prev + 1));
  }, [offerBanners.length]);

  // Auto-slide when more than 1 offer exists
  useEffect(() => {
    if (offerBanners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [offerBanners.length, isPaused, handleNext]);

  // Mobile swipe gestures
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
    setIsPaused(false);
  };

  if (loading && offerBanners.length === 0) {
    return <CountdownBannerSkeleton />;
  }

  if (offerBanners.length === 0) {
    return null;
  }

  const currentBanner = offerBanners[currentIndex] || offerBanners[0];

  const slideVariants = {
    enter: (dir) => ({
      opacity: 0,
      x: dir > 0 ? 25 : -25,
    }),
    center: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir) => ({
      opacity: 0,
      x: dir > 0 ? -25 : 25,
      transition: {
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <section
      className="py-5 sm:py-6 bg-[#FAF8F5]"
      aria-label="Featured limited offers"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-site mx-auto px-4 sm:px-6 md:px-8">
        {/* Compact Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
            <span className="text-[10px] sm:text-[11px] font-montserrat font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Limited-Time Special Offers
            </span>
          </div>

          {offerBanners.length > 1 && (
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] sm:text-[11px] font-montserrat text-neutral-400 tracking-widest font-medium">
                {String(currentIndex + 1).padStart(2, '0')} / {String(offerBanners.length).padStart(2, '0')}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous offer"
                  className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-700 hover:border-brand-gold hover:bg-brand-gold hover:text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-white shadow-2xs"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next offer"
                  className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-700 hover:border-brand-gold hover:bg-brand-gold hover:text-black flex items-center justify-center transition-all active:scale-95 cursor-pointer bg-white shadow-2xs"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Carousel Slide Area */}
        <div className="relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentBanner.id || currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              <OfferSlide banner={currentBanner} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Pagination Indicator Dots */}
        {offerBanners.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-3.5">
            {offerBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx
                    ? 'w-6 bg-brand-gold'
                    : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Go to offer slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OfferCountdownCarousel;
