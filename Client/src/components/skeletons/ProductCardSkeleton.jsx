import React from 'react';
import Skeleton from './Skeleton';

/**
 * Skeleton Loader matching the exact visual structure of ProductCard.jsx
 *
 * @param {boolean} [compactMobile=false] - For mobile carousel track cards
 * @param {string} [className=''] - Additional class names
 */
export const ProductCardSkeleton = ({ compactMobile = false, className = '' }) => {
  return (
    <div
      className={`group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xs ${className}`}
      role="status"
      aria-label="Loading product..."
    >
      {/* Product Image Area */}
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#F4EEDD]/60">
        <Skeleton className="w-full h-full rounded-none" />

        {/* Discount badge pill skeleton placeholder */}
        <div className="absolute left-2 top-2">
          <Skeleton gold className="h-4 w-12 rounded-md" />
        </div>

        {/* Wishlist circle button placeholder */}
        <div className="absolute right-2 top-2">
          <Skeleton variant="circular" className="h-8 w-8 bg-white/90 shadow-xs" />
        </div>
      </div>

      {/* Product Details Body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3 space-y-2.5">
        {/* Category / Collection tiny tag */}
        <Skeleton className="h-2.5 w-16 rounded-sm opacity-60" />

        {/* Product Title (2 lines) */}
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-11/12 rounded-sm" />
          <Skeleton className="h-3.5 w-3/4 rounded-sm" />
        </div>

        {/* Star Rating Row */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <Skeleton className="h-3 w-6 rounded-sm" />
          <Skeleton variant="circular" className="h-3 w-3" />
          <Skeleton className="h-3 w-10 rounded-sm opacity-50" />
        </div>

        {/* Pricing Row */}
        <div className="flex items-baseline gap-2 pt-1">
          <Skeleton className="h-4 w-16 rounded-sm" />
          <Skeleton className="h-3 w-12 rounded-sm opacity-40" />
        </div>

        {/* Color Swatches preview dots */}
        <div className="flex items-center gap-1.5 pt-1">
          <Skeleton variant="circular" className="h-3.5 w-3.5" />
          <Skeleton variant="circular" className="h-3.5 w-3.5" />
          <Skeleton variant="circular" className="h-3.5 w-3.5" />
        </div>

        {/* Add to Cart button placeholder */}
        <div className="pt-2 mt-auto">
          <Skeleton className="h-8 sm:h-9 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
