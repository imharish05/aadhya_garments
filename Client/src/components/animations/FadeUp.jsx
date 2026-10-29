import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * FadeUp — Subtle upward translation + opacity fade on scroll.
 */
export const FadeUp = ({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0.15,
  duration = 0.55,
  yOffset = 18,
  ease = [0.16, 1, 0.3, 1],
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
  const Component = motion[Tag] || motion.div;

  return (
    <Component
      ref={containerRef}
      className={className}
      initial={{ opacity: 0, y: yOffset }}
      animate={
        isVisible
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: yOffset }
      }
      transition={{
        duration,
        delay: isVisible ? delay : 0,
        ease,
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default FadeUp;
