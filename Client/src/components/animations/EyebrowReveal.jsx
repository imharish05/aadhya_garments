import { StaggeredText } from './StaggeredText';

/**
 * EyebrowReveal — Upgraded to use the high-performance StaggeredText engine.
 * Preserves exact props & import path with backwards compatibility.
 */
export const EyebrowReveal = ({
  children,
  text,
  as = 'p',
  className = '',
  delay = 0,
  duration = 0.45,
  direction = 'down',
  trigger,
  viewportThreshold = 0.1,
  once = true,
  margin = '0px',
  ...props
}) => {
  const mappedDirection = direction === 'down' ? 'top' : 'bottom';

  return (
    <StaggeredText
      as={as}
      className={className}
      startDelay={delay}
      duration={duration}
      direction={mappedDirection}
      segmentBy="words"
      blur={false}
      trigger={trigger}
      threshold={viewportThreshold}
      rootMargin={margin === '0px 0px -35px 0px' ? '0px' : margin}
      exitOnScrollOut={!once}
      {...props}
    >
      {text || children}
    </StaggeredText>
  );
};

export default EyebrowReveal;
