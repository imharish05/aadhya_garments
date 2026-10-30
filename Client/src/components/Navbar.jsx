import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShoppingBag,
  ChevronDown,
  Heart,
  Search,
  Menu,
  X,
  User,
  ArrowRight,
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
import { getImageUrl } from '../utils/imageUrl';

const FALLBACK_CATEGORIES = [
  { name: 'Ladies Wear', slug: 'ladies-wear' },
  { name: "Men's Wear", slug: 'men-s-wear' },
  { name: 'Kids Wear', slug: 'kids-wear' },
];

/** Typewriter effect for the search placeholder. */
function useTypewriter(phrases, active) {
  const [text, setText] = useState('');
  const key = phrases.join('|');
  useEffect(() => {
    if (!active || phrases.length === 0) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setText(phrases[0]);
      return undefined;
    }
    let i = 0;
    let j = 0;
    let deleting = false;
    let t;
    const tick = () => {
      const full = phrases[i];
      if (!deleting) {
        j += 1;
        setText(full.slice(0, j));
        if (j === full.length) { deleting = true; t = setTimeout(tick, 1500); return; }
        t = setTimeout(tick, 80);
      } else {
        j -= 1;
        setText(full.slice(0, j));
        if (j === 0) { deleting = false; i = (i + 1) % phrases.length; t = setTimeout(tick, 350); return; }
        t = setTimeout(tick, 35);
      }
    };
    t = setTimeout(tick, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active]);
  return text;
}

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
  const [hoverCat, setHoverCat] = useState(null);
  const catTimer = useRef(null);
  const stripRef = useRef(null);
  const [localQuery, setLocalQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mobileOpenCat, setMobileOpenCat] = useState(null);

  const searchDropdownOpenRef = useRef(searchDropdownOpenState);
  useEffect(() => {
    searchDropdownOpenRef.current = searchDropdownOpenState;
  }, [searchDropdownOpenState]);

  const searchContainerRef = useRef(null);
  const searchToggleRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Measure the real header height so the spacer below it always matches
  const headerRef = useRef(null);
  const [headerH, setHeaderH] = useState(117);

  const [sliderMessages, setSliderMessages] = useState([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const update = () => setHeaderH(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
      // '/categories/tree' returns each category WITH its subcategories.
      // (plain '/categories' is flat, so the dropdown had nothing to show)
      try {
        const res = await api.get('/categories/tree');
        if (res.data?.success && res.data.categories?.length > 0) {
          setCategoryTree(res.data.categories.filter(c => c.isActive !== false));
          return;
        }
      } catch {}
      try {
        const res = await api.get('/categories');
        if (res.data?.success && res.data.categories?.length > 0) {
          setCategoryTree(res.data.categories.filter(c => c.isActive !== false));
        }
      } catch {}
    };
    fetchHeaderCategories();
  }, []);

  // Header scroll detection
  useEffect(() => {
    let prevScrollY = window.scrollY;
    let scrollAccumulator = 0;
    let ticking = false;
    let lastDropdownClose = 0;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const delta = currentScrollY - prevScrollY;

          if (searchDropdownOpenRef.current && Math.abs(delta) > 5) {
            dispatch(setDropdownOpen(false));
          }

          if ((delta > 0 && scrollAccumulator < 0) || (delta < 0 && scrollAccumulator > 0)) {
            scrollAccumulator = 0;
          }
          scrollAccumulator += delta;

          const THRESHOLD = 30;
          if (scrollAccumulator > THRESHOLD && currentScrollY > 120) {
            setHeaderVisible(prev => (prev ? false : prev));
          } else if (scrollAccumulator < -THRESHOLD || currentScrollY <= 120) {
            setHeaderVisible(prev => (!prev ? true : prev));
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
    setHoverCat(null);
    dispatch(closeMobileMenu());
    dispatch(setDropdownOpen(false));
  }, [location.pathname, dispatch]);

  // Outside click handler for search popover (the toggle button handles itself)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchToggleRef.current?.contains(e.target)) return;
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchOpen(false);
        dispatch(setDropdownOpen(false));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dispatch]);

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Focus the input whenever search opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

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
    if (e.key === 'Escape') {
      dispatch(setDropdownOpen(false));
      setSearchOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!searchDropdownOpenState) return;
    const list = autocompleteSuggestions;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 < list.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 >= 0 ? prev - 1 : list.length - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < list.length) {
        e.preventDefault();
        handleKeywordClick(list[activeIndex]);
        setActiveIndex(-1);
      }
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    dispatch(setDropdownOpen(false));
  };

  const cartCount = items.length;
  const wishlistCount = wishlistItems?.length || 0;
  const displayCategories = categoryTree.length > 0 ? categoryTree : FALLBACK_CATEGORIES;
  const openCat = (key) => {
    if (catTimer.current) clearTimeout(catTimer.current);
    setHoverCat(key);
  };
  const closeCat = () => {
    catTimer.current = setTimeout(() => setHoverCat(null), 140);
  };
  const catItems = displayCategories.map(cat => ({
    key: cat.slug || cat.id,
    name: cat.name,
    to: `/category/${cat.slug}`,
    active: location.pathname.startsWith(`/category/${cat.slug}`),
    subs: (cat.subcategories || cat.subCategories || [])
      .filter(sc => sc.isActive !== false)
      .map(sc => ({ ...sc, imageUrl: sc.image ? getImageUrl(sc.image) : null })),
  }));
  const allActive = location.pathname === '/products';

  const searchPhrases = [...displayCategories.map(c => c.name), 'your next outfit'];
  const typedPlaceholder = useTypewriter(searchPhrases, searchOpen && localQuery === '');

  const iconBtn = 'group/ic relative flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-full text-[#F3E7C6] hover:bg-white/10 transition-colors focus:outline-none 2xl:h-auto 2xl:w-auto 2xl:rounded-2xl 2xl:px-2.5 2xl:py-1.5';
  const iconLabel = 'hidden 2xl:block text-[10.5px] font-medium uppercase tracking-[0.12em] text-[#A89A78] group-hover/ic:text-[#F3E7C6]';
  const navLinkCls = (active) =>
    `flex items-center gap-1.5 rounded-full px-3.5 xl:px-4 py-2.5 text-[12.5px] font-medium uppercase tracking-[0.12em] whitespace-nowrap transition-all duration-300 ${
      active ? 'bg-[#BEA266]/20 text-[#DFC481]' : 'text-[#BFB08A] hover:bg-[#BEA266]/15 hover:text-white'
    }`;

  const megaCat = catItems.find(c => c.key === hoverCat && c.subs.length > 0);

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 font-inter ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        } ${scrolled ? 'shadow-[0_8px_30px_rgba(0,0,0,0.5)]' : ''}`}
        role="banner"
      >
        {/* Announcement bar */}
        <div
          className={`bg-[#BEA266] text-black tracking-[0.2em] uppercase text-[10px] sm:text-[11px] overflow-hidden h-9 flex items-center justify-center transition-all duration-300 ease-in-out font-medium ${
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

        <div className="relative bg-black border-b border-[#2B2416]">
          {/* ── Single row: logo · categories · actions ── */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-16 lg:h-20 grid grid-cols-[1fr_auto_1fr] lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center lg:gap-6">
            {/* left: hamburger (mobile) / logo (desktop) */}
            <div className="flex items-center justify-self-start">
              <button
                onClick={() => dispatch(toggleMobileMenu())}
                className="lg:hidden -ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[#F3E7C6] hover:bg-white/10 transition-colors focus:outline-none"
                aria-label="Toggle mobile menu"
              >
                <Menu size={22} strokeWidth={1.75} />
              </button>
              <Link to="/" className="hidden lg:flex items-center focus:outline-none" aria-label="Twin A Apparels — Home">
                <img src="/logo.png" alt="Twin A Apparels Logo" className="h-16 w-auto object-contain" />
              </Link>
            </div>

            {/* mobile logo */}
            <Link to="/" className="lg:hidden flex items-center focus:outline-none" aria-label="Twin A Apparels — Home">
              <img src="/logo.png" alt="Twin A Apparels Logo" className="h-12 w-auto object-contain" />
            </Link>

            {/* desktop categories + About/Contact (centre) */}
            <nav className="hidden lg:block h-full min-w-0" aria-label="Shop by category">
              <ul ref={stripRef} className="flex h-full items-center justify-center">
                {catItems.map(cat => (
                  <li
                    key={cat.key}
                    className="shrink-0 h-full flex items-center"
                    onMouseEnter={() => cat.subs.length > 0 && openCat(cat.key)}
                    onMouseLeave={closeCat}
                  >
                    <Link
                      to={cat.to}
                      aria-current={cat.active ? 'page' : undefined}
                      aria-haspopup={cat.subs.length > 0 ? 'true' : undefined}
                      className={navLinkCls(cat.active || hoverCat === cat.key)}
                    >
                      {cat.name}
                      {cat.subs.length > 0 && (
                        <ChevronDown size={12} className={`transition-transform duration-300 ${hoverCat === cat.key ? 'rotate-180' : ''}`} />
                      )}
                    </Link>

                    {/* Full-width mega panel (positioned against the header, not this li) */}
                    <AnimatePresence>
                      {hoverCat === cat.key && cat.subs.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          onMouseEnter={() => openCat(cat.key)}
                          className="absolute left-0 right-0 top-full z-50 bg-[#0E0C07] border-t border-[#BEA266]/40 shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
                        >
                          <div className="max-w-[1440px] mx-auto px-12 py-9 grid grid-cols-[minmax(0,240px)_minmax(0,1fr)] gap-12 items-center">
                            {/* title */}
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#BEA266]">Shop</p>
                              <h3 className="font-playfair mt-2 text-3xl font-medium leading-tight text-[#F3E7C6]">{cat.name}</h3>
                              <span className="mt-4 block h-px w-12 bg-[#BEA266]" />
                              <Link
                                to={cat.to}
                                className="group/all mt-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#DFC481] hover:text-white transition-colors"
                              >
                                View all
                                <ArrowRight size={14} className="transition-transform duration-300 group-hover/all:translate-x-1" />
                              </Link>
                            </div>

                            {/* sub-category cards with images */}
                            <ul className="flex gap-6 overflow-x-auto scrollbar-hide border-l border-[#2B2416] pl-12 py-1">
                              {cat.subs.map((sc, i) => (
                                <motion.li
                                  key={sc.slug || sc.id}
                                  className="shrink-0"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                                >
                                  <Link
                                    to={`/category/${cat.key}/${sc.slug}`}
                                    className="group/sub flex w-[132px] flex-col items-center text-center"
                                  >
                                    <span className="relative block aspect-[3/4] w-full overflow-hidden rounded-t-[999px] rounded-b-2xl border border-[#BEA266]/30 bg-[#17130B] transition-colors duration-300 group-hover/sub:border-[#BEA266]">
                                      {sc.imageUrl ? (
                                        <img
                                          src={sc.imageUrl}
                                          alt=""
                                          loading="lazy"
                                          className="h-full w-full object-cover transition-transform duration-700 group-hover/sub:scale-110"
                                        />
                                      ) : (
                                        <span className="font-playfair flex h-full w-full items-center justify-center text-4xl text-[#BEA266]/60">
                                          {sc.name?.charAt(0)}
                                        </span>
                                      )}
                                    </span>
                                    <span className="mt-3 text-[11.5px] font-medium uppercase tracking-[0.14em] text-[#D9CBA6] transition-colors duration-300 group-hover/sub:text-white">
                                      {sc.name}
                                    </span>
                                    <span className="mt-1.5 block h-px w-0 bg-[#BEA266] transition-all duration-300 group-hover/sub:w-8" />
                                  </Link>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
                <li className="shrink-0 h-full flex items-center">
                  <Link to="/about" aria-current={location.pathname === '/about' ? 'page' : undefined} className={navLinkCls(location.pathname === '/about')}>About</Link>
                </li>
                <li className="shrink-0 h-full flex items-center">
                  <Link to="/contact" aria-current={location.pathname === '/contact' ? 'page' : undefined} className={navLinkCls(location.pathname === '/contact')}>Contact</Link>
                </li>
              </ul>
            </nav>

            {/* actions */}
            <div className="flex items-center justify-self-end gap-0.5">
              <button
                ref={searchToggleRef}
                type="button"
                onClick={() => setSearchOpen(o => !o)}
                className={iconBtn}
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <Search size={21} strokeWidth={1.6} />
                <span className={iconLabel}>Search</span>
              </button>

              <Link to="/account/wishlist" className={`${iconBtn} hidden sm:flex`} aria-label={`Wishlist — ${wishlistCount} items`}>
                <span className="relative">
                  <Heart size={21} strokeWidth={1.6} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#BEA266] text-black text-[9px] font-bold rounded-full flex items-center justify-center">{wishlistCount}</span>
                  )}
                </span>
                <span className={iconLabel}>Wishlist</span>
              </Link>

              {isAuthenticated ? (
                <div className="relative group hidden sm:block">
                  <button type="button" className={iconBtn} aria-label="Account menu">
                    <User size={21} strokeWidth={1.6} />
                    <span className={iconLabel}>Account</span>
                  </button>
                  <div className="absolute right-0 top-full pt-2 w-52 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-[#0E0C07] border border-[#2B2416] shadow-xl rounded-2xl overflow-hidden text-[#F3E7C6]">
                      <div className="px-5 py-3.5 border-b border-[#2B2416]">
                        <p className="font-semibold text-xs truncate">{customer?.name || 'Member'}</p>
                        <p className="text-[11px] text-[#A89A78] truncate">{customer?.email}</p>
                      </div>
                      <Link to="/account" className="block px-5 py-2.5 text-xs hover:bg-white/10 transition-colors">My Profile</Link>
                      <Link to="/account/orders" className="block px-5 py-2.5 text-xs hover:bg-white/10 transition-colors">Order History</Link>
                      <button
                        onClick={() => { dispatch(logout()); navigate('/'); }}
                        className="w-full text-left px-5 py-2.5 text-xs hover:bg-white/10 transition-colors text-rose-400 border-t border-[#2B2416]"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to={location.pathname.startsWith('/account') ? '/account?view=login' : `/account?view=login&redirect=${encodeURIComponent(location.pathname + location.search)}`}
                  className={`${iconBtn} hidden sm:flex`}
                  aria-label="Sign in"
                >
                  <User size={21} strokeWidth={1.6} />
                  <span className={iconLabel}>Sign in</span>
                </Link>
              )}

              <Link to="/cart" className={iconBtn} aria-label={`Shopping bag — ${cartCount} items`}>
                <span className="relative">
                  <ShoppingBag size={21} strokeWidth={1.6} />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-[#BEA266] text-black text-[9px] font-bold rounded-full flex items-center justify-center"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </span>
                <span className={iconLabel}>Bag</span>
              </Link>
            </div>
          </div>

          {/* ── Search: covers the row on desktop, drops below it on mobile ── */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                ref={searchContainerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="px-4 sm:px-8 pb-3 lg:pb-0 lg:px-12 lg:absolute lg:inset-x-0 lg:top-0 lg:h-20 lg:bg-black lg:z-20 lg:flex lg:items-center"
              >
                <div className="relative w-full max-w-[720px] mx-auto">
                  <form onSubmit={handleSearchSubmit} role="search" className="relative flex items-center h-11 lg:h-12">
                    <Search size={18} strokeWidth={1.75} className="absolute left-4 text-[#A89A78] pointer-events-none" />
                    {localQuery === '' && (
                      <span
                        className="absolute left-11 right-28 flex items-center truncate pointer-events-none text-[13.5px] text-[#9A8B70]"
                        aria-hidden="true"
                      >
                        <span className="truncate">Search for {typedPlaceholder}</span>
                        <span className="ml-0.5 inline-block h-4 w-px bg-[#BEA266] animate-pulse motion-reduce:hidden" />
                      </span>
                    )}
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={localQuery}
                      onChange={handleSearchInput}
                      onFocus={handleSearchFocus}
                      onKeyDown={handleKeyDown}
                      aria-label="Search products"
                      autoComplete="off"
                      className="h-full w-full rounded-full bg-[#17130B] border border-[#2B2416] pl-11 pr-[148px] text-[13.5px] text-[#F3E7C6] placeholder-[#9A8B70] transition-all focus:outline-none focus:bg-black focus:border-[#BEA266] focus:shadow-[0_0_0_4px_rgba(190,162,102,0.18)]"
                    />
                    <div className="absolute right-1.5 flex items-center gap-1">
                      {searchLoadingState && <div className="w-3.5 h-3.5 border-2 border-[#BEA266] border-t-transparent rounded-full animate-spin mr-1" />}
                      {localQuery && (
                        <button
                          type="button"
                          onClick={() => { setLocalQuery(''); dispatch(clearSearch()); dispatch(setDropdownOpen(false)); searchInputRef.current?.focus(); }}
                          className="p-1.5 text-[#9A8B70] hover:text-white transition-colors"
                          aria-label="Clear search"
                        >
                          <X size={15} />
                        </button>
                      )}
                      <button
                        type="submit"
                        className="h-8 lg:h-9 rounded-full bg-[#BEA266] px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black hover:bg-[#DFC481] transition-colors"
                      >
                        Search
                      </button>
                      <button
                        type="button"
                        onClick={closeSearch}
                        className="p-1.5 text-[#F3E7C6] hover:text-white transition-colors"
                        aria-label="Close search"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </form>

                  {/* Autocomplete panel */}
                  <AnimatePresence>
                    {searchDropdownOpenState && localQuery.trim().length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full mt-2 z-[60] rounded-3xl bg-[#0E0C07] border border-[#2B2416] shadow-[0_20px_50px_rgba(42,32,20,0.15)] p-4 max-h-[420px] overflow-y-auto"
                      >
                        {autocompleteSuggestions.length > 0 && (
                          <div className="mb-3">
                            <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A8B70]">Suggestions</p>
                            {autocompleteSuggestions.map((kw, i) => (
                              <button
                                key={kw}
                                type="button"
                                onClick={() => handleKeywordClick(kw)}
                                className={`w-full flex items-center justify-between rounded-full px-3.5 py-2 text-left text-[13px] transition-colors ${
                                  activeIndex === i ? 'bg-white/10 text-[#F3E7C6] font-semibold' : 'text-[#F3E7C6] hover:bg-white/10'
                                }`}
                              >
                                <span className="flex items-center gap-2.5"><Search size={13} className="text-[#9A8B70]" />{kw}</span>
                                <ArrowRight size={13} className="text-[#9A8B70]" />
                              </button>
                            ))}
                          </div>
                        )}

                        {autocompleteProducts.length > 0 && (
                          <div>
                            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9A8B70]">Products</p>
                            <div className="space-y-1">
                              {autocompleteProducts.map(product => (
                                <button
                                  key={product.id || product._id}
                                  type="button"
                                  onClick={() => handleSuggestionClick(product)}
                                  className="group w-full flex items-center gap-3 rounded-2xl p-2 text-left hover:bg-white/10 transition-colors"
                                >
                                  <div className="h-14 w-11 shrink-0 overflow-hidden rounded-xl bg-white/10">
                                    {product.image && <img src={product.image} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-medium text-[#F3E7C6]">{product.name}</p>
                                    <p className="mt-0.5 text-[13px] font-semibold text-[#DFC481]">{formatPrice(product.price, 'INR')}</p>
                                  </div>
                                  <ArrowRight size={14} className="text-[#9A8B70] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {autocompleteSuggestions.length === 0 && autocompleteProducts.length === 0 && !searchLoadingState && (
                          <p className="py-5 text-center text-[13px] text-[#A89A78]">No matches for “{localQuery}”</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Dim page while mega panel is open */}
      <AnimatePresence>
        {megaCat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:block fixed inset-0 z-40 bg-black/50 pointer-events-none"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Menu Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => dispatch(closeMobileMenu())}
              className="lg:hidden fixed inset-0 z-[999] bg-black/70"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed inset-y-0 left-0 z-[1000] flex w-[86%] max-w-[380px] flex-col bg-black text-[#F3E7C6] font-inter border-r border-[#2B2416]"
              role="dialog"
              aria-label="Mobile Navigation"
            >
              {/* Header */}
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#2B2416] px-5">
                <Link to="/" onClick={() => dispatch(closeMobileMenu())} className="flex items-center focus:outline-none" aria-label="Twin A Apparels — Home">
                  <img src="/logo.png" alt="Twin A Apparels Logo" className="h-12 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => dispatch(closeMobileMenu())}
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-[#F3E7C6] hover:bg-white/10 transition-colors focus:outline-none"
                  aria-label="Close menu"
                >
                  <X size={22} strokeWidth={1.75} />
                </button>
              </div>

              {/* Search shortcut */}
              <div className="shrink-0 px-5 pt-4">
                <button
                  type="button"
                  onClick={() => { dispatch(closeMobileMenu()); setSearchOpen(true); }}
                  className="flex h-11 w-full items-center gap-3 rounded-full border border-[#2B2416] bg-[#17130B] px-4 text-[13px] text-[#9A8B70]"
                >
                  <Search size={17} strokeWidth={1.75} />
                  Search products
                </button>
              </div>

              {/* Links */}
              <nav className="flex-1 overflow-y-auto px-5 py-3" aria-label="Mobile">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/products', label: 'Shop All' },
                ].map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => dispatch(closeMobileMenu())}
                    className="flex h-14 items-center border-b border-[#2B2416] text-[13px] font-medium uppercase tracking-[0.16em] text-[#F3E7C6]"
                  >
                    {l.label}
                  </Link>
                ))}

                {/* Categories (expand to show subcategories) */}
                {catItems.map(cat => {
                  const open = mobileOpenCat === cat.key;
                  const hasSubs = cat.subs.length > 0;
                  return (
                    <div key={cat.key} className="border-b border-[#2B2416]">
                      <div className="flex h-14 items-center justify-between">
                        <Link
                          to={cat.to}
                          onClick={() => dispatch(closeMobileMenu())}
                          className="flex-1 text-[13px] font-medium uppercase tracking-[0.16em] text-[#F3E7C6]"
                        >
                          {cat.name}
                        </Link>
                        {hasSubs && (
                          <button
                            type="button"
                            onClick={() => setMobileOpenCat(open ? null : cat.key)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-[#BEA266] hover:bg-white/10"
                            aria-label={`${open ? 'Collapse' : 'Expand'} ${cat.name}`}
                            aria-expanded={open}
                          >
                            <ChevronDown size={18} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>
                      <AnimatePresence initial={false}>
                        {hasSubs && open && (
                          <motion.ul
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden pb-3"
                          >
                            {cat.subs.map(sc => (
                              <li key={sc.slug || sc.id}>
                                <Link
                                  to={`/category/${cat.key}/${sc.slug}`}
                                  onClick={() => dispatch(closeMobileMenu())}
                                  className="flex h-12 items-center gap-3 pl-1 text-[14px] text-[#D9CBA6] hover:text-white"
                                >
                                  {sc.imageUrl ? (
                                    <img src={sc.imageUrl} alt="" loading="lazy" className="h-8 w-8 shrink-0 rounded-full border border-[#BEA266]/40 object-cover" />
                                  ) : (
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#BEA266]/40">
                                      <span className="h-1 w-1 rounded-full bg-[#BEA266]" />
                                    </span>
                                  )}
                                  {sc.name}
                                </Link>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                {[
                  { to: '/about', label: 'About' },
                  { to: '/contact', label: 'Contact' },
                ].map(l => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => dispatch(closeMobileMenu())}
                    className="flex h-14 items-center border-b border-[#2B2416] text-[13px] font-medium uppercase tracking-[0.16em] text-[#F3E7C6]"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* Footer: account · wishlist · bag */}
              <div className="shrink-0 grid grid-cols-3 border-t border-[#2B2416]">
                {[
                  { to: isAuthenticated ? '/account' : '/account?view=login', icon: User, label: isAuthenticated ? 'Account' : 'Sign in' },
                  { to: '/account/wishlist', icon: Heart, label: 'Wishlist', count: wishlistCount },
                  { to: '/cart', icon: ShoppingBag, label: 'Bag', count: cartCount },
                ].map(({ to, icon: Icon, label, count }, i) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => dispatch(closeMobileMenu())}
                    className={`flex h-16 flex-col items-center justify-center gap-1 text-[#F3E7C6] hover:bg-white/5 ${i > 0 ? 'border-l border-[#2B2416]' : ''}`}
                  >
                    <span className="relative">
                      <Icon size={20} strokeWidth={1.6} />
                      {count > 0 && (
                        <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#BEA266] px-1 text-[9px] font-bold text-black">{count}</span>
                      )}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#A89A78]">{label}</span>
                  </Link>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Spacer: always matches the real header height, so page content never slides under the fixed navbar */}
      <div style={{ height: headerH }} aria-hidden="true" />
    </>
  );
};

export default Navbar;