import { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Clock, Edit2, Trash2, X, Upload, RefreshCw, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Switch from '../components/Switch';
import api from '../services/api';
import toast from 'react-hot-toast';
import { checkPermission } from '../utils/rbac';
import { getImageUrl } from '../utils/imageUrl';

const formatDatetimeLocal = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const checkImageDimensions = (fileOrUrl) => {
  return new Promise((resolve) => {
    if (!fileOrUrl) { resolve(null); return; }
    const img = new Image();
    if (typeof fileOrUrl === 'string') {
      img.crossOrigin = 'anonymous';
      img.src = fileOrUrl;
    } else if (fileOrUrl instanceof File) {
      img.src = URL.createObjectURL(fileOrUrl);
    } else {
      resolve(null);
      return;
    }
    img.onload = () => {
      if (fileOrUrl instanceof File) URL.revokeObjectURL(img.src);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      if (fileOrUrl instanceof File) URL.revokeObjectURL(img.src);
      resolve(null);
    };
  });
};

// Specifications for reference & validation (matching Client homepage order)
const BANNER_SPECS = {
  HERO: {
    label: 'HERO',
    recommended: '1920 × 1080 px',
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    aspectLabel: '16:9 Landscape - Full-width hero slider',
  },
  COUNTDOWN: {
    label: 'COUNTDOWN',
    recommended: '800 × 800 px',
    width: 800,
    height: 800,
    aspectRatio: 1.0,
    aspectLabel: '1:1 Square Fit',
  },
  EXCLUSIVE_DEAL: {
    label: 'EXCLUSIVE DEAL',
    recommended: '1920 × 1080 px',
    width: 1920,
    height: 1080,
    aspectRatio: 16 / 9,
    aspectLabel: '16:9 Landscape - Exclusive collection banner',
  },
  PROMO: {
    label: 'PROMO',
    recommended: '1200 × 800 px',
    width: 1200,
    height: 800,
    aspectRatio: 3 / 2,
    aspectLabel: '3:2 Landscape - Promo offer banner',
  },
  ABOUT: {
    label: 'ABOUT',
    recommended: '1200 × 1400 px',
    width: 1200,
    height: 1400,
    aspectRatio: 6 / 7,
    aspectLabel: 'Portrait / Editorial - Our Story section',
  },
};

const validateBannerImageDimensions = (dims, bannerType, file = null) => {
  if (file && file.size > 5 * 1024 * 1024) {
    return {
      isValid: false,
      message: `File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed file size is 5MB.`
    };
  }

  if (!dims) return { isValid: true, message: null };
  const spec = BANNER_SPECS[bannerType];
  if (!spec) return { isValid: true, message: null };

  const { width, height } = dims;
  const actualRatio = width / height;
  const targetRatio = spec.aspectRatio;

  // Allow aspect ratio tolerance of ±0.08 (e.g. 1.70 to 1.85 for 16:9)
  const ratioDiff = Math.abs(actualRatio - targetRatio);
  const allowedTolerance = bannerType === 'COUNTDOWN' ? 0.35 : 0.08;
  const isRatioValid = ratioDiff <= allowedTolerance;

  // Verify minimum size (at least 40% of recommended dimensions)
  const minWidth = bannerType === 'COUNTDOWN' ? 250 : Math.round(spec.width * 0.4);
  const minHeight = bannerType === 'COUNTDOWN' ? 250 : Math.round(spec.height * 0.4);
  const isSizeValid = width >= minWidth && height >= minHeight;

  if (!isRatioValid || !isSizeValid) {
    let reason = '';
    if (!isRatioValid) {
      reason = `Aspect ratio mismatch (Current: ${actualRatio.toFixed(2)}, Recommended: ${targetRatio.toFixed(2)})`;
    } else {
      reason = `Image resolution too low (${width}×${height} px, minimum required: ${minWidth}×${minHeight} px)`;
    }

    return {
      isValid: false,
      message: `Image dimensions (${width} × ${height} px) do not match recommended dimensions for ${spec.label}. Recommended size is ${spec.recommended} (${spec.aspectLabel}, max 5MB). ${reason}`
    };
  }

  return { isValid: true, message: null };
};

// Word & Character limits for Banner content fields
const BANNER_LIMITS = {
  title: { maxChars: 60, maxWords: 10, label: 'Title' },
  subtitle: { maxChars: 95, maxWords: 14, label: 'Subtitle' },
  badgeText: { maxChars: 25, maxWords: 4, label: 'Badge Text' },
  ctaText: { maxChars: 25, maxWords: 3, label: 'CTA Button Text' },
  ctaLink: { maxChars: 255, label: 'CTA Link' },
};

const countWords = (text) => {
  if (!text || typeof text !== 'string') return 0;
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
};

const renderFieldCounter = (value, config) => {
  const str = value || '';
  const charCount = str.length;
  const wordCount = countWords(str);
  const isCharOver = charCount > config.maxChars;
  const isWordOver = config.maxWords && wordCount > config.maxWords;
  const isNearLimit = (config.maxChars && charCount >= config.maxChars * 0.85) || (config.maxWords && wordCount >= config.maxWords);

  let textColor = 'text-brand-grey/70';
  if (isCharOver || isWordOver) textColor = 'text-red-500 font-semibold';
  else if (isNearLimit) textColor = 'text-amber-600 font-medium';

  return (
    <span className={`text-[11px] font-mono tracking-tight ${textColor}`}>
      {config.maxWords ? `${wordCount}/${config.maxWords} words · ` : ''}{charCount}/{config.maxChars} chars
    </span>
  );
};

const BannersAdminPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Hero');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageDims, setImageDims] = useState(null);
  const [dimValidation, setDimValidation] = useState({ isValid: true, message: null });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', subtitle: '', type: 'HERO', ctaText: '', ctaLink: '',
    position: 1, isActive: true, badgeText: '', countdown: '',
  });

  useEffect(() => {
    const source = imageFile || imagePreview;
    if (!source || !modalOpen) {
      setImageDims(null);
      setDimValidation({ isValid: true, message: null });
      return;
    }
    checkImageDimensions(source).then(dims => {
      setImageDims(dims);
      if (dims) {
        const val = validateBannerImageDimensions(dims, form.type, imageFile);
        setDimValidation(val);
        if (!val.isValid) {
          setUploadError(val.message);
        } else {
          setUploadError(prev => (prev && (prev.includes('Recommended') || prev.includes('dimensions') || prev.includes('File size') || prev.includes('5MB')) ? null : prev));
        }
      } else {
        setDimValidation({ isValid: true, message: null });
      }
    });
  }, [imageFile, imagePreview, modalOpen, form.type]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners?all=true');
      setBanners(res.data.banners || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openModal = (b = null) => {
    let defaultType = (activeTab === 'Offers & Countdown' || activeTab === 'Countdown') ? 'COUNTDOWN' : 'HERO';
    setEditing(b);
    setUploadProgress(null);
    setUploadError(null);
    setImagePreview(b?.image || null);
    setImageFile(null);
    setImageDims(null);
    setIsDragging(false);
    setForm(b
      ? {
          title: b.title || '',
          subtitle: b.subtitle || '',
          type: b.type || 'HERO',
          ctaText: b.ctaText || '',
          ctaLink: b.ctaLink || '',
          position: b.position !== undefined ? b.position : 1,
          isActive: b.isActive !== false,
          badgeText: b.badgeText || '',
          countdown: b.countdown ? formatDatetimeLocal(b.countdown) : ''
        }
      : { title: '', subtitle: '', type: defaultType, ctaText: '', ctaLink: '', position: 1, isActive: true, badgeText: '', countdown: '' }
    );
    setModalOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (eOrFile) => {
    const file = eOrFile instanceof File ? eOrFile : eOrFile.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      const errMsg = `File size exceeds 5MB limit. Your image is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
      setDimValidation({
        isValid: false,
        message: errMsg
      });
      setUploadError(errMsg);
      return;
    }
    setUploadError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleTypeChange = (newType) => {
    setForm(p => ({ ...p, type: newType }));
    if (imageDims) {
      const val = validateBannerImageDimensions(imageDims, newType, imageFile);
      setDimValidation(val);
      if (!val.isValid) {
        setUploadError(val.message);
      } else {
        setUploadError(prev => (prev && (prev.includes('dimensions') || prev.includes('Recommended') || prev.includes('File size') || prev.includes('5MB')) ? null : prev));
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setUploadProgress(0);
    setUploadError(null);

    // Image dimension & size validation check
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      const errMsg = `File size exceeds 5MB limit. Your image is ${(imageFile.size / (1024 * 1024)).toFixed(1)}MB.`;
      setDimValidation({ isValid: false, message: errMsg });
      setUploadError(errMsg);
      setSaving(false); setUploadProgress(null); return;
    }

    if (imageDims) {
      const val = validateBannerImageDimensions(imageDims, form.type, imageFile);
      setDimValidation(val);
      if (!val.isValid) {
        setUploadError(val.message);
        setSaving(false); setUploadProgress(null); return;
      }
    }

    // Form validations
    if (form.type === 'HERO') {
      if (!form.ctaLink?.trim()) {
        setUploadError('CTA Link is required for Hero banners.');
        setSaving(false); setUploadProgress(null); return;
      }
    }

    if (form.type === 'COUNTDOWN') {
      if (!form.title?.trim()) {
        setUploadError('Title is required for Countdown / Offer banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.subtitle?.trim()) {
        setUploadError('Subtitle is required for Countdown / Offer banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.ctaText?.trim()) {
        setUploadError('CTA Button Text is required for Countdown / Offer banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.ctaLink?.trim()) {
        setUploadError('CTA Link is required for Countdown / Offer banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.badgeText?.trim()) {
        setUploadError('Badge Text is required for Countdown / Offer banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (!form.countdown) {
        setUploadError('Offer Ends At date & time is required for Countdown / Offer banner.');
        setSaving(false); setUploadProgress(null); return;
      }
      if (new Date(form.countdown).getTime() <= Date.now()) {
        setUploadError('Offer Ends At date & time must be in the future.');
        setSaving(false); setUploadProgress(null); return;
      }
    }

    // Word and character limits validation
    if (form.title && countWords(form.title) > BANNER_LIMITS.title.maxWords) {
      setUploadError(`Title cannot exceed ${BANNER_LIMITS.title.maxWords} words (currently ${countWords(form.title)} words).`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.title && form.title.length > BANNER_LIMITS.title.maxChars) {
      setUploadError(`Title cannot exceed ${BANNER_LIMITS.title.maxChars} characters.`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.subtitle && countWords(form.subtitle) > BANNER_LIMITS.subtitle.maxWords) {
      setUploadError(`Subtitle cannot exceed ${BANNER_LIMITS.subtitle.maxWords} words (currently ${countWords(form.subtitle)} words).`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.subtitle && form.subtitle.length > BANNER_LIMITS.subtitle.maxChars) {
      setUploadError(`Subtitle cannot exceed ${BANNER_LIMITS.subtitle.maxChars} characters.`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.badgeText && countWords(form.badgeText) > BANNER_LIMITS.badgeText.maxWords) {
      setUploadError(`Badge text cannot exceed ${BANNER_LIMITS.badgeText.maxWords} words (currently ${countWords(form.badgeText)} words).`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.badgeText && form.badgeText.length > BANNER_LIMITS.badgeText.maxChars) {
      setUploadError(`Badge text cannot exceed ${BANNER_LIMITS.badgeText.maxChars} characters.`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.ctaText && countWords(form.ctaText) > BANNER_LIMITS.ctaText.maxWords) {
      setUploadError(`CTA button text cannot exceed ${BANNER_LIMITS.ctaText.maxWords} words (currently ${countWords(form.ctaText)} words).`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.ctaText && form.ctaText.length > BANNER_LIMITS.ctaText.maxChars) {
      setUploadError(`CTA button text cannot exceed ${BANNER_LIMITS.ctaText.maxChars} characters.`);
      setSaving(false); setUploadProgress(null); return;
    }
    if (form.ctaLink && form.ctaLink.length > BANNER_LIMITS.ctaLink.maxChars) {
      setUploadError(`CTA link cannot exceed ${BANNER_LIMITS.ctaLink.maxChars} characters.`);
      setSaving(false); setUploadProgress(null); return;
    }

    const file = imageFile || fileInputRef.current?.files?.[0];
    if (!file && !editing) {
      setUploadError('Please select a banner image file.');
      setSaving(false); setUploadProgress(null); return;
    }

    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('subtitle', form.subtitle);
      fd.append('type', form.type);
      fd.append('ctaText', form.ctaText);
      fd.append('ctaLink', form.ctaLink);
      fd.append('position', String(form.position));
      fd.append('isActive', String(form.isActive));
      fd.append('badgeText', form.badgeText);
      fd.append('countdown', form.countdown || '');
      if (file) fd.append('image', file);

      const config = {
        onUploadProgress: (pe) => {
          if (pe.total) {
            const pct = Math.round((pe.loaded / pe.total) * 100);
            setUploadProgress(pct);
          }
        },
      };

      if (editing) {
        await api.put(`/banners/${editing.id}`, fd, config);
        toast.success('Banner updated successfully.');
      } else {
        await api.post('/banners', fd, config);
        toast.success('Banner created successfully.');
      }

      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.message || err.message || 'Upload failed. Please retry.');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const executeDelete = async (id) => {
    try {
      await api.delete(`/banners/${id}`);
      toast.success('Banner deleted successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete banner');
      console.error(err);
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="flex flex-col items-center text-center gap-2 p-1">
        <p className="text-sm font-semibold text-neutral-800">Confirm Deletion</p>
        <p className="text-xs text-neutral-600">Are you sure you want to delete this banner?</p>
        <div className="flex justify-center items-center gap-3 mt-2 w-full">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDelete(id);
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider transition-colors rounded shadow-sm"
          >
            Yes, Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase tracking-wider transition-colors rounded border border-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        borderRadius: '12px',
        background: '#fff',
        color: '#333',
        border: '1px solid #E5E5E5',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      },
    });
  };

  // ── About Section (Our Story) State & Handlers ──
  const aboutBanner = useMemo(() => {
    return banners.find(b => b.type === 'ABOUT') || null;
  }, [banners]);

  const [aboutForm, setAboutForm] = useState({
    title: 'Twin A',
    subtitle: 'Our Story',
    badgeText: '15',
    description: 'Twin A Apparels is a Coimbatore-rooted fashion label dedicated to crafting authentic, contemporary garments for the whole family. Every stitch reflects our commitment to intentional silhouettes, breathable fabrics, and effortless elegance.\n\nFrom everyday modern essentials to festive occasion wear, our collections harmonize South India’s rich textile heritage with clean contemporary design.',
    ctaText: 'Discover Our Heritage',
    ctaLink: '/about',
    isActive: true,
    metrics: [
      { label: 'Premium Fabric Quality', percentage: 95 },
      { label: 'Artisanal Finishing & Fit', percentage: 90 },
      { label: 'Customer Loyalty & Trust', percentage: 98 },
    ],
  });
  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [aboutImagePreview, setAboutImagePreview] = useState(null);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutUploadProgress, setAboutUploadProgress] = useState(null);
  const aboutFileInputRef = useRef(null);

  useEffect(() => {
    if (aboutBanner) {
      let descText = aboutBanner.description || '';
      let metricsArr = [
        { label: 'Premium Fabric Quality', percentage: 95 },
        { label: 'Artisanal Finishing & Fit', percentage: 90 },
        { label: 'Customer Loyalty & Trust', percentage: 98 },
      ];

      if (aboutBanner.description) {
        try {
          const parsed = JSON.parse(aboutBanner.description);
          if (parsed && typeof parsed === 'object') {
            if (parsed.text !== undefined) descText = parsed.text;
            if (Array.isArray(parsed.metrics) && parsed.metrics.length > 0) {
              metricsArr = parsed.metrics;
            }
          }
        } catch (e) {}
      }

      setAboutForm({
        title: aboutBanner.title || 'Twin A',
        subtitle: aboutBanner.subtitle || 'Our Story',
        badgeText: aboutBanner.badgeText || '15',
        description: descText || 'Twin A Apparels is a Coimbatore-rooted fashion label dedicated to crafting authentic, contemporary garments for the whole family. Every stitch reflects our commitment to intentional silhouettes, breathable fabrics, and effortless elegance.\n\nFrom everyday modern essentials to festive occasion wear, our collections harmonize South India’s rich textile heritage with clean contemporary design.',
        ctaText: aboutBanner.ctaText || 'Discover Our Heritage',
        ctaLink: aboutBanner.ctaLink || '/about',
        isActive: aboutBanner.isActive !== false,
        metrics: metricsArr,
      });
      setAboutImagePreview(aboutBanner.image ? getImageUrl(aboutBanner.image) : null);
      setAboutImageFile(null);
    }
  }, [aboutBanner]);

  const handleSaveAbout = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!canAddBanner) {
      toast.error('You do not have permission to manage banners.');
      return;
    }
    setAboutSaving(true);
    setAboutUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('type', 'ABOUT');
      fd.append('title', aboutForm.title || 'Twin A');
      fd.append('subtitle', aboutForm.subtitle || 'Our Story');
      fd.append('badgeText', aboutForm.badgeText || '15');
      const payloadDesc = JSON.stringify({
        text: aboutForm.description || '',
        metrics: aboutForm.metrics || [
          { label: 'Premium Fabric Quality', percentage: 95 },
          { label: 'Artisanal Finishing & Fit', percentage: 90 },
          { label: 'Customer Loyalty & Trust', percentage: 98 },
        ],
      });
      fd.append('description', payloadDesc);
      fd.append('ctaText', aboutForm.ctaText || 'Discover Our Heritage');
      fd.append('ctaLink', aboutForm.ctaLink || '/about');
      fd.append('isActive', 'true');
      fd.append('position', '0');

      if (aboutImageFile) {
        fd.append('image', aboutImageFile);
      }

      const config = {
        onUploadProgress: (pe) => {
          if (pe.total) {
            setAboutUploadProgress(Math.round((pe.loaded / pe.total) * 100));
          }
        },
      };

      if (aboutBanner) {
        await api.put(`/banners/${aboutBanner.id}`, fd, config);
        toast.success('About section updated successfully.');
      } else {
        if (!aboutImageFile) {
          toast.error('Please upload an image for the About section.');
          setAboutSaving(false);
          setAboutUploadProgress(null);
          return;
        }
        await api.post('/banners', fd, config);
        toast.success('About section created successfully.');
      }

      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to save About section.');
    } finally {
      setAboutSaving(false);
      setAboutUploadProgress(null);
    }
  };

  const handleToggle = async (b) => {
    const previousState = b.isActive;
    const nextState = !previousState;

    // 1. Optimistic UI update
    setBanners((prev) =>
      prev.map((item) => (item.id === b.id ? { ...item, isActive: nextState } : item))
    );

    try {
      // 2. Silent backend sync
      await api.put(`/banners/${b.id}`, {
        title: b.title,
        subtitle: b.subtitle,
        type: b.type,
        ctaText: b.ctaText,
        ctaLink: b.ctaLink,
        position: b.position,
        badgeText: b.badgeText,
        countdown: b.countdown || '',
        isActive: nextState,
      });
      toast.success(`Banner ${nextState ? 'activated' : 'deactivated'}`);
    } catch (err) {
      // 3. Rollback on error
      setBanners((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, isActive: previousState } : item))
      );
      toast.error(err.response?.data?.message || err.message || 'Failed to update banner status');
      console.error(err);
    }
  };

  // Tabs order matching homepage display sequence: Hero (1st) -> CountDown (2nd) -> Exclusive Deal (3rd) -> Promo (4th)
  // const TABS = ['All', 'Hero', 'CountDown', 'Exclusive Deal', 'Promo'];
  const TABS = ['Hero', 'Offers & Countdown', 'About Section'];
  const { admin } = useSelector((s) => s.auth);
  const canAddBanner = checkPermission(admin, 'add_banner');
  const canDeleteBanner = checkPermission(admin, 'delete_banner');

  // Only Hero banners are present in the table
  const filteredBanners = banners.filter(b => {
    if (activeTab === 'Hero') return b.type === 'HERO';
    if (activeTab === 'Offers & Countdown' || activeTab === 'Countdown') return b.type === 'COUNTDOWN';
    return true;
  });

  return (
    <AdminLayout title="Banners">
      {/* Tabs Nav Bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
            id={`banners-tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}
            className={`flex-shrink-0 px-4 py-2 text-xs font-medium rounded-lg border transition-all ${
              activeTab === tab
                ? 'bg-brand-gold border-brand-gold text-white'
                : 'bg-white border-brand-light text-brand-grey hover:bg-brand-light'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== 'About Section' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-brand-grey">{filteredBanners.length} banner{filteredBanners.length !== 1 ? 's' : ''}</p>
            {canAddBanner && (
              <button onClick={() => openModal()} className="btn-primary flex items-center gap-2" id="add-banner-btn">
                <Plus size={16} /> Add Banner
              </button>
            )}
          </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanners.map(banner => (
            <div key={banner.id} className="bg-white rounded-xl shadow-sm overflow-hidden group border border-brand-light flex flex-col justify-between">
              <div>
                <div className="relative h-44 bg-brand-light/50">
                  {banner.image ? (
                    <img
                      src={getImageUrl(banner.image)}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-grey text-xs">No image</div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                    <span className="bg-brand-gold text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs">
                      {banner.type === 'EXCLUSIVE_DEAL' ? 'EXCLUSIVE DEAL' : banner.type === 'COUNTDOWN' ? 'OFFERS & COUNTDOWN' : banner.type}
                    </span>
                    <span className="bg-white/90 text-brand-text text-[10px] font-bold px-2 py-0.5 rounded border border-brand-light">Pos: {banner.position}</span>
                    {banner.type === 'COUNTDOWN' && banner.countdown && (
                      new Date(banner.countdown).getTime() <= Date.now() ? (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Expired</span>
                      ) : (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Active Offer</span>
                      )
                    )}
                    {!banner.isActive && (
                      <span className="bg-neutral-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-1">
                  <p className="font-medium text-sm text-brand-text line-clamp-1">{banner.title || 'Untitled Banner'}</p>
                  <p className="text-xs text-brand-grey line-clamp-2">{banner.subtitle || 'No subtitle provided'}</p>
                  {banner.badgeText && (
                    <span className="inline-block text-[10px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded mt-1">
                      Badge: {banner.badgeText}
                    </span>
                  )}
                  {banner.type === 'COUNTDOWN' && banner.countdown && (
                    <div className="text-[11px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded flex items-center gap-1.5 mt-1.5 font-medium border border-amber-200/50">
                      <Clock size={12} className="flex-shrink-0" />
                      <span>Ends: {new Date(banner.countdown).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-brand-light/60 mt-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={banner.isActive}
                    disabled={!canAddBanner}
                    onChange={() => canAddBanner && handleToggle(banner)}
                    id={`toggle-banner-${banner.id}`}
                  />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  {canAddBanner && (
                    <button onClick={() => openModal(banner)} className="p-1.5 text-brand-grey hover:text-brand-gold transition-colors" title="Edit" id={`edit-banner-${banner.id}`}><Edit2 size={14} /></button>
                  )}
                  {canDeleteBanner && (
                    <button onClick={() => handleDelete(banner.id)} className="p-1.5 text-brand-grey hover:text-red-500 transition-colors" title="Delete" id={`del-banner-${banner.id}`}><Trash2 size={14} /></button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        </>
      )}

      {/* ── ABOUT SECTION TAB ── */}
      {activeTab === 'About Section' && (
        <div className="bg-white rounded-xl border border-brand-light p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-brand-light gap-4">
            <div>
              <h3 className="font-playfair text-xl font-semibold text-brand-text">Homepage "Our Story" / About Section</h3>
              <p className="text-xs text-brand-grey mt-1">Manage the craftsmanship image, story headings, experience counter, and description copy for the homepage.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSaveAbout}
                disabled={aboutSaving || !canAddBanner}
                className="btn-primary flex items-center gap-2 text-xs py-2 px-5 disabled:opacity-50"
                id="save-about-section-btn"
              >
                {aboutSaving ? (
                  <><RefreshCw size={14} className="animate-spin" /> {aboutUploadProgress !== null && aboutUploadProgress > 0 ? `${aboutUploadProgress}%` : 'Saving...'}</>
                ) : (
                  <><CheckCircle2 size={14} /> Save Changes</>
                )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveAbout} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Form Controls */}
            <div className="lg:col-span-7 space-y-5">
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5">
                  Craftsmanship / Story Image {!aboutBanner && '*'}
                </label>
                <div
                  onClick={() => aboutFileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-light hover:border-brand-gold rounded-xl p-5 text-center cursor-pointer transition-colors bg-neutral-50/50"
                >
                  {aboutImagePreview ? (
                    <div className="relative inline-block">
                      <img
                        src={aboutImagePreview}
                        alt="Story Preview"
                        className="max-h-64 rounded-lg object-cover shadow-sm mx-auto"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAboutImagePreview(null);
                          setAboutImageFile(null);
                          if (aboutFileInputRef.current) aboutFileInputRef.current.value = '';
                        }}
                        className="absolute top-2 right-2 bg-white/95 p-1.5 rounded-full shadow text-neutral-800 hover:text-red-600 transition-colors"
                        title="Remove image"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="py-6">
                      <Upload size={32} className="mx-auto text-brand-grey mb-2 opacity-70" />
                      <p className="text-sm font-medium text-brand-text">Click to upload story image</p>
                      <p className="text-xs text-brand-grey mt-1">Recommended: 1200 × 1400 px or portrait ratio (PNG, JPG, WebP — max 5MB)</p>
                    </div>
                  )}
                  <input
                    ref={aboutFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error(`File size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`);
                        return;
                      }
                      setAboutImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => setAboutImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="about-title">
                    Brand / Main Heading
                  </label>
                  <input
                    id="about-title"
                    type="text"
                    value={aboutForm.title}
                    onChange={(e) => setAboutForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Twin A"
                    className="w-full border border-brand-light px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="about-subtitle">
                    Subtitle
                  </label>
                  <input
                    id="about-subtitle"
                    type="text"
                    value={aboutForm.subtitle}
                    onChange={(e) => setAboutForm(p => ({ ...p, subtitle: e.target.value }))}
                    placeholder="e.g. Our Story"
                    className="w-full border border-brand-light px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="about-badge">
                  Years of Experience Counter
                </label>
                <input
                  id="about-badge"
                  type="text"
                  value={aboutForm.badgeText}
                  onChange={(e) => setAboutForm(p => ({ ...p, badgeText: e.target.value }))}
                  placeholder="e.g. 15"
                  className="w-full border border-brand-light px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold"
                />
                <p className="text-[11px] text-brand-grey mt-1">Displays as "+{aboutForm.badgeText || '15'} Years of Craftsmanship" on the curved badge.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="about-desc">
                  Story Description Paragraphs
                </label>
                <textarea
                  id="about-desc"
                  rows={5}
                  value={aboutForm.description}
                  onChange={(e) => setAboutForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Enter story paragraphs. Separate multiple paragraphs with an empty line."
                  className="w-full border border-brand-light px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold resize-y leading-relaxed"
                />
                <p className="text-[11px] text-brand-grey mt-1">Tip: Use a blank line between paragraphs to separate them cleanly on the homepage.</p>
              </div>

              {/* ── Animated Quality Progress Bars (Editable) ── */}
              <div className="bg-neutral-50/80 border border-brand-light rounded-xl p-4.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-brand-text">
                      Animated Quality Progress Bars
                    </label>
                    <p className="text-[11px] text-brand-grey mt-0.5">Edit the 3 luxury craftsmanship percentage bars displayed on the homepage.</p>
                  </div>
                  <span className="text-[10px] bg-brand-gold/15 text-brand-gold font-bold px-2 py-0.5 rounded">3 Bars</span>
                </div>

                <div className="space-y-3">
                  {(aboutForm.metrics || []).map((metric, idx) => (
                    <div key={idx} className="bg-white p-3.5 rounded-lg border border-brand-light shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-gold uppercase tracking-wider text-[10px]">Quality Metric {idx + 1}</span>
                        <span className="font-bold text-neutral-900 tabular-nums">{metric.percentage}%</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={metric.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAboutForm(p => {
                                const nextM = [...(p.metrics || [])];
                                nextM[idx] = { ...nextM[idx], label: val };
                                return { ...p, metrics: nextM };
                              });
                            }}
                            placeholder="e.g. Premium Fabric Quality"
                            className="w-full border border-brand-light px-3 py-1.5 text-xs rounded-md focus:outline-none focus:border-brand-gold font-medium"
                          />
                        </div>
                        <div className="sm:col-span-4 flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={metric.percentage}
                            onChange={(e) => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              setAboutForm(p => {
                                const nextM = [...(p.metrics || [])];
                                nextM[idx] = { ...nextM[idx], percentage: val };
                                return { ...p, metrics: nextM };
                              });
                            }}
                            className="w-20 border border-brand-light px-2.5 py-1.5 text-xs rounded-md focus:outline-none focus:border-brand-gold text-center font-bold text-brand-gold"
                          />
                          <span className="text-xs font-bold text-brand-grey">%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neutral-900 to-[#BEA266] rounded-full transition-all duration-300"
                          style={{ width: `${metric.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="about-cta-text">
                    CTA Button Text
                  </label>
                  <input
                    id="about-cta-text"
                    type="text"
                    value={aboutForm.ctaText}
                    onChange={(e) => setAboutForm(p => ({ ...p, ctaText: e.target.value }))}
                    placeholder="e.g. Discover Our Heritage"
                    className="w-full border border-brand-light px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="about-cta-link">
                    CTA Button Link
                  </label>
                  <input
                    id="about-cta-link"
                    type="text"
                    value={aboutForm.ctaLink}
                    onChange={(e) => setAboutForm(p => ({ ...p, ctaLink: e.target.value }))}
                    placeholder="e.g. /about"
                    className="w-full border border-brand-light px-3.5 py-2.5 text-sm rounded-lg focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Card Preview */}
            <div className="lg:col-span-5 bg-neutral-50 rounded-xl p-5 border border-brand-light/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-brand-light">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-grey">Live Preview</span>
                  <span className="text-[10px] bg-brand-gold/15 text-brand-gold font-semibold px-2 py-0.5 rounded-full">Homepage Card</span>
                </div>

                <div className="relative w-full h-80 rounded-[24px] overflow-hidden bg-neutral-900 shadow-sm">
                  {aboutImagePreview ? (
                    <img
                      src={aboutImagePreview}
                      alt="Story Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-4 text-center">
                      <Upload size={28} className="mb-2 opacity-50" />
                      <p className="text-xs">Upload an image to preview</p>
                    </div>
                  )}

                  {/* Top-left badge */}
                  <div className="absolute top-0 left-0 bg-white pt-2.5 pb-2 px-4 rounded-br-[18px] text-[10px] font-bold uppercase tracking-wider text-neutral-950 shadow-xs">
                    Explore Story →
                  </div>

                  {/* Bottom-right badge */}
                  <div className="absolute bottom-0 right-0 bg-white pt-2.5 pb-2 px-4 rounded-tl-[18px] text-right shadow-xs">
                    <span className="font-playfair text-xl font-light text-neutral-950">+{aboutForm.badgeText || '15'}</span>
                    <span className="block text-[8px] font-bold uppercase tracking-wider text-neutral-700">Years of Craftsmanship</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <h4 className="font-playfair text-2xl font-bold text-neutral-950">{aboutForm.title || 'Twin A'}</h4>
                  <h5 className="font-playfair text-base text-neutral-700">{aboutForm.subtitle || 'Our Story'}</h5>
                  <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                    {aboutForm.description || 'Twin A Apparels is a Coimbatore-rooted fashion label dedicated to crafting authentic, contemporary garments...'}
                  </p>

                  {/* Live Progress Bars Preview */}
                  <div className="space-y-2 pt-2 border-t border-brand-light/60">
                    {(aboutForm.metrics || []).map((m, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold tracking-wider uppercase text-neutral-800">
                          <span className="truncate pr-2">{m.label || `Metric ${idx + 1}`}</span>
                          <span className="text-[#BEA266] font-bold">{m.percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-neutral-900 to-[#BEA266] rounded-full transition-all duration-300"
                            style={{ width: `${m.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-light mt-4">
                <button
                  type="button"
                  onClick={handleSaveAbout}
                  disabled={aboutSaving || !canAddBanner}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {aboutSaving ? (
                    <><RefreshCw size={14} className="animate-spin" /> {aboutUploadProgress !== null && aboutUploadProgress > 0 ? `${aboutUploadProgress}%` : 'Saving Changes...'}</>
                  ) : (
                    <><CheckCircle2 size={14} /> Save About Section</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light sticky top-0 bg-white z-10">
                <h2 className="font-playfair text-lg font-semibold">{editing ? 'Edit Banner' : 'Add Banner'}</h2>
                <button onClick={() => setModalOpen(false)} className="p-1.5 hover:text-brand-gold"><X size={18} /></button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Banner Type & Position Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="ban-type">
                      Banner Type *
                    </label>
                    <select
                      id="ban-type"
                      value={form.type}
                      onChange={e => handleTypeChange(e.target.value)}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold bg-white rounded-sm font-medium text-brand-text"
                    >
                      <option value="HERO">Hero Banner</option>
                      <option value="COUNTDOWN">Offers & Countdown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="ban-pos">
                      Position Order
                    </label>
                    <input
                      id="ban-pos"
                      type="number"
                      min="1"
                      value={form.position}
                      onChange={e => setForm(p => ({ ...p, position: Number(e.target.value) }))}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                    />
                  </div>
                </div>

                {/* Banner Image Upload & Live Dimension Inspector */}
                <div>
                  <label className="block text-xs font-semibold text-brand-grey mb-1.5">Banner Image {!editing && '*'}</label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                      !dimValidation.isValid
                        ? 'border-red-500 bg-red-50/20'
                        : isDragging
                        ? 'border-brand-gold bg-brand-gold/5'
                        : 'border-brand-light hover:border-brand-gold'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        handleFileSelect(file);
                      }
                    }}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto object-contain rounded" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setImageDims(null); setDimValidation({ isValid: true, message: null }); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-1 right-1 bg-white/90 p-1 rounded-full shadow hover:bg-white"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <Upload size={28} className="mx-auto text-brand-grey mb-2" />
                        <p className="text-sm text-brand-grey font-medium">Drag & drop image here, or click to upload</p>
                        <p className="text-xs text-brand-grey mt-1">JPEG, PNG, WebP — max 5MB</p>
                        <p className="text-xs text-red-500 mt-1">
                          (Recommended size {BANNER_SPECS[form.type]?.width} × {BANNER_SPECS[form.type]?.height} px, max 5MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                  
                  {/* Validation feedback below image input field */}
                  {!dimValidation.isValid && (
                    <div className="mt-2.5 p-3 rounded-lg border bg-red-50 border-red-200 text-xs text-red-900 flex items-start gap-2">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-700">Improper Image Size Detected</p>
                        <p className="text-xs text-red-700 font-medium mt-1">
                          Please upload a proper image matching the recommended dimensions: {BANNER_SPECS[form.type]?.width} × {BANNER_SPECS[form.type]?.height} px (max file size: 5 MB).
                        </p>
                      </div>
                    </div>
                  )}
                  {dimValidation.isValid && imageDims && (
                    <div className="mt-2.5 p-2.5 rounded-lg border bg-green-50/60 border-green-200 text-xs text-green-900 flex items-center justify-between font-medium">
                      <span>Current Image Size: <strong>{imageDims.width} × {imageDims.height} px</strong></span>
                      <span className="flex items-center gap-1 text-green-700 font-bold bg-white px-2 py-0.5 rounded border border-green-200 text-[10px]">
                        <CheckCircle2 size={12} /> Dimensions Valid
                      </span>
                    </div>
                  )}
                </div>

                {/* Title & Subtitle */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-brand-grey" htmlFor="ban-title">
                      Title {(form.type !== 'HERO') && '*'}
                    </label>
                    {renderFieldCounter(form.title, BANNER_LIMITS.title)}
                  </div>
                  <input
                    id="ban-title"
                    type="text"
                    maxLength={BANNER_LIMITS.title.maxChars}
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                    placeholder="e.g. Midnight Luxury Sale"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-brand-grey" htmlFor="ban-sub">
                      Subtitle {(form.type !== 'HERO') && '*'}
                    </label>
                    {renderFieldCounter(form.subtitle, BANNER_LIMITS.subtitle)}
                  </div>
                  <input
                    id="ban-sub"
                    type="text"
                    maxLength={BANNER_LIMITS.subtitle.maxChars}
                    value={form.subtitle}
                    onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
                    className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                    placeholder="e.g. Up to 50% Off Luxury Watches & Apparel"
                  />
                </div>

                {/* Countdown Time */}
                {form.type === 'COUNTDOWN' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-grey mb-1.5" htmlFor="ban-countdown">Offer Ends At (Date & Time) *</label>
                    <input id="ban-countdown" type="datetime-local" value={form.countdown} onChange={e => setForm(p => ({ ...p, countdown: e.target.value }))} required className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm" />
                  </div>
                )}

                {/* CTA text & link */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-brand-grey truncate mr-1" htmlFor="ban-ctaText">
                        CTA Text {(form.type === 'EXCLUSIVE_DEAL' || form.type === 'COUNTDOWN') && '*'}
                      </label>
                      {renderFieldCounter(form.ctaText, BANNER_LIMITS.ctaText)}
                    </div>
                    <input
                      id="ban-ctaText"
                      type="text"
                      maxLength={BANNER_LIMITS.ctaText.maxChars}
                      value={form.ctaText}
                      onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                      placeholder="e.g. SHOP NOW"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-brand-grey" htmlFor="ban-ctaLink">
                        CTA Link *
                      </label>
                      {renderFieldCounter(form.ctaLink, BANNER_LIMITS.ctaLink)}
                    </div>
                    <input
                      id="ban-ctaLink"
                      type="text"
                      maxLength={BANNER_LIMITS.ctaLink.maxChars}
                      value={form.ctaLink}
                      onChange={e => setForm(p => ({ ...p, ctaLink: e.target.value }))}
                      required
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                      placeholder="e.g. /products"
                    />
                  </div>
                </div>

                {/* Badge + Active Toggle */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-brand-grey truncate mr-1" htmlFor="ban-badge">
                        Badge Text {(form.type === 'EXCLUSIVE_DEAL' || form.type === 'COUNTDOWN') && '*'}
                      </label>
                      {renderFieldCounter(form.badgeText, BANNER_LIMITS.badgeText)}
                    </div>
                    <input
                      id="ban-badge"
                      type="text"
                      maxLength={BANNER_LIMITS.badgeText.maxChars}
                      value={form.badgeText}
                      onChange={e => setForm(p => ({ ...p, badgeText: e.target.value }))}
                      className="w-full border border-brand-light px-3 py-2 text-sm focus:outline-none focus:border-brand-gold rounded-sm"
                      placeholder="e.g. 50% OFF"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none" htmlFor="ban-active">
                      <Switch checked={form.isActive} onChange={val => setForm(p => ({ ...p, isActive: typeof val === 'boolean' ? val : val?.target?.checked }))} id="ban-active" />
                      Active Banner
                    </label>
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2 border-t border-brand-light">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1" id="ban-cancel" disabled={saving}>Cancel</button>
                  <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" id="ban-save" disabled={saving}>
                    {saving ? (
                      <><RefreshCw size={14} className="animate-spin" /> {uploadProgress !== null && uploadProgress > 0 ? `${uploadProgress}%` : 'Saving...'}</>
                    ) : (
                      editing ? 'Update Banner' : 'Save Banner'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default BannersAdminPage;
