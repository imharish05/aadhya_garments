import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Motifs — abstract decorative art inspired by saree borders and temple arches.
 * Flat gold line work only. No gradients.
 */

/** Full-width woven-border strip. Use between home sections. */
export const MotifDivider = ({ className = '', color = '#BEA266' }) => {
  const id = useId().replace(/:/g, '');
  return (
    <div className={`w-full overflow-hidden py-5 md:py-7 ${className}`} aria-hidden="true">
      <svg width="100%" height="28" className="block">
        <defs>
          <pattern id={id} width="56" height="28" patternUnits="userSpaceOnUse">
            {/* diamond */}
            <path d="M28 3 L41 14 L28 25 L15 14 Z" fill="none" stroke={color} strokeWidth="1.4" />
            <path d="M28 9 L35 14 L28 19 L21 14 Z" fill={color} />
            {/* side dots */}
            <circle cx="4" cy="14" r="2" fill={color} />
            <circle cx="52" cy="14" r="2" fill={color} />
            {/* tiny ticks */}
            <path d="M0 1.5 H56 M0 26.5 H56" stroke={color} strokeWidth="0.8" strokeDasharray="3 5" />
          </pattern>
        </defs>
        <rect width="100%" height="28" fill={`url(#${id})`} />
      </svg>
    </div>
  );
};

/** Concentric arch outline (temple doorway). Position with className. */
export const ArchRings = ({ className = '', color = '#BEA266' }) => (
  <svg viewBox="0 0 200 240" className={className} fill="none" stroke={color} strokeWidth="1.5" aria-hidden="true">
    <path d="M10 240 V100 a90 90 0 0 1 180 0 V240" />
    <path d="M30 240 V100 a70 70 0 0 1 140 0 V240" />
    <path d="M50 240 V100 a50 50 0 0 1 100 0 V240" />
    <circle cx="100" cy="100" r="12" fill={color} stroke="none" />
  </svg>
);

/** Scattered dots + petal flower. */
export const Bloom = ({ className = '', color = '#DFC481' }) => (
  <svg viewBox="0 0 120 120" className={className} fill="none" stroke={color} strokeWidth="1.4" aria-hidden="true">
    {[0, 45, 90, 135].map(r => (
      <ellipse key={r} cx="60" cy="60" rx="10" ry="42" transform={`rotate(${r} 60 60)`} />
    ))}
    <circle cx="60" cy="60" r="6" fill={color} stroke="none" />
  </svg>
);

/**
 * ArrivalsBackdrop — mild abstract background for the New Arrivals section.
 * Soft tonal circles + flowing fabric-fold curves + hairline gold threads.
 * Flat fills only (no gradients), very low contrast so cards and text stay the focus.
 * Place inside a `relative overflow-hidden` section; it fills the section behind content.
 */
export const ArrivalsBackdrop = ({ className = '' }) => {
  const reduce = useReducedMotion();
  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, amount: 0.1 },
        transition: { duration: 1.4, ease: 'easeOut' },
      };
  return (
    <motion.svg
      viewBox="0 0 1440 620"
      preserveAspectRatio="xMidYMid slice"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      fill="none"
      aria-hidden="true"
      role="presentation"
      {...fade}
    >
      {/* soft tonal circles */}
      <circle cx="150" cy="330" r="270" fill="#F4EFE5" />
      <circle cx="1350" cy="40" r="190" fill="#F4EFE5" />
      <circle cx="1230" cy="590" r="120" fill="#F1EBDF" />

      {/* flowing fabric folds */}
      <path d="M0 470 C 220 380, 420 560, 700 470 S 1180 380, 1440 470 V620 H0 Z" fill="#F1ECE1" />
      <path d="M0 540 C 260 470, 480 610, 760 540 S 1200 470, 1440 545 V620 H0 Z" fill="#EDE6D8" />

      {/* hairline gold threads */}
      <circle cx="150" cy="330" r="330" stroke="#BEA266" strokeOpacity="0.28" strokeWidth="1" />
      <path d="M0 440 C 240 350, 440 530, 720 440 S 1200 350, 1440 440" stroke="#BEA266" strokeOpacity="0.35" strokeWidth="1" />
      <path d="M0 505 C 270 440, 490 580, 770 505 S 1210 440, 1440 510" stroke="#BEA266" strokeOpacity="0.22" strokeWidth="1" strokeDasharray="2 8" strokeLinecap="round" />
    </motion.svg>
  );
};