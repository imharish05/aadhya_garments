import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Package, 
  Download, 
  MapPin, 
  Clock, 
  RefreshCw, 
  ShoppingBag, 
  CreditCard, 
  ArrowRight, 
  AlertTriangle, 
  XCircle, 
  X, 
  Copy, 
  Check, 
  Truck, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MessageCircle, 
  FileText, 
  Sparkles,
  HelpCircle,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import Footer from '../components/Footer';
import { printInvoice } from '../utils/invoiceGenerator';
import { formatOrderAmount } from '../utils/currency';
import { fetchOrderById, cancelCustomerOrder } from '../redux/slices/ordersSlice';
import { getImageUrl } from '../utils/imageUrl';
import { getPlaceholderSvg } from '../utils/placeholder';
import api from '../services/api';

/* Helper to parse variant JSON strings safely */
const parseVariant = (val) => {
  if (!val) return null;
  let parsed = val;
  for (let i = 0; i < 5; i++) {
    if (typeof parsed === 'string') {
      const trimmed = parsed.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ) {
        try {
          const next = JSON.parse(parsed);
          if (next === parsed) break;
          parsed = next;
        } catch {
          break;
        }
      } else {
        break;
      }
    } else {
      break;
    }
  }
  if (Array.isArray(parsed) && parsed.length > 0) parsed = parsed[0];
  if (typeof parsed === 'object' && parsed !== null) return parsed;
  return null;
};

/* Helper to format variant attributes into human-readable string */
const getVariantString = (rawVariant) => {
  const variantObj = parseVariant(rawVariant);
  if (variantObj) {
    const EXCLUDE_KEYS = new Set(['id', 'sku', 'variantId', 'productId', 'stock', 'price', 'mrp', 'image', 'createdAt', 'updatedAt', 'gstRate']);
    const entries = Object.entries(variantObj).filter(([k, v]) => !EXCLUDE_KEYS.has(k) && v !== undefined && v !== null && v !== '');
    if (entries.length > 0) {
      return entries.map(([k, v]) => `${k}: ${v}`).join(' · ');
    }
  }
  if (typeof rawVariant === 'string' && !rawVariant.startsWith('{') && !rawVariant.startsWith('[')) {
    return rawVariant;
  }
  return null;
};

/* Helper to calculate dynamic tracking steps based on order.status & paymentStatus */
const calculateTrackingSteps = (currentStatus, currentPaymentStatus) => {
  const status = (currentStatus || 'CONFIRMED').toUpperCase();
  const isPaid = (currentPaymentStatus || '').toUpperCase() === 'PAID' || status === 'PAID' || status === 'CONFIRMED';

  if (status === 'CANCELLED') {
    return [
      { status: 'Order Placed', desc: 'Received', level: 0, done: true },
      { status: 'Order Cancelled', desc: 'Refund initiated if applicable', level: 1, done: true, isCancelled: true },
    ];
  }

  if (status === 'RETURNED' || status === 'REFUNDED') {
    return [
      { status: 'Order Placed', desc: 'Received', level: 0, done: true },
      { status: 'Delivered', desc: 'Fulfilled', level: 1, done: true },
      { status: status === 'RETURNED' ? 'Returned' : 'Refunded', desc: 'Completed', level: 2, done: true, isReturn: true },
    ];
  }

  const statusLevelMap = {
    PENDING_PAYMENT: isPaid ? 1 : 0,
    PAID: 1,
    PENDING: 1,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    OUT_FOR_DELIVERY: 3,
    DELIVERED: 4,
  };

  const currentLevel = statusLevelMap[status] !== undefined ? statusLevelMap[status] : 1;

  const baseSteps = [
    { status: 'Placed', desc: 'Order received', level: 0 },
    { status: 'Confirmed', desc: 'Verified & Accepted', level: 1 },
    { status: 'Processing', desc: 'Crafting in Atelier', level: 2 },
    { status: 'Dispatched', desc: 'In Transit', level: 3 },
    { status: 'Delivered', desc: 'At Your Doorstep', level: 4 },
  ];

  return baseSteps.map(step => ({
    ...step,
    done: currentLevel >= step.level || (step.level === 1 && isPaid) || status === 'DELIVERED',
    isCurrent: currentLevel === step.level,
  }));
};

const OrderConfirmationPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orderIdFromUrl = searchParams.get('orderId') || searchParams.get('orderNumber') || searchParams.get('cartId');

  const { current: order } = useSelector(s => s.orders);
  const { code: currencyCode } = useSelector(s => s.currency);

  const [refreshing, setRefreshing] = useState(false);
  const [copiedOrderNo, setCopiedOrderNo] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [cancelReasonDetails, setCancelReasonDetails] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const targetId = orderIdFromUrl || order?.id || order?.orderNumber;

  useEffect(() => {
    if (!targetId) return;
    let isMounted = true;

    dispatch(fetchOrderById(targetId)).then(async (action) => {
      if (!isMounted) return;
      const fetchedOrder = action.payload?.order || action.payload;
      if (fetchedOrder && (fetchedOrder.paymentStatus === 'UNPAID' || fetchedOrder.status === 'PENDING_PAYMENT')) {
        const isSuccess = searchParams.get('status') === 'success' || Boolean(searchParams.get('gateway'));
        if (isSuccess) {
          try {
            const orderRef = searchParams.get('orderRef') || searchParams.get('tran_order_ref') || searchParams.get('cartId') || undefined;
            const res = await api.post('/payments/verify', { orderId: fetchedOrder.id, orderRef });
            if (res.data?.success && isMounted) {
              dispatch(fetchOrderById(targetId));
            }
          } catch (err) {
            console.warn('[OrderConfirmation] Auto-verify payment failed:', err.message);
          }
        }
      }
    });

    return () => { isMounted = false; };
  }, [targetId, dispatch]);

  const handleManualRefresh = async () => {
    if (!targetId || refreshing) return;
    setRefreshing(true);
    await dispatch(fetchOrderById(targetId));
    toast.success('Order status refreshed');
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleCopyOrderNumber = () => {
    const rawNumber = String(order?.orderNumber || order?.id || '').replace(/^#/, '');
    if (!rawNumber) return;
    navigator.clipboard.writeText(rawNumber);
    setCopiedOrderNo(true);
    toast.success('Order number copied to clipboard');
    setTimeout(() => setCopiedOrderNo(false), 2000);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!order?.id) return;
    const finalReason = cancelReason === 'Other'
      ? (cancelReasonDetails.trim() || 'Other reason')
      : (cancelReasonDetails.trim() ? `${cancelReason} - ${cancelReasonDetails.trim()}` : cancelReason);

    if (!finalReason || finalReason.trim().length < 3) {
      toast.error('Please select or specify a valid reason for cancellation.');
      return;
    }

    setIsCancelling(true);
    try {
      const result = await dispatch(cancelCustomerOrder({ id: order.id, reason: finalReason }));
      if (cancelCustomerOrder.fulfilled.match(result)) {
        toast.success('Your order has been cancelled successfully.');
        setCancelModalOpen(false);
        if (targetId) dispatch(fetchOrderById(targetId));
      } else {
        toast.error(result.payload || 'Failed to cancel order.');
      }
    } catch (err) {
      toast.error('An unexpected error occurred while cancelling order.');
    } finally {
      setIsCancelling(false);
    }
  };

  const fmt = (v) => formatOrderAmount(v, order?.currency || currencyCode);

  const isSuccessParam = searchParams.get('status') === 'success';
  const displayStatus = (order?.status === 'PENDING_PAYMENT' && isSuccessParam) ? 'CONFIRMED' : (order?.status || 'CONFIRMED');
  const displayPaymentStatus = (order?.paymentStatus === 'UNPAID' && (isSuccessParam || order?.status === 'CONFIRMED' || order?.status === 'PAID')) ? 'PAID' : (order?.paymentStatus || 'PAID');

  // 24-hour cancellation window calculation
  const orderPlacedTime = new Date(order?.createdAt || Date.now()).getTime();
  const hoursSincePlaced = (Date.now() - orderPlacedTime) / (1000 * 60 * 60);
  const isWithin24Hours = hoursSincePlaced <= 24;
  const canCancel = order && ['PENDING', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(order.status) && isWithin24Hours;
  const hoursLeft = Math.max(0, Math.floor(24 - hoursSincePlaced));
  const minsLeft = Math.max(0, Math.floor(((24 - hoursSincePlaced) % 1) * 60));

  const trackingSteps = calculateTrackingSteps(displayStatus, displayPaymentStatus);

  let addr = order?.shippingAddress || {};
  if (typeof addr === 'string') {
    try { addr = JSON.parse(addr); } catch (e) { addr = {}; }
  }
  const addrName = addr.fullName || addr.name || order?.customer?.name || 'Valued Customer';
  const addrLine1 = addr.flatHouse || addr.line1 || addr.addressLine1 || '';
  const addrLine2 = addr.areaStreet || addr.line2 || addr.addressLine2 || '';
  const addrCityStateZip = [
    addr.city,
    addr.state,
    addr.pincode || addr.zipCode || addr.zip_code
  ].filter(Boolean).join(', ');
  const addrPhone = addr.phone || order?.customer?.phone;
  const addrEmail = addr.email || order?.customer?.email;

  // Order items resolution
  const items = order?.items || order?.OrderItems || [];
  const subtotal = Number(order?.subtotal || items.reduce((sum, item) => sum + (Number(item.totalPrice) || (Number(item.quantity || item.qty || 1) * Number(item.unitPrice || item.price || 0))), 0));
  const totalDiscount = Number(order?.discountAmount || order?.discount || 0);
  const explicitCouponDisc = Number(order?.couponDiscount || 0);
  const resolvedCouponDiscount = explicitCouponDisc > 0 ? explicitCouponDisc : totalDiscount;

  const shippingAmount = Number(order?.shippingAmount || 0);
  const explicitGw = Number(order?.giftWrapFee || order?.giftWrapPrice || 0);
  const calculatedGwDiff = Math.round(Number(order?.totalAmount || 0) - (subtotal + shippingAmount - totalDiscount));
  const giftWrapFee = explicitGw > 0 ? explicitGw : (calculatedGwDiff > 0 ? calculatedGwDiff : 0);
  const totalAmount = Number(order?.totalAmount || (subtotal + shippingAmount + giftWrapFee - totalDiscount));

  const formattedDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Estimated delivery calculation (typically 4-6 business days)
  const estDeliveryDate = new Date(orderPlacedTime + (5 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  return (
    <main id="main-content" className="bg-[#FAF9F5]/60 min-h-screen text-neutral-800">
      {/* ── LUXURY CELEBRATION HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#FCFAF6] to-[#FAF9F5] pt-10 pb-12 sm:pt-14 sm:pb-16 border-b border-neutral-200/70">
        {/* Soft background accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[250px] bg-gradient-to-b from-[#BEA266]/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Animated Gold Checkmark Crest */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative mx-auto w-20 h-20 sm:w-22 sm:h-22 mb-6 flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-[#BEA266]/20 animate-ping opacity-25" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-tr from-[#17130B] via-[#2B2317] to-[#17130B] flex items-center justify-center shadow-xl border-2 border-[#BEA266]/40">
              <CheckCircle2 size={42} className="text-[#F3E7C6]" strokeWidth={1.75} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#BEA266]/10 text-[#996822] text-[11px] font-bold uppercase tracking-[0.2em] border border-[#BEA266]/20 mb-3">
              Order Successfully Placed
            </span>

            <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight">
              Thank You for Your Order
            </h1>

            <p className="text-neutral-600 text-xs sm:text-sm md:text-base mt-2.5 max-w-xl mx-auto leading-relaxed">
           We have received your order and are preparing it with care. 
              {addrEmail && (
                <> Your order confirmation has been sent to <span className="font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-2">{addrEmail}</span>.</>
              )}
            </p>

            {/* Order Identity & Action Ribbon */}
            {order && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs">
                {/* Order Number pill with copy */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/90 shadow-2xs">
                  <span className="text-neutral-500">Order ID:</span>
                  <span className="font-sans font-bold text-neutral-900 tracking-wide">
                    #{String(order.orderNumber || order.id || '').replace(/^#/, '')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="text-neutral-400 hover:text-neutral-700 transition-colors p-0.5"
                    title="Copy Order ID"
                  >
                    {copiedOrderNo ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* Status pill */}
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-2xs ${
                  displayStatus === 'DELIVERED' || displayStatus === 'PAID' || displayStatus === 'CONFIRMED'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : displayStatus === 'CANCELLED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    displayStatus === 'CANCELLED' ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                  }`} />
                  {displayStatus.replace(/_/g, ' ')}
                </span>

                {/* Date pill */}
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/90 text-neutral-600 shadow-2xs">
                  <Calendar size={13} className="text-[#BEA266]" />
                  <span>{formattedDate}</span>
                </div>

                {/* Refresh Status button */}
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-neutral-600 border border-neutral-200/90 shadow-2xs transition-all cursor-pointer text-xs"
                  title="Sync latest tracking status"
                >
                  <RefreshCw size={12} className={`text-[#BEA266] ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">{refreshing ? 'Syncing…' : 'Sync'}</span>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── MAIN CONTENT WRAPPER ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── MODERN HORIZONTAL ORDER PROGRESS TRACKER ── */}
        {order && (
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 sm:p-7 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FAF5E8] text-[#996822] flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <h3 className="font-playfair text-base sm:text-lg font-bold text-neutral-900">
                    Fulfillment & Delivery Journey
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Real-time status updates directly from our logistics network
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold block">
                  Estimated Delivery
                </span>
                <span className="text-xs sm:text-sm font-bold text-neutral-900 font-sans flex items-center gap-1.5">
                  <Truck size={14} className="text-[#BEA266]" />
                  {estDeliveryDate} (Standard Express)
                </span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="pt-6 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative">
                {/* Connecting Track line for Desktop */}
                <div className="hidden sm:block absolute top-[18px] left-[10%] right-[10%] h-[2px] bg-neutral-200 -z-0">
                  <div
                    className="h-full bg-gradient-to-r from-[#BEA266] to-[#17130B] transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (trackingSteps.filter(s => s.done).length - 1) * 25)}%`
                    }}
                  />
                </div>

                {trackingSteps.map((step, idx) => (
                  <div key={step.status || idx} className="flex flex-col items-center text-center relative z-10 group">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      step.isCancelled
                        ? 'bg-rose-500 text-white shadow-md'
                        : step.done
                        ? 'bg-[#17130B] text-[#F3E7C6] border-2 border-[#BEA266] shadow-sm'
                        : 'bg-white border-2 border-neutral-300 text-neutral-400'
                    }`}>
                      {step.isCancelled ? (
                        <X size={15} />
                      ) : step.done ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <p className={`text-xs font-bold mt-2.5 ${step.done ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {step.status}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-tight">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 24-HOUR CANCELLATION NOTICE (ELEGANT LUXURY BANNER) ── */}
        {canCancel && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-amber-50/90 border border-amber-200/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-neutral-900">
                  24-Hour Complimentary Cancellation Window Active
                </p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Need to change your mind or size? You have <span className="font-bold text-amber-900">{hoursLeft} hours {minsLeft} minutes</span> remaining to cancel without penalty.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 bg-white border border-rose-200 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              id="confirm-cancel-btn-banner"
            >
              <XCircle size={14} /> Cancel Order
            </button>
          </div>
        )}

        {/* ── TWO-COLUMN DETAILS & FINANCIAL BREAKDOWN ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ══════════════════════════════════════════════════
              LEFT COLUMN: Order Items & Shipping Address (7 Cols)
          ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Items in this Order */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 sm:p-7">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <h3 className="font-playfair text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-[#BEA266]" />
                  <span>Purchased Items</span>
                </h3>
                <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100">
                {items.map((item, idx) => {
                  const variantInfo = getVariantString(item.selectedVariant || item.variant);
                  const rawImg = item.displayImage || item.variantImage || item.variant?.image || item.image || item.productImage || item.product?.images?.[0] || item.product?.image;
                  const imgSrc = getImageUrl(rawImg) || getPlaceholderSvg(item.productName || item.name || 'Product');
                  const productName = item.productName || item.name || item.product?.title || 'Luxury Garment';
                  const qty = Number(item.quantity || item.qty || 1);
                  const unitPrice = Number(item.unitPrice || item.price || 0);
                  const lineTotal = Number(item.totalPrice || (qty * unitPrice));
                  const productSlug = item.product?.slug || item.productId || item.product?.id;

                  return (
                    <div key={item.id || idx} className="py-4 first:pt-4 last:pb-0 flex items-center gap-3.5 sm:gap-4">
                      {/* Product Thumbnail */}
                      <div className="relative shrink-0 my-0.5">
                        <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-50 shadow-2xs">
                          <img
                            src={imgSrc}
                            alt={productName}
                            className="w-full h-full object-cover object-center"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getPlaceholderSvg(productName);
                            }}
                          />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm z-10 font-sans pointer-events-none">
                          {qty}
                        </span>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        {productSlug ? (
                          <Link
                            to={`/product/${productSlug}`}
                            className="font-medium text-xs sm:text-sm text-neutral-900 hover:text-[#996822] transition-colors line-clamp-1 block leading-snug"
                          >
                            {productName}
                          </Link>
                        ) : (
                          <h4 className="font-medium text-xs sm:text-sm text-neutral-900 line-clamp-1 leading-snug">
                            {productName}
                          </h4>
                        )}

                        {variantInfo && (
                          <p className="text-[11px] text-neutral-500 mt-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 font-sans font-medium text-neutral-700">
                              {variantInfo}
                            </span>
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                          <span>Qty: <strong className="text-neutral-700">{qty}</strong></span>
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 tabular-nums">
                          {fmt(lineTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Delivery & Recipient Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 sm:p-7">
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
                <h3 className="font-playfair text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <MapPin size={18} className="text-[#BEA266]" />
                  <span>Delivery Destination</span>
                </h3>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> Verified Address
                </span>
              </div>

              <div className="pt-3.5 space-y-2 text-xs sm:text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-neutral-900 text-sm">{addrName}</span>
                </div>

                <p className="text-neutral-600 leading-relaxed break-words">
                  {addrLine1}
                  {addrLine2 && `, ${addrLine2}`}
                  {addr.landmark && `, Near ${addr.landmark}`}
                  {addrCityStateZip && `, ${addrCityStateZip}`}
                  {addr.country && `, ${addr.country}`}
                </p>

                {(addrPhone || addrEmail) && (
                  <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 border-t border-neutral-100">
                    {addrPhone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={13} className="text-[#BEA266]" />
                        <span className="text-neutral-800 font-medium">{addrPhone}</span>
                      </span>
                    )}
                    {addrEmail && (
                      <span className="flex items-center gap-1.5">
                        <Mail size={13} className="text-[#BEA266]" />
                        <span className="text-neutral-800 font-medium">{addrEmail}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Courier Delivery Method Note */}
              <div className="mt-4 p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/80 flex items-center gap-3">
                <Truck size={18} className="text-[#BEA266] shrink-0" />
                <div className="text-xs text-neutral-600">
                  <span className="font-semibold text-neutral-900">Standard Insured Courier: </span>
                  Dispatched in pristine luxury garment packaging with real-time transit telemetry.
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              RIGHT COLUMN: Payment Receipt & Quick Actions (5 Cols)
          ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
            {/* Financial Summary Receipt Card */}
            <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-5 sm:p-7 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100">
                <h3 className="font-playfair text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <FileText size={18} className="text-[#BEA266]" />
                  <span>Order Summary</span>
                </h3>
                <span className="text-[11px] font-sans font-medium text-neutral-400 tracking-wider">
                  RECEIPT #{String(order?.id || '').slice(-6).toUpperCase()}
                </span>
              </div>

              {/* Price Rows */}
              <div className="space-y-2.5 text-xs sm:text-[13px] text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">{fmt(subtotal)}</span>
                </div>

                {resolvedCouponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span className="flex items-center gap-1">
                      Coupon Discount {order?.coupon?.code && `(${order.coupon.code})`}
                    </span>
                    <span className="font-bold tabular-nums">-{fmt(resolvedCouponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery & Handling</span>
                  <span>
                    {shippingAmount === 0 ? (
                      <span className="font-bold text-emerald-700 uppercase text-xs">FREE</span>
                    ) : (
                      <span className="font-semibold text-neutral-900 tabular-nums">{fmt(shippingAmount)}</span>
                    )}
                  </span>
                </div>

                {giftWrapFee > 0 && (
                  <div className="flex justify-between">
                    <span>Signature Gift Packaging</span>
                    <span className="font-semibold text-neutral-900 tabular-nums">{fmt(giftWrapFee)}</span>
                  </div>
                )}

                {/* Total */}
                <div className="pt-3.5 border-t border-neutral-200 flex justify-between items-center gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-sans">
                      Total Paid
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-0.5 font-sans">Inclusive of all taxes & GST</p>
                  </div>
                  <div className="text-right">
                    <span className="font-sans text-base sm:text-lg font-bold text-neutral-900 tabular-nums">
                      {fmt(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details Pill Box */}
              <div className="mt-4 pt-4 border-t border-neutral-100 bg-neutral-50/70 -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 p-4 sm:p-5 rounded-b-2xl space-y-2 text-xs font-sans">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Mode</span>
                  <span className="font-semibold text-neutral-900 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-[#BEA266]" />
                    {order?.paymentMethod || 'Razorpay Secure'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Payment Status</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[11px] uppercase tracking-wider ${
                    displayPaymentStatus === 'PAID'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {displayPaymentStatus}
                  </span>
                </div>

                {order?.razorpay_payment_id && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-neutral-500">Transaction ID</span>
                    <span className="font-sans text-[11px] font-medium text-neutral-700 truncate max-w-[170px]" title={order.razorpay_payment_id}>
                      {order.razorpay_payment_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                to="/products"
                className="w-full py-3.5 px-4 rounded-xl bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs sm:text-sm uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                id="continue-shopping-confirm"
              >
                <span>Continue Shopping</span>
                <ArrowRight size={15} />
              </Link>

              <div className="text-center pt-1">
                <Link
                  to="/account/orders"
                  className="text-xs font-semibold text-[#996822] hover:text-[#7a5116] hover:underline transition-colors inline-flex items-center gap-1"
                  id="view-orders"
                >
                  <span>View All Orders in Account</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ORDER CANCELLATION MODAL ── */}
      <AnimatePresence>
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 sm:p-7 relative border border-neutral-100 max-h-[90vh] flex flex-col"
            >
              <button
                type="button"
                onClick={() => !isCancelling && setCancelModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 p-1.5 rounded-full hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-bold text-neutral-900 leading-tight">
                    Cancel Order #{String(order?.orderNumber || order?.id || '').replace(/^#/, '')}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Complimentary cancellation window: {hoursLeft}h {minsLeft}m remaining.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCancelSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5 uppercase tracking-wider">
                    Reason for Cancellation <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full border border-neutral-300 rounded-xl px-3.5 py-2.5 text-xs bg-white focus:outline-none focus:border-[#BEA266] font-medium text-neutral-800"
                    required
                  >
                    <option value="Ordered by mistake">Ordered by mistake</option>
                    <option value="Found a better price / alternative elsewhere">Found a better price / alternative elsewhere</option>
                    <option value="Incorrect delivery address / contact details">Incorrect delivery address / contact details</option>
                    <option value="Delivery time is too long / delayed">Delivery time is too long / delayed</option>
                    <option value="Need to change variant, size, or color">Need to change variant, size, or color</option>
                    <option value="Changed mind / No longer required">Changed mind / No longer required</option>
                    <option value="Other">Other reason (specify below)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-800 mb-1.5 uppercase tracking-wider">
                    Additional Details {cancelReason === 'Other' ? <span className="text-rose-500">*</span> : <span className="text-neutral-400 font-normal">(Optional)</span>}
                  </label>
                  <textarea
                    rows={3}
                    value={cancelReasonDetails}
                    onChange={(e) => setCancelReasonDetails(e.target.value)}
                    placeholder={cancelReason === 'Other' ? "Please explain why you wish to cancel this order..." : "Any additional notes for our support team..."}
                    required={cancelReason === 'Other'}
                    className="w-full border border-neutral-300 rounded-xl p-3 text-xs bg-white focus:outline-none focus:border-[#BEA266]"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => setCancelModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2.5 border border-neutral-200 text-neutral-600 text-xs font-semibold rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    Keep My Order
                  </button>
                  <button
                    type="submit"
                    disabled={isCancelling}
                    className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    id="btn-confirm-cancel-order"
                  >
                    {isCancelling ? (
                      <>
                        <RefreshCw size={13} className="animate-spin text-white" />
                        <span>Processing…</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        <span>Confirm Cancellation</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
};

export default OrderConfirmationPage;
