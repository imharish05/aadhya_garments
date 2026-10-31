import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { ArrivalsBackdrop } from './Motifs';
import SectionHeading from './SectionHeading';
import { ButtonReveal, StaggeredText } from './animations';

const arrowBtn = (enabled) =>
  `w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 ${
    enabled
      ? 'border-neutral-300 text-neutral-800 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 cursor-pointer active:scale-95'
      : 'border-neutral-200 text-neutral-300 cursor-not-allowed opacity-40'
  }`;

export const NewArrivalsSection = () => {
  const prefersReducedMotion = useReducedMotion();
  const { items: products, newArrivals } = useSelector((s) => s.products);

  const newArrivalsList = useMemo(() => {
    if (newArrivals && newArrivals.length > 0) return newArrivals;
    return (products || []).filter((p) => p.isNewArrival);
  }, [newArrivals, products]);

  const sliderRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
    if (!el || !el.children[0]) return;
    const step = el.children[0].offsetWidth + 16; // card width + gap-4
    el.scrollBy({ left: direction === 'left' ? -step : step, behavior: 'smooth' });
  };

  if (newArrivalsList.length === 0) return null;

  const showArrows = canScrollLeft || canScrollRight;

  return (
    <section
      className="relative py-10 sm:py-12 lg:py-14 bg-[#FAF8F5] border-y border-[#EFECE6] overflow-hidden"
      aria-label="New Arrivals collection"
    >
      <ArrivalsBackdrop />

      <div className="relative max-w-site mx-auto px-5 sm:px-8 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">

          {/* ── LEFT: text + button + arrows ── */}
          <div className="lg:col-span-3 flex flex-col items-start min-w-0">
            <SectionHeading eyebrow="NEW SEASON" title="NEW ARRIVALS" align="left" className="mb-5" />

            <motion.p
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="font-montserrat text-neutral-600 text-sm sm:text-[15px] leading-relaxed max-w-xs mb-6"
            >
              <StaggeredText
                as="span"
                text="Discover the latest additions to our collection, featuring fresh styles, modern designs, and must-have pieces carefully selected to elevate your everyday wardrobe"
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.25}
              />
            </motion.p>

            <ButtonReveal delay={0.3}>
              <Link
                to="/products?newArrival=true"
                className="group inline-flex items-center gap-3 rounded-full bg-neutral-950 pl-7 pr-2 py-2 font-montserrat text-sm font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                id="zaro-shop-new-arrivals-btn"
              >
                <span>SHOP NEW ARRIVALS</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight size={16} />
                </span>
              </Link>
            </ButtonReveal>

            {/* Arrows: only when more cards than fit */}
            {showArrows && (
              <div className="hidden lg:flex items-center gap-1.5 mt-auto pt-8">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  disabled={!canScrollLeft}
                  className={arrowBtn(canScrollLeft)}
                  aria-label="Previous products"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  disabled={!canScrollRight}
                  className={arrowBtn(canScrollRight)}
                  aria-label="Next products"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: ProductCard row ── */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-9 min-w-0"
          >
            <div
              ref={sliderRef}
              className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory"
            >
              {newArrivalsList.map((item, idx) => (
                <div
                  key={item.id || item._id || idx}
                  className="snap-start shrink-0 w-[68%] sm:w-[44%] md:w-[31%] lg:w-[calc((100%-3rem)/4)]"
                >
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSection;