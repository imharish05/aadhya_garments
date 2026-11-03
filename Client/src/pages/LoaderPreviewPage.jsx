import { useState } from 'react';
import Loader from '../components/Loader';
import Preloader from '../components/Preloader';
import { Play, Sparkles, LayoutGrid, Image, Layers, UserCheck } from 'lucide-react';
import {
  HeroBannerSkeleton,
  PromoBannerSkeleton,
  CountdownBannerSkeleton,
  ExclusiveDealsBannerSkeleton,
  ProductCardSkeleton,
  ProductGridSkeleton,
  ProductDetailsSkeleton,
  OrdersListSkeleton,
  OrderDetailSkeleton,
  ReturnsListSkeleton,
  SavedAddressSkeleton,
  ReviewsListSkeleton,
} from '../components/skeletons';

const SKELETON_TABS = [
  { id: 'products', label: 'Products & Grids', icon: LayoutGrid },
  { id: 'banners', label: 'Banners & Deals', icon: Image },
  { id: 'details', label: 'Product Details', icon: Layers },
  { id: 'account', label: 'Orders & Content', icon: UserCheck },
];

const LoaderPreviewPage = () => {
  const [showPreloader, setShowPreloader] = useState(false);
  const [activeSize, setActiveSize] = useState('md');
  const [darkTheme, setDarkTheme] = useState(true);
  const [activeSkeletonTab, setActiveSkeletonTab] = useState('products');

  return (
    <main id="main-content" className="min-h-[85vh] flex flex-col items-center bg-[#FAF8F5] text-neutral-900 py-16 px-4 md:px-8">
      {/* Fullscreen Preloader Modal Trigger */}
      {showPreloader && (
        <Preloader
          key={Date.now()}
          minimumDuration={2000}
          onFinish={() => setShowPreloader(false)}
        />
      )}

      {/* Header */}
      <div className="max-w-3xl text-center space-y-3 mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C9A24B]/10 border border-[#C9A24B]/30 rounded-full text-xs font-semibold text-[#8A6820] uppercase tracking-widest">
          <Sparkles size={13} className="text-[#C9A24B]" />
          Brand Experience
        </span>
        <h1
          className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          API Loaders & Skeletons
        </h1>
        <p className="text-neutral-600 text-sm md:text-base font-medium max-w-xl mx-auto" style={{ fontFamily: '"Montserrat", sans-serif' }}>
          Luxury placeholders and animated loaders for Twin A Apparels — shimmer skeletons for banners, products, product details, orders, and content.
        </p>
      </div>

      {/* Interactive Actions Grid */}
      <div className="w-full max-w-5xl space-y-12">
        {/* 1. Fullscreen Preloader Showcase Button */}
        <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 p-8 rounded-xl border border-neutral-800 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-xl font-semibold text-[#F2D98D]" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
              Full-Screen Website Entrance Preloader
            </h3>
            <p className="text-xs md:text-sm text-neutral-400">
              Plays during initial website visit with smooth liquid gold progress & blur fade exit.
            </p>
          </div>
          <button
            onClick={() => setShowPreloader(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#8A6820] via-[#C9A24B] to-[#F2D98D] text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:brightness-110 shadow-lg shadow-[#C9A24B]/20 transition-all active:scale-95 shrink-0"
          >
            <Play size={16} fill="black" />
            Play Fullscreen Preloader
          </button>
        </div>

        {/* 2. Universal Inline Loader Component */}
        <div className="bg-white p-8 rounded-xl border border-neutral-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                Universal Inline Spinner Component
              </h3>
              <p className="text-xs text-neutral-500">
                Used in buttons, cart drawer updates, and small query states.
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <div className="flex bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs font-semibold">
                {['sm', 'md', 'lg', 'xl'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveSize(s)}
                    className={`px-3 py-1 rounded-lg uppercase transition-all ${
                      activeSize === s ? 'bg-black text-white shadow' : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setDarkTheme(!darkTheme)}
                className="text-xs font-semibold px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-50"
              >
                {darkTheme ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
          </div>

          {/* Loader Preview Stage */}
          <div
            className={`min-h-[220px] rounded-lg flex flex-col items-center justify-center p-8 transition-colors ${
              darkTheme ? 'bg-[#080809] border border-neutral-800' : 'bg-neutral-50 border border-neutral-200'
            }`}
          >
            <Loader
              size={activeSize}
              color="#C9A24B"
              text="Curating Luxury..."
            />
          </div>
        </div>

        {/* 3. Skeleton Loaders Showcase Section */}
        <div className="bg-white p-8 rounded-xl border border-neutral-200/80 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#C9A24B] animate-ping" />
                <h3 className="text-xl font-semibold text-neutral-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                  Luxury Shimmer Skeleton Loaders
                </h3>
              </div>
              <p className="text-xs md:text-sm text-neutral-500 mt-1">
                Content-matching skeleton loaders displayed during live API data fetches.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-neutral-100 p-1 rounded-lg border border-neutral-200 text-xs font-semibold">
              {SKELETON_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeSkeletonTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSkeletonTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                      active
                        ? 'bg-black text-[#F2D98D] shadow-sm'
                        : 'text-neutral-600 hover:text-black'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Products & Grids */}
          {activeSkeletonTab === 'products' && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Single Product Card Skeleton
                </p>
                <div className="max-w-[280px]">
                  <ProductCardSkeleton />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Responsive Product Grid (Listing Page)
                </p>
                <ProductGridSkeleton count={4} />
              </div>
            </div>
          )}

          {/* Tab 2: Banners & Deals */}
          {activeSkeletonTab === 'banners' && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Hero Banner Carousel Skeleton
                </p>
                <HeroBannerSkeleton />
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Countdown Deal Banner Skeleton
                </p>
                <CountdownBannerSkeleton />
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Editorial Promo Banner Skeleton
                </p>
                <PromoBannerSkeleton />
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Exclusive Deals Cards Skeleton
                </p>
                <ExclusiveDealsBannerSkeleton />
              </div>
            </div>
          )}

          {/* Tab 3: Product Details */}
          {activeSkeletonTab === 'details' && (
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                Full Product Details Page Skeleton
              </p>
              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white">
                <ProductDetailsSkeleton />
              </div>
            </div>
          )}

          {/* Tab 4: Account & Content */}
          {activeSkeletonTab === 'account' && (
            <div className="space-y-8">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  My Orders List Skeleton
                </p>
                <OrdersListSkeleton count={2} />
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Order Detail & Tracking Skeleton
                </p>
                <OrderDetailSkeleton />
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Returns & Refunds Skeleton
                </p>
                <ReturnsListSkeleton count={2} />
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Saved Addresses Grid Skeleton
                </p>
                <SavedAddressSkeleton count={2} />
              </div>

              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-3">
                  Purchases & Reviews List Skeleton
                </p>
                <ReviewsListSkeleton count={2} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default LoaderPreviewPage;
