import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import { formatPrice } from '../utils/currency';
import { SplitTextReveal, FadeUp, EyebrowReveal, ButtonReveal } from './animations';

// High-fashion editorial campaign fallback in case real inventory image is loading or unavailable
const EDITORIAL_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&q=85';

/**
 * ParallaxCardImage — Scroll-linked parallax & progressive scaling.
 * Smoothly translates and scales the image within an overflow-hidden card
 * without React state updates or scroll hijacking.
 */
const ParallaxCardImage = ({ src, alt, className = '', isMain = false }) => {
  const containerRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Parallax vertical movement (15-35px on desktop, reduced on mobile, 0 when reduced motion preferred)
  const parallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion
      ? ['0px', '0px']
      : isMobile
      ? isMain
        ? ['-12px', '12px']
        : ['-6px', '6px']
      : isMain
      ? ['-26px', '26px']
      : ['-12px', '12px']
  );

  // Progressive scaling from ~1.05 to 1.00 as image passes through viewport
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion
      ? [1, 1]
      : isMobile
      ? [1.025, 1.0]
      : isMain
      ? [1.05, 1.0]
      : [1.035, 1.0]
  );

  return (
    <div ref={containerRef} className={`overflow-hidden relative ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        style={{ y: parallaxY, scale }}
        className="w-full h-[116%] -my-[8%] object-cover object-center will-change-transform transform-gpu pointer-events-none"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};

export const NewArrivalsSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const { items: products, newArrivals } = useSelector(s => s.products);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  // Extract actual New Arrivals product data from Redux store
  const newArrivalsList = useMemo(() => {
    if (newArrivals && newArrivals.length > 0) return newArrivals;
    return (products || []).filter(p => p.isNewArrival);
  }, [newArrivals, products]);

  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position to dynamically toggle slider arrow states
  const checkSliderScroll = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    checkSliderScroll();
    el.addEventListener('scroll', checkSliderScroll, { passive: true });
    window.addEventListener('resize', checkSliderScroll);
    return () => {
      el.removeEventListener('scroll', checkSliderScroll);
      window.removeEventListener('resize', checkSliderScroll);
    };
  }, [checkSliderScroll, newArrivalsList.length]);

  const scrollSlider = (direction) => {
    const el = sliderRef.current;
    if (!el) return;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSelectProduct = (idx) => {
    setActiveIndex(idx);
    const el = sliderRef.current;
    if (el && el.children && el.children[idx]) {
      el.children[idx].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  };

  // Fallback safe selected product
  const featuredProduct = useMemo(() => {
    if (newArrivalsList.length === 0) return null;
    return newArrivalsList[activeIndex] || newArrivalsList[0];
  }, [newArrivalsList, activeIndex]);

  // Resolve high-resolution product imagery from real project data
  const featuredImage = useMemo(() => {
    if (!featuredProduct) return EDITORIAL_FALLBACK_IMAGE;
    const rawImage =
      featuredProduct.defaultProductImage ||
      (Array.isArray(featuredProduct.images) ? featuredProduct.images[0] : null) ||
      featuredProduct.image;
    return getImageUrl(rawImage) || EDITORIAL_FALLBACK_IMAGE;
  }, [featuredProduct]);

  // Formatted price for active product
  const formattedPrice = useMemo(() => {
    if (!featuredProduct) return '';
    return formatPrice(
      featuredProduct.price,
      currencyCode,
      currencyRate,
      featuredProduct.priceAED
    );
  }, [featuredProduct, currencyCode, currencyRate]);

  return (
    <section
      className="py-14 sm:py-18 md:py-20 lg:py-24 bg-[#FAF8F5] border-y border-[#EFECE6] overflow-hidden"
      aria-label="New Arrivals collection"
    >
      <div className="max-w-site mx-auto px-6 sm:px-10 md:px-16 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          {/* ── LEFT COLUMN: Editorial Typography, CTA & Product Slider ─────────── */}
          <div className="lg:col-span-7 flex flex-col items-start justify-center order-2 lg:order-1">
            
            {/* Eyebrow */}
            <EyebrowReveal className="inline-flex items-center gap-2.5 mb-3 sm:mb-4">
              <span className="w-6 h-px bg-neutral-400" />
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.28em] text-neutral-500 uppercase font-montserrat">
                NEW SEASON
              </span>
            </EyebrowReveal>

            {/* Main Heading */}
            <SplitTextReveal
              as="h2"
              text="NEW ARRIVALS"
              className="font-playfair text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-semibold tracking-[-0.015em] text-neutral-950 uppercase leading-[1.08] mb-5 sm:mb-6"
            />

            {/* Supporting Description */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-montserrat text-neutral-600 text-base sm:text-[17px] leading-relaxed font-normal max-w-md mb-8 sm:mb-9"
            >
              Discover the latest styles and thoughtfully selected pieces for your wardrobe.
            </motion.p>

            {/* Minimal Black CTA Button */}
            <ButtonReveal delay={0.3}>
              <Link
                to="/products?newArrival=true"
                className="group inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 bg-neutral-950 text-white font-montserrat text-sm font-semibold tracking-[0.18em] uppercase rounded-none hover:bg-neutral-800 transition-all duration-300 shadow-sm focus-visible:outline-neutral-950"
                id="zaro-shop-new-arrivals-btn"
              >
                <span>SHOP NEW ARRIVALS</span>
                <ArrowRight
                  size={14}
                  className="transform transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </ButtonReveal>

            {/* Interactive Real Products Slider when products exist */}
            {newArrivalsList.length > 0 && (
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.55, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 pt-6 sm:mt-10 sm:pt-8 border-t border-[#EFECE6] w-full max-w-full lg:max-w-xl"
              >
                <div className="flex items-center justify-between mb-3 w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-inter uppercase tracking-[0.2em] text-neutral-500 font-medium">
                      RECENT RELEASES ({newArrivalsList.length})
                    </span>
                    {/* <span className="hidden sm:inline-block text-[11px] text-neutral-400 font-light font-inter">
                      • Select to preview
                    </span> */}
                  </div>

                  {/* Slider Arrow Controls */}
                  {newArrivalsList.length > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => scrollSlider('left')}
                        disabled={!canScrollLeft}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 ${
                          canScrollLeft
                            ? 'border-neutral-300 text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 cursor-pointer shadow-xs active:scale-95'
                            : 'border-neutral-200 text-neutral-300 cursor-not-allowed opacity-40'
                        }`}
                        aria-label="Previous products"
                        title="Previous products"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollSlider('right')}
                        disabled={!canScrollRight}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 ${
                          canScrollRight
                            ? 'border-neutral-300 text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 cursor-pointer shadow-xs active:scale-95'
                            : 'border-neutral-200 text-neutral-300 cursor-not-allowed opacity-40'
                        }`}
                        aria-label="Next products"
                        title="Next products"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Slider Track with Smooth Touch & Snap Scroll */}
                <div
                  ref={sliderRef}
                  onScroll={checkSliderScroll}
                  className="flex items-stretch gap-3 overflow-x-auto scrollbar-none scroll-smooth pb-2 pt-1 -mx-1 px-1 snap-x snap-mandatory"
                >
                  {newArrivalsList.map((item, idx) => {
                    const thumbImg =
                      getImageUrl(item.defaultProductImage || item.images?.[0] || item.image) ||
                      EDITORIAL_FALLBACK_IMAGE;
                    const isSelected = idx === activeIndex;

                    return (
                      <div
                        key={item.id || item._id || idx}
                        onClick={() => handleSelectProduct(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectProduct(idx);
                          }
                        }}
                        aria-label={`Preview ${item.name}`}
                        className={`shrink-0 w-[120px] sm:w-[130px] text-left p-2 transition-all duration-300 border rounded-[4px] snap-start cursor-pointer group/card focus:outline-none ${
                          isSelected
                            ? 'border-neutral-950 bg-white shadow-md ring-1 ring-neutral-950/15'
                            : 'border-neutral-200/80 hover:border-neutral-400 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <div className="aspect-square w-full overflow-hidden bg-neutral-100 mb-2 rounded-[2px] relative">
                          <ParallaxCardImage
                            src={thumbImg}
                            alt={item.name}
                            className="w-full h-full"
                            isMain={false}
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neutral-950 ring-2 ring-white shadow-xs" />
                          )}
                        </div>
                        <p className="text-[12px] font-semibold text-neutral-900 truncate font-playfair" title={item.name}>
                          {item.name}
                        </p>

                        {/* Category/Product info reveal: price & circular arrow */}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-neutral-100">
                          <span className="text-[10px] text-neutral-600 font-sans font-medium">
                            {formatPrice(item.price, currencyCode, currencyRate, item.priceAED)}
                          </span>
                          <Link
                            to={`/products/${item.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white flex items-center justify-center transition-all shadow-xs shrink-0 group-hover/card:scale-105"
                            aria-label={`Shop ${item.name}`}
                            title="View product details"
                          >
                            <ArrowUpRight size={10} />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Refined Fashion Image with Parallax & Overlapping Caption ── */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center lg:justify-end items-center">
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="relative group w-full max-w-[360px] sm:max-w-[400px] lg:max-w-[420px] xl:max-w-[450px]"
            >
              {/* Product Image Container with Stationary Border and Parallax Inside */}
              <div className="aspect-[3/4] sm:aspect-[4/5] w-full max-h-[460px] sm:max-h-[500px] lg:max-h-[520px] overflow-hidden rounded-[4px] sm:rounded-lg shadow-[0_16px_45px_rgba(0,0,0,0.07)] bg-neutral-200 relative">
                <Link
                  to={featuredProduct ? `/products/${featuredProduct.slug}` : '/products?newArrival=true'}
                  className="block w-full h-full cursor-pointer focus-visible:outline-neutral-950"
                  tabIndex={0}
                  aria-label={featuredProduct ? `View ${featuredProduct.name}` : 'Shop New Arrivals'}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={featuredImage}
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0.6 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="w-full h-full"
                    >
                      <ParallaxCardImage
                        src={featuredImage}
                        alt={featuredProduct?.name || 'New Arrivals Fashion'}
                        className="w-full h-full"
                        isMain={true}
                      />
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
                </Link>
              </div>

              {/* Rounded White Floating Caption Overlapping Image Lower Edge */}
              <motion.div
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative sm:absolute mt-3 sm:mt-0 sm:-bottom-5 md:-bottom-6 sm:left-2 md:-left-6 lg:-left-8 sm:max-w-[280px] md:max-w-[320px] z-10"
              >
                <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-[0_14px_35px_rgba(0,0,0,0.08)] border border-neutral-200/60">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                    <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase font-inter">
                      EDITORIAL SELECTION
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] font-light text-neutral-700 leading-snug font-inter">
                    New styles, modern silhouettes, effortless everyday elegance.
                  </p>

                  {/* Product info reveal: Title, price, and circular arrow button */}
                  {featuredProduct && (
                    <div className="mt-2.5 pt-2.5 border-t border-neutral-100 flex items-center justify-between group/link text-xs text-neutral-900 font-medium">
                      <Link
                        to={`/products/${featuredProduct.slug}`}
                        className="truncate pr-3 hover:text-brand-gold transition-colors block"
                      >
                        <span className="truncate font-playfair font-semibold text-sm sm:text-base block">
                          {featuredProduct.name}
                        </span>
                        <span className="text-neutral-500 font-sans text-[11px] block mt-0.5">
                          {formattedPrice}
                        </span>
                      </Link>

                      {/* Circular Arrow Button */}
                      <Link
                        to={`/products/${featuredProduct.slug}`}
                        className="w-7 h-7 rounded-full bg-neutral-950 text-white hover:bg-neutral-800 transition-all flex items-center justify-center shrink-0 shadow-sm group-hover/link:scale-105 active:scale-95"
                        aria-label={`View details for ${featuredProduct.name}`}
                      >
                        <ArrowUpRight
                          size={13}
                          className="transform transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                        />
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
