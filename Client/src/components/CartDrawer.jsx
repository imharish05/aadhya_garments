import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  X,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { closeCart, removeLocal, addLocal, clearLocal } from '../redux/slices/cartSlice';
import { formatPrice } from '../utils/currency';
import { getImageUrl } from '../utils/imageUrl';
import { formatVariantName } from '../utils/variantFormatter';
import { toast } from 'react-hot-toast';

const FREE_SHIPPING_THRESHOLD = 1499;

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isOpen, items = [], subtotal = 0 } = useSelector(s => s.cart);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  const totalItemCount = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  const progressPct = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFreeShipping = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  // Lock body scroll and handle Escape key when drawer is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        dispatch(closeCart());
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, dispatch]);

  const handleProceedToCheckout = () => {
    dispatch(closeCart());
    navigate('/checkout');
  };

  const handleProductClick = (slug) => {
    dispatch(closeCart());
    if (slug) {
      navigate(`/products/${slug}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart">
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="fixed inset-0 bg-black/60 backdrop-blur-[3px]"
            onClick={() => dispatch(closeCart())}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 pointer-events-none">
            <motion.aside
              key="cart-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
              className="pointer-events-auto w-screen max-w-[440px] sm:max-w-[470px] bg-[#FFFFFF] shadow-[-16px_0_40px_rgba(0,0,0,0.2)] flex flex-col h-full border-l border-neutral-200/80"
            >
              {/* ── Top Header ── */}
              <div className="px-5 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#17130B] text-[#DFC481] flex items-center justify-center shadow-sm">
                    <ShoppingBag size={18} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h2 className="font-playfair text-lg sm:text-xl font-bold text-neutral-900 tracking-tight leading-none">
                      Your Shopping Bag
                    </h2>
                    <span className="text-[12px] font-medium text-neutral-500 mt-0.5 inline-block">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dispatch(closeCart())}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BEA266]"
                  aria-label="Close cart drawer"
                >
                  <X size={20} strokeWidth={1.75} />
                </button>
              </div>

              {/* ── Free Shipping Progress Meter ── */}
              {/* <div className="bg-[#FAF9F5] border-b border-[#EFECE6] px-5 sm:px-6 py-3">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  {remainingForFreeShipping > 0 ? (
                    <span className="text-neutral-700 flex items-center gap-1.5">
                      <Truck size={14} className="text-[#BEA266] shrink-0" />
                      Add <strong className="text-neutral-900 font-semibold">{fmt(remainingForFreeShipping)}</strong> more for <strong className="text-[#996822]">FREE Shipping</strong>
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#BEA266] shrink-0" />
                      Congratulations! You unlocked FREE Delivery
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-neutral-400 tabular-nums">
                    {Math.round(progressPct)}%
                  </span>
                </div>

                <div className="h-1.5 w-full bg-neutral-200/80 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      progressPct >= 100
                        ? 'bg-gradient-to-r from-[#BEA266] to-[#0A8754]'
                        : 'bg-gradient-to-r from-[#BEA266] to-[#DFC481]'
                    }`}
                  />
                </div>
              </div> */}

              {/* ── Cart Items List / Empty State ── */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 divide-y divide-neutral-100">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                    <div className="w-20 h-20 rounded-full bg-neutral-50 border border-neutral-200/70 flex items-center justify-center text-neutral-300 mb-5 relative">
                      <ShoppingBag size={38} strokeWidth={1.2} className="text-[#BEA266]/70" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#17130B] text-white flex items-center justify-center text-[10px] font-bold">
                        0
                      </span>
                    </div>

                    <h3 className="font-playfair text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                      Your bag is empty
                    </h3>
                    <p className="text-sm text-neutral-500 max-w-[280px] mb-6 leading-relaxed">
                      Discover our curated luxury collections and handpicked garment essentials.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        dispatch(closeCart());
                        navigate('/products');
                      }}
                      className="w-full max-w-[260px] py-3 px-6 rounded-full bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs uppercase tracking-[0.16em] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
                    >
                      Start Shopping
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Quick Category Chips */}
                    <div className="mt-8 pt-6 border-t border-neutral-100 w-full">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-400 mb-3">
                        Popular Categories
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          { label: 'Ladies Wear', to: '/category/ladies-wear' },
                          { label: "Men's Wear", to: '/category/men-s-wear' },
                          { label: 'Kids Wear', to: '/category/kids-wear' },
                        ].map(cat => (
                          <button
                            key={cat.label}
                            type="button"
                            onClick={() => {
                              dispatch(closeCart());
                              navigate(cat.to);
                            }}
                            className="text-xs px-3.5 py-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-[#BEA266] hover:text-[#996822] hover:bg-[#FAF9F5] transition-all font-medium"
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((item, idx) => {
                      const name = item.product?.name || item.productName || item.name || 'Product';
                      const productSlug = item.product?.slug || item.slug || (typeof item.productId === 'string' ? item.productId : null);

                      let img = item.variant?.image || item.variantImage || item.image || item.productImage || item.product?.defaultProductImage || (item.product?.images && item.product.images[0]);
                      if (!img || img === 'undefined') {
                        img = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=240';
                      } else {
                        img = getImageUrl(img);
                      }

                      const rawVar = item.selectedVariant || item.variant?.attributes || item.variant;
                      const variantFormatted = formatVariantName(rawVar);

                      const unitPrice = parseFloat(item.priceAtAdd || item.price || item.product?.price || 0);
                      const lineTotal = unitPrice * item.quantity;

                      const availStock = item.variant?.stock ?? item.product?.stock ?? item.availableStock ?? 9999;
                      const isMax = item.quantity >= availStock;

                      const itemKey = `${item.productId || item.id}_${item.variantId || JSON.stringify(item.selectedVariant || {})}_${idx}`;

                      return (
                        <motion.div
                          key={itemKey}
                          layout
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.25 }}
                          className="py-4 first:pt-1 last:pb-1 flex gap-3.5 sm:gap-4 group"
                        >
                          {/* Product Image */}
                          <div
                            onClick={() => handleProductClick(productSlug)}
                            className="w-20 sm:w-22 h-26 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 cursor-pointer relative group/img shadow-sm"
                          >
                            <img
                              src={img}
                              alt={name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=240';
                              }}
                            />
                          </div>

                          {/* Item Details */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4
                                  onClick={() => handleProductClick(productSlug)}
                                  className="font-playfair text-[14.5px] sm:text-[15.5px] font-bold text-neutral-900 leading-snug line-clamp-2 hover:text-[#996822] cursor-pointer transition-colors"
                                >
                                  {name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => dispatch(removeLocal({
                                    productId: item.productId || item.id,
                                    variantId: item.variantId,
                                    selectedVariant: item.selectedVariant
                                  }))}
                                  className="text-neutral-400 hover:text-rose-500 transition-colors p-1 -mr-1 rounded-md hover:bg-rose-50"
                                  aria-label={`Remove ${name} from bag`}
                                  title="Remove item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>

                              {variantFormatted && (
                                <p className="text-[11px] font-medium text-neutral-600 bg-neutral-100/90 inline-block px-2 py-0.5 rounded-md mt-1 border border-neutral-200/50">
                                  {variantFormatted}
                                </p>
                              )}
                            </div>

                            <div className="flex items-end justify-between gap-2 mt-3">
                              {/* Quantity Stepper */}
                              <div className="flex items-center border border-neutral-200 rounded-lg bg-neutral-50/80 overflow-hidden shadow-inner">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (item.quantity <= 1) {
                                      dispatch(removeLocal({
                                        productId: item.productId || item.id,
                                        variantId: item.variantId,
                                        selectedVariant: item.selectedVariant
                                      }));
                                    } else {
                                      dispatch(addLocal({ ...item, quantity: -1 }));
                                    }
                                  }}
                                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors focus-visible:outline-none"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={12} strokeWidth={2} />
                                </button>

                                <span className="w-8 text-center text-xs font-semibold text-neutral-900 tabular-nums">
                                  {item.quantity}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isMax) {
                                      toast.error(`Maximum available stock reached (${availStock} items).`);
                                    } else {
                                      dispatch(addLocal({ ...item, quantity: 1 }));
                                    }
                                  }}
                                  disabled={isMax}
                                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-colors focus-visible:outline-none ${
                                    isMax
                                      ? 'text-neutral-300 bg-neutral-100 cursor-not-allowed'
                                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                                  }`}
                                  aria-label="Increase quantity"
                                  title={isMax ? `Max available: ${availStock}` : 'Increase quantity'}
                                >
                                  <Plus size={12} strokeWidth={2} />
                                </button>
                              </div>

                              {/* Price Display */}
                              <div className="text-right">
                                <p className="font-playfair text-[15px] sm:text-[16px] font-bold text-neutral-900 leading-none">
                                  {fmt(lineTotal)}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="text-[11px] text-neutral-400 mt-1 tabular-nums">
                                    {fmt(unitPrice)} each
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* ── Bottom Summary & Actions ── */}
              {items.length > 0 && (
                <div className="border-t border-neutral-200/80 bg-white px-5 sm:px-6 py-4 shadow-[0_-8px_20px_rgba(0,0,0,0.03)] z-10">
                  {/* Subtotal & Shipping breakdown */}
                  <div className="space-y-1.5 text-xs mb-3.5">
                    {/* <div className="flex justify-between items-center text-neutral-600">
                      <span>Subtotal ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})</span>
                      <span className="font-semibold text-neutral-900 text-sm tabular-nums">{fmt(subtotal)}</span>
                    </div> */}

                    {/* <div className="flex justify-between items-center text-neutral-600">
                      <span>Estimated Delivery</span>
                      {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                        <span className="font-semibold text-emerald-700 uppercase tracking-wider text-[11px] flex items-center gap-1">
                          <Check size={12} strokeWidth={2.5} /> FREE
                        </span>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">Calculated at checkout</span>
                      )}
                    </div> */}

                    <div className="pt-2 border-t border-neutral-100 flex justify-between items-baseline">
                      <span className="text-sm font-bold text-neutral-900 uppercase tracking-wider font-montserrat">
                        Estimated Total
                      </span>
                      <span className="font-playfair text-xl font-bold text-neutral-900">
                        {fmt(subtotal)}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 italic">Taxes included. Discounts applied at checkout.</p>
                  </div>

                  {/* Primary Checkout CTA */}
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    id="cart-drawer-checkout-btn"
                    className="w-full py-3.5 px-6 rounded-xl bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs sm:text-sm uppercase tracking-[0.14em] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group active:scale-[0.99]"
                  >
                    Proceed to Checkout
                    <ArrowRight size={16} className="text-[#DFC481] group-hover:translate-x-1 transition-transform" />
                  </button>

                  {/* Secondary Actions */}
                  <div className="flex items-center justify-between mt-3 text-xs">
                    <button
                      type="button"
                      onClick={() => dispatch(closeCart())}
                      className="text-neutral-600 hover:text-neutral-900 font-medium underline underline-offset-4 transition-colors"
                    >
                      Continue Shopping
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all items from your bag?')) {
                          dispatch(clearLocal());
                        }
                      }}
                      className="text-neutral-400 hover:text-rose-500 font-medium transition-colors"
                    >
                      Clear Bag
                    </button>
                  </div>

                  {/* Trust Micro-Badges */}
                  {/* <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-neutral-100 text-center">
                    <div className="flex flex-col items-center gap-1 text-[10px] text-neutral-500 font-medium">
                      <ShieldCheck size={14} className="text-[#BEA266]" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-[10px] text-neutral-500 font-medium border-x border-neutral-100">
                      <Truck size={14} className="text-[#BEA266]" />
                      <span>Express Shipping</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 text-[10px] text-neutral-500 font-medium">
                      <RotateCcw size={14} className="text-[#BEA266]" />
                      <span>Easy Returns</span>
                    </div>
                  </div> */}
                </div>
              )}
            </motion.aside>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
