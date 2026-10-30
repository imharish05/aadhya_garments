import { X } from 'lucide-react';

/**
 * ActiveFilters — removable chips for every filter that is switched on.
 * chips: [{ key, label, onRemove }]
 */
const ActiveFilters = ({ chips = [], onClearAll }) => {
  if (!chips.length) return null;
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map(c => (
        <li key={c.key}>
          <button
            type="button"
            onClick={c.onRemove}
            className="group flex items-center gap-2 rounded-full bg-black py-1.5 pl-3.5 pr-2 font-inter text-[11px] font-semibold tracking-[0.04em] text-[#DFC481] transition-colors hover:bg-[#2A2014]"
            aria-label={`Remove filter ${c.label}`}
          >
            {c.label}
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#BEA266] text-black transition-transform group-hover:rotate-90">
              <X size={11} strokeWidth={2.5} />
            </span>
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={onClearAll}
          className="px-2 font-inter text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A5F28] underline underline-offset-4 hover:text-black"
        >
          Clear all
        </button>
      </li>
    </ul>
  );
};

export default ActiveFilters;
