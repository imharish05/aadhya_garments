import { getImageUrl } from '../utils/imageUrl';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Heart,
  Star,
  ChevronRight,
  ChevronLeft,
  Share2,
  Shield,
  ShieldCheck,
  ZoomIn,
  Mail,
  CheckCircle2,
  X,
  Tag,
  Copy,
  Edit3,
  Trash2,
  FileText,
  Sparkles,
  Truck,
  RotateCcw,
  Award,
  Check,
  MessageSquare,
  ThumbsUp,
  ArrowUpDown,
} from 'lucide-react';
import { ToolbarMenu } from '../components/shop/ToolbarControls';
import ActiveFilters from '../components/shop/ActiveFilters';
import { fetchProduct, fetchProducts } from '../redux/slices/productsSlice';
import { addLocal, openCart, setBuyNowItem } from '../redux/slices/cartSlice';
import { toggleItem, toggleWishlistApi } from '../redux/slices/wishlistSlice';
import { openQuickView } from '../redux/slices/uiSlice';
import Footer from '../components/Footer';
import { SplitTextReveal } from '../components/animations';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/currency';
import { getPlaceholderSvg } from '../utils/placeholder';
import { isCartItemMatch, areVariantsEqual, getAttrCaseInsensitive } from '../utils/variantFormatter';
import api from '../services/api';
import toast from 'react-hot-toast';

import { fetchProductReviews, createReview, updateReview, deleteReview } from '../redux/slices/reviewsSlice';

/** Map common color names → CSS color / gradient values for swatch circles */
const COLOR_MAP = {
  red: '#e53e3e', crimson: '#dc143c', maroon: '#800000', pink: '#f687b3', rose: '#f43f5e', magenta: '#d53f8c', hotpink: '#ff69b4', blush: '#ffb6c1',
  blue: '#3b82f6', navy: '#1e3a8a', cobalt: '#0047ab', royal: '#4169e1', sky: '#38bdf8', cyan: '#06b6d4', teal: '#0d9488', aqua: '#00ffff',
  green: '#22c55e', olive: '#6b8e23', mint: '#3eb489', emerald: '#10b981', forest: '#228b22', lime: '#84cc16', sage: '#9dc183',
  yellow: '#f59e0b', gold: '#b8860b', amber: '#f59e0b', lemon: '#fff44f', mustard: '#ffdb58',
  orange: '#f97316', coral: '#ff6b6b', salmon: '#fa8072', peach: '#ffcba4',
  purple: '#9333ea', lavender: '#c4b5fd', violet: '#7c3aed', indigo: '#6366f1', mauve: '#9f8fba', plum: '#8b008b', lilac: '#c8a2c8', burgundy: '#800020',
  brown: '#92400e', tan: '#d2b48c', beige: '#f5f5dc', caramel: '#c68642', chocolate: '#7b3f00', coffee: '#6f4e37',
  black: '#111111', charcoal: '#374151', grey: '#9ca3af', gray: '#9ca3af', silver: '#c0c0c0', ash: '#b2beb5', steel: '#4682b4', neutral: '#d1d5db',
  white: '#f9fafb', cream: '#fffdd0', ivory: '#fffff0', off: '#faf9f6', clear: 'linear-gradient(135deg,#e2e8f0 0%,#cbd5e1 100%)', 'pastel blue': '#90caf9',
  multicolor: 'linear-gradient(135deg,#e53e3e 0%,#f59e0b 25%,#22c55e 50%,#3b82f6 75%,#9333ea 100%)',
  multi: 'linear-gradient(135deg,#e53e3e 0%,#f59e0b 25%,#22c55e 50%,#3b82f6 75%,#9333ea 100%)',
  printed: 'linear-gradient(135deg,#f687b3 0%,#f59e0b 33%,#38bdf8 66%,#22c55e 100%)',
};

/** Resolve a color name / value to a CSS background string */
const resolveColor = (name = '') => {
  const lower = name.toLowerCase().trim();
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val;
  }
  return lower; // fallback — may be a valid CSS color
};

const ProductDetailsPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { current: product, items: allProducts, loading } = useSelector(s => s.products);
  const { items: wishlist } = useSelector(s => s.wishlist);
  const { items: cartItems } = useSelector(s => s.cart);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  const fmt = (v, aed) => formatPrice(v, currencyCode, currencyRate, aed);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useSelector(s => s.auth || {});
  const reviewsState = useSelector(s => s.reviews);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewImagePreview, setReviewImagePreview] = useState(null);
  const reviewImageRef = useRef(null);

  useEffect(() => {
    if (product && product.id) {
      dispatch(fetchProductReviews(product.id));
    }
  }, [product?.id, dispatch]);

  useEffect(() => {
    if (searchParams.get('writeReview') === 'true') {
      setActiveTab('reviews');
      setTimeout(() => {
        const reviewsEl = document.getElementById('reviews');
        if (reviewsEl) reviewsEl.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      if (reviewsState.userCanReview) {
        setReviewModalOpen(true);
      }
    }
  }, [searchParams, reviewsState.userCanReview]);

  const handleOpenWriteReview = () => {
    if (reviewsState.userReview) {
      setEditingReviewId(reviewsState.userReview.id);
      setReviewRating(reviewsState.userReview.rating || 5);
      setReviewTitle(reviewsState.userReview.title || '');
      setReviewBody(reviewsState.userReview.body || '');
    } else {
      setEditingReviewId(null);
      setReviewRating(5);
      setReviewTitle('');
      setReviewBody('');
    }
    setReviewImage(null);
    setReviewImagePreview(null);
    setReviewModalOpen(true);
  };

  const handleOpenEditReview = (rev) => {
    setEditingReviewId(rev.id);
    setReviewRating(rev.rating || 5);
    setReviewTitle(rev.title || '');
    setReviewBody(rev.body || '');
    setReviewImage(null);
    setReviewImagePreview(null);
    setReviewModalOpen(true);
  };

  const handleReviewImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image too large. Please upload an image under ${MAX_SIZE_MB}MB.`);
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed (JPG, PNG, WEBP, etc.)');
      e.target.value = '';
      return;
    }
    setReviewImage(file);
    setReviewImagePreview(URL.createObjectURL(file));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBody.trim()) {
      toast.error('Please write a review comment.');
      return;
    }
    try {
      if (editingReviewId) {
        const res = await dispatch(updateReview({
          id: editingReviewId,
          rating: reviewRating,
          title: reviewTitle,
          body: reviewBody,
          productId: product.id,
        }));
        if (updateReview.fulfilled.match(res)) {
          toast.success('Your review has been updated!');
          setReviewModalOpen(false);
          if (product?.slug) dispatch(fetchProduct(product.slug));
        } else {
          toast.error(res.payload || 'Failed to update review');
        }
      } else {
        const res = await dispatch(createReview({
          productId: product.id,
          orderId: reviewsState.eligibleOrderId,
          rating: reviewRating,
          title: reviewTitle,
          body: reviewBody,
        }));
        if (createReview.fulfilled.match(res)) {
          toast.success('Thank you! Your review has been published.');
          setReviewModalOpen(false);
          if (product?.slug) dispatch(fetchProduct(product.slug));
        } else {
          toast.error(res.payload || 'Failed to submit review');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      const res = await dispatch(deleteReview({ id: reviewId, productId: product.id }));
      if (deleteReview.fulfilled.match(res)) {
        toast.success('Review deleted successfully.');
        if (product?.slug) dispatch(fetchProduct(product.slug));
      } else {
        toast.error(res.payload || 'Failed to delete review');
      }
    } catch (err) {
      toast.error('An error occurred while deleting.');
    }
  };

  const attributes = useMemo(() => {
    if (!product || !product.attributes) return {};
    if (typeof product.attributes === 'string') {
      try {
        return JSON.parse(product.attributes);
      } catch (e) {
        return {};
      }
    }
    return product.attributes;
  }, [product]);

  const sizes = useMemo(() => {
    if (!product) return [];
    if (product.variants && product.variants.length > 0) return [];
    return attributes?.sizes || ['S', 'M', 'L', 'XL'];
  }, [product, attributes]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 5);
  }, [allProducts, product]);

  const ratingFilterOptions = useMemo(() => [
    { value: 'all', label: 'All Ratings' },
    { value: '5', label: '5 Stars ★★★★★' },
    { value: '4', label: '4 Stars ★★★★☆' },
    { value: '3', label: '3 Stars ★★★☆☆' },
    { value: '2', label: '2 Stars ★★☆☆☆' },
    { value: '1', label: '1 Star ★☆☆☆☆' },
    { value: 'verified', label: 'Verified Buyers' },
  ], []);

  const reviewSortOptions = useMemo(() => [
    { value: 'newest', label: 'Newest First' },
    { value: 'highest', label: 'Highest Rating' },
    { value: 'lowest', label: 'Lowest Rating' },
  ], []);

  const filteredReviews = useMemo(() => {
    let list = [...(reviewsState.reviews || [])];
    if (reviewFilter === '5') list = list.filter(r => Math.round(r.rating) === 5);
    else if (reviewFilter === '4') list = list.filter(r => Math.round(r.rating) === 4);
    else if (reviewFilter === '3') list = list.filter(r => Math.round(r.rating) === 3);
    else if (reviewFilter === '2') list = list.filter(r => Math.round(r.rating) === 2);
    else if (reviewFilter === '1') list = list.filter(r => Math.round(r.rating) === 1);
    else if (reviewFilter === 'verified') list = list.filter(r => r.isVerifiedPurchase);

    if (reviewSort === 'highest') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (reviewSort === 'lowest') {
      list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [reviewsState.reviews, reviewFilter, reviewSort]);

  const activeReviewChips = useMemo(() => {
    const chips = [];
    if (reviewFilter !== 'all') {
      const opt = ratingFilterOptions.find(o => o.value === reviewFilter);
      chips.push({
        key: `rating-${reviewFilter}`,
        label: opt ? opt.label : `${reviewFilter} Stars`,
        onRemove: () => setReviewFilter('all'),
      });
    }
    if (reviewSort !== 'newest') {
      const opt = reviewSortOptions.find(o => o.value === reviewSort);
      chips.push({
        key: `sort-${reviewSort}`,
        label: opt ? opt.label : reviewSort,
        onRemove: () => setReviewSort('newest'),
      });
    }
    return chips;
  }, [reviewFilter, reviewSort, ratingFilterOptions, reviewSortOptions]);

  const parsedVariants = useMemo(() => {
    if (!product || !product.variants) return [];
    return product.variants.map(v => {
      if (!v) return null;
      let attrs = v.attributes;
      if (typeof attrs === 'string') {
        try {
          attrs = JSON.parse(attrs);
        } catch (e) {
          attrs = {};
        }
      }
      let vImgs = v?.images;
      if (typeof vImgs === 'string') {
        try {
          vImgs = JSON.parse(vImgs);
        } catch (e) {
          vImgs = [];
        }
      }
      return { ...v, attributes: attrs || {}, images: Array.isArray(vImgs) ? vImgs : [] };
    });
  }, [product]);

  const [selectedAttributes, setSelectedAttributes] = useState({});

  const variantAttributeKeys = useMemo(() => {
    if (!product || parsedVariants.length === 0) return [];
    const keys = new Set();
    parsedVariants.forEach(v => {
      if (v.attributes) {
        Object.keys(v.attributes).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [product, parsedVariants]);

  const variantAttributeValues = useMemo(() => {
    const valuesMap = {};
    variantAttributeKeys.forEach(key => {
      const valSet = new Set();
      parsedVariants.forEach(v => {
        if (v.attributes && v.attributes[key]) {
          valSet.add(v.attributes[key]);
        }
      });
      valuesMap[key] = Array.from(valSet);
    });
    return valuesMap;
  }, [parsedVariants, variantAttributeKeys]);

  useEffect(() => {
    if (product && parsedVariants.length > 0) {
      const targetVariantId = searchParams.get('variant') || searchParams.get('variantId');

      // 1. Try matching by variant ID
      if (targetVariantId) {
        const matched = parsedVariants.find(v => String(v.id) === String(targetVariantId));
        if (matched && matched.attributes) {
          setSelectedAttributes(matched.attributes);
          return;
        }
      }

      // 2. Try matching by attribute query parameters (e.g. ?size=s or ?color=red)
      const paramAttrs = {};
      let hasParamAttr = false;
      for (const [pKey, pVal] of searchParams.entries()) {
        const matchingKey = variantAttributeKeys.find(
          k => k.toLowerCase() === pKey.toLowerCase()
        );
        if (matchingKey && pVal) {
          paramAttrs[matchingKey] = pVal;
          hasParamAttr = true;
        }
      }

      if (hasParamAttr) {
        // Try exact match on all supplied attribute params
        const exactMatch = parsedVariants.find(v =>
          Object.entries(paramAttrs).every(([k, val]) =>
            v.attributes && String(v.attributes[k]).toLowerCase() === String(val).toLowerCase()
          )
        );
        if (exactMatch && exactMatch.attributes) {
          setSelectedAttributes(exactMatch.attributes);
          return;
        }

        // Try best partial match
        let bestCandidate = null;
        let maxMatches = 0;
        parsedVariants.forEach(v => {
          if (!v.attributes) return;
          let matches = 0;
          Object.entries(paramAttrs).forEach(([k, val]) => {
            if (String(v.attributes[k]).toLowerCase() === String(val).toLowerCase()) {
              matches++;
            }
          });
          if (matches > maxMatches) {
            maxMatches = matches;
            bestCandidate = v;
          }
        });
        if (bestCandidate && bestCandidate.attributes) {
          setSelectedAttributes(bestCandidate.attributes);
          return;
        }
      }

      // 3. Fallback: first available in-stock variant or first variant
      const firstValid = parsedVariants.find(v => v.stock === undefined || parseInt(v.stock, 10) > 0) || parsedVariants[0];
      setSelectedAttributes(firstValid.attributes || {});
    } else if (product && (!product.variants || product.variants.length === 0)) {
      const sizeParam = searchParams.get('size');
      if (sizeParam && sizes.length > 0) {
        const matchedSize = sizes.find(s => String(s).toLowerCase() === String(sizeParam).toLowerCase());
        if (matchedSize) {
          setSelectedSize(matchedSize);
        }
      }
      setSelectedAttributes({});
    } else {
      setSelectedAttributes({});
    }
  }, [product?.id, parsedVariants, searchParams, variantAttributeKeys, sizes]);

  const handleSelectAttribute = (groupKey, value) => {
    if (!parsedVariants || parsedVariants.length === 0) {
      setSelectedAttributes(prev => ({ ...prev, [groupKey]: value }));
      return;
    }

    const tentativeAttrs = { ...selectedAttributes, [groupKey]: value };

    // 1. Exact match with current selectedAttributes + (groupKey: value)
    const exactMatch = parsedVariants.find(v =>
      variantAttributeKeys.every(k => {
        const vVal = getAttrCaseInsensitive(v.attributes, k);
        const tVal = getAttrCaseInsensitive(tentativeAttrs, k);
        return vVal !== undefined && tVal !== undefined && String(vVal).trim().toLowerCase() === String(tVal).trim().toLowerCase();
      })
    );

    let nextAttrs = tentativeAttrs;
    let matchedVariant = exactMatch;

    if (exactMatch) {
      nextAttrs = exactMatch.attributes || tentativeAttrs;
    } else {
      // 2. Find candidate variants that have groupKey = value
      const candidateVariants = parsedVariants.filter(v => {
        const vVal = getAttrCaseInsensitive(v.attributes, groupKey);
        return vVal !== undefined && String(vVal).trim().toLowerCase() === String(value).trim().toLowerCase();
      });

      if (candidateVariants.length > 0) {
        let bestVariant = candidateVariants[0];
        let maxMatchCount = -1;

        candidateVariants.forEach(candidate => {
          let matchCount = 0;
          variantAttributeKeys.forEach(k => {
            if (String(k).toLowerCase() !== String(groupKey).toLowerCase()) {
              const cVal = getAttrCaseInsensitive(candidate.attributes, k);
              const sVal = getAttrCaseInsensitive(selectedAttributes, k);
              if (cVal !== undefined && sVal !== undefined && String(cVal).trim().toLowerCase() === String(sVal).trim().toLowerCase()) {
                matchCount++;
              }
            }
          });
          if (matchCount > maxMatchCount) {
            maxMatchCount = matchCount;
            bestVariant = candidate;
          }
        });

        matchedVariant = bestVariant;
        nextAttrs = bestVariant.attributes || tentativeAttrs;
      }
    }

    setSelectedAttributes(nextAttrs);

    if (matchedVariant && matchedVariant.id) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('variant', String(matchedVariant.id));
      Object.entries(nextAttrs).forEach(([k, v]) => {
        if (v && typeof v !== 'object') {
          newParams.set(k.toLowerCase(), String(v));
        }
      });
      setSearchParams(newParams, { replace: true });
    }
  };

  const selectedVariant = useMemo(() => {
    if (!product || parsedVariants.length === 0) return null;
    return parsedVariants.find(v => {
      return variantAttributeKeys.every(key => {
        const vVal = getAttrCaseInsensitive(v.attributes, key);
        const sVal = getAttrCaseInsensitive(selectedAttributes, key);
        return vVal !== undefined && sVal !== undefined && String(vVal).trim().toLowerCase() === String(sVal).trim().toLowerCase();
      });
    });
  }, [parsedVariants, selectedAttributes, variantAttributeKeys]);

  const currentSelectedAttrs = useMemo(() => {
    if (selectedVariant && selectedVariant.attributes) return selectedVariant.attributes;
    if (selectedSize) return { size: selectedSize };
    return {};
  }, [selectedVariant, selectedSize]);

  const isWishlisted = product ? wishlist.some(item => {
    const sameProd = Number(item.productId || item.id) === Number(product.id);
    if (!sameProd) return false;
    const targetVarId = selectedVariant ? selectedVariant.id : null;
    if (targetVarId || item.variantId) {
      return Number(item.variantId) === Number(targetVarId);
    }
    const itemAttrs = item.selectedVariant;
    const hasAttrsA = itemAttrs && Object.keys(itemAttrs).length > 0;
    const hasAttrsB = currentSelectedAttrs && Object.keys(currentSelectedAttrs).length > 0;
    if (hasAttrsA || hasAttrsB) {
      return areVariantsEqual(itemAttrs, currentSelectedAttrs);
    }
    return true;
  }) : false;

  const inCart = useMemo(() => {
    if (!product || !cartItems || cartItems.length === 0) return false;
    return cartItems.some(i =>
      isCartItemMatch(i, product, selectedVariant, currentSelectedAttrs, parsedVariants.length > 0)
    );
  }, [product, cartItems, selectedVariant, currentSelectedAttrs, parsedVariants.length]);


  const rawImages = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (product.defaultProductImage) return [product.defaultProductImage];
    return [getPlaceholderSvg(product.name || 'Product')];
  }, [product]);

  const baseImages = useMemo(() => {
    if (!product) return [];
    return rawImages.map(img => typeof img === 'string' && img.length > 2 ? img : getPlaceholderSvg(product.name || 'Product'));
  }, [product, rawImages]);

  const images = useMemo(() => {
    if (!product) return [];

    if (selectedVariant) {
      let vImgs = selectedVariant?.images;
      if (typeof vImgs === 'string') {
        try { vImgs = JSON.parse(vImgs); } catch (e) { vImgs = []; }
      }
      const list = [];
      if (selectedVariant.image && typeof selectedVariant.image === 'string' && selectedVariant.image.trim() !== '') {
        list.push(selectedVariant.image);
      }
      if (Array.isArray(vImgs)) {
        vImgs.forEach(img => {
          if (img && typeof img === 'string' && img.trim() !== '' && !list.includes(img)) {
            list.push(img);
          }
        });
      }
      if (list.length > 0) {
        return list.slice(0, 5);
      }
    }

    return baseImages;
  }, [product, baseImages, selectedVariant]);

  const allLightboxImages = useMemo(() => {
    if (!product) return [];
    const list = [...images];
    if (Array.isArray(product.variants)) {
      product.variants.forEach(v => {
        if (!v) return;
        if (v.image && !list.includes(v.image)) list.push(v.image);
        if (Array.isArray(v?.images)) {
          v.images.forEach(img => {
            if (img && !list.includes(img)) list.push(img);
          });
        }
      });
    }
    return list;
  }, [product, images]);

  useEffect(() => {
    if (!isImageModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev - 1 + allLightboxImages.length) % allLightboxImages.length);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev + 1) % allLightboxImages.length);
      } else if (e.key === 'Escape') {
        setIsImageModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, allLightboxImages.length]);

  // When selectedVariant changes, automatically select the variant's first image (index 0)
  useEffect(() => {
    if (selectedVariant) {
      setSelectedImage(0);
    }
  }, [selectedVariant?.id]);

  useEffect(() => {
    if (slug) dispatch(fetchProduct(slug));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, dispatch]);

  useEffect(() => {
    if (allProducts.length === 0) {
      dispatch(fetchProducts({ limit: 40 }));
    }
  }, [allProducts.length, dispatch]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — Twin A Apparels`;
    }
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;
    if (inCart) {
      navigate('/cart');
      return;
    }

    const targetVariantId = selectedVariant ? selectedVariant.id : null;
    const existing = (cartItems || []).find(i =>
      isCartItemMatch(i, product, selectedVariant, currentSelectedAttrs, parsedVariants.length > 0)
    );
    const currentInCart = existing ? Number(existing.quantity || 0) : 0;

    if (currentInCart + quantity > displayStock) {
      const allowedAdd = Math.max(0, displayStock - currentInCart);
      if (allowedAdd === 0) {
        toast.error(`Maximum available stock (${displayStock} items) is already in your cart.`);
        return;
      }
      toast.error(`Only ${displayStock} items available in stock. Adding ${allowedAdd} instead of ${quantity}.`);
    }

    const finalQty = Math.min(quantity, Math.max(1, displayStock - currentInCart));

    const cartItem = {
      productId: product.id,
      name: product.name,
      image: (selectedVariant && selectedVariant.image) || images[0],
      priceAtAdd: displayPrice,
      quantity: finalQty,
      variantId: selectedVariant ? selectedVariant.id : null,
      gstRate: (selectedVariant && selectedVariant.gstRate) || product.gstRate || '0%',
      product: product,
      selectedVariant: selectedVariant 
        ? { ...selectedVariant.attributes, gstRate: selectedVariant.gstRate || product.gstRate || '0%' } 
        : (selectedSize ? { size: selectedSize } : {})
    };
    dispatch(addLocal(cartItem));
    dispatch(openCart());
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (displayStock <= 0) {
      toast.error('Item is out of stock.');
      return;
    }
    const finalQty = Math.min(quantity, displayStock);
    const cartItem = {
      productId: product.id,
      name: product.name,
      image: (selectedVariant && selectedVariant.image) || images[0],
      priceAtAdd: displayPrice,
      quantity: finalQty,
      variantId: selectedVariant ? selectedVariant.id : null,
      gstRate: (selectedVariant && selectedVariant.gstRate) || product.gstRate || '0%',
      product: product,
      selectedVariant: selectedVariant 
        ? { ...selectedVariant.attributes, gstRate: selectedVariant.gstRate || product.gstRate || '0%' } 
        : (selectedSize ? { size: selectedSize } : {})
    };
    dispatch(setBuyNowItem(cartItem));
    navigate('/checkout?mode=buynow');
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    const payload = {
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: (selectedVariant && selectedVariant.image) || images[0] || '',
      price: displayPrice,
      comparePrice: displayComparePrice,
      inStock: displayStock > 0,
      categoryName: product.category?.name || 'Lifestyle',
      rating: product.rating || 4.5,
      reviewCount: product.reviewCount || 10,
      variantId: selectedVariant ? selectedVariant.id : null,
      selectedVariant: selectedVariant 
        ? selectedVariant.attributes 
        : (selectedSize ? { size: selectedSize } : {})
    };
    dispatch(toggleWishlistApi(payload));
  };

  if (loading || !product) {
    return (
      <main id="main-content">
        <div className="max-w-site mx-auto px-6 md:px-8 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="skeleton aspect-square" />
            <div className="space-y-6 pt-8">
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-6 w-1/3" />
              <div className="skeleton h-10 w-1/2" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-4 w-full" />)}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const displayPrice = selectedVariant && selectedVariant.price !== null
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.price);

  const displayPriceAED = (selectedVariant && selectedVariant.priceAED !== null && selectedVariant.priceAED !== undefined && selectedVariant.priceAED !== '')
    ? selectedVariant.priceAED
    : (product.priceAED || null);

  const displayComparePrice = selectedVariant && selectedVariant.mrp !== null
    ? parseFloat(selectedVariant.mrp)
    : (product.comparePrice ? parseFloat(product.comparePrice) : null);

  const displayComparePriceAED = (selectedVariant && selectedVariant.mrpAED !== null && selectedVariant.mrpAED !== undefined && selectedVariant.mrpAED !== '')
    ? selectedVariant.mrpAED
    : (product.comparePriceAED || null);

  const displayStock = selectedVariant
    ? parseInt(selectedVariant.stock, 10)
    : parseInt(product.stock, 10);

  const discount = displayComparePrice && displayComparePrice > displayPrice
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : null;




  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    try {
      await api.post('/stock-alerts', {
        productId: product.id,
        variantId: selectedVariant ? selectedVariant.id : null,
        selectedVariant: currentSelectedAttrs,
        email: notifyEmail.trim()
      });
      setNotifySuccess(true);
      toast.success(`Restock notification alert registered for ${notifyEmail.trim()}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register restock alert.');
    }
  };

  return (
    <main id="main-content" className="overflow-x-hidden w-full max-w-full">
      {/* Breadcrumb */}
      <div className="max-w-site mx-auto px-4 sm:px-6 md:px-8 py-4">
        <nav className="text-xs text-brand-grey flex items-center gap-1 flex-wrap" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/products" className="hover:text-brand-gold transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight size={12} />
              <Link to={`/products?category=${product.category?.slug}`} className="hover:text-brand-gold transition-colors">{product.category?.name}</Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-brand-text truncate max-w-xs">{product.name}</span>
        </nav>
      </div>

      {/* Product Layout */}
      <div className="max-w-site mx-auto px-4 sm:px-6 md:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Images */}
          <div className="flex flex-col flex-1">
            <div className="flex flex-col-reverse md:flex-row gap-3 sm:gap-4">
              {/* Thumbnails */}
              <div className="flex md:flex-col gap-2.5 sm:gap-3 w-full md:w-20 overflow-x-auto md:overflow-x-visible flex-shrink-0 px-0.5 py-1.5 md:p-0 scrollbar-none max-w-full">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 overflow-hidden border-2 rounded-lg transition-all ${selectedImage === i ? 'border-brand-gold ring-2 ring-brand-gold/30 scale-[1.02]' : 'border-neutral-200 hover:border-brand-grey'}`}
                    aria-label={`Product image ${i + 1}`}
                    id={`thumb-${i}`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getPlaceholderSvg(product.name);
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Main image */}
              <div
                className="relative flex-1 aspect-square bg-brand-light overflow-hidden rounded-lg"
              >
                <div
                  className="w-full h-full relative cursor-zoom-in group"
                  onClick={() => {
                    setLightboxIndex(selectedImage);
                    setIsImageModalOpen(true);
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={selectedImage}
                      src={getImageUrl(images[selectedImage])}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getPlaceholderSvg(product.name);
                      }}
                    />
                  </AnimatePresence>
                  {discount && (
                    <span className="absolute top-4 left-4 bg-brand-gold text-white text-xs font-bold px-3 py-1">
                      −{discount}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxIndex(selectedImage);
                      setIsImageModalOpen(true);
                    }}
                    className="absolute top-4 right-4 w-9 h-9 bg-white/80 hover:bg-white text-neutral-900 rounded-full flex items-center justify-center transition-all shadow-md z-10 hover:scale-110"
                    aria-label="Zoom image"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 sm:gap-5 w-full max-w-full overflow-hidden px-1">
            {product.category && (
              <div>
                <p className="text-brand-gold text-xs tracking-[0.2em] uppercase font-semibold">
                  {product.category?.name}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h1 className="font-playfair text-2xl sm:text-3xl md:text-4xl font-semibold text-brand-text leading-tight break-words">
                {product.name}
              </h1>
              {discount && (
                <span className="text-emerald-700 font-semibold text-xs sm:text-sm bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-sm whitespace-nowrap">
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Rating */}
            {/* Rating — shown ONLY if product has real reviews */}
            {Number(reviewsState.totalCount || product.reviewCount) > 0 && Number(reviewsState.averageRating || product.rating) > 0 && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16} className={s <= Math.round(Number(reviewsState.averageRating || product.rating)) ? 'fill-brand-gold text-brand-gold' : 'fill-brand-light text-brand-light'} />
                  ))}
                </div>
                <span className="text-sm text-brand-grey font-medium">
                  {parseFloat(reviewsState.averageRating || product.rating).toFixed(1)} ({reviewsState.totalCount || product.reviewCount} {Number(reviewsState.totalCount || product.reviewCount) === 1 ? 'review' : 'reviews'})
                </span>
                <a href="#reviews" onClick={() => setActiveTab('reviews')} className="text-sm text-brand-gold hover:underline font-medium">Read reviews</a>
              </div>
            )}

            {/* Price — React Bits price reveal pattern (inline motion) */}
            <motion.div
              className="flex flex-col items-start gap-1"
              key={displayPrice}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-playfair text-2xl sm:text-3xl md:text-4xl font-bold text-brand-text whitespace-nowrap">
                  {fmt(displayPrice, displayPriceAED)}
                </span>
                {displayComparePrice && (
                  <span className="text-base sm:text-lg md:text-xl text-brand-grey line-through whitespace-nowrap">
                    {fmt(displayComparePrice, displayComparePriceAED)}
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-500 font-normal">
                (Incl. of all taxes)
              </span>
            </motion.div>

            <p className="text-brand-grey text-sm leading-relaxed">{product.shortDescription}</p>


            {/* Dynamic Variant Attributes selectors (Amazon-Style Variant Matrix) */}
            {product.variants && product.variants.length > 0 && variantAttributeKeys.map(key => {
              const currentVal = selectedAttributes[key];
              const values = variantAttributeValues[key] || [];
              const isColorKey = key.toLowerCase() === 'color' || key.toLowerCase() === 'colour';

              return (
                <div key={key} className="space-y-2.5">
                  {/* Header: KEY: Value */}
                  <p className="font-extrabold text-sm text-neutral-900 tracking-wider uppercase">
                    {key}: {currentVal && <span className="text-[#964B00] font-bold ml-1.5 normal-case">{currentVal}</span>}
                  </p>

                  {isColorKey ? (
                    /* ── Color Swatch Selector ── */
                    <div className="flex flex-wrap items-center gap-3">
                      {values.map(val => {
                        const directVariantMatch = parsedVariants.length > 0 ? parsedVariants.find(v =>
                          variantAttributeKeys.every(k =>
                            v.attributes && String(v.attributes[k]).toLowerCase() === String(k === key ? val : (selectedAttributes[k] || '')).toLowerCase()
                          )
                        ) : null;
                        const anyVariantWithVal = parsedVariants.length > 0 ? parsedVariants.find(v =>
                          v.attributes && String(v.attributes[key]).toLowerCase() === String(val).toLowerCase()
                        ) : true;
                        const isOutOfStock = directVariantMatch
                          ? (directVariantMatch.stock !== undefined && parseInt(directVariantMatch.stock, 10) <= 0)
                          : (anyVariantWithVal && anyVariantWithVal.stock !== undefined ? parseInt(anyVariantWithVal.stock, 10) <= 0 : false);
                        const isSelected = String(currentVal || '').toLowerCase() === String(val).toLowerCase();
                        const cssColor = directVariantMatch?.colorHex || anyVariantWithVal?.colorHex || resolveColor(val);
                        const isGradient = cssColor.includes('gradient');
                        const lowerVal = val.toLowerCase();
                        const isLightColor = ['white', 'cream', 'beige', 'ivory', 'off', 'yellow', 'lemon'].some(c => lowerVal.includes(c)) || cssColor === '#f9fafb' || cssColor === '#ffffff';

                        return (
                          <button
                            key={val}
                            type="button"
                            disabled={!directVariantMatch && !anyVariantWithVal}
                            onClick={() => handleSelectAttribute(key, val)}
                            title={isOutOfStock ? `${val} — Out of stock` : (!directVariantMatch && anyVariantWithVal ? `Click to select variant with ${key}: ${val}` : val)}
                            className="relative group focus-visible:outline-none cursor-pointer"
                            aria-label={`Select ${key} ${val}`}
                          >
                            <span
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-2 border-[#D4AF37] p-0.5 ring-2 ring-[#D4AF37]/30 scale-105'
                                  : (!directVariantMatch && anyVariantWithVal ? 'border-2 border-dashed border-amber-400 p-0.5 hover:scale-105' : 'border-2 border-transparent p-0.5 hover:scale-105')
                              }`}
                            >
                              <span
                                className={`w-full h-full rounded-full flex items-center justify-center shadow-md relative overflow-hidden ${
                                  isOutOfStock && !isSelected ? 'opacity-40' : ''
                                }`}
                                style={isGradient
                                  ? { background: cssColor, boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)' }
                                  : { backgroundColor: cssColor, boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12)' }
                                }
                              >
                                {isOutOfStock && (
                                  <span className="absolute inset-0 rounded-full overflow-hidden">
                                    <span
                                      className="absolute inset-0"
                                      style={{
                                        background: 'repeating-linear-gradient(135deg,transparent,transparent 4px,rgba(255,255,255,0.55) 4px,rgba(255,255,255,0.55) 5px)'
                                      }}
                                    />
                                  </span>
                                )}
                                {isSelected && (
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path
                                      d="M2.5 7L5.5 10L11.5 4"
                                      stroke={isLightColor ? '#111111' : '#ffffff'}
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                )}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── Non-color Variant Selector (Text Pills) ── */
                    <div className="flex flex-wrap gap-3">
                      {values.map(val => {
                        const directVariantMatch = parsedVariants.length > 0 ? parsedVariants.find(v =>
                          variantAttributeKeys.every(k =>
                            v.attributes && String(v.attributes[k]).toLowerCase() === String(k === key ? val : (selectedAttributes[k] || '')).toLowerCase()
                          )
                        ) : null;
                        const anyVariantWithVal = parsedVariants.length > 0 ? parsedVariants.find(v =>
                          v.attributes && String(v.attributes[key]).toLowerCase() === String(val).toLowerCase()
                        ) : true;
                        const isOutOfStock = directVariantMatch
                          ? (directVariantMatch.stock !== undefined && parseInt(directVariantMatch.stock, 10) <= 0)
                          : (anyVariantWithVal && anyVariantWithVal.stock !== undefined ? parseInt(anyVariantWithVal.stock, 10) <= 0 : false);
                        const isSelected = String(currentVal || '').toLowerCase() === String(val).toLowerCase();

                        let btnStyle = "bg-white text-neutral-900 border border-neutral-300 hover:border-neutral-400 cursor-pointer";
                        if (isSelected) {
                          if (isOutOfStock) {
                            btnStyle = "bg-neutral-950 text-amber-400 border-neutral-950 shadow-md font-extrabold line-through opacity-85 cursor-pointer ring-2 ring-amber-400/40";
                          } else {
                            btnStyle = "bg-black text-[#F5B800] border-black shadow-md font-extrabold cursor-pointer";
                          }
                        } else if (isOutOfStock) {
                          btnStyle = "bg-neutral-100 text-neutral-400 border border-neutral-300 line-through opacity-60 hover:opacity-85 cursor-pointer";
                        } else if (!directVariantMatch && anyVariantWithVal) {
                          btnStyle = "bg-amber-50/40 text-neutral-800 border border-dashed border-amber-300 hover:border-amber-500 hover:bg-amber-100/50 cursor-pointer";
                        } else if (!anyVariantWithVal) {
                          btnStyle = "bg-neutral-100 text-neutral-400 border border-dashed border-neutral-200 line-through opacity-40 cursor-not-allowed";
                        }

                        return (
                          <button
                            key={val}
                            type="button"
                            disabled={!directVariantMatch && !anyVariantWithVal}
                            onClick={() => handleSelectAttribute(key, val)}
                            className={`px-5 py-2.5 min-w-[80px] rounded-lg text-sm font-extrabold transition-all duration-150 focus-visible:outline-none ${btnStyle}`}
                            title={isOutOfStock ? `${val} — Out of stock` : (!directVariantMatch && anyVariantWithVal ? `Click to select variant with ${key}: ${val}` : `${key}: ${val}`)}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Size selector (Fallback for simple products) */}
            {(!product.variants || product.variants.length === 0) && sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="font-medium text-sm">Select Size {selectedSize && <span className="text-brand-gold">— {selectedSize}</span>}</p>
                  {/* <button className="text-xs text-brand-gold underline focus-visible:outline-brand-gold" id="size-guide-btn">Size Guide</button> */}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 border text-sm font-medium transition-all focus-visible:outline-brand-gold ${selectedSize === size ? 'border-brand-text bg-brand-text text-white' : 'border-brand-light text-brand-text hover:border-brand-grey'}`}
                      id={`size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
              <p className="font-semibold text-xs sm:text-sm text-neutral-900 flex-shrink-0">Quantity</p>
              <div className="flex items-center border border-neutral-300 rounded-lg bg-white">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-9 h-9 flex items-center justify-center hover:bg-neutral-100 transition-colors focus-visible:outline-brand-gold font-bold text-neutral-700" aria-label="Decrease quantity">−</button>
                <span className="w-9 text-center font-bold text-xs sm:text-sm text-neutral-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (quantity >= displayStock) {
                      toast.error(`Maximum available stock reached (${displayStock} items).`);
                    } else {
                      setQuantity(q => Math.min(displayStock, q + 1));
                    }
                  }}
                  disabled={quantity >= displayStock}
                  className={`w-9 h-9 flex items-center justify-center transition-colors focus-visible:outline-brand-gold font-bold ${quantity >= displayStock ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed' : 'hover:bg-neutral-100 text-neutral-700'}`}
                  aria-label="Increase quantity"
                  title={quantity >= displayStock ? `Max stock available: ${displayStock}` : 'Increase quantity'}
                >+</button>
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-brand-grey flex-shrink-0">{displayStock} in stock</span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
              {displayStock > 0 ? (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <button
                    onClick={handleAddToCart}
                    className="bg-brand-gold hover:bg-[#a8712a] text-white font-bold text-xs sm:text-sm tracking-wider uppercase py-3.5 sm:py-4 w-full sm:flex-1 flex items-center justify-center gap-2 transition-all duration-200 rounded-lg shadow-sm cursor-pointer"
                    id="pdp-add-cart"
                  >
                    <ShoppingBag size={18} />
                    {inCart ? 'View Cart' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm tracking-wider uppercase py-3.5 sm:py-4 w-full sm:flex-1 flex items-center justify-center gap-2 transition-all duration-200 rounded-lg shadow-sm cursor-pointer"
                    id="pdp-buy-now"
                  >
                    Buy Now
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="bg-neutral-950 text-white/60 font-semibold text-sm tracking-wider uppercase py-4 w-full flex items-center justify-center rounded-lg cursor-not-allowed select-none shadow-sm"
                  id="pdp-notify"
                >
                  Out of Stock
                </button>
              )}
              <button
                onClick={handleWishlistToggle}
                className={`border font-semibold text-sm tracking-wider uppercase py-4 w-full flex items-center justify-center gap-2 transition-all duration-200 rounded-lg cursor-pointer ${
                  isWishlisted 
                    ? 'border-red-400 text-red-500 bg-red-50/50 hover:bg-red-50 hover:text-red-600 hover:border-red-500' 
                    : 'border-neutral-950 text-neutral-950 hover:bg-neutral-950 hover:text-white bg-transparent'
                }`}
                id="pdp-wishlist"
              >
                <Heart size={18} className={isWishlisted ? 'fill-current text-red-500' : ''} />
                {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            {/* Authenticity Certificate Card */}
            {product.showAuthenticity && (
              <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-lg flex items-start gap-3">
                <Shield size={24} className="text-brand-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-brand-text tracking-wider uppercase">Authenticity Guaranteed</p>
                  <p className="text-[11px] text-brand-grey mt-0.5 leading-relaxed">
                    Certified 100% genuine luxury item. Accompanied by official designer brand tags, validation certificates, and master artisan credentials.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editorial Tabs — Description & Details / Verified Customer Reviews */}
        <div className="mt-14 sm:mt-20 border-t border-[#EFECE6] pt-10" id="reviews">
          <div className="flex items-center justify-start sm:justify-center border-b border-[#EFECE6] overflow-x-auto scrollbar-none gap-2 sm:gap-8" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'description'}
              onClick={() => setActiveTab('description')}
              id="pdp-tab-description"
              className={`relative py-4 px-3 sm:px-5 font-montserrat text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'description'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <FileText size={16} className={activeTab === 'description' ? 'text-[#BEA266]' : 'text-neutral-400'} />
              <span>Description</span>
              {activeTab === 'description' && (
                <motion.div
                  layoutId="pdp-active-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#BEA266]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reviews'}
              onClick={() => setActiveTab('reviews')}
              id="pdp-tab-reviews"
              className={`relative py-4 px-3 sm:px-5 font-montserrat text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'reviews'
                  ? 'text-neutral-950 font-bold'
                  : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Star size={16} className={activeTab === 'reviews' ? 'text-[#BEA266] fill-[#BEA266]' : 'text-neutral-400'} />
              <span>Reviews</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeTab === 'reviews' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
              }`}>
                {reviewsState.totalCount || 0}
              </span>
              {activeTab === 'reviews' && (
                <motion.div
                  layoutId="pdp-active-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#BEA266]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>

          <div className="py-8 sm:py-12">
            {activeTab === 'description' && (
              <div className="w-full">
                <div className="mb-6">
                  <h3 className="font-playfair text-2xl sm:text-3xl font-light text-neutral-950 tracking-wide mb-3">
                    Product Description
                  </h3>
                  <div className="flex items-center gap-3 w-28" aria-hidden="true">
                    <span className="h-[1.5px] w-8 bg-neutral-950" />
                    <span className="h-1 w-1 rotate-45 bg-[#BEA266]" />
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-[#BEA266] to-transparent" />
                  </div>
                </div>

                {/* Short Description Lead */}
                {product.shortDescription && (
                  <p className="font-playfair italic text-base sm:text-lg text-neutral-800 leading-relaxed mb-6 border-l-2 border-[#BEA266] pl-4 max-w-4xl">
                    {product.shortDescription}
                  </p>
                )}

                {/* Main Rich Text Description - Full Width */}
                <div className="w-full">
                  {product.description ? (
                    <div
                      className="prose-description text-neutral-800 leading-relaxed text-sm sm:text-base space-y-4 w-full max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="text-neutral-500 text-sm leading-relaxed italic">
                      No detailed description available for this item.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="w-full space-y-8">
                {/* Header & Write Review Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-playfair text-2xl sm:text-3xl font-light text-neutral-950 tracking-wide">
                      Customer Reviews
                    </h3>
                    <div className="flex items-center gap-3 w-28 mt-2" aria-hidden="true">
                      <span className="h-[1.5px] w-8 bg-neutral-950" />
                      <span className="h-1 w-1 rotate-45 bg-[#BEA266]" />
                      <span className="h-[1px] flex-1 bg-gradient-to-r from-[#BEA266] to-transparent" />
                    </div>
                  </div>

                  <div>
                    {reviewsState.userReview ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditReview(reviewsState.userReview)}
                        className="group flex h-11 items-center gap-2 rounded-full border border-black bg-black px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-[#DFC481] hover:bg-[#2A2014] transition-colors cursor-pointer"
                      >
                        <Edit3 size={15} /> Edit My Review
                      </button>
                    ) : reviewsState.userCanReview ? (
                      <button
                        type="button"
                        onClick={handleOpenWriteReview}
                        className="group flex h-11 items-center gap-2 rounded-full border border-black bg-black px-6 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#BEA266] hover:text-black transition-colors cursor-pointer shadow-xs"
                      >
                        <Star size={15} /> Write a Review
                      </button>
                    ) : (
                      !isAuthenticated && (
                        <Link
                          to={`/account?view=login&redirect=${encodeURIComponent(location.pathname + location.search)}`}
                          className="group flex h-11 items-center gap-2 rounded-full border border-black/30 bg-white px-5 font-sans text-[12px] font-semibold uppercase tracking-[0.14em] text-black hover:border-black transition-colors"
                        >
                          Sign In To Review
                        </Link>
                      )
                    )}
                  </div>
                </div>

                {/* Rating Score & Distribution Bar */}
                <div className="py-6 border-y border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <span className="font-playfair text-4xl sm:text-5xl font-light text-neutral-950 leading-none">
                      {parseFloat(reviewsState.averageRating || 0).toFixed(1)}
                    </span>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            className={
                              s <= Math.round(reviewsState.averageRating || 0)
                                ? 'fill-[#BEA266] text-[#BEA266]'
                                : 'fill-neutral-200 text-neutral-200'
                            }
                          />
                        ))}
                      </div>
                      <p className="font-sans text-xs text-neutral-500">
                        Based on <span className="font-semibold text-neutral-900">{reviewsState.totalCount || 0}</span> {reviewsState.totalCount === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                  </div>

                  {reviewsState.totalCount > 0 && (
                    <div className="flex items-center gap-4 text-xs font-sans text-neutral-600 overflow-x-auto scrollbar-none py-1">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviewsState.ratingBreakdown?.[star] || 0;
                        const pct = reviewsState.totalCount > 0 ? Math.round((count / reviewsState.totalCount) * 100) : 0;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewFilter(prev => prev === String(star) ? 'all' : String(star))}
                            className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                            title={`Filter by ${star} Stars`}
                          >
                            <span className="font-medium text-neutral-700">{star}★</span>
                            <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#BEA266] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[11px] text-neutral-400 tabular-nums">({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Filters Toolbar — Collections Dropdown Pattern */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <ToolbarMenu
                        id="reviews-star-filter"
                        icon={Star}
                        label="Rating"
                        options={ratingFilterOptions}
                        value={reviewFilter}
                        onChange={setReviewFilter}
                        active={reviewFilter !== 'all'}
                      />
                      <ToolbarMenu
                        id="reviews-sort-filter"
                        icon={ArrowUpDown}
                        label="Sort"
                        options={reviewSortOptions}
                        value={reviewSort}
                        onChange={setReviewSort}
                        active={reviewSort !== 'newest'}
                      />
                    </div>

                    <span className="font-sans text-[12px] text-neutral-500">
                      Showing <span className="font-semibold text-neutral-900">{filteredReviews.length}</span> of {reviewsState.totalCount || 0} reviews
                    </span>
                  </div>

                  {/* Active Filters chip list (Collections pattern) */}
                  {activeReviewChips.length > 0 && (
                    <ActiveFilters
                      chips={activeReviewChips}
                      onClearAll={() => {
                        setReviewFilter('all');
                        setReviewSort('newest');
                      }}
                    />
                  )}
                </div>

                {/* Review Cards List */}
                <div className="divide-y divide-neutral-200/80 pt-2">
                  {filteredReviews.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="font-playfair text-xl text-neutral-800 mb-2">No reviews found</p>
                      <p className="font-sans text-xs text-neutral-500 mb-4">
                        {reviewFilter !== 'all'
                          ? 'Try choosing a different rating filter or view all customer reviews.'
                          : 'Be the first to share your thoughts after delivery! Every verified order is invited to review.'}
                      </p>
                      {reviewFilter !== 'all' && (
                        <button
                          type="button"
                          onClick={() => setReviewFilter('all')}
                          className="font-sans text-xs font-semibold uppercase tracking-wider text-[#7A5F28] underline hover:text-black cursor-pointer"
                        >
                          View all reviews
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredReviews.map((review) => (
                      <div key={review.id} className="py-6 sm:py-8">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-sans font-semibold text-sm text-neutral-950">
                                {review.reviewerName}
                              </span>
                              {review.isVerifiedPurchase && (
                                <span className="text-[10px] font-sans font-semibold text-[#1F7A4C] bg-[#E8F6EE] px-2.5 py-0.5 rounded-full border border-[#C5E8D4]">
                                  Verified Buyer
                                </span>
                              )}
                            </div>
                            <span className="font-sans text-[11px] text-neutral-400">
                              {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          {review.isOwnReview && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditReview(review)}
                                className="text-xs font-sans text-neutral-600 hover:text-black flex items-center gap-1 px-2.5 py-1 rounded border border-neutral-200 hover:border-black cursor-pointer transition-colors"
                              >
                                <Edit3 size={12} /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete your review?')) {
                                    handleDeleteReview(review.id);
                                  }
                                }}
                                className="text-xs font-sans text-red-600 hover:text-red-800 flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 hover:border-red-400 cursor-pointer transition-colors"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 my-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={13}
                              className={
                                s <= review.rating
                                  ? 'fill-[#BEA266] text-[#BEA266]'
                                  : 'fill-neutral-200 text-neutral-200'
                              }
                            />
                          ))}
                        </div>

                        {review.title && (
                          <h4 className="font-playfair font-semibold text-base sm:text-lg text-neutral-950 mb-1.5">
                            {review.title}
                          </h4>
                        )}

                        <p className="font-sans text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                          {review.body}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Luxury Review Modal Form */}
        <AnimatePresence>
          {reviewModalOpen && (
            <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setReviewModalOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-[#EFECE6] my-8"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="absolute top-5 right-5 p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-full hover:bg-neutral-100 cursor-pointer"
                  aria-label="Close review dialog"
                >
                  <X size={20} />
                </button>

                <div className="mb-6">
                  <p className="font-montserrat text-[11px] font-semibold uppercase tracking-[0.24em] text-[#BEA266] mb-1">
                    VERIFIED BUYER FEEDBACK
                  </p>
                  <h3 className="font-playfair text-2xl sm:text-3xl font-light text-neutral-950">
                    {editingReviewId ? 'Edit Your Review' : 'Write a Product Review'}
                  </h3>
                  <p className="font-montserrat text-xs text-neutral-500 mt-1">
                    Sharing experience for <span className="font-semibold text-neutral-800">{product.name}</span>
                  </p>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-5">
                  {/* Rating Stars Picker */}
                  <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#EFECE6]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider font-montserrat">
                        Rating *
                      </label>
                      <span className="text-xs font-bold text-[#BEA266] font-montserrat">
                        {reviewRating === 5 ? 'Exceptional (5/5)' :
                         reviewRating === 4 ? 'Very Good (4/5)' :
                         reviewRating === 3 ? 'Good (3/5)' :
                         reviewRating === 2 ? 'Fair (2/5)' : 'Poor (1/5)'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-115 transition-transform focus:outline-none cursor-pointer"
                        >
                          <Star
                            size={28}
                            className={star <= reviewRating ? 'fill-[#BEA266] text-[#BEA266]' : 'fill-neutral-200 text-neutral-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider font-montserrat">
                      Headline (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewTitle}
                      onChange={e => setReviewTitle(e.target.value)}
                      placeholder="e.g. Magnificent craftsmanship, perfect fit!"
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-[#BEA266] focus:ring-1 focus:ring-[#BEA266] focus:outline-none font-montserrat"
                    />
                  </div>

                  {/* Body */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider font-montserrat">
                      Detailed Review Comments *
                    </label>
                    <textarea
                      rows={4}
                      value={reviewBody}
                      onChange={e => setReviewBody(e.target.value)}
                      placeholder="Share your experience regarding the fabric feel, drape, sizing, stitching, or packaging..."
                      className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-[#BEA266] focus:ring-1 focus:ring-[#BEA266] focus:outline-none resize-none font-montserrat leading-relaxed"
                      required
                    />
                  </div>

                  {/* Photo Upload (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider font-montserrat">
                      Attach Photo <span className="font-normal text-neutral-400 normal-case">(Optional · Max 5MB)</span>
                    </label>
                    {reviewImagePreview ? (
                      <div className="relative inline-block">
                        <img
                          src={reviewImagePreview}
                          alt="Review preview"
                          className="w-24 h-24 object-cover rounded-xl border border-neutral-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setReviewImage(null);
                            setReviewImagePreview(null);
                            if (reviewImageRef.current) reviewImageRef.current.value = '';
                          }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-xs cursor-pointer"
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 cursor-pointer w-full border border-dashed border-neutral-300 hover:border-[#BEA266] rounded-xl px-4 py-3 transition-colors bg-[#FAF8F5] hover:bg-amber-50/30 group">
                        <span className="text-2xl text-neutral-400 group-hover:text-[#BEA266] transition-colors">📷</span>
                        <div>
                          <p className="text-xs font-semibold text-neutral-700 group-hover:text-[#BEA266] transition-colors font-montserrat">
                            Upload a picture of your garment
                          </p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 font-montserrat">
                            JPG, PNG, WEBP up to 5MB
                          </p>
                        </div>
                        <input
                          ref={reviewImageRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleReviewImageChange}
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(false)}
                      className="px-5 py-2.5 border border-neutral-200 text-neutral-600 text-xs font-semibold rounded-full hover:bg-neutral-50 font-montserrat transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={reviewsState.submitting}
                      className="px-7 py-2.5 bg-neutral-950 text-white hover:bg-brand-gold hover:text-black text-xs font-semibold rounded-full font-montserrat uppercase tracking-wider transition-all duration-300 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {reviewsState.submitting ? 'Saving...' : (editingReviewId ? 'Update Review' : 'Submit Review')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Related Creations */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-brand-light pt-16 max-w-site mx-auto px-6 md:px-8">
          <SplitTextReveal as="h2" text="Related Creations" className="font-playfair text-2xl md:text-3xl font-normal text-brand-text mb-2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 py-8">
            {relatedProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} compactMobile />
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      <AnimatePresence>
        {isImageModalOpen && allLightboxImages.length > 0 && (
          <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-between p-4 md:p-6 select-none" onClick={e => e.target === e.currentTarget && setIsImageModalOpen(false)}>
            {/* Top Toolbar */}
            <div className="w-full max-w-7xl flex items-center justify-between z-20 text-white">
              <div>
                <h3 className="font-playfair text-base md:text-lg font-semibold">{product.name}</h3>
                <p className="text-xs text-neutral-400 font-montserrat">
                  Image {lightboxIndex + 1} of {allLightboxImages.length}
                </p>
              </div>
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Close Lightbox"
              >
                <X size={22} />
              </button>
            </div>

            {/* Center Stage with Previous & Next Navigation Arrows */}
            <div className="relative w-full max-w-6xl flex-1 flex items-center justify-center py-4 overflow-hidden">
              {allLightboxImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(prev => (prev - 1 + allLightboxImages.length) % allLightboxImages.length)}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all z-30 shadow-lg hover:scale-110"
                  aria-label="Previous Image"
                >
                  <ChevronLeft size={28} />
                </button>
              )}

              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={getImageUrl(allLightboxImages[lightboxIndex])}
                  alt={`${product.name} - View ${lightboxIndex + 1}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="max-h-[72vh] max-w-[85vw] object-contain shadow-2xl rounded-lg border border-white/10"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getPlaceholderSvg(product.name);
                  }}
                />
              </AnimatePresence>

              {allLightboxImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(prev => (prev + 1) % allLightboxImages.length)}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/15 hover:bg-white/30 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all z-30 shadow-lg hover:scale-110"
                  aria-label="Next Image"
                >
                  <ChevronRight size={28} />
                </button>
              )}
            </div>

            {/* Bottom Thumbnails Strip for Variant & Gallery Images */}
            {allLightboxImages.length > 1 && (
              <div className="w-full max-w-4xl overflow-x-auto py-2 px-4 flex justify-center gap-3 z-20">
                {allLightboxImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`w-16 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                      lightboxIndex === i ? 'border-brand-gold scale-105 shadow-md' : 'border-white/20 hover:border-white/60 opacity-60'
                    }`}
                  >
                    <img src={getImageUrl(img)} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </main>
  );
};

export default ProductDetailsPage;