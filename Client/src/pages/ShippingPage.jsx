import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, MapPin, Package, Clock } from 'lucide-react';
import Footer from '../components/Footer';
import { StaggeredText, EyebrowReveal } from '../components/animations';

const ShippingPage = () => {
  useEffect(() => {
    document.title = 'Shipping Policy — Twin A Apparels';
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
            <span className="text-brand-text">Shipping Policy</span>
          </nav>
          <StaggeredText
            as="h1"
            text="Shipping & Delivery"
            segmentBy="chars"
            startDelay={0.1}
            className="font-playfair text-h2 font-bold text-brand-text"
          />
          <StaggeredText
            as="p"
            text="Our premium packaging standards and courier timelines."
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
            <EyebrowReveal className="text-xs font-semibold text-brand-gold tracking-widest uppercase block">Global Logistics</EyebrowReveal>
            <StaggeredText
              as="h2"
              text="Delivering Elegance Safely"
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair text-3xl font-bold text-brand-text"
            />
            <StaggeredText
              as="p"
              text="We understand that the anticipation of receiving your luxury items is part of the experience. Whether you ordered the latest smart home devices, premium designer outerwear, or organic beauty essentials, every item is wrapped in custom eco-friendly packaging and dispatched via premium courier networks."
              segmentBy="words"
              blur={false}
              duration={0.4}
              startDelay={0.25}
              className="text-brand-grey text-sm md:text-base leading-relaxed text-justify"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-y border-brand-light py-8 my-10 text-center md:text-left">
            <div className="space-y-2">
              <Truck className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Free Shipping"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">Available for all domestic orders exceeding ₹1,499.</p>
            </div>
            <div className="space-y-2">
              <Package className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Atelier Packaged"
                segmentBy="chars"
                startDelay={0.15}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">Boxes double-wrapped and padded for extra security.</p>
            </div>
            <div className="space-y-2">
              <MapPin className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Tracked Transit"
                segmentBy="chars"
                startDelay={0.2}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">Live GPS link sent instantly upon dispatch.</p>
            </div>
            <div className="space-y-2">
              <Clock className="text-brand-gold w-8 h-8 mx-auto md:mx-0" />
              <StaggeredText
                as="h4"
                text="Delivery Speed"
                segmentBy="chars"
                startDelay={0.25}
                className="font-playfair text-sm font-semibold text-brand-text"
              />
              <p className="text-brand-grey text-xs text-justify">Metros: 2-4 business days. Others: 4-7 business days.</p>
            </div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <StaggeredText
                as="h3"
                text="1. Processing Timelines"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="Standard catalog products are dispatched from our warehouses within 24 to 48 hours of payment confirmation. Custom apparel items, pre-ordered electronics, or special decor orders may require longer processing times, which will be highlighted on the product page and during checkout."
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
                text="2. Shipping Charges"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="For domestic orders within India below ₹1,499, a flat shipping fee of ₹99 is added at checkout. International shipping charges are calculated dynamically based on package weight and destination country. Duty tariffs and customs fees, if applicable, are to be borne by the recipient."
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
                text="3. Transit Care & Insurance"
                segmentBy="chars"
                startDelay={0.1}
                className="font-playfair text-xl font-semibold text-brand-text"
              />
              <StaggeredText
                as="p"
                text="All high-value orders (specifically jewelry and electronics) are fully insured in transit by Twin A Apparels. A signature is required upon delivery to ensure that the luxury package is received safely by the rightful owner."
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

export default ShippingPage;
