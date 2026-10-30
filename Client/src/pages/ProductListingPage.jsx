import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, ChevronLeft, ChevronRight, X, SearchX, Layers, ArrowUpDown } from 'lucide-react';
import { fetchProducts } from '../redux/slices/productsSlice';
import { fetchCategories } from '../redux/slices/categoriesSlice';
import ProductCard from '../components/ProductCard';
import Footer from '../components/Footer';
import { StaggeredText } from '../components/animations';
import Breadcrumb from '../components/Breadcrumb';
import { ToolbarMenu, ToolbarButton } from '../components/shop/ToolbarControls';
import FilterPanel, { COLLECTIONS } from '../components/shop/FilterPanel';
import ActiveFilters from '../components/shop/ActiveFilters';
import { formatPrice } from '../utils/currency';
import api from '../services/api';

const sortOptions = [
  { label: 'Newest', value: 'createdAt-DESC' },
  { label: 'Price: Low to High', value: 'price-ASC' },
  { label: 'Price: High to Low', value: 'price-DESC' },
  { label: 'Rating', value: 'rating-DESC' },
];

/** 1 … 4 5 6 … 12 */
const pageWindow = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, page - 1, page, page + 1]);
  const nums = [...set].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('gap');
    out.push(n);
  });
  return out;
};

const ProductListingPage = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug, sub } = useParams();
  const { items: products, loading, total, totalPages } = useSelector(s => s.products);
  const { items: categories } = useSelector(s => s.categories);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const fmt = useCallback(v => formatPrice(v, currencyCode, currencyRate), [currencyCode, currencyRate]);

  const routeCategory = sub || slug;
  const currentCategory = routeCategory || searchParams.get('category') || '';

  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const gridTopRef = useRef(null);

  const [filters, setFilters] = useState(() => {
    const col = (searchParams.get('collection') || '').toLowerCase();
    const isBest = searchParams.get('bestSeller') === 'true' || ['bestseller', 'bestsellers', 'best-sellers'].includes(col);
    const isNew = searchParams.get('newArrival') === 'true' || ['newarrival', 'new-arrivals', 'newarrivals'].includes(col);
    return {
      category: currentCategory,
      search: searchParams.get('search') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      vendorId: searchParams.get('vendorId') || '',
      minDiscount: searchParams.get('minDiscount') || '',
      maxDiscount: searchParams.get('maxDiscount') || '',
      bestSeller: isBest ? true : undefined,
      newArrival: isNew ? true : undefined,
      sort: 'createdAt',
      order: 'DESC',
      page: 1,
    };
  });

  /* ── data ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    dispatch(fetchProducts({ ...filters, limit: 20 }));
  }, [filters, dispatch]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    api.get('/products/price-range')
      .then(res => {
        if (res.data?.success) setPriceRange({ min: res.data.minPrice, max: res.data.maxPrice });
      })
      .catch(() => {});
  }, []);

  // URL → filters
  useEffect(() => {
    const category = routeCategory || searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const vendorId = searchParams.get('vendorId') || '';
    const minDiscount = searchParams.get('minDiscount') || '';
    const maxDiscount = searchParams.get('maxDiscount') || '';
    const col = (searchParams.get('collection') || '').toLowerCase();
    const isBest = searchParams.get('bestSeller') === 'true' || ['bestseller', 'bestsellers', 'best-sellers'].includes(col);
    const isNew = searchParams.get('newArrival') === 'true' || ['newarrival', 'new-arrivals', 'newarrivals'].includes(col);
    const bestSeller = isBest ? true : undefined;
    const newArrival = isNew ? true : undefined;

    setFilters(prev => {
      if (
        prev.category !== category || prev.search !== search || prev.minPrice !== minPrice ||
        prev.maxPrice !== maxPrice || prev.vendorId !== vendorId || prev.minDiscount !== minDiscount ||
        prev.maxDiscount !== maxDiscount || prev.bestSeller !== bestSeller || prev.newArrival !== newArrival
      ) {
        return { ...prev, category, search, minPrice, maxPrice, vendorId, minDiscount, maxDiscount, bestSeller, newArrival, page: 1 };
      }
      return prev;
    });
  }, [searchParams, slug, sub, routeCategory]);

  // close the mobile sheet / lock scroll
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [filtersOpen]);

  // jump back to the top of the grid when the page number changes
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    gridTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filters.page]);

  /* ── handlers ─────────────────────────────────────────────────────── */
  const applyPrice = useCallback((min, max) => {
    setFilters(prev => ({
      ...prev,
      minPrice: min <= priceRange.min ? '' : String(min),
      maxPrice: max >= priceRange.max ? '' : String(max),
      page: 1,
    }));
  }, [priceRange.min, priceRange.max]);

  const handleSort = val => {
    const [sort, order] = val.split('-');
    setFilters(prev => ({ ...prev, sort, order, page: 1 }));
  };

  const handleCollection = val => {
    const newArrival = val === 'newArrival' ? true : undefined;
    const bestSeller = val === 'bestSeller' ? true : undefined;
    setFilters(prev => ({ ...prev, newArrival, bestSeller, page: 1 }));

    const params = new URLSearchParams(searchParams);
    newArrival ? params.set('newArrival', 'true') : params.delete('newArrival');
    bestSeller ? params.set('bestSeller', 'true') : params.delete('bestSeller');
    params.delete('featured');
    params.delete('collection');
    setSearchParams(params, { replace: true });
  };

  const handleDiscount = val => {
    if (val === '') {
      setFilters(prev => ({ ...prev, minDiscount: '', maxDiscount: '', page: 1 }));
    } else {
      const [min, max] = val.split('-');
      setFilters(prev => ({ ...prev, minDiscount: min, maxDiscount: max, page: 1 }));
    }
  };

  const clearSearchTerm = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    setSearchParams(params, { replace: true });
  };

  const clearAll = () => {
    setFilters(prev => ({
      ...prev, minPrice: '', maxPrice: '', minDiscount: '', maxDiscount: '',
      newArrival: undefined, bestSeller: undefined, search: '', page: 1,
    }));
    setSearchParams({}, { replace: true });
  };

  /* ── derived ──────────────────────────────────────────────────────── */
  const selectedCollection = filters.newArrival ? 'newArrival' : filters.bestSeller ? 'bestSeller' : '';
  const discountValue = filters.minDiscount ? `${filters.minDiscount}-${filters.maxDiscount}` : '';
  const valueMin = Number(filters.minPrice) || priceRange.min;
  const valueMax = Number(filters.maxPrice) || priceRange.max;

  const collectionTitle = selectedCollection === 'bestSeller' ? 'Best Sellers' : selectedCollection === 'newArrival' ? 'New Arrivals' : '';

  const parentCat = useMemo(() => categories.find(c => c.slug === slug) || null, [categories, slug]);
  const parentSubs = useMemo(
    () => (parentCat?.subcategories || parentCat?.children || []).filter(s => s.isActive !== false),
    [parentCat]
  );
  const subCat = sub ? parentSubs.find(s => s.slug === sub) : null;

  const pageHeading = subCat?.name || parentCat?.name || collectionTitle || (filters.search ? `“${filters.search}”` : 'All Products');
  const eyebrow = subCat ? parentCat?.name : parentCat ? 'Collection' : filters.search ? 'Search results' : collectionTitle ? 'Curated' : 'The Shop';

  const crumbs = useMemo(() => {
    const list = [{ label: 'Shop', to: '/products' }];
    if (parentCat) list.push({ label: parentCat.name, to: `/category/${parentCat.slug}` });
    if (subCat) list.push({ label: subCat.name, to: `/category/${parentCat.slug}/${subCat.slug}` });
    if (!parentCat && collectionTitle) list.push({ label: collectionTitle, to: '' });
    if (!parentCat && !collectionTitle && filters.search) list.push({ label: `Search: ${filters.search}`, to: '' });
    return list;
  }, [parentCat, subCat, collectionTitle, filters.search]);

  // Dropdown options
  const collectionOptions = COLLECTIONS.map(c => ({ value: c.value, label: c.value ? c.label : 'All collections' }));

  const chips = [];
  if (filters.search) chips.push({ key: 'search', label: `“${filters.search}”`, onRemove: clearSearchTerm });
  if (selectedCollection) chips.push({ key: 'col', label: COLLECTIONS.find(c => c.value === selectedCollection)?.label, onRemove: () => handleCollection('') });
  // Discount chip — commented out with the Discount filter
  // if (discountValue) chips.push({ key: 'disc', label: DISCOUNTS.find(d => d.value === discountValue)?.label || 'Discount', onRemove: () => handleDiscount('') });
  if (filters.minPrice || filters.maxPrice) {
    chips.push({ key: 'price', label: `${fmt(valueMin)} – ${fmt(valueMax)}`, onRemove: () => applyPrice(priceRange.min, priceRange.max) });
  }

  const panelProps = {
    categories,
    activeSlug: slug || '',
    activeSub: sub || '',
    priceMin: priceRange.min,
    priceMax: priceRange.max,
    valueMin,
    valueMax,
    onPrice: applyPrice,
    // discountValue, onDiscount: handleDiscount,   // Discount filter is commented out
  };

  const sortValue = `${filters.sort}-${filters.order}`;

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <main id="main-content" className="bg-white font-inter text-black">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto max-w-[1840px] px-6 py-8 md:px-8 md:py-12">
          <Breadcrumb crumbs={crumbs} tone="light" />
          <StaggeredText
            as="h1"
            text={pageHeading}
            segmentBy="words"
            startDelay={0.1}
            className="font-playfair mt-5 text-4xl font-medium leading-[1.08] text-black sm:text-5xl"
          />
          <div className="mt-5 flex items-center gap-4">
            <span className="h-px w-12 bg-[#BEA266]" />
            <p className="font-inter text-[13px] text-black/60">
              <span className="font-semibold text-black">{total}</span> {total === 1 ? 'product' : 'products'}
            </p>
          </div>
        </div>
      </header>

      {/* ── Listing ────────────────────────────────────────── */}
      <div ref={gridTopRef} className="mx-auto max-w-[1840px] scroll-mt-28 px-6 py-8 md:px-8 md:py-10">
        {/* toolbar: Collection + Sort on the left, Filters on the right (phone/tablet) */}
        <div className="mb-6 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
          <ToolbarMenu
            id="shop-collection"
            icon={Layers}
            label="Collection"
            options={collectionOptions}
            value={selectedCollection}
            onChange={handleCollection}
            active={Boolean(selectedCollection)}
          />
          <ToolbarMenu
            id="products-sort"
            icon={ArrowUpDown}
            label="Sort"
            options={sortOptions}
            value={sortValue}
            onChange={handleSort}
            active={sortValue !== 'createdAt-DESC'}
          />
          </div>
          <ToolbarButton
            id="filters-toggle-mobile"
            icon={SlidersHorizontal}
            label="Filters"
            value={chips.length ? `${chips.length} active` : ''}
            onClick={() => setFiltersOpen(true)}
            active={chips.length > 0}
            className="lg:hidden"
          />
        </div>

        {chips.length > 0 && (
          <div className="mb-8">
            <ActiveFilters chips={chips} onClearAll={clearAll} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-10 2xl:gap-12">
          {/* sidebar (desktop) */}
          <aside className="hidden self-start lg:sticky lg:top-28 lg:block" aria-label="Filters">
            <div className="flex max-h-[calc(100vh-8rem)] flex-col rounded-[1.75rem] border border-black/10 bg-white p-6">
              <FilterPanel {...panelProps} treeScroll />
            </div>
          </aside>

          {/* products */}
          <div>
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="skeleton aspect-square" />
                    <div className="space-y-1.5 p-3">
                      <div className="skeleton h-3.5 w-3/4" />
                      <div className="skeleton h-3 w-1/2" />
                      <div className="skeleton h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center md:py-28">
                <span className="flex h-24 w-20 items-center justify-center rounded-t-[999px] rounded-b-2xl border border-[#BEA266]/60 text-[#BEA266]">
                  <SearchX size={30} strokeWidth={1.4} />
                </span>
                <h2 className="font-playfair mt-7 text-3xl font-medium">Nothing here yet</h2>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-black/60">
                  No products match these filters. Loosen a filter or browse another category.
                </p>
                <button
                  type="button"
                  onClick={() => { clearAll(); navigate('/products'); }}
                  className="mt-8 rounded-full bg-black px-8 py-3.5 font-inter text-[12px] font-semibold uppercase tracking-[0.18em] text-[#DFC481] transition-colors hover:bg-[#BEA266] hover:text-black"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
                  {products.map((product, i) => (
                    <ProductCard key={product.id} product={product} index={i} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="mt-14 flex items-center justify-center gap-2" aria-label="Pagination">
                    <button
                      type="button"
                      onClick={() => setFilters(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                      disabled={filters.page <= 1}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-black/25 transition-colors hover:border-black hover:bg-black hover:text-[#DFC481] disabled:pointer-events-none disabled:opacity-35"
                      aria-label="Previous page"
                      id="pagination-prev"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {pageWindow(filters.page, totalPages).map((n, i) =>
                      n === 'gap' ? (
                        <span key={`gap-${i}`} className="px-1 text-black/40" aria-hidden="true">…</span>
                      ) : (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setFilters(p => ({ ...p, page: n }))}
                          aria-current={filters.page === n ? 'page' : undefined}
                          className={`flex h-11 w-11 items-center justify-center rounded-full font-inter text-[13px] font-semibold transition-colors ${
                            filters.page === n ? 'bg-black text-[#DFC481]' : 'border border-black/25 hover:border-black'
                          }`}
                          id={`page-${n}`}
                        >
                          {n}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() => setFilters(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                      disabled={filters.page >= totalPages}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-black/25 transition-colors hover:border-black hover:bg-black hover:text-[#DFC481] disabled:pointer-events-none disabled:opacity-35"
                      aria-label="Next page"
                      id="pagination-next"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile / tablet filter sheet ───────────────────── */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-[1100] bg-black/60 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              key="sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              data-lenis-prevent
              className="fixed inset-x-0 bottom-0 z-[1110] flex max-h-[88vh] max-h-[88dvh] flex-col rounded-t-[2rem] bg-white lg:hidden"
              role="dialog"
              aria-label="Filters"
            >
              <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-5">
                <h2 className="font-playfair text-2xl font-medium">Filters</h2>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20"
                  aria-label="Close filters"
                >
                  <X size={18} />
                </button>
              </div>

              <div data-lenis-prevent className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-6 pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                <FilterPanel {...panelProps} onNavigate={() => setFiltersOpen(false)} />
              </div>

              <div className="grid shrink-0 grid-cols-[auto_1fr] gap-3 border-t border-black/10 bg-white px-6 py-4">
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-full border border-black/30 px-6 py-3.5 font-inter text-[11px] font-semibold uppercase tracking-[0.16em]"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full bg-black py-3.5 font-inter text-[11px] font-semibold uppercase tracking-[0.16em] text-[#DFC481]"
                >
                  Show {total} pieces
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
};

export default ProductListingPage;