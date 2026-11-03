import React from 'react';
import Skeleton from './Skeleton';

/**
 * Skeleton for My Orders list cards
 */
export const OrdersListSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading orders...">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4"
        >
          {/* Header row: Order # and Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-3 w-28 rounded opacity-60" />
            </div>
            <Skeleton gold className="h-6 w-24 rounded-full" />
          </div>

          {/* Body: Product thumbnail and info */}
          <div className="flex items-center gap-4 py-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100">
              <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/3 rounded opacity-60" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>

          {/* Footer: Total and Action */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Order Details page
 */
export const OrderDetailSkeleton = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label="Loading order details...">
      {/* Top Banner / Order summary */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-44 rounded-md" />
            <Skeleton className="h-3.5 w-32 rounded opacity-60" />
          </div>
          <Skeleton gold className="h-7 w-28 rounded-full" />
        </div>

        {/* Timeline Progress Tracker */}
        <div className="py-4">
          <Skeleton className="h-2 w-full rounded-full mb-4" />
          <div className="flex justify-between">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton variant="circular" className="h-4 w-4" />
                <Skeleton className="h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Shipping and Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3.5 w-44 rounded" />
            <Skeleton className="h-3 w-full rounded opacity-70" />
            <Skeleton className="h-3 w-3/4 rounded opacity-70" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-xs space-y-3">
          <Skeleton className="h-4 w-36 rounded" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-3 w-40 rounded opacity-70" />
          </div>
        </div>
      </div>

      {/* Ordered Items Table / List */}
      <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
        <Skeleton className="h-5 w-40 rounded" />
        <div className="divide-y divide-neutral-100">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="py-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100">
                <Skeleton className="w-full h-full rounded-none" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/5 rounded" />
                <Skeleton className="h-3 w-28 rounded opacity-60" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Returns & Refunds list
 */
export const ReturnsListSkeleton = ({ count = 2, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading returns...">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-neutral-200/80 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded opacity-60" />
            </div>
            <Skeleton gold className="h-6 w-24 rounded-full" />
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100">
              <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-1/3 rounded opacity-60" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for Return Detail tracking
 */
export const ReturnDetailSkeleton = ({ className = '' }) => {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label="Loading return details...">
      <div className="bg-white rounded-xl border border-neutral-200/80 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3 w-28 rounded opacity-60" />
          </div>
          <Skeleton gold className="h-6 w-28 rounded-full" />
        </div>
        <div className="py-4 space-y-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-20 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton for Saved Addresses list
 */
export const SavedAddressSkeleton = ({ count = 2, className = '' }) => {
  return (
    <div className={`grid gap-4 lg:grid-cols-2 ${className}`} role="status" aria-label="Loading addresses...">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-xs space-y-3.5"
        >
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton gold className="h-5 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-full rounded opacity-75" />
            <Skeleton className="h-3.5 w-4/5 rounded opacity-75" />
            <Skeleton className="h-3.5 w-1/2 rounded opacity-75" />
          </div>
          <div className="pt-2 flex gap-3 border-t border-neutral-100">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton for My Reviews purchases list
 */
export const ReviewsListSkeleton = ({ count = 3, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading reviews...">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-neutral-200/80 p-5 shadow-xs flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-200 bg-neutral-100">
              <Skeleton className="w-full h-full rounded-none" />
            </div>
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/5 rounded" />
              <Skeleton className="h-3 w-28 rounded opacity-60" />
            </div>
          </div>
          <Skeleton gold className="h-9 w-32 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
};

export default {
  OrdersListSkeleton,
  OrderDetailSkeleton,
  ReturnsListSkeleton,
  ReturnDetailSkeleton,
  SavedAddressSkeleton,
  ReviewsListSkeleton,
};
