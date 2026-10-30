import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { XCircle, RefreshCw, CheckCircle } from 'lucide-react';
import Footer from '../components/Footer';
import { StaggeredText, EyebrowReveal } from '../components/animations';

const CancellationPage = () => {
  useEffect(() => {
    document.title = 'Cancellation Policy — Twin A Apparels';
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
            <span className="text-brand-text">Cancellation Policy</span>
          </nav>
          <StaggeredText
            as="h1"
            text="Cancellation Policy"
            segmentBy="chars"
            startDelay={0.1}
            className="font-playfair text-h2 font-bold text-brand-text"
          />
          <StaggeredText
            as="p"
            text="Information on cancelling orders and associated processing fees."
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
            <EyebrowReveal className="text-xs font-semibold text-brand-gold tracking-widest uppercase block">Order Control</EyebrowReveal>
            <StaggeredText
              as="h2"
              text="Flexible Order Management"
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair text-3xl font-bold text-brand-text"
            />
            <StaggeredText
              as="p"
              text="We are committed to providing a transparent and seamless order management experience. While we strive to process and dispatch all orders as quickly as possible, we understand that plans can change. Below is our formal policy outlining the conditions, procedures, and timelines governing order cancellations."
              segmentBy="words"
              blur={false}
              duration={0.4}
              startDelay={0.25}
              className="text-brand-grey text-sm md:text-base leading-relaxed text-justify"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-brand-light py-8 my-10">
            <div className="flex gap-4">
              <CheckCircle className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <StaggeredText
                  as="h4"
                  text="Same-Day Window"
                  segmentBy="chars"
                  startDelay={0.1}
                  className="font-playfair text-sm font-semibold text-brand-text mb-1"
                />
                <p className="text-brand-grey text-xs text-justify">Orders can be cancelled free of charge only on the same day they are placed.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <XCircle className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <StaggeredText
                  as="h4"
                  text="Packed or Dispatched"
                  segmentBy="chars"
                  startDelay={0.15}
                  className="font-playfair text-sm font-semibold text-brand-text mb-1"
                />
                <p className="text-brand-grey text-xs text-justify">Once the order is packed or dispatched, cancellation is not strictly permitted.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <RefreshCw className="text-brand-gold w-6 h-6 flex-shrink-0" />
              <div>
                <StaggeredText
                  as="h4"
                  text="Support & Review"
                  segmentBy="chars"
                  startDelay={0.2}
                  className="font-playfair text-sm font-semibold text-brand-text mb-1"
                />
                <p className="text-brand-grey text-xs text-justify">Submit requests with a valid reason through the website or support desk.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="1. Same-Day Cancellation Window"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Orders may only be cancelled on the same day they are placed, entirely free of charge. Once an order progresses to the packing stage or has been dispatched to our courier services, cancellations are strictly prohibited. In such scenarios, customers may refuse delivery at their doorstep or request a standard return post-delivery in accordance with our return guidelines."
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
                text="2. Submission & Validation Process"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="To cancel an order, customers must raise a request directly through their account dashboard on our website or contact our support team within the cancellation window. All requests must contain a valid, clear reason for cancellation. If the reason provided is determined to be invalid, the cancellation request will be formally rejected, and the order will proceed to shipment."
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
                text="3. Cancellations by Twin A Apparels"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="In the rare event that Twin A Apparels must cancel an order due to stock unavailability, quality control failures, or any other internal operational constraint, a full refund will be automatically issued back to the original payment method. The refunded amount will typically reflect in your account within 5 to 7 business days, depending on your bank's processing cycles."
                segmentBy="words"
                blur={false}
                duration={0.4}
                startDelay={0.2}
                className="text-brand-grey text-xs md:text-sm leading-relaxed text-justify"
              />
            </section>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
};

export default CancellationPage;
