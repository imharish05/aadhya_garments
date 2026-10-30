import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, MapPin, Phone, Mail, Compass } from 'lucide-react';
import Footer from '../components/Footer';
import { FadeUp, EyebrowReveal, StaggeredText } from '../components/animations';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

import twoWayLycraImg from '../assets/fabrics/2-way Lycra.png';
import loopknitImg from '../assets/fabrics/Loopknit.png';
import nsFabricImg from '../assets/fabrics/NS Fabric.png';
import pureCottonImg from '../assets/fabrics/Pure Cotton.png';

/* ────────────────────────────────────────────────────────────────────────────
   Twin A Apparels — About page
   Copy comes from site settings API (backed by the company profile sheet).
   Palette: logo black + gold. Fonts: font-playfair + font-inter only.
──────────────────────────────────────────────────────────────────────────── */
const DEFAULT_ABOUT = {
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
  values: ['Style', 'Comfort', 'Quality', 'Affordability', 'Durability', 'Modern fashion', 'Latest trends'],
  fabrics: {
    title: 'Superior fabrics, chosen with care',
    text: 'We use superior fabrics to ensure durability, comfort, and the latest trends for our customers.',
    list: ['2-way Lycra', 'NS Fabric', 'Loopknit', 'Pure Cotton', 'Muslin'],
  },
  mission:
    'To deliver exceptional clothing that combines **modern fashion** with **unmatched comfort**, while maintaining the **highest standards** of quality and affordability.',
  // Empty = fall back to bundled fabric photos. Set via site settings API.
  missionImages: {
    main: '',
    accent: '',
  },
  contact: {
    title: 'Get in touch',
    text: "Men's wear, kid's wear and ladies' wear, all in one place. We welcome wholesale partners, distributors, and bulk custom inquiries.",
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

// Fabric photos by name. While null, a drawn weave swatch is shown instead.
const FABRIC_IMAGES = {
  '2-way Lycra': twoWayLycraImg,
  'NS Fabric': nsFabricImg,
  Loopknit: loopknitImg,
  'Pure Cotton': pureCottonImg,
  Muslin: null,
};

/* ── Hero hang tags ──────────────────────────────────────────────────────── */
const THREAD = ['#BEA266', '#FBF7EE', '#BEA266'];
const TAG_THEMES = ['bg-[#FBF7EE] text-black', 'bg-[#BEA266] text-black', 'bg-[#FBF7EE] text-black'];

const HangTags = ({ tags = [], reduce }) => {
  const displayTags = tags.length ? tags : DEFAULT_ABOUT.hero.tags;
  return (
    <div className="relative mx-auto mt-14 md:mt-20 max-w-5xl">
      <div className="absolute left-0 right-0 top-0 hidden items-center sm:flex" aria-hidden="true">
        <span className="h-3 w-3 rounded-full bg-[#DFC481]" />
        <span className="h-[3px] flex-1 rounded-full bg-[#DFC481]" />
        <span className="h-3 w-3 rounded-full bg-[#DFC481]" />
      </div>

      <ul className="mx-auto grid max-w-[17rem] grid-cols-1 gap-3 px-2 sm:max-w-none sm:grid-cols-3 sm:gap-4 sm:px-6 sm:pt-1.5 md:gap-8 md:px-10">
        {displayTags.map((tag, i) => (
          <li key={tag.title || i} className="relative">
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full sm:hidden" style={{ backgroundColor: THREAD[i % THREAD.length] }} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: -40, rotate: i % 2 ? 7 : -7 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 11, delay: 0.5 + i * 0.15 }}
              style={{ transformOrigin: 'top center' }}
              whileHover={{ scale: 1.04 }}
            >
              <motion.div
                style={{ transformOrigin: 'top center' }}
                animate={reduce ? undefined : { rotate: [-2.2, 2.2] }}
                transition={reduce ? undefined : { duration: 3.4 + i * 0.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                className="relative flow-root"
              >
                <div className={`relative mt-7 sm:mt-11 rounded-[1.5rem] sm:rounded-[1.75rem] px-5 pb-5 pt-8 sm:px-4 sm:pb-5 sm:pt-9 md:px-6 md:pb-6 md:pt-10 text-center shadow-[0_18px_40px_rgba(0,0,0,0.35)] ${TAG_THEMES[i % TAG_THEMES.length]}`}>
                  <span className="absolute left-1/2 top-3 h-3 w-3 md:h-3.5 md:w-3.5 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
                  <span
                    className="absolute left-1/2 z-10 -top-7 h-[46px] w-[2px] -translate-x-1/2 rounded-full sm:-top-11 sm:h-[62px]"
                    style={{ backgroundColor: THREAD[i % THREAD.length] }}
                    aria-hidden="true"
                  />
                  <p className="font-inter text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] text-black/55">{tag.kicker}</p>
                  <h3 className="font-playfair mt-2 text-xl sm:text-lg md:text-2xl lg:text-3xl font-medium leading-tight">{tag.title}</h3>
                  <div className="my-3 md:my-4 border-t border-dashed border-black/30" />
                  <p className="font-inter text-[11px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-[0.14em]">{tag.foot}</p>
                </div>
              </motion.div>
            </motion.div>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   2. WHO WE ARE
──────────────────────────────────────────────────────────────────────────── */
const Who = ({ who = {} }) => {
  const photo = who.imageUrl ? getImageUrl(who.imageUrl) : null;
  return (
    <section className="bg-white px-6 py-16 md:px-12 md:py-24" aria-label="Who we are">
      <div className="mx-auto max-w-site">
        <div className={`grid items-center gap-10 md:gap-16 ${photo ? 'lg:grid-cols-2' : 'md:grid-cols-12'}`}>
          {photo && (
            <FadeUp>
              <div
                className="aspect-[3/4] w-full max-w-sm overflow-hidden border-2 border-dashed border-[#BEA266] p-1.5"
                style={{ borderRadius: '9999px 9999px 1.25rem 1.25rem' }}
              >
                <img
                  src={photo}
                  alt={who.title || "Twin A Apparels"}
                  className="h-full w-full object-cover"
                  style={{ borderRadius: '9999px 9999px 0.9rem 0.9rem' }}
                  loading="lazy"
                />
              </div>
            </FadeUp>
          )}

          <FadeUp className={photo ? '' : 'md:col-span-5'}>
            <span className="mb-3 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A5F28]">
              <span className="h-px w-8 bg-[#BEA266]" />
              Who We Are
            </span>
            <h2 className="font-playfair text-2xl font-medium leading-snug text-black sm:text-3xl lg:text-[2.2rem]">
              {who.title || DEFAULT_ABOUT.who.title}
            </h2>
          </FadeUp>

          <FadeUp delay={0.1} className={photo ? '' : 'md:col-span-7'}>
            <p className="border-l-2 border-[#BEA266] pl-6 text-base leading-[1.85] text-black/75 md:pl-10 md:text-lg md:leading-[1.85]">
              {who.text || DEFAULT_ABOUT.who.text}
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   3. FABRICS — cream
──────────────────────────────────────────────────────────────────────────── */
const INK = 'rgba(0,0,0,0.35)';
const WEAVES = [
  {
    backgroundImage: `repeating-linear-gradient(0deg, ${INK} 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, ${INK} 0 1px, transparent 1px 6px)`,
  },
  {
    backgroundImage: `radial-gradient(circle, ${INK} 1px, transparent 1.5px)`,
    backgroundSize: '7px 7px',
  },
  {
    backgroundImage: `radial-gradient(circle at 50% 0%, transparent 4px, ${INK} 4.5px, ${INK} 5.5px, transparent 6px)`,
    backgroundSize: '11px 8px',
  },
  {
    backgroundImage: `repeating-linear-gradient(45deg, ${INK} 0 1px, transparent 1px 5px), repeating-linear-gradient(-45deg, ${INK} 0 1px, transparent 1px 5px)`,
  },
  {
    backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0 1px, transparent 1px 3px)`,
  },
];

const Fabrics = ({ fabrics = {} }) => {
  const fabricList = fabrics.list?.length ? fabrics.list : DEFAULT_ABOUT.fabrics.list;
  return (
    <section className="bg-[#FBF7EE] px-6 py-16 md:px-12 md:py-24" aria-label="Our fabrics">
      <div className="mx-auto max-w-site">
        <FadeUp className="mx-auto max-w-xl text-center">
          <span className="mb-4 inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A5F28]">
            <span className="h-px w-8 bg-[#BEA266]" />
            Superior Materials
            <span className="h-px w-8 bg-[#BEA266]" />
          </span>
          <h2 className="font-playfair text-2xl font-medium leading-snug text-black sm:text-3xl lg:text-[2rem]">
            {fabrics.title || DEFAULT_ABOUT.fabrics.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#5A4D38]">
            {fabrics.text || DEFAULT_ABOUT.fabrics.text}
          </p>
        </FadeUp>

        <FadeUp delay={0.1}>
          <ul className="mt-14 flex flex-wrap justify-center gap-5 md:mt-20 md:gap-6">
            {fabricList.map((name, i) => {
              const src = FABRIC_IMAGES[name];
              const staggered = i % 2 === 1;
              return (
                <li
                  key={name}
                  className={`group w-[calc(50%-0.65rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] ${
                    staggered ? 'lg:translate-y-5' : ''
                  }`}
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden border-2 border-dashed border-[#BEA266]/70 bg-white p-1.5 transition-colors duration-300 group-hover:border-[#BEA266]"
                    style={{ borderRadius: '9999px 9999px 1.25rem 1.25rem' }}
                  >
                    <div
                      className="relative h-full w-full overflow-hidden bg-[#F4EEDD]"
                      style={{ borderRadius: '9999px 9999px 0.95rem 0.95rem' }}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={name}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 motion-reduce:transition-none"
                          loading="lazy"
                        />
                      ) : (
                        <span className="absolute inset-0" style={WEAVES[i % WEAVES.length]} aria-hidden="true" />
                      )}
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <p className="font-playfair text-lg font-medium leading-tight text-black">{name}</p>
                    <span className="mx-auto mt-2.5 block h-px w-6 border-b border-dashed border-[#BEA266]" aria-hidden="true" />
                  </div>
                </li>
              );
            })}
          </ul>
        </FadeUp>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   4. MISSION & CORE VALUES — big image + overlapping framed small image + text
   Images come from site settings (about.missionImages.main / .accent),
   falling back to fabric photos already imported above.
──────────────────────────────────────────────────────────────────────────── */
const Mission = ({ mission = '', values = [], images = {} }) => {
  const missionText = mission || DEFAULT_ABOUT.mission;
  const valuesList = values.length ? values : DEFAULT_ABOUT.values;
  const parts = missionText.split('**');

  const mainSrc = images.main ? getImageUrl(images.main) : loopknitImg;
  const accentSrc = images.accent ? getImageUrl(images.accent) : pureCottonImg;

  return (
    <section className="bg-white px-6 py-16 md:px-12 md:py-28" aria-label="Our mission and values">
      <div className="mx-auto max-w-site">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Image collage */}
          <FadeUp>
            <div className="relative pb-14 pr-0 sm:pb-16 lg:pb-20">
              <div className="aspect-[4/3] w-[92%] overflow-hidden rounded-3xl bg-[#F4EEDD] shadow-[0_20px_50px_rgba(0,0,0,0.12)] lg:w-[88%]">
                <img
                  src={mainSrc}
                  alt="Twin A Apparels craftsmanship"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="absolute bottom-0 right-0 w-[42%] max-w-[18rem] rounded-[1.75rem] bg-white p-2.5 shadow-[0_18px_45px_rgba(0,0,0,0.18)] sm:p-3">
                <div className="aspect-square overflow-hidden rounded-[1.25rem] bg-[#F4EEDD]">
                  <img
                    src={accentSrc}
                    alt="Fabric detail"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Mission words */}
          <FadeUp delay={0.1}>
            <h2 className="font-playfair text-2xl font-medium text-black sm:text-3xl">
              Our mission
            </h2>

            <p className="font-playfair mt-6 text-2xl font-normal leading-[1.4] text-black/85 sm:text-3xl lg:text-[2.1rem]">
              {parts.map((part, i) =>
                i % 2 === 1 ? (
                  <span key={i} className="italic font-medium text-[#7A5F28]">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </p>

            <div className="my-9 h-px w-full bg-gradient-to-r from-[#BEA266] to-transparent" />

            <p className="text-sm font-semibold text-black/60">What we stand for</p>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {valuesList.map((val) => (
                <li
                  key={val}
                  className="rounded-full border border-[#BEA266]/60 bg-[#FBF7EE] px-5 py-2 text-sm font-medium text-black transition-colors hover:border-[#BEA266] hover:bg-[#BEA266]"
                >
                  {val}
                </li>
              ))}
            </ul>
          </FadeUp>
        </div>
      </div>
    </section>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   5. CONTACT & SHOWROOM — Architectural Couture Lounge
   Fully connected to API office address, phone, email, and Google maps.
──────────────────────────────────────────────────────────────────────────── */
const Contact = ({ contact = {}, office = {} }) => {
  const title = contact.title || DEFAULT_ABOUT.contact.title;
  const text = contact.text || DEFAULT_ABOUT.contact.text;
  const button = contact.button || DEFAULT_ABOUT.contact.button;
  const to = contact.to || DEFAULT_ABOUT.contact.to;

  const addressLines = Array.isArray(office.address)
    ? office.address
    : (typeof office.address === 'string'
        ? office.address.split('\n').filter(Boolean)
        : DEFAULT_ABOUT.office.address);

  const phone = office.phone || DEFAULT_ABOUT.office.phone;
  const email = office.email || DEFAULT_ABOUT.office.email;
  const mapsUrl = office.mapsUrl || DEFAULT_ABOUT.office.mapsUrl;

  return (
    <section className="bg-[#FBF7EE] px-6 py-16 md:px-12 md:py-24" aria-label="Contact and Showroom">
      <div className="mx-auto max-w-site">
        <FadeUp>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0E0C09] px-7 py-14 sm:px-14 sm:py-18 lg:p-20 text-[#FBF7EE] shadow-[0_24px_60px_rgba(0,0,0,0.18)] border border-[#BEA266]/35">
            {/* Ambient luxury lighting */}
            <span
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#BEA266]/15 blur-3xl"
              aria-hidden="true"
            />
            <span
              className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#BEA266]/10 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-16 items-center">
              {/* Left Column: Heading, intro & action */}
              <div>
                <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DFC481]">
                  <span className="h-px w-6 bg-[#BEA266]" />
                  Wholesale & Retail Inquiries
                </span>

                <h2 className="font-playfair mt-4 text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.15] text-[#FBF7EE]">
                  {title}
                </h2>

                <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#FBF7EE]/70 max-w-lg">
                  {text}
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <Link
                    to={to}
                    className="group inline-flex items-center gap-4 rounded-full bg-[#BEA266] pl-7 pr-2.5 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition-all duration-300 hover:bg-[#DFC481] hover:shadow-[0_10px_25px_rgba(190,162,102,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DFC481]"
                  >
                    <span>{button}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-[#DFC481] transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>

                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#FBF7EE] transition-colors hover:border-[#BEA266] hover:text-[#DFC481]"
                    >
                      <Compass size={15} />
                      <span>Showroom Location</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Right Column: Office & Direct contact cards */}
              <div className="space-y-4 lg:border-l lg:border-white/10 lg:pl-12">
                {/* Physical address card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xs">
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#BEA266]/15 text-[#DFC481]">
                      <MapPin size={20} />
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#BEA266]">
                        Manufacturing & Office
                      </p>
                      <address className="not-italic mt-2 font-playfair text-base sm:text-lg leading-snug text-[#FBF7EE]">
                        {addressLines.map((line) => (
                          <span key={line} className="block">{line}</span>
                        ))}
                      </address>
                    </div>
                  </div>
                </div>

                {/* Direct contact pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {phone && (
                    <a
                      href={`tel:${phone.replace(/\s+/g, '')}`}
                      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#BEA266]/50 hover:bg-white/[0.06]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#BEA266]/15 text-[#DFC481]">
                        <Phone size={15} />
                      </span>
                      <div className="overflow-hidden">
                        <span className="text-[9px] uppercase tracking-wider text-white/50 block">Direct Line</span>
                        <span className="text-xs font-medium text-[#FBF7EE] truncate block group-hover:text-[#DFC481]">
                          {phone}
                        </span>
                      </div>
                    </a>
                  )}

                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-[#BEA266]/50 hover:bg-white/[0.06]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#BEA266]/15 text-[#DFC481]">
                        <Mail size={15} />
                      </span>
                      <div className="overflow-hidden">
                        <span className="text-[9px] uppercase tracking-wider text-white/50 block">Inquiries</span>
                        <span className="text-xs font-medium text-[#FBF7EE] truncate block group-hover:text-[#DFC481]">
                          {email}
                        </span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

const AboutPage = () => {
  const reduce = useReducedMotion();
  const [about, setAbout] = useState(DEFAULT_ABOUT);

  useEffect(() => {
    document.title = 'About — Twin A Apparels';
    window.scrollTo(0, 0);

    // Fetch dynamic site settings from backend
    api.get('/site-settings/about')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setAbout(prev => ({
            ...prev,
            ...d,
            hero: { ...prev.hero, ...(d.hero || {}) },
            who: { ...prev.who, ...(d.who || {}) },
            fabrics: { ...prev.fabrics, ...(d.fabrics || {}) },
            missionImages: { ...prev.missionImages, ...(d.missionImages || {}) },
            contact: { ...prev.contact, ...(d.contact || {}) },
            office: { ...prev.office, ...(d.office || {}) },
          }));
        }
      })
      .catch(err => {
        console.warn('Failed to fetch site settings for About page:', err.message);
      });
  }, []);

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[#FBF7EE] font-inter text-black">
      {/* 1. Hero */}
      <section className="bg-black text-[#FBF7EE]" aria-label="About Twin A Apparels">
        <div className="mx-auto max-w-site px-6 md:px-12 pt-14 sm:pt-16 md:pt-24 pb-16 sm:pb-20 md:pb-28 text-center">
          <EyebrowReveal className="mb-6 block font-inter text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DFC481]">
            {about.hero.eyebrow}
          </EyebrowReveal>
          <StaggeredText
            as="h1"
            text={about.hero.title}
            segmentBy="words"
            startDelay={0.1}
            className="font-playfair mx-auto max-w-4xl text-[2rem] sm:text-5xl lg:text-7xl font-medium leading-[1.12] sm:leading-[1.08] text-[#FBF7EE]"
          />
          <StaggeredText
            as="p"
            text={about.hero.text}
            segmentBy="words"
            blur={false}
            duration={0.4}
            startDelay={0.25}
            className="mx-auto mt-7 max-w-2xl text-[15px] md:text-base leading-relaxed text-[#FBF7EE]/70"
          />
          <HangTags tags={about.hero.tags} reduce={reduce} />
        </div>
      </section>

      {/* 2. Who We Are */}
      <Who who={about.who} />

      {/* 3. Fabrics */}
      <Fabrics fabrics={about.fabrics} />

      {/* 4. Mission & Values */}
      <Mission mission={about.mission} values={about.values} images={about.missionImages} />

      {/* 5. Contact & Showroom */}
      <Contact contact={about.contact} office={about.office} />

      <Footer />
    </main>
  );
};

export default AboutPage;