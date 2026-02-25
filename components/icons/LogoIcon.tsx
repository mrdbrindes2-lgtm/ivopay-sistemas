// components/icons/LogoIcon.tsx
import React from 'react';

export const LogoIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 160 100" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Logotipo IVOPAY SISTEMAS"
    role="img"
  >
    {/* Text */}
    <g transform="translate(0, 50)">
      {/* Top Line */}
      <rect x="25" y="0" width="110" height="1.5" fill="currentColor" />
      
      {/* IVOPAY */}
      <text 
        x="80" 
        y="18" 
        fontFamily="Inter, sans-serif" 
        fontSize="16" 
        fontWeight="900" 
        fill="currentColor"
        letterSpacing="1"
        textAnchor="middle"
      >
        IVOPAY
      </text>

      {/* Bottom Line */}
      <rect x="25" y="22" width="110" height="1.5" fill="currentColor" />

      {/* SISTEMAS */}
      <text 
        x="80" 
        y="35" 
        fontFamily="Inter, sans-serif" 
        fontSize="10" 
        fontWeight="500" 
        className="fill-slate-600 dark:fill-slate-400"
        textAnchor="middle"
        letterSpacing="0.5"
      >
        SISTEMAS
      </text>
    </g>
  </svg>
);
