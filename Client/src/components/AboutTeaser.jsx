import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FadeUp, StaggeredText } from './animations';
import { ArchRings } from './Motifs';

/**
 * AboutTeaser — home page section that sends visitors to /about.
 * Palette from the Twin A logo: gold #BEA266 / light gold #DFC481 / deep brown #2A2014.
 * Right side: traditional photo inside an arch, with outline arch, circle and bloom shapes.
 */
const COPY = {
  eyebrow: 'Our Story',
  title: 'Meet the label behind every stitch.',
  body: 'Twin A Apparels is a Coimbatore label making clothes for the whole family. Take a minute to see who we are and what we stand for.',
  lines: ['Ladies', "Men's", 'Kids'],
  cta: 'Read our story',
  image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80',
  imageAlt: 'Traditional Indian wear from Twin A Apparels',
};

const AboutTeaser = () => (
  <section
    className="relative mx-3 sm:mx-6 lg:mx-10 my-10 md:my-16 text-[#2A2014] overflow-hidden"
    aria-label="About Twin A Apparels"
  >
    {/* faint background art */}
    <ArchRings className="pointer-events-none absolute -left-10 -bottom-6 h-64 w-52 opacity-[0.12] hidden md:block" />

    <div className="relative px-6 md:px-12 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 lg:gap-8 items-center">
      {/* Left: copy */}
      <div>
        <div className="inline-flex items-center gap-3 font-montserrat text-xs font-semibold uppercase tracking-[0.28em] text-[#DFC481] mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#BEA266]" />
          <StaggeredText as="span" text={COPY.eyebrow} segmentBy="words" blur={false} startDelay={0.05} />
        </div>

        <StaggeredText
          as="h2"
          text={COPY.title}
          startDelay={0.1}
          segmentBy="chars"
          className="font-playfair mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] max-w-2xl text-[#000]"
        />

        <StaggeredText
          as="p"
          text={COPY.body}
          startDelay={0.25}
          segmentBy="words"
          blur={false}
          duration={0.4}
          className="font-montserrat mt-6 max-w-xl text-[16px] leading-relaxed text-[#2A2014]/70 font-normal"
        />

        <FadeUp delay={0.4}>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
            <Link
              to="/about"
              className="group inline-flex items-center gap-3 rounded-full bg-[#BEA266] pl-7 pr-2 py-2 font-montserrat text-sm font-semibold uppercase tracking-[0.16em] text-[#2A2014] transition-colors duration-300 hover:bg-[#DFC481] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DFC481] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2A2014]"
            >
              {COPY.cta}
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2A2014] text-[#DFC481] transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </Link>

            <p className="font-montserrat text-xs uppercase tracking-[0.24em] text-[#DFC481]/80 font-medium">
              {COPY.lines.join('  ·  ')}
            </p>
          </div>
        </FadeUp>
      </div>

      {/* Right: arch photo + shapes */}
      <FadeUp delay={0.25} className="flex justify-center lg:justify-end">
        <Link
          to="/about"
          aria-label={COPY.cta}
          tabIndex={-1}
          className="group relative block w-64 sm:w-72 lg:w-80 focus:outline-none"
        >
          {/* outline arch, offset behind */}
          <span className="absolute inset-0 translate-x-4 translate-y-4 rounded-t-[999px] rounded-b-[2rem] border border-[#BEA266] transition-transform duration-500 group-hover:translate-x-6 group-hover:translate-y-6" />

          {/* gold circle behind top-left */}
          <span className="absolute -left-6 top-10 h-16 w-16 rounded-full bg-[#BEA266]" />

          {/* the photo */}
          <span className="relative block aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-[#3a2d1c]">
            <img
              src={COPY.image}
              alt={COPY.imageAlt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </span>
        </Link>
      </FadeUp>
    </div>
  </section>
);

export default AboutTeaser;
