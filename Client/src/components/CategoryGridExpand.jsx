import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const Arrow = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-[12px] w-[12px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

const Chevron = ({ flip = false }) => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={flip ? { transform: "scaleX(-1)" } : undefined}
  >
    <path d="m9 6 6 6-6 6" />
  </svg>
);

const clamp = (v) => Math.max(0, Math.min(1, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const START_SCALE = 0.7; // stack card size at start
const BEGIN_AT = 0.95; // animation begins when row top reaches 95% of screen height
const SPAN = 0.6; // scroll distance (fraction of screen height) to finish expand
const SMOOTH = 0.14; // 0.05 = floaty, 0.3 = snappy

export default function CategoryGridExpand({ categories = [], allHref = "/products" }) {
  const trackRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const desktop = window.matchMedia("(min-width: 768px)");

    const track = trackRef.current;
    if (!track) return;

    const cards = [...track.children];
    const imgs = cards.map((c) => c.querySelector("[data-img]"));
    const chips = cards.map((c) => c.querySelector("[data-chip]"));

    let geo = [];
    let raf = null;
    let cur = 0;
    let target = 0;
    let animating = false;

    const measure = () => {
      const cw = track.clientWidth;
      const sl = track.scrollLeft;
      geo = cards.map((c) => ({
        dx: cw / 2 - (c.offsetLeft - sl + c.offsetWidth / 2),
        dy: (-(1 - START_SCALE) / 2) * c.offsetHeight,
      }));
    };

    const clear = () => {
      cards.forEach((card, i) => {
        card.style.transform = "";
        card.style.zIndex = "";
        if (imgs[i]) imgs[i].style.transform = "";
        if (chips[i]) chips[i].style.opacity = "";
      });
    };

    const apply = (p) => {
      const spread = easeOut(p);
      const inv = 1 - spread;
      const n = cards.length;

      if (spread >= 0.999) {
        clear();
        return;
      }
      cards.forEach((card, i) => {
        if (!geo[i]) return;
        const rot = (i - (n - 1) / 2) * 5 * inv;
        card.style.transform = `translate3d(${geo[i].dx * inv}px, ${geo[i].dy * inv}px, 0) rotate(${rot}deg) scale(${START_SCALE + (1 - START_SCALE) * spread})`;
        card.style.zIndex = n - i;
        if (imgs[i]) imgs[i].style.transform = `scale(${1.25 - 0.25 * spread})`;
        if (chips[i]) chips[i].style.opacity = clamp((spread - 0.55) / 0.45);
      });
    };

    const loop = () => {
      const diff = target - cur;
      if (Math.abs(diff) < 0.0008) {
        cur = target;
        apply(cur);
        raf = null;
        return;
      }
      cur += diff * SMOOTH;
      apply(cur);
      raf = requestAnimationFrame(loop);
    };

    const readTarget = () => {
      if (!desktop.matches) {
        if (animating) {
          animating = false;
          if (raf) cancelAnimationFrame(raf);
          raf = null;
          clear();
        }
        return;
      }
      if (!animating) {
        animating = true;
        measure();
      }
      const top = track.getBoundingClientRect().top;
      const vh = window.innerHeight;
      target = clamp((vh * BEGIN_AT - top) / (vh * SPAN));
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onResize = () => {
      measure();
      readTarget();
    };

    const ro = new ResizeObserver(() => {
      measure();
      if (desktop.matches) apply(cur);
    });
    ro.observe(track);

    measure();
    if (desktop.matches) {
      animating = true;
      cur = 0;
      apply(0);
    }
    readTarget();

    let scrollTicking = false;
    const onScroll = () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          readTarget();
          scrollTicking = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [categories]);

  const scrollByCards = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  const showArrows = categories.length > 3;

  const arrowBtn =
    "hidden md:grid absolute top-1/2 -translate-y-1/2 z-20 h-9 w-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-900 hover:text-white transition-colors active:scale-95";

  return (
    <div className="relative bg-white">
      <div className="mx-auto flex max-w-5xl flex-col px-4 py-10 md:px-5 md:py-12">
        {/* Header: centered, static */}
        <div className="mb-5 text-center">
          <h2 className="font-playfair text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">
            Shop by category
          </h2>
          <p className="mx-auto mt-1 hidden max-w-md text-sm sm:text-base text-neutral-600 sm:block font-montserrat">
            Six collections, each curated by our stylists.
          </p>
        </div>

        <div className={`relative ${showArrows ? "md:px-12" : ""}`}>
          {showArrows && (
            <>
              <button
                type="button"
                onClick={() => scrollByCards(-1)}
                aria-label="Previous categories"
                className={`${arrowBtn} left-0`}
              >
                <Chevron flip />
              </button>
              <button
                type="button"
                onClick={() => scrollByCards(1)}
                aria-label="Next categories"
                className={`${arrowBtn} right-0`}
              >
                <Chevron />
              </button>
            </>
          )}

          <div
            ref={trackRef}
            className="relative flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth px-1 -mx-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={cat.href}
                aria-label={`${cat.name}, ${cat.count} items`}
                className="group relative isolate aspect-[5/6] w-[62vw] sm:w-[42vw] md:w-[calc((100%-24px)/3)] shrink-0 snap-start overflow-hidden rounded-[18px] bg-neutral-200 text-white will-change-transform shadow-[0_8px_24px_rgba(0,0,0,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-neutral-900"
              >
                <div data-img className="absolute inset-0 -z-20 will-change-transform">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    onError={(e) => {
                      if (cat.fallbackImage && e.currentTarget.src !== cat.fallbackImage) {
                        e.currentTarget.src = cat.fallbackImage;
                      }
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/50 via-black/15 to-transparent to-60%" />
                <div
                  data-chip
                  className="absolute bottom-2.5 left-2.5 flex items-center gap-2 rounded-full bg-white/95 py-[5px] pl-3 pr-[5px] text-[13px] font-medium text-neutral-900 shadow-sm"
                >
                  <span>
                    {cat.name}{" "}
                    <small className="text-[11px] font-normal text-neutral-500">
                      {cat.count}
                    </small>
                  </span>
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-white transition-transform duration-300 group-hover:rotate-45">
                    <Arrow />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}