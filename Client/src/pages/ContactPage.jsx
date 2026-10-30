import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import Footer from '../components/Footer';
import Breadcrumb from '../components/Breadcrumb';
import { FadeUp, EyebrowReveal, StaggeredText } from '../components/animations';
import PhoneInput from '../components/PhoneInput';
import { validatePhoneNumber } from '../utils/validation';

/* ────────────────────────────────────────────────────────────────────────────
   Twin A Apparels — Contact page (same look as the About page)
   Palette: logo black + gold. Fonts: font-playfair + font-inter only.
   EDIT CONTACT DETAILS HERE ↓  (address / phone / emails are still the old
   template values — replace them with your real ones)
──────────────────────────────────────────────────────────────────────────── */
const CONTACT = {
  hero: {
    eyebrow: 'Get in touch',
    title: 'Contact Us',
    text: 'Questions, orders or wholesale enquiries. Write to us and our team will reply.',
  },
  cards: [
    {
      icon: MapPin,
      title: 'Visit us',
      lines: ['14 Linking Road, Bandra West,', 'Mumbai, Maharashtra 400050'],
      theme: 'gold',
    },
    {
      icon: Phone,
      title: 'Call us',
      lines: [{ text: '+91 99999 99999', href: 'tel:+919999999999' }],
      theme: 'black',
    },
    {
      icon: Mail,
      title: 'Email us',
      lines: [
        { text: 'hello@twinapparels.com', href: 'mailto:hello@twinapparels.com' },
        { text: 'concierge@twinapparels.com', href: 'mailto:concierge@twinapparels.com' },
      ],
      theme: 'white',
    },
  ],
  form: {
    eyebrow: 'Write to us',
    title: 'Send us a message',
    text: 'Please complete the form. Our team will respond to your enquiry within 24 business hours.',
  },
};

const THEMES = {
  gold: {
    card: 'bg-[#BEA266] text-black',
    icon: 'bg-black text-[#DFC481]',
    body: 'text-black/80',
    link: 'hover:text-white',
  },
  black: {
    card: 'bg-black text-[#FBF7EE]',
    icon: 'bg-[#BEA266] text-black',
    body: 'text-[#FBF7EE]/80',
    link: 'hover:text-[#DFC481]',
  },
  white: {
    card: 'bg-white text-black',
    icon: 'bg-black text-[#DFC481]',
    body: 'text-black/75',
    link: 'hover:text-[#7A5F28]',
  },
};

const inputCls =
  'w-full rounded-2xl border border-black/20 bg-white px-5 py-3.5 font-inter text-[14px] text-black outline-none transition-colors placeholder:text-black/35 focus:border-black';
const labelCls = 'mb-2 block font-inter text-[11px] font-semibold uppercase tracking-[0.18em] text-black/55';

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Contact Us — Twin A Apparels';
    window.scrollTo(0, 0);
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      toast.error('Please complete all required fields.');
      return;
    }
    if (!validatePhoneNumber(formData.phone)) {
      toast.error('Please enter a valid phone number with country code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/contact', { ...formData, subject: formData.subject.trim() || 'General Inquiry' });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Your enquiry has been received. We will contact you shortly.');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        toast.error(res.data?.message || 'Unable to submit your message. Please try again.');
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      toast.error(err.response?.data?.message || 'A network error occurred. Please try contacting us via phone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-[#FBF7EE] font-inter text-black">
      {/* ── 1. Hero ─────────────────────────────────────────────── */}
      <section className="bg-black text-[#FBF7EE]" aria-label="Contact Twin A Apparels">
        <div className="mx-auto max-w-site px-6 md:px-12 pt-8 md:pt-10 pb-20 md:pb-28">
          <Breadcrumb crumbs={[{ label: 'Contact Us' }]} tone="dark" />
          <div className="pt-14 md:pt-20 text-center">
            <EyebrowReveal className="mb-6 block font-inter text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DFC481]">
              {CONTACT.hero.eyebrow}
            </EyebrowReveal>
            <StaggeredText
              as="h1"
              text={CONTACT.hero.title}
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair mx-auto max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-medium leading-[1.08] text-[#FBF7EE]"
            />
            <StaggeredText
              as="p"
              text={CONTACT.hero.text}
              segmentBy="words"
              blur={false}
              duration={0.4}
              startDelay={0.25}
              className="mx-auto mt-7 max-w-xl text-[15px] md:text-base leading-relaxed text-[#FBF7EE]/70"
            />
          </div>
        </div>
      </section>

      {/* ── 2. Left: intro + contact cards  |  Right: form (same height) ── */}
      <section className="mx-auto max-w-site px-6 md:px-12 py-16 md:py-24" aria-label="Contact details and message form">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.9fr_1.3fr] lg:items-stretch lg:gap-16">
          {/* Left column */}
          <div className="flex flex-col">
            <FadeUp>
              <span className="inline-flex items-center gap-3 font-inter text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7A5F28]">
                <span className="h-px w-8 bg-[#BEA266]" />
                {CONTACT.form.eyebrow}
              </span>
            </FadeUp>
            <StaggeredText
              as="h2"
              text={CONTACT.form.title}
              segmentBy="words"
              startDelay={0.1}
              className="font-playfair mt-5 text-4xl sm:text-5xl font-medium leading-[1.1] text-black"
            />
            <FadeUp delay={0.2}>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#5A4D38]">{CONTACT.form.text}</p>
            </FadeUp>

            {/* Cards share the remaining height equally */}
            <ul className="mt-8 flex flex-1 flex-col gap-4" aria-label="Contact details">
              {CONTACT.cards.map((c, i) => {
                const t = THEMES[c.theme];
                const Icon = c.icon;
                return (
                  <li key={c.title} className="flex-1">
                    <FadeUp delay={0.1 + i * 0.1} className="h-full">
                      <div
                        className={`flex h-full items-center gap-5 rounded-[1.5rem] p-5 md:p-6 shadow-[0_14px_34px_rgba(0,0,0,0.1)] ${t.card}`}
                      >
                        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${t.icon}`}>
                          <Icon size={20} strokeWidth={1.6} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-playfair text-xl md:text-2xl font-medium leading-tight">{c.title}</h3>
                          <div className="mt-2 space-y-0.5 text-[14px] leading-relaxed">
                            {c.lines.map(line =>
                              typeof line === 'string' ? (
                                <p key={line} className={t.body}>{line}</p>
                              ) : (
                                <p key={line.text} className={t.body}>
                                  <a href={line.href} className={`break-words transition-colors ${t.link}`}>
                                    {line.text}
                                  </a>
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </FadeUp>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right column: form fills full column height */}
          <FadeUp delay={0.1} className="h-full">
            <form
              onSubmit={handleSubmit}
              className="flex h-full flex-col gap-6 rounded-[1.75rem] md:rounded-[2.5rem] bg-white p-6 sm:p-8 md:p-12 shadow-[0_14px_40px_rgba(0,0,0,0.08)]"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="name">Full name <span className="text-[#BEA266]">*</span></label>
                  <input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Your name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="email">Email <span className="text-[#BEA266]">*</span></label>
                  <input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="you@example.com" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className={labelCls} htmlFor="phone">Phone <span className="text-[#BEA266]">*</span></label>
                  <PhoneInput
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={val => setFormData(prev => ({ ...prev, phone: val }))}
                    className="w-full"
                    inputClassName="py-3.5 text-sm px-4 bg-transparent"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="subject">Enquiry subject</label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Order status, wholesale enquiry"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Message grows to absorb any extra height so both columns match */}
              <div className="flex flex-1 flex-col">
                <label className={labelCls} htmlFor="message">Your message <span className="text-[#BEA266]">*</span></label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className={`${inputCls} min-h-[9rem] flex-1 resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                id="contact-submit-btn"
                className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#BEA266] py-2 pl-8 pr-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-black transition-colors hover:bg-[#DFC481] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start sm:justify-start"
              >
                {isSubmitting ? 'Sending…' : 'Send message'}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-[#DFC481] transition-transform duration-300 group-hover:translate-x-1">
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#DFC481] border-t-transparent" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                </span>
              </button>
            </form>
          </FadeUp>
        </div>
      </section>

      {/* ── 3. Map ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-site px-6 md:px-12 pb-16 md:pb-24" aria-label="Map">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="h-[300px] w-full overflow-hidden rounded-[1.75rem] md:h-[440px] md:rounded-[2.5rem] border border-black/10 grayscale transition-all duration-700 hover:grayscale-0"
        >
          <iframe
            title="Twin A Apparels location map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.1895080060934!2d72.8335017!3d19.0554907!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c9115c4d6dfd%3A0xe543e2646dcb001f!2sLinking%20Rd%2C%20Bandra%20West%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </section>

      <Footer />
    </main>
  );
};

export default ContactPage;