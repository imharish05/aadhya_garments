import React from 'react';
import Skeleton from './Skeleton';
import ProductCardSkeleton from './ProductCardSkeleton';

/**
 * Skeleton for the New Arrivals section
 */
export const NewArrivalsSkeleton = ({ className = '' }) => {
  return (
    <section
      className={`relative py-10 sm:py-12 lg:py-14 bg-[#FAF8F5] border-y border-[#EFECE6] overflow-hidden ${className}`}
      aria-label="Loading new arrivals..."
    >
      <div className="relative max-w-site mx-auto px-5 sm:px-8 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Feature Column */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
            <Skeleton gold className="h-4 w-32 rounded-full" />
            <Skeleton className="h-10 sm:h-12 w-4/5 rounded-md" />
            <div className="space-y-2 pt-1 max-w-md">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </div>
            <div className="pt-2">
              <Skeleton dark className="h-11 w-44 rounded-full" />
            </div>
          </div>

          {/* Right Products Slider Track */}
          <div className="lg:col-span-7 flex gap-4 overflow-hidden py-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-[200px] sm:w-[240px] shrink-0">
                <ProductCardSkeleton compactMobile />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivalsSkeleton;
