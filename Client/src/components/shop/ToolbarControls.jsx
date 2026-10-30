import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * Toolbar buttons for the product listing.
 *  - Phone (<640px): round icon-only buttons, tap to open
 *  - Tablet / desktop: icon + label + current value, always visible
 *  - A gold dot on the icon tells you a non-default choice is active
 */
const PILL =
  'group relative flex h-11 items-center rounded-full border bg-white px-[11px] text-black transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BEA266] focus-visible:ring-offset-2';

const Label = ({ label, value }) => (
  // phone: hidden (icon only)  ·  tablet/desktop: always visible
  <span className="hidden whitespace-nowrap font-inter text-[12px] sm:ml-2.5 sm:mr-2 sm:inline">
    <span className="font-semibold uppercase tracking-[0.14em] text-black/50">{label}</span>
    {value ? <span className="ml-1.5 font-semibold">{value}</span> : null}
  </span>
);

const Dot = ({ show }) =>
  show ? (
    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#BEA266] ring-2 ring-white" aria-hidden="true" />
  ) : null;

/** Button that opens a small list of choices */
export const ToolbarMenu = ({ id, icon: Icon, label, options, value, onChange, active = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current?.label || ''}`}
        className={`${PILL} ${open ? 'border-black' : 'border-black/20 hover:border-black'}`}
      >
        <Icon size={20} strokeWidth={1.7} className="shrink-0" />
        <Label label={label} value={current?.label} />
        <Dot show={active} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full z-30 mt-2 w-max min-w-[210px] max-w-[calc(100vw-3rem)] rounded-2xl border border-black/10 bg-white p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.14)]"
          >
            {options.map(o => {
              const selected = o.value === value;
              return (
                <li key={o.value || 'all'}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={`flex w-full items-center justify-between gap-6 rounded-xl px-3.5 py-3 text-left font-inter text-[13px] transition-colors ${
                      selected ? 'bg-black font-semibold text-[#DFC481]' : 'text-black hover:bg-black/5'
                    }`}
                  >
                    {o.label}
                    {selected && <Check size={15} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Plain action button (e.g. open the filters sheet) */
export const ToolbarButton = ({ id, icon: Icon, label, value, onClick, active = false, className = '' }) => (
  <button
    type="button"
    id={id}
    onClick={onClick}
    aria-label={label}
    className={`${PILL} border-black/20 hover:border-black ${className}`}
  >
    <Icon size={20} strokeWidth={1.7} className="shrink-0" />
    <Label label={label} value={value} />
    <Dot show={active} />
  </button>
);