import { StaggeredText } from './StaggeredText';

/**
 * SplitTextReveal — Upgraded to use the high-performance StaggeredText engine.
 * Preserves exact props & import path with backwards compatibility.
 */
export const SplitTextReveal = ({
  text = '',
  as = 'h2',
  className = '',
  delay = 0,
  stagger = 0.07,
  duration,
  ease,
  trigger,
  viewportThreshold = 0.1,
  once = true,
  margin = '0px',
  direction = 'bottom',
  blur,
  segmentBy,
  ...props
}) => {
  const isHeading = ['h1', 'h2', 'h3'].includes(String(as).toLowerCase());
  const effectiveSegmentBy = segmentBy || (isHeading ? (String(text).length <= 40 ? 'chars' : 'words') : 'words');
  const effectiveDuration = duration !== undefined ? duration : (isHeading ? 0.5 : 0.4);
  const effectiveBlur = blur !== undefined ? blur : isHeading;

  return (
    <StaggeredText
      text={text}
      as={as}
      className={className}
      startDelay={delay}
      delay={stagger * 1000}
      duration={effectiveDuration}
      easing={ease}
      trigger={trigger}
      threshold={viewportThreshold}
      rootMargin={margin === '0px 0px -35px 0px' ? '0px' : margin}
      direction={direction}
      blur={effectiveBlur}
      segmentBy={effectiveSegmentBy}
      exitOnScrollOut={!once}
      {...props}
    />
  );
};

export default SplitTextReveal;
