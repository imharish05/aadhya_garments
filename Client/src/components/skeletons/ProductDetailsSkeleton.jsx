import React from 'react';
import Skeleton from './Skeleton';

/**
 * Skeleton Loader matching ProductDetailsPage.jsx
 */
export const ProductDetailsSkeleton = ({ className = '' }) => {
  return (
    <div className={`max-w-site mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12 ${className}`} role="status" aria-label="Loading product details...">
      {/* Breadcrumbs placeholder */}
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-3 w-12 rounded" />
        <span className="text-neutral-300">/</span>
        <Skeleton className="h-3 w-20 rounded" />
        <span className="text-neutral-300">/</span>
        <Skeleton className="h-3 w-32 rounded" />
      </div>

      {/* Main Product Layout (2 columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-14 items-start">
        {/* Left Column: Product Imagery */}
        <div className="space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#FAF8F5] border border-neutral-200/80 shadow-xs">
            <Skeleton className="w-full h-full rounded-none" />
            <div className="absolute right-3 bottom-3">
              <Skeleton variant="circular" className="h-9 w-9 bg-white/80 shadow" />
            </div>
          </div>

          {/* Thumbnail Gallery Row */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-neutral-200 shrink-0 bg-neutral-100"
              >
                <Skeleton className="w-full h-full rounded-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Product Info & Commerce Actions */}
        <div className="space-y-6 pt-2">
          {/* Brand Eyebrow & Title */}
          <div className="space-y-2.5">
            <Skeleton gold className="h-4 w-28 rounded-full" />
            <Skeleton className="h-8 sm:h-10 w-4/5 rounded-md" />
            <Skeleton className="h-6 sm:h-7 w-3/5 rounded-md" />
          </div>

          {/* Ratings & Reviews summary */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <span className="text-neutral-200">|</span>
            <Skeleton className="h-4 w-20 rounded" />
          </div>

          {/* Pricing Row */}
          <div className="flex items-baseline gap-3 py-2 border-y border-neutral-100">
            <Skeleton className="h-8 w-28 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md opacity-40" />
            <Skeleton gold className="h-5 w-16 rounded-full" />
          </div>

          {/* Color Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <div className="flex items-center gap-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="circular" className="h-9 w-9 border-2 border-white shadow-xs" />
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton gold className="h-3 w-20 rounded" />
            </div>
            <div className="flex items-center gap-2.5">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-12 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Quantity and CTA Buttons */}
          <div className="space-y-3 pt-3">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-32 rounded-xl" />
              <Skeleton gold className="h-12 flex-1 rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl bg-neutral-900" dark />
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-neutral-100">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <Skeleton variant="circular" className="h-6 w-6" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>

          {/* Description Snippet */}
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-11/12 rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;
