export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'inactive';
export type WorkDayState = 'none' | 'full' | 'half';
export type WorkRecords = Record<string, 'full' | 'half'>;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
}

export interface IconItem {
  id: string;
  name: string;
  icon: string;
  description?: string;
  active: number;
  created_at?: string;
}

export interface CalendarDayEntry {
  entryId: string;
  icons: IconItem[];
}

export type CalendarEntriesMap = Record<string, CalendarDayEntry>;

export interface MonthSummaryData {
  fullDays: number;
  halfDays: number;
  totalDaysEquivalent: number;
  totalIconsCount: number;
  activeDaysCount: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  target?: string;
  created_at: string;
}

// INMET Official Weather Alert
export interface InmetAlert {
  id: number | string;
  evento: string;
  severidade: string;
  nivel: number; // 1 = Amarelo, 2 = Laranja, 3 = Vermelho
  cor: 'amarelo' | 'laranja' | 'vermelho';
  corHex: string;
  corLabel: string;
  emoji: string;
  inicio: string;
  fim: string;
  inicioFormatado: string;
  fimFormatado: string;
  estados: string[];
  municipiosAfetados: number;
  geocodes?: number[];
  riscos: string[];
  instrucoes: string[];
  fonte: string;
  url?: string;
  afetaUsuario: boolean;
}

// Daily Forecast from Primary Weather API (Open-Meteo) merged with INMET Alerts
export interface DayWeatherForecast {
  date: string; // 'YYYY-MM-DD'
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  weatherDesc: string;
  weatherEmoji: string;
  rainProbability: number;
  precipitationMm: number;
  uvIndex: number;
  sunrise?: string;
  sunset?: string;
  inmetAlerts: InmetAlert[];
  highestAlert: InmetAlert | null;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherDesc: string;
  weatherEmoji: string;
  time: string;
}

export interface WeatherResponse {
  city: string;
  state: string;
  ibgeId: number;
  current: CurrentWeather;
  daily: DayWeatherForecast[];
  allInmetAlerts: InmetAlert[];
  fontes: {
    previsao: string;
    alertas: string;
  };
  updatedAt: string;
  nextUpdateAt?: string;
  cacheExpiresInMinutes?: number;
  updateInterval?: string;
}

export interface UserSettings {
  user_id: string;
  city: string;
  state: string;
  ibge_id: number;
  latitude?: number;
  longitude?: number;
  theme: 'light' | 'dark' | 'system';
  updated_at?: string;
}

export interface CityOption {
  name: string;
  state: string;
  ibgeId: number;
  lat: number;
  lon: number;
}

