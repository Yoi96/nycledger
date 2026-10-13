import React, { useState } from 'react';
import catHeadImg from '../../assets/images/logo.png';

interface CatMascotProps {
  className?: string;
  size?: number;
  mood?: 'happy' | 'glasses' | 'thinking' | 'advisor';
  useImage?: boolean;
}

/**
 * CatHead: Mascot showing ONLY the cat head with glasses and top hat with NO background
 * Fulfills user request: "logo cat head using this picture, no background"
 */
export const CatHead: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return <VectorCatHead size={size} className={className} />;
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex-shrink-0 flex items-center justify-center select-none ${className}`}
    >
      <img
        src={catHeadImg}
        alt="NYC Ledger Cat Head"
        loading="eager"
        decoding="async"
        onError={() => setImgError(true)}
        className="w-full h-full object-contain filter drop-shadow-sm pointer-events-none"
      />
    </div>
  );
};

// Alias AppLogo to CatHead so every place using AppLogo gets the cat head with no background
export const AppLogo = CatHead;

export const CatMascot: React.FC<CatMascotProps> = ({
  className = '',
  size = 48,
  useImage = true,
}) => {
  if (useImage) {
    return <CatHead size={size} className={className} />;
  }
  return <VectorCatHead size={size} className={className} />;
};

/**
 * Pure SVG fallback of just the cat head with apple hat and eyeglasses (no background)
 */
export const VectorCatHead: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="catBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA64D" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id="hatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Cat Ears */}
      <polygon points="20,40 10,12 36,25" fill="url(#catBodyGrad)" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="20,36 14,18 32,26" fill="#FCA5A5" />

      <polygon points="80,40 90,12 64,25" fill="url(#catBodyGrad)" stroke="#1E293B" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="80,36 86,18 68,26" fill="#FCA5A5" />

      {/* Cat Head */}
      <ellipse cx="50" cy="56" rx="36" ry="32" fill="url(#catBodyGrad)" stroke="#1E293B" strokeWidth="2.8" />

      {/* White Muzzle / Cheeks */}
      <ellipse cx="43" cy="65" rx="10" ry="8" fill="#FFFBEB" />
      <ellipse cx="57" cy="65" rx="10" ry="8" fill="#FFFBEB" />
      <ellipse cx="50" cy="68" rx="7" ry="5" fill="#FFFBEB" />

      {/* Pink Nose */}
      <polygon points="50,60 46,56 54,56" fill="#F43F5E" />

      {/* Mouth */}
      <path d="M46 62 Q 43 65 40 64" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M54 62 Q 57 65 60 64" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Rosy Cheeks */}
      <ellipse cx="28" cy="62" rx="4" ry="2.5" fill="#FDA4AF" opacity="0.8" />
      <ellipse cx="72" cy="62" rx="4" ry="2.5" fill="#FDA4AF" opacity="0.8" />

      {/* Big Eyes */}
      <ellipse cx="36" cy="48" rx="9" ry="11" fill="#1E293B" />
      <ellipse cx="64" cy="48" rx="9" ry="11" fill="#1E293B" />
      <ellipse cx="34" cy="45" rx="3" ry="4" fill="#FFFFFF" />
      <ellipse cx="62" cy="45" rx="3" ry="4" fill="#FFFFFF" />
      <circle cx="39" cy="51" r="1.5" fill="#FFFFFF" />
      <circle cx="67" cy="51" r="1.5" fill="#FFFFFF" />

      {/* Black Eyeglasses */}
      <rect x="23" y="36" width="26" height="24" rx="12" fill="none" stroke="#1E293B" strokeWidth="3" />
      <rect x="51" y="36" width="26" height="24" rx="12" fill="none" stroke="#1E293B" strokeWidth="3" />
      <line x1="49" y1="46" x2="51" y2="46" stroke="#1E293B" strokeWidth="3" />
      <line x1="23" y1="44" x2="16" y2="42" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="77" y1="44" x2="84" y2="42" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />

      {/* Whiskers */}
      <line x1="16" y1="58" x2="30" y2="60" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="65" x2="28" y2="64" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="84" y1="58" x2="70" y2="60" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="86" y1="65" x2="72" y2="64" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />

      {/* Top Hat */}
      <ellipse cx="50" cy="24" rx="28" ry="6" fill="#1E293B" />
      <path d="M32 23 L36 4 C36 2 64 2 64 4 L68 23 Z" fill="url(#hatGrad)" stroke="#1E293B" strokeWidth="1.5" />
      <rect x="34" y="16" width="32" height="5" fill="#38BDF8" rx="1" />

      {/* Red Apple Emblem */}
      <circle cx="48" cy="18.5" r="3" fill="#EF4444" />
      <circle cx="52" cy="18.5" r="3" fill="#EF4444" />
      <path d="M50 15 Q51 13 53 14" stroke="#15803D" strokeWidth="1" fill="none" />
    </svg>
  );
};

export const NYCSkyline: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d="M0 120 L0 85 L20 85 L20 120 Z" fill="#93C5FD" opacity="0.5" />
      <path d="M25 120 L25 60 L45 60 L45 120 Z" fill="#60A5FA" opacity="0.6" />
      <path d="M50 120 L50 70 L70 70 L70 120 Z" fill="#93C5FD" opacity="0.5" />
      <path d="M75 120 L75 40 L95 40 L95 120 Z" fill="#3B82F6" opacity="0.7" />
      <path d="M100 120 L100 50 L120 50 L120 120 Z" fill="#60A5FA" opacity="0.6" />
      <path d="M130 120 L130 30 L136 20 L136 10 L138 6 L140 10 L140 20 L146 30 L146 120 Z" fill="#2563EB" opacity="0.7" />
      <path d="M260 120 L260 35 L264 25 L268 25 L268 15 L270 5 L272 15 L272 25 L276 25 L280 35 L280 120 Z" fill="#1D4ED8" opacity="0.8" />
      <path d="M310 120 L310 30 L320 15 L320 0 L322 0 L322 15 L332 30 L332 120 Z" fill="#3B82F6" opacity="0.7" />
      <path d="M340 120 L340 65 L365 65 L365 120 Z" fill="#60A5FA" opacity="0.5" />
      <path d="M370 120 L370 75 L395 75 L395 120 Z" fill="#93C5FD" opacity="0.6" />
    </svg>
  );
};
