import React from 'react';
import type { WorkDayState } from '../types';

interface CheckIconProps {
  state: WorkDayState;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'minimal';
}

export const CheckIcon: React.FC<CheckIconProps> = ({
  state,
  size = 'md',
  variant = 'badge',
}) => {
  if (state === 'none') {
    return null;
  }

  const dimensionClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-9 h-9 sm:w-10 sm:h-10',
  }[size];

  if (variant === 'badge') {
    if (state === 'full') {
      return (
        <svg
          viewBox="0 0 36 36"
          className={`${dimensionClasses} transition-transform duration-200 hover:scale-105 drop-shadow-xs`}
          aria-label="Dia trabalhado integralmente"
        >
          {/* Fundo circular preenchido */}
          <circle cx="18" cy="18" r="15" fill="#10B981" />
          {/* Símbolo de check completo */}
          <path
            d="M10.5 18.2 L15.5 23.2 L25.5 13.2"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    // state === 'half'
    return (
      <svg
        viewBox="0 0 36 36"
        className={`${dimensionClasses} transition-transform duration-200 hover:scale-105 drop-shadow-xs`}
        aria-label="Meio turno trabalhado"
      >
        <defs>
          {/* Máscara ou recorte da metade esquerda */}
          <clipPath id="left-half-clip">
            <rect x="0" y="0" width="18" height="36" />
          </clipPath>
          {/* Recorte da metade direita */}
          <clipPath id="right-half-clip">
            <rect x="18" y="0" width="18" height="36" />
          </clipPath>
        </defs>

        {/* Metade direita (vazia / fantasma / não trabalhada) */}
        <path
          d="M18,3 A15,15 0 0,1 18,33 Z"
          fill="#F4F4F5"
          stroke="#D4D4D8"
          strokeWidth="1.2"
          strokeDasharray="2.5 2"
        />

        {/* Metade esquerda (preenchida / trabalhada em verde esmeralda) */}
        <path
          d="M18,3 A15,15 0 0,0 18,33 Z"
          fill="#10B981"
        />

        {/* Linha divisória vertical exata ao meio */}
        <line
          x1="18"
          y1="3"
          x2="18"
          y2="33"
          stroke="#059669"
          strokeWidth="1.2"
          opacity="0.75"
        />

        {/* Parte do check na metade esquerda (branca, sólida) */}
        {/* Traçado vai de (10.5, 18.2) para (15.5, 23.2) até atingir x=18 em y=20.7 */}
        <path
          d="M10.5 18.2 L15.5 23.2 L18 20.7"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Parte do check na metade direita (tracejada/fantasma, evidenciando a ausência da 2ª metade) */}
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

  // Variant: Minimal (apenas traçado do check, sem círculo de fundo)
  if (state === 'full') {
    return (
      <svg
        viewBox="0 0 36 36"
        className={`${dimensionClasses} transition-transform duration-200 hover:scale-105`}
        aria-label="Dia trabalhado integralmente"
      >
        <path
          d="M9 19 L15.5 25.5 L27 11.5"
          fill="none"
          stroke="#059669"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // Minimal half check:
  return (
    <svg
      viewBox="0 0 36 36"
      className={`${dimensionClasses} transition-transform duration-200 hover:scale-105`}
      aria-label="Meio turno trabalhado"
    >
      {/* Linha guia vertical sutil */}
      <line
        x1="18"
        y1="7"
        x2="18"
        y2="29"
        stroke="#CBD5E1"
        strokeWidth="1.2"
        strokeDasharray="2 2"
      />
      {/* Metade esquerda preenchida em verde */}
      <path
        d="M9 19 L15.5 25.5 L18 22.4"
        fill="none"
        stroke="#059669"
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Metade direita fantasma / pontilhada */}
      <path
        d="M18 22.4 L27 11.5"
        fill="none"
        stroke="#CBD5E1"
        strokeWidth="2.4"
        strokeDasharray="2 2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
