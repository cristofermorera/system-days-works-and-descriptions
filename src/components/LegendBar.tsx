import React from 'react';
import { IconRenderer } from './IconRenderer';
import { HelpCircle, Sliders } from 'lucide-react';

interface LegendBarProps {
  startOnMonday: boolean;
  onToggleStartDay: () => void;
}

export const LegendBar: React.FC<LegendBarProps> = ({
  startOnMonday,
  onToggleStartDay,
}) => {
  const [showPreferences, setShowPreferences] = React.useState(false);

  return (
    <div className="mt-4 pt-3 border-t border-stone-200/80">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        {/* Visual Legend explaining key icons */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-5">
          {/* Não trabalhado */}
          <div className="flex items-center gap-1.5" title="Apenas o número do dia">
            <div className="w-5 h-5 rounded-md border border-stone-200 bg-white flex items-center justify-center font-medium text-[10px] text-stone-600">
              17
            </div>
            <span className="font-medium text-stone-700">Sem marcação</span>
          </div>

          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">
            ·
          </span>

          {/* Trabalhado */}
          <div className="flex items-center gap-1.5" title="Check completo (1 dia)">
            <IconRenderer icon="check_full" size="xs" />
            <span className="font-medium text-stone-700">Trabalhado (1,0)</span>
          </div>

          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">
            ·
          </span>

          {/* Meio turno */}
          <div
            className="flex items-center gap-1.5"
            title="Meio check com divisão visual (0,5 dia)"
          >
            <IconRenderer icon="check_half" size="xs" />
            <span className="font-medium text-stone-700">Meio turno (0,5)</span>
          </div>

          <span className="text-stone-300 hidden sm:inline" aria-hidden="true">
            ·
          </span>

          {/* Múltiplos ícones */}
          <div className="flex items-center gap-1 text-[11px] text-stone-500">
            <span>🏠 🚗 📋 ⭐</span>
            <span>(até 6 ícones)</span>
          </div>
        </div>

        {/* Action / settings toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 hover:text-stone-800 px-2 py-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <Sliders className="w-3 h-3 text-stone-500" />
            <span>Opções</span>
          </button>
        </div>
      </div>

      {/* Preferences drawer */}
      {showPreferences && (
        <div className="mt-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-stone-600">Início da semana:</span>
            <button
              type="button"
              onClick={onToggleStartDay}
              className="px-2.5 py-1 bg-white border border-stone-200 rounded-md font-medium text-stone-800 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
            >
              {startOnMonday ? 'Segunda-feira' : 'Domingo'}
            </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-500">
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>Toque em qualquer dia para abrir o seletor de ícones</span>
          </div>
        </div>
      )}
    </div>
  );
};
