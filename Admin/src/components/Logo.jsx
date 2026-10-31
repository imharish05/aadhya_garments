const Logo = ({ size = 'md', className = '', showText = true }) => {
  const imageSizes = {
    sm: 'h-8 w-auto max-h-8',
    md: 'h-10 w-auto max-h-10',
    lg: 'h-16 w-auto max-h-16',
  };

  const textSizes = {
    sm: '16px',
    md: '20px',
    lg: '28px',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/logo.png"
        alt="Twin A Apparels Logo"
        className={`${imageSizes[size]} object-contain`}
      />
      {/* {showText && (
        <span style={{ fontFamily: '"Cinzel", Georgia, serif', fontSize: textSizes[size], fontWeight: 700 }}>
          <span style={{ color: 'var(--color-gold, #C58837)' }}>Twin A</span>{' '}
          <span style={{ color: 'var(--color-text, #1A1A1A)' }}>Apparels</span>
        </span>
      )} */}
    </div>
  );
};

export default Logo;
