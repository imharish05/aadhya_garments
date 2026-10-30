import { Shield, Lock, RefreshCw } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';

const HIGHLIGHTS = [
  { icon: Shield, title: 'Data Protection', text: 'All sensitive account details and personal data are fully encrypted both in transit and at rest using industry-standard military-grade AES-256 protocols.' },
  { icon: Lock, title: 'Secure Checkout', text: 'We partner exclusively with PCI-DSS compliant payment gateways to process transactions securely, ensuring that no credit or debit card details are ever stored on our servers.' },
  { icon: RefreshCw, title: 'Privacy Control', text: 'You retain complete control over your preferences, with the ability to instantly opt-out of marketing and promotional communications with a single click at any time.' },
];

const SECTIONS = [
  {
    id: 'collect',
    title: 'What We Collect',
    body: 'We only collect information that is essential for providing our services. This includes personal identifiers (such as your full name, email address, and telephone number), transactional details (including billing and shipping addresses, alongside secure payment parameters), and technical usage data (such as browser cookies and site navigation patterns) to enhance platform functionality.',
  },
  {
    id: 'use',
    title: 'How We Use It',
    body: 'Your information is used solely to facilitate your user journey. Key purposes include processing and delivering your orders, sending real-time shipping updates and notifications, optimizing our website design and performance based on user metrics, and dispatching curated marketing offers, which you will only receive if you have actively opted in.',
  },
  {
    id: 'sharing',
    title: 'Data Sharing',
    body: 'We strictly adhere to a zero-selling policy: we do not sell, rent, or trade your personal data with third-party advertisers. We share your information exclusively with our trusted payment processing networks and logistics/delivery partners, and only to the minimal extent necessary to complete order fulfillment.',
  },
  {
    id: 'storage',
    title: 'Data Storage',
    body: 'Your personal data is housed securely on enterprise-grade, encrypted cloud servers. We implement robust logical and physical access control restrictions, continuous system monitoring, and routine security audits to protect all stored user data in full alignment with international security standards.',
  },
  {
    id: 'rights',
    title: 'Customer Rights',
    body: 'You possess full ownership and control over your personal records. At any time, you have the right to request comprehensive access to the data we hold, request corrections to out-of-date or inaccurate information, or request the permanent deletion of your account and associated personal history by contacting our support team.',
  },
];

const CONTACT = {
  title: 'Privacy Support Desk',
  body: (
    <p>
      If you have any questions or concerns regarding this Privacy Policy, your statutory data rights, or if you wish to request data deletion, please contact our dedicated privacy support desk directly at <a href="mailto:privacy@example.com">privacy@example.com</a> or reach out through our support helpline.
    </p>
  ),
};

const PrivacyPage = () => (
  <PolicyLayout
    docTitle="Privacy Policy"
    path="/privacy"
    crumb="Privacy Policy"
    title="Privacy Policy"
    subtitle="Our commitment to safeguarding your personal data and privacy."
    eyebrow="Trust & Protection"
    heading="Security of Your Personal Space"
    intro="We believe that a secure and premium shopping experience is built on a foundation of absolute trust and transparency. We are deeply committed to protecting your privacy, securing your personal data, and giving you full control over how your information is handled. This comprehensive Privacy Policy details the exact mechanisms we use to collect, process, manage, and safeguard your personal information when you interact with our platform."
    highlights={HIGHLIGHTS}
    sections={SECTIONS}
    contact={CONTACT}
  />
);

export default PrivacyPage;