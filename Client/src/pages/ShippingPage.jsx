import { Truck, MapPin, Package, Clock } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';

const HIGHLIGHTS = [
  { icon: Truck, title: 'Free Shipping', text: 'Available for all domestic orders exceeding ₹1,499.' },
  { icon: Package, title: 'Atelier Packaged', text: 'Boxes double-wrapped and padded for extra security.' },
  { icon: MapPin, title: 'Tracked Transit', text: 'Live GPS link sent instantly upon dispatch.' },
  { icon: Clock, title: 'Delivery Speed', text: 'Metros: 2-4 business days. Others: 4-7 business days.' },
];

const SECTIONS = [
  {
    id: 'processing',
    title: 'Processing Timelines',
    body: 'Standard catalog products are dispatched from our warehouses within 24 to 48 hours of payment confirmation. Custom apparel items, pre-ordered electronics, or special decor orders may require longer processing times, which will be highlighted on the product page and during checkout.',
  },
  {
    id: 'charges',
    title: 'Shipping Charges',
    body: 'For domestic orders within India below ₹1,499, a flat shipping fee of ₹99 is added at checkout. International shipping charges are calculated dynamically based on package weight and destination country. Duty tariffs and customs fees, if applicable, are to be borne by the recipient.',
  },
  {
    id: 'transit',
    title: 'Transit Care & Insurance',
    body: 'All high-value orders (specifically jewelry and electronics) are fully insured in transit by Twin A Apparels. A signature is required upon delivery to ensure that the luxury package is received safely by the rightful owner.',
  },
];

const ShippingPage = () => (
  <PolicyLayout
    docTitle="Shipping Policy — Twin A Apparels"
    path="/shipping"
    crumb="Shipping Policy"
    title="Shipping & Delivery"
    subtitle="Our premium packaging standards and courier timelines."
    eyebrow="Global Logistics"
    heading="Delivering Elegance Safely"
    intro="We understand that the anticipation of receiving your luxury items is part of the experience. Whether you ordered the latest smart home devices, premium designer outerwear, or organic beauty essentials, every item is wrapped in custom eco-friendly packaging and dispatched via premium courier networks."
    highlights={HIGHLIGHTS}
    sections={SECTIONS}
  />
);

export default ShippingPage;