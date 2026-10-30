import { Link } from 'react-router-dom';

/**
 * Breadcrumb — one simple trail used on every page (Products, Contact …).
 *
 * crumbs: [{ label, to }]  — Home is added automatically.
 * The LAST crumb is the current page and is not a link.
 * tone:   'light' for white backgrounds, 'dark' for black heroes.
 */
const TONES = {
  light: { link: 'text-black/50 hover:text-black', sep: 'text-black/25', current: 'text-black' },
  dark: { link: 'text-[#BFB08A] hover:text-white', sep: 'text-[#BFB08A]/50', current: 'text-white' },
};

const Breadcrumb = ({ crumbs = [], tone = 'light' }) => {
  const t = TONES[tone] || TONES.light;
  const all = [{ label: 'Home', to: '/' }, ...crumbs];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 font-inter text-[12px] tracking-[0.04em]">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              {last || !c.to ? (
                <span aria-current={last ? 'page' : undefined} className={`font-semibold ${t.current}`}>
                  {c.label}
                </span>
              ) : (
                <Link to={c.to} className={`transition-colors ${t.link}`}>
                  {c.label}
                </Link>
              )}
              {!last && <span className={t.sep} aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
