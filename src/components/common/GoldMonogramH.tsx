import React from 'react';

interface GoldMonogramHProps {
  className?: string;
  size?: number;
}

export const GoldMonogramH: React.FC<GoldMonogramHProps> = ({ className = 'w-12 h-12', size = 48 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HILALPOS Monogram H"
    >
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E29D" />
          <stop offset="35%" stopColor="#D4A017" />
          <stop offset="70%" stopColor="#F3C969" />
          <stop offset="100%" stopColor="#A67C00" />
        </linearGradient>
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#D4A017" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Outer subtle decorative crest / ornate ring element */}
      <circle
        cx="50"
        cy="50"
        r="46"
        stroke="url(#gold-grad)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.6"
      />
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="url(#gold-grad)"
        strokeWidth="0.8"
        opacity="0.4"
      />

      {/* Ornate Flourishes and Ribbon Swirls */}
      <path
        d="M20 30 C 26 18, 40 18, 48 25 C 44 28, 38 29, 32 32"
        stroke="url(#gold-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M80 70 C 74 82, 60 82, 52 75 C 56 72, 62 71, 68 68"
        stroke="url(#gold-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Main Classical Serif Monogram "H" Stem 1 (Left) */}
      {/* Top serif */}
      <path
        d="M26 24 L42 24 L39 30 L36 30 L36 70 L39 70 L42 76 L26 76 L29 70 L32 70 L32 30 L29 30 Z"
        fill="url(#gold-grad)"
        filter="url(#gold-glow)"
      />

      {/* Main Classical Serif Monogram "H" Stem 2 (Right) */}
      <path
        d="M58 24 L74 24 L71 30 L68 30 L68 70 L71 70 L74 76 L58 76 L61 70 L64 70 L64 30 L61 30 Z"
        fill="url(#gold-grad)"
        filter="url(#gold-glow)"
      />

      {/* Crossbar with Ornate Center Diamond Ribbon */}
      <path
        d="M36 47 L64 47 L64 53 L36 53 Z"
        fill="url(#gold-grad)"
      />
      <circle cx="50" cy="50" r="3.5" fill="url(#gold-grad)" />

      {/* Artistic swooshes representing creativity & paint stroke */}
      <path
        d="M18 52 C 22 45, 30 46, 36 50"
        stroke="url(#gold-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M82 48 C 78 55, 70 54, 64 50"
        stroke="url(#gold-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* Top small crown / star accent */}
      <path
        d="M50 14 L52 18 L56 19 L53 22 L54 26 L50 24 L46 26 L47 22 L44 19 L48 18 Z"
        fill="url(#gold-grad)"
      />
    </svg>
  );
};
