import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  User,
  ArrowRight,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleMobileMenu, closeMobileMenu } from '../redux/slices/uiSlice';
import { logout } from '../redux/slices/authSlice';
import { setCurrency } from '../redux/slices/currencySlice';
import {
  fetchAutocomplete,
  trackSearch,
  setQuery,
  setDropdownOpen,
  clearSearch
} from '../redux/slices/searchSlice';
import { formatPrice } from '../utils/currency';
import api from '../services/api';

const FALLBACK_CATEGORIES = [
  { name: 'Ladies Wear', slug: 'ladies-wear' },
  { name: 'Kurtas & Sets', slug: 'kurtas-sets' },
  { name: 'Lehengas', slug: 'lehengas' },
  { name: 'Dresses', slug: 'dresses' },
  { name: 'Evening Gowns', slug: 'evening-gowns' },
  { name: 'Kaftans', slug: 'kaftans' },
  { name: 'Kids Wear', slug: 'kids-wear' },
  { name: "Men's Wear", slug: 'men-s-wear' },
];

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useSelector(s => s.cart);
  const { items: wishlistItems } = useSelector(s => s.wishlist);
  const { isAuthenticated, customer } = useSelector(s => s.auth);
  const { mobileMenuOpen } = useSelector(s => s.ui);
  const {
    suggestions: autocompleteSuggestions,
    products: autocompleteProducts,
    loading: searchLoadingState,
    isDropdownOpen: searchDropdownOpenState
  } = useSelector(s => s.search);

  const [scrolled, setScrolled] = useState(false);
  const [announcementHidden, setAnnouncementHidden] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const shopTimeoutRef = useRef(null);
  const debounceTimer = useRef(null);

  const [sliderMessages, setSliderMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // Strictly enforce Indian Currency (INR)
  useEffect(() => {
    try {
      localStorage.setItem('bb_currency', 'INR');
      dispatch(setCurrency('INR'));
    } catch {}
  }, [dispatch]);

  // Marketing messages
  useEffect(() => {
    const fetchSliderMessages = async () => {
      try {
        const res = await api.get('/marketing-messages');
        if (res.data?.success && res.data.messages?.length > 0) {
          setSliderMessages(res.data.messages);
        }
      } catch {}
    };
    fetchSliderMessages();
  }, []);

  useEffect(() => {
    if (sliderMessages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % sliderMessages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [sliderMessages]);

  // Dynamic Category Tree from backend
  const [categoryTree, setCategoryTree] = useState([]);

  useEffect(() => {
    const fetchHeaderCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.data?.success && res.data.categories?.length > 0) {
          const activeTree = res.data.categories.filter(c => c.isActive !== false);
          setCategoryTree(activeTree);
        }
      } catch {}
    };
    fetchHeaderCategories();
  }, []);

  // Header scroll detection & height synchronization
  useEffect(() => {
    let prevScrollY = window.scrollY;
    let scrollAccumulator = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - prevScrollY;

          if (Math.abs(delta) > 5) {
            dispatch(setDropdownOpen(false));
          }

          if ((delta > 0 && scrollAccumulator < 0) || (delta < 0 && scrollAccumulator > 0)) {
            scrollAccumulator = 0;
          }
          scrollAccumulator += delta;

          const THRESHOLD = 30;
          if (scrollAccumulator > THRESHOLD && currentScrollY > 120) {
            setHeaderVisible(false);
          } else if (scrollAccumulator < -THRESHOLD || currentScrollY <= 120) {
            setHeaderVisible(true);
          }

          prevScrollY = currentScrollY;
          const nextScrolled = currentScrollY > 20;
          const nextAnnouncementHidden = currentScrollY > 40;
          setScrolled(prev => (prev !== nextScrolled ? nextScrolled : prev));
          setAnnouncementHidden(prev => (prev !== nextAnnouncementHidden ? nextAnnouncementHidden : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dispatch]);

  // Close menus on route change
  useEffect(() => {
    setSearchOpen(false);
    setShopDropdownOpen(false);
    dispatch(closeMobileMenu());
    dispatch(setDropdownOpen(false));
  }, [location.pathname, dispatch]);

  // Outside click handler for search popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
        dispatch(setDropdownOpen(false));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  // Search logic
  const fetchSuggestions = useCallback((q) => {
    if (!q || q.trim().length < 1) {
      dispatch(clearSearch());
      return;
    }
    dispatch(fetchAutocomplete(q.trim()));
  }, [dispatch]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    dispatch(setQuery(val));
    if (val.trim().length > 0) {
      dispatch(setDropdownOpen(true));
    } else {
      dispatch(setDropdownOpen(false));
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 250);
  };

  const handleSearchFocus = () => {
    if (localQuery.trim().length > 0) {
      dispatch(setDropdownOpen(true));
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const q = localQuery.trim();
    if (!q) return;
    dispatch(setDropdownOpen(false));
    setSearchOpen(false);
    dispatch(trackSearch(q));
    navigate(`/products?search=${encodeURIComponent(q)}`);
  };

  const handleKeywordClick = (kw) => {
    setLocalQuery(kw);
    dispatch(setQuery(kw));
    dispatch(setDropdownOpen(false));
    setSearchOpen(false);
    dispatch(trackSearch(kw));
    navigate(`/products?search=${encodeURIComponent(kw)}`);
  };

  const handleSuggestionClick = (product) => {
    dispatch(setDropdownOpen(false));
    setSearchOpen(false);
    setLocalQuery('');
    dispatch(clearSearch());
    navigate(`/products/${product.slug}`);
  };

  const handleKeyDown = (e) => {
    if (!searchDropdownOpenState) return;
    const list = autocompleteSuggestions;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 < list.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : list.length - 1));
    } else if (e.key === 'Escape') {
      dispatch(setDropdownOpen(false));
      setSearchOpen(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < list.length) {
        e.preventDefault();
        handleKeywordClick(list[activeIndex]);
        setActiveIndex(-1);
      }
    }
  };

  const openShopDropdown = () => {
    if (shopTimeoutRef.current) clearTimeout(shopTimeoutRef.current);
    setShopDropdownOpen(true);
  };

  const closeShopDropdown = () => {
    shopTimeoutRef.current = setTimeout(() => {
      setShopDropdownOpen(false);
    }, 180);
  };

  // Focus search input on open
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
        handleSearchFocus();
      }, 60);
    }
  }, [searchOpen]);

  const cartCount = items.length;
  const wishlistCount = wishlistItems?.length || 0;
  const displayCategories = categoryTree.length > 0 ? categoryTree : FALLBACK_CATEGORIES;

  return (
    <>
      {/* ── Global Typography Styles for Navbar ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

        .font-cormorant {
          font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
        }
        .font-jakarta {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}</style>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-jakarta ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        } ${scrolled ? 'shadow-[0_4px_20px_rgba(25,35,30,0.06)]' : ''}`}
        role="banner"
      >
        {/* ── 1. Announcement Bar ── */}
        <div
          className={`bg-white text-[#1C2520] border-b border-[#ECE7DE] tracking-[0.22em] uppercase text-[10px] sm:text-[11px] overflow-hidden relative h-9 flex items-center justify-center transition-all duration-300 ease-in-out font-jakarta font-medium ${
            announcementHidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          style={{ marginTop: announcementHidden ? '-36px' : '0px' }}
        >
          <div className="w-full text-center px-4 truncate">
            {sliderMessages.length > 0 ? (
              <span>{sliderMessages[currentMessageIndex]?.message}</span>
            ) : (
              <span>JOIN THE TWIN A APPARELS CIRCLE FOR EXCLUSIVE OFFERS AND UPDATES.</span>
            )}
          </div>
        </div>

        {/* ── 2. Main Luxury Navbar ── */}
        <div
          className="bg-[#FAF9F5] border-b border-[#ECE7DE]/90 backdrop-blur-md relative"
          onMouseLeave={closeShopDropdown}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-[74px] flex items-center justify-between relative">
            
            {/* ── Left: Brand Logo (AA Emblem + TWIN A APPARELS) ── */}
            <div className="flex items-center gap-6">
              {/* Mobile hamburger menu toggle */}
              <button
                onClick={() => dispatch(toggleMobileMenu())}
                className="lg:hidden p-1.5 -ml-1 text-[#1E3A2F] hover:text-[#14271F] transition-colors focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                <Menu size={22} strokeWidth={1.75} />
              </button>

              <Link
                to="/"
                className="flex items-center group focus:outline-none select-none py-1"
                aria-label="Twin A Apparels — Home"
              >
                {/* Brand Logo */}
                <img
                  src="/logo.png"
                  alt="Twin A Apparels Logo"
                  className="h-12 sm:h-14 md:h-[58px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            </div>

            {/* ── Center: Desktop Navigation Links ── */}
            <nav className="hidden lg:flex items-center gap-8 xl:gap-11" aria-label="Main Navigation">
              {/* 1. Home */}
              <Link
                to="/"
                className={`font-jakarta text-[14px] font-medium tracking-[0.03em] transition-colors ${
                  location.pathname === '/' ? 'text-[#1E3A2F] font-semibold' : 'text-[#202B24] hover:text-[#1E3A2F]'
                }`}
              >
                Home
              </Link>

              {/* 2. About */}
              <Link
                to="/about"
                className={`font-jakarta text-[14px] font-medium tracking-[0.03em] transition-colors ${
                  location.pathname === '/about' ? 'text-[#1E3A2F] font-semibold' : 'text-[#202B24] hover:text-[#1E3A2F]'
                }`}
              >
                About
              </Link>

              {/* 3. Shop ⌵ Trigger */}
              <div
                className="py-6 cursor-pointer"
                onMouseEnter={openShopDropdown}
              >
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className={`flex items-center gap-1.5 font-jakarta text-[14px] font-medium tracking-[0.03em] transition-colors focus:outline-none ${
                    location.pathname.startsWith('/products') || location.pathname.startsWith('/category')
                      ? 'text-[#1E3A2F] font-semibold'
                      : 'text-[#202B24] hover:text-[#1E3A2F]'
                  }`}
                >
                  <span>Shop</span>
                  <ChevronDown
                    size={14}
                    className={`transform transition-transform duration-200 text-[#55695F] ${
                      shopDropdownOpen ? 'rotate-180 text-[#1E3A2F]' : ''
                    }`}
                  />
                </button>
              </div>

              {/* 4. Contact */}
              <Link
                to="/contact"
                className={`font-jakarta text-[14px] font-medium tracking-[0.03em] transition-colors ${
                  location.pathname === '/contact' ? 'text-[#1E3A2F] font-semibold' : 'text-[#202B24] hover:text-[#1E3A2F]'
                }`}
              >
                Contact
              </Link>
            </nav>

            {/* ── Right: Action Icons (Search, Wishlist, Account, Bag) ── */}
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-5 text-[#1E3A2F]">
              
              {/* Search Toggle Icon */}
              <button
                type="button"
                onClick={() => setSearchOpen(prev => !prev)}
                className={`p-2 rounded-full hover:bg-[#ECE7DE]/60 transition-colors focus:outline-none ${
                  searchOpen ? 'text-[#1E3A2F] bg-[#ECE7DE]/70' : 'text-[#1E3A2F]'
                }`}
                aria-label="Search"
              >
                <Search size={21} strokeWidth={1.75} />
              </button>

              {/* Wishlist */}
              <Link
                to="/account/wishlist"
                className="relative p-2 rounded-full hover:bg-[#ECE7DE]/60 transition-colors focus:outline-none"
                aria-label={`Wishlist — ${wishlistCount} items`}
              >
                <Heart size={21} strokeWidth={1.75} />
                {wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#1E3A2F] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* User Account */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button
                    type="button"
                    className="p-2 rounded-full hover:bg-[#ECE7DE]/60 transition-colors focus:outline-none flex items-center"
                    aria-label="Account menu"
                  >
                    <User size={21} strokeWidth={1.75} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#FAF9F5] text-[#1E3A2F] shadow-xl border border-[#ECE7DE] rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-3 border-b border-[#ECE7DE]">
                      <p className="font-semibold text-xs text-[#1E3A2F] truncate">{customer?.name || 'Member'}</p>
                      <p className="text-[11px] text-[#55695F] truncate">{customer?.email}</p>
                    </div>
                    <Link to="/account" className="block px-4 py-2.5 text-xs font-jakarta text-[#2B3831] hover:bg-[#F2EFE9] hover:text-[#1E3A2F] transition-colors">
                      My Profile
                    </Link>
                    <Link to="/account/orders" className="block px-4 py-2.5 text-xs font-jakarta text-[#2B3831] hover:bg-[#F2EFE9] hover:text-[#1E3A2F] transition-colors">
                      Order History
                    </Link>
                    <button
                      onClick={() => { dispatch(logout()); navigate('/'); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-jakarta hover:bg-[#F2EFE9] transition-colors text-rose-700 border-t border-[#ECE7DE]"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to={location.pathname.startsWith('/account') ? '/account?view=login' : `/account?view=login&redirect=${encodeURIComponent(location.pathname + location.search)}`}
                  className="p-2 rounded-full hover:bg-[#ECE7DE]/60 transition-colors focus:outline-none"
                  aria-label="Sign in"
                >
                  <User size={21} strokeWidth={1.75} />
                </Link>
              )}

              {/* Shopping Bag with Green Circle Counter Badge */}
              <Link
                to="/cart"
                className="relative p-2 rounded-full hover:bg-[#ECE7DE]/60 transition-colors focus:outline-none"
                aria-label={`Shopping bag — ${cartCount} items`}
              >
                <ShoppingBag size={21} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] px-1 bg-[#1E3A2F] text-white text-[10px] font-bold font-jakarta rounded-full flex items-center justify-center shadow-sm"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </Link>
            </div>

            {/* ── Centered Mega Dropdown Panel (Horizontal Dead Center) ── */}
            <AnimatePresence>
              {shopDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 6, x: '-50%' }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  onMouseEnter={openShopDropdown}
                  onMouseLeave={closeShopDropdown}
                  style={{ left: '50%' }}
                  className="absolute top-full w-[780px] max-w-[95vw] bg-[#FAF9F5] border border-[#ECE7DE] rounded-2xl shadow-[0_20px_50px_rgba(25,35,30,0.12)] p-7 z-50 overflow-hidden"
                >
                  <div className="grid grid-cols-3 gap-6">
                    {/* Col 1 & 2: Real Categories from DB */}
                    <div className="col-span-2 space-y-4">
                      <p className="font-cormorant text-base font-semibold tracking-[0.1em] text-[#1E3A2F] uppercase border-b border-[#ECE7DE] pb-2">
                        Collections & Departments
                      </p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                        {displayCategories.map((cat) => (
                          <Link
                            key={cat.slug || cat.id}
                            to={`/category/${cat.slug}`}
                            onClick={() => setShopDropdownOpen(false)}
                            className="group/item flex items-center justify-between text-[13.5px] font-jakarta text-[#38463F] hover:text-[#1E3A2F] transition-colors py-1"
                          >
                            <span className="group-hover/item:translate-x-1 transition-transform">
                              {cat.name}
                            </span>
                            <ChevronRight size={13} className="text-[#8B9D94] opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          </Link>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-[#ECE7DE]/80 flex items-center gap-5">
                        <Link
                          to="/products"
                          onClick={() => setShopDropdownOpen(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-jakarta font-semibold tracking-wider uppercase text-[#1E3A2F] hover:text-[#12241D] hover:underline"
                        >
                          <span>All Collections</span>
                          <ArrowRight size={13} />
                        </Link>
                        <Link
                          to="/category/new-arrivals"
                          onClick={() => setShopDropdownOpen(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-jakarta font-semibold tracking-wider uppercase text-[#1E3A2F] hover:text-[#12241D] hover:underline"
                        >
                          <span>New Arrivals</span>
                        </Link>
                        <Link
                          to="/category/sale"
                          onClick={() => setShopDropdownOpen(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-jakarta font-semibold tracking-wider uppercase text-amber-700 hover:text-amber-800 hover:underline"
                        >
                          <span>Deals</span>
                        </Link>
                      </div>
                    </div>

                    {/* Col 3: Curated Editorial Card */}
                    <div className="bg-[#F2EFE9] rounded-xl p-5 flex flex-col justify-between border border-[#ECE7DE]">
                      <div>
                        <span className="text-[9px] font-jakarta font-bold uppercase tracking-[0.2em] text-[#1E3A2F]/80">
                          Curated Luxury
                        </span>
                        <h4 className="font-cormorant text-lg font-semibold text-[#1E3A2F] leading-snug mt-1">
                          Twin A Festive & Bridal Edit
                        </h4>
                        <p className="text-[11.5px] text-[#55695F] font-jakarta mt-2 leading-relaxed">
                          Hand-crafted couture tailoring, artisanal silks, and timeless silhouettes.
                        </p>
                      </div>
                      <Link
                        to="/category/new-arrivals"
                        onClick={() => setShopDropdownOpen(false)}
                        className="mt-4 text-[11.5px] font-jakarta font-semibold text-[#1E3A2F] hover:text-black flex items-center gap-1"
                      >
                        <span>Shop The Look</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Compact Floating Search Popover (Anchored on the right, does NOT cover screen) ── */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  ref={searchContainerRef}
                  className="absolute right-4 sm:right-8 lg:right-12 top-full mt-2 w-[390px] sm:w-[440px] max-w-[calc(100vw-32px)] bg-white border border-[#ECE7DE] rounded-2xl shadow-[0_20px_50px_rgba(25,35,30,0.15)] p-4 z-[60] overflow-hidden"
                >
                  {/* Search Input Bar */}
                  <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                    <Search size={16} className="absolute left-3.5 text-[#55695F] pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={localQuery}
                      onChange={handleSearchInput}
                      onFocus={handleSearchFocus}
                      onKeyDown={handleKeyDown}
                      placeholder="Search kurtas, lehengas, gowns..."
                      className="w-full bg-[#FAF9F5] border border-[#ECE7DE] text-[#1E3A2F] placeholder-[#8B9D94] pl-10 pr-20 py-2.5 rounded-xl text-xs sm:text-sm font-jakarta focus:outline-none focus:border-[#1E3A2F] focus:bg-white transition-all"
                      autoComplete="off"
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      {searchLoadingState && (
                        <div className="w-3.5 h-3.5 border-2 border-[#1E3A2F] border-t-transparent rounded-full animate-spin mr-1" />
                      )}
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-[#1E3A2F] text-white text-[11px] font-jakarta font-semibold tracking-wide uppercase rounded-lg hover:bg-black transition-colors"
                      >
                        Go
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSearchOpen(false); dispatch(setDropdownOpen(false)); }}
                        className="p-1 text-[#8B9D94] hover:text-[#1E3A2F] transition-colors"
                        aria-label="Close search"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </form>

                  {/* Search Results Preview */}
                  {searchDropdownOpenState && localQuery.trim().length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#ECE7DE]/80 max-h-[340px] overflow-y-auto scrollbar-thin space-y-3">
                      {/* Keyword Suggestions */}
                      {autocompleteSuggestions.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-[#8B9D94] uppercase tracking-wider mb-1 px-1">
                            Suggested Queries
                          </p>
                          <div className="space-y-0.5">
                            {autocompleteSuggestions.map((kw, i) => (
                              <button
                                key={kw}
                                type="button"
                                onClick={() => handleKeywordClick(kw)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs font-jakarta transition-colors ${
                                  activeIndex === i ? 'bg-[#F2EFE9] text-[#1E3A2F] font-semibold' : 'hover:bg-[#FAF9F5] text-[#2B3831]'
                                }`}
                              >
                                <span>{kw}</span>
                                <ArrowRight size={11} className="text-[#8B9D94]" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Product Matches */}
                      {autocompleteProducts.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-[#8B9D94] uppercase tracking-wider mb-1.5 px-1">
                            Products
                          </p>
                          <div className="space-y-1.5">
                            {autocompleteProducts.map((product) => (
                              <button
                                key={product.id || product._id}
                                type="button"
                                onClick={() => handleSuggestionClick(product)}
                                className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#FAF9F5] transition-colors text-left group"
                              >
                                <div className="w-10 h-12 bg-[#F2EFE9] rounded-lg overflow-hidden flex-shrink-0 border border-[#ECE7DE]">
                                  {product.image && (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-jakarta font-medium text-[#1E3A2F] truncate">{product.name}</p>
                                  <p className="text-xs font-jakarta font-bold text-[#1E3A2F] mt-0.5">
                                    {formatPrice(product.price, 'INR')}
                                  </p>
                                </div>
                                <ArrowRight size={12} className="text-[#8B9D94] opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No Matches */}
                      {autocompleteSuggestions.length === 0 && autocompleteProducts.length === 0 && !searchLoadingState && (
                        <div className="py-4 text-center text-xs font-jakarta text-[#55695F]">
                          No matches found for "{localQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── 3. Mobile Menu Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.28 }}
            className="fixed inset-0 z-[1000] bg-[#FAF9F5] text-[#1E3A2F] flex flex-col font-jakarta"
            role="dialog"
            aria-label="Mobile Navigation"
          >
            {/* Drawer Top Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECE7DE]">
              <Link
                to="/"
                onClick={() => dispatch(closeMobileMenu())}
                className="flex items-center group focus:outline-none"
                aria-label="Twin A Apparels — Home"
              >
                <img
                  src="/logo.png"
                  alt="Twin A Apparels Logo"
                  className="h-9 sm:h-10 w-auto object-contain"
                />
              </Link>
              <button
                onClick={() => dispatch(closeMobileMenu())}
                className="p-1.5 text-[#1E3A2F] hover:text-black focus:outline-none"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
              <Link
                to="/"
                onClick={() => dispatch(closeMobileMenu())}
                className="block py-3 font-cormorant text-2xl font-medium border-b border-[#ECE7DE]/60 text-[#1E3A2F]"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => dispatch(closeMobileMenu())}
                className="block py-3 font-cormorant text-2xl font-medium border-b border-[#ECE7DE]/60 text-[#1E3A2F]"
              >
                About
              </Link>
              <Link
                to="/products"
                onClick={() => dispatch(closeMobileMenu())}
                className="block py-3 font-cormorant text-2xl font-medium border-b border-[#ECE7DE]/60 text-[#1E3A2F]"
              >
                Shop All Collections
              </Link>
              <Link
                to="/contact"
                onClick={() => dispatch(closeMobileMenu())}
                className="block py-3 font-cormorant text-2xl font-medium border-b border-[#ECE7DE]/60 text-[#1E3A2F]"
              >
                Contact
              </Link>

              {/* Categories Accordion */}
              <div className="pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B9D94] mb-2">
                  Shop by Category
                </p>
                <div className="space-y-1">
                  {displayCategories.map((cat) => (
                    <Link
                      key={cat.slug || cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => dispatch(closeMobileMenu())}
                      className="flex items-center justify-between py-2 text-sm font-jakarta text-[#38463F] hover:text-[#1E3A2F]"
                    >
                      <span>{cat.name}</span>
                      <ChevronRight size={14} className="text-[#8B9D94]" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Footer Links */}
            <div className="p-5 border-t border-[#ECE7DE] bg-[#F4F1EA] space-y-3">
              <Link
                to={isAuthenticated ? "/account" : "/account?view=login"}
                onClick={() => dispatch(closeMobileMenu())}
                className="flex items-center gap-2.5 text-sm font-jakarta text-[#1E3A2F]"
              >
                <User size={18} />
                <span>{isAuthenticated ? "My Account" : "Sign In / Register"}</span>
              </Link>
              <Link
                to="/account/wishlist"
                onClick={() => dispatch(closeMobileMenu())}
                className="flex items-center gap-2.5 text-sm font-jakarta text-[#1E3A2F]"
              >
                <Heart size={18} />
                <span>Wishlist ({wishlistCount})</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. Page Spacers ── */}
      <div
        style={{ height: announcementHidden ? '74px' : '110px', transition: 'height 0.3s ease' }}
        className="hidden lg:block"
        aria-hidden="true"
      />
      <div
        style={{ height: announcementHidden ? '66px' : '102px', transition: 'height 0.3s ease' }}
        className="block lg:hidden"
        aria-hidden="true"
      />
    </>
  );
};

export default Navbar;
