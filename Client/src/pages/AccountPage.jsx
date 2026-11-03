import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Package, Headphones, MessageCircle, LogOut, Edit3 } from 'lucide-react';
import { fetchMyOrders } from '../redux/slices/ordersSlice';
import { logout } from '../redux/slices/authSlice';
import Footer from '../components/Footer';
import { formatPrice, formatOrderAmount } from '../utils/currency';

const STATUS_COLORS = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  PROCESSING: 'bg-purple-50 text-purple-700',
  SHIPPED: 'bg-indigo-50 text-indigo-700',
  DELIVERED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-700',
  RETURNED: 'bg-gray-100 text-gray-600',
};

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'support', label: 'Support', icon: Headphones },
];

const AccountPage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isAuthenticated, customer } = useSelector(s => s.auth);
  const { items: orders, loading } = useSelector(s => s.orders);
  const { code: currencyCode, rate: currencyRate } = useSelector(s => s.currency);

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchMyOrders());
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated) {
    return (
      <main id="main-content">
        <div className="max-w-sm mx-auto px-6 py-24 text-center">
          <User size={48} className="text-brand-light mx-auto mb-4" />
          <h1 className="font-playfair text-2xl font-bold mb-2">Sign in to continue</h1>
          <p className="text-brand-grey mb-6 text-sm">Access your orders, wishlist, personal profile and more.</p>
          <form className="space-y-4 text-left" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-xs font-medium mb-1.5" htmlFor="login-email">Email</label>
              <input type="email" placeholder="your@email.com" className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold" id="login-email" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" htmlFor="login-password">Password</label>
              <input type="password" placeholder="••••••••" className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold" id="login-password" />
            </div>
            <button type="submit" className="btn-primary w-full" id="login-submit">Sign In</button>
          </form>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main id="main-content">
      <div className="max-w-site mx-auto px-4 md:px-8 py-12">
        <h1 className="font-playfair text-3xl font-bold mb-8">My Account</h1>
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="bg-white shadow-sm p-6 text-center mb-4 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-xl">{customer?.name?.[0] || 'U'}</span>
              </div>
              <p className="font-medium">{customer?.name}</p>
              <p className="text-xs text-brand-grey truncate">{customer?.email}</p>
            </div>
            <nav className="bg-white shadow-sm overflow-hidden rounded-lg">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-l-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-gold text-brand-gold bg-brand-light/50 font-medium'
                      : 'border-transparent text-brand-grey hover:bg-brand-light'
                  }`}
                  id={`tab-${tab.id}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
              <button
                onClick={() => dispatch(logout())}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left border-l-2 border-transparent text-red-400 hover:bg-red-50 transition-colors"
                id="logout-btn"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-3"
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white shadow-sm p-6 rounded-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-playfair text-xl font-semibold">Personal Information</h2>
                  <button
                    onClick={() => setEditing(!editing)}
                    className="flex items-center gap-1.5 text-xs text-brand-gold hover:underline font-medium"
                    id="edit-profile"
                  >
                    <Edit3 size={14} /> {editing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', value: customer?.name || '—', field: 'name' },
                    { label: 'Email', value: customer?.email || '—', field: 'email' },
                    { label: 'Phone', value: customer?.phone || 'Not added', field: 'phone' },
                  ].map(({ label, value, field }) => (
                    <div key={field}>
                      <label className="block text-xs text-brand-grey mb-1">{label}</label>
                      {editing ? (
                        <input defaultValue={value} className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" id={`profile-${field}`} aria-label={label} />
                      ) : (
                        <p className="font-medium text-sm">{value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <h2 className="font-playfair text-xl font-semibold mb-5">My Orders</h2>
                {(() => {
                  const validOrders = orders.filter(order => {
                    const isCod = order.paymentMethod === 'COD' || (order.paymentMethod || '').includes('Cash on Delivery');
                    const isPaid = order.paymentStatus === 'PAID' || ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'].includes(order.status);
                    return isPaid || isCod;
                  });
                  return loading ? (
                    <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 w-full" />)}</div>
                  ) : validOrders.length === 0 ? (
                    <div className="bg-white shadow-sm p-12 text-center rounded-lg">
                      <Package size={40} className="text-brand-light mx-auto mb-3" strokeWidth={1} />
                      <p className="font-playfair text-xl mb-2">No orders yet</p>
                      <p className="text-brand-grey text-sm mb-4">Start exploring our curated collections</p>
                      <Link to="/products" className="btn-primary" id="orders-empty-shop">Shop Now</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {validOrders.map(order => (
                        <div key={order.id} className="bg-white shadow-sm p-5 rounded-lg">
                          <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                            <div>
                              <p className="font-medium">Order {order.orderNumber}</p>
                              <p className="text-xs text-brand-grey">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100'}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-brand-grey">{order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}</span>
                            <span className="font-semibold text-brand-gold">{formatOrderAmount(order.totalAmount, order.currency || 'INR')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <div className="bg-white shadow-sm p-6 rounded-lg">
                <h2 className="font-playfair text-xl font-semibold mb-5">Support Tickets</h2>
                <form className="space-y-4 mb-8" onSubmit={e => e.preventDefault()}>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" htmlFor="ticket-subject">Subject</label>
                    <input id="ticket-subject" type="text" placeholder="Issue with my order..." className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" htmlFor="ticket-description">Description</label>
                    <textarea id="ticket-description" rows={4} placeholder="Describe your issue in detail..." className="w-full border border-brand-light px-3 py-2.5 text-sm focus:outline-none focus:border-brand-gold resize-none" />
                  </div>
                  <button type="submit" className="btn-primary" id="ticket-submit">Submit Ticket</button>
                </form>
                <div className="border-t border-brand-light pt-5">
                  <p className="text-sm text-brand-grey">Need immediate help? Chat with us</p>
                  <button className="btn-outline mt-3 flex items-center gap-2" id="open-chat">
                    <MessageCircle size={16} /> Open Live Chat
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default AccountPage;
