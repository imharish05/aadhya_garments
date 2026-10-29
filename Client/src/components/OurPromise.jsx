import { Truck, Lock, Headphones } from 'lucide-react';
import { FadeUp } from './animations';

/** EDIT COPY HERE ↓ */
const PROMISES = [
  { icon: Truck, title: 'Complimentary Shipping', text: 'Insured delivery across India' },
  { icon: Lock, title: 'Secured Transactions', text: 'Safe and encrypted checkout' },
  { icon: Headphones, title: 'Dedicated Support', text: 'Expert assistance at your service' },
];

/** Thin gold rule with a centre diamond */
const Ornament = () => (
  <div className="flex items-center gap-3 max-w-site mx-auto px-6 md:px-8" aria-hidden="true">
    <span className="h-px flex-1 bg-brand-gold/40" />
    <span className="h-2 w-2 rotate-45 bg-brand-gold" />
    <span className="h-px flex-1 bg-brand-gold/40" />
  </div>
);

const OurPromise = () => (
  <section className="bg-[#FBF7EE]" aria-label="Our promise">
    <Ornament />
    <FadeUp className="max-w-site mx-auto px-6 md:px-8 py-9 md:py-11">
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-brand-gold/25">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-4 md:justify-center md:px-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand-gold/50 text-brand-gold">
              <Icon size={20} strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="font-inter text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-900">
                {title}
              </h3>
              <p className="font-inter mt-1 text-[13px] text-neutral-500">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </FadeUp>
    <Ornament />
  </section>
);

export default OurPromise;