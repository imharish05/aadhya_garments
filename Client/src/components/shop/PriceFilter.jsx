import { useState, useEffect, useCallback } from 'react';

/**
 * PriceFilter — dual slider + typed min / max.
 * The filter only fires on release / blur / Enter, never while dragging.
 *
 * props
 *  priceMin, priceMax   full range from the database
 *  valueMin, valueMax   currently applied range
 *  onApply(min, max)    called with the new range
 */
const SLIDER_CSS = `
.pf-range{position:absolute;left:0;width:100%;height:24px;margin:0;background:transparent;pointer-events:none;-webkit-appearance:none;appearance:none}
.pf-range::-webkit-slider-runnable-track{background:transparent;height:24px}
.pf-range::-moz-range-track{background:transparent;height:24px}
.pf-range::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:all;width:22px;height:22px;margin-top:1px;border-radius:9999px;background:#BEA266;border:3px solid #000;cursor:grab;transition:transform .15s}
.pf-range::-moz-range-thumb{pointer-events:all;width:16px;height:16px;border-radius:9999px;background:#BEA266;border:3px solid #000;cursor:grab}
.pf-range:active::-webkit-slider-thumb{transform:scale(1.15);cursor:grabbing}
.pf-range:focus-visible::-webkit-slider-thumb{box-shadow:0 0 0 4px rgba(190,162,102,.45)}
`;

const PriceFilter = ({ priceMin = 0, priceMax = 50000, valueMin, valueMax, onApply }) => {
  const [min, setMin] = useState(valueMin ?? priceMin);
  const [max, setMax] = useState(valueMax ?? priceMax);

  useEffect(() => {
    setMin(valueMin ?? priceMin);
    setMax(valueMax ?? priceMax);
  }, [valueMin, valueMax, priceMin, priceMax]);

  const span = Math.max(priceMax - priceMin, 1);
  const step = Math.max(1, Math.floor(span / 200));
  const left = ((min - priceMin) / span) * 100;
  const right = 100 - ((max - priceMin) / span) * 100;

  const commit = useCallback((a = min, b = max) => onApply(a, b), [min, max, onApply]);

  const clampAndCommit = () => {
    let a = Math.min(Math.max(Number(min) || priceMin, priceMin), priceMax);
    let b = Math.min(Math.max(Number(max) || priceMax, priceMin), priceMax);
    if (a > b) [a, b] = [b, a];
    setMin(a);
    setMax(b);
    commit(a, b);
  };

  const onMin = e => setMin(Math.min(Number(e.target.value), max - step));
  const onMax = e => setMax(Math.max(Number(e.target.value), min + step));

  const filtered = min > priceMin || max < priceMax;

  return (
    <div className="select-none">
      <style>{SLIDER_CSS}</style>

      {/* slider */}
      <div className="relative mx-2.5 flex h-6 items-center">
        <div className="absolute h-[3px] w-full rounded-full bg-black/15" />
        <div className="absolute h-[3px] rounded-full bg-black" style={{ left: `${left}%`, right: `${right}%` }} />
        <input
          type="range"
          className="pf-range"
          min={priceMin}
          max={priceMax}
          step={step}
          value={min}
          onChange={onMin}
          onPointerUp={() => commit()}
          onKeyUp={() => commit()}
          style={{ zIndex: min > priceMax - span * 0.1 ? 5 : 3 }}
          aria-label="Minimum price"
        />
        <input
          type="range"
          className="pf-range"
          min={priceMin}
          max={priceMax}
          step={step}
          value={max}
          onChange={onMax}
          onPointerUp={() => commit()}
          onKeyUp={() => commit()}
          style={{ zIndex: 4 }}
          aria-label="Maximum price"
        />
      </div>

      {/* typed values: label on top, full-width box, nothing gets cropped */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { label: 'Min price', val: min, set: setMin },
          { label: 'Max price', val: max, set: setMax },
        ].map(f => (
          <label key={f.label} className="block">
            <span className="mb-1.5 block font-inter text-[10px] font-semibold uppercase tracking-[0.18em] text-black/50">
              {f.label}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-black/20 bg-white px-4 py-2.5 transition-colors focus-within:border-black">
              <span className="font-inter text-[13px] text-black/50">₹</span>
              <input
                type="number"
                inputMode="numeric"
                value={f.val}
                min={priceMin}
                max={priceMax}
                onChange={e => f.set(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={clampAndCommit}
                onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full min-w-0 bg-transparent font-inter text-[14px] font-semibold text-black outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                aria-label={f.label}
              />
            </span>
          </label>
        ))}
      </div>

      {filtered && (
        <button
          type="button"
          onClick={() => onApply(priceMin, priceMax)}
          className="mt-4 font-inter text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A5F28] underline underline-offset-4 hover:text-black"
        >
          Reset price
        </button>
      )}
    </div>
  );
};

export default PriceFilter;