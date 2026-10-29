import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Heart, ShoppingBag, Eye, Star, RotateCcw } from 'lucide-react';
import { openQuickView } from '../redux/slices/uiSlice';
import { addLocal, openCart } from '../redux/slices/cartSlice';
import { toggleItem, toggleWishlistApi } from '../redux/slices/wishlistSlice';
import { formatPrice } from '../utils/currency';
import { getPlaceholderSvg } from '../utils/placeholder';
import { getImageUrl } from '../utils/imageUrl';
import { isCartItemMatch } from '../utils/variantFormatter';
import { toast } from 'react-hot-toast';

/** Map common color names → CSS color values for swatch display */
const COLOR_MAP = {
  red: '#e53e3e', crimson: '#dc143c', maroon: '#800000', pink: '#f687b3', rose: '#f43f5e', magenta: '#d53f8c',
  blue: '#3b82f6', navy: '#1e3a8a', cobalt: '#0047ab', royal: '#4169e1', sky: '#38bdf8', cyan: '#06b6d4', teal: '#0d9488',
  green: '#22c55e', olive: '#6b8e23', mint: '#3eb489', emerald: '#10b981', forest: '#228b22', lime: '#84cc16',
  yellow: '#f59e0b', gold: '#b8860b', amber: '#f59e0b', lemon: '#fff44f',
  orange: '#f97316', coral: '#ff6b6b', salmon: '#fa8072',
  purple: '#9333ea', lavender: '#c4b5fd', violet: '#7c3aed', indigo: '#6366f1', mauve: '#9f8fba', plum: '#8b008b', lilac: '#c8a2c8',
  brown: '#92400e', tan: '#d2b48c', beige: '#f5f5dc', caramel: '#c68642',
  black: '#111111', charcoal: '#374151', grey: '#9ca3af', gray: '#9ca3af', silver: '#c0c0c0', steel: '#4682b4', neutral: '#d1d5db',
  white: '#f9fafb', cream: '#fffdd0', ivory: '#fffff0', off: '#faf9f6', clear: 'linear-gradient(135deg,#e2e8f0,#cbd5e1)', 'pastel blue': '#90caf9',
  multicolor: 'linear-gradient(135deg,#e53e3e,#f59e0b,#22c55e,#3b82f6,#9333ea)',
  multi: 'linear-gradient(135deg,#e53e3e,#f59e0b,#22c55e,#3b82f6,#9333ea)',
};

const resolveColor = (name = '') => {
  const lower = name.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return lower;
};

/**
 * ProductCard — editorial overlay style.
 * Full-bleed image, info on gradient, always-visible add-to-cart bar.
 */
const ProductCard = ({ product, index = 0, compactMobile = false }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlist = useSelector(s => s.wishlist.items) || [];
  const cartItems = useSelector(s => s.cart.items) || [];
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);
  const [imgLoaded, setImgLoaded] = useState(false);

  const resolveDefaultVariant = (prod) => {
    if (prod.variants && prod.variants.length > 0) {
      const v = prod.variants[0];
      const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes || '{}') : (v.attributes || {});
      return {
        variantId: v.id,
        price: v.price !== null && v.price !== undefined ? parseFloat(v.price) : parseFloat(prod.price),
        priceAED: v.priceAED !== null && v.priceAED !== undefined ? parseFloat(v.priceAED) : (prod.priceAED ? parseFloat(prod.priceAED) : null),
        mrp: v.mrp !== null && v.mrp !== undefined ? parseFloat(v.mrp) : (prod.comparePrice ? parseFloat(prod.comparePrice) : null),
        mrpAED: v.mrpAED !== null && v.mrpAED !== undefined ? parseFloat(v.mrpAED) : (prod.comparePriceAED ? parseFloat(prod.comparePriceAED) : null),
        image: prod.defaultProductImage || prod.images?.[0] || v.image || '',
        stock: v.stock !== undefined ? parseInt(v.stock, 10) : (prod.stock || 0),
        attributes: attrs
      };
    }

    const prodAttrs = typeof prod.attributes === 'string' ? JSON.parse(prod.attributes || '{}') : (prod.attributes || {});
    const defaultAttrs = {};

    Object.entries(prodAttrs).forEach(([k, v]) => {
      if (Array.isArray(v) && v.length > 0) {
        const keyName = k.toLowerCase() === 'sizes' ? 'size' : (k.toLowerCase().endsWith('s') && k.length > 3 ? k.slice(0, -1) : k);
        defaultAttrs[keyName] = v[0];
      } else if (typeof v === 'string' || typeof v === 'number') {
        defaultAttrs[k] = v;
      }
    });

    if (Object.keys(defaultAttrs).length === 0) {
      defaultAttrs['variant'] = 'Standard';
    }

    return {
      variantId: null,
      price: parseFloat(prod.price),
      priceAED: prod.priceAED ? parseFloat(prod.priceAED) : null,
      mrp: prod.comparePrice ? parseFloat(prod.comparePrice) : null,
      mrpAED: prod.comparePriceAED ? parseFloat(prod.comparePriceAED) : null,
      image: prod.defaultProductImage || prod.images?.[0] || '',
      stock: parseInt(prod.stock, 10) || 0,
      attributes: defaultAttrs
    };
  };

  const resolvedDefault = resolveDefaultVariant(product);
  const currentCardImage = product?.defaultProductImage || product?.images?.[0] || resolvedDefault.image || '';

  const inCart = useMemo(() => {
    if (!product || !cartItems || cartItems.length === 0) return false;
    const hasVariants = Boolean(product.variants && product.variants.length > 0);
    return cartItems.some(item =>
      isCartItemMatch(
        item,
        product,
        resolvedDefault.variantId ? { id: resolvedDefault.variantId } : null,
        resolvedDefault.attributes,
        hasVariants
      )
    );
  }, [product, cartItems, resolvedDefault]);

  const isWishlisted = wishlist.some(item => {
    const sameProd = Number(item.productId || item.id) === Number(product.id);
    if (!sameProd) return false;
    if (resolvedDefault.variantId || item.variantId) {
      return Number(item.variantId) === Number(resolvedDefault.variantId);
    }
    const hasAttrsA = item.selectedVariant && Object.keys(item.selectedVariant).length > 0;
    const hasAttrsB = resolvedDefault.attributes && Object.keys(resolvedDefault.attributes).length > 0;
    if (hasAttrsA || hasAttrsB) {
      const a = item.selectedVariant || {};
      const b = resolvedDefault.attributes || {};
      const keysA = Object.keys(a).sort();
      const keysB = Object.keys(b).sort();
      if (keysA.length !== keysB.length) return false;
      return keysA.every(k => String(a[k]).toLowerCase() === String(b[k]).toLowerCase());
    }
    return true;
  });

  const displayPrice = resolvedDefault.price;
  const displayComparePrice = resolvedDefault.mrp;
  const displayPriceAED = resolvedDefault.priceAED || product.priceAED;
  const displayComparePriceAED = resolvedDefault.mrpAED || product.comparePriceAED;

  const fmt = (v, aed) => formatPrice(v, currencyCode, currencyRate, aed !== undefined ? aed : (v === displayPrice ? displayPriceAED : (v === displayComparePrice ? displayComparePriceAED : null)));

  const discount = (displayComparePrice && Number(displayComparePrice) > Number(displayPrice))
    ? Math.round(((Number(displayComparePrice) - Number(displayPrice)) / Number(displayComparePrice)) * 100)
    : null;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      navigate('/cart');
      return;
    }
    const availStock = resolvedDefault.stock ?? product.stock ?? 0;
    if (availStock <= 0) {
      toast.error('Item is out of stock.');
      return;
    }
    const targetVariantId = resolvedDefault.variantId;
    const existing = cartItems.find(i =>
      isCartItemMatch(
        i,
        product,
        resolvedDefault.variantId ? { id: resolvedDefault.variantId } : null,
        resolvedDefault.attributes,
        Boolean(product.variants && product.variants.length > 0)
      )
    );
    const currentInCart = existing ? Number(existing.quantity || 0) : 0;
    if (currentInCart >= availStock) {
      toast.error(`Maximum available stock (${availStock} items) is already in your cart.`);
      return;
    }

    const cartPayload = {
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: resolvedDefault.image || product.defaultProductImage || product.images?.[0] || '',
      price: displayPrice,
      comparePrice: displayComparePrice,
      stock: availStock,
      gstRate: product.gstRate || '0%',
      variantId: resolvedDefault.variantId,
      selectedVariant: resolvedDefault.attributes,
      quantity: 1
    };
    dispatch(addLocal(cartPayload));
    dispatch(openCart());
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wishlistPayload = {
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: resolvedDefault.image || product.defaultProductImage || product.images?.[0] || '',
      price: displayPrice,
      comparePrice: displayComparePrice,
      inStock: product.stock > 0,
      categoryName: product.category?.name || 'Lifestyle',
      rating: product.rating || 4.5,
      reviewCount: product.reviewCount || 10,
      variantId: resolvedDefault.variantId,
      selectedVariant: resolvedDefault.attributes
    };
    dispatch(toggleWishlistApi(wishlistPayload));
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(openQuickView(product));
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      className="relative w-full min-w-0 bg-neutral-900 flex flex-col rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.18)] transition-all duration-500"
      aria-label={product.name}
    >
      {/* Image Container — full bleed portrait, info sits on top */}
      <div className="group relative shrink-0 overflow-hidden aspect-[3/4] bg-brand-light">
        <Link to={`/products/${product.slug}`} className="block w-full h-full" target="_blank" rel="noopener noreferrer">
          {!imgLoaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          <img
            src={getImageUrl(currentCardImage) || getPlaceholderSvg(product.name)}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06] ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getPlaceholderSvg(product.name);
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        </Link>

        {/* Badges */}
                  <div className="flex items-end justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 min-w-0">
              <span className="font-bold text-sm sm:text-base text-white whitespace-nowrap tracking-tight">{fmt(displayPrice)}</span>
              {displayComparePrice && Number(displayComparePrice) > Number(displayPrice) && (
                <span className="text-white/55 text-[11px] line-through whitespace-nowrap font-normal">{fmt(displayComparePrice)}</span>
              )}
            </div>

            {Number(product.reviewCount) > 0 && Number(product.rating) > 0 && (
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2 py-1 text-white leading-none"
                aria-label={`Rated ${Number(product.rating).toFixed(1)} out of 5 from ${product.reviewCount} reviews`}
              >
                <Star size={11} className="shrink-0 fill-amber-400 text-amber-400" aria-hidden="true" />
                <span className="text-[11px] font-bold">{parseFloat(product.rating).toFixed(1)}</span>
                <span className="hidden sm:inline text-[10px] text-white/70 font-medium">({product.reviewCount})</span>
              </span>
            )}
          </div>

        {/* Side actions: wishlist always, quick view slides in on hover */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlistToggle}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all duration-200 ${
              isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/85 text-neutral-700 hover:text-red-500 hover:bg-white'
            } focus-visible:outline-brand-gold active:scale-90`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            id={`wishlist-${product.id}`}
          >
            <Heart size={14} className={isWishlisted ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleQuickView}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/85 text-neutral-700 hover:text-neutral-950 hover:bg-white backdrop-blur-md shadow-sm opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 active:scale-90"
            aria-label={`Quick view ${product.name}`}
            id={`qv-${product.id}`}
          >
            <Eye size={14} />
          </button>
        </div>

        {/* Info on gradient */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-3 sm:p-4 pointer-events-none">
          {product.category && (
            <p className="text-[10px] text-brand-gold font-semibold tracking-[0.18em] uppercase mb-0.5 truncate">
              {product.category?.name || ''}
            </p>
          )}
          <h3 className="font-playfair font-normal text-sm sm:text-base leading-tight text-white line-clamp-1 sm:line-clamp-2 mb-1" title={product.name}>
            {product.name}
          </h3>

          {(() => {
            const entries = Object.entries(resolvedDefault.attributes || {}).filter(([k, v]) => {
              if (!v || v === 'undefined' || v === 'null') return false;
              if (k === 'variant' && v === 'Standard') return false;
              const kLower = k.toLowerCase();
              return kLower !== 'color' && kLower !== 'colour';
            });
            if (entries.length === 0) return null;
            const attrString = entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
            return (
              <p className="text-[11px] text-white/70 font-medium mb-1 line-clamp-1" title={attrString}>
                {attrString}
              </p>
            );
          })()}

          {/* Color swatches */}
          {(() => {
            const variants = product.variants || [];
            const colorKey = variants.length > 0
              ? Object.keys(
                  (typeof variants[0]?.attributes === 'string'
                    ? JSON.parse(variants[0]?.attributes || '{}')
                    : variants[0]?.attributes) || {}
                ).find(k => k.toLowerCase() === 'color' || k.toLowerCase() === 'colour')
              : null;

            if (!colorKey) {
              const prodAttrs = typeof product.attributes === 'string'
                ? JSON.parse(product.attributes || '{}')
                : (product.attributes || {});
              const colorAttrKey = Object.keys(prodAttrs).find(k => k.toLowerCase() === 'color' || k.toLowerCase() === 'colour' || k.toLowerCase() === 'colors' || k.toLowerCase() === 'colours');
              if (!colorAttrKey) return null;
              const colorList = Array.isArray(prodAttrs[colorAttrKey])
                ? prodAttrs[colorAttrKey]
                : [prodAttrs[colorAttrKey]];
              const SHOW = 5;
              const visible = colorList.slice(0, SHOW);
              const extra = colorList.length - SHOW;
              return (
                <div className="flex items-center gap-1 mb-1.5">
                  {visible.map((c, i) => (
                    <span
                      key={i}
                      title={c}
                      className="w-3.5 h-3.5 rounded-full border border-white/70 shadow-sm flex-shrink-0"
                      style={{ background: resolveColor(c) }}
                    />
                  ))}
                  {extra > 0 && (
                    <span className="text-[10px] text-white/80 font-medium" aria-label={`${extra} more colors`}>+{extra}</span>
                  )}
                </div>
              );
            }

            const colorVariants = [];
            const seen = new Set();
            variants.forEach(v => {
              const attrs = typeof v.attributes === 'string' ? JSON.parse(v.attributes || '{}') : (v.attributes || {});
              const c = attrs[colorKey];
              if (c && !seen.has(c)) {
                seen.add(c);
                colorVariants.push({ color: c, variant: v });
              }
            });
            if (colorVariants.length === 0) return null;

            const SHOW = 5;
            const visible = colorVariants.slice(0, SHOW);
            const extra = colorVariants.length - SHOW;

            return (
              <div className="flex items-center gap-1 mb-1.5">
                {visible.map(({ color: c, variant: v }) => (
                  <span
                    key={c}
                    role="img"
                    aria-label={`Available ${colorKey}: ${c}`}
                    title={`${colorKey}: ${c}`}
                    className="w-3.5 h-3.5 rounded-full border border-white/70 shadow-sm flex-shrink-0"
                    style={{ background: v.colorHex || resolveColor(c) }}
                  />
                ))}
                {extra > 0 && (
                  <span className="text-[10px] text-white/80 font-medium" aria-label={`${extra} more colors`}>+{extra}</span>
                )}
              </div>
            );
          })()}

          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="font-bold text-sm sm:text-base text-white whitespace-nowrap tracking-tight">{fmt(displayPrice)}</span>
            {displayComparePrice && Number(displayComparePrice) > Number(displayPrice) && (
              <span className="text-white/55 text-[11px] line-through whitespace-nowrap font-normal">{fmt(displayComparePrice)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Always-visible add to cart bar (works on touch, no hover needed) */}
      <button
        onClick={handleAddToCart}
        className="flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 bg-white text-neutral-900 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-colors focus-visible:outline-white"
        aria-label={inCart ? `View ${product.name} in cart` : `Add ${product.name} to cart`}
        id={`add-cart-${product.id}`}
      >
        <ShoppingBag size={13} /> {inCart ? 'View Cart' : 'Add to Cart'}
      </button>
    </motion.article>
  );
};

export default ProductCard;