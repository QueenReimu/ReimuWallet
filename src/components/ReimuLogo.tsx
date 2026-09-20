import React from 'react';

interface ReimuLogoProps {
  size?: number | string;
  className?: string;
  withBackground?: boolean;
}

export const ReimuLogo: React.FC<ReimuLogoProps> = ({
  size = 32,
  className = '',
  withBackground = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="ReimuWallet Logo"
    >
      {withBackground && (
        <rect
          width="512"
          height="512"
          rx="112"
          ry="112"
          fill="#B81424"
        />
      )}
      
      {/* Torii Gate */}
      <g id="torii-gate">
        {/* Kasagi: Top curved roof beam */}
        <path
          d="M 94 148 Q 256 166 418 148"
          stroke="#FFFFFF"
          strokeWidth="32"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Shimaki/Nuki: Horizontal crossbeam */}
        <path
          d="M 128 208 L 384 208"
          stroke="#FFFFFF"
          strokeWidth="30"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Left Pillar with outward flare at foot */}
        <path
          d="M 174 210 L 174 358 L 136 422"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Right Pillar with outward flare at foot */}
        <path
          d="M 338 210 L 338 358 L 376 422"
          stroke="#FFFFFF"
          strokeWidth="28"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Golden Sun / Sacred Torii Bell Orb */}
        <circle
          cx="256"
          cy="274"
          r="44"
          fill="#F5BA13"
        />
      </g>
    </svg>
  );
};
