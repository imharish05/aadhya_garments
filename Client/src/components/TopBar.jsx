import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

/** Shown only while loading or if the backend has no active messages. */
const FALLBACK_MESSAGES = [
  'Complimentary Shipping',
  'Secured Transactions',
  'Dedicated Support',
];

const PX_PER_CHAR = 9;   // rough width of one uppercase character
const CELL_PAD = 96;     // horizontal padding of one message cell
const MIN_GROUP_PX = 2200; // one group must be wider than any screen so the loop never shows a gap
const SPEED_PX_S = 45;   // reading speed

/** Messages come from the backend: GET /marketing-messages (managed in Admin → Slider Messages) */
const useMessages = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/marketing-messages');
        if (!alive || !res.data?.success) return;
        const list = (res.data.messages || [])
          .filter(m => m.isActive !== false)
          .map(m => String(m.message || '').trim())
          .filter(Boolean);
        setMessages(list);
      } catch {
        /* keep fallback */
      }
    })();
    return () => { alive = false; };
  }, []);

  return messages.length > 0 ? messages : FALLBACK_MESSAGES;
};

/**
 * One announcement. Its top and bottom edges carry the gold rule + centre diamond,
 * so the decoration travels with the text while the bar scrolls.
 * A gold diamond at the right edge of the cell marks the end of the message.
 */
const Cell = ({ text }) => (
  <li className="topbar__cell">
    <span className="topbar__rule topbar__rule--top" aria-hidden="true"><span className="topbar__diamond" /></span>
    <span className="topbar__text">{text}</span>
    <span className="topbar__end" aria-hidden="true" />
    <span className="topbar__rule topbar__rule--bottom" aria-hidden="true"><span className="topbar__diamond" /></span>
  </li>
);

/** Continuous right-to-left ticker. Pauses on hover. Static for reduced-motion users. */
const TopBar = () => {
  const messages = useMessages();

  const { group, duration } = useMemo(() => {
    const unit = messages.reduce((n, m) => n + m.length * PX_PER_CHAR + CELL_PAD, 0);
    const reps = Math.max(1, Math.ceil(MIN_GROUP_PX / unit));
    return {
      group: Array.from({ length: reps }, () => messages).flat(),
      duration: Math.max(20, Math.round((unit * reps) / SPEED_PX_S)),
    };
  }, [messages]);

  return (
    <div className="topbar" role="region" aria-label="Announcements">
      <div className="topbar__track" style={{ '--topbar-duration': `${duration}s` }}>
        <ul className="topbar__group">
          {group.map((m, i) => <Cell key={`a-${i}`} text={m} />)}
        </ul>
        {/* duplicate for a seamless loop (hidden from screen readers) */}
        <ul className="topbar__group" aria-hidden="true">
          {group.map((m, i) => <Cell key={`b-${i}`} text={m} />)}
        </ul>
      </div>
    </div>
  );
};

export default TopBar;
