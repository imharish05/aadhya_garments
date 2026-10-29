import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

/**
 * ImageReveal — Masked editorial image entrance with restrained scale and opacity.
 */
export const ImageReveal = ({
  children,
  className = '',
  imageClassName = '',
  delay = 0,
  duration = 0.8,
  trigger,
  viewportThreshold = 0.15,
  once = true,
  ...props
}) => {
  const containerRef = useRef(null);
  const inView = useInView(containerRef, {
    once,
    amount: viewportThreshold,
  });
  const prefersReducedMotion = useReducedMotion();

  const isVisible = trigger !== undefined ? Boolean(trigger) : inView;

  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={`overflow-hidden ${className}`} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden relative ${className}`}
      {...props}
    >
      <motion.div
        className={`w-full h-full ${imageClassName}`}
        initial={{ opacity: 0, scale: 1.04, y: 15 }}
        animate={
          isVisible
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 1.04, y: 15 }
        }
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ImageReveal;
