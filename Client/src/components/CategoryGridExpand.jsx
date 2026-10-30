import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { StaggeredText } from "./animations";

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
    const n = cards.length;

    let geo = [];
    let trackTop = 0;
    let isFullyExpanded = false;
    let lastSpread = -1;

    const measure = () => {
      // Clear inline transform to measure clean resting coordinates
      cards.forEach((card, i) => {
        card.style.transform = "";
        if (imgs[i]) imgs[i].style.transform = "";
      });
      const cw = track.clientWidth;
      const sl = track.scrollLeft;
      geo = cards.map((c) => ({
        dx: cw / 2 - (c.offsetLeft - sl + c.offsetWidth / 2),
        dy: (-(1 - START_SCALE) / 2) * c.offsetHeight,
      }));
      const rect = track.getBoundingClientRect();
      trackTop = rect.top + window.scrollY;
    };

    const clear = () => {
      cards.forEach((card, i) => {
        card.style.transform = "";
        card.style.zIndex = "";
        card.style.willChange = "auto";
        if (imgs[i]) {
          imgs[i].style.transform = "";
          imgs[i].style.willChange = "auto";
        }
        if (chips[i]) chips[i].style.opacity = "";
      });
      isFullyExpanded = true;
      lastSpread = 1;
    };

    const apply = (p) => {
      const spread = easeOut(p);
      // Skip redundant DOM writes if spread has not noticeably moved
      if (Math.abs(spread - lastSpread) < 0.001) return;
      lastSpread = spread;

      if (spread >= 0.995) {
        clear();
        return;
      }

      isFullyExpanded = false;
      const inv = 1 - spread;

      cards.forEach((card, i) => {
        if (!geo[i]) return;
        const rot = (i - (n - 1) / 2) * 5 * inv;
        card.style.willChange = "transform";
        card.style.zIndex = n - i;
        card.style.transform = `translate3d(${geo[i].dx * inv}px, ${geo[i].dy * inv}px, 0) rotate(${rot}deg) scale(${START_SCALE + (1 - START_SCALE) * spread})`;
        if (imgs[i]) {
          imgs[i].style.willChange = "transform";
          imgs[i].style.transform = `scale(${1.25 - 0.25 * spread})`;
        }
        if (chips[i]) {
          chips[i].style.opacity = clamp((spread - 0.55) / 0.45);
        }
      });
    };

    const update = () => {
      if (!desktop.matches) {
        if (!isFullyExpanded) clear();
        return;
      }

      const top = trackTop - window.scrollY;
      const vh = window.innerHeight;

      // If user has scrolled well past the section and it is already expanded, do zero work
      if (top < -vh * 0.5 && isFullyExpanded) return;

      const target = clamp((vh * BEGIN_AT - top) / (vh * SPAN));

      // Skip DOM updates if already expanded and target is fully reached
      if (target >= 0.995 && isFullyExpanded) return;

      apply(target);
    };

    const onResize = () => {
      measure();
      update();
    };

    const ro = new ResizeObserver(() => {
      measure();
      if (desktop.matches) update();
    });
    ro.observe(track);

    measure();
    if (desktop.matches) {
      update();
    }

    let scrollTicking = false;
    const onScroll = () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          update();
          scrollTicking = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onResize);
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
        {/* Header: centered */}
        <div className="mb-5 text-center">
          <StaggeredText
            as="h2"
            text="Shop by category"
            segmentBy="words"
            startDelay={0.1}
            className="font-playfair text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900"
          />
          <StaggeredText
            as="p"
            text="Six collections, each curated by our stylists."
            segmentBy="words"
            blur={false}
            duration={0.4}
            startDelay={0.25}
            className="mx-auto mt-1 hidden max-w-md text-sm sm:text-base text-neutral-600 sm:block font-montserrat"
          />
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
                className="group relative isolate aspect-[5/6] w-[62vw] sm:w-[42vw] md:w-[calc((100%-24px)/3)] shrink-0 snap-start overflow-hidden rounded-[18px] bg-neutral-200 text-white shadow-[0_8px_24px_rgba(0,0,0,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-neutral-900"
              >
                <div data-img className="absolute inset-0 -z-20">
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