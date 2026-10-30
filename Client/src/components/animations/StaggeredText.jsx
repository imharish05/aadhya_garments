import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';

/**
 * Global Shared IntersectionObserver Registry
 * Reuses one IntersectionObserver per unique (threshold, rootMargin) combination.
 */
const observerRegistry = new Map();

function getSharedObserver(threshold = 0.1, rootMargin = '0px') {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null;
  }
  const key = `${threshold}_${rootMargin}`;
  if (!observerRegistry.has(key)) {
    const callbacks = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const cb = callbacks.get(entry.target);
        if (cb) {
          cb(entry);
        }
      });
    }, { threshold, rootMargin });

    observerRegistry.set(key, { observer, callbacks });
  }
  return observerRegistry.get(key);
}

function observeElement(el, threshold, rootMargin, callback) {
  const shared = getSharedObserver(threshold, rootMargin);
  if (!shared) {
    // Fallback if IntersectionObserver is unsupported
    callback({
      isIntersecting: true,
      boundingClientRect: el.getBoundingClientRect(),
      instant: true,
    });
    return () => {};
  }

  shared.callbacks.set(el, callback);
  shared.observer.observe(el);

  return () => {
    shared.callbacks.delete(el);
    try {
      shared.observer.unobserve(el);
    } catch {
      // Safe no-op
    }
  };
}

/**
 * Device capability & performance checks
 * Disables blur on mobile (<768px), low core machines (<=4 cores), or segment count > 80.
 */
function isLowEndOrMobile() {
  if (typeof window === 'undefined') return false;
  if (window.innerWidth < 768) return true;
  if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) {
    return true;
  }
  return false;
}

function checkReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const DIRECTION_OFFSETS = {
  bottom: { y: '0.12em', x: 0 },
  top: { y: '-0.12em', x: 0 },
  left: { x: '-0.12em', y: 0 },
  right: { x: '0.12em', y: 0 },
};

/**
 * Line splitting utility using Range.getClientRects()
 */
function splitIntoMeasuredLines(el, text) {
  if (!el || typeof document === 'undefined') return [text];
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];

  const tempSpan = document.createElement('span');
  tempSpan.style.visibility = 'hidden';
  tempSpan.style.position = 'absolute';
  tempSpan.style.pointerEvents = 'none';
  el.appendChild(tempSpan);

  const lines = [];
  let currentLine = [];
  let lastTop = null;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordNode = document.createTextNode((i === 0 ? '' : ' ') + word);
    tempSpan.appendChild(wordNode);
    const rects = tempSpan.getClientRects();
    if (rects.length > 0) {
      const top = rects[rects.length - 1].top;
      if (lastTop === null) {
        lastTop = top;
      } else if (Math.abs(top - lastTop) > 3) {
        lines.push(currentLine.join(' '));
        currentLine = [];
        lastTop = top;
      }
    }
    currentLine.push(word);
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }

  try {
    el.removeChild(tempSpan);
  } catch {
    // Ignore cleanup error
  }

  return lines.length > 0 ? lines : [text];
}

/**
 * StaggeredText — High-performance, scroll-safe editorial staggered text reveal.
 */
export const StaggeredText = ({
  text: rawText,
  children,
  className = '',
  as: Tag = 'p',
  segmentBy,
  separator,
  delay = 80, // ms between segments
  duration = 0.5, // seconds per segment
  startDelay, // seconds section delay offset (optional)
  easing,
  threshold = 0.1,
  rootMargin = '0px',
  direction = 'bottom',
  blur = true,
  staggerDirection = 'forward',
  respectReducedMotion = true,
  exitOnScrollOut = false,
  from,
  to,
  onAnimationComplete,
  onExitComplete,
  // Backward compatibility props:
  stagger,
  viewportThreshold,
  margin,
  trigger,
  ...restProps
}) => {
  const containerRef = useRef(null);

  // Normalize text input from props or children
  const stringContent = useMemo(() => {
    if (rawText !== undefined && rawText !== null) return String(rawText);
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) {
      const joined = children.map(c => (typeof c === 'string' ? c : '')).join('');
      if (joined.trim()) return joined;
    }
    return '';
  }, [rawText, children]);

  // Handle prop aliases
  const activeThreshold = viewportThreshold !== undefined ? viewportThreshold : threshold;
  const activeMargin = margin !== undefined ? margin : rootMargin;
  const segmentDelayMs = stagger !== undefined ? stagger * 1000 : delay;
  const baseStartDelaySec = startDelay !== undefined ? startDelay : 0.1; // Default 100ms start

  const [hasInteracted, setHasInteracted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstant, setIsInstant] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [measuredLines, setMeasuredLines] = useState(null);

  // Determine reduced motion preference
  const isReduced = useMemo(() => {
    return respectReducedMotion && checkReducedMotion();
  }, [respectReducedMotion]);

  // Determine effective segmentation mode
  const effectiveSegmentBy = useMemo(() => {
    const len = stringContent.length;
    if (segmentBy === 'lines' || separator) return 'lines';

    if (segmentBy) {
      if (segmentBy === 'chars') {
        if (len > 60) return 'words';
        return 'chars';
      }
      if (segmentBy === 'words') {
        if (len > 200) return 'block';
        return 'words';
      }
      return segmentBy;
    }

    // Auto-selection based on tag and character count
    const isHeading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(String(Tag).toLowerCase());
    if (isHeading && len <= 40) {
      return 'chars';
    }
    if (len <= 200) {
      return 'words';
    }
    return 'block';
  }, [segmentBy, separator, stringContent.length, Tag]);

  // Measure lines when segmentBy is 'lines'
  useEffect(() => {
    if (effectiveSegmentBy !== 'lines' || separator || !stringContent) return;

    let resizeTimer = null;
    let prevWidth = 0;

    const measure = () => {
      if (!containerRef.current) return;
      const curWidth = containerRef.current.clientWidth;
      if (curWidth === prevWidth && measuredLines !== null) return;
      prevWidth = curWidth;
      const lines = splitIntoMeasuredLines(containerRef.current, stringContent);
      setMeasuredLines(lines);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    } else {
      measure();
    }

    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    }

    return () => {
      clearTimeout(resizeTimer);
      ro.disconnect();
    };
  }, [effectiveSegmentBy, separator, stringContent, measuredLines]);

  // Split content into structured tokens
  const tokens = useMemo(() => {
    if (!stringContent) return [];

    if (effectiveSegmentBy === 'block') {
      return [{ type: 'block', content: stringContent }];
    }

    if (effectiveSegmentBy === 'lines') {
      if (separator) {
        return stringContent.split(separator).filter(Boolean).map(line => ({ type: 'line', content: line }));
      }
      if (measuredLines && measuredLines.length > 0) {
        return measuredLines.map(line => ({ type: 'line', content: line }));
      }
      return [{ type: 'line', content: stringContent }];
    }

    if (effectiveSegmentBy === 'words') {
      const words = stringContent.trim().split(/\s+/).filter(Boolean);
      return words.map(w => ({ type: 'word', content: w }));
    }

    // Default 'chars' — words containing individual character tokens
    const words = stringContent.split(/(\s+)/).filter(Boolean);
    const result = [];
    let charIndex = 0;

    words.forEach((word) => {
      if (/^\s+$/.test(word)) {
        result.push({ type: 'space', content: word });
      } else {
        const chars = Array.from(word).map((char) => ({
          type: 'char',
          content: char,
          index: charIndex++,
        }));
        result.push({ type: 'wordGroup', chars, content: word });
      }
    });

    return result;
  }, [stringContent, effectiveSegmentBy, separator, measuredLines]);

  // Compute total segment count for staggering calculation
  const totalSegments = useMemo(() => {
    if (tokens.length === 0) return 1;
    if (effectiveSegmentBy === 'chars') {
      let count = 0;
      tokens.forEach(t => {
        if (t.type === 'wordGroup') count += t.chars.length;
      });
      return Math.max(count, 1);
    }
    return tokens.filter(t => t.type !== 'space').length;
  }, [tokens, effectiveSegmentBy]);

  // Hardware and viewport blur optimization
  const effectiveBlur = useMemo(() => {
    if (!blur || isReduced) return false;
    if (totalSegments > 80) return false;
    return !isLowEndOrMobile();
  }, [blur, isReduced, totalSegments]);

  // Cap total stagger time to ~1.0 s for long text
  const effectiveDelayMs = useMemo(() => {
    return Math.min(segmentDelayMs, 900 / Math.max(totalSegments, 1));
  }, [segmentDelayMs, totalSegments]);

  // Trigger animation or instant reveal
  const markVisible = useCallback((instant = false) => {
    if (instant || isReduced) {
      setIsInstant(true);
      setIsVisible(true);
      setIsAnimating(false);
      if (onAnimationComplete) onAnimationComplete();
      return;
    }

    setIsVisible(true);
    setIsAnimating(true);
  }, [isReduced, onAnimationComplete]);

  // Handle intersection and trigger state
  useEffect(() => {
    if (trigger !== undefined) {
      if (trigger) markVisible();
      else if (exitOnScrollOut) {
        setIsVisible(false);
        setIsAnimating(false);
        if (onExitComplete) onExitComplete();
      }
      return;
    }

    if (!containerRef.current) return;
    if (isReduced) {
      markVisible(true);
      return;
    }

    const node = containerRef.current;

    const onIntersect = (entry) => {
      if (entry.isIntersecting) {
        setHasInteracted(true);
        // Fast scroll check: if element is already scrolled past viewport top
        const isPast = entry.boundingClientRect.bottom < 0;

        // Preloader coordination: wait if preloader is currently active
        const isPreloaderActive = typeof window !== 'undefined' && window.__preloaderActive;
        if (isPreloaderActive && !isPast) {
          const onPreloaderDone = () => {
            window.removeEventListener('app:preloader-done', onPreloaderDone);
            markVisible(false);
          };
          window.addEventListener('app:preloader-done', onPreloaderDone);
          return;
        }

        markVisible(isPast);
      } else if (exitOnScrollOut && hasInteracted) {
        setIsVisible(false);
        setIsAnimating(false);
        if (onExitComplete) onExitComplete();
      }
    };

    const cleanup = observeElement(node, activeThreshold, activeMargin, onIntersect);

    // Fail-safe 1: Document visibility or print
    const onVisibilityOrPrint = () => markVisible(true);
    window.addEventListener('beforeprint', onVisibilityOrPrint);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const rect = node.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          markVisible(true);
        }
      }
    });

    // Fail-safe 2: 2.5s timer fallback ensures text is never stuck invisible
    const failSafeTimer = setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        markVisible(true);
      }
    }, 2500);

    return () => {
      cleanup();
      clearTimeout(failSafeTimer);
      window.removeEventListener('beforeprint', onVisibilityOrPrint);
    };
  }, [trigger, isReduced, activeThreshold, activeMargin, exitOnScrollOut, hasInteracted, markVisible, onExitComplete]);

  // Compute staggered delay for an index
  const getSegmentDelay = useCallback((orderIdx) => {
    if (isInstant || !isVisible) return 0;
    let rank = orderIdx;
    if (staggerDirection === 'reverse') {
      rank = totalSegments - 1 - orderIdx;
    } else if (staggerDirection === 'center') {
      rank = Math.abs(orderIdx - (totalSegments - 1) / 2);
    }
    return baseStartDelaySec + (rank * effectiveDelayMs) / 1000;
  }, [isInstant, isVisible, staggerDirection, totalSegments, baseStartDelaySec, effectiveDelayMs]);

  // Initial and target animation properties
  const offset = DIRECTION_OFFSETS[direction] || DIRECTION_OFFSETS.bottom;

  const defaultInitial = useMemo(() => ({
    opacity: 0,
    x: offset.x,
    y: offset.y,
    filter: effectiveBlur ? 'blur(10px)' : 'blur(0px)',
  }), [offset, effectiveBlur]);

  const defaultAnimate = useMemo(() => ({
    opacity: 1,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
  }), []);

  const activeInitial = from || defaultInitial;
  const activeAnimate = to || defaultAnimate;

  // Custom animation completion callback
  const handleComplete = useCallback(() => {
    setIsAnimating(false);
    if (onAnimationComplete) onAnimationComplete();
  }, [onAnimationComplete]);

  // Render plain content for screen readers / reduced motion
  if (isReduced) {
    return (
      <Tag ref={containerRef} className={className} {...restProps}>
        {stringContent || children}
      </Tag>
    );
  }

  // Segment transition config
  const createTransition = (orderIdx) => {
    if (isInstant) return { duration: 0 };
    const segDelay = getSegmentDelay(orderIdx);
    return {
      opacity: { duration, ease: 'easeOut', delay: segDelay },
      x: { duration, ease: easing || [0.22, 1, 0.36, 1], delay: segDelay },
      y: { duration, ease: easing || [0.22, 1, 0.36, 1], delay: segDelay },
      filter: { duration: duration * 0.7, ease: 'easeOut', delay: segDelay },
    };
  };

  const willChangeStyle = isAnimating ? { willChange: 'transform, opacity, filter' } : { willChange: 'auto' };

  return (
    <Tag ref={containerRef} className={`relative ${className}`} {...restProps}>
      {/* Screen reader accessible full text */}
      <span className="sr-only">{stringContent}</span>

      {/* Masked / staggered visual container */}
      <span aria-hidden="true" className="inline">
        {effectiveSegmentBy === 'chars' && tokens.map((item, i) => {
          if (item.type === 'space') {
            return <span key={`space-${i}`}> </span>;
          }
          if (item.type === 'wordGroup') {
            return (
              <span key={`wg-${i}`} className="inline-block whitespace-nowrap">
                {item.chars.map((ch) => {
                  const isLastChar = ch.index === totalSegments - 1;
                  return (
                    <motion.span
                      key={`ch-${ch.index}`}
                      className="inline-block"
                      style={willChangeStyle}
                      initial={activeInitial}
                      animate={isVisible ? activeAnimate : activeInitial}
                      transition={createTransition(ch.index)}
                      onAnimationComplete={isLastChar ? handleComplete : undefined}
                    >
                      {ch.content}
                    </motion.span>
                  );
                })}
              </span>
            );
          }
          return null;
        })}

        {(effectiveSegmentBy === 'words' || effectiveSegmentBy === 'lines') && tokens.map((item, i) => {
          const isLast = i === tokens.length - 1;
          const isLine = item.type === 'line';
          return (
            <React.Fragment key={`seg-${i}`}>
              <motion.span
                className={isLine ? 'block' : 'inline-block whitespace-nowrap'}
                style={willChangeStyle}
                initial={activeInitial}
                animate={isVisible ? activeAnimate : activeInitial}
                transition={createTransition(i)}
                onAnimationComplete={isLast ? handleComplete : undefined}
              >
                {item.content}
              </motion.span>
              {!isLine && !isLast && <span> </span>}
            </React.Fragment>
          );
        })}

        {effectiveSegmentBy === 'block' && (
          <motion.span
            className="inline-block"
            style={willChangeStyle}
            initial={activeInitial}
            animate={isVisible ? activeAnimate : activeInitial}
            transition={createTransition(0)}
            onAnimationComplete={handleComplete}
          >
            {stringContent}
          </motion.span>
        )}
      </span>
    </Tag>
  );
};

export default StaggeredText;
