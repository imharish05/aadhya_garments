import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MapPin, CreditCard, Package, ChevronRight, Eye, EyeOff, Tag, Sparkles, ShieldAlert, ShieldCheck, AlertTriangle, Lightbulb, Truck, Award, Lock, ShoppingBag } from 'lucide-react';
import { placeOrder } from '../redux/slices/ordersSlice';
import { clearLocal, syncCart, clearBuyNowItem, fetchCart, mergeGuestCart, openCart } from '../redux/slices/cartSlice';
import { fetchWishlist } from '../redux/slices/wishlistSlice';
import { loginCustomer, registerCustomer, fetchProfile } from '../redux/slices/authSlice';
import { setCurrency } from '../redux/slices/currencySlice';
import api from '../services/api';
import Footer from '../components/Footer';
import { formatPrice } from '../utils/currency';
import toast from 'react-hot-toast';
import { formatVariantName } from '../utils/variantFormatter';
import { validatePhoneNumber } from '../utils/validation';
import PhoneInput from '../components/PhoneInput';
import { getImageUrl } from '../utils/imageUrl';
import SavedAddressPicker from '../components/SavedAddressPicker';

const STEPS = [
  { id: 1, label: 'Delivery', icon: MapPin },
  { id: 2, label: 'Review', icon: Package },
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep',
  'Puducherry',
];

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isBuyNowMode = searchParams.get('mode') === 'buynow';

  const { items: cartItems, subtotal: cartSubtotal, buyNowItem } = useSelector(s => s.cart);
  const { isAuthenticated, customer } = useSelector(s => s.auth);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  const items = isBuyNowMode && buyNowItem ? [buyNowItem] : cartItems;
  const orderCompletedRef = useRef(false);

  const subtotal = items.reduce((sum, item) => {
    const price = parseFloat(item.priceAtAdd || item.price || item.product?.price || 0);
    return sum + (price * (item.quantity || 1));
  }, 0);

  // Login panel state
  const [showLoginPanel, setShowLoginPanel] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Create account state
  const [createAccount, setCreateAccount] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Checkout state
  const [step, setStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bb_checkout_step');
      return saved ? Number(JSON.parse(saved)) : 1;
    } catch {
      return 1;
    }
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Admin-configurable OTP threshold settings (Default: INR 20,000 / AED 800, COD Only: true)
  const [otpSettings, setOtpSettings] = useState({
    inrThreshold: 20000,
    aedThreshold: 800,
    requireCodOtp: true,
    codOnly: true,
  });

  // Dynamic Tax / GST Rate
  const [taxRate, setTaxRate] = useState(5);

  useEffect(() => {
    api.get('/settings/otp_threshold')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setOtpSettings({
            inrThreshold: Number(res.data.data.inrThreshold) || 20000,
            aedThreshold: Number(res.data.data.aedThreshold) || 800,
            requireCodOtp: res.data.data.requireCodOtp !== false,
            codOnly: res.data.data.codOnly !== false,
          });
        }
      })
      .catch(err => {
        console.warn('[Checkout] Using default OTP thresholds (INR 20,000 / AED 800):', err.message);
      });

    api.get('/site-settings/tax')
      .then(res => {
        if (res.data?.success && res.data?.data && res.data.data.taxRate !== undefined) {
          setTaxRate(Math.max(0, Number(res.data.data.taxRate)));
        }
      })
      .catch(err => console.warn('[Checkout] Failed to fetch tax settings', err));
  }, []);

  const getItemDetails = (item) => {
    const name = item.product?.name || item.productName || item.name || 'Luxury Product';

    // Resolve image URL
    let rawImg = item.variant?.image || item.variantImage || item.image || item.productImage || item.product?.defaultProductImage || (item.product?.images && item.product.images[0]);
    if (!rawImg || rawImg === 'undefined') {
      rawImg = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=160';
    } else {
      rawImg = getImageUrl(rawImg);
    }

    // Variant details
    const variantText = formatVariantName(item.selectedVariant || item.variant);

    const price = parseFloat(item.priceAtAdd || item.price || item.unitPrice || item.product?.price || 0);

    return { name, image: rawImg, variantText, price };
  };

  const handleTriggerFraudCheck = async () => {
    const targetEmail = (billingAddress.email || customer?.email || '').trim();
    if (!targetEmail) {
      toast.error('Please provide a valid email address for order verification.');
      return;
    }
    setOtp('');
    setOtpLoading(true);
    try {
      const res = await api.post('/auth/send-checkout-otp', {
        email: targetEmail,
        name: billingAddress.fullName || customer?.name || 'Customer'
      });
      setOtpSent(true);
      toast.success(res.data?.message || `Verification OTP sent to ${targetEmail}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification email. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyFraudOtp = async (codeValue) => {
    const code = codeValue || otp;
    if (code.length < 6) {
      toast.error('Please enter the full 6-digit code.');
      return;
    }
    const targetEmail = (billingAddress.email || customer?.email || '').trim();
    setVerifyingOtp(true);
    try {
      await api.post('/auth/verify-checkout-otp', {
        email: targetEmail,
        otp: code
      });
      setIsVerified(true);
      setOtpSent(false);
      toast.success('Security verification successful!');
      handlePlaceOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const fmt = (v) => formatPrice(v, currencyCode, currencyRate);

  const getEstimatedDeliveryRange = (pincode) => {
    let minDays = 3, maxDays = 5;
    if (pincode && pincode.trim().length === 6) {
      const fd = pincode.trim()[0];
      if (['1', '4', '5', '6'].includes(fd)) { minDays = 2; maxDays = 3; }
      else { minDays = 4; maxDays = 7; }
    }
    const today = new Date();
    const minDate = new Date(); minDate.setDate(today.getDate() + minDays);
    const maxDate = new Date(); maxDate.setDate(today.getDate() + maxDays);
    const opts = { weekday: 'short', day: 'numeric', month: 'short' };
    return `${minDate.toLocaleDateString('en-US', opts)} — ${maxDate.toLocaleDateString('en-US', opts)}`;
  };

  const emptyAddr = {
    fullName: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    flatHouse: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
  };

  const [billingAddress, setBillingAddress] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bb_checkout_billing_address');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ...emptyAddr };
  });

  const [deliverySameAsBilling, setDeliverySameAsBilling] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bb_checkout_same_delivery');
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return true;
  });

  const [address, setAddress] = useState(() => {
    try {
      const saved = sessionStorage.getItem('bb_checkout_delivery_address');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { ...emptyAddr, country: 'India' };
  });

  const [billingMode, setBillingMode] = useState({
    isSaved: false,
    isEditing: false,
    hasSaved: false,
    selectedAddress: null,
    loaded: !isAuthenticated || !customer,
  });

  const [deliveryMode, setDeliveryMode] = useState({
    isSaved: false,
    isEditing: false,
    hasSaved: false,
    selectedAddress: null,
    loaded: !isAuthenticated || !customer,
  });

  const hasBillingErrors = Object.keys(fieldErrors).some(k =>
    ['fullName', 'phone', 'email', 'flatHouse', 'city', 'state', 'pincode', 'country'].includes(k) && fieldErrors[k]
  );
  const showBillingInputs =
    (!isAuthenticated || !customer)
      ? true
      : !billingMode.loaded
        ? false
        : (!billingMode.hasSaved || !billingMode.isSaved || billingMode.isEditing || Boolean(hasBillingErrors));

  const hasDeliveryErrors = Object.keys(fieldErrors).some(k =>
    ['del_fullName', 'del_phone', 'del_email', 'del_flatHouse', 'del_city', 'del_state', 'del_pincode'].includes(k) && fieldErrors[k]
  );
  const showDeliveryInputs =
    (!isAuthenticated || !customer)
      ? true
      : !deliveryMode.loaded
        ? false
        : (!deliveryMode.hasSaved || !deliveryMode.isSaved || deliveryMode.isEditing || Boolean(hasDeliveryErrors));

  // Populate customer profile defaults if address fields are empty
  useEffect(() => {
    if (customer) {
      setBillingAddress(prev => ({
        ...prev,
        fullName: prev.fullName || customer.name || '',
        phone: prev.phone || customer.phone || '',
        email: prev.email || customer.email || '',
      }));
    }
  }, [customer]);

  // Persist checkout step and addresses across browser refreshes
  useEffect(() => {
    try {
      sessionStorage.setItem('bb_checkout_step', JSON.stringify(step));
      sessionStorage.setItem('bb_checkout_billing_address', JSON.stringify(billingAddress));
      sessionStorage.setItem('bb_checkout_delivery_address', JSON.stringify(address));
      sessionStorage.setItem('bb_checkout_same_delivery', JSON.stringify(deliverySameAsBilling));
    } catch (err) {
      console.warn('[Checkout] Failed to save draft state to sessionStorage:', err);
    }
  }, [step, billingAddress, address, deliverySameAsBilling]);

  // Fallback: If on step 2 but required billing address fields are missing, return to step 1
  useEffect(() => {
    if (step === 2) {
      const isComplete = billingAddress.fullName?.trim() && billingAddress.phone?.trim() && billingAddress.email?.trim() && billingAddress.flatHouse?.trim() && billingAddress.city?.trim() && billingAddress.state?.trim();
      if (!isComplete) {
        setStep(1);
      }
    }
  }, [step, billingAddress]);

  // Handle browser back button when on step 2: return to step 1 instead of exiting checkout
  useEffect(() => {
    if (step === 2) {
      window.history.pushState({ checkoutStep: 2 }, '');
      const handlePopState = () => {
        setStep(1);
      };
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [step]);

  const [paymentMethod, setPaymentMethod] = useState('Razorpay Secure Online');
  const [geoCountry, setGeoCountry] = useState('IN');
  const [geoBlocked, setGeoBlocked] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');

  // Auto Geolocation detection on mount
  useEffect(() => {
    const geoQuery = location.search ? location.search : '';
    api.get(`/payments/geo-detect${geoQuery}`)
      .then(res => {
        if (res.data?.success) {
          if (!res.data.isAllowed) {
            setGeoBlocked(true);
            setGeoMessage('');
          } else {
            setGeoBlocked(false);
            const detectedCountry = res.data.countryCode || 'IN';
            setGeoCountry(detectedCountry);
            setPaymentMethod('Razorpay Secure Online');
            // Only set initial display currency if user hasn't explicitly chosen one yet via toggle
            const savedCurrency = localStorage.getItem('bb_currency');
            if (!savedCurrency && res.data.currency) {
              dispatch(setCurrency(res.data.currency));
            }
          }
        }
      })
      .catch(err => {
        console.warn('[Checkout] Geo-detection fallback to default:', err.message);
      });
  }, [dispatch, location.search]);


  const [sameDeliveryError, setSameDeliveryError] = useState('');

  const handleToggleDeliverySame = (checked) => {
    if (checked) {
      setSameDeliveryError('');
      setDeliverySameAsBilling(true);
      setAddress({ ...billingAddress, country: 'India' });
      toast.success('Delivery address set to same as billing address.');
    } else {
      setSameDeliveryError('');
      setDeliverySameAsBilling(false);
      setAddress({ ...emptyAddr, country: 'India' });
    }
  };

  // Delivery Zone Pincode Lookup for Dynamic Shipping Charge
  const [pincodeZoneData, setPincodeZoneData] = useState(null);
  const activePincode = (deliverySameAsBilling ? billingAddress.pincode : address.pincode || '').toString().trim();


  useEffect(() => {
    if (!activePincode || activePincode.length < 3) {
      setPincodeZoneData(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/delivery-zones/check/${activePincode}`);
        if (res.data && res.data.success && res.data.deliverable) {
          setPincodeZoneData(res.data);
        } else if (res.data && res.data.deliverable === false) {
          setPincodeZoneData({ deliverable: false, message: res.data.message });
        } else {
          setPincodeZoneData(null);
        }
      } catch (err) {
        setPincodeZoneData(null);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [activePincode]);

  // Fetch live cart on mount to ensure fresh stock and live GST rate
  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Guard: don't let an empty cart sit on checkout (unless order was just completed and navigating to confirmation)
  useEffect(() => {
    if (items.length === 0 && !orderCompletedRef.current) {
      toast.error('Your cart is empty. Add something before checking out.');
      dispatch(openCart());
      navigate('/products', { replace: true });
    }
  }, [items, navigate]);

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const saved = localStorage.getItem('bb_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/coupons');
        let active = [];
        if (res.data?.success && Array.isArray(res.data.coupons)) {
          active = res.data.coupons.filter(c => c.isActive !== false && String(c.isActive) !== '0' && String(c.isActive) !== 'false');
        }
        setAvailableCoupons(active);
        
        // Always refresh appliedCoupon with the latest server data so cached old values are replaced
        if (appliedCoupon) {
          const fresh = active.find(c => c.code?.toUpperCase() === appliedCoupon.code?.toUpperCase());
          if (fresh) {
            setAppliedCoupon(fresh);
            localStorage.setItem('bb_applied_coupon', JSON.stringify(fresh));
          } else {
            setAppliedCoupon(null);
            localStorage.removeItem('bb_applied_coupon');
          }
        }
      } catch (err) {
        console.warn('Failed to load coupons from API:', err.message);
        setAvailableCoupons([]);
      }
    };
    fetchCoupons();
  }, []);

  const [userDiscountChoice, setUserDiscountChoice] = useState(null); // 'COUPON' | 'NONE' | null

  const getCouponDiscount = (coupon, totalVal) => {
    if (!coupon) return 0;
    if (totalVal < Number(coupon.minOrderValue || 0)) return 0;
    const now = new Date();
    if (coupon.validFrom) {
      const from = new Date(coupon.validFrom);
      if (!isNaN(from.getTime()) && from > now) return 0;
    }
    if (coupon.validUntil) {
      const until = new Date(coupon.validUntil);
      if (!isNaN(until.getTime()) && until < now) return 0;
    }

    const value = Number(coupon.value || 0);
    const type = String(coupon.type || '').toUpperCase();
    if (type === 'PERCENT') {
      const maxD = Number(coupon.maxDiscount || Infinity);
      return Math.min((totalVal * value) / 100, maxD);
    }
    if (type === 'FLAT') {
      return Math.min(value, totalVal);
    }
    return 0;
  };

  // ── AUTO-APPLY BEST COUPON ENGINE ──
  let bestCoupon = null;
  let bestCouponDisc = 0;
  if (availableCoupons && availableCoupons.length > 0) {
    availableCoupons.forEach(coupon => {
      const d = getCouponDiscount(coupon, subtotal);
      if (d > bestCouponDisc) {
        bestCouponDisc = d;
        bestCoupon = coupon;
      }
    });
  }

  let activeDiscountType = null; // 'COUPON' | null
  let couponDiscount = 0;

  if (userDiscountChoice === 'COUPON') {
    const activeCpn = appliedCoupon || bestCoupon;
    const disc = activeCpn ? getCouponDiscount(activeCpn, subtotal) : 0;
    if (disc > 0) {
      activeDiscountType = 'COUPON';
      couponDiscount = disc;
    }
  } else if (userDiscountChoice === 'NONE') {
    activeDiscountType = null;
  } else {
    // Default: Auto-select best coupon
    if (bestCouponDisc > 0) {
      activeDiscountType = 'COUPON';
      couponDiscount = bestCouponDisc;
    }
  }

  const activeCouponObj = activeDiscountType === 'COUPON'
    ? (userDiscountChoice === 'COUPON' ? (appliedCoupon || bestCoupon) : bestCoupon)
    : null;

  const handleApplyCheckoutCoupon = async (overrideCode = null) => {
    const code = (typeof overrideCode === 'string' ? overrideCode : couponCodeInput).trim().toUpperCase();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', { code, subtotal });
      if (res.data?.success && res.data?.valid) {
        const cpn = res.data.coupon;
        const disc = res.data.discountAmount !== undefined ? Number(res.data.discountAmount) : getCouponDiscount(cpn, subtotal);
        if (disc <= 0 && cpn?.type !== 'FREE_SHIPPING') {
          toast.error(`Coupon ${cpn.code} is valid but provides no discount for this order value.`);
          return;
        }
        setAppliedCoupon(cpn);
        localStorage.setItem('bb_applied_coupon', JSON.stringify(cpn));
        setUserDiscountChoice('COUPON');
        toast.success(`Coupon ${cpn.code} applied! Saved ₹${Math.round(disc)}`);
        setCouponCodeInput('');
      } else {
        toast.error(res.data?.message || 'Invalid coupon code');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCheckoutCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('bb_applied_coupon');
    setUserDiscountChoice('NONE');
    toast.success('Coupon removed.');
  };

  const handleResetToAutoSelect = () => {
    setUserDiscountChoice(null);
    setAppliedCoupon(null);
    localStorage.removeItem('bb_applied_coupon');
    toast.success('Auto-selected best discount for your order!');
  };

  let shipping = 0;
  let shippingStatus = 'PENDING'; // 'PENDING' | 'DELIVERABLE' | 'NOT_DELIVERABLE'

  if (!activePincode || activePincode.trim().length < 3) {
    shippingStatus = 'PENDING';
    shipping = 0;
  } else if (pincodeZoneData) {
    if (pincodeZoneData.deliverable) {
      shippingStatus = 'DELIVERABLE';
      if (pincodeZoneData.minOrderAmountForFreeDelivery !== null && pincodeZoneData.minOrderAmountForFreeDelivery !== undefined && subtotal >= pincodeZoneData.minOrderAmountForFreeDelivery) {
        shipping = 0;
      } else {
        shipping = parseFloat(pincodeZoneData.deliveryCharge || 0);
      }
    } else {
      shippingStatus = 'NOT_DELIVERABLE';
      shipping = 0;
    }
  } else {
    shippingStatus = 'PENDING';
    shipping = 0;
  }
  const totalDiscount = couponDiscount;
  const taxableSubtotal = Math.max(0, subtotal - totalDiscount);

  // Compute GST per item using product / variant gstRate
  let tax = 0;
  let weightedTaxSum = 0;
  items.forEach(item => {
    const price = Number(item.price || item.selectedVariant?.price || item.product?.price || 0);
    const qty = Number(item.quantity || 1);
    const itemLineTotal = price * qty;
    const itemDiscount = subtotal > 0 ? (totalDiscount * itemLineTotal) / subtotal : 0;
    const itemTaxable = Math.max(0, itemLineTotal - itemDiscount);

    const rawGst = item.selectedVariant?.gstRate ?? item.variant?.gstRate ?? item.product?.gstRate ?? item.gstRate ?? '0%';
    const parsedRate = parseFloat(String(rawGst).replace(/[^0-9.]/g, ''));
    const itemGstRate = !isNaN(parsedRate) ? parsedRate : 0;

    const itemTax = Math.round((itemTaxable * itemGstRate) / (100 + itemGstRate));
    tax += itemTax;
    weightedTaxSum += itemGstRate * itemLineTotal;
  });

  const effectiveTaxRate = subtotal > 0 ? Math.round((weightedTaxSum / subtotal) * 10) / 10 : 0;

  // Total = taxableSubtotal (GST-inclusive) + shipping
  const total = taxableSubtotal + shipping;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) { toast.error('Enter your email and password'); return; }
    setLoginLoading(true);
    try {
      await dispatch(loginCustomer({ email: loginEmail, password: loginPassword })).unwrap();
      dispatch(fetchWishlist());
      dispatch(mergeGuestCart());
      toast.success('Logged in successfully!');
      setShowLoginPanel(false);
    } catch (err) {
      toast.error(err || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!billingAddress.fullName?.trim()) {
      toast.error('Please enter your Full Name in the Billing Address section above.');
      return;
    }
    if (!billingAddress.email?.trim()) {
      toast.error('Please enter your Email Address in the Billing Address section above.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingAddress.email.trim())) {
      toast.error('Please enter a valid email address in the Billing Address section.');
      return;
    }
    if (!billingAddress.phone?.trim()) {
      toast.error('Please enter your Mobile Number in the Billing Address section above.');
      return;
    }
    const phoneValidation = validatePhoneNumber(billingAddress.phone);
    if (!phoneValidation.isValid) {
      toast.error('Billing Phone: ' + phoneValidation.message);
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    setRegisterLoading(true);
    try {
      await dispatch(registerCustomer({
        name: billingAddress.fullName.trim(),
        email: billingAddress.email.trim().toLowerCase(),
        password: newPassword,
        phone: billingAddress.phone.trim()
      })).unwrap();
      dispatch(fetchWishlist());
      dispatch(fetchCart());
      toast.success('Account created and logged in successfully!');
    } catch (err) {
      toast.error(err || 'Registration failed. Please check your details.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Preload Razorpay SDK on mount for instant payment popup
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Helper to dynamically load Razorpay checkout script with caching & pre-check
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existingScript) {
        if (typeof window !== 'undefined' && window.Razorpay) return resolve(true);
        existingScript.addEventListener('load', () => resolve(true), { once: true });
        existingScript.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(typeof window !== 'undefined' && !!window.Razorpay), 6000);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
      setTimeout(() => resolve(typeof window !== 'undefined' && !!window.Razorpay), 10000);
    });
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to your account to place an order.');
      setStep(1);
      setShowLoginPanel(true);
      return;
    }
    if (items.length === 0) {
      toast.error('Your cart is empty. Add something before checking out.');
      dispatch(openCart());
      navigate('/products');
      return;
    }
    if (shippingStatus === 'NOT_DELIVERABLE') {
      toast.error('The selected delivery address / pincode is not deliverable. Please choose a deliverable address.');
      setStep(1);
      return;
    }
    setPlacing(true);
    try {
      // 1. If checking out the shopping cart, sync the client's current cart list to the server database first
      if (!isBuyNowMode) {
        const itemsToSync = items.map(i => ({
          productId: i.productId,
          variantId: i.variantId || i.selectedVariant?.id || null,
          quantity: i.quantity,
          selectedVariant: i.selectedVariant || {}
        }));
        await dispatch(syncCart(itemsToSync)).unwrap();
      }


      const isCod = paymentMethod === 'Cash on Delivery (COD)';
      const effectivePaymentMethod = isCod ? 'Cash on Delivery (COD)' : 'Razorpay Secure Online';

      // 2. Proceed with order placement using server-side cart or isolated Buy Now item
      const targetCountry = 'India';
      const referralCode = localStorage.getItem('bb_referral') || undefined;
      const order = await dispatch(placeOrder({
        shippingAddress: { ...(deliverySameAsBilling ? billingAddress : address), country: 'India' },
        billingAddress: { ...billingAddress, country: targetCountry },
        paymentMethod: effectivePaymentMethod,
        referralCode,
        couponCode: activeDiscountType === 'COUPON' && activeCouponObj ? activeCouponObj.code : undefined,
        geoCountry: geoCountry || 'IN',
        requestedCurrency: 'INR',
        currencyRate: 1,
        isBuyNow: isBuyNowMode,
        buyNowItem: isBuyNowMode && buyNowItem ? {
          productId: buyNowItem.productId,
          variantId: buyNowItem.variantId || buyNowItem.selectedVariant?.id || null,
          quantity: buyNowItem.quantity || 1,
          selectedVariant: buyNowItem.selectedVariant || {}
        } : undefined,
      })).unwrap();

      const finishOrderClear = () => {
        orderCompletedRef.current = true;
        localStorage.removeItem('bb_referral');
        localStorage.removeItem('bb_applied_coupon');
        sessionStorage.removeItem('bb_checkout_step');
        sessionStorage.removeItem('bb_checkout_billing_address');
        sessionStorage.removeItem('bb_checkout_delivery_address');
        sessionStorage.removeItem('bb_checkout_same_delivery');
        dispatch(clearBuyNowItem());
        if (!isBuyNowMode) {
          dispatch(clearLocal());
        }
        dispatch(fetchCart());
        dispatch(fetchProfile());
      };

      // 3. COD: skip payment gateway entirely, go straight to confirmation
      if (isCod) {
        finishOrderClear();
        navigate(`/order-confirmation?gateway=cod&orderId=${order.id}&status=success`, { replace: true });
        return;
      }

      // 4. Initiate payment gateway transaction (Razorpay)
      const initRes = await api.post('/payments/initiate', { orderId: order.id });
      if (!initRes.data?.success) {
        throw new Error(initRes.data?.message || 'Failed to initialize payment details from gateway.');
      }

      const paymentData = initRes.data;

      // Razorpay: load SDK and open checkout overlay
      if (paymentData.gateway === 'razorpay' || paymentData.key) {
        // Razorpay: load SDK and open checkout overlay
        const loaded = await loadRazorpayScript();
        if (!loaded || typeof window === 'undefined' || !window.Razorpay) {
          toast.error('Unable to connect to Razorpay payment gateway. Please check your internet connection, disable ad-blockers, or select Cash on Delivery (COD).');
          setPlacing(false);
          return;
        }

        const options = {
          key: paymentData.key,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: paymentData.name,
          description: paymentData.description,
          order_id: paymentData.order_id,
          handler: async function (response) {
            setPlacing(true);
            try {
              const verifyRes = await api.post('/payments/verify', {
                orderId: order.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              });
              if (verifyRes.data?.success) {
                finishOrderClear();
                if (customer) {
                  dispatch(fetchProfile());
                }
                navigate(`/order-confirmation?gateway=razorpay&orderId=${order.id}&status=success`, { replace: true });
              } else {
                if (customer) dispatch(fetchProfile());
                toast.error(verifyRes.data?.message || 'Payment verification failed. Please contact support.');
              }
            } catch (err) {
              console.error('Payment verification failed:', err);
              if (customer) dispatch(fetchProfile());
              toast.error(err.response?.data?.message || 'Failed to verify payment with server.');
            } finally {
              setPlacing(false);
            }
          },
          prefill: {
            name: billingAddress.fullName,
            email: billingAddress.email,
            contact: billingAddress.phone,
          },
          theme: {
            color: '#C9A24B',
          },
          modal: {
            ondismiss: function () {
              toast.error('Payment process was cancelled.');
              setPlacing(false);
              if (customer) dispatch(fetchProfile());
            }
          }
        };

        // Stop the main spinner — Razorpay overlay handles UI from here
        setPlacing(false);
        const rzp = new window.Razorpay(options);
        rzp.open();

      } else {
        throw new Error('Unknown payment gateway returned from server.');
      }

    } catch (err) {
      console.error('Order failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to place order. Please try again.');
      setPlacing(false);
    }
  };


  const validateStep1 = () => {
    const errors = {};

    if (!billingAddress.fullName?.trim()) errors.fullName = 'Please enter Full Name';
    if (!billingAddress.phone?.trim()) {
      errors.phone = 'Mobile number is required';
    } else {
      const phoneVal = validatePhoneNumber(billingAddress.phone);
      if (!phoneVal.isValid) errors.phone = phoneVal.message;
    }
    if (!billingAddress.email?.trim()) errors.email = 'Please enter Email Address';
    if (!billingAddress.flatHouse?.trim()) errors.flatHouse = 'Please enter Street / House No.';
    if (!billingAddress.city?.trim()) errors.city = 'Please enter City';
    if (!billingAddress.state?.trim()) errors.state = 'Please enter State';
    if (!/^\d{6}$/.test((billingAddress.pincode || '').trim())) {
      errors.pincode = 'Pincode must be exactly 6 numeric digits';
    }

    if (!deliverySameAsBilling) {
      if (!address.fullName?.trim()) errors.del_fullName = 'Please enter delivery Full Name';
      if (!address.phone?.trim()) {
        errors.del_phone = 'Delivery mobile number is required';
      } else {
        const delPhoneVal = validatePhoneNumber(address.phone, { defaultCountry: 'IN' });
        if (!delPhoneVal.isValid) {
          errors.del_phone = delPhoneVal.message;
        }
      }
      if (!address.email?.trim()) errors.del_email = 'Please enter delivery Email Address';
      if (!address.flatHouse?.trim()) errors.del_flatHouse = 'Please enter delivery Street / House No.';
      if (!address.city?.trim()) errors.del_city = 'Please enter delivery City';
      if (!address.state?.trim()) errors.del_state = 'Please enter delivery State';
      if (!/^\d{6}$/.test((address.pincode || '').trim())) {
        errors.del_pincode = 'Delivery Pincode must be exactly 6 numeric digits';
      }
    }

    if (createAccount && newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);

    const elementIdMap = {
      sameDelivery: 'same-delivery',
      del_pincode: 'd-pincode',
      del_fullName: 'd-fullname',
      del_phone: 'd-phone',
      del_email: 'd-email',
      del_flatHouse: 'd-flat',
      del_city: 'd-city',
      del_state: 'd-state',
    };

    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      toast.error(errors[firstKey] || 'Please complete all required fields (*)');
      const targetId = elementIdMap[firstKey] || firstKey;
      const errEl = document.getElementById(targetId) || document.getElementById('fullName');
      if (errEl) {
        errEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errEl.focus();
      }
      return false;
    }

    if (shippingStatus === 'NOT_DELIVERABLE' || (pincodeZoneData && pincodeZoneData.deliverable === false)) {
      toast.error(`Delivery is NOT available for pincode "${activePincode}". Please enter a serviceable pincode.`);
      const pincodeTargetId = deliverySameAsBilling ? 'pincode' : 'd-pincode';
      const pincodeEl = document.getElementById(pincodeTargetId) || document.getElementById('d-pincode') || document.getElementById('pincode');
      if (pincodeEl) {
        pincodeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pincodeEl.focus();
      }
      return false;
    }

    return true;
  };

  const inputCls = 'w-full h-11 border border-neutral-300 rounded-lg px-3.5 text-sm text-neutral-900 focus:outline-none focus:border-[#BEA266] focus:ring-1 focus:ring-[#BEA266]/30 transition-colors placeholder:text-neutral-400 bg-white shadow-xs';
  const labelCls = 'block text-xs font-semibold text-neutral-700 mb-1.5';

  return (
    <main id="main-content" className="bg-[#FAF9F6] min-h-screen">
      {/* ── Balanced Clean Checkout Header ── */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* <Link to="/" className="flex items-center gap-2 group" aria-label="Twin A Apparels — Home">
            <span className="font-playfair text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 group-hover:text-[#996822] transition-colors">
              Twin A Apparels
            </span>
          </Link> */}

          {/* Minimal 2-Step Progress Indicator */}
          <div className="flex items-center gap-3 sm:gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => step === 2 && setStep(1)}
              className={`flex items-center gap-1.5 transition-colors ${
                step === 1
                  ? 'text-neutral-900 font-bold'
                  : 'text-neutral-400 hover:text-neutral-700 cursor-pointer'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-[#17130B] text-[#F3E7C6]' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {step > 1 ? <Check size={12} strokeWidth={2.5} /> : '1'}
              </span>
              <span className="hidden sm:inline text-xs sm:text-sm">Delivery Details</span>
            </button>

            <span className="w-8 sm:w-16 h-px bg-neutral-200" />

            <div className={`flex items-center gap-1.5 ${
              step === 2 ? 'text-neutral-900 font-bold' : 'text-neutral-400'
            }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-[#17130B] text-[#F3E7C6]' : 'bg-neutral-100 text-neutral-400'
              }`}>
                2
              </span>
              <span className="hidden sm:inline text-xs sm:text-sm">Payment & Review</span>
            </div>
          </div>

          {/* Bag shortcut */}
          <button
            type="button"
            onClick={() => dispatch(openCart())}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <ShoppingBag size={14} className="text-[#996822]" />
            <span className="hidden md:inline">Bag</span>
            <span className="bg-[#17130B] text-[#F3E7C6] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {items.length}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-10 py-6 sm:py-8">
        {/* Geo Restriction Alert */}
        {geoBlocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
            <ShieldAlert size={22} className="text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Region Restriction</p>
              <p className="text-xs text-red-700 mt-0.5">{geoMessage}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-start">
          {/* ══════════════════════════════════════════════════
              LEFT COLUMN: Form Area (7 Cols)
          ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Returning Customer Banner for Guests */}
            {!isAuthenticated && step === 1 && (
              <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-neutral-600">
                    Already have an account?
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLoginPanel(v => !v)}
                    className="font-semibold text-[#996822] hover:underline"
                    id="toggle-login-panel"
                  >
                    {showLoginPanel ? 'Hide Login' : 'Log in for faster checkout'}
                  </button>
                </div>

                <AnimatePresence>
                  {showLoginPanel && (
                    <motion.div
                      key="login-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <form onSubmit={handleLogin} className="mt-3 pt-3 border-t border-neutral-100 space-y-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls} htmlFor="login-email">Email Address</label>
                            <input
                              id="login-email"
                              type="email"
                              value={loginEmail}
                              onChange={e => setLoginEmail(e.target.value)}
                              placeholder="name@example.com"
                              className={inputCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls} htmlFor="login-password">Password</label>
                            <div className="relative">
                              <input
                                id="login-password"
                                type={showLoginPw ? 'text' : 'password'}
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`${inputCls} pr-10`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                              >
                                {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="submit"
                            disabled={loginLoading}
                            className="py-2 px-4 bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs"
                            id="login-btn"
                          >
                            {loginLoading ? 'Signing in…' : 'Sign In'}
                          </button>
                          <Link
                            to={`/account?view=forgot${loginEmail ? `&email=${encodeURIComponent(loginEmail.trim())}` : ''}`}
                            className="text-xs text-[#996822] hover:underline"
                          >
                            Forgot password?
                          </Link>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ── STEP 1: Details & Delivery ── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 lg:p-9 shadow-sm space-y-6"
                >
                  <div className="border-b border-neutral-100 pb-3">
                    <h2 className="font-playfair text-xl sm:text-2xl font-bold text-neutral-900">
                      Shipping / Delivery Address
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Enter the address where you want your orders delivered.
                               </p>
                  </div>

                  {/* Saved Address Picker if logged in */}
                  {isAuthenticated && customer && (
                    <SavedAddressPicker
                      key={'billing-' + customer.id}
                      customer={customer}
                      value={billingAddress}
                      onModeChange={setBillingMode}
                      onChange={value => {
                        setBillingAddress(value);
                        setFieldErrors({});
                        setIsVerified(false);
                        setOtpSent(false);
                        if (deliverySameAsBilling) {
                          setAddress({ ...value, country: 'India' });
                          setSameDeliveryError('');
                        }
                      }}
                    />
                  )}

                  {/* Main Shipping Address Form */}
                  <AnimatePresence initial={false}>
                    {showBillingInputs && (
                      <motion.div
                        key="billing-inputs"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Full Name & Phone Number (Side by side) */}
                        <div className="grid sm:grid-cols-2 gap-4 items-start">
                          <div>
                            <label className={labelCls} htmlFor="fullName">
                              Full Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id="fullName"
                              type="text"
                              value={billingAddress.fullName}
                              onChange={e => {
                                const val = e.target.value;
                                setBillingAddress(p => ({ ...p, fullName: val }));
                                if (fieldErrors.fullName) setFieldErrors(p => ({ ...p, fullName: null }));
                              }}
                              placeholder="John Doe"
                              className={`${inputCls} ${fieldErrors.fullName ? 'border-red-400 bg-red-50/20' : ''}`}
                              required
                            />
                            {fieldErrors.fullName && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.fullName}</p>}
                          </div>

                          <div>
                            <PhoneInput
                              id="phone"
                              name="phone"
                              label="Mobile Number (India only)"
                              allowedCountries={['IN']}
                              defaultCountry="IN"
                              value={billingAddress.phone}
                              onChange={(val, meta) => {
                                setBillingAddress(p => ({ ...p, phone: val }));
                                if (fieldErrors.phone) {
                                  setFieldErrors(p => ({ ...p, phone: meta.isValid ? null : meta.error }));
                                }
                              }}
                              error={fieldErrors.phone}
                              required
                            />
                          </div>
                        </div>

                        {/* Email Address */}
                        <div>
                          <label className={labelCls} htmlFor="email">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="email"
                            type="email"
                            value={billingAddress.email}
                            onChange={e => {
                              const val = e.target.value;
                              setBillingAddress(p => ({ ...p, email: val }));
                              if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: null }));
                            }}
                            placeholder="name@example.com"
                            className={`${inputCls} ${fieldErrors.email ? 'border-red-400 bg-red-50/20' : ''}`}
                            required
                          />
                          {fieldErrors.email && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.email}</p>}
                        </div>

                        {/* Street Address / House No. */}
                        <div>
                          <label className={labelCls} htmlFor="flatHouse">
                            Street Address / House No. / Flat <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="flatHouse"
                            type="text"
                            value={billingAddress.flatHouse}
                            onChange={e => {
                              const val = e.target.value;
                              setBillingAddress(p => ({ ...p, flatHouse: val }));
                              if (fieldErrors.flatHouse) setFieldErrors(p => ({ ...p, flatHouse: null }));
                            }}
                            placeholder="Flat/House no., building, street or locality"
                            className={`${inputCls} ${fieldErrors.flatHouse ? 'border-red-400 bg-red-50/20' : ''}`}
                            required
                          />
                          {fieldErrors.flatHouse && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.flatHouse}</p>}
                        </div>

                        {/* Apartment / Landmark */}
                        <div>
                          <label className={labelCls} htmlFor="landmark">
                            Apartment / Landmark <span className="text-neutral-400 font-normal">(optional)</span>
                          </label>
                          <input
                            id="landmark"
                            type="text"
                            value={billingAddress.landmark}
                            onChange={e => setBillingAddress(p => ({ ...p, landmark: e.target.value }))}
                            placeholder="Near park, landmark, etc."
                            className={inputCls}
                          />
                        </div>

                        {/* City & Pincode (Side by side) */}
                        <div className="grid grid-cols-2 gap-4 items-start">
                          <div>
                            <label className={labelCls} htmlFor="city">
                              City <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id="city"
                              type="text"
                              value={billingAddress.city}
                              onChange={e => {
                                const val = e.target.value;
                                setBillingAddress(p => ({ ...p, city: val }));
                                if (fieldErrors.city) setFieldErrors(p => ({ ...p, city: null }));
                              }}
                              placeholder="City"
                              className={`${inputCls} ${fieldErrors.city ? 'border-red-400 bg-red-50/20' : ''}`}
                              required
                            />
                            {fieldErrors.city && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.city}</p>}
                          </div>

                          <div>
                            <label className={labelCls} htmlFor="pincode">
                              Pincode <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id="pincode"
                              type="text"
                              maxLength={6}
                              value={billingAddress.pincode}
                              onChange={e => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setBillingAddress(p => ({ ...p, pincode: val }));
                                if (fieldErrors.pincode) setFieldErrors(p => ({ ...p, pincode: null }));
                              }}
                              placeholder="6 digits"
                              className={`${inputCls} ${fieldErrors.pincode ? 'border-red-400 bg-red-50/20' : ''}`}
                              required
                            />
                            {fieldErrors.pincode && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.pincode}</p>}
                          </div>
                        </div>

                        {/* State & Country (Side by side) */}
                        <div className="grid grid-cols-2 gap-4 items-start">
                          <div>
                            <label className={labelCls} htmlFor="state">
                              State <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id="state"
                              type="text"
                              value={billingAddress.state}
                              onChange={e => {
                                const val = e.target.value;
                                setBillingAddress(p => ({ ...p, state: val }));
                                if (fieldErrors.state) setFieldErrors(p => ({ ...p, state: null }));
                              }}
                              placeholder="State"
                              className={`${inputCls} ${fieldErrors.state ? 'border-red-400 bg-red-50/20' : ''}`}
                              required
                            />
                            {fieldErrors.state && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.state}</p>}
                          </div>

                          <div>
                            <label className={labelCls} htmlFor="country">
                              Country
                            </label>
                            <input
                              id="country"
                              type="text"
                              readOnly
                              value="India"
                              className="w-full h-11 border border-neutral-200 rounded-lg px-3.5 text-sm text-neutral-600 bg-neutral-100/70 cursor-not-allowed font-medium"
                            />
                          </div>
                        </div>

                        {/* Delivery Availability Status badge */}
                        {pincodeZoneData && (billingAddress.pincode || '').trim().length >= 3 && (
                          <div className="pt-1">
                            {pincodeZoneData.deliverable ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                                <Check size={14} className="text-emerald-600 shrink-0" />
                                <span>
                                  Delivery available ({pincodeZoneData.zoneName}) — {shipping === 0 ? 'FREE Delivery' : `Shipping: ₹${shipping}`}
                                </span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                                <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                                <span>{pincodeZoneData.message || 'Delivery not available for this pincode'}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── BILLING ADDRESS SECTION (SAME EXACT FIELDS) ── */}
                  <div className="pt-2">
                    <label htmlFor="same-delivery" className="flex items-center gap-2.5 cursor-pointer select-none text-xs sm:text-sm font-semibold text-neutral-800">
                      <input
                        id="same-delivery"
                        type="checkbox"
                        checked={deliverySameAsBilling}
                        onChange={e => handleToggleDeliverySame(e.target.checked)}
                        className="w-4 h-4 accent-[#BEA266] rounded cursor-pointer"
                      />
                      Billing address is the same as shipping address
                    </label>

                    {/* Exact Same Fields in Billing Address when unchecked */}
                    <AnimatePresence initial={false}>
                      {!deliverySameAsBilling && (
                        <motion.div
                          key="delivery-section"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden mt-4 pt-4 border-t border-neutral-100 space-y-4"
                        >
                          <div className="border-b border-neutral-100 pb-2">
                            <h3 className="font-playfair text-lg sm:text-xl font-bold text-neutral-900">
                              Billing Address
                            </h3>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Enter the billing address associated with your payment method.
                            </p>
                          </div>

                          {/* Full Name & Phone Number */}
                          <div className="grid sm:grid-cols-2 gap-4 items-start">
                            <div>
                              <label className={labelCls} htmlFor="del_fullName">
                                Full Name <span className="text-rose-500">*</span>
                              </label>
                              <input
                                id="del_fullName"
                                type="text"
                                value={address.fullName}
                                onChange={e => {
                                  const val = e.target.value;
                                  setAddress(p => ({ ...p, fullName: val }));
                                  if (fieldErrors.del_fullName) setFieldErrors(p => ({ ...p, del_fullName: null }));
                                }}
                                placeholder="John Doe"
                                className={`${inputCls} ${fieldErrors.del_fullName ? 'border-red-400 bg-red-50/20' : ''}`}
                                required
                              />
                              {fieldErrors.del_fullName && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.del_fullName}</p>}
                            </div>

                            <div>
                              <PhoneInput
                                id="del_phone"
                                name="del_phone"
                                label="Mobile Number (India only)"
                                allowedCountries={['IN']}
                                defaultCountry="IN"
                                value={address.phone}
                                onChange={(val, meta) => {
                                  setAddress(p => ({ ...p, phone: val }));
                                  if (fieldErrors.del_phone) {
                                    setFieldErrors(p => ({ ...p, del_phone: meta.isValid ? null : meta.error }));
                                  }
                                }}
                                error={fieldErrors.del_phone}
                                required
                              />
                            </div>
                          </div>

                          {/* Email Address */}
                          <div>
                            <label className={labelCls} htmlFor="del_email">
                              Email Address <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id="del_email"
                              type="email"
                              value={address.email}
                              onChange={e => {
                                const val = e.target.value;
                                setAddress(p => ({ ...p, email: val }));
                                if (fieldErrors.del_email) setFieldErrors(p => ({ ...p, del_email: null }));
                              }}
                              placeholder="name@example.com"
                              className={`${inputCls} ${fieldErrors.del_email ? 'border-red-400 bg-red-50/20' : ''}`}
                              required
                            />
                            {fieldErrors.del_email && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.del_email}</p>}
                          </div>

                          {/* Street Address / House No. */}
                          <div>
                            <label className={labelCls} htmlFor="del_flatHouse">
                              Street Address / House No. / Flat <span className="text-rose-500">*</span>
                            </label>
                            <input
                              id="del_flatHouse"
                              type="text"
                              value={address.flatHouse}
                              onChange={e => {
                                const val = e.target.value;
                                setAddress(p => ({ ...p, flatHouse: val }));
                                if (fieldErrors.del_flatHouse) setFieldErrors(p => ({ ...p, del_flatHouse: null }));
                              }}
                              placeholder="Flat/House no., building, street or locality"
                              className={`${inputCls} ${fieldErrors.del_flatHouse ? 'border-red-400 bg-red-50/20' : ''}`}
                              required
                            />
                            {fieldErrors.del_flatHouse && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.del_flatHouse}</p>}
                          </div>

                          {/* Apartment / Landmark */}
                          <div>
                            <label className={labelCls} htmlFor="del_landmark">
                              Apartment / Landmark <span className="text-neutral-400 font-normal">(optional)</span>
                            </label>
                            <input
                              id="del_landmark"
                              type="text"
                              value={address.landmark}
                              onChange={e => setAddress(p => ({ ...p, landmark: e.target.value }))}
                              placeholder="Near park, landmark, etc."
                              className={inputCls}
                            />
                          </div>

                          {/* City & Pincode */}
                          <div className="grid grid-cols-2 gap-4 items-start">
                            <div>
                              <label className={labelCls} htmlFor="del_city">
                                City <span className="text-rose-500">*</span>
                              </label>
                              <input
                                id="del_city"
                                type="text"
                                value={address.city}
                                onChange={e => {
                                  const val = e.target.value;
                                  setAddress(p => ({ ...p, city: val }));
                                  if (fieldErrors.del_city) setFieldErrors(p => ({ ...p, del_city: null }));
                                }}
                                placeholder="City"
                                className={`${inputCls} ${fieldErrors.del_city ? 'border-red-400 bg-red-50/20' : ''}`}
                                required
                              />
                              {fieldErrors.del_city && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.del_city}</p>}
                            </div>

                            <div>
                              <label className={labelCls} htmlFor="del_pincode">
                                Pincode <span className="text-rose-500">*</span>
                              </label>
                              <input
                                id="del_pincode"
                                type="text"
                                maxLength={6}
                                value={address.pincode}
                                onChange={e => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                  setAddress(p => ({ ...p, pincode: val }));
                                  if (fieldErrors.del_pincode) setFieldErrors(p => ({ ...p, del_pincode: null }));
                                }}
                                placeholder="6 digits"
                                className={`${inputCls} ${fieldErrors.del_pincode ? 'border-red-400 bg-red-50/20' : ''}`}
                                required
                              />
                              {fieldErrors.del_pincode && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.del_pincode}</p>}
                            </div>
                          </div>

                          {/* State & Country */}
                          <div className="grid grid-cols-2 gap-4 items-start">
                            <div>
                              <label className={labelCls} htmlFor="del_state">
                                State <span className="text-rose-500">*</span>
                              </label>
                              <input
                                id="del_state"
                                type="text"
                                value={address.state}
                                onChange={e => {
                                  const val = e.target.value;
                                  setAddress(p => ({ ...p, state: val }));
                                  if (fieldErrors.del_state) setFieldErrors(p => ({ ...p, del_state: null }));
                                }}
                                placeholder="State"
                                className={`${inputCls} ${fieldErrors.del_state ? 'border-red-400 bg-red-50/20' : ''}`}
                                required
                              />
                              {fieldErrors.del_state && <p className="text-[11px] text-red-500 mt-1">{fieldErrors.del_state}</p>}
                            </div>

                            <div>
                              <label className={labelCls} htmlFor="del_country">
                                Country
                              </label>
                              <input
                                id="del_country"
                                type="text"
                                readOnly
                                value="India"
                                className="w-full h-11 border border-neutral-200 rounded-lg px-3.5 text-sm text-neutral-600 bg-neutral-100/70 cursor-not-allowed font-medium"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* ── CREATE ACCOUNT SECTION (For Guest Users) ── */}
                  {!isAuthenticated && (
                    <div className="pt-4 border-t border-neutral-100">
                      <div className="p-4 rounded-xl border border-neutral-200 bg-[#FAF9F5] space-y-3">
                        <label htmlFor="create-account-checkbox" className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            id="create-account-checkbox"
                            type="checkbox"
                            checked={createAccount}
                            onChange={e => setCreateAccount(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-[#BEA266] rounded cursor-pointer shrink-0"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-neutral-900">
                              Create an account with these details?
                            </p>
                            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">
                              Saves your name, email, and address for 1-click checkout and easy order tracking.
                            </p>
                          </div>
                        </label>

                        <AnimatePresence>
                          {createAccount && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18 }}
                              className="pt-2.5 border-t border-neutral-200/80 space-y-3"
                            >
                              <div>
                                <label className={labelCls} htmlFor="new-account-password">
                                  Choose Password <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    id="new-account-password"
                                    type={showNewPw ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className={`${inputCls} pr-10`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowNewPw(!showNewPw)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                  >
                                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                                <p className="text-[11px] text-neutral-500">
                                  Account for: <strong className="text-neutral-800 font-semibold">{billingAddress.email || 'your email'}</strong>
                                </p>
                                <button
                                  type="button"
                                  onClick={handleRegister}
                                  disabled={registerLoading || !newPassword || newPassword.length < 6}
                                  className="px-3.5 py-2 bg-[#17130B] hover:bg-black text-[#F3E7C6] text-xs font-semibold uppercase tracking-wider rounded-lg transition-all disabled:opacity-50"
                                >
                                  {registerLoading ? 'Creating…' : 'Register Account'}
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}


                  {/* Continue Button */}
                  <div className="pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!isAuthenticated) {
                          if (createAccount && newPassword && newPassword.length >= 6) {
                            try {
                              await handleRegister();
                              if (validateStep1()) setStep(2);
                              return;
                            } catch {
                              return;
                            }
                          } else {
                            toast.error('Please sign in or enter your details with an account to continue.');
                            setShowLoginPanel(true);
                            return;
                          }
                        }
                        if (validateStep1()) setStep(2);
                      }}
                      disabled={geoBlocked}
                      className="w-full py-3.5 rounded-lg bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs sm:text-sm uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                      id="step1-next"
                    >
                      {geoBlocked ? 'Checkout Disabled' : 'Continue to Payment'}
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: Review & Payment ── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white border border-neutral-200/90 rounded-2xl p-6 sm:p-8 lg:p-9 shadow-sm space-y-6"
                >
                  <div className="border-b border-neutral-100 pb-3">
                    <h2 className="font-playfair text-xl sm:text-2xl font-bold text-neutral-900">
                      Payment & Final Review
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Review your delivery details and choose payment method
                    </p>
                  </div>

                  {/* Address Summary Card */}
                  {(() => {
                    const activeShipping = deliverySameAsBilling ? billingAddress : address;
                    const addrFullName = activeShipping.fullName || billingAddress.fullName;
                    const addrStreet = activeShipping.flatHouse || billingAddress.flatHouse;
                    const addrLandmark = activeShipping.landmark || billingAddress.landmark;
                    const addrCity = activeShipping.city || billingAddress.city;
                    const addrState = activeShipping.state || billingAddress.state;
                    const addrPincode = activeShipping.pincode || billingAddress.pincode;
                    const addrPhone = activeShipping.phone || billingAddress.phone;
                    const addrEmail = activeShipping.email || billingAddress.email;

                    return (
                      <div className="p-3.5 sm:p-4 rounded-xl border border-neutral-200/90 bg-neutral-50/70 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs sm:text-[13px] font-semibold text-neutral-900 flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#BEA266] shrink-0" />
                            <span>Deliver to: <span className="font-bold text-neutral-950">{addrFullName}</span></span>
                          </p>
                          <p className="text-xs text-neutral-600 leading-relaxed break-words">
                            {addrStreet}{addrLandmark ? `, ${addrLandmark}` : ''}{addrCity ? `, ${addrCity}` : ''}{addrState ? `, ${addrState}` : ''} {addrPincode}
                          </p>
                          <p className="text-[11px] text-neutral-400 flex items-center gap-2 pt-0.5">
                            {addrPhone && <span>{addrPhone}</span>}
                            {addrPhone && addrEmail && <span className="text-neutral-300">·</span>}
                            {addrEmail && <span className="truncate">{addrEmail}</span>}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs font-semibold text-[#996822] hover:underline px-2.5 py-1 rounded-md border border-neutral-200 bg-white shadow-xs shrink-0 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    );
                  })()}

                  {/* Payment Options */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      Payment Method
                    </label>

                    <div className="p-3.5 sm:p-4 rounded-xl border-2 border-[#BEA266] bg-[#FAF9F5] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked
                          readOnly
                          className="w-4 h-4 accent-[#BEA266]"
                        />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                            <CreditCard size={14} className="text-[#BEA266]" />
                            Razorpay Secure Online Payment
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            UPI (GPay, PhonePe, Paytm), Cards, NetBanking
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        100% Secure
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="py-3 px-5 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold text-xs uppercase tracking-wider transition-colors"
                      id="step2-back"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (shippingStatus === 'NOT_DELIVERABLE') {
                          toast.error('The selected delivery address is not deliverable. Please choose another address.');
                          setStep(1);
                          return;
                        }
                        const inrLimit = otpSettings.inrThreshold || 20000;
                        const aedLimit = otpSettings.aedThreshold || 800;
                        const isCod = paymentMethod === 'Cash on Delivery (COD)';
                        const isLocationUae = geoCountry === 'AE';
                        const effectiveRate = Number(currencyRate) > 0 ? Number(currencyRate) : 26.06;
                        const totalInAed = total / effectiveRate;
                        const isHighValue = isLocationUae ? totalInAed >= aedLimit : total >= inrLimit;
                        const isCodOnly = otpSettings.codOnly !== false;
                        const requiresOtp = isCodOnly
                          ? (isCod && otpSettings.requireCodOtp !== false)
                          : (isHighValue || (isCod && otpSettings.requireCodOtp !== false));

                        if (requiresOtp && !isVerified) {
                          handleTriggerFraudCheck();
                        } else {
                          handlePlaceOrder();
                        }
                      }}
                      disabled={placing || otpLoading}
                      className="flex-1 py-3.5 rounded-lg bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs sm:text-sm uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99]"
                      id="place-order-btn"
                    >
                      {placing
                        ? 'Processing Payment…'
                        : otpLoading
                        ? 'Sending Code…'
                        : `Pay & Complete Order — ${fmt(total)}`}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ══════════════════════════════════════════════════
              RIGHT COLUMN: Sticky Order Summary (5 Cols)
          ══════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 sticky top-28 space-y-4">
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-playfair text-base sm:text-lg font-bold text-neutral-900 pb-2.5 border-b border-neutral-100 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-normal text-neutral-500 font-sans">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </h3>

              {/* Items List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pt-2.5 pb-1 px-1.5 pr-2">
                {items.map((item, idx) => {
                  const details = getItemDetails(item);
                  return (
                    <div key={item.productId || item.id || idx} className="flex gap-3 items-center">
                      <div className="relative shrink-0 my-0.5">
                        <div className="w-12 h-14 sm:w-13 sm:h-15 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                          <img
                            src={details.image}
                            alt={details.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=160';
                            }}
                          />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-neutral-900 text-white text-[10px] font-bold flex items-center justify-center shadow-sm border-2 border-white z-10 font-sans pointer-events-none">
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-[13px] font-semibold text-neutral-900 truncate leading-snug">
                          {details.name}
                        </p>
                        {details.variantText && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            {details.variantText}
                          </p>
                        )}
                        <p className="text-xs sm:text-[13px] font-bold text-neutral-900 mt-1 tabular-nums">
                          {fmt(details.price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── APPLIED COUPON INDICATOR (CLEAR & PROMINENT) ── */}
              {activeDiscountType === 'COUPON' && couponDiscount > 0 && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 border border-emerald-300 shadow-xs">
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Tag size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans text-[11px] font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-300 uppercase tracking-wider">
                            {activeCouponObj?.code || appliedCoupon?.code || 'COUPON'}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 uppercase">
                            Applied
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                          Saving <strong className="text-emerald-950 font-bold">{fmt(couponDiscount)}</strong> on your order
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCheckoutCoupon}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2.5 py-1 bg-white rounded border border-rose-200 shadow-xs transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Promo Code Input & Available Chips */}
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                {(activeDiscountType !== 'COUPON' || couponDiscount === 0) && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="ENTER PROMO CODE"
                      className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 text-xs uppercase font-sans font-medium focus:outline-none focus:border-[#BEA266]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyCheckoutCoupon()}
                      disabled={validatingCoupon}
                      className="px-4 py-2 bg-[#17130B] text-[#F3E7C6] text-xs font-semibold rounded-lg hover:bg-black transition-colors"
                    >
                      {validatingCoupon ? '…' : 'Apply'}
                    </button>
                  </div>
                )}

                {/* Available coupon chips */}
                {availableCoupons.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5">
                      Available Offers:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {availableCoupons.map(c => {
                        const isCurrentlyApplied = (activeDiscountType === 'COUPON' && (activeCouponObj?.code === c.code || appliedCoupon?.code === c.code));
                        const cDiscount = getCouponDiscount(c, subtotal);
                        return (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              if (isCurrentlyApplied) {
                                handleRemoveCheckoutCoupon();
                              } else {
                                handleApplyCheckoutCoupon(c.code);
                              }
                            }}
                            className={`text-[11px] font-sans font-semibold px-2.5 py-1 rounded-md border transition-all flex items-center gap-1.5 ${
                              isCurrentlyApplied
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                : 'border-dashed border-[#BEA266] text-[#996822] bg-[#FAF9F5] hover:bg-[#F3E7C6]/30'
                            }`}
                          >
                            <span>{isCurrentlyApplied ? `✓ ${c.code}` : `+ ${c.code}`}</span>
                            {cDiscount > 0 && (
                              <span className="text-[10px] font-sans font-bold text-emerald-700">
                                (Save ₹{Math.round(cDiscount)})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-neutral-100 space-y-2 text-xs sm:text-[13px]">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">{fmt(subtotal)}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Delivery</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="font-bold text-emerald-700 uppercase text-xs">FREE</span>
                    ) : (
                      <span className="font-semibold text-neutral-900 tabular-nums">{fmt(shipping)}</span>
                    )}
                  </span>
                </div>

                {/* Prominently show coupon discount if active */}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon Discount ({activeCouponObj?.code || appliedCoupon?.code || 'Applied'})</span>
                    <span className="font-semibold tabular-nums">-{fmt(couponDiscount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-200 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-montserrat">
                    Total
                  </span>
                  <div className="text-right">
                    <span className="font-sans text-base sm:text-lg font-bold text-neutral-900 tabular-nums">
                      {fmt(total)}
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Inclusive of all taxes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Micro-Badges */}
            <div className="grid grid-cols-3 gap-2 px-2 text-center text-[10px] text-neutral-500 font-medium">
              <div className="flex flex-col items-center gap-1 p-1">
                <Lock size={14} className="text-[#BEA266]" />
                <span>SSL Secure</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1 border-x border-neutral-200">
                <Truck size={14} className="text-[#BEA266]" />
                <span>Express Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-1">
                <Award size={14} className="text-[#BEA266]" />
                <span>Quality Assured</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── OTP Verification Modal ── */}
      <AnimatePresence>
        {otpSent && !isVerified && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2">
                <Lock size={18} className="text-[#BEA266]" />
                <h3 className="font-playfair text-lg font-bold text-neutral-900">
                  Security Verification
                </h3>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We've sent a 6-digit confirmation code to <strong className="text-neutral-900 font-semibold">{billingAddress.email || customer?.email}</strong>.
              </p>

              <div>
                <input
                  id="fraud-otp"
                  type="text"
                  value={otp}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    if (val.length === 6) { handleVerifyFraudOtp(val); }
                  }}
                  placeholder="000000"
                  maxLength={6}
                  disabled={verifyingOtp}
                  className="w-full border border-neutral-300 rounded-xl px-4 py-3 text-center text-xl font-sans tracking-[0.4em] focus:outline-none focus:border-[#BEA266] bg-neutral-50 shadow-inner"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  disabled={verifyingOtp}
                  className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyFraudOtp()}
                  disabled={verifyingOtp || otp.length < 6}
                  className="flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg bg-[#17130B] hover:bg-black text-[#F3E7C6] transition-colors shadow-xs"
                >
                  {verifyingOtp ? 'Verifying…' : 'Verify & Place'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
};

export default CheckoutPage;