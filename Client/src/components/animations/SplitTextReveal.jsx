import { useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * SplitTextReveal — Masked upward editorial text reveal.
 * Splits text into words wrapped in overflow-hidden clipping spans.
 * Reliably triggers on scroll into view with customizable margin and threshold.
 * Accessible for screen readers.
 */
export const SplitTextReveal = ({
  text = '',
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 0.07,
  duration = 0.75,
  ease = [0.16, 1, 0.3, 1],
  trigger, // boolean override if controlled manually
  viewportThreshold = 0.1,
  once = true,
  margin = '0px 0px -35px 0px',
  ...props
}) => {
  const containerRef = useRef(null);
  const inView = useInView(containerRef, {
    once,
    amount: viewportThreshold,
    margin,
  });

  const isVisible = trigger !== undefined ? Boolean(trigger) : inView;

  const words = useMemo(() => {
    if (typeof text !== 'string') return [String(text || '')];
    return text.trim().split(/\s+/).filter(Boolean);
  }, [text]);

  return (
    <Tag ref={containerRef} className={`relative ${className}`} {...props}>
      {/* Screen reader accessible full title */}
      <span className="sr-only">{text}</span>

      {/* Visual masked word reveal */}
      <span aria-hidden="true" className="inline-block">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="inline-block overflow-hidden align-top mr-[0.24em] last:mr-0 pb-[0.08em]"
          >
            <motion.span
              className="inline-block will-change-transform transform-gpu"
              initial={{ y: '115%', opacity: 0 }}
              animate={
                isVisible
                  ? { y: '0%', opacity: 1 }
                  : { y: '115%', opacity: 0 }
              }
              transition={{
                duration,
                delay: isVisible ? delay + index * stagger : 0,
                ease,
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
};

export default SplitTextReveal;
