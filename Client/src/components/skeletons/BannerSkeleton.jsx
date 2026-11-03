import React from 'react';
import Skeleton from './Skeleton';

/**
 * Skeleton for Hero Banner Carousel
 */
export const HeroBannerSkeleton = ({ className = '' }) => {
  return (
    <section
      className={`relative w-full h-[52vw] min-h-[320px] max-h-[750px] lg:max-h-[85vh] overflow-hidden bg-neutral-900 border-b border-neutral-800 ${className}`}
      aria-label="Loading banner"
    >
      {/* Background dark shimmer */}
      <Skeleton dark className="w-full h-full absolute inset-0 rounded-none" />

      {/* Subtle overlay vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 pointer-events-none" />

      {/* Floating editorial text skeleton overlay */}
      <div className="absolute inset-0 flex flex-col justify-end lg:justify-center items-center lg:items-start max-w-site mx-auto px-6 sm:px-10 md:px-14 pb-14 lg:pb-0 pointer-events-none">
        <div className="w-full max-w-lg space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
          {/* Eyebrow badge */}
          <Skeleton dark gold className="h-6 w-32 rounded-full" />

          {/* Heading lines */}
          <Skeleton dark className="h-10 sm:h-12 w-4/5 sm:w-full rounded-md" />
          <Skeleton dark className="h-8 sm:h-10 w-3/5 rounded-md" />

          {/* Subtitle */}
          <Skeleton dark className="h-4 w-2/3 sm:w-3/4 rounded mt-2" />

          {/* CTA Button Skeleton */}
          <div className="pt-2">
            <Skeleton dark gold className="h-11 sm:h-12 w-40 sm:w-44 rounded-full" />
          </div>
        </div>
      </div>

      {/* Carousel Navigation Arrow placeholders */}
      <div className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2">
        <Skeleton dark className="w-11 h-11 rounded-full border border-neutral-700/50" />
      </div>
      <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2">
        <Skeleton dark className="w-11 h-11 rounded-full border border-neutral-700/50" />
      </div>

      {/* Bottom slide indicator dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Skeleton dark gold className="h-1.5 w-6 rounded-full" />
        <Skeleton dark className="h-1.5 w-2 rounded-full" />
        <Skeleton dark className="h-1.5 w-2 rounded-full" />
      </div>
    </section>
  );
};

/**
 * Skeleton for Editorial Promo Banner (split image + content)
 */
export const PromoBannerSkeleton = ({ className = '' }) => {
  return (
    <section className={`py-8 bg-brand-light ${className}`} aria-label="Loading promotion">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-0 shadow-lg rounded-xl overflow-hidden md:h-[340px] bg-neutral-900 border border-neutral-800">
          {/* Left image area */}
          <div className="relative h-64 md:h-full overflow-hidden bg-neutral-950">
            <Skeleton dark className="w-full h-full rounded-none" />
          </div>

          {/* Right editorial copy area */}
          <div className="p-6 md:p-10 flex flex-col justify-center space-y-4 bg-neutral-900">
            <Skeleton dark gold className="h-4 w-28 rounded-full" />
            <Skeleton dark className="h-8 w-3/4 rounded-md" />
            <Skeleton dark className="h-7 w-1/2 rounded-md" />
            <div className="space-y-2 pt-1">
              <Skeleton dark className="h-3.5 w-full rounded" />
              <Skeleton dark className="h-3.5 w-4/5 rounded" />
            </div>
            <div className="pt-2">
              <Skeleton dark gold className="h-10 w-36 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Skeleton for Countdown / Deal of the Month Banner
 */
export const CountdownBannerSkeleton = ({ className = '' }) => {
  return (
    <section
      className={`bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 py-10 md:py-14 overflow-hidden border-y border-white/10 ${className}`}
      aria-label="Loading special offer"
    >
      <div className="max-w-site mx-auto px-4 sm:px-6 md:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6 xl:gap-8 items-center justify-items-center">
        {/* Left: Text & Action */}
        <div className="text-center lg:text-left flex flex-col items-center lg:items-start max-w-md w-full space-y-3">
          <Skeleton dark gold className="h-5 w-24 rounded-full" />
          <Skeleton dark className="h-8 sm:h-9 w-4/5 rounded-md" />
          <Skeleton dark className="h-4 w-3/4 rounded" />
          <div className="pt-2">
            <Skeleton dark gold className="h-11 w-40 rounded" />
          </div>
        </div>

        {/* Center: Product Preview Image Box */}
        <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 lg:w-56 lg:h-56 xl:w-64 xl:h-64 rounded-lg overflow-hidden border border-white/10 bg-neutral-900 shadow-xl">
          <Skeleton dark className="w-full h-full rounded-none" />
        </div>

        {/* Right: Countdown Timers */}
        <div className="flex flex-col items-center gap-3 w-full">
          <Skeleton dark gold className="h-4 w-32 rounded" />
          <div className="flex items-center gap-2 sm:gap-3 justify-center">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton dark className="w-12 h-14 sm:w-14 sm:h-16 rounded-lg border border-neutral-800" />
                <Skeleton dark className="w-8 h-2.5 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * Skeleton for Exclusive Deals Banner Cards
 */
export const ExclusiveDealsBannerSkeleton = ({ className = '' }) => {
  return (
    <section className={`py-10 bg-white ${className}`} aria-label="Loading exclusive deals">
      <div className="max-w-site mx-auto px-6 md:px-8">
        <div className="mb-6 space-y-2">
          <Skeleton gold className="h-4 w-28 rounded" />
          <Skeleton className="h-7 w-48 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="relative aspect-[16/9] sm:aspect-[2.2/1] rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 shadow-sm"
            >
              <Skeleton dark className="w-full h-full rounded-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end space-y-2">
                <Skeleton dark gold className="h-4 w-20 rounded" />
                <Skeleton dark className="h-6 w-3/4 rounded" />
                <Skeleton dark className="h-3.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default {
  HeroBannerSkeleton,
  PromoBannerSkeleton,
  CountdownBannerSkeleton,
  ExclusiveDealsBannerSkeleton,
};
