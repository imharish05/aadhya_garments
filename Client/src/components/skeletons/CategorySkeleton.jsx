import React from 'react';
import Skeleton from './Skeleton';

/**
 * Skeleton for Category Cards and Category Grids
 */
export const CategoryCardSkeleton = ({ className = '' }) => {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden aspect-[3/4] bg-neutral-100 border border-neutral-200/60 shadow-xs ${className}`}
      role="status"
      aria-label="Loading category..."
    >
      <Skeleton className="w-full h-full rounded-none" />
      <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end space-y-2">
        <Skeleton dark className="h-5 w-3/4 rounded" />
        <Skeleton dark gold className="h-3 w-1/3 rounded" />
      </div>
    </div>
  );
};

export const CategoryGridSkeleton = ({ count = 6, className = '' }) => {
  return (
    <section className={`py-12 bg-white ${className}`} aria-label="Loading categories...">
      <div className="max-w-site mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-10 space-y-2 flex flex-col items-center">
          <Skeleton gold className="h-4 w-28 rounded-full" />
          <Skeleton className="h-8 w-60 rounded-md" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(count)].map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default {
  CategoryCardSkeleton,
  CategoryGridSkeleton,
};
