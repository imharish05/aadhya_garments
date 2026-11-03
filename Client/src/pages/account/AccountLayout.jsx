import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { User, MapPin, Package, Heart, Star, Headphones, LogOut, Lock, Mail, Eye, EyeOff, Phone, ArrowLeft, CheckCircle, RefreshCw, MessageSquare, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import Footer from '../../components/Footer';
import { loginCustomer, registerCustomer, logout, clearError, fetchProfile } from '../../redux/slices/authSlice';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';
import { fetchCart, mergeGuestCart } from '../../redux/slices/cartSlice';
import toast from 'react-hot-toast';
import { validatePhoneNumber, validateEmail, validatePassword } from '../../utils/validation';
import PhoneInput from '../../components/PhoneInput';
import api from '../../services/api';

const NAV_ITEMS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/reviews', label: 'My Reviews', icon: MessageSquare },
];

// Auth view states
const VIEW_LOGIN         = 'login';
const VIEW_REGISTER      = 'register';
const VIEW_FORGOT_EMAIL  = 'forgot_email';   // Step 1: enter email
const VIEW_FORGOT_OTP    = 'forgot_otp';     // Step 2: enter 6-digit OTP
const VIEW_FORGOT_RESET  = 'forgot_reset';   // Step 3: set new password

const AccountLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const { isAuthenticated, customer, loading, error } = useSelector(s => s.auth);
  const otpRefs = useRef([]);

  // Auto scroll to top on account route change and refresh customer profile
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [pathname, isAuthenticated, dispatch]);

  // ── Auth form state ─────────────────────────────────────────────────────────
  const [view, setView]             = useState(VIEW_LOGIN);
  const [showPassword, setShowPw]   = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [errors, setErrors]         = useState({});

  // ── Forgot password state ───────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail]         = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotLoading, setForgotLoading]     = useState(false);

  // Step 2 — OTP
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds

  // Step 3 — New password
  const [resetToken, setResetToken]       = useState('');
  const [newPw, setNewPw]                 = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [showNewPw, setShowNewPw]         = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [newPwError, setNewPwError]       = useState('');
  const [confirmPwError, setConfirmPwError] = useState('');
  const [resetLoading, setResetLoading]   = useState(false);

  // Read URL query params for initial view & tab redirects (e.g. /account?tab=orders -> /account/orders)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const emailParam = searchParams.get('email');
    const tabParam = searchParams.get('tab');

    // If authenticated, any auth views (login/register/forgot) should be redirected immediately
    if (isAuthenticated && viewParam) {
      const redirect = searchParams.get('redirect') || searchParams.get('returnUrl');
      if (redirect && redirect.startsWith('/')) {
        navigate(redirect, { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
      return;
    }

    if (viewParam === 'forgot' || viewParam === 'forgot_email') {
      setView(VIEW_FORGOT_EMAIL);
      if (emailParam) setForgotEmail(emailParam);
    } else if (viewParam === 'register') {
      setView(VIEW_REGISTER);
    } else if (viewParam === 'login') {
      setView(VIEW_LOGIN);
    }
    if (tabParam) {
      if (tabParam === 'orders' || tabParam === 'returns' || tabParam === 'refunds') navigate('/account/orders', { replace: true });
      else if (tabParam === 'wishlist') navigate('/account/wishlist', { replace: true });
      else if (tabParam === 'reviews') navigate('/account/reviews', { replace: true });
      else if (tabParam === 'personal-shopper' || tabParam === 'shopper') navigate('/account', { replace: true });
      // else if (tabParam === 'support') navigate('/account/support', { replace: true });
    }
  }, [searchParams, navigate, isAuthenticated]);

  // Clear state when switching views
  useEffect(() => {
    dispatch(clearError());
    setErrors({});
    setEmail(''); setPassword(''); setName(''); setPhone('');
    setShowPw(false);
    if (view === VIEW_FORGOT_EMAIL) {
      setForgotEmailError('');
    }
    if (view === VIEW_FORGOT_OTP) {
      setOtp(['', '', '', '', '', '']); setOtpError('');
    }
    if (view === VIEW_FORGOT_RESET) {
      setNewPw(''); setConfirmPw(''); setNewPwError(''); setConfirmPwError('');
    }
  }, [view, dispatch]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // ── Inline validation ───────────────────────────────────────────────────────
  const onEmailChange = v => {
    setEmail(v);
    if (errors.email) { const r = validateEmail(v); setErrors(p => ({ ...p, email: r.isValid ? '' : r.message })); }
  };
  const onPasswordChange = v => {
    setPassword(v);
    if (errors.password) {
      if (view === VIEW_REGISTER) { const r = validatePassword(v); setErrors(p => ({ ...p, password: r.isValid ? '' : r.message })); }
      else setErrors(p => ({ ...p, password: v ? '' : 'Password is required.' }));
    }
  };
  const onNameChange = v => {
    setName(v);
    if (errors.name) setErrors(p => ({ ...p, name: v.trim() ? '' : 'Full name is required.' }));
  };
  const onPhoneChange = v => {
    setPhone(v);
    if (errors.phone) { const r = validatePhoneNumber(v); setErrors(p => ({ ...p, phone: r.isValid ? '' : r.message })); }
  };

  // ── Login / Register ────────────────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault();
    const errs = {};
    if (view === VIEW_REGISTER) {
      if (!name.trim()) errs.name = 'Full name is required.';
      const ev = validateEmail(email); if (!ev.isValid) errs.email = ev.message;
      const pv = validatePassword(password); if (!pv.isValid) errs.password = pv.message;
      const phv = validatePhoneNumber(phone); if (!phv.isValid) errs.phone = phv.message;
    } else {
      const ev = validateEmail(email); if (!ev.isValid) errs.email = ev.message;
      if (!password) errs.password = 'Password is required.';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    if (view === VIEW_REGISTER) {
      const result = await dispatch(registerCustomer({ name, email, password, phone }));
      if (registerCustomer.fulfilled.match(result)) {
        toast.success(`Welcome to Twin A Apparels, ${result.payload.customer.name}!`);
        dispatch(fetchWishlist());
        dispatch(mergeGuestCart());
        const redirectParam = searchParams.get('redirect') || searchParams.get('returnUrl');
        const targetUrl = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : '/account';
        navigate(targetUrl, { replace: true });
      } else {
        toast.error(result.payload || 'Registration failed.');
      }
    } else {
      const result = await dispatch(loginCustomer({ email, password }));
      if (loginCustomer.fulfilled.match(result)) {
        toast.success(`Welcome back, ${result.payload.customer.name}!`);
        dispatch(fetchWishlist());
        dispatch(mergeGuestCart());
        const redirectParam = searchParams.get('redirect') || searchParams.get('returnUrl');
        const targetUrl = (redirectParam && redirectParam.startsWith('/')) ? redirectParam : '/account';
        navigate(targetUrl, { replace: true });
      } else {
        toast.error(result.payload || 'Invalid email or password.');
      }
    }
  };

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async e => {
    e?.preventDefault();
    const ev = validateEmail(forgotEmail);
    if (!ev.isValid) { setForgotEmailError(ev.message); return; }
    setForgotEmailError('');
    setForgotLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail.trim().toLowerCase() });
      toast.success('OTP sent! Check your inbox.');
      setView(VIEW_FORGOT_OTP);
      setResendCooldown(60); // 60s before resend allowed
    } catch (err) {
      setForgotEmailError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── OTP input handling ──────────────────────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return; // digits only
    const next = [...otp];
    next[idx] = val.slice(-1); // keep only last digit
    setOtp(next);
    setOtpError('');
    // Auto-advance
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    // Auto-submit when all 6 filled
    if (next.every(d => d !== '') && val) handleVerifyOtp(next.join(''));
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = e => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    setOtpError('');
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) handleVerifyOtp(pasted);
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async (otpValue) => {
    const code = otpValue || otp.join('');
    if (code.length < 6) { setOtpError('Please enter all 6 digits.'); return; }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-otp', {
        email: forgotEmail.trim().toLowerCase(),
        otp: code,
      });
      setResetToken(res.data.resetToken);
      toast.success('OTP verified!');
      setView(VIEW_FORGOT_RESET);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP. Please try again.';
      setOtpError(msg);
      // Clear OTP fields on wrong code
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async e => {
    e.preventDefault();
    let valid = true;
    const pv = validatePassword(newPw);
    if (!pv.isValid) { setNewPwError(pv.message); valid = false; }
    else setNewPwError('');
    if (!confirmPw) { setConfirmPwError('Please confirm your new password.'); valid = false; }
    else if (newPw !== confirmPw) { setConfirmPwError('Passwords do not match.'); valid = false; }
    else setConfirmPwError('');
    if (!valid) return;

    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, password: newPw });
      toast.success('Password reset! Please sign in with your new password.');
      setView(VIEW_LOGIN);
    } catch (err) {
      const msg = err.response?.data?.message || 'Session expired. Please start over.';
      toast.error(msg);
      setView(VIEW_FORGOT_EMAIL);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignOut = () => { dispatch(logout()); toast.success('Signed out successfully.'); };

  // ── Unauthenticated UI (Clean & Simple Login / Register) ───────────────────
  if (!isAuthenticated) {
    return (
      <main id="main-content" className="bg-[#FAF9F6] min-h-[85vh] flex items-center justify-center py-16 px-4 sm:px-6">
        <div className="w-full max-w-[430px] bg-white border border-neutral-200/80 p-6 sm:p-8 shadow-sm rounded-2xl">

          {/* ════════════════════════════════════
              FORGOT PASSWORD FLOWS
          ════════════════════════════════════ */}
          {view === VIEW_FORGOT_EMAIL && (
            <>
              <button
                type="button"
                onClick={() => setView(VIEW_LOGIN)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
                id="back-to-login-btn"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
              <div className="mb-6">
                <h1 className="font-playfair text-2xl font-bold text-neutral-900">Forgot password?</h1>
                <p className="text-xs text-neutral-500 mt-1.5">
                  Enter your email address to receive a 6-digit verification code.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5" htmlFor="forgot-email">
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={e => { setForgotEmail(e.target.value); if (forgotEmailError) setForgotEmailError(''); }}
                    placeholder="name@example.com"
                    className={`w-full border ${forgotEmailError ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#BEA266]'} rounded-xl px-4 py-3 text-sm focus:outline-none bg-neutral-50/40 focus:bg-white transition-colors`}
                  />
                  {forgotEmailError && <p className="text-xs text-red-500 mt-1">{forgotEmailError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 rounded-xl bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs uppercase tracking-[0.14em] flex items-center justify-center transition-all shadow-sm"
                  id="send-otp-btn"
                >
                  {forgotLoading ? <div className="h-4 w-4 border-2 border-[#F3E7C6] border-t-transparent rounded-full animate-spin" /> : 'Send OTP Code'}
                </button>
              </form>
            </>
          )}

          {view === VIEW_FORGOT_OTP && (
            <>
              <button
                type="button"
                onClick={() => setView(VIEW_FORGOT_EMAIL)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
                id="back-to-email-btn"
              >
                <ArrowLeft size={14} /> Change email
              </button>
              <div className="mb-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={22} strokeWidth={2} />
                </div>
                <h1 className="font-playfair text-2xl font-bold text-neutral-900">Check your email</h1>
                <p className="text-xs text-neutral-500 mt-1.5">
                  We sent a 6-digit code to <strong className="text-neutral-800 font-semibold">{forgotEmail}</strong>
                </p>
              </div>

              {/* 6-digit OTP boxes */}
              <div className="flex items-center justify-center gap-2 mb-3" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, idx)}
                    onKeyDown={e => handleOtpKeyDown(e, idx)}
                    disabled={otpLoading}
                    className={`w-11 h-12 text-center text-lg font-bold border rounded-xl focus:outline-none transition-all
                      ${otpError ? 'border-red-400 bg-red-50 text-red-700' : digit ? 'border-[#BEA266] bg-[#FAF9F5] text-neutral-900' : 'border-neutral-200 bg-neutral-50/50 text-neutral-900'}
                      ${otpLoading ? 'opacity-50 cursor-not-allowed' : 'focus:border-[#BEA266]'}`}
                    aria-label={`OTP digit ${idx + 1}`}
                    id={`otp-digit-${idx}`}
                  />
                ))}
              </div>

              {otpError && <p className="text-xs text-red-500 text-center mb-3">{otpError}</p>}

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={otpLoading || otp.some(d => !d)}
                className="w-full py-3.5 rounded-xl bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs uppercase tracking-[0.14em] flex items-center justify-center transition-all shadow-sm mt-3"
                id="verify-otp-btn"
              >
                {otpLoading ? <div className="h-4 w-4 border-2 border-[#F3E7C6] border-t-transparent rounded-full animate-spin" /> : 'Verify Code'}
              </button>

              <div className="text-center mt-5">
                {resendCooldown > 0 ? (
                  <p className="text-xs text-neutral-400">Resend code in <span className="font-semibold text-neutral-700">{resendCooldown}s</span></p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={forgotLoading}
                    className="text-xs text-[#996822] hover:underline font-semibold inline-flex items-center gap-1.5"
                    id="resend-otp-btn"
                  >
                    <RefreshCw size={12} />
                    {forgotLoading ? 'Sending…' : 'Resend Code'}
                  </button>
                )}
              </div>
            </>
          )}

          {view === VIEW_FORGOT_RESET && (
            <>
              <div className="mb-6">
                <h1 className="font-playfair text-2xl font-bold text-neutral-900">Set new password</h1>
                <p className="text-xs text-neutral-500 mt-1.5">Choose a secure password for your account.</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5" htmlFor="new-password">New Password</label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNewPw ? 'text' : 'password'}
                      value={newPw}
                      onChange={e => { setNewPw(e.target.value); if (newPwError) { const r = validatePassword(e.target.value); setNewPwError(r.isValid ? '' : r.message); } }}
                      placeholder="Min. 6 characters"
                      className={`w-full border ${newPwError ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#BEA266]'} rounded-xl px-4 pr-10 py-3 text-sm focus:outline-none bg-neutral-50/40 focus:bg-white transition-colors`}
                    />
                    <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600">
                      {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {newPwError && <p className="text-xs text-red-500 mt-1">{newPwError}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5" htmlFor="confirm-password">Confirm New Password</label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPw}
                      onChange={e => { setConfirmPw(e.target.value); if (confirmPwError) setConfirmPwError(e.target.value === newPw ? '' : 'Passwords do not match.'); }}
                      placeholder="Repeat your password"
                      className={`w-full border ${confirmPwError ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#BEA266]'} rounded-xl px-4 pr-10 py-3 text-sm focus:outline-none bg-neutral-50/40 focus:bg-white transition-colors`}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPwError && <p className="text-xs text-red-500 mt-1">{confirmPwError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 rounded-xl bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs uppercase tracking-[0.14em] flex items-center justify-center transition-all shadow-sm mt-2"
                  id="reset-password-btn"
                >
                  {resetLoading ? <div className="h-4 w-4 border-2 border-[#F3E7C6] border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
                </button>
              </form>
            </>
          )}

          {/* ════════════════════════════════════
              LOGIN / REGISTER (Segmented Tabs)
          ════════════════════════════════════ */}
          {(view === VIEW_LOGIN || view === VIEW_REGISTER) && (
            <>
              {/* Clean Brand Header */}
              <div className="text-center mb-6">
                <h1 className="font-playfair text-2xl font-bold text-neutral-900 tracking-tight">
                  {view === VIEW_LOGIN ? 'Welcome back' : 'Create an account'}
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  {view === VIEW_LOGIN
                    ? 'Enter your credentials to access your account'
                    : 'Join to track orders, manage addresses, and save favorites'}
                </p>
              </div>

              {/* Simple Segmented Toggle Switcher */}
              <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setView(VIEW_LOGIN)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    view === VIEW_LOGIN
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  id="tab-sign-in"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setView(VIEW_REGISTER)}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                    view === VIEW_REGISTER
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                  id="tab-register"
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {view === VIEW_REGISTER && (
                  <>
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5" htmlFor="auth-name">
                        Full Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={e => onNameChange(e.target.value)}
                        placeholder="John Doe"
                        className={`w-full border ${errors.name ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#BEA266]'} rounded-xl px-4 py-3 text-sm focus:outline-none bg-neutral-50/40 focus:bg-white transition-colors`}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <PhoneInput
                        id="auth-phone"
                        name="phone"
                        label="Phone Number"
                        value={phone}
                        onChange={(val, meta) => {
                          setPhone(val);
                          if (errors.phone) {
                            setErrors(p => ({ ...p, phone: meta.isValid ? '' : meta.error }));
                          }
                        }}
                        error={errors.phone}
                        required
                        className="w-full"
                        inputClassName="py-3 text-sm rounded-xl"
                      />
                    </div>
                  </>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1.5" htmlFor="auth-email">
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={e => onEmailChange(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full border ${errors.email ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#BEA266]'} rounded-xl px-4 py-3 text-sm focus:outline-none bg-neutral-50/40 focus:bg-white transition-colors`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-neutral-700" htmlFor="auth-password">
                      Password
                    </label>
                    {view === VIEW_LOGIN && (
                      <button
                        type="button"
                        onClick={() => { setForgotEmail(email); setView(VIEW_FORGOT_EMAIL); }}
                        className="text-xs text-[#996822] hover:underline font-medium"
                        id="forgot-password-link"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => onPasswordChange(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full border ${errors.password ? 'border-red-400 focus:border-red-500' : 'border-neutral-200 focus:border-[#BEA266]'} rounded-xl px-4 pr-10 py-3 text-sm focus:outline-none bg-neutral-50/40 focus:bg-white transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPassword)}
                      className="absolute right-3 top-3.5 text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-100">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#17130B] hover:bg-black text-[#F3E7C6] font-semibold text-xs uppercase tracking-[0.14em] flex items-center justify-center transition-all shadow-sm active:scale-[0.99] mt-2"
                  id="auth-submit-btn"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-[#F3E7C6] border-t-transparent rounded-full animate-spin" />
                  ) : view === VIEW_REGISTER ? (
                    'Create Account'
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    );
  }

  // ── Authenticated layout ────────────────────────────────────────────────────
  const { items: wishlistItems } = useSelector(s => s.wishlist);
  const { items: ordersItems } = useSelector(s => s.orders);
  const wishlistCount = (wishlistItems || []).length;
  const ordersCount = (ordersItems || []).length;

  return (
    <main id="main-content">
      <div className="max-w-site mx-auto px-4 md:px-8 py-6 md:py-12">
        {/* Mobile Navigation Header & Horizontal Pill Strip (< md) */}
        <div className="block md:hidden mb-6">
          {/* User Info Bar */}
          <div className="bg-gradient-to-r from-white via-[#FCFAF6] to-white shadow-xs px-3.5 py-3 rounded-2xl border border-neutral-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C1812] to-[#2E271D] text-[#E8D49E] border border-[#C9A24B]/50 flex items-center justify-center flex-shrink-0 shadow-xs">
                <span className="font-playfair font-bold text-xs">{customer?.name?.[0]?.toUpperCase() || 'A'}</span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-xs text-neutral-900 truncate leading-tight">{customer?.name || 'Valued Member'}</p>
                <p className="text-[10px] text-neutral-500 truncate leading-tight">{customer?.email || '—'}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-2.5 py-1 text-[11px] text-red-500 font-semibold hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors flex-shrink-0 border border-red-100"
              id="mobile-account-logout"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>

          {/* Horizontal Nav Pills */}
          <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin mt-2.5 py-1 select-none">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                    isActive
                      ? 'bg-[#17130B] text-[#F3E7C6] border-[#17130B] shadow-xs font-semibold'
                      : 'bg-white text-neutral-600 border-neutral-200/80 hover:bg-neutral-50'
                  }`
                }
                id={`mobile-nav-${label.toLowerCase().replace(/\s.*/, '')}`}
              >
                <Icon size={13} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Layout Wrapper */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar (>= md) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            {/* User Profile Card */}
            <div className="bg-gradient-to-b from-white to-[#FDFBF7] shadow-sm p-6 text-center mb-4 border border-neutral-200/80 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C9A24B] to-transparent opacity-80" />
              <div className="relative inline-block mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1C1812] to-[#2E271D] text-[#E8D49E] border-2 border-[#C9A24B]/40 flex items-center justify-center mx-auto shadow-md ring-4 ring-[#C9A24B]/10">
                  <span className="font-playfair font-bold text-2xl tracking-wide">{customer?.name?.[0]?.toUpperCase() || 'A'}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#17130B] text-[#E5C778] p-1 rounded-full border border-[#C9A24B]/60 shadow-xs" title="Verified Account">
                  <ShieldCheck size={12} strokeWidth={2.5} />
                </div>
              </div>
              <p className="font-semibold text-neutral-900 text-sm tracking-tight truncate">{customer?.name || 'Valued Member'}</p>
              <p className="text-xs text-neutral-500 truncate mt-0.5">{customer?.email || '—'}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF5E8] border border-[#E9D8A6]/60 text-[10px] font-semibold text-[#8B6E22] tracking-wider uppercase">
                <Sparkles size={10} className="text-[#C9A24B]" />
                <span>Verified Client</span>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="bg-white shadow-sm rounded-2xl border border-neutral-200/80 p-2 space-y-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#17130B] text-[#F3E7C6] shadow-sm font-semibold'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
                    }`
                  }
                  id={`account-nav-${label.toLowerCase().replace(/\s.*/, '')}`}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <Icon size={16} strokeWidth={isActive ? 2 : 1.75} className={isActive ? 'text-[#C9A24B]' : 'text-neutral-400'} />
                        <span>{label}</span>
                      </div>
                      {label === 'Wishlist' && wishlistCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-[#C9A24B] text-neutral-950' : 'bg-neutral-100 text-neutral-600'}`}>
                          {wishlistCount}
                        </span>
                      )}
                      {label === 'My Orders' && ordersCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-[#C9A24B] text-neutral-950' : 'bg-neutral-100 text-neutral-600'}`}>
                          {ordersCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}

              <div className="pt-2 mt-2 border-t border-neutral-100">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-medium rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                  id="account-logout"
                >
                  <LogOut size={16} strokeWidth={1.75} />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>

            {/* Concierge Assistance Card */}
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F3EEE3] border border-[#E8DFC8]/60 text-center">
              <p className="text-[11px] font-semibold tracking-wider uppercase text-[#8B6E22]">Client Concierge</p>
              <p className="text-xs text-neutral-600 mt-1">Need assistance with your orders or sizing?</p>
              <a
                href="mailto:support@aadhayagarments.com"
                className="mt-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] font-bold text-neutral-900 bg-white hover:bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200/80 shadow-2xs transition-all w-full"
              >
                <Mail size={12} className="text-[#C9A24B]" /> Contact Support
              </a>
            </div>
          </aside>
          <div className="flex-1 min-w-0"><Outlet /></div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default AccountLayout;