import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

/**
 * CategoryTree — categories with their subcategories, for the filter sidebar.
 *
 * props
 *  categories   tree from /categories/tree  ([{ id, name, slug, subcategories }])
 *  activeSlug   current category slug  ('' = All products)
 *  activeSub    current subcategory slug
 *  onNavigate   optional, called after a link is clicked (used to close the mobile sheet)
 *  scroll       true  = the list scrolls inside its own box (desktop sidebar)
 *               false = the list grows and the parent scrolls (mobile sheet)
 */
const SCROLL_CSS = `
.ct-scroll::-webkit-scrollbar{width:5px}
.ct-scroll::-webkit-scrollbar-track{background:transparent}
.ct-scroll::-webkit-scrollbar-thumb{background:#BEA266;border-radius:9999px}
`;

const CategoryTree = ({ categories = [], activeSlug = '', activeSub = '', onNavigate, scroll = false }) => {
  const [open, setOpen] = useState(activeSlug || null);
  const boxRef = useRef(null);

  // open the category that is active (e.g. after choosing from the URL / navbar)
  useEffect(() => {
    if (activeSlug) setOpen(activeSlug);
  }, [activeSlug]);

  // Keep the selected row visible inside the scroll box (without moving the page)
  useEffect(() => {
    const box = boxRef.current;
    if (!scroll || !box) return;
    const cur = box.querySelector('[aria-current="page"]');
    if (!cur) { box.scrollTop = 0; return; }
    const top = cur.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    box.scrollTo({ top: Math.max(0, top - box.clientHeight / 2 + cur.clientHeight / 2), behavior: 'smooth' });
  }, [activeSlug, activeSub, scroll, categories.length]);

  const list = categories.filter(c => c.isActive !== false);

  const rowBase = 'flex min-h-[44px] flex-1 items-center rounded-full px-4 py-2 font-inter text-[13px] transition-colors';

  return (
    <div
      ref={boxRef}
      className={scroll ? 'ct-scroll relative max-h-[min(20rem,38vh)] overflow-y-auto overscroll-contain pr-2' : ''}
      style={scroll ? { scrollbarWidth: 'thin', scrollbarColor: '#BEA266 transparent' } : undefined}
    >
      {scroll && <style>{SCROLL_CSS}</style>}
    <ul className="space-y-1">
      <li>
        <Link
          to="/products"
          onClick={onNavigate}
          aria-current={!activeSlug ? 'page' : undefined}
          className={`${rowBase} font-semibold ${!activeSlug ? 'bg-black text-[#DFC481]' : 'text-black hover:bg-black/5'}`}
        >
          All products
        </Link>
      </li>

      {list.map(cat => {
        const subs = (cat.subcategories || cat.children || []).filter(s => s.isActive !== false);
        const isActive = activeSlug === cat.slug;
        const isOpen = open === cat.slug;

        return (
          <li key={cat.id || cat.slug}>
            <div className="flex items-center gap-1">
              <Link
                to={`/category/${cat.slug}`}
                onClick={onNavigate}
                aria-current={isActive && !activeSub ? 'page' : undefined}
                className={`${rowBase} font-semibold ${
                  isActive && !activeSub ? 'bg-black text-[#DFC481]' : isActive ? 'text-black' : 'text-black hover:bg-black/5'
                }`}
              >
                {cat.name}
              </Link>
              {subs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : cat.slug)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${cat.name}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-black/60 transition-colors hover:bg-black/5 hover:text-black"
                >
                  <ChevronDown size={17} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {subs.length > 0 && isOpen && (
              <ul className="ml-5 mt-1 space-y-0.5 border-l border-[#BEA266]/50 pl-3">
                <li>
                  <Link
                    to={`/category/${cat.slug}`}
                    onClick={onNavigate}
                    className={`flex min-h-[38px] items-center rounded-full px-3.5 font-inter text-[13px] transition-colors ${
                      isActive && !activeSub ? 'font-semibold text-black' : 'text-black/60 hover:text-black'
                    }`}
                  >
                    All {cat.name}
                  </Link>
                </li>
                {subs.map(s => {
                  const subActive = isActive && activeSub === s.slug;
                  return (
                    <li key={s.id || s.slug}>
                      <Link
                        to={`/category/${cat.slug}/${s.slug}`}
                        onClick={onNavigate}
                        aria-current={subActive ? 'page' : undefined}
                        className={`flex min-h-[38px] items-center rounded-full px-3.5 font-inter text-[13px] transition-colors ${
                          subActive ? 'bg-black font-semibold text-[#DFC481]' : 'text-black/60 hover:bg-black/5 hover:text-black'
                        }`}
                      >
                        {s.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
    </div>
  );
};

export default CategoryTree;