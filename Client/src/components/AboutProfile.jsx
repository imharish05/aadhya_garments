import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MapPin, ArrowRight, ArrowUpRight } from 'lucide-react';
import { FadeUp, StaggeredText } from './animations';

import twoWayLycraImg from '../assets/fabrics/2-way Lycra.png';
import loopknitImg from '../assets/fabrics/Loopknit.png';
import nsFabricImg from '../assets/fabrics/NS Fabric.png';
import pureCottonImg from '../assets/fabrics/Pure Cotton.png';

const FABRIC_IMAGES = {
  '2-way Lycra': twoWayLycraImg,
  'NS Fabric': nsFabricImg,
  Loopknit: loopknitImg,
  'Pure Cotton': pureCottonImg,
  Muslin: null,
};

/**
 * AboutProfile — company profile section for the About page.
 * All copy comes from the Twin A Apparels company profile sheet.
 * Palette from the logo (black + gold). Two fonts only (font-playfair + font-inter).
 * No gradients, no boxes inside boxes, rounded shapes only.
 *
 * EDIT COPY HERE ↓
 */
const PROFILE = {
  eyebrow: 'Company Profile',
  title: 'Founded with a passion for style and comfort',
  about:
    "We specialize in the manufacturing and wholesale distribution of high-quality men's wear, kid's wear, shorts, cargo pants, 3/4ths, and stylish T-shirts.",
  whatWeDo: ['Manufacturing', 'Wholesale distribution'],
  fabricsTitle: 'Superior fabrics',
  fabricsText: 'We use superior fabrics to ensure durability, comfort, and the latest trends for our customers.',
  fabrics: ['2-way Lycra', 'NS Fabric', 'Loopknit', 'Pure Cotton', 'Muslin'],
  fabricTags: ['Durability', 'Comfort', 'Latest trends'],
  // **double asterisks** = gold highlight
  mission:
    'To deliver exceptional clothing that combines **modern fashion** with **unmatched comfort,** while maintaining the **highest standards** of quality and affordability.',
  catalog: [
    { name: "Men's Wear", items: ['Track pants', 'Cargo', 'Shorts', 'T-shirt', 'Sportswear'] },
    {
      name: "Kid's Wear",
      items: [
        'Frock, Night Set',
        'Boys T-shirt',
        'Girls T-shirt',
        'Boys set dress',
        'Girls set dress',
        "Kid's Night Suits for Girls & Boys",
        'Boys shorts',
        'Girls shorts',
      ],
    },
    { name: 'Ladies', items: ['Tops & kurtis', 'Western tops', 'Maternity wear'] },
  ],
  address: [
    '6/154, 2nd Street, Radhithya Avenue,',
    'Checkpost, Kinathukadavu - Pollachi Main Road,',
    'Coimbatore - 642109',
  ],
};

const EASE = [0.22, 1, 0.36, 1];

/* Mission words: dim → bright, one observer on the parent only */
const missionWords = PROFILE.mission.split('**').flatMap((part, i) =>
  part
    .split(/\s+/)
    .filter(Boolean)
    .map(w => ({ w, hi: i % 2 === 1 }))
);

const wordsParent = { hidden: {}, show: { transition: { staggerChildren: 0.045 } } };
const wordChild = {
  hidden: { opacity: 0.18, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const pillsParent = { hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } };
const pillChild = {
  hidden: { opacity: 0, y: 14, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE } },
};

const FABRIC_STYLES = [
  'bg-black text-[#DFC481]',
  'bg-[#BEA266] text-black',
  'bg-[#FBF7EE] text-black border border-black/20',
];

const AboutProfile = () => {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const current = PROFILE.catalog[active];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PROFILE.address.join(' '))}`;

  const onTabKey = (e) => {
    const n = PROFILE.catalog.length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setActive(a => (a + 1) % n); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setActive(a => (a - 1 + n) % n); }
  };

  return (
    <section className="bg-[#FBF7EE] text-black font-inter" aria-label="Company profile">
      <div className="max-w-site mx-auto px-6 md:px-12 py-16 md:py-24 space-y-20 md:space-y-28">

        {/* ── 1. Intro ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-20 items-start">
          <div>
            <FadeUp>
              <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A5F28]">
                <span className="h-px w-8 bg-[#BEA266]" />
                {PROFILE.eyebrow}
              </span>
            </FadeUp>
            <StaggeredText
              as="h2"
              text={PROFILE.title}
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair mt-5 text-4xl sm:text-5xl lg:text-6xl font-medium leading-[1.08] text-black"
            />
            <StaggeredText
              as="p"
              text={PROFILE.about}
              segmentBy="words"
              blur={false}
              duration={0.4}
              startDelay={0.25}
              className="mt-7 max-w-xl text-[15px] md:text-base leading-relaxed text-[#5A4D38]"
            />
          </div>

          <ul className="lg:pt-3" aria-label="What we do">
            {PROFILE.whatWeDo.map((item, i) => (
              <li key={item}>
                <FadeUp delay={0.1 + i * 0.12}>
                  <div className="group relative flex items-center gap-6 border-t border-black/15 py-7 md:py-8">
                    <span className="absolute -top-px left-0 h-px w-full origin-left scale-x-0 bg-[#BEA266] transition-transform duration-500 ease-out group-hover:scale-x-100" />
                    <span className="font-playfair text-4xl font-light text-black/15 transition-colors duration-500 group-hover:text-[#BEA266]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-playfair text-2xl md:text-3xl font-medium text-black">{item}</span>
                  </div>
                </FadeUp>
              </li>
            ))}
            <li className="border-t border-black/15" aria-hidden="true" />
          </ul>
        </div>

        {/* ── 2. Fabrics on a stitched line ─────────────────────── */}
        <div>
          <div className="text-center max-w-2xl mx-auto">
            <FadeUp>
              <h3 className="font-playfair text-3xl md:text-4xl font-medium text-black">{PROFILE.fabricsTitle}</h3>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-4 text-[15px] leading-relaxed text-[#5A4D38]">{PROFILE.fabricsText}</p>
            </FadeUp>
          </div>

          <div className="relative mt-12 md:mt-16">
            {/* stitch line draws itself across */}
            <motion.div
              className="hidden sm:block absolute left-[6%] right-[6%] top-1/2 -translate-y-1/2"
              initial={{ clipPath: 'inset(0 100% 0 0)' }}
              whileInView={{ clipPath: 'inset(0 0% 0 0)' }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 1.6, ease: EASE }}
              aria-hidden="true"
            >
              <svg width="100%" height="4" className="block">
                <line x1="2" y1="2" x2="99.5%" y2="2" stroke="#BEA266" strokeWidth="2" strokeLinecap="round" strokeDasharray="9 9" />
              </svg>
            </motion.div>

            <div className="relative flex flex-wrap justify-center sm:flex-nowrap sm:justify-between gap-5 sm:gap-4">
              {PROFILE.fabrics.map((name, i) => {
                const src = FABRIC_IMAGES[name];
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, scale: 0.8, y: 16 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
                  >
                    <motion.div
                      animate={reduce ? undefined : { y: [0, -7, 0] }}
                      transition={reduce ? undefined : { duration: 5 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
                      whileHover={{ scale: 1.07 }}
                      className={`relative overflow-hidden flex h-28 w-28 sm:h-32 sm:w-32 lg:h-36 lg:w-36 items-center justify-center rounded-full px-3 text-center font-playfair text-[15px] lg:text-lg leading-tight shadow-[0_10px_30px_rgba(0,0,0,0.08)] ${
                        src ? 'border border-black/15' : FABRIC_STYLES[i % FABRIC_STYLES.length]
                      }`}
                    >
                      {src ? (
                        <>
                          <img
                            src={src}
                            alt={name}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />
                          <span className="relative z-10 text-[#FBF7EE] font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                            {name}
                          </span>
                        </>
                      ) : (
                        name
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <FadeUp delay={0.1}>
            <p className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] font-semibold uppercase tracking-[0.22em] text-[#7A5F28]">
              {PROFILE.fabricTags.map((t, i) => (
                <span key={t} className="flex items-center gap-5">
                  {t}
                  {i < PROFILE.fabricTags.length - 1 && <span className="h-1.5 w-1.5 rounded-full bg-[#BEA266]" />}
                </span>
              ))}
            </p>
          </FadeUp>
        </div>

        {/* ── 3. Mission ────────────────────────────────────────── */}
        <div className="rounded-[2rem] md:rounded-[3rem] bg-black px-7 py-14 md:px-16 md:py-20">
          <FadeUp>
            <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DFC481]">
              <span className="h-px w-8 bg-[#BEA266]" />
              Our Mission
            </span>
          </FadeUp>
          <motion.p
            variants={wordsParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            className="font-playfair mt-8 max-w-5xl text-[26px] sm:text-4xl lg:text-5xl font-medium leading-[1.25] text-[#FBF7EE]"
          >
            {missionWords.map(({ w, hi }, i) => (
              <motion.span
                key={`${w}-${i}`}
                variants={wordChild}
                className={`inline-block mr-[0.27em] ${hi ? 'italic text-[#DFC481]' : ''}`}
              >
                {w}
              </motion.span>
            ))}
          </motion.p>
        </div>

        {/* ── 4. Product catalog (interactive) ──────────────────── */}
        <div>
          <FadeUp>
            <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A5F28]">
              <span className="h-px w-8 bg-[#BEA266]" />
              Product Categories
            </span>
          </FadeUp>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-20 items-start">
            <div role="tablist" aria-orientation="vertical" aria-label="Product categories" onKeyDown={onTabKey}>
              {PROFILE.catalog.map((cat, i) => {
                const on = i === active;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    role="tab"
                    id={`cat-tab-${i}`}
                    aria-selected={on}
                    aria-controls="cat-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    onMouseEnter={() => setActive(i)}
                    className="group relative flex w-full items-center justify-between gap-4 border-t border-black/15 py-6 md:py-7 pl-6 text-left last:border-b focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BEA266] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7EE]"
                  >
                    {on && (
                      <motion.span
                        layoutId="catBar"
                        className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-full bg-[#BEA266]"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className={`font-playfair text-4xl sm:text-5xl lg:text-6xl font-medium leading-none transition-colors duration-300 ${on ? 'text-black' : 'text-black/25 group-hover:text-black/55'}`}>
                      {cat.name}
                    </span>
                    <span className={`shrink-0 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${on ? 'text-[#7A5F28]' : 'text-black/30'}`}>
                      {cat.items.length} styles
                    </span>
                  </button>
                );
              })}
            </div>

            <div id="cat-panel" role="tabpanel" aria-labelledby={`cat-tab-${active}`} className="lg:min-h-[320px] lg:pt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-black/45">In {current.name}</p>
                  <motion.ul variants={pillsParent} initial="hidden" animate="show" className="mt-5 flex flex-wrap gap-3">
                    {current.items.map(item => (
                      <motion.li
                        key={item}
                        variants={pillChild}
                        className="rounded-full border border-black/15 bg-[#FBF7EE] px-5 py-3 text-[14px] md:text-[15px] text-black transition-colors duration-300 hover:border-black hover:bg-black hover:text-[#DFC481]"
                      >
                        {item}
                      </motion.li>
                    ))}
                  </motion.ul>
                  <Link
                    to="/products"
                    className="group mt-9 inline-flex items-center gap-3 rounded-full bg-black pl-7 pr-2 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#FBF7EE] transition-colors hover:bg-[#2A2014] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BEA266] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FBF7EE]"
                  >
                    Browse products
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#BEA266] text-black transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── 5. Office ─────────────────────────────────────────── */}
        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-center border-t border-black/15 pt-10 md:pt-12">
            <div className="flex items-start gap-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-[#DFC481]">
                <MapPin size={22} strokeWidth={1.5} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7A5F28]">Office Address</p>
                <address className="mt-3 not-italic font-playfair text-xl md:text-2xl leading-snug text-black">
                  {PROFILE.address.map(line => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </address>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-black/20 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:border-black hover:bg-black hover:text-[#DFC481] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BEA266]"
              >
                Get directions
                <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center rounded-full bg-[#BEA266] px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#DFC481] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
              >
                Contact us
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
};

export default AboutProfile;