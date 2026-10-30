import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, Star } from 'lucide-react';
import { addLocal, openCart } from '../redux/slices/cartSlice';
import { toggleWishlistApi } from '../redux/slices/wishlistSlice';
import { formatPrice } from '../utils/currency';
import { getPlaceholderSvg } from '../utils/placeholder';
import { getImageUrl } from '../utils/imageUrl';
import { isCartItemMatch } from '../utils/variantFormatter';
import { toast } from 'react-hot-toast';

/* ────────────────────────────────────────────────────────────────────────────
   ProductCard — simple, Amazon-style.
   image · name · rating · price · small "variants available" note · button
   Products with more than one variant show "Select options" (opens the
   product page); single-variant products add straight to cart.
──────────────────────────────────────────────────────────────────────────── */

const COLOR_MAP = {
  red: '#e53e3e', crimson: '#dc143c', maroon: '#800000', pink: '#f687b3', rose: '#f43f5e', magenta: '#d53f8c',
  blue: '#3b82f6', navy: '#1e3a8a', cobalt: '#0047ab', royal: '#4169e1', sky: '#38bdf8', cyan: '#06b6d4', teal: '#0d9488',
  green: '#22c55e', olive: '#6b8e23', mint: '#3eb489', emerald: '#10b981', forest: '#228b22', lime: '#84cc16',
  yellow: '#f59e0b', gold: '#b8860b', amber: '#f59e0b', lemon: '#fff44f',
  orange: '#f97316', coral: '#ff6b6b', salmon: '#fa8072',
  purple: '#9333ea', lavender: '#c4b5fd', violet: '#7c3aed', indigo: '#6366f1', mauve: '#9f8fba', plum: '#8b008b', lilac: '#c8a2c8',
  brown: '#92400e', tan: '#d2b48c', beige: '#f5f5dc', caramel: '#c68642',
  black: '#111111', charcoal: '#374151', grey: '#9ca3af', gray: '#9ca3af', silver: '#c0c0c0', steel: '#4682b4', neutral: '#d1d5db',
  white: '#f9fafb', cream: '#fffdd0', ivory: '#fffff0', off: '#faf9f6',
  multicolor: 'linear-gradient(135deg,#e53e3e,#f59e0b,#22c55e,#3b82f6,#9333ea)',
  multi: 'linear-gradient(135deg,#e53e3e,#f59e0b,#22c55e,#3b82f6,#9333ea)',
};

const resolveColor = (name = '') => {
  const lower = String(name).toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) if (lower.includes(key)) return val;
  return lower;
};

const parseJSON = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  let p = value;
  for (let i = 0; i < 4 && typeof p === 'string'; i++) {
    try { p = JSON.parse(p); } catch { return fallback; }
  }
  return p ?? fallback;
};

const attrsOf = v => {
  const a = parseJSON(v?.attributes, {});
  return a && typeof a === 'object' && !Array.isArray(a) ? a : {};
};

const clean = v => v !== undefined && v !== null && v !== '' && v !== 'undefined' && v !== 'null';
const isColorKey = k => ['color', 'colour', 'colors', 'colours'].includes(String(k).toLowerCase());
const singular = k => {
  const l = String(k).toLowerCase();
  if (l === 'sizes') return 'size';
  return l.endsWith('s') && l.length > 3 ? l.slice(0, -1) : l;
};
const num = x => (x !== null && x !== undefined && x !== '' ? parseFloat(x) : null);

const ProductCard = React.memo(({ product, index = 0, compactMobile = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlist = useSelector(s => s.wishlist.items) || [];
  const cartItems = useSelector(s => s.cart.items) || [];
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const [imgLoaded, setImgLoaded] = useState(false);

  /* variants → counts per attribute, swatches, price range ----------------- */
  const info = useMemo(() => {
    const variants = (product.variants || []).map(v => ({ ...v, _attrs: attrsOf(v), _stock: Number(v.stock) || 0 }));
    const groups = {}; // key → Map(value → hex)

    const add = (key, val, hex) => {
      if (!clean(val)) return;
      if (!groups[key]) groups[key] = new Map();
      if (!groups[key].has(String(val))) groups[key].set(String(val), hex || null);
    };

    if (variants.length) {
      variants.forEach(v => Object.entries(v._attrs).forEach(([k, val]) => {
        if (k === 'variant' && val === 'Standard') return;
        add(isColorKey(k) ? 'colour' : singular(k), val, isColorKey(k) ? v.colorHex : null);
      }));
    } else {
      Object.entries(parseJSON(product.attributes, {}) || {}).forEach(([k, v]) => {
        const list = Array.isArray(v) ? v : typeof v === 'string' || typeof v === 'number' ? [v] : [];
        list.forEach(val => add(isColorKey(k) ? 'colour' : singular(k), val));
      });
    }

    const keys = Object.keys(groups).sort((a, b) => (a === 'colour' ? -1 : b === 'colour' ? 1 : 0));
    const notes = keys.map(k => {
      const n = groups[k].size;
      return `${n} ${k}${n > 1 ? 's' : ''}`;
    });
    const swatches = groups.colour ? [...groups.colour.entries()].map(([name, hex]) => ({ name, hex })) : [];

    const prices = variants.map(v => num(v.price)).filter(p => p !== null);
    const minPrice = prices.length ? Math.min(...prices) : num(product.price);
    const maxPrice = prices.length ? Math.max(...prices) : num(product.price);

    // "has choices" = more than one purchasable option
    const optionCount = variants.length > 1
      ? variants.length
      : keys.reduce((n, k) => Math.max(n, groups[k].size), 1);

    return { variants, notes, swatches, minPrice, maxPrice, hasOptions: optionCount > 1 };
  }, [product.variants, product.attributes, product.price]);

  /* default (single) variant used for direct add-to-cart ------------------- */
  const base = useMemo(() => {
    const v = info.variants.find(x => x._stock > 0) || info.variants[0] || null;
    const attrs = {};
    if (v) Object.entries(v._attrs).forEach(([k, val]) => { if (clean(val)) attrs[k] = val; });
    else Object.entries(parseJSON(product.attributes, {}) || {}).forEach(([k, val]) => {
      const first = Array.isArray(val) ? val[0] : val;
      if (clean(first) && (typeof first === 'string' || typeof first === 'number')) attrs[singular(k)] = first;
    });
    if (!Object.keys(attrs).length) attrs.variant = 'Standard';
    return {
      variantId: v ? v.id : null,
      price: v && num(v.price) !== null ? num(v.price) : num(product.price),
      priceAED: v && num(v.priceAED) !== null ? num(v.priceAED) : num(product.priceAED),
      mrp: v && num(v.mrp) !== null ? num(v.mrp) : num(product.comparePrice),
      mrpAED: v && num(v.mrpAED) !== null ? num(v.mrpAED) : num(product.comparePriceAED),
      stock: v ? v._stock : parseInt(product.stock, 10) || 0,
      image: (v && (v.image || parseJSON(v.images, [])[0])) || product.defaultProductImage || product.images?.[0] || '',
      attributes: attrs,
    };
  }, [info.variants, product]);

  const image = product.defaultProductImage || product.images?.[0] || base.image;
  const hasDbVariants = info.variants.length > 0;
  const totalStock = hasDbVariants ? info.variants.reduce((s, v) => s + v._stock, 0) : base.stock;
  const soldOut = totalStock <= 0;
  const priceVaries = info.maxPrice !== info.minPrice;
  const shownPrice = priceVaries ? info.minPrice : base.price;

  const hasDiscount = !priceVaries && base.mrp && base.mrp > base.price;
  const discount = hasDiscount ? Math.round(((base.mrp - base.price) / base.mrp) * 100) : null;
  const fmt = (v, aed) => formatPrice(v, currencyCode, currencyRate, aed);

  const inCart = !info.hasOptions && cartItems.some(item =>
    isCartItemMatch(item, product, base.variantId ? { id: base.variantId } : null, base.attributes, hasDbVariants)
  );

  const isWishlisted = wishlist.some(item => Number(item.productId || item.id) === Number(product.id));

  /* actions ---------------------------------------------------------------- */
  const handleAdd = e => {
    e.preventDefault();
    e.stopPropagation();
    if (info.hasOptions) { navigate(`/products/${product.slug}`); return; }
    if (inCart) { navigate('/cart'); return; }
    if (base.stock <= 0) { toast.error('Item is out of stock.'); return; }
    dispatch(addLocal({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: base.image,
      price: base.price,
      comparePrice: base.mrp,
      stock: base.stock,
      gstRate: product.gstRate || '0%',
      variantId: base.variantId,
      selectedVariant: base.attributes,
      quantity: 1,
    }));
    dispatch(openCart());
  };

  const handleWishlist = e => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlistApi({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: base.image,
      price: base.price,
      comparePrice: base.mrp,
      inStock: totalStock > 0,
      categoryName: product.category?.name || 'Lifestyle',
      rating: product.rating || 4.5,
      reviewCount: product.reviewCount || 10,
      variantId: base.variantId,
      selectedVariant: base.attributes,
    }));
  };

  const SHOW_DOTS = 4;
  const dots = info.swatches.slice(0, SHOW_DOTS);
  const moreDots = info.swatches.length - dots.length;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.04 }}
      className="group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border border-black/10 bg-white transition-shadow duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.1)]"
      aria-label={product.name}
    >
      {/* image */}
      <div className="relative aspect-square shrink-0 overflow-hidden bg-[#F4EEDD]">
        <Link to={`/products/${product.slug}`} className="block h-full w-full" tabIndex={-1} aria-hidden="true">
          {!imgLoaded && <div className="skeleton absolute inset-0" />}
          <img
            src={getImageUrl(image) || getPlaceholderSvg(product.name)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={e => { e.target.onerror = null; e.target.src = getPlaceholderSvg(product.name); setImgLoaded(true); }}
            className={`h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            } ${soldOut ? 'grayscale-[0.6]' : ''}`}
          />
        </Link>

        {discount && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-[#BEA266] px-2 py-1 font-inter text-[10px] font-bold leading-none text-black">
            {discount}% OFF
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          id={`wishlist-${product.id}`}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm transition-transform active:scale-90 ${
            isWishlisted ? 'text-red-500' : 'text-black/60 hover:text-red-500'
          }`}
        >
          <Heart size={15} className={isWishlisted ? 'fill-current' : ''} />
        </button>

        {soldOut && (
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/80 py-1 text-center font-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            Sold out
          </span>
        )}
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <h3 className="font-inter text-[12px] font-medium leading-snug text-black sm:text-sm">
          <Link to={`/products/${product.slug}`} title={product.name} className="line-clamp-2 hover:text-[#7A5F28]">
            {product.name}
          </Link>
        </h3>

        {Number(product.reviewCount) > 0 && Number(product.rating) > 0 && (
          <p
            className="mt-1.5 flex items-center gap-1 font-inter text-[12px] text-black/60"
            aria-label={`Rated ${Number(product.rating).toFixed(1)} out of 5`}
          >
            <span className="font-semibold text-black">{Number(product.rating).toFixed(1)}</span>
            <Star size={12} className="fill-[#BEA266] text-[#BEA266]" aria-hidden="true" />
            <span>({product.reviewCount})</span>
          </p>
        )}

        {/* price */}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          {priceVaries && <span className="font-inter text-[11px] text-black/55">From</span>}
          <span className="font-inter text-base font-bold text-black">{fmt(shownPrice, priceVaries ? null : base.priceAED)}</span>
          {hasDiscount && (
            <span className="font-inter text-[12px] text-black/45 line-through">{fmt(base.mrp, base.mrpAED)}</span>
          )}
        </div>

        {/* variants note */}
        {info.hasOptions && info.notes.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            {dots.length > 1 && (
              <span className="flex items-center" aria-hidden="true">
                {dots.map((d, i) => (
                  <span
                    key={d.name}
                    title={d.name}
                    className="-ml-1 h-3.5 w-3.5 rounded-full border border-white ring-1 ring-black/15 first:ml-0"
                    style={{ background: d.hex || resolveColor(d.name), zIndex: SHOW_DOTS - i }}
                  />
                ))}
              </span>
            )}
            <p className="truncate font-inter text-[11px] font-medium text-[#7A5F28]">
              {moreDots > 0 && dots.length > 1 ? `+${moreDots} · ` : ''}{info.notes.join(' · ')} available
            </p>
          </div>
        )}

        {/* button */}
        <div className="mt-auto pt-2.5 sm:pt-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            id={`add-cart-${product.id}`}
            aria-label={info.hasOptions ? `Select options for ${product.name}` : inCart ? `View ${product.name} in cart` : `Add ${product.name} to cart`}
            className="flex w-full items-center justify-center rounded-full bg-black py-1.5 font-inter text-[10px] font-semibold uppercase tracking-[0.08em] text-[#DFC481] transition-colors hover:bg-[#BEA266] hover:text-black sm:py-2.5 sm:text-[11px] sm:tracking-[0.14em] disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/40"
          >
            {soldOut ? 'Sold out' : info.hasOptions ? 'Select options' : inCart ? 'View cart' : 'Add to cart'}
          </button>
        </div>
      </div>
    </motion.article>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;