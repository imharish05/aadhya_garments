import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Edit3, Save, X, Lock, Key, Eye, EyeOff, User, ShieldCheck, CheckCircle2,
  Mail, Phone, Calendar, Package, Heart, MapPin, ArrowRight, Sparkles, Shield
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { updateProfile } from '../../redux/slices/authSlice';
import { fetchMyOrders } from '../../redux/slices/ordersSlice';
import { fetchWishlist } from '../../redux/slices/wishlistSlice';
import api from '../../services/api';
import { validatePassword, validatePhoneNumber } from '../../utils/validation';
import PhoneInput from '../../components/PhoneInput';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const { customer, profileLoading } = useSelector(s => s.auth);
  const { items: orders } = useSelector(s => s.orders);
  const { items: wishlist } = useSelector(s => s.wishlist);

  const [addressCount, setAddressCount] = useState(0);

  // Fetch counts on mount
  useEffect(() => {
    dispatch(fetchMyOrders());
    dispatch(fetchWishlist());

    api.get('/customers/addresses')
      .then(res => {
        if (res.data?.addresses) {
          setAddressCount(res.data.addresses.length);
        }
      })
      .catch(() => {});
  }, [dispatch]);

  // Count valid orders
  const validOrdersCount = (orders || []).filter(order => {
    const isCod = order.paymentMethod === 'COD' || (order.paymentMethod || '').includes('Cash on Delivery');
    const isPaid = order.paymentStatus === 'PAID' || ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.status);
    return isPaid || isCod;
  }).length;

  const wishlistCount = (wishlist || []).length;

  // ── Profile Edit State ───────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
  });

  const startEdit = () => {
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setForm({
      name: customer?.name || '',
      phone: customer?.phone || '',
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    if (form.phone && form.phone.trim()) {
      const phoneVal = validatePhoneNumber(form.phone, { required: false });
      if (!phoneVal.isValid) {
        toast.error(phoneVal.message);
        return;
      }
    }
    const result = await dispatch(updateProfile({ name: form.name.trim(), phone: form.phone ? form.phone.trim() : '' }));
    if (updateProfile.fulfilled.match(result)) {
      toast.success('Profile updated successfully.');
      setEditing(false);
    } else {
      toast.error(result.payload || 'Failed to update profile.');
    }
  };

  // ── Password Change State ───────────────────────────────────────────────────
  const [showChangePw, setShowChangePw]       = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw]     = useState(false);
  const [showNewPw, setShowNewPw]             = useState(false);
  const [showConfirmPw, setShowConfirmPw]     = useState(false);
  const [changePwLoading, setChangePwLoading] = useState(false);
  const [changeErrors, setChangeErrors]       = useState({});

  const resetPasswordForm = () => {
    setShowChangePw(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setChangeErrors({});
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    const pv = validatePassword(newPassword);
    if (!pv.isValid) {
      errors.newPassword = pv.message;
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setChangeErrors(errors);
      return;
    }

    setChangeErrors({});
    setChangePwLoading(true);

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        toast.success('Password updated successfully!');
        resetPasswordForm();
      } else {
        toast.error(res.data.message || 'Failed to update password.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password. Please check your current password.';
      toast.error(msg);
      if (msg.toLowerCase().includes('current password')) {
        setChangeErrors({ currentPassword: msg });
      }
    } finally {
      setChangePwLoading(false);
    }
  };

  // Display fallback values safely
  const display = {
    name: customer?.name || '—',
    email: customer?.email || '—',
    phone: customer?.phone || 'Not added',
    memberSince: customer?.createdAt
      ? new Date(customer.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full space-y-6">
      {/* ══════════════════════════════════════════════════════════════
          1. Luxury Hero Header & Account Status Card
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16130E] via-[#211B13] to-[#120F0B] text-white p-6 sm:p-8 shadow-md border border-[#C9A24B]/30">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#C9A24B]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-48 h-48 rounded-full bg-[#E5C778]/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#2C2418] to-[#3D3321] border-2 border-[#C9A24B]/60 flex items-center justify-center shadow-lg ring-4 ring-[#C9A24B]/15">
                <span className="font-playfair text-2xl sm:text-3xl font-bold text-[#EEDAA2]">
                  {customer?.name?.[0]?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#17130B] text-[#C9A24B] p-1.5 rounded-full border border-[#C9A24B]/60 shadow-sm" title="Verified Account">
                <ShieldCheck size={14} strokeWidth={2.5} />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF5E8]/10 border border-[#C9A24B]/30 text-[10px] sm:text-xs font-semibold text-[#D4B366] tracking-wider uppercase mb-1.5 backdrop-blur-xs">
                <Sparkles size={11} className="text-[#C9A24B]" />
                <span>Verified Client</span>
              </div>
              <h1 className="font-playfair text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
                {customer?.name ? `Hello, ${customer.name}` : 'Welcome back'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300/80 mt-1">
                {customer?.email} &bull; Member since {display.memberSince}
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
            <Link
              to="/account/orders"
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C9A24B]/50 transition-all rounded-xl p-3 text-center min-w-[76px] sm:min-w-[90px] group"
              id="stat-orders"
            >
              <Package size={16} className="mx-auto text-[#D4B366] mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-base sm:text-lg text-white">{validOrdersCount}</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Orders</div>
            </Link>

            <Link
              to="/account/wishlist"
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C9A24B]/50 transition-all rounded-xl p-3 text-center min-w-[76px] sm:min-w-[90px] group"
              id="stat-wishlist"
            >
              <Heart size={16} className="mx-auto text-[#D4B366] mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-base sm:text-lg text-white">{wishlistCount}</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Wishlist</div>
            </Link>

            <Link
              to="/account/addresses"
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C9A24B]/50 transition-all rounded-xl p-3 text-center min-w-[76px] sm:min-w-[90px] group"
              id="stat-addresses"
            >
              <MapPin size={16} className="mx-auto text-[#D4B366] mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-base sm:text-lg text-white">{addressCount}</div>
              <div className="text-[10px] text-neutral-400 uppercase tracking-wider">Addresses</div>
            </Link>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. Personal Information Card
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
          <div>
            <h2 className="font-playfair text-base sm:text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <User size={18} className="text-[#C9A24B]" /> Personal Information
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Your contact details used for account notifications and delivery orders.
            </p>
          </div>

          {editing ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={cancelEdit}
                disabled={profileLoading}
                className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all flex items-center gap-1.5"
                id="cancel-profile-btn"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={profileLoading}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl bg-[#17130B] text-[#F3E7C6] hover:bg-black transition-all flex items-center gap-1.5 shadow-xs"
                id="save-profile-btn"
              >
                {profileLoading
                  ? <div className="h-3.5 w-3.5 border-2 border-[#F3E7C6] border-t-transparent rounded-full animate-spin" />
                  : <Save size={13} />}
                {profileLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border border-neutral-800 text-neutral-900 hover:bg-[#17130B] hover:text-[#F3E7C6] transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
              id="edit-profile-btn"
            >
              <Edit3 size={13} /> Edit Profile
            </button>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Full Name */}
          <div className="bg-neutral-50/60 rounded-xl p-4 border border-neutral-200/60">
            <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1.5">
              <User size={14} className="text-[#C9A24B]" />
              <span>Full Name</span>
            </div>
            {editing ? (
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-neutral-300 px-3.5 py-2 text-sm focus:outline-none focus:border-[#C9A24B] focus:ring-1 focus:ring-[#C9A24B] rounded-lg bg-white transition-all"
                id="profile-name"
                aria-label="Full Name"
              />
            ) : (
              <p className="font-semibold text-sm text-neutral-900 break-words">{display.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="bg-neutral-50/60 rounded-xl p-4 border border-neutral-200/60">
            <div className="flex items-center justify-between text-neutral-500 text-xs font-medium mb-1.5">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#C9A24B]" />
                <span>Email Address</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 size={10} /> Verified
              </span>
            </div>
            <p className="font-semibold text-sm text-neutral-900 break-all">{display.email}</p>
            <p className="text-[11px] text-neutral-400 mt-1">Primary communication email</p>
          </div>

          {/* Phone Number */}
          <div className="bg-neutral-50/60 rounded-xl p-4 border border-neutral-200/60">
            <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1.5">
              <Phone size={14} className="text-[#C9A24B]" />
              <span>Phone Number</span>
            </div>
            {editing ? (
              <PhoneInput
                id="profile-phone"
                name="phone"
                value={form.phone}
                onChange={(val) => setForm(f => ({ ...f, phone: val }))}
                className="w-full"
                inputClassName="py-2 text-sm rounded-lg"
              />
            ) : (
              <p className="font-semibold text-sm text-neutral-900 break-words">{display.phone}</p>
            )}
          </div>

          {/* Member Since */}
          <div className="bg-neutral-50/60 rounded-xl p-4 border border-neutral-200/60">
            <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium mb-1.5">
              <Calendar size={14} className="text-[#C9A24B]" />
              <span>Membership Date</span>
            </div>
            <p className="font-semibold text-sm text-neutral-900">{display.memberSince}</p>
            <p className="text-[11px] text-neutral-400 mt-1">Twin A Apparels client registry</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. Security & Password Card
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-5">
          <div>
            <h2 className="font-playfair text-base sm:text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Lock size={18} className="text-[#C9A24B]" /> Security & Authentication
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Manage your password and keep your credentials secure.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowChangePw(!showChangePw);
              if (showChangePw) resetPasswordForm();
            }}
            className="text-xs font-semibold uppercase tracking-wider text-[#967727] hover:text-[#7A5F1C] hover:underline flex items-center gap-1.5 shrink-0"
            id="profile-change-password-trigger"
          >
            <Key size={13} /> {showChangePw ? 'Close' : 'Change Password'}
          </button>
        </div>

        {!showChangePw ? (
          <div className="bg-neutral-50/60 rounded-xl p-4 border border-neutral-200/60 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs font-medium text-neutral-500 block mb-0.5">Account Password</span>
              <span className="text-sm font-semibold tracking-widest text-neutral-800">••••••••••••</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Secure & Protected
              </span>
            </div>
          </div>
        ) : (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleChangePassword}
            className="space-y-4 pt-2"
            noValidate
          >
            <div className="grid sm:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs text-neutral-700 mb-1.5 font-medium" htmlFor="profile-current-password">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value);
                      if (changeErrors.currentPassword) setChangeErrors(p => ({ ...p, currentPassword: '' }));
                    }}
                    placeholder="••••••••"
                    className={`w-full border ${changeErrors.currentPassword ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-[#C9A24B]'} px-3.5 py-2.5 pr-9 text-sm rounded-xl focus:outline-none bg-neutral-50/40`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-neutral-600"
                    aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {changeErrors.currentPassword && (
                  <p className="text-xs text-red-500 mt-1">{changeErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs text-neutral-700 mb-1.5 font-medium" htmlFor="profile-new-password">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      if (changeErrors.newPassword) {
                        const v = validatePassword(e.target.value);
                        setChangeErrors(p => ({ ...p, newPassword: v.isValid ? '' : v.message }));
                      }
                    }}
                    placeholder="Min. 6 characters"
                    className={`w-full border ${changeErrors.newPassword ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-[#C9A24B]'} px-3.5 py-2.5 pr-9 text-sm rounded-xl focus:outline-none bg-neutral-50/40`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-neutral-600"
                    aria-label={showNewPw ? 'Hide password' : 'Show password'}
                  >
                    {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {changeErrors.newPassword && (
                  <p className="text-xs text-red-500 mt-1">{changeErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs text-neutral-700 mb-1.5 font-medium" htmlFor="profile-confirm-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-confirm-password"
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (changeErrors.confirmPassword) {
                        setChangeErrors(p => ({ ...p, confirmPassword: e.target.value === newPassword ? '' : 'Passwords do not match.' }));
                      }
                    }}
                    placeholder="Repeat new password"
                    className={`w-full border ${changeErrors.confirmPassword ? 'border-red-400 focus:border-red-500' : 'border-neutral-300 focus:border-[#C9A24B]'} px-3.5 py-2.5 pr-9 text-sm rounded-xl focus:outline-none bg-neutral-50/40`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-2.5 top-3 text-neutral-400 hover:text-neutral-600"
                    aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {changeErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{changeErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={resetPasswordForm}
                disabled={changePwLoading}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-all flex items-center justify-center gap-1.5"
                id="cancel-change-pw-btn"
              >
                <X size={13} /> Cancel
              </button>
              <button
                type="submit"
                disabled={changePwLoading}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl bg-[#17130B] text-[#F3E7C6] hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-xs"
                id="save-change-pw-btn"
              >
                {changePwLoading ? (
                  <div className="h-3.5 w-3.5 border-2 border-[#F3E7C6] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                {changePwLoading ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </motion.form>
        )}

        <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2 text-[11px] text-neutral-400">
          <Shield size={13} className="text-[#C9A24B]" />
          <span>Encrypted with industry-standard 256-Bit SSL protocols. Your personal credentials are never shared.</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. Quick Shortcuts & Portal Highlights
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/account/orders"
          className="group p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-[#C9A24B] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          id="quick-link-orders"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#FAF5E8] text-[#8B6E22] border border-[#E9D8A6]/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Package size={18} />
            </div>
            <h3 className="font-playfair font-bold text-neutral-900 text-sm">My Orders</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Track live shipments, download tax invoices, and initiate easy returns.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#8B6E22] group-hover:translate-x-1 transition-transform">
            <span>View Orders</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        <Link
          to="/account/wishlist"
          className="group p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-[#C9A24B] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          id="quick-link-wishlist"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#FAF5E8] text-[#8B6E22] border border-[#E9D8A6]/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Heart size={18} />
            </div>
            <h3 className="font-playfair font-bold text-neutral-900 text-sm">Saved Wishlist</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Revisit your favorite couture designs and receive instant stock alerts.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#8B6E22] group-hover:translate-x-1 transition-transform">
            <span>View Wishlist</span>
            <ArrowRight size={13} />
          </div>
        </Link>

        <Link
          to="/account/addresses"
          className="group p-5 rounded-2xl bg-white border border-neutral-200/80 hover:border-[#C9A24B] shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          id="quick-link-addresses"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#FAF5E8] text-[#8B6E22] border border-[#E9D8A6]/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <MapPin size={18} />
            </div>
            <h3 className="font-playfair font-bold text-neutral-900 text-sm">Saved Addresses</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Maintain delivery destinations and contact names for instant checkout.
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#8B6E22] group-hover:translate-x-1 transition-transform">
            <span>Manage Addresses</span>
            <ArrowRight size={13} />
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

export default ProfilePage;
