import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, RefreshCw } from 'lucide-react';
import Footer from '../components/Footer';
import { StaggeredText, EyebrowReveal } from '../components/animations';

const PrivacyPage = () => {
  useEffect(() => {
    document.title = 'Privacy Policy';
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
            <span className="text-brand-text">Privacy Policy</span>
          </nav>
          <StaggeredText
            as="h1"
            text="Privacy Policy"
            segmentBy="chars"
            startDelay={0.1}
            className="font-playfair text-h2 font-bold text-brand-text"
          />
          <StaggeredText
            as="p"
            text="Our commitment to safeguarding your personal data and privacy."
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
            <EyebrowReveal className="text-xs font-semibold text-brand-gold tracking-widest uppercase block">Trust & Protection</EyebrowReveal>
            <StaggeredText
              as="h2"
              text="Security of Your Personal Space"
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair text-3xl font-bold text-brand-text"
            />
            <StaggeredText
              as="p"
              text="We believe that a secure and premium shopping experience is built on a foundation of absolute trust and transparency. We are deeply committed to protecting your privacy, securing your personal data, and giving you full control over how your information is handled. This comprehensive Privacy Policy details the exact mechanisms we use to collect, process, manage, and safeguard your personal information when you interact with our platform."
              segmentBy="words"
              blur={false}
              duration={0.4}
              startDelay={0.25}
              className="text-brand-grey text-sm md:text-base leading-relaxed text-justify"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-brand-light py-8 my-10">
            <div className="flex gap-4">
              <Shield className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <StaggeredText
                  as="h4"
                  text="Data Protection"
                  segmentBy="chars"
                  startDelay={0.15}
                  className="font-playfair text-sm font-semibold text-brand-text mb-1"
                />
                <p className="text-brand-grey text-xs text-justify">All sensitive account details and personal data are fully encrypted both in transit and at rest using industry-standard military-grade AES-256 protocols.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Lock className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <StaggeredText
                  as="h4"
                  text="Secure Checkout"
                  segmentBy="chars"
                  startDelay={0.2}
                  className="font-playfair text-sm font-semibold text-brand-text mb-1"
                />
                <p className="text-brand-grey text-xs text-justify">We partner exclusively with PCI-DSS compliant payment gateways to process transactions securely, ensuring that no credit or debit card details are ever stored on our servers.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <RefreshCw className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <StaggeredText
                  as="h4"
                  text="Privacy Control"
                  segmentBy="chars"
                  startDelay={0.25}
                  className="font-playfair text-sm font-semibold text-brand-text mb-1"
                />
                <p className="text-brand-grey text-xs text-justify">You retain complete control over your preferences, with the ability to instantly opt-out of marketing and promotional communications with a single click at any time.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="1. What We Collect"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="We only collect information that is essential for providing our services. This includes personal identifiers (such as your full name, email address, and telephone number), transactional details (including billing and shipping addresses, alongside secure payment parameters), and technical usage data (such as browser cookies and site navigation patterns) to enhance platform functionality."
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
                text="2. How We Use It"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Your information is used solely to facilitate your user journey. Key purposes include processing and delivering your orders, sending real-time shipping updates and notifications, optimizing our website design and performance based on user metrics, and dispatching curated marketing offers, which you will only receive if you have actively opted in."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed font-light text-justify"
              />
            </section>

            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="3. Data Sharing"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="We strictly adhere to a zero-selling policy: we do not sell, rent, or trade your personal data with third-party advertisers. We share your information exclusively with our trusted payment processing networks and logistics/delivery partners, and only to the minimal extent necessary to complete order fulfillment."
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
                text="4. Data Storage"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Your personal data is housed securely on enterprise-grade, encrypted cloud servers. We implement robust logical and physical access control restrictions, continuous system monitoring, and routine security audits to protect all stored user data in full alignment with international security standards."
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
                text="5. Customer Rights"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="You possess full ownership and control over your personal records. At any time, you have the right to request comprehensive access to the data we hold, request corrections to out-of-date or inaccurate information, or request the permanent deletion of your account and associated personal history by contacting our support team."
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
              text="Privacy Support Desk"
              segmentBy="chars"
              startDelay={0.1}
              className="font-playfair text-sm font-semibold text-brand-text mb-2"
            />
            <p className="text-brand-grey text-xs leading-relaxed text-justify">
              If you have any questions or concerns regarding this Privacy Policy, your statutory data rights, or if you wish to request data deletion, please contact our dedicated privacy support desk directly at <a href="mailto:privacy@example.com" className="text-brand-gold hover:underline">privacy@example.com</a> or reach out through our support helpline.
            </p>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
};

export default PrivacyPage;
