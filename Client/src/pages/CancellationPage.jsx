import { XCircle, RefreshCw, CheckCircle } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';

const HIGHLIGHTS = [
  { icon: CheckCircle, title: 'Same-Day Window', text: 'Orders can be cancelled free of charge only on the same day they are placed.' },
  { icon: XCircle, title: 'Packed or Dispatched', text: 'Once the order is packed or dispatched, cancellation is not strictly permitted.' },
  { icon: RefreshCw, title: 'Support & Review', text: 'Submit requests with a valid reason through the website or support desk.' },
];

const SECTIONS = [
  {
    id: 'same-day',
    title: 'Same-Day Cancellation Window',
    body: 'Orders may only be cancelled on the same day they are placed, entirely free of charge. Once an order progresses to the packing stage or has been dispatched to our courier services, cancellations are strictly prohibited. In such scenarios, customers may refuse delivery at their doorstep or request a standard return post-delivery in accordance with our return guidelines.',
  },
  {
    id: 'process',
    title: 'Submission & Validation Process',
    body: 'To cancel an order, customers must raise a request directly through their account dashboard on our website or contact our support team within the cancellation window. All requests must contain a valid, clear reason for cancellation. If the reason provided is determined to be invalid, the cancellation request will be formally rejected, and the order will proceed to shipment.',
  },
  {
    id: 'by-us',
    title: 'Cancellations by Twin A Apparels',
    body: "In the rare event that Twin A Apparels must cancel an order due to stock unavailability, quality control failures, or any other internal operational constraint, a full refund will be automatically issued back to the original payment method. The refunded amount will typically reflect in your account within 5 to 7 business days, depending on your bank's processing cycles.",
  },
];

const CancellationPage = () => (
  <PolicyLayout
    docTitle="Cancellation Policy — Twin A Apparels"
    path="/cancellation"
    crumb="Cancellation Policy"
    title="Cancellation Policy"
    subtitle="Information on cancelling orders and associated processing fees."
    eyebrow="Order Control"
    heading="Flexible Order Management"
    intro="We are committed to providing a transparent and seamless order management experience. While we strive to process and dispatch all orders as quickly as possible, we understand that plans can change. Below is our formal policy outlining the conditions, procedures, and timelines governing order cancellations."
    highlights={HIGHLIGHTS}
    sections={SECTIONS}
  />
);

export default CancellationPage;