import React from 'react';

interface IconRendererProps {
  icon: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  icon,
  size = 'sm',
  className = '',
}) => {
  // Sizing definitions
  const sizeMap = {
    xs: {
      svg: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
      emoji: 'text-xs sm:text-[13px] leading-none',
    },
    sm: {
      svg: 'w-5 h-5 sm:w-5.5 sm:h-5.5',
      emoji: 'text-sm sm:text-base leading-none',
    },
    md: {
      svg: 'w-7 h-7 sm:w-8 sm:h-8',
      emoji: 'text-lg sm:text-xl leading-none',
    },
    lg: {
      svg: 'w-9 h-9 sm:w-10 sm:h-10',
      emoji: 'text-2xl sm:text-3xl leading-none',
    },
  }[size];

  // 1. Check Completo (Trabalhei Integral)
  if (icon === 'check_full') {
    return (
      <svg
        viewBox="0 0 36 36"
        className={`${sizeMap.svg} shrink-0 drop-shadow-2xs ${className}`}
        aria-label="Dia trabalhado integralmente"
      >
        <circle cx="18" cy="18" r="15" fill="#10B981" />
        <path
          d="M10.5 18.2 L15.5 23.2 L25.5 13.2"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // 2. Meio Turno (Check dividido exatamente ao meio)
  if (icon === 'check_half') {
    return (
      <svg
        viewBox="0 0 36 36"
        className={`${sizeMap.svg} shrink-0 drop-shadow-2xs ${className}`}
        aria-label="Meio turno trabalhado"
      >
        {/* Metade direita (vazia / fantasma / não trabalhada) */}
        <path
          d="M18,3 A15,15 0 0,1 18,33 Z"
          fill="#F4F4F5"
          stroke="#D4D4D8"
          strokeWidth="1.2"
          strokeDasharray="2.5 2"
        />

        {/* Metade esquerda (preenchida / trabalhada em verde esmeralda) */}
        <path d="M18,3 A15,15 0 0,0 18,33 Z" fill="#10B981" />

        {/* Linha divisória vertical exata ao meio */}
        <line
          x1="18"
          y1="3"
          x2="18"
          y2="33"
          stroke="#059669"
          strokeWidth="1.2"
          opacity="0.8"
        />

        {/* Traçado branco sólido na metade esquerda */}
        <path
          d="M10.5 18.2 L15.5 23.2 L18 20.7"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Traçado cinza pontilhado na metade direita */}
        <path
          d="M18 20.7 L25.5 13.2"
          fill="none"
          stroke="#A1A1AA"
          strokeWidth="2.2"
          strokeDasharray="2.5 2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      </svg>
    );
  }

  // 3. Emoji or standard textual character (e.g. 🏠, 🚗, 📋, ⭐, 📦, 💻)
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 select-none ${sizeMap.emoji} ${className}`}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
};
