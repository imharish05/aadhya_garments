/**
 * Logo component — both apps
 * Renders the brand logo image alongside styled brand text.
 */
const Logo = ({ size = 'md', className = '', showText = false, fullHeight = false }) => {
  const imageSizes = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  const imgSizeClass = fullHeight ? 'h-full w-auto max-h-full py-1.5' : imageSizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt="Twin A Apparels Logo"
        className={`${imgSizeClass} object-contain`}
      />
      {showText && (
        <span
          className={`font-playfair font-bold tracking-tight ${textSizes[size]}`}
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          <span style={{ color: 'var(--color-gold)' }}>Twin A</span>{' '}
          <span className="text-white">Apparels</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
