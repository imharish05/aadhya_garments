import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Footer from './Footer';
import Breadcrumb from './Breadcrumb';
import { StaggeredText, FadeUp } from './animations';

/**
 * Layout C (single column) — About-page style, simple.
 * Black hero → gold / black / white key-point cards → one centered column:
 * intro, then numbered sections (title on top, text below) → gold contact block.
 *
 * Same props as the other PolicyLayouts, so a page switches layout by
 * changing one import line.
 */
const POLICIES = [
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
  { to: '/shipping', label: 'Shipping' },
  { to: '/returns', label: 'Returns' },
  { to: '/cancellation', label: 'Cancellation' },
];

const CARD_THEMES = [
  { card: 'bg-[#BEA266] text-black', icon: 'bg-black text-[#DFC481]', sub: 'text-black/70' },
  { card: 'bg-black text-[#FBF7EE]', icon: 'bg-[#BEA266] text-black', sub: 'text-[#FBF7EE]/70' },
  { card: 'bg-white text-black', icon: 'bg-black text-[#DFC481]', sub: 'text-black/60' },
];

const CARD_COLS = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' };

const pad = n => String(n + 1).padStart(2, '0');

const PolicyLayout = ({
  docTitle, path, crumb, title, subtitle, eyebrow, heading, intro,
  highlights = [], callout, sections = [], contact,
}) => {
  useEffect(() => {
    document.title = docTitle;
    window.scrollTo(0, 0);
  }, [docTitle]);

  const Callout = callout;

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[#FBF7EE] font-inter text-black">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="bg-black text-[#FBF7EE]">
        <div className="mx-auto max-w-site px-6 pb-14 pt-8 md:px-12 md:pb-20 md:pt-10">
          <Breadcrumb crumbs={[{ label: crumb }]} tone="dark" />

          <div className="pt-12 text-center md:pt-16">
            <span className="inline-flex items-center gap-3 font-inter text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DFC481]">
              <span className="h-px w-8 bg-[#BEA266]" />
              {eyebrow}
              <span className="h-px w-8 bg-[#BEA266]" />
            </span>
            <StaggeredText
              as="h1"
              text={title}
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair mx-auto mt-5 max-w-4xl text-4xl font-medium leading-[1.08] text-[#FBF7EE] sm:text-5xl lg:text-7xl"
            />
            <StaggeredText
              as="p"
              text={subtitle}
              segmentBy="words"
              blur={false}
              duration={0.4}
              startDelay={0.25}
              className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-[#FBF7EE]/70 md:text-base"
            />
          </div>

          {/* policy switcher */}
          <nav aria-label="Policies" className="mt-10 overflow-x-auto scrollbar-hide md:mt-12">
            <ul className="mx-auto flex w-max gap-2">
              {POLICIES.map(p => {
                const current = p.to === path;
                return (
                  <li key={p.to}>
                    <Link
                      to={p.to}
                      aria-current={current ? 'page' : undefined}
                      className={`block rounded-full border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                        current
                          ? 'border-[#BEA266] bg-[#BEA266] text-black'
                          : 'border-white/25 text-[#FBF7EE]/80 hover:border-[#BEA266] hover:text-[#DFC481]'
                      }`}
                    >
                      {p.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </section>

      {/* ── Key points ─────────────────────────────────────────── */}
      {highlights.length > 0 && (
        <section className="mx-auto max-w-site px-6 pt-14 md:px-12 md:pt-20" aria-label="Key points">
          <ul className={`grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 ${CARD_COLS[highlights.length] || CARD_COLS[4]}`}>
            {highlights.map(({ icon: Icon, title: t, text }, i) => {
              const th = CARD_THEMES[i % CARD_THEMES.length];
              return (
                <li key={t}>
                  <FadeUp delay={i * 0.08} className="h-full">
                    <div className={`flex h-full flex-col rounded-[1.75rem] p-6 shadow-[0_14px_34px_rgba(0,0,0,0.1)] md:rounded-[2rem] md:p-7 ${th.card}`}>
                      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${th.icon}`}>
                        <Icon size={19} strokeWidth={1.6} />
                      </span>
                      <h3 className="font-playfair mt-6 text-xl font-medium leading-snug md:text-2xl">{t}</h3>
                      <p className={`mt-2 text-[13px] leading-relaxed ${th.sub}`}>{text}</p>
                    </div>
                  </FadeUp>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── One column: intro + sections ───────────────────────── */}
      <div className="mx-auto max-w-site px-6 py-14 md:px-12 md:py-20">
        {/* Intro */}
        <section aria-label="Overview">
          <StaggeredText
            as="h2"
            text={heading}
            segmentBy="words"
            startDelay={0.1}
            className="font-playfair text-3xl font-medium leading-[1.1] text-black sm:text-4xl lg:text-5xl"
          />
          <FadeUp delay={0.15}>
            <div className="mt-6 text-[15px] leading-relaxed text-[#5A4D38] md:text-base">{intro}</div>
          </FadeUp>

          {Callout && (
            <FadeUp className="mt-10">
              <div className="flex flex-col gap-5 rounded-[1.75rem] bg-black p-7 text-[#FBF7EE] sm:flex-row sm:items-start md:rounded-[2rem] md:p-9">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#BEA266] text-black">
                  <Callout.icon size={20} strokeWidth={1.6} />
                </span>
                <div>
                  <h3 className="font-playfair text-2xl font-medium">{Callout.title}</h3>
                  <div className="mt-3 text-[14px] leading-relaxed text-[#FBF7EE]/75 md:text-[15px]">{Callout.text}</div>
                  {Callout.list && (
                    <ul className="mt-4 space-y-2 text-[14px] text-[#FBF7EE]/80">
                      {Callout.list.map(li => (
                        <li key={li} className="flex gap-3">
                          <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#BEA266]" />
                          <span>{li}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </FadeUp>
          )}
        </section>

        {/* Numbered sections — title on top, text below */}
        <section className="mt-14 md:mt-20" aria-label="Details">
          <ol className="border-t border-black/15">
            {sections.map((s, i) => (
              <li key={s.id} id={s.id} className="scroll-mt-28 border-b border-black/15">
                <FadeUp>
                  <div className="py-9 md:py-12">
                    <div className="flex items-baseline gap-4">
                      <span className="font-playfair text-3xl leading-none text-[#BEA266] md:text-4xl">{pad(i)}</span>
                      <h3 className="font-playfair text-2xl font-medium leading-snug text-black md:text-3xl">{s.title}</h3>
                    </div>
                    <div className="mt-5 space-y-3 text-[15px] leading-relaxed text-[#5A4D38] md:text-base">
                      {typeof s.body === 'string' ? <p>{s.body}</p> : s.body}
                    </div>
                  </div>
                </FadeUp>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* ── Contact ────────────────────────────────────────────── */}
      {contact && (
        <section className="bg-[#BEA266] text-white" aria-label="Contact">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center md:px-12 md:py-24">
            <FadeUp>
              <h3 className="font-playfair text-4xl font-medium leading-[1.1] sm:text-5xl">{contact.title}</h3>
              <div className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-white [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-black">
                {contact.body}
              </div>
              {contact.action && (
                <Link
                  to={contact.action.to}
                  className="group mt-9 inline-flex items-center gap-3 rounded-full bg-black py-2 pl-8 pr-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#DFC481] transition-colors hover:bg-[#2A2014] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#BEA266]"
                >
                  {contact.action.label}
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BEA266] text-black transition-transform duration-300 group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </span>
                </Link>
              )}
            </FadeUp>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
};

export default PolicyLayout;