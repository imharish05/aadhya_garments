import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Upload,
  Sparkles,
  Info,
  Layers,
  Target,
  MapPin,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { validateImageFile } from '../utils/fileValidation';
import { getImageUrl } from '../utils/imageUrl';

const TABS = [
  { id: 'hero', label: 'Hero & Hang Tags', icon: Sparkles },
  { id: 'who', label: 'Who We Are & Media', icon: Info },
  { id: 'fabrics', label: 'Superior Fabrics', icon: Layers },
  { id: 'mission', label: 'Mission & Values', icon: Target },
  { id: 'contact', label: 'Contact & Office', icon: MapPin },
];

const DEFAULT_SETTINGS = {
  hero: {
    eyebrow: 'About Twin A Apparels',
    title: 'Founded with a passion for style and comfort',
    text: "We are manufacturers and wholesale distributors of high-quality men's wear, kid's wear, shorts, cargo pants, 3/4ths and stylish T-shirts, based in Coimbatore.",
    tags: [
      { kicker: 'We are', title: 'Manufacturers', foot: 'High-quality clothing' },
      { kicker: 'We are', title: 'Wholesale distributors', foot: "Men's, kid's & more" },
      { kicker: 'Based in', title: 'Coimbatore', foot: 'Style · Comfort' },
    ],
  },
  who: {
    title: 'Manufacturers and wholesale distributors',
    text: "High-quality men's wear, kid's wear, shorts, cargo pants, 3/4ths and stylish T-shirts, made and supplied from Coimbatore.",
    imageUrl: '',
  },
  fabrics: {
    title: 'Superior fabrics, chosen with care',
    text: 'We use superior fabrics to ensure durability, comfort, and the latest trends for our customers.',
    list: ['2-way Lycra', 'NS Fabric', 'Loopknit', 'Pure Cotton', 'Muslin'],
  },
  mission:
    'To deliver exceptional clothing that combines **modern fashion** with **unmatched comfort**, while maintaining the **highest standards** of quality and affordability.',
  values: ['Style', 'Comfort', 'Quality', 'Affordability', 'Durability', 'Modern fashion', 'Latest trends'],
  contact: {
    title: 'Get in touch',
    text: "Men's wear, kid's wear and ladies' wear, all in one place.",
    button: 'Contact us',
    to: '/contact',
  },
  office: {
    address: [
      '6/154, 2nd Street, Radhithya Avenue,',
      'Checkpost, Kinathukadavu - Pollachi Main Road,',
      'Coimbatore - 642109',
    ],
    phone: '+91 98765 43210',
    email: 'info@twinaapparels.com',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=6%2F154%2C+2nd+Street%2C+Radhithya+Avenue%2C+Checkpost%2C+Kinathukadavu+-+Pollachi+Main+Road%2C+Coimbatore+-+642109',
  },
};

const SiteSettingsAdminPage = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // New tag/item inputs
  const [newFabric, setNewFabric] = useState('');
  const [newValue, setNewValue] = useState('');

  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Site Settings from backend
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/site-settings/about');
      if (res.data && res.data.success) {
        const d = res.data.data;
        setSettings({
          hero: { ...DEFAULT_SETTINGS.hero, ...(d.hero || {}) },
          who: { ...DEFAULT_SETTINGS.who, ...(d.who || {}) },
          fabrics: {
            title: d.fabrics?.title || DEFAULT_SETTINGS.fabrics.title,
            text: d.fabrics?.text || DEFAULT_SETTINGS.fabrics.text,
            list: d.fabrics?.list?.length ? d.fabrics.list : DEFAULT_SETTINGS.fabrics.list,
          },
          mission: d.mission || DEFAULT_SETTINGS.mission,
          values: d.values?.length ? d.values : DEFAULT_SETTINGS.values,
          contact: { ...DEFAULT_SETTINGS.contact, ...(d.contact || {}) },
          office: {
            ...DEFAULT_SETTINGS.office,
            ...(d.office || {}),
            address: Array.isArray(d.office?.address)
              ? d.office.address
              : (typeof d.office?.address === 'string'
                  ? d.office.address.split('\n').filter(Boolean)
                  : DEFAULT_SETTINGS.office.address),
          },
        });
        setImagePreview(d.who?.imageUrl || '');
      }
    } catch (err) {
      toast.error('Failed to load site settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleImageChange = (eOrFile) => {
    const file = eOrFile instanceof File ? eOrFile : eOrFile.target?.files?.[0];
    if (file) {
      const val = validateImageFile(file, { maxSizeMB: 5 });
      if (!val.isValid) {
        toast.error(val.error);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setSettings((prev) => ({
      ...prev,
      who: { ...prev.who, imageUrl: '' },
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Add/remove fabric
  const handleAddFabric = (e) => {
    e.preventDefault();
    const trimmed = newFabric.trim();
    if (!trimmed) return;
    if (settings.fabrics.list.includes(trimmed)) {
      toast.error('Fabric already in list');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      fabrics: { ...prev.fabrics, list: [...prev.fabrics.list, trimmed] },
    }));
    setNewFabric('');
  };

  const handleRemoveFabric = (fabricToRemove) => {
    if (settings.fabrics.list.length <= 1) {
      toast.error('Keep at least one fabric in the list');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      fabrics: {
        ...prev.fabrics,
        list: prev.fabrics.list.filter((f) => f !== fabricToRemove),
      },
    }));
  };

  // Add/remove value
  const handleAddValue = (e) => {
    e.preventDefault();
    const trimmed = newValue.trim();
    if (!trimmed) return;
    if (settings.values.includes(trimmed)) {
      toast.error('Value already in list');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      values: [...prev.values, trimmed],
    }));
    setNewValue('');
  };

  const handleRemoveValue = (valueToRemove) => {
    if (settings.values.length <= 1) {
      toast.error('Keep at least one core value');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      values: prev.values.filter((v) => v !== valueToRemove),
    }));
  };

  // Hang tag updates
  const handleTagChange = (index, field, value) => {
    const nextTags = [...settings.hero.tags];
    nextTags[index] = { ...nextTags[index], [field]: value };
    setSettings((prev) => ({
      ...prev,
      hero: { ...prev.hero, tags: nextTags },
    }));
  };

  const handleAddTag = () => {
    if (settings.hero.tags.length >= 4) {
      toast.error('Maximum 4 hang tags recommended');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        tags: [
          ...prev.hero.tags,
          { kicker: 'We are', title: 'New Highlight', foot: 'Quality craft' },
        ],
      },
    }));
  };

  const handleRemoveTag = (index) => {
    if (settings.hero.tags.length <= 1) {
      toast.error('Keep at least 1 hang tag');
      return;
    }
    setSettings((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        tags: prev.hero.tags.filter((_, i) => i !== index),
      },
    }));
  };

  // Validation
  const validateForm = () => {
    if (!settings.hero.title?.trim()) {
      toast.error('Hero title is required');
      setActiveTab('hero');
      return false;
    }
    if (!settings.hero.text?.trim()) {
      toast.error('Hero introductory text is required');
      setActiveTab('hero');
      return false;
    }
    if (!settings.who.title?.trim()) {
      toast.error('Who We Are section title is required');
      setActiveTab('who');
      return false;
    }
    if (!settings.who.text?.trim()) {
      toast.error('Who We Are description is required');
      setActiveTab('who');
      return false;
    }
    if (!settings.fabrics.list?.length) {
      toast.error('Add at least one fabric');
      setActiveTab('fabrics');
      return false;
    }
    if (!settings.mission?.trim()) {
      toast.error('Mission statement is required');
      setActiveTab('mission');
      return false;
    }
    if (!settings.values?.length) {
      toast.error('Add at least one core value');
      setActiveTab('mission');
      return false;
    }
    return true;
  };

  // Save Settings
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('data', JSON.stringify(settings));
      if (imageFile) {
        fd.append('image', imageFile);
      }

      const res = await api.post('/site-settings/about', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.success) {
        toast.success('Site settings saved successfully!');
        const savedData = res.data.data;
        setSettings(savedData);
        setImagePreview(savedData.who?.imageUrl || '');
        setImageFile(null);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to save settings';
      toast.error(errMsg);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Site Settings">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="animate-spin text-brand-gold" size={32} />
            <span className="text-sm text-brand-grey">Loading site settings...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Site Settings">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-light shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-brand-gold" />
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
                Brand Content Management
              </span>
            </div>
            <h2 className="text-2xl font-playfair font-bold text-brand-text mt-1">
              About Page & Website Content
            </h2>
            <p className="text-xs text-brand-grey mt-1">
              Configure hero text, hang tags, company narrative, fabrics, mission, and contact information.
            </p>
          </div>

          <a
            href="http://localhost:5173/about"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-brand-gold/30 text-brand-gold hover:bg-amber-50/50 transition-colors w-fit"
          >
            <span>Preview About Page</span>
            <ExternalLink size={14} />
          </a>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-brand-light overflow-x-auto scrollbar-none" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                activeTab === id
                  ? 'border-brand-gold text-brand-gold bg-amber-50/30'
                  : 'border-transparent text-brand-grey hover:text-brand-text hover:bg-neutral-50/50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <AnimatePresence mode="wait">
            {/* ── TAB 1: HERO & HANG TAGS ────────────────────────────────── */}
            {activeTab === 'hero' && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Hero Main Copy */}
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-4">
                  <div className="border-b border-brand-light pb-3">
                    <h3 className="text-base font-semibold text-brand-text">Hero Section Copy</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      Main title and introduction displayed at the top of the About page.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Eyebrow Label
                      </label>
                      <input
                        type="text"
                        value={settings.hero.eyebrow}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, eyebrow: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="About Twin A Apparels"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Hero Main Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.hero.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, title: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="Founded with a passion for style and comfort"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Hero Introductory Description <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={settings.hero.text}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            hero: { ...settings.hero, text: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="We are manufacturers and wholesale distributors of high-quality..."
                      />
                    </div>
                  </div>
                </div>

                {/* Hang Tags Editor */}
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-light pb-3">
                    <div>
                      <h3 className="text-base font-semibold text-brand-text">Hero Hang Tags (Badges)</h3>
                      <p className="text-xs text-brand-grey mt-0.5">
                        Clothing label hang tags dangling from the stitched gold thread.
                      </p>
                    </div>
                    {settings.hero.tags.length < 4 && (
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-amber-50 text-brand-gold rounded-lg hover:bg-amber-100/70 transition-colors"
                      >
                        <Plus size={14} /> Add Tag
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {settings.hero.tags.map((tag, idx) => (
                      <div
                        key={idx}
                        className="border border-brand-light rounded-xl p-4 bg-neutral-50/50 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-brand-gold uppercase tracking-wider">
                            Hang Tag #{idx + 1}
                          </span>
                          {settings.hero.tags.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(idx)}
                              className="text-neutral-400 hover:text-rose-500 p-1 transition-colors"
                              title="Delete tag"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-brand-grey mb-1">
                            Kicker (e.g. We are / Based in)
                          </label>
                          <input
                            type="text"
                            value={tag.kicker}
                            onChange={(e) => handleTagChange(idx, 'kicker', e.target.value)}
                            className="w-full border border-brand-light bg-white px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-brand-gold"
                            placeholder="We are"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-brand-grey mb-1">
                            Tag Title (Main)
                          </label>
                          <input
                            type="text"
                            value={tag.title}
                            onChange={(e) => handleTagChange(idx, 'title', e.target.value)}
                            className="w-full border border-brand-light bg-white px-2.5 py-1.5 rounded-lg text-xs font-medium focus:outline-none focus:border-brand-gold"
                            placeholder="Manufacturers"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-brand-grey mb-1">
                            Footer Note
                          </label>
                          <input
                            type="text"
                            value={tag.foot}
                            onChange={(e) => handleTagChange(idx, 'foot', e.target.value)}
                            className="w-full border border-brand-light bg-white px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-brand-gold"
                            placeholder="High-quality clothing"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB 2: WHO WE ARE & MEDIA ──────────────────────────────── */}
            {activeTab === 'who' && (
              <motion.div
                key="who"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-6">
                  <div className="border-b border-brand-light pb-3">
                    <h3 className="text-base font-semibold text-brand-text">Company Story & Profile</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      Section highlighting who Twin A Apparels is, where we manufacture, and what we distribute.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Section Heading <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={settings.who.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            who: { ...settings.who, title: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="Manufacturers and wholesale distributors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Story & Manufacturing Narrative <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={settings.who.text}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            who: { ...settings.who, text: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold leading-relaxed"
                        placeholder="High-quality men's wear, kid's wear, shorts, cargo pants, 3/4ths and stylish T-shirts, made and supplied from Coimbatore."
                      />
                    </div>
                  </div>

                  {/* Image Upload Area */}
                  <div className="border-t border-brand-light pt-6 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-0.5">
                        Company Banner / Profile Photo (Optional)
                      </label>
                      <p className="text-[11px] text-brand-grey">
                        Displayed in a curved arch frame next to the company story. PNG, JPG, or WebP up to 5MB.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center h-48 cursor-pointer ${
                          isDragging
                            ? 'border-brand-gold bg-amber-50/20 scale-98'
                            : 'border-brand-light hover:border-brand-gold hover:bg-amber-50/10'
                        }`}
                      >
                        <Upload className="w-8 h-8 text-brand-grey mb-2" />
                        <span className="text-xs font-medium text-brand-text">
                          Click to upload or drag & drop
                        </span>
                        <span className="text-[10px] text-brand-grey mt-1">
                          PNG, JPG or WebP (Max 5MB)
                        </span>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <div className="border border-brand-light rounded-2xl h-48 overflow-hidden bg-neutral-50 flex items-center justify-center relative">
                          {imagePreview ? (
                            <>
                              <img
                                src={imagePreview.startsWith('data:') ? imagePreview : getImageUrl(imagePreview)}
                                alt="Company Story Banner Preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-3 right-3 flex items-center gap-2">
                                {imageFile && (
                                  <span className="bg-brand-gold text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
                                    New File Ready
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={removeImage}
                                  className="bg-black/70 hover:bg-rose-600 text-white p-1.5 rounded-full transition-colors"
                                  title="Remove image"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <Info className="mx-auto text-neutral-300 mb-1" size={24} />
                              <span className="text-xs text-brand-grey block">
                                No custom photo uploaded.
                              </span>
                              <span className="text-[10px] text-brand-grey/80">
                                Story section renders clean text-only layout when empty.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB 3: SUPERIOR FABRICS ───────────────────────────────── */}
            {activeTab === 'fabrics' && (
              <motion.div
                key="fabrics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-6">
                  <div className="border-b border-brand-light pb-3">
                    <h3 className="text-base font-semibold text-brand-text">Our Fabrics Showcase</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      Highlight the superior fabrics crafted into garments for durability, comfort, and trends.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={settings.fabrics.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fabrics: { ...settings.fabrics, title: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="Superior fabrics, chosen with care"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Section Subtitle / Description
                      </label>
                      <input
                        type="text"
                        value={settings.fabrics.text}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fabrics: { ...settings.fabrics, text: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="We use superior fabrics to ensure durability, comfort, and the latest trends..."
                      />
                    </div>
                  </div>

                  {/* Fabrics Tag Manager */}
                  <div className="border-t border-brand-light pt-6 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1">
                        Active Fabrics ({settings.fabrics.list.length})
                      </label>
                      <p className="text-[11px] text-brand-grey mb-3">
                        Fabric photos in the client directory automatically map by name (e.g. 2-way Lycra, Loopknit, NS Fabric, Pure Cotton).
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2.5 p-4 rounded-xl bg-neutral-50/70 border border-brand-light min-h-[70px]">
                      {settings.fabrics.list.map((fabric) => (
                        <span
                          key={fabric}
                          className="inline-flex items-center gap-1.5 bg-white border border-brand-gold/40 text-brand-text px-3 py-1.5 rounded-full text-xs font-medium shadow-xs"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-gold" />
                          {fabric}
                          <button
                            type="button"
                            onClick={() => handleRemoveFabric(fabric)}
                            className="text-neutral-400 hover:text-rose-500 ml-1"
                            title={`Remove ${fabric}`}
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 max-w-md pt-1">
                      <input
                        type="text"
                        value={newFabric}
                        onChange={(e) => setNewFabric(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFabric(e);
                          }
                        }}
                        className="flex-1 border border-brand-light px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-brand-gold"
                        placeholder="Add new fabric name (e.g. Linen Blend)..."
                      />
                      <button
                        type="button"
                        onClick={handleAddFabric}
                        className="px-4 py-2 bg-brand-gold text-black rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors inline-flex items-center gap-1"
                      >
                        <Plus size={14} /> Add
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB 4: MISSION & CORE VALUES ──────────────────────────── */}
            {activeTab === 'mission' && (
              <motion.div
                key="mission"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Mission Statement */}
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-4">
                  <div className="border-b border-brand-light pb-3">
                    <h3 className="text-base font-semibold text-brand-text">Mission Statement</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      Core brand philosophy. Wrap phrases in <code className="bg-neutral-100 px-1 py-0.5 rounded text-amber-700 font-mono">**double asterisks**</code> to emphasize them with a gold stitched underline.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                      Mission Text <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={settings.mission}
                      onChange={(e) =>
                        setSettings({ ...settings, mission: e.target.value })
                      }
                      className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold leading-relaxed"
                      placeholder="To deliver exceptional clothing that combines **modern fashion** with **unmatched comfort**..."
                    />
                  </div>

                  {/* Live Highlight Preview */}
                  <div className="p-4 bg-[#FBF7EE] rounded-xl border border-[#BEA266]/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5F28] block mb-1.5">
                      Live Accent Preview
                    </span>
                    <p className="font-playfair text-base sm:text-lg text-black leading-relaxed">
                      {settings.mission.split('**').map((part, i) =>
                        i % 2 === 1 ? (
                          <span
                            key={i}
                            className="font-medium text-[#7A5F28] border-b-2 border-dashed border-[#BEA266] pb-0.5"
                          >
                            {part}
                          </span>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </p>
                  </div>
                </div>

                {/* Core Values */}
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-4">
                  <div className="border-b border-brand-light pb-3">
                    <h3 className="text-base font-semibold text-brand-text">What We Stand For (Garment Label Values)</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      Appears in the stitched garment specification card on the About page.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 p-4 rounded-xl bg-neutral-50/70 border border-brand-light min-h-[70px]">
                    {settings.values.map((val) => (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1.5 bg-white border border-brand-gold/40 text-brand-text px-3 py-1.5 rounded-full text-xs font-medium shadow-xs"
                      >
                        <CheckCircle2 size={13} className="text-brand-gold" />
                        {val}
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(val)}
                          className="text-neutral-400 hover:text-rose-500 ml-1"
                          title={`Remove ${val}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 max-w-md pt-1">
                    <input
                      type="text"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(e);
                        }
                      }}
                      className="flex-1 border border-brand-light px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-brand-gold"
                      placeholder="Add value (e.g. Ethical Sourcing)..."
                    />
                    <button
                      type="button"
                      onClick={handleAddValue}
                      className="px-4 py-2 bg-brand-gold text-black rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TAB 5: CONTACT & OFFICE ────────────────────────────────── */}
            {activeTab === 'contact' && (
              <motion.div
                key="contact"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* CTA Ticket Box */}
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-4">
                  <div className="border-b border-brand-light pb-3">
                    <h3 className="text-base font-semibold text-brand-text">Contact CTA Banner</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      The bottom banner inviting wholesale and retail customers to get in touch.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Banner Heading
                      </label>
                      <input
                        type="text"
                        value={settings.contact.title}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: { ...settings.contact, title: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="Get in touch"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Button Label
                      </label>
                      <input
                        type="text"
                        value={settings.contact.button}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: { ...settings.contact, button: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="Contact us"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Button Link Target
                      </label>
                      <input
                        type="text"
                        value={settings.contact.to}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: { ...settings.contact, to: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="/contact"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Subtext / Description
                      </label>
                      <input
                        type="text"
                        value={settings.contact.text}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            contact: { ...settings.contact, text: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="Men's wear, kid's wear and ladies' wear, all in one place."
                      />
                    </div>
                  </div>
                </div>

                {/* Office & Location Details */}
                <div className="bg-white rounded-2xl border border-brand-light shadow-sm p-6 space-y-4">
                  <div className="border-b border-brand-light pb-3">
                    <h3 className="text-base font-semibold text-brand-text">Office Address & Contacts</h3>
                    <p className="text-xs text-brand-grey mt-0.5">
                      Physical manufacturing and distribution office location.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Address Lines (One line per row)
                      </label>
                      <textarea
                        rows={3}
                        value={
                          Array.isArray(settings.office.address)
                            ? settings.office.address.join('\n')
                            : settings.office.address
                        }
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            office: {
                              ...settings.office,
                              address: e.target.value.split('\n').filter(Boolean),
                            },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold font-mono text-xs leading-relaxed"
                        placeholder="6/154, 2nd Street, Radhithya Avenue,&#10;Checkpost, Kinathukadavu - Pollachi Main Road,&#10;Coimbatore - 642109"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Official Phone
                      </label>
                      <input
                        type="text"
                        value={settings.office.phone}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            office: { ...settings.office, phone: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Official Email
                      </label>
                      <input
                        type="email"
                        value={settings.office.email}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            office: { ...settings.office, email: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="info@twinaapparels.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                        Google Maps Link
                      </label>
                      <input
                        type="text"
                        value={settings.office.mapsUrl}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            office: { ...settings.office, mapsUrl: e.target.value },
                          })
                        }
                        className="w-full border border-brand-light px-3.5 py-2.5 rounded-lg text-sm focus:outline-none focus:border-brand-gold"
                        placeholder="https://www.google.com/maps/..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Save Bar */}
          <div className="bg-white rounded-2xl border border-brand-light p-4 shadow-sm flex items-center justify-between sticky bottom-4 z-10">
            <div className="text-xs text-brand-grey flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Changes reflect immediately on the website upon saving.</span>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-6 py-2.5 font-semibold text-sm shadow-md"
              id="site-settings-save-btn"
            >
              {saving ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  Saving Site Settings...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Site Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default SiteSettingsAdminPage;
