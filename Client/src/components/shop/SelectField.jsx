import { ChevronDown } from 'lucide-react';

/**
 * SelectField — small labelled dropdown (native select, styled).
 * options: [{ value, label }]
 */
const SelectField = ({ id, label, value, onChange, options = [], className = '' }) => (
  <div className={className}>
    <label htmlFor={id} className="mb-1.5 block font-inter text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50">
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none truncate rounded-full border border-black/20 bg-white py-3 pl-5 pr-11 font-inter text-[13px] font-medium text-black outline-none transition-colors hover:border-black focus:border-black"
      >
        {options.map(o => (
          <option key={`${o.value}`} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-black/60" />
    </div>
  </div>
);

export default SelectField;
