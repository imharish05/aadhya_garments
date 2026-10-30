import { RefreshCcw, HelpCircle, FileText, CheckCircle2 } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';

const HIGHLIGHTS = [
  { icon: RefreshCcw, title: '24-Hour Window', text: 'Initiate a return request within 24 hours of successful delivery.' },
  { icon: CheckCircle2, title: 'Individual Item Returns', text: 'Return specific products from multi-item orders without returning the whole order.' },
  { icon: FileText, title: 'Compulsory Video', text: 'Upload uncut unboxing video proof during the return submission.' },
  { icon: HelpCircle, title: '5-7 Day Refunds', text: 'Refunds are credited back to the source account or bank account after inspection.' },
];

const CALLOUT = {
  icon: FileText,
  title: 'Compulsory Unboxing Video Requirement',
  text: (
    <p>
      To prevent fraudulent claims and ensure swift replacement or refund processing, <strong>a continuous, uncut parcel opening (unboxing) video is strictly compulsory</strong> for all return and damaged item claims.
    </p>
  ),
  list: [
    'Record the video starting before the courier parcel seal/tape is cut or opened.',
    'Show all four sides of the outer packaging and ensure the shipping label with tracking ID is clearly visible.',
    'Record the unboxing and reveal of the product without pauses, edits, or camera angle cuts.',
    'Return requests submitted without unboxing video proof cannot be approved.',
  ],
};

const SECTIONS = [
  {
    id: 'eligibility',
    title: 'Return Eligibility & Individual Product Returns',
    body: (
      <p>
        We offer a strict 24-hour return window from the date and time of delivery. You may request returns for <strong>individual items</strong> in your order directly from your <strong>Delivered Orders</strong> page. Returns are accepted if an item is physically damaged upon arrival, defective, wrong product delivered, or mismatched with description. Each request requires an uncut opening video of the parcel.
      </p>
    ),
  },
  {
    id: 'exclusions',
    title: 'Exclusions & Non-Returnable Items',
    body: 'Products are ineligible for return under any of the following conditions: if the product has been used, altered, or if the original Twin A Apparels security seal is broken; if the original packaging, brand tags, instruction manuals, or accessories are missing; if no continuous unboxing video is provided; or if the item belongs to a non-returnable category for hygiene reasons (such as perfumes, innerwear, and personal care products).',
  },
  {
    id: 'pickup',
    title: 'Return Pickup & Logistics',
    body: 'Once your return request is validated and approved, our logistics team will coordinate reverse collection directly from your delivery address. Please pack the item securely in its original packaging along with all documentation.',
  },
  {
    id: 'refunds',
    title: 'Refund Processing & Timelines',
    body: 'After the returned product is received and inspected at our warehouse, refunds are initiated within 5 to 7 business days. Pre-paid orders are refunded back to the original payment source. For Cash on Delivery (COD) orders, refunds are transferred via NEFT/UPI to the bank account details provided during the return request.',
  },
];

const CONTACT = {
  title: 'Need to return an item or check status?',
  body: <p>Track active return requests in your account dashboard.</p>,
  action: { to: '/account/returns', label: 'View Returns & Refunds' },
};

const ReturnsPage = () => (
  <PolicyLayout
    docTitle="Returns & Refunds Policy — Twin A Apparels"
    path="/returns"
    crumb="Returns & Refunds"
    title="Returns & Refunds"
    subtitle="Our 24-hour return policy for damaged, incorrect, or mismatched orders."
    eyebrow="Our Guarantee"
    heading="Returns & Refunds Policy"
    intro={
      <p>
        We are committed to delivering products of the highest standard. If any product in your order arrives damaged, defective, or mismatched, you can request an <strong>individual product return</strong> within a strict 24-hour window from delivery.
      </p>
    }
    highlights={HIGHLIGHTS}
    callout={CALLOUT}
    sections={SECTIONS}
    contact={CONTACT}
  />
);

export default ReturnsPage;