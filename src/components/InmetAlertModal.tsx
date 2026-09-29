import React, { useState } from 'react';
import type { InmetAlert, DayWeatherForecast } from '../types';
import {
  X,
  AlertTriangle,
  Clock,
  MapPin,
  ShieldAlert,
  Info,
  ExternalLink,
  CloudRain,
  Thermometer,
  Sun,
} from 'lucide-react';
import { MONTH_NAMES } from '../utils/dateUtils';

interface InmetAlertModalProps {
  dateKey: string;
  alerts: InmetAlert[];
  forecast?: DayWeatherForecast;
  cityName: string;
  stateUf: string;
  onClose: () => void;
}

export const InmetAlertModal: React.FC<InmetAlertModalProps> = ({
  dateKey,
  alerts,
  forecast,
  cityName,
  stateUf,
  onClose,
}) => {
  // If multiple alerts, user can toggle between them
  const [selectedAlertIndex, setSelectedAlertIndex] = useState(0);

  const activeAlert = alerts[selectedAlertIndex] || alerts[0];

  // Parse dateKey (YYYY-MM-DD)
  const [yearStr, monthStr, dayStr] = dateKey.split('-');
  const dayNumber = parseInt(dayStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIndex] || '';

  if (!activeAlert && !forecast) {
    return null;
  }

  // Visual styling according to official INMET color
  const colorThemes = {
    vermelho: {
      border: 'border-red-400 dark:border-red-600',
      bgLight: 'bg-red-50 dark:bg-red-950/40',
      badge: 'bg-red-600 text-white shadow-xs',
      kicker: 'text-red-700 dark:text-red-400',
      tag: 'bg-red-100 text-red-900 border-red-200 dark:bg-red-900/50 dark:text-red-200 dark:border-red-800',
    },
    laranja: {
      border: 'border-orange-400 dark:border-orange-600',
      bgLight: 'bg-orange-50 dark:bg-orange-950/40',
      badge: 'bg-orange-600 text-white shadow-xs',
      kicker: 'text-orange-700 dark:text-orange-400',
      tag: 'bg-orange-100 text-orange-950 border-orange-200 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-800',
    },
    amarelo: {
      border: 'border-amber-400 dark:border-amber-600',
      bgLight: 'bg-amber-50 dark:bg-amber-950/40',
      badge: 'bg-amber-500 text-white shadow-xs',
      kicker: 'text-amber-800 dark:text-amber-400',
      tag: 'bg-amber-100 text-amber-950 border-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-800',
    },
  }[activeAlert?.cor || 'amarelo'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col text-stone-900 dark:text-stone-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-modal-title"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                Alerta Meteorológico Oficial — INMET
              </span>
              <h2 id="alert-modal-title" className="text-base sm:text-lg font-bold text-stone-900 dark:text-white leading-tight">
                {dayNumber} de {monthName} de {yearStr} · {cityName} — {stateUf}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* If there are multiple alerts for this day, show tab switcher */}
          {alerts.length > 1 && (
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 px-2 shrink-0">
                {alerts.length} alertas:
              </span>
              {alerts.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedAlertIndex(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                    idx === selectedAlertIndex
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span>{item.emoji}</span>
                  <span>{item.evento}</span>
                  {idx === 0 && <span className="text-[9px] uppercase font-bold text-amber-600">(Principal)</span>}
                </button>
              ))}
            </div>
          )}

          {/* Active Alert Card */}
          {activeAlert ? (
            <div
              className={`p-4 sm:p-5 rounded-2xl border ${colorThemes.border} ${colorThemes.bgLight} space-y-4`}
            >
              {/* Alert Level Badge & Title */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${colorThemes.badge}`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{activeAlert.corLabel}</span>
                </span>

                <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400 font-mono">
                  ID INMET: #{activeAlert.id}
                </span>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  {activeAlert.emoji} {activeAlert.evento}
                </h3>
              </div>

              {/* Timeframe block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800">
                  <Clock className="w-4 h-4 text-stone-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-500 font-medium block">Início oficial:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                      {activeAlert.inicioFormatado}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800">
                  <Clock className="w-4 h-4 text-stone-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-stone-500 font-medium block">Fim previsto:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                      {activeAlert.fimFormatado}
                    </span>
                  </div>
                </div>
              </div>

              {/* Geographic Scope */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800 text-xs">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] text-stone-500 font-medium block">Área afetada:</span>
                  <div className="font-semibold text-stone-800 dark:text-stone-200">
                    {cityName} — {stateUf} e municípios da região
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Estados em alerta: {activeAlert.estados.join(', ')} ({activeAlert.municipiosAfetados} municípios sob aviso)
                  </div>
                </div>
              </div>

              {/* Description & Risks */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-stone-500" />
                  <span>Descrição e Riscos Oficiais</span>
                </h4>
                <div className="p-3 bg-white/90 dark:bg-stone-900/90 rounded-xl border border-stone-200/60 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 leading-relaxed space-y-1">
                  {activeAlert.riscos.map((r, i) => (
                    <p key={i}>• {r}</p>
                  ))}
                </div>
              </div>

              {/* Civil Defense Instructions / Recommendations */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-stone-500" />
                  <span>Recomendações da Defesa Civil</span>
                </h4>
                <div className="p-3 bg-white/90 dark:bg-stone-900/90 rounded-xl border border-stone-200/60 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 leading-relaxed space-y-1">
                  {activeAlert.instrucoes.map((inst, i) => (
                    <p key={i}>✓ {inst}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-center text-xs text-stone-500">
              Nenhum alerta meteorológico emitido pelo INMET para esta data.
            </div>
          )}

          {/* Primary Weather Forecast Section for this day (Open-Meteo) */}
          {forecast && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{forecast.weatherEmoji}</span>
                  <div>
                    <div className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      Previsão Meteorológica: {forecast.weatherDesc}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Fonte: Open-Meteo API
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-stone-900 dark:text-white tabular-nums">
                    {forecast.tempMin}° – {forecast.tempMax}°C
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Min / Máx
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800">
                  <CloudRain className="w-3.5 h-3.5 text-blue-500 mx-auto mb-0.5" />
                  <div className="text-[10px] text-stone-500">Chuva</div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                    {forecast.rainProbability}% ({forecast.precipitationMm} mm)
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800">
                  <Sun className="w-3.5 h-3.5 text-amber-500 mx-auto mb-0.5" />
                  <div className="text-[10px] text-stone-500">Índice UV</div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                    {forecast.uvIndex}
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500 mx-auto mb-0.5" />
                  <div className="text-[10px] text-stone-500">Variação</div>
                  <div className="text-xs font-bold text-stone-800 dark:text-stone-200 tabular-nums">
                    Δ {forecast.tempMax - forecast.tempMin}°C
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Explicit Source Separation Notice */}
          <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/40 text-[11px] text-stone-500 dark:text-stone-400 space-y-1">
            <div className="font-semibold text-stone-700 dark:text-stone-300">
              Transparência de Fontes:
            </div>
            <div>
              • <strong>Alertas Meteorológicos Oficiais:</strong> INMET — Instituto Nacional de Meteorologia (Ministério da Agricultura e Pecuária).
            </div>
            <div>
              • <strong>Previsão de Tempo e Clima:</strong> Open-Meteo API (Modelos numéricos de alta resolução).
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3.5 border-t border-stone-100 dark:border-stone-800 shrink-0">
          <a
            href="https://alertas2.inmet.gov.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Ver no portal oficial do INMET</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
