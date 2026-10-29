import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * StaggerContainer & StaggerItem — Coordinated staggered reveals for grids and lists on scroll.
 */
export const StaggerContainer = ({
  children,
  className = '',
  staggerDelay = 0.08,
  delayChildren = 0.1,
  trigger,
  viewportThreshold = 0.1,
  once = true,
  margin = '0px 0px -35px 0px',
  as: Tag = 'div',
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
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export const StaggerItem = ({
  children,
  className = '',
  yOffset = 20,
  duration = 0.55,
  ease = [0.16, 1, 0.3, 1],
  as: Tag = 'div',
  ...props
}) => {
  const Component = motion[Tag] || motion.div;

  return (
    <Component
      className={className}
      variants={{
        hidden: { opacity: 0, y: yOffset },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration,
            ease,
          },
        },
      }}
      {...props}
    >
      {children}
    </Component>
  );
};

export default StaggerContainer;
