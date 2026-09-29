import React from 'react';
import type { CalendarDayInfo } from '../utils/dateUtils';
import type { IconItem, DayWeatherForecast, InmetAlert } from '../types';
import { IconRenderer } from './IconRenderer';

interface CalendarCellProps {
  dayInfo: CalendarDayInfo;
  icons?: IconItem[];
  forecast?: DayWeatherForecast;
  onOpenModal: (dateKey: string) => void;
  onOpenAlert?: (alert: InmetAlert, dateKey: string) => void;
}

export const CalendarCell: React.FC<CalendarCellProps> = ({
  dayInfo,
  icons = [],
  forecast,
  onOpenModal,
  onOpenAlert,
}) => {
  const { dayNumber, dateKey, isCurrentMonth, isToday, isWeekend } = dayInfo;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger day modal if not clicking on child buttons (like INMET alert)
    if (e.target !== e.currentTarget && (e.target as HTMLElement).closest('button')) {
      return;
    }
    onOpenModal(dateKey);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpenModal(dateKey);
    }
  };

  const hasFullCheck = icons.some(
    (i) => i.icon === 'check_full' || i.id === 'icon_check_full' || i.icon === '✅'
  );
  const hasHalfCheck = icons.some(
    (i) =>
      i.icon === 'check_half' ||
      i.id === 'icon_check_half' ||
      i.icon === '🕐' ||
      i.icon === '◐'
  );

  const highestAlert = forecast?.highestAlert;

  // Background and border styling based on icons present and INMET alerts
  let cellBg = 'bg-white dark:bg-stone-900 hover:bg-stone-50/80 dark:hover:bg-stone-850 border-stone-200/80 dark:border-stone-800';

  if (!isCurrentMonth) {
    cellBg = 'bg-stone-50/40 dark:bg-stone-950/40 border-stone-100 dark:border-stone-850 hover:bg-stone-100/50 opacity-45';
  } else if (highestAlert) {
    // Subtle border glow if under official INMET alert
    if (highestAlert.cor === 'vermelho') {
      cellBg = 'bg-red-50/30 dark:bg-red-950/20 border-red-300 dark:border-red-800 shadow-2xs hover:bg-red-50/50';
    } else if (highestAlert.cor === 'laranja') {
      cellBg = 'bg-orange-50/30 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800 shadow-2xs hover:bg-orange-50/50';
    } else {
      cellBg = 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 shadow-2xs hover:bg-amber-50/50';
    }
  } else if (hasFullCheck) {
    cellBg = 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300/90 dark:border-emerald-800 shadow-2xs hover:bg-emerald-50/80';
  } else if (hasHalfCheck) {
    cellBg =
      'bg-gradient-to-r from-emerald-50/60 from-50% to-white to-50% dark:from-emerald-950/30 dark:to-stone-900 border-emerald-300/80 dark:border-emerald-800 shadow-2xs hover:opacity-95';
  } else if (icons.length > 0) {
    cellBg = 'bg-stone-50/50 dark:bg-stone-850 border-stone-300 dark:border-stone-700 shadow-2xs hover:bg-stone-100/60';
  }

  // Day number styling
  let numberColor = isWeekend ? 'text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-200';
  if (!isCurrentMonth) {
    numberColor = 'text-stone-300 dark:text-stone-700';
  } else if (hasFullCheck || hasHalfCheck) {
    numberColor = 'text-emerald-950 dark:text-emerald-300 font-semibold';
  }

  const iconsCount = icons.length;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Dia ${dayNumber}, ${iconsCount} ícone(s) marcado(s). ${highestAlert ? `Alerta oficial INMET: ${highestAlert.evento}.` : ''} Pressione para editar.`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        group relative flex flex-col justify-between items-center
        min-h-[72px] sm:min-h-[88px] md:min-h-[98px] p-1 sm:p-2
        rounded-xl sm:rounded-2xl border transition-all duration-150
        cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        active:scale-[0.98]
        ${cellBg}
      `}
    >
      {/* Top Header of the Day Cell: Day Number & Weather forecast */}
      <div className="w-full flex items-start justify-between gap-1 mb-1 pointer-events-none">
        <span
          className={`
            text-xs sm:text-sm font-medium tabular-nums
            ${numberColor}
            ${
              isToday && isCurrentMonth
                ? 'inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold text-[11px] sm:text-xs shadow-2xs'
                : ''
            }
          `}
        >
          {dayNumber}
        </span>

        {/* Primary weather forecast snippet: e.g. 🌤️ 18°–25° */}
        {forecast && isCurrentMonth && (
          <div
            className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-stone-500 dark:text-stone-400 font-medium tabular-nums"
            title={`${forecast.weatherDesc} (${forecast.tempMin}° a ${forecast.tempMax}°C)`}
          >
            <span>{forecast.weatherEmoji}</span>
            <span className="hidden sm:inline">
              {forecast.tempMin}°–{forecast.tempMax}°
            </span>
          </div>
        )}
      </div>

      {/* Official INMET Alert Banner (ex: 🟠 INMET) */}
      {highestAlert && isCurrentMonth && (
        <div className="w-full mb-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAlert?.(highestAlert, dateKey);
            }}
            className={`
              w-full py-0.5 px-1 rounded-md text-[9px] sm:text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer transition-transform hover:scale-105 active:scale-95
              ${
                highestAlert.cor === 'vermelho'
                  ? 'bg-red-600 text-white'
                  : highestAlert.cor === 'laranja'
                    ? 'bg-orange-500 text-white'
                    : 'bg-amber-400 text-amber-950'
              }
            `}
            title={`Alerta Oficial do INMET: ${highestAlert.evento} (${highestAlert.corLabel}). Clique para abrir os detalhes.`}
          >
            <span>{highestAlert.emoji}</span>
            <span className="truncate tracking-tight uppercase">INMET</span>
          </button>
        </div>
      )}

      {/* Middle: Work Icons layout (Up to 6 icons) */}
      <div className="w-full flex-1 flex items-center justify-center pointer-events-none my-0.5">
        {iconsCount === 0 ? (
          /* Não trabalhado / Sem ícones: Célula limpa */
          <div className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
        ) : iconsCount === 1 ? (
          /* 1 icon: Centered clearly */
          <div className="flex items-center justify-center">
            <IconRenderer icon={icons[0].icon} size="sm" />
          </div>
        ) : iconsCount === 2 ? (
          /* 2 icons: Side by side */
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <IconRenderer icon={icons[0].icon} size="xs" />
            <IconRenderer icon={icons[1].icon} size="xs" />
          </div>
        ) : (
          /* 3 to 6 icons: Neat 3-column grid */
          <div className="grid grid-cols-3 gap-0.5 sm:gap-1 place-items-center w-full max-w-[90px]">
            {icons.slice(0, 6).map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center"
              >
                <IconRenderer icon={item.icon} size="xs" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom subtle indicator bar */}
      <div className="w-full flex items-center justify-center h-1 pointer-events-none">
        {iconsCount === 0 && isCurrentMonth && (
          <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-colors" />
        )}
      </div>
    </div>
  );
};
