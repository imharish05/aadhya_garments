import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';
import OurStoryImg from '../assets/our story.png';

/**
 * Animated number counter component with smooth deceleration easing and configurable delay
 */
function AnimatedCounter({ end = 15, prefix = '+', duration = 3.2, delay = 550 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setCount(end);
      return;
    }

    let startTimestamp = null;
    let animationFrameId = null;

    const timeoutId = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        // easeOutQuart curve: gentle start that visibly and smoothly decelerates towards the final number
        const eased = 1 - Math.pow(1 - progress, 4);
        const currentVal = Math.min(Math.floor(eased * (end + 0.99)), end);

        setCount(currentVal);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(end);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [inView, end, duration, delay, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count}
    </span>
  );
}

/**
 * Animated Progress Bar with synchronized smooth fill and animated percentage count-up
 */
function ProgressBar({ label, percentage, delay = 0, duration = 2.4 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplayPercent(percentage);
      return;
    }

    let startTimestamp = null;
    let animationFrameId = null;

    const timeoutId = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const progress = Math.min(elapsed / (duration * 1000), 1);

        // easeOutCubic curve for smooth progress fill
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.min(Math.round(eased * percentage), percentage);

        setDisplayPercent(currentVal);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDisplayPercent(percentage);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay * 1000);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [inView, percentage, duration, delay, reduce]);

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex justify-between items-center text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 font-montserrat">
        <span>{label}</span>
        <span className="text-[#BEA266] font-bold tabular-nums">{displayPercent}%</span>
      </div>
      <div className="w-full h-[6px] bg-neutral-100 rounded-full overflow-hidden p-[1px] border border-neutral-200/60">
        <motion.div
          className="h-full bg-gradient-to-r from-neutral-900 via-neutral-950 to-[#BEA266] rounded-full"
          initial={{ width: 0 }}
          animate={inView ? { width: `${percentage}%` } : { width: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration, delay, ease: [0.16, 1, 0.3, 1] }
          }
        />
      </div>
    </div>
  );
}

/**
 * AboutTeaser — Our Story section inspired by the Radiuss signature aesthetic:
 * - Fluid rounded image container with inverted curved badge cutouts (Top-Left & Bottom-Right)
 * - Smooth, stately animated sliding entry badges (slideInDown & slideInUp)
 * - Elegantly eased number counter (+15 Years of Craftsmanship)
 * - Editorial typography + "Our Story" subtitle
 * - Gracefully paced animated luxury quality progress bars with synchronized percentage count
 */
const AboutTeaser = () => {
  const reduce = useReducedMotion();
  const { items: allBanners } = useSelector((s) => s.banners);

  const aboutBanner = useMemo(() => {
    return (allBanners || []).find((b) => b.type === 'ABOUT' && b.isActive !== false);
  }, [allBanners]);

  const storyImage = aboutBanner?.image ? getImageUrl(aboutBanner.image) : OurStoryImg;
  const title = aboutBanner?.title?.trim() || 'Twin A';
  const subtitle = aboutBanner?.subtitle?.trim() || 'Our Story';

  const counterValue = useMemo(() => {
    if (!aboutBanner?.badgeText) return 15;
    const match = aboutBanner.badgeText.match(/\d+/);
    return match ? parseInt(match[0], 10) : 15;
  }, [aboutBanner?.badgeText]);

  const counterLabel = useMemo(() => {
    if (!aboutBanner?.badgeText) return 'Years of Craftsmanship';
    const textWithoutNum = aboutBanner.badgeText.replace(/[+\d\s]/g, ' ').trim();
    return textWithoutNum || 'Years of Craftsmanship';
  }, [aboutBanner?.badgeText]);

  const parsedData = useMemo(() => {
    if (!aboutBanner?.description) return null;
    try {
      const parsed = JSON.parse(aboutBanner.description);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (e) {}
    return null;
  }, [aboutBanner?.description]);

  const paragraphs = useMemo(() => {
    const rawText = parsedData?.text !== undefined ? parsedData.text : aboutBanner?.description;
    if (rawText?.trim()) {
      return rawText.split(/\n\s*\n/).filter(Boolean);
    }
    return [
      'Twin A Apparels is a Coimbatore-rooted fashion label dedicated to crafting authentic, contemporary garments for the whole family. Every stitch reflects our commitment to intentional silhouettes, breathable fabrics, and effortless elegance.',
      'From everyday modern essentials to festive occasion wear, our collections harmonize South India’s rich textile heritage with clean contemporary design.'
    ];
  }, [parsedData, aboutBanner?.description]);

  const qualityMetrics = useMemo(() => {
    if (Array.isArray(parsedData?.metrics) && parsedData.metrics.length > 0) {
      return parsedData.metrics;
    }
    return [
      { label: 'Premium Fabric Quality', percentage: 95 },
      { label: 'Artisanal Finishing & Fit', percentage: 90 },
      { label: 'Customer Loyalty & Trust', percentage: 98 },
    ];
  }, [parsedData]);

  const ctaText = aboutBanner?.ctaText?.trim() || 'Discover Our Heritage';
  const ctaLink = aboutBanner?.ctaLink?.trim() || '/about';

  return (
    <section
      className="relative py-14 sm:py-20 lg:py-24 bg-white overflow-hidden"
      aria-label="About Twin A Apparels — Our Story"
    >
      <div className="max-w-site mx-auto px-5 sm:px-8 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* ── LEFT: Radiuss-style Curved Image with Inverted Badge Cutouts ── */}
          <div className="lg:col-span-6 relative">
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full h-[440px] sm:h-[500px] lg:h-[540px] rounded-[30px] sm:rounded-[34px] overflow-hidden"
            >
              {/* Background Fashion / Craftsmanship Image */}
              <img
                src={storyImage}
                alt={`${title} Craftsmanship and Heritage`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
              />

              {/* ── TOP-LEFT BADGE: "Explore Story" with Inverted Corner Curves (smooth slideInDown) ── */}
              <motion.div
                initial={reduce ? { opacity: 0 } : { y: -50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-0 left-0 bg-white pt-4 pb-3.5 px-6 sm:px-7 rounded-br-[26px] z-10"
              >
                <Link
                  to={ctaLink}
                  className="group/btn inline-flex items-center gap-2.5 text-[11px] sm:text-xs font-bold tracking-[0.18em] uppercase text-neutral-950 hover:text-[#BEA266] transition-colors font-montserrat"
                >
                  <span>Explore Story</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-white transition-all duration-300 group-hover/btn:bg-brand-gold group-hover/btn:text-black group-hover/btn:translate-x-0.5">
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </span>
                </Link>

                {/* Inverted negative-space rounded corners */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-full left-0 h-[48px] w-[48px] rounded-full"
                  style={{ boxShadow: '-24px -24px 0 0 #ffffff' }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-full h-[48px] w-[48px] rounded-full"
                  style={{ boxShadow: '-24px -24px 0 0 #ffffff' }}
                />
              </motion.div>

              {/* ── BOTTOM-RIGHT BADGE: Counter & Experience with Inverted Corner Curves (smooth slideInUp) ── */}
              <motion.div
                initial={reduce ? { opacity: 0 } : { y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 1.1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 right-0 bg-white pt-5 pb-4 px-6 sm:px-8 rounded-tl-[26px] z-10"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full right-0 h-[48px] w-[48px] rounded-full"
                  style={{ boxShadow: '24px 24px 0 0 #ffffff' }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-0 right-full h-[48px] w-[48px] rounded-full"
                  style={{ boxShadow: '24px 24px 0 0 #ffffff' }}
                />

                <div className="flex items-center gap-3.5">
                  <div className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-light text-neutral-950 tracking-tight leading-none">
                    <AnimatedCounter end={counterValue} prefix="+" duration={3.4} delay={650} />
                  </div>
                  <div className="font-montserrat text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-800 leading-tight max-w-[110px]">
                    {counterLabel}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* ── RIGHT: Agency / Our Story Typography & Animated Progress Bars ── */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Display Top Label */}
            <motion.h2
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.95, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-black text-neutral-950 tracking-tight leading-[0.95] mb-1.5"
            >
              {title}
            </motion.h2>

            {/* Stylized Subtitle: "Our Story" */}
            <motion.h3
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.95, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="font-playfair text-2xl sm:text-3xl lg:text-[38px] font-light text-neutral-800 tracking-wide mb-4"
            >
              {subtitle}
            </motion.h3>

            {/* Luxury Line Ornament with smooth expansion */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.0, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className="flex items-center gap-3 w-full max-w-[220px] mb-6"
              aria-hidden="true"
            >
              <span className="h-[2px] w-12 bg-neutral-950" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[#BEA266]" />
              <span className="h-[1.5px] flex-1 bg-gradient-to-r from-[#BEA266] to-transparent" />
            </motion.div>

            {/* Body Descriptions */}
            {paragraphs.map((para, idx) => (
              <motion.p
                key={`story-para-${idx}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.95, delay: 0.55 + idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={`font-montserrat text-neutral-600 text-sm sm:text-[15px] leading-relaxed ${idx === paragraphs.length - 1 ? 'mb-8' : 'mb-4'}`}
              >
                {para}
              </motion.p>
            ))}

            {/* Animated Quality Progress Bars */}
            <div className="space-y-4 sm:space-y-5 mb-8">
              {qualityMetrics.map((metric, idx) => (
                <ProgressBar
                  key={`metric-${idx}-${metric.label}`}
                  label={metric.label}
                  percentage={Number(metric.percentage) || 0}
                  delay={0.85 + idx * 0.25}
                  duration={2.4}
                />
              ))}
            </div>

            {/* CTA Button */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.95, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                to={ctaLink}
                className="group inline-flex items-center gap-3 rounded-full bg-neutral-950 px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:bg-brand-gold hover:text-black focus:outline-none"
              >
                <span className="transition-colors group-hover:text-black">{ctaText}</span>
                <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:text-black" />
              </Link>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutTeaser;
