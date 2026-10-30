import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, CreditCard, Award } from 'lucide-react';
import Footer from '../components/Footer';
import { StaggeredText, EyebrowReveal } from '../components/animations';

const TermsPage = () => {
  useEffect(() => {
    document.title = 'Terms & Conditions — Twin A Apparels';
    window.scrollTo(0, 0);
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-brand-bg text-brand-text">
      {/* Breadcrumb Banner */}
      <div className="bg-brand-light/30 border-y border-brand-light py-8">
        <div className="max-w-site mx-auto px-6 md:px-8">
          <nav className="text-xs text-brand-grey mb-2" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-brand-text">Terms & Conditions</span>
          </nav>
          <StaggeredText
            as="h1"
            text="Terms & Conditions"
            segmentBy="chars"
            startDelay={0.1}
            className="font-playfair text-h2 font-bold text-brand-text"
          />
          <StaggeredText
            as="p"
            text="Legal guidelines, terms of service, and user agreements governing Twin A Apparels."
            segmentBy="words"
            blur={false}
            duration={0.4}
            startDelay={0.2}
            className="text-brand-grey text-sm mt-1"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-site mx-auto px-6 md:px-8 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="space-y-6">
            <EyebrowReveal className="text-xs font-semibold text-brand-gold tracking-widest uppercase block">User Agreement</EyebrowReveal>
            <StaggeredText
              as="h2"
              text="Platform Terms of Use"
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair text-3xl font-bold text-brand-text"
            />
            <StaggeredText
              as="p"
              text="Welcome to Twin A Apparels. By accessing, browsing, or utilizing our website, mobile interfaces, and associated services, you acknowledge and agree to comply with and be bound by the following Terms & Conditions. Please read these terms carefully before placing an order or registering an account. If you do not agree with any part of these terms, you should promptly discontinue use of the platform."
              segmentBy="words"
              blur={false}
              duration={0.4}
              startDelay={0.25}
              className="text-brand-grey text-sm md:text-base leading-relaxed text-justify"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-y border-brand-light py-8 my-10 text-center md:text-left">
            <div className="space-y-2">
              <Scale className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Binding Agreement"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">Accessing and placing orders establishes a legally binding contract under applicable laws.</p>
            </div>
            <div className="space-y-2">
              <ShieldCheck className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Authenticity Assured"
                segmentBy="chars"
                startDelay={0.15}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">Every curated luxury apparel, jewelry, fragrance, and accessory item is 100% authentic.</p>
            </div>
            <div className="space-y-2">
              <CreditCard className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Secure Transactions"
                segmentBy="chars"
                startDelay={0.2}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">All payments are encrypted via certified PCI-DSS compliant payment gateways.</p>
            </div>
            <div className="space-y-2">
              <Award className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Customer First"
                segmentBy="chars"
                startDelay={0.25}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">Transparent policies, dedicated support, and swift dispute resolution mechanisms.</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="1. Acceptance of Terms & Eligibility"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify">
                By using this platform, you represent and warrant that you are at least 18 years of age or possess legal parental/guardian consent to enter into binding agreements. Your continued use of Twin A Apparels signifies continuous agreement with these terms, our <Link to="/privacy" className="text-brand-gold hover:underline">Privacy Policy</Link>, <Link to="/shipping" className="text-brand-gold hover:underline">Shipping Policy</Link>, <Link to="/returns" className="text-brand-gold hover:underline">Returns Policy</Link>, and <Link to="/cancellation" className="text-brand-gold hover:underline">Cancellation Policy</Link>.
              </p>
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="2. Account Registration & Security"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="When you create an account on Twin A Apparels, you agree to provide true, accurate, current, and complete information. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. If you suspect unauthorized access to your account, you must notify us immediately."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="3. Product Descriptions, Pricing & Availability"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="We make every effort to display product details, materials, colors, and imagery as accurately as possible. However, actual colors may vary slightly depending on monitor and display calibration. All product listings and prices are subject to change without prior notice. While we strive for absolute accuracy, typographical errors in pricing or availability may occasionally occur. In such instances, Twin A Apparels reserves the right to correct errors and cancel affected orders with full refunds."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="4. Orders, Payments & Invoicing"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Placing an order constitutes an offer to purchase the specified goods. Twin A Apparels reserves the right to accept, reject, or limit order quantities at our sole discretion. We accept major credit/debit cards, Net Banking, UPI, digital wallets, and Cash on Delivery (where applicable). All transactions are processed in Indian Rupees (INR) or supported regional currencies at prevailing conversion rates."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="5. Shipping, Delivery & Unboxing Verification"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Estimated delivery timelines are guidelines and may vary due to courier logistics, weather conditions, or customs clearance. As detailed in our policies, customers are required to record an uncut, continuous unboxing video upon receiving luxury and delicate packages to safeguard against transit damage or missing item claims."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="6. Intellectual Property Rights"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="All content published on Twin A Apparels—including text, graphics, logos, product photographs, digital assets, icons, audio/video clips, and software code—is the proprietary property of Twin A Apparels or its licensed partners and protected by applicable copyright, trademark, and intellectual property laws. Unauthorized reproduction, modification, or distribution is strictly prohibited."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="7. User Conduct & Prohibited Activities"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Users agree not to engage in fraudulent transactions, use automated data extraction bots or scrapers, tamper with site security, upload malicious code, or post unlawful, defamatory, or abusive content. Any violation may result in immediate suspension of account privileges and appropriate legal recourse."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="8. Limitation of Liability & Disclaimers"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="To the fullest extent permitted by law, Twin A Apparels and its directors, employees, affiliates, and agents shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of or inability to use the platform. Our aggregate liability for any claim arising out of a transaction is strictly limited to the purchase value of the product in question."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="9. Governing Law & Dispute Resolution"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="These Terms & Conditions shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes or claims arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in India."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="10. Modifications to Terms"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Twin A Apparels reserves the right to revise or update these Terms & Conditions at any time without prior individual notice. Any modifications become effective immediately upon posting to this page. Your continued use of the platform following updates represents full acceptance of the modified terms."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>
          </div>

          <div className="p-6 bg-brand-light/10 border border-brand-light">
            <StaggeredText
              as="h4"
              text="Legal & Compliance Inquiries"
              segmentBy="chars"
              startDelay={0.1}
              className="font-playfair text-sm font-semibold text-brand-text mb-2"
            />
            <p className="text-brand-grey text-xs leading-relaxed text-justify">
              If you have any questions, clarifications, or feedback regarding our Terms & Conditions or wish to report a legal or compliance concern, please reach out to our legal department at <a href="mailto:legal@twinapparels.com" className="text-brand-gold hover:underline">legal@twinapparels.com</a> or contact our customer support team directly at <a href="mailto:hello@twinapparels.com" className="text-brand-gold hover:underline">hello@twinapparels.com</a>.
            </p>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
};

export default TermsPage;
