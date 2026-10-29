import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * EyebrowReveal — Subtle vertical reveal for metadata, badges, and category tags.
 */
export const EyebrowReveal = ({
  children,
  as: Tag = 'p',
  className = '',
  delay = 0,
  duration = 0.45,
  direction = 'down',
  offset = 12,
  trigger,
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
  const initialY = direction === 'down' ? -offset : offset;
  const Component = motion[Tag] || motion.p;

  return (
    <Component
      ref={containerRef}
      className={className}
      initial={{ opacity: 0, y: initialY }}
      animate={
        isVisible
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: initialY }
      }
      transition={{
        duration,
        delay: isVisible ? delay : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default EyebrowReveal;
