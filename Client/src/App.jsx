import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import Preloader from './components/Preloader';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import QuickViewModal from './components/QuickViewModal';
import RegisterPopup from './components/RegisterPopup';
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import AccountLayout from './pages/account/AccountLayout';
import ProfilePage from './pages/account/ProfilePage';
import SavedAddressesPage from './pages/account/SavedAddressesPage';
import OrdersPage from './pages/account/OrdersPage';
import OrderDetailPage from './pages/account/OrderDetailPage';
import ReturnDetailPage from './pages/account/ReturnDetailPage';
import WishlistPage from './pages/account/WishlistPage';
import LoyaltyPage from './pages/account/LoyaltyPage';
import PersonalShopperPage from './pages/account/PersonalShopperPage';
import SupportPage from './pages/account/SupportPage';
import MyReviewsPage from './pages/account/MyReviewsPage';
import ReturnsRefundsPage from './pages/account/ReturnsRefundsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoaderPreviewPage from './pages/LoaderPreviewPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ShippingPage from './pages/ShippingPage';
import CancellationPage from './pages/CancellationPage';
import ReturnsPage from './pages/ReturnsPage';
import api from './services/api';
import { fetchProfile } from './redux/slices/authSlice';
import { fetchWishlist } from './redux/slices/wishlistSlice';
import { fetchCart } from './redux/slices/cartSlice';

import { getAccessToken } from './utils/tokenStorage';

const App = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(s => s.auth);
  const [initialLoading, setInitialLoading] = useState(true);

  // ── Bootstrap: fetch profile whenever a token exists ────────────────────────
  // Runs once on mount. If a token is in localStorage, call /getme to load
  // fresh customer data into Redux — covers page refresh, new tab, etc.
  // ── Bootstrap: fetch profile, wishlist & cart whenever a token exists ───────
  useEffect(() => {
    if (getAccessToken()) {
      dispatch(fetchProfile());
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    }
  }, [dispatch]);






  return (
    <>
      {initialLoading && (
        <Preloader
          minimumDuration={1600}
          onFinish={() => setInitialLoading(false)}
        />
      )}
      <ScrollToTop />
      <Navbar />
      {/* <CartDrawer /> */}
      <QuickViewModal />
      <RegisterPopup />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'Montserrat, sans-serif', fontSize: 14, borderRadius: 0, border: '1px solid #F0EEE8' },
          success: { iconTheme: { primary: '#C9A24B', secondary: 'white' } },
        }}
      />
      {/* Page fade transitions — Framer Motion */}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/category/:slug" element={<ProductListingPage />} />
          <Route path="/category/:slug/:sub" element={<ProductListingPage />} />
          <Route path="/products/:slug" element={<ProductDetailsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
           <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
          <Route path="/loader-preview" element={<LoaderPreviewPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/terms-and-conditions" element={<Navigate to="/terms" replace />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/cancellation" element={<CancellationPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/login" element={<Navigate to={isAuthenticated ? "/account" : "/account?view=login"} replace />} />
          <Route path="/signin" element={<Navigate to={isAuthenticated ? "/account" : "/account?view=login"} replace />} />
          <Route path="/sign-in" element={<Navigate to={isAuthenticated ? "/account" : "/account?view=login"} replace />} />
          <Route path="/register" element={<Navigate to={isAuthenticated ? "/account" : "/account?view=register"} replace />} />
          <Route path="/signup" element={<Navigate to={isAuthenticated ? "/account" : "/account?view=register"} replace />} />
          <Route path="/sign-up" element={<Navigate to={isAuthenticated ? "/account" : "/account?view=register"} replace />} />
          <Route path="/forgot-password" element={<Navigate to={isAuthenticated ? "/account" : "/account?view=forgot"} replace />} />
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="addresses" element={<SavedAddressesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="orders/:orderId/returns/:id" element={<ReturnDetailPage />} />
            <Route path="returns/:id" element={<ReturnDetailPage />} />
            <Route path="returns" element={<Navigate to="/account/orders" replace />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="personal-shopper" element={<PersonalShopperPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="reviews" element={<MyReviewsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;