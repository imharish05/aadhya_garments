/**
 * Prevents accidental modal closing when selecting text inside a modal
 * and releasing the mouse button outside on the backdrop.
 *
 * @param {Function} onClose - Callback when the backdrop is clicked directly
 * @param {boolean} [enabled=true] - Whether closing is allowed (e.g. !saving)
 * @returns {object} { onMouseDown, onClick } props to spread onto the backdrop overlay
 */
export function safeBackdropProps(onClose, enabled = true) {
  return {
    onMouseDown: (e) => {
      if (e.target === e.currentTarget) {
        e.currentTarget.dataset.backdropMouseDown = 'true';
      } else {
        delete e.currentTarget.dataset.backdropMouseDown;
      }
    },
    onClick: (e) => {
      const wasBackdropMouseDown = e.currentTarget.dataset.backdropMouseDown === 'true';
      delete e.currentTarget.dataset.backdropMouseDown;
      if (enabled && wasBackdropMouseDown && e.target === e.currentTarget) {
        onClose?.(e);
      }
    }
  };
}
