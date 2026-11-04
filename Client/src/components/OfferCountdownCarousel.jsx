import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { CountdownBannerSkeleton } from './skeletons';

/* ── Abstract backdrop: gold sun + rings + dots, fills image side ───────── */
const SoftArt = () => (
  <svg
    viewBox="0 0 400 320"
    preserveAspectRatio="xMidYMid slice"
    className="absolute inset-0 w-full h-full"
    aria-hidden="true"
  >
    <circle cx="200" cy="190" r="150" fill="#C9A24B" opacity="0.18" />
    <circle cx="200" cy="190" r="108" fill="#C9A24B" opacity="0.22" />
    <circle cx="200" cy="190" r="190" fill="none" stroke="#C9A24B" strokeWidth="1.5" opacity="0.45" />
    <circle cx="200" cy="190" r="230" fill="none" stroke="#C9A24B" strokeWidth="1" opacity="0.3" />
    <path d="M30 60 q14 -18 28 0 t28 0 t28 0" fill="none" stroke="#C9A24B" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
    <circle cx="350" cy="70" r="9" fill="#C9A24B" opacity="0.8" />
    <circle cx="372" cy="104" r="4" fill="#C9A24B" opacity="0.6" />
    <circle cx="48" cy="270" r="6" fill="#C9A24B" opacity="0.6" />
  </svg>
);

/* ── Countdown unit ──────────────────────────────────────────────────────── */
const CountBox = ({ value, label }) => (
  <div className="min-w-[54px] sm:min-w-[60px] text-center rounded-xl bg-white/80 border border-brand-gold/30 py-2 px-2">
    <span className="block font-montserrat text-lg sm:text-xl font-semibold text-neutral-900 leading-none tabular-nums">
      {String(value).padStart(2, '0')}
    </span>
    <span className="block mt-1 text-[10px] font-montserrat text-neutral-500">
      {label}
    </span>
  </div>
);

/* ── Single offer slide ──────────────────────────────────────────────────── */
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
    const interval = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [banner?.countdown, calcTimeLeft]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#FBF6EC] border border-brand-gold/25 shadow-sm flex flex-col-reverse md:flex-row items-stretch md:h-[300px]">
      {/* Content: tight, vertically centered, no dead space */}
      <div className="w-full md:w-[58%] px-5 py-6 sm:px-8 md:px-10 flex flex-col justify-center gap-4">
        <div>
          <p className="font-montserrat text-xs font-medium text-brand-gold mb-1.5">
            Limited-time offer
          </p>
          <h3 className="font-playfair text-2xl sm:text-3xl md:text-4xl font-semibold text-neutral-900 leading-tight line-clamp-2">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="font-montserrat text-sm text-neutral-600 leading-relaxed mt-2 line-clamp-2 max-w-lg">
              {banner.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-2" role="timer" aria-label="Time left">
            <CountBox value={timeLeft.d} label="Days" />
            <CountBox value={timeLeft.h} label="Hours" />
            <CountBox value={timeLeft.m} label="Mins" />
            <CountBox value={timeLeft.s} label="Secs" />
          </div>

          {timeLeft.expired ? (
            <button
              type="button"
              disabled
              className="px-5 py-2.5 rounded-full bg-neutral-200 text-neutral-500 font-montserrat font-medium text-sm cursor-not-allowed"
            >
              Offer ended
            </button>
          ) : (
            <Link
              to={banner.ctaLink || '/products'}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900 hover:bg-brand-gold hover:text-neutral-950 text-white font-montserrat font-medium text-sm transition-colors duration-300"
            >
              <span>{banner.ctaText || 'Shop now'}</span>
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          )}
        </div>
      </div>

      {/* Visual: abstract art + arch-framed photo */}
      <div className="relative w-full md:w-[42%] h-56 sm:h-64 md:h-full flex-shrink-0 overflow-hidden">
        <SoftArt />

        {banner.image && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] sm:w-[220px] md:w-[78%] max-w-[280px] h-[92%] overflow-hidden rounded-t-full border-4 border-white shadow-lg bg-white">
            <img
              src={getImageUrl(banner.image)}
              alt={banner.title || 'Special Offer'}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          </div>
        )}

        {banner.badgeText && (
          <span className="absolute top-4 right-4 md:top-5 md:right-6 z-10 bg-brand-gold text-neutral-950 font-montserrat font-semibold text-xs px-3.5 py-1.5 rounded-full shadow-md rotate-3">
            {banner.badgeText}
          </span>
        )}
      </div>
    </div>
  );
};

/* ── Main section ────────────────────────────────────────────────────────── */
const OfferCountdownCarousel = ({ banners = [], loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef(0);
  const touchEndXRef = useRef(0);

  const offerBanners = useMemo(() => {
    return (banners || [])
      .filter((b) => b.type === 'COUNTDOWN' && b.isActive)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [banners]);

  useEffect(() => {
    if (offerBanners.length === 0) setCurrentIndex(0);
    else if (currentIndex >= offerBanners.length) setCurrentIndex(0);
  }, [offerBanners.length, currentIndex]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? offerBanners.length - 1 : prev - 1));
  }, [offerBanners.length]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev >= offerBanners.length - 1 ? 0 : prev + 1));
  }, [offerBanners.length]);

  useEffect(() => {
    if (offerBanners.length <= 1 || isPaused) return;
    const timer = setInterval(handleNext, 6000);
    return () => clearInterval(timer);
  }, [offerBanners.length, isPaused, handleNext]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchEndXRef.current = e.touches[0].clientX;
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

  if (loading && offerBanners.length === 0) return <CountdownBannerSkeleton />;
  if (offerBanners.length === 0) return null;

  const currentBanner = offerBanners[currentIndex] || offerBanners[0];

  const slideVariants = {
    enter: (dir) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
    exit: (dir) => ({ opacity: 0, x: dir > 0 ? -24 : 24, transition: { duration: 0.2 } }),
  };

  return (
    <section
      className="py-6 sm:py-8 bg-[#FAF8F5]"
      aria-label="Featured limited offers"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-site mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-montserrat text-sm sm:text-base font-semibold text-neutral-800">
            Special offers
          </h2>

          {offerBanners.length > 1 && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-montserrat text-neutral-500 tabular-nums">
                {currentIndex + 1} / {offerBanners.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous offer"
                  className="w-8 h-8 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next offer"
                  className="w-8 h-8 rounded-full border border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

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

        {offerBanners.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-4">
            {offerBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx ? 'w-6 bg-neutral-900' : 'w-1.5 bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Go to offer slide ${idx + 1}`}
                aria-current={currentIndex === idx}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default OfferCountdownCarousel;