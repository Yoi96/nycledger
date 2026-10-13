import React from 'react';

interface CategoryIconProps {
  emoji?: string;
  iconUrl?: string;
  className?: string;
  size?: number | string;
  color?: string;
  style?: React.CSSProperties;
}
// Dedicated vector icon for Food & Beverages (Drink Cup with Straw + Layered Burger)
export const FastfoodVector: React.FC<{ size?: number | string; className?: string; color?: string }> = ({
  size = 20,
  className = '',
  color = 'currentColor',
}) => {
  const pixelSize = typeof size === 'number' ? size : parseInt(size as string, 10) || 20;

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ verticalAlign: 'middle' }}
    >
      {/* --- SODA / DRINK CUP WITH STRAW (RIGHT) --- */}
      {/* Straw sticking out from cup top */}
      <path
        d="M17.5 2.5L16 5V7.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cup lid rim */}
      <path
        d="M13 7.5H20.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Cup body (tapered) */}
      <path
        d="M14 7.5L15 20.5C15 21.2 15.6 21.5 16.5 21.5H17.5C18.4 21.5 19 21.2 19 20.5L20 7.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.14"
      />
      {/* Cup stripe detail */}
      <path
        d="M14.6 13.5H19.4"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="1.5 2"
        opacity="0.75"
      />

      {/* --- BURGER (LEFT) --- */}
      {/* Top bun */}
      <path
        d="M2.5 12C2.5 8 5 6.5 7.5 6.5C10 6.5 12.5 8 12.5 12H2.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.22"
      />
      {/* Sesame seeds */}
      <circle cx="5.5" cy="9.2" r="0.55" fill={color} />
      <circle cx="7.5" cy="8.2" r="0.55" fill={color} />
      <circle cx="9.5" cy="9.2" r="0.55" fill={color} />
      {/* Patty & cheese layer */}
      <path
        d="M2 13.8H13"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Melted cheese fold */}
      <path
        d="M3.8 13.8L5.2 16L6.6 13.8"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.35"
      />
      {/* Bottom bun */}
      <path
        d="M3 18C3 19.8 4.8 21 7.5 21C10.2 21 12 19.8 12 18H3Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
        fillOpacity="0.22"
      />
    </svg>
  );
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  emoji = 'fastfood',
  iconUrl,
  className = '',
  size = 20,
  color,
  style,
}) => {
  if (iconUrl) {
    const s = typeof size === 'number' ? `${size}px` : size;
    return (
      <img
        src={iconUrl}
        alt="Category Icon"
        className={`object-contain inline-block flex-shrink-0 ${className}`}
        style={{ width: s, height: s, ...style }}
      />
    );
  }

  const raw = (emoji || '').trim();

  // 1. Food and Beverages specific drink + burger icon
  if (
    raw === 'fastfood' ||
    raw === 'burger_drink' ||
    raw === 'food_beverages' ||
    raw === 'food_dining' ||
    raw === 'food_drink' ||
    raw === 'drinks' ||
    raw === 'fast_food' ||
    raw === '🍽️' ||
    raw === '🍜' ||
    raw === '🍔'
  ) {
    return <FastfoodVector size={size} color={color || '#F97316'} className={className} />;
  }

  // 2. Google Material Symbol identifier (lowercase words with underscores, e.g. home, shopping_bag, directions_subway)
  const isMaterialSymbol = /^[a-z0-9_]+$/.test(raw);
  if (isMaterialSymbol) {
    const fontSize = typeof size === 'number' ? `${size}px` : size;
    return (
      <span
        className={`material-symbols-outlined select-none inline-flex items-center justify-center leading-none ${className}`}
        style={{
          fontSize,
          width: fontSize,
          height: fontSize,
          color,
          ...style,
        }}
      >
        {raw}
      </span>
    );
  }

  // 3. Emoji or character
  const fontSize = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      className={`inline-flex items-center justify-center leading-none select-none ${className}`}
      style={{
        fontSize,
        width: fontSize,
        height: fontSize,
        ...style,
      }}
    >
      {raw}
    </span>
  );
};

