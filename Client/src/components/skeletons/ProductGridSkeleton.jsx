import React from 'react';
import ProductCardSkeleton from './ProductCardSkeleton';

/**
 * Responsive Product Grid / Carousel Skeleton
 *
 * @param {number} [count=8] - Number of placeholder cards to render
 * @param {'grid' | 'carousel'} [layout='grid'] - Display as a responsive multi-column grid or horizontal scroll track
 * @param {string} [className=''] - Additional CSS classes
 */
export const ProductGridSkeleton = ({
  count = 8,
  layout = 'grid',
  className = '',
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (layout === 'carousel') {
    return (
      <div
        className={`flex gap-4 md:gap-6 overflow-hidden py-4 px-1 ${className}`}
        role="status"
        aria-label="Loading products..."
      >
        {items.map((i) => (
          <div
            key={i}
            className="w-[calc(50%-8px)] md:w-[calc(33.333%-16px)] lg:w-[calc(20%-15px)] flex-shrink-0"
          >
            <ProductCardSkeleton compactMobile />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5 ${className}`}
      role="status"
      aria-label="Loading products..."
    >
      {items.map((i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
