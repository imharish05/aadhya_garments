import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, CreditCard, Award } from 'lucide-react';
import PolicyLayout from '../components/PolicyLayout';

const HIGHLIGHTS = [
  { icon: Scale, title: 'Binding Agreement', text: 'Accessing and placing orders establishes a legally binding contract under applicable laws.' },
  { icon: ShieldCheck, title: 'Authenticity Assured', text: 'Every curated luxury apparel, jewelry, fragrance, and accessory item is 100% authentic.' },
  { icon: CreditCard, title: 'Secure Transactions', text: 'All payments are encrypted via certified PCI-DSS compliant payment gateways.' },
  { icon: Award, title: 'Customer First', text: 'Transparent policies, dedicated support, and swift dispute resolution mechanisms.' },
];

const link = 'text-brand-gold hover:underline';

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms & Eligibility',
    body: (
      <p>
        By using this platform, you represent and warrant that you are at least 18 years of age or possess legal parental/guardian consent to enter into binding agreements. Your continued use of Twin A Apparels signifies continuous agreement with these terms, our <Link to="/privacy" className={link}>Privacy Policy</Link>, <Link to="/shipping" className={link}>Shipping Policy</Link>, <Link to="/returns" className={link}>Returns Policy</Link>, and <Link to="/cancellation" className={link}>Cancellation Policy</Link>.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'Account Registration & Security',
    body: 'When you create an account on Twin A Apparels, you agree to provide true, accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. If you suspect unauthorized access to your account, you must notify us immediately.',
  },
  {
    id: 'products',
    title: 'Product Descriptions, Pricing & Availability',
    body: 'We make every effort to display product details, materials, colors, and imagery as accurately as possible. However, actual colors may vary slightly depending on monitor and display calibration. All product listings and prices are subject to change without prior notice. While we strive for absolute accuracy, typographical errors in pricing or availability may occasionally occur. In such instances, Twin A Apparels reserves the right to correct errors and cancel affected orders with full refunds.',
  },
  {
    id: 'orders',
    title: 'Orders, Payments & Invoicing',
    body: 'Placing an order constitutes an offer to purchase the specified goods. Twin A Apparels reserves the right to accept, reject, or limit order quantities at our sole discretion. We accept major credit/debit cards, Net Banking, UPI, digital wallets, and Cash on Delivery (where applicable). All transactions are processed in Indian Rupees (INR) or supported regional currencies at prevailing conversion rates.',
  },
  {
    id: 'delivery',
    title: 'Shipping, Delivery & Unboxing Verification',
    body: 'Estimated delivery timelines are guidelines and may vary due to courier logistics, weather conditions, or customs clearance. As detailed in our policies, customers are required to record an uncut, continuous unboxing video upon receiving luxury and delicate packages to safeguard against transit damage or missing item claims.',
  },
  {
    id: 'ip',
    title: 'Intellectual Property Rights',
    body: 'All content published on Twin A Apparels—including text, graphics, logos, product photographs, digital assets, icons, audio/video clips, and software code—is the proprietary property of Twin A Apparels or its licensed partners and protected by applicable copyright, trademark, and intellectual property laws. Unauthorized reproduction, modification, or distribution is strictly prohibited.',
  },
  {
    id: 'conduct',
    title: 'User Conduct & Prohibited Activities',
    body: 'Users agree not to engage in fraudulent transactions, use automated data extraction bots or scrapers, tamper with site security, upload malicious code, or post unlawful, defamatory, or abusive content. Any violation may result in immediate suspension of account privileges and appropriate legal recourse.',
  },
  {
    id: 'liability',
    title: 'Limitation of Liability & Disclaimers',
    body: 'To the fullest extent permitted by law, Twin A Apparels and its directors, employees, affiliates, and agents shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of or inability to use the platform. Our aggregate liability for any claim arising out of a transaction is strictly limited to the purchase value of the product in question.',
  },
  {
    id: 'law',
    title: 'Governing Law & Dispute Resolution',
    body: 'These Terms & Conditions shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes or claims arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in India.',
  },
  {
    id: 'changes',
    title: 'Modifications to Terms',
    body: 'Twin A Apparels reserves the right to revise or update these Terms & Conditions at any time without prior individual notice. Any modifications become effective immediately upon posting to this page. Your continued use of the platform following updates represents full acceptance of the modified terms.',
  },
];

const CONTACT = {
  title: 'Legal & Compliance Inquiries',
  body: (
    <p>
      If you have any questions, clarifications, or feedback regarding our Terms & Conditions or wish to report a legal or compliance concern, please reach out to our legal department at <a href="mailto:legal@twinapparels.com">legal@twinapparels.com</a> or contact our customer support team directly at <a href="mailto:hello@twinapparels.com">hello@twinapparels.com</a>.
    </p>
  ),
};

const TermsPage = () => (
  <PolicyLayout
    docTitle="Terms & Conditions — Twin A Apparels"
    path="/terms"
    crumb="Terms & Conditions"
    title="Terms & Conditions"
    subtitle="Legal guidelines, terms of service, and user agreements governing Twin A Apparels."
    eyebrow="User Agreement"
    heading="Platform Terms of Use"
    intro="Welcome to Twin A Apparels. By accessing, browsing, or utilizing our website, mobile interfaces, and associated services, you acknowledge and agree to comply with and be bound by the following Terms & Conditions. Please read these terms carefully before placing an order or registering an account. If you do not agree with any part of these terms, you should promptly discontinue use of the platform."
    highlights={HIGHLIGHTS}
    sections={SECTIONS}
    contact={CONTACT}
  />
);

export default TermsPage;