import React from 'react';

/**
 * Primitive Skeleton component with luxury shimmering effect.
 *
 * @param {string} [variant='rectangular'] - 'text' | 'rectangular' | 'circular'
 * @param {boolean} [dark=false] - Use dark Obsidian theme shimmer (for dark banners/headers)
 * @param {boolean} [gold=false] - Use champagne/gold sheen highlight
 * @param {string} [className=''] - Additional Tailwind CSS classes
 * @param {object} [style={}] - Inline styles
 */
export const Skeleton = ({
  variant = 'rectangular',
  dark = false,
  gold = false,
  className = '',
  style = {},
  ...props
}) => {
  const variantClass =
    variant === 'circular'
      ? 'rounded-full'
      : variant === 'text'
      ? 'rounded-sm h-4'
      : 'rounded-md';

  const themeClass = dark
    ? 'skeleton-dark'
    : gold
    ? 'skeleton-gold'
    : 'skeleton';

  return (
    <div
      role="status"
      aria-label="Loading content..."
      className={`${themeClass} ${variantClass} ${className}`}
      style={style}
      {...props}
    />
  );
};

export default Skeleton;
