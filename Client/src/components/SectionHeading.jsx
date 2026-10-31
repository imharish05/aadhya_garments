import { motion, useReducedMotion } from 'framer-motion';
import { EyebrowReveal, SplitTextReveal } from './animations';

/**
 * SectionHeading — luxury editorial title block for home sections (New Arrivals, Best Sellers, Category, Story).
 * Features elegant typography, animated expanding divider lines, and a signature diamond ornament.
 */
export const SectionHeading = ({
  eyebrow,
  title,
  align = 'center',
  as = 'h2',
  uppercase = true,
  titleClassName = '',
  className = '',
  children,
}) => {
  const reduce = useReducedMotion();
  const center = align === 'center';

  return (
    <div className={`${center ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && (
        <EyebrowReveal
          className={`mb-2.5 font-montserrat text-xs font-semibold uppercase tracking-[0.28em] text-[#BEA266] ${
            center ? 'mx-auto' : 'inline-flex items-center gap-2'
          }`}
        >
          {eyebrow}
        </EyebrowReveal>
      )}

      <SplitTextReveal
        as={as}
        text={title}
        className={`font-playfair font-semibold tracking-[0.03em] leading-[1.12] text-neutral-950 select-none ${
          center ? 'mx-auto text-2xl sm:text-3xl md:text-4xl lg:text-[40px]' : 'text-3xl sm:text-4xl lg:text-[40px]'
        } ${uppercase ? 'uppercase' : ''} ${titleClassName}`}
      />

      {/* Decorative luxury lines and ornament row */}
      <div
        className={`mt-3.5 flex items-center gap-3 ${
          center ? 'mx-auto max-w-xs sm:max-w-sm justify-center' : 'w-full max-w-[260px]'
        }`}
      >
        {center ? (
          <>
            <motion.span
              aria-hidden="true"
              className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-[#BEA266]/70 to-[#BEA266]"
              style={{ transformOrigin: 'right' }}
              initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
              whileInView={reduce ? { opacity: 1 } : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            />
            <div className="flex shrink-0 items-center gap-1.5 px-0.5" aria-hidden="true">
              <span className="h-1 w-1 rounded-full bg-[#BEA266]" />
              <span className="h-2 w-2 rotate-45 border border-[#BEA266] bg-[#BEA266]/30 shadow-xs" />
              <span className="h-1 w-1 rounded-full bg-[#BEA266]" />
            </div>
            <motion.span
              aria-hidden="true"
              className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-[#BEA266]/70 to-[#BEA266]"
              style={{ transformOrigin: 'left' }}
              initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
              whileInView={reduce ? { opacity: 1 } : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            />
          </>
        ) : (
          <>
            <div className="flex shrink-0 items-center gap-1.5 pr-0.5" aria-hidden="true">
              <span className="h-2 w-2 rotate-45 border border-[#BEA266] bg-[#BEA266]/30 shadow-xs" />
              <span className="h-1 w-1 rounded-full bg-[#BEA266]" />
            </div>
            <motion.span
              aria-hidden="true"
              className="h-[1.5px] flex-1 bg-gradient-to-r from-[#BEA266] via-[#BEA266]/70 to-transparent"
              style={{ transformOrigin: 'left' }}
              initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
              whileInView={reduce ? { opacity: 1 } : { scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            />
          </>
        )}
      </div>

      {children}
    </div>
  );
};

export default SectionHeading;
