import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { MONTH_NAMES } from '../utils/dateUtils';

interface MonthNavProps {
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onSelectMonthYear: (year: number, month: number) => void;
  isCurrentRealMonth: boolean;
}

export const MonthNav: React.FC<MonthNavProps> = ({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onSelectMonthYear,
  isCurrentRealMonth,
}) => {
  const [showPicker, setShowPicker] = React.useState(false);
  const currentMonthName = MONTH_NAMES[month];

  // Year options for quick select (e.g. current year - 3 to current year + 3)
  const years = Array.from({ length: 9 }, (_, i) => year - 4 + i);

  return (
    <div className="relative flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 sm:mb-6">
      {/* Month & Year Title with Quick Switcher Trigger */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-2 px-3 py-1.5 -ml-2 rounded-xl text-xl sm:text-2xl font-bold text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer group"
          title="Clique para escolher mês e ano"
          aria-expanded={showPicker}
        >
          <span>
            {currentMonthName}{' '}
            <span className="text-stone-500 font-semibold">{year}</span>
          </span>
          <span className="text-xs text-stone-400 group-hover:text-stone-600 transition-colors">
            ▼
          </span>
        </button>
      </div>

      {/* Navigation Controls: Today button + Arrows */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {!isCurrentRealMonth && (
          <button
            type="button"
            onClick={onGoToToday}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
            title="Ir para o mês atual"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hoje</span>
          </button>
        )}

        <div className="flex items-center bg-white border border-stone-200/80 rounded-xl p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={onPrevMonth}
            className="p-2 sm:px-3 sm:py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer active:scale-95"
            aria-label="Mês anterior"
            title="Mês anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="w-[1px] h-4 bg-stone-200" aria-hidden="true" />

          <button
            type="button"
            onClick={onNextMonth}
            className="p-2 sm:px-3 sm:py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer active:scale-95"
            aria-label="Próximo mês"
            title="Próximo mês"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Quick Month/Year Dropdown Picker */}
      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/10 backdrop-blur-2xs"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute top-12 left-0 sm:left-auto sm:right-auto z-30 w-72 sm:w-80 bg-white rounded-2xl border border-stone-200 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                Selecionar período
              </span>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-xs text-stone-400 hover:text-stone-700 font-medium px-2 py-0.5 rounded"
              >
                Fechar
              </button>
            </div>

            {/* Year selector row */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 scrollbar-none">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => onSelectMonthYear(y, month)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold shrink-0 transition-colors ${
                    y === year
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-3 gap-1.5">
              {MONTH_NAMES.map((name, idx) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onSelectMonthYear(year, idx);
                    setShowPicker(false);
                  }}
                  className={`px-2 py-2 text-xs rounded-lg font-medium transition-colors text-center ${
                    idx === month
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
