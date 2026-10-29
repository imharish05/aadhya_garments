import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Preloader — simple version.
 * Logo fades in on black, thin gold line fills below, then the curtain opens.
 * Progress holds at 96% until the browser's real `load` event.
 * Props unchanged: onFinish, minimumDuration, autoHide.
 */
const CURTAIN_MS = 800;

const Preloader = ({ onFinish, minimumDuration = 1800, autoHide = true }) => {
  const [progress, setProgress] = useState(0);
  const [closing, setClosing] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(
    typeof document === 'undefined' || document.readyState === 'complete'
  );

  useEffect(() => {
    if (pageLoaded) return undefined;
    const done = () => setPageLoaded(true);
    window.addEventListener('load', done);
    return () => window.removeEventListener('load', done);
  }, [pageLoaded]);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const t = Math.min((Date.now() - start) / minimumDuration, 1);
      const target = Math.round((1 - Math.pow(1 - t, 2)) * 100);
      setProgress(prev => Math.max(prev, pageLoaded ? target : Math.min(target, 96)));
      if (t >= 1 && pageLoaded) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [minimumDuration, pageLoaded]);

  useEffect(() => {
    if (progress < 100 || !autoHide) return undefined;
    const open = setTimeout(() => setClosing(true), 250);
    const finish = setTimeout(() => onFinish && onFinish(), 250 + CURTAIN_MS);
    return () => { clearTimeout(open); clearTimeout(finish); };
  }, [progress, autoHide, onFinish]);

  const curtain = { duration: CURTAIN_MS / 1000, ease: [0.76, 0, 0.24, 1] };

  return (
    <div
      className="fixed inset-0 z-[99999] select-none overflow-hidden"
      style={{ cursor: 'progress', pointerEvents: closing ? 'none' : 'auto' }}
      role="status"
      aria-label="Loading Twin A Apparels"
    >
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-black"
        animate={{ x: closing ? '-100%' : '0%' }}
        transition={curtain}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 bg-black"
        animate={{ x: closing ? '100%' : '0%' }}
        transition={curtain}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        animate={{ opacity: closing ? 0 : 1 }}
        transition={{ duration: 0.25 }}
      >
        <motion.img
          src="/logo.png"
          alt="Twin A Apparels"
          className="h-24 w-auto object-contain md:h-32"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
        <div className="mt-8 h-px w-40 bg-[#2B2416] md:w-52">
          <div className="h-px bg-[#BEA266]" style={{ width: `${progress}%` }} />
        </div>
      </motion.div>
    </div>
  );
};

export default Preloader;