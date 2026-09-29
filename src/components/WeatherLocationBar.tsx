import React, { useState } from 'react';
import type { WeatherResponse, InmetAlert, CityOption } from '../types';
import {
  MapPin,
  AlertTriangle,
  Sun,
  Moon,
  Laptop,
  Check,
  RefreshCw,
  Search,
} from 'lucide-react';

interface WeatherLocationBarProps {
  weather: WeatherResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
  currentTheme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onCityChange: (city: string, state: string, ibgeId?: number) => void;
  onOpenAlertDetails: (alert: InmetAlert, dateKey: string) => void;
  cities: CityOption[];
}

export const WeatherLocationBar: React.FC<WeatherLocationBarProps> = ({
  weather,
  isLoading,
  onRefresh,
  currentTheme,
  onThemeChange,
  onCityChange,
  onOpenAlertDetails,
  cities,
}) => {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customUf, setCustomUf] = useState('RS');

  const activeAlerts = weather?.allInmetAlerts || [];
  const highestActiveAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;

  const filteredCities = cities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchCity.toLowerCase()) ||
      c.state.toLowerCase().includes(searchCity.toLowerCase())
  );

  const handleSelectCity = (c: CityOption) => {
    onCityChange(c.name, c.state, c.ibgeId);
    setShowLocationPicker(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCity.trim()) {
      onCityChange(customCity.trim(), customUf.trim().toUpperCase());
      setShowLocationPicker(false);
      setCustomCity('');
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-3 sm:px-4 shadow-xs transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: Location & Current Weather */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Location button */}
          <button
            type="button"
            onClick={() => setShowLocationPicker(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold transition-colors cursor-pointer group"
            title="Alterar cidade / localização"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>
              {weather ? `${weather.city} — ${weather.state}` : 'Santiago — RS'}
            </span>
            <span className="text-[10px] text-stone-400 font-normal">Alterar</span>
          </button>

          {/* Current weather glance (from Open-Meteo) */}
          {weather?.current && (
            <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
              <span className="text-base leading-none">{weather.current.weatherEmoji}</span>
              <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                {weather.current.temperature}°C
              </span>
              <span className="hidden sm:inline text-stone-500">
                (sensação {weather.current.apparentTemperature}°C · umidade {weather.current.relativeHumidity}%)
              </span>
            </div>
          )}

          {/* Refresh button with hourly indicator */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Previsão atualizada de hora em hora. Clique para atualizar agora."
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <span
              className="text-[10px] text-stone-400 dark:text-stone-500 font-medium hidden sm:inline"
              title="Previsão meteorológica com atualização de hora em hora"
            >
              1h
            </span>
          </div>
        </div>

        {/* Center: Active INMET Alert Pill (if any alert affects the location) */}
        {highestActiveAlert ? (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => onOpenAlertDetails(highestActiveAlert, highestActiveAlert.inicio.slice(0, 10))}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 animate-pulse
                ${
                  highestActiveAlert.cor === 'vermelho'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : highestActiveAlert.cor === 'laranja'
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-amber-400 text-amber-950 hover:bg-amber-500'
                }
              `}
              title="Clique para ver os detalhes oficiais do INMET"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {highestActiveAlert.emoji} ALERTA INMET: {highestActiveAlert.evento}
              </span>
              {activeAlerts.length > 1 && (
                <span className="text-[10px] bg-black/20 px-1 py-0.2 rounded-full font-mono">
                  +{activeAlerts.length - 1}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>Sem alertas meteorológicos do INMET no momento</span>
          </div>
        )}

        {/* Right: Theme Switcher (Claro / Escuro / Automático) */}
        <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentTheme === 'light'
                ? 'bg-white text-amber-600 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Tema Claro"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentTheme === 'dark'
                ? 'bg-stone-900 text-indigo-400 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Tema Escuro"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onThemeChange('system')}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              currentTheme === 'system'
                ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Tema Automático (Sistema)"
          >
            <Laptop className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Configurar Localização
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationPicker(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 my-3 shrink-0">
              O INMET e a previsão meteorológica utilizam sua cidade para exibir alertas locais e previsões diárias personalizadas.
            </p>

            {/* Quick search input */}
            <div className="relative mb-3 shrink-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Filtrar capitais e cidades principais..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Predefined Cities List */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 pr-1 max-h-56">
              {filteredCities.map((c) => {
                const isSelected =
                  weather?.city.toLowerCase() === c.name.toLowerCase() &&
                  weather?.state.toLowerCase() === c.state.toLowerCase();
                return (
                  <button
                    key={`${c.name}-${c.state}`}
                    type="button"
                    onClick={() => handleSelectCity(c)}
                    className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <span>
                      {c.name} — <span className="font-semibold text-stone-500">{c.state}</span>
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                );
              })}
            </div>

            {/* Custom City Form */}
            <form onSubmit={handleCustomSubmit} className="pt-3.5 border-t border-stone-100 dark:border-stone-800 mt-2 shrink-0 space-y-2">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block">
                Outra cidade brasileira:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder="Nome da cidade (ex: Santiago)"
                  className="flex-1 px-3 py-1.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={customUf}
                  onChange={(e) => setCustomUf(e.target.value.toUpperCase())}
                  placeholder="UF"
                  className="w-14 px-2 py-1.5 text-xs text-center uppercase bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900 dark:text-stone-100 font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
