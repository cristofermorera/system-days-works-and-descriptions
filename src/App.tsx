import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  User,
  IconItem,
  CalendarEntriesMap,
  WeatherResponse,
  InmetAlert,
  DayWeatherForecast,
  CityOption,
  UserSettings,
} from './types';
import { api, tokenStorage } from './services/api';
import {
  MONTH_NAMES,
  WEEKDAYS_MONDAY_FIRST,
  WEEKDAYS_SUNDAY_FIRST,
  getCalendarGrid,
  computeMonthSummary,
} from './utils/dateUtils';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { CalendarCell } from './components/CalendarCell';
import { MonthNav } from './components/MonthNav';
import { MonthSummary } from './components/MonthSummary';
import { LegendBar } from './components/LegendBar';
import { DayIconsModal } from './components/DayIconsModal';
import { WeatherLocationBar } from './components/WeatherLocationBar';
import { InmetAlertModal } from './components/InmetAlertModal';
import {
  CheckCircle2,
  LogOut,
  Shield,
  Printer,
  User as UserIcon,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

const PREF_START_MONDAY_KEY = 'work_calendar_start_monday_v1';
const PREF_THEME_KEY = 'work_calendar_theme_v1';
const WEATHER_CACHE_KEY = 'work_calendar_weather_cache_v1';
const HOURLY_INTERVAL_MS = 60 * 60 * 1000; // 1 hora de intervalo para atualização meteorológica

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth());

  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App view: 'calendar' | 'admin'
  const [currentView, setCurrentView] = useState<'calendar' | 'admin'>('calendar');

  // Calendar entries from backend
  const [entries, setEntries] = useState<CalendarEntriesMap>({});
  const [availableIcons, setAvailableIcons] = useState<IconItem[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  // Admin feature: view other user's calendar
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Day icons modal state
  const [activeDateModal, setActiveDateModal] = useState<string | null>(null);

  // Weather & INMET alerts state
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);

  // INMET alert modal state
  const [activeAlertModal, setActiveAlertModal] = useState<{
    dateKey: string;
    alerts: InmetAlert[];
  } | null>(null);

  // Clear month confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Theme state: 'light' | 'dark' | 'system'
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    try {
      const saved = localStorage.getItem(PREF_THEME_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {}
    return 'system';
  });

  // Apply theme to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen to OS theme changes if on system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      localStorage.setItem(PREF_THEME_KEY, newTheme);
      if (currentUser) {
        api.updateUserSettings({ theme: newTheme }).catch(() => {});
      }
    } catch {}
  };

  // Start on Monday preference
  const [startOnMonday, setStartOnMonday] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(PREF_START_MONDAY_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Check auth session on startup
  useEffect(() => {
    const checkSession = async () => {
      const token = tokenStorage.get();
      if (!token) {
        setIsAuthChecking(false);
        return;
      }
      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
        setSelectedUserId(res.user.id);
      } catch {
        tokenStorage.clear();
        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkSession();
  }, []);

  // Fetch available icons
  const loadIcons = useCallback(async () => {
    try {
      const res = await api.getIcons();
      setAvailableIcons(res.icons);
    } catch (err) {
      console.error('Erro ao carregar ícones:', err);
    }
  }, []);

  // Fetch users list for admin user-switcher
  const loadAllUsers = useCallback(async () => {
    if (currentUser?.role === 'admin') {
      try {
        const res = await api.getUsers();
        setAllUsers(res.users);
      } catch (err) {
        console.error('Erro ao carregar lista de usuários:', err);
      }
    }
  }, [currentUser]);

  // Fetch user settings (location, city, theme)
  const loadSettingsAndCities = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [settingsRes, citiesRes] = await Promise.all([
        api.getUserSettings(),
        api.getCities(),
      ]);
      setUserSettings(settingsRes.settings);
      setCities(citiesRes.cities);
      if (settingsRes.settings.theme) {
        setTheme(settingsRes.settings.theme);
      }
      return settingsRes.settings;
    } catch (err) {
      console.error('Erro ao carregar configurações de usuário:', err);
      return null;
    }
  }, [currentUser]);

  const userSettingsRef = React.useRef<UserSettings | null>(userSettings);
  useEffect(() => {
    userSettingsRef.current = userSettings;
  }, [userSettings]);

  // Fetch weather data and INMET alerts with strict 1-hour interval and cache
  const loadWeather = useCallback(async (
    customCity?: string,
    customState?: string,
    customIbge?: number,
    forceRefresh = false
  ) => {
    if (!currentUser) return;

    const city = customCity || userSettingsRef.current?.city || 'Santiago';
    const state = customState || userSettingsRef.current?.state || 'RS';
    const ibgeId = customIbge || userSettingsRef.current?.ibge_id || 4317400;

    // Se NÃO for atualização forçada, verifica se há cache local válido com menos de 1 hora
    if (!forceRefresh) {
      try {
        const cachedRaw = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const isSameLocation =
            cached.city?.toLowerCase() === city.toLowerCase() &&
            cached.state?.toLowerCase() === state.toLowerCase();
          const elapsed = Date.now() - (cached.cachedAt || 0);

          if (isSameLocation && elapsed < HOURLY_INTERVAL_MS && cached.data) {
            setWeather(cached.data);
            return;
          }
        }
      } catch (e) {
        console.warn('Erro ao ler cache meteorológico:', e);
      }
    }

    setIsLoadingWeather(true);
    try {
      const data = await api.getWeather({ city, state, ibgeId, forceRefresh });
      setWeather(data);

      // Salva no cache local com timestamp para controle estrito de hora em hora
      try {
        localStorage.setItem(
          WEATHER_CACHE_KEY,
          JSON.stringify({
            city,
            state,
            ibgeId,
            data,
            cachedAt: Date.now(),
          })
        );
      } catch {}
    } catch (err) {
      console.error('Erro ao consultar dados meteorológicos / INMET:', err);
    } finally {
      setIsLoadingWeather(false);
    }
  }, [currentUser]);

  // Fetch calendar entries for current month and selected user
  const loadCalendarEntries = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingCalendar(true);
    try {
      const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const targetUser = currentUser.role === 'admin' && selectedUserId ? selectedUserId : currentUser.id;
      const res = await api.getCalendar(monthPrefix, targetUser);
      setEntries(res.entries);
    } catch (err) {
      console.error('Erro ao carregar dados do calendário:', err);
    } finally {
      setIsLoadingCalendar(false);
    }
  }, [currentUser, currentYear, currentMonth, selectedUserId]);

  useEffect(() => {
    if (currentUser) {
      loadIcons();
      loadAllUsers();
      loadSettingsAndCities().then((st) => {
        loadWeather(st?.city, st?.state, st?.ibge_id, false);
      });
    }
  }, [currentUser, loadIcons, loadAllUsers, loadSettingsAndCities, loadWeather]);

  // Timer de atualização estrita de hora em hora (60 minutos)
  useEffect(() => {
    if (!currentUser) return;

    // Checa periodicamente se 1 hora já se passou desde o último salvamento
    const timerId = setInterval(() => {
      try {
        const cachedRaw = localStorage.getItem(WEATHER_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const elapsed = Date.now() - (cached.cachedAt || 0);
          if (elapsed >= HOURLY_INTERVAL_MS) {
            // Passou 1 hora: atualiza silenciosamente a previsão e alertas
            loadWeather(cached.city, cached.state, cached.ibgeId, true);
          }
        } else {
          loadWeather(undefined, undefined, undefined, false);
        }
      } catch {}
    }, 60 * 1000); // Verificação a cada minuto

    return () => clearInterval(timerId);
  }, [currentUser, loadWeather]);

  useEffect(() => {
    if (currentUser && currentView === 'calendar') {
      loadCalendarEntries();
    }
  }, [currentUser, currentView, loadCalendarEntries]);

  // Handle location change (força atualização para nova cidade)
  const handleCityChange = async (city: string, state: string, ibgeId?: number) => {
    try {
      const res = await api.updateUserSettings({ city, state, ibge_id: ibgeId });
      setUserSettings(res.settings);
      loadWeather(city, state, ibgeId, true);
    } catch (err) {
      console.error('Erro ao atualizar cidade:', err);
    }
  };

  // Open INMET alert details modal
  const handleOpenAlertDetails = (alert: InmetAlert, dateKey: string) => {
    // Find all alerts covering this day
    const matchingAlerts = weather?.allInmetAlerts.filter((a) => {
      const start = a.inicio.slice(0, 10);
      const end = a.fim.slice(0, 10);
      return dateKey >= start && dateKey <= end;
    }) || [alert];

    setActiveAlertModal({
      dateKey,
      alerts: matchingAlerts.length > 0 ? matchingAlerts : [alert],
    });
  };

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setSelectedUserId(user.id);
    setCurrentView('calendar');
  };

  // Logout handler
  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSelectedUserId('');
    setEntries({});
    setWeather(null);
    setCurrentView('calendar');
  };

  // Toggle start of week preference
  const handleToggleStartDay = () => {
    const nextVal = !startOnMonday;
    setStartOnMonday(nextVal);
    try {
      localStorage.setItem(PREF_START_MONDAY_KEY, String(nextVal));
    } catch {}
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleSelectMonthYear = (year: number, month: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
  };

  // Save icons for a specific day
  const handleSaveDayIcons = async (dateKey: string, iconIds: string[]) => {
    const targetUser = currentUser?.role === 'admin' && selectedUserId ? selectedUserId : currentUser?.id;
    const res = await api.updateCalendarEntry(dateKey, iconIds, targetUser);
    setEntries((prev) => {
      const updated = { ...prev };
      if (res.icons.length === 0) {
        delete updated[dateKey];
      } else {
        updated[dateKey] = {
          entryId: prev[dateKey]?.entryId || 'entry_temp',
          icons: res.icons,
        };
      }
      return updated;
    });
  };

  // Clear current month
  const handleClearCurrentMonth = async () => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const targetUser = currentUser?.role === 'admin' && selectedUserId ? selectedUserId : currentUser?.id;

    const keysToRemove = Object.keys(entries).filter((k) => k.startsWith(monthPrefix));
    for (const key of keysToRemove) {
      try {
        await api.updateCalendarEntry(key, [], targetUser);
      } catch (err) {
        console.error('Erro ao limpar dia:', err);
      }
    }
    loadCalendarEntries();
    setShowClearConfirm(false);
  };

  // Print schedule
  const handlePrint = () => {
    window.print();
  };

  // Calendar cells
  const gridCells = useMemo(() => {
    return getCalendarGrid(currentYear, currentMonth, startOnMonday);
  }, [currentYear, currentMonth, startOnMonday]);

  // Weekdays header
  const weekdays = useMemo(() => {
    return startOnMonday ? WEEKDAYS_MONDAY_FIRST : WEEKDAYS_SUNDAY_FIRST;
  }, [startOnMonday]);

  // Monthly summary
  const summary = useMemo(() => {
    return computeMonthSummary(entries, currentYear, currentMonth);
  }, [entries, currentYear, currentMonth]);

  // Quick lookup map of weather forecast by date ('YYYY-MM-DD')
  const weatherMap = useMemo(() => {
    const map: Record<string, DayWeatherForecast> = {};
    if (weather?.daily) {
      for (const d of weather.daily) {
        map[d.date] = d;
      }
    }
    return map;
  }, [weather]);

  const isCurrentRealMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const currentMonthName = MONTH_NAMES[currentMonth];

  // Selected user object (when admin is viewing someone else's calendar)
  const viewedUser = useMemo(() => {
    if (selectedUserId && allUsers.length > 0) {
      return allUsers.find((u) => u.id === selectedUserId) || currentUser;
    }
    return currentUser;
  }, [selectedUserId, allUsers, currentUser]);

  // 1. Loading screen
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-stone-950 text-stone-500 text-xs">
        Carregando aplicativo...
      </div>
    );
  }

  // 2. Unauthenticated: Show Login screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 3. Admin View
  if (currentView === 'admin' && currentUser.role === 'admin') {
    return (
      <AdminPanel
        currentUser={currentUser}
        onBackToCalendar={() => {
          setCurrentView('calendar');
          loadIcons();
          loadCalendarEntries();
          loadWeather();
        }}
      />
    );
  }

  // 4. Main Calendar View
  return (
    <div className="min-h-screen bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-16 pt-4 sm:pt-6 px-3 sm:px-6 transition-colors">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
        {/* Top Header Bar with User & Navigation Controls */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-stone-200/80 dark:border-stone-800 print:hidden">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white tracking-tight leading-none">
                Controle de Dias Trabalhados
              </h1>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-0.5">
                Calendário visual com alertas oficiais do INMET
              </p>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Admin: View other users' calendars */}
            {currentUser.role === 'admin' && allUsers.length > 1 && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
                <span className="text-stone-500 text-[11px]">Ver:</span>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent font-semibold text-stone-800 dark:text-stone-200 text-xs focus:outline-none cursor-pointer"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id} className="dark:bg-stone-900">
                      {u.name} {u.id === currentUser.id ? '(Você)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin area button */}
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Administração</span>
              </button>
            )}

            {/* User identification badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 rounded-xl text-xs shadow-2xs">
              <UserIcon className="w-3.5 h-3.5 text-stone-500" />
              <span className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[130px]">
                {currentUser.name}
              </span>
              {currentUser.role === 'admin' && (
                <span className="text-[10px] px-1 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded">
                  Admin
                </span>
              )}
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
              title="Imprimir calendário"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Weather & INMET Official Alerts Location Bar */}
        <WeatherLocationBar
          weather={weather}
          isLoading={isLoadingWeather}
          onRefresh={() => loadWeather(undefined, undefined, undefined, true)}
          currentTheme={theme}
          onThemeChange={handleThemeChange}
          onCityChange={handleCityChange}
          onOpenAlertDetails={handleOpenAlertDetails}
          cities={cities}
        />

        {/* If Admin is viewing another user's calendar banner */}
        {currentUser.role === 'admin' && selectedUserId && selectedUserId !== currentUser.id && (
          <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>
                Visualizando o calendário de <strong>{viewedUser?.name}</strong> ({viewedUser?.email})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUserId(currentUser.id)}
              className="font-bold underline text-amber-800 dark:text-amber-300 hover:text-amber-950 text-xs cursor-pointer"
            >
              Voltar ao meu calendário
            </button>
          </div>
        )}

        {/* Main Calendar Card */}
        <main className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/90 dark:border-stone-800 shadow-sm p-4 sm:p-7 transition-colors">
          {/* Month Navigation & Title */}
          <MonthNav
            year={currentYear}
            month={currentMonth}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onGoToToday={handleGoToToday}
            onSelectMonthYear={handleSelectMonthYear}
            isCurrentRealMonth={isCurrentRealMonth}
          />

          {/* Calendar Grid Container */}
          <div className="w-full relative">
            {isLoadingCalendar && (
              <div className="absolute inset-0 bg-white/40 dark:bg-stone-900/40 backdrop-blur-2xs z-10 flex items-center justify-center rounded-2xl">
                <span className="text-xs font-semibold text-stone-500">
                  Carregando marcações...
                </span>
              </div>
            )}

            {/* Weekday Names Header */}
            <div
              className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mb-2"
              role="row"
              aria-label="Dias da semana"
            >
              {weekdays.map((wd) => (
                <div
                  key={wd.short}
                  className={`
                    text-center py-2 text-xs sm:text-sm font-semibold tracking-wide
                    ${wd.isWeekend ? 'text-stone-400 dark:text-stone-500' : 'text-stone-700 dark:text-stone-300'}
                  `}
                  title={wd.full}
                  role="columnheader"
                >
                  <span className="hidden sm:inline">{wd.full.split('-')[0]}</span>
                  <span className="sm:hidden">{wd.short}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days 7-column Grid */}
            <div
              className="grid grid-cols-7 gap-1.5 sm:gap-2.5"
              role="grid"
              aria-label={`Calendário de ${currentMonthName} de ${currentYear}`}
            >
              {gridCells.map((dayInfo) => {
                const dayEntry = entries[dayInfo.dateKey];
                const dayIcons = dayEntry?.icons || [];
                const dayForecast = weatherMap[dayInfo.dateKey];

                return (
                  <CalendarCell
                    key={dayInfo.dateKey}
                    dayInfo={dayInfo}
                    icons={dayIcons}
                    forecast={dayForecast}
                    onOpenModal={(dateKey) => setActiveDateModal(dateKey)}
                    onOpenAlert={(alert, dateKey) => handleOpenAlertDetails(alert, dateKey)}
                  />
                );
              })}
            </div>
          </div>

          {/* Legend and preferences bar */}
          <LegendBar
            startOnMonday={startOnMonday}
            onToggleStartDay={handleToggleStartDay}
          />

          {/* Quick Clear Month trigger */}
          <div className="mt-3 pt-2 text-right">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-[11px] font-medium text-stone-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar marcações de {currentMonthName}</span>
            </button>
          </div>
        </main>

        {/* Resumo do Mês (Automatic Summary) */}
        <MonthSummary
          summary={summary}
          monthName={currentMonthName}
          year={currentYear}
        />

        {/* Modal for adding/removing up to 6 icons for a day */}
        {activeDateModal && (
          <DayIconsModal
            dateKey={activeDateModal}
            currentIcons={entries[activeDateModal]?.icons || []}
            availableIcons={availableIcons.filter((i) => i.active === 1)}
            onSave={handleSaveDayIcons}
            onClose={() => setActiveDateModal(null)}
            canEdit={true}
          />
        )}

        {/* INMET Official Alert Details Modal */}
        {activeAlertModal && (
          <InmetAlertModal
            dateKey={activeAlertModal.dateKey}
            alerts={activeAlertModal.alerts}
            forecast={weatherMap[activeAlertModal.dateKey]}
            cityName={weather?.city || 'Santiago'}
            stateUf={weather?.state || 'RS'}
            onClose={() => setActiveAlertModal(null)}
          />
        )}

        {/* Clear Month Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-150">
              <h3 className="text-base font-bold text-stone-900 dark:text-white mb-1.5">
                Limpar marcações de {currentMonthName}?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-5">
                Esta ação removerá todos os ícones de trabalho marcados em{' '}
                <strong className="text-stone-700 dark:text-stone-300 font-semibold">
                  {currentMonthName} de {currentYear}
                </strong>
                . As previsões meteorológicas e alertas do INMET não são afetados.
              </p>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleClearCurrentMonth}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar e Limpar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quiet footer with transparency of sources */}
        <footer className="text-center text-xs text-stone-500 dark:text-stone-400 py-2 print:hidden space-y-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span>Previsão: Open-Meteo API</span>
            <span aria-hidden="true">·</span>
            <span>Alertas Oficiais: INMET (Instituto Nacional de Meteorologia)</span>
            <span aria-hidden="true">·</span>
            <span>Localização: {weather?.city || 'Santiago'} — {weather?.state || 'RS'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
