import PriceFilter from './PriceFilter';
import CategoryTree from './CategoryTree';

/**
 * FilterPanel — used in the desktop sidebar and the mobile bottom sheet.
 * Contains: Categories (with subcategories) and Price.
 *  - Collection moved to the toolbar (next to Sort).
 *  - Discount is commented out (kept below so it can be switched back on).
 */
export const COLLECTIONS = [
  { label: 'All', value: '' },
  { label: 'New Arrivals', value: 'newArrival' },
  { label: 'Best Sellers', value: 'bestSeller' },
];

export const DISCOUNTS = [
  { label: 'Any', value: '' },
  { label: 'Up to 10%', value: '1-10' },
  { label: 'Up to 25%', value: '1-25' },
  { label: 'Up to 50%', value: '1-50' },
  { label: 'Above 50%', value: '51-100' },
];

const Group = ({ title, children, className = '' }) => (
  <div className={className}>
    <h3 className="mb-5 flex items-center gap-3 font-inter text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7A5F28]">
      <span className="h-px w-6 bg-[#BEA266]" />
      {title}
    </h3>
    {children}
  </div>
);

/* Used only if the Discount block below is switched back on
const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`rounded-full border px-3.5 py-2 font-inter text-[11px] font-semibold tracking-[0.04em] transition-colors ${
      active ? 'border-black bg-black text-[#DFC481]' : 'border-black/20 bg-white text-black hover:border-black'
    }`}
  >
    {children}
  </button>
);
*/

const FilterPanel = ({
  categories,
  activeSlug,
  activeSub,
  onNavigate,
  treeScroll = false,
  priceMin,
  priceMax,
  valueMin,
  valueMax,
  onPrice,
  /* discountValue, onDiscount, */
}) => (
  <div>
    <Group title="Categories">
      <CategoryTree categories={categories} activeSlug={activeSlug} activeSub={activeSub} onNavigate={onNavigate} scroll={treeScroll} />
    </Group>

    {/* Discount — commented out for now
    <Group title="Discount">
      <div className="flex flex-wrap gap-2">
        {DISCOUNTS.map(d => (
          <Chip key={d.label} active={discountValue === d.value} onClick={() => onDiscount(d.value)}>
            {d.label}
          </Chip>
        ))}
      </div>
    </Group>
    */}

    <Group title="Price" className="mt-8 border-t border-black/10 pt-8">
      <PriceFilter priceMin={priceMin} priceMax={priceMax} valueMin={valueMin} valueMax={valueMax} onApply={onPrice} />
    </Group>
  </div>
);

export default FilterPanel;