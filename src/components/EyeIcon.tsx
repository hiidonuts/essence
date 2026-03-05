import React from 'react';

const EyeIcon: React.FC<{ className?: string; flipped?: boolean; title?: string }> = ({ className = '', flipped = false, title }) => {
  const style = flipped ? { transform: 'scaleY(-1)' } : undefined;
  return (
    <svg
      aria-hidden
      role="img"
      viewBox="0 0 100 60"
      fill="none"
      className={(className ? className + ' ' : '') + 'animate-eye-blink'}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      title={title}
    >
      {/* Eye white/sclera */}
      <ellipse cx="50" cy="30" rx="38" ry="22" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Iris */}
      <circle cx="50" cy="30" r="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Pupil */}
      <circle cx="50" cy="30" r="7" fill="currentColor" />
      {/* Light reflection */}
      <circle cx="53" cy="27" r="2.5" fill="currentColor" opacity="0.6" />
      {/* Top eyelid */}
      <path d="M 22 30 Q 50 13 78 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Bottom eyelid */}
      <path d="M 22 30 Q 50 47 78 30" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
};

export default EyeIcon;
