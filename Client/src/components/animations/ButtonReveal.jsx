import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * ButtonReveal — Reveals CTA buttons with a restrained entrance and refined hover state.
 */
export const ButtonReveal = ({
  children,
  className = '',
  delay = 0.25,
  duration = 0.5,
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

  return (
    <motion.div
      ref={containerRef}
      className={`inline-block ${className}`}
      initial={{ opacity: 0, y: 14 }}
      animate={
        isVisible
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 14 }
      }
      transition={{
        duration,
        delay: isVisible ? delay : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ButtonReveal;
