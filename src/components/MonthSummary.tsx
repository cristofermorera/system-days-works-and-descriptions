import React from 'react';
import type { MonthSummaryData } from '../types';
import { IconRenderer } from './IconRenderer';

interface MonthSummaryProps {
  summary: MonthSummaryData;
  monthName: string;
  year: number;
}

export const MonthSummary: React.FC<MonthSummaryProps> = ({
  summary,
  monthName,
  year,
}) => {
  const { fullDays, halfDays, totalDaysEquivalent, activeDaysCount, totalIconsCount } = summary;

  // Format total: e.g. "19" or "19,5"
  const formattedTotal =
    totalDaysEquivalent % 1 === 0
      ? totalDaysEquivalent.toString()
      : totalDaysEquivalent.toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

  return (
    <section
      aria-label="Resumo do mês"
      className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-stone-600">
            Resumo do Mês
          </span>
          <h2 className="text-base sm:text-lg font-semibold text-stone-900">
            {monthName} {year}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-600 font-medium">Total de dias</div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">
            {formattedTotal}{' '}
            <span className="text-xs sm:text-sm font-semibold text-stone-600">
              {totalDaysEquivalent === 1 ? 'dia equiv.' : 'dias equiv.'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* Período Integral */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-stone-50/70 border border-stone-100">
          <div className="shrink-0 p-1 bg-white rounded-lg border border-stone-200/60 shadow-2xs flex items-center justify-center">
            <IconRenderer icon="check_full" size="sm" />
          </div>
          <div>
            <div className="text-xs text-stone-600 font-medium">Trabalhados</div>
            <div className="text-lg sm:text-xl font-bold text-stone-900 tabular-nums">
              {fullDays}{' '}
              <span className="text-[11px] font-normal text-stone-600">
                {fullDays === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>
        </div>

        {/* Meio Turno */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-stone-50/70 border border-stone-100">
          <div className="shrink-0 p-1 bg-white rounded-lg border border-stone-200/60 shadow-2xs flex items-center justify-center">
            <IconRenderer icon="check_half" size="sm" />
          </div>
          <div>
            <div className="text-xs text-stone-600 font-medium">Meio turno</div>
            <div className="text-lg sm:text-xl font-bold text-stone-900 tabular-nums">
              {halfDays}{' '}
              <span className="text-[11px] font-normal text-stone-600">
                {halfDays === 1 ? 'dia (×0,5)' : 'dias (×0,5)'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Equivalente */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-2xs">
            ∑
          </div>
          <div>
            <div className="text-xs text-emerald-900 font-medium">Total</div>
            <div className="text-lg sm:text-xl font-bold text-emerald-950 tabular-nums">
              {formattedTotal}{' '}
              <span className="text-[11px] font-normal text-emerald-800">
                {totalDaysEquivalent === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {activeDaysCount > 0 && (
        <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>{activeDaysCount} dia(s) com marcações neste mês</span>
          <span>{totalIconsCount} ícone(s) no total</span>
        </div>
      )}
    </section>
  );
};
