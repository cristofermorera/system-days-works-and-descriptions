/**
 * Weather Service - Provedor Meteorológico Principal
 * Fonte: Open-Meteo API (Dados abertos, modelos numéricos de alta resolução para a América do Sul)
 */

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

export interface DayForecast {
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
}

export interface WeatherData {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  daily: DayForecast[];
  fonte: string;
  updatedAt: string;
}

// Catálogo pré-mapeado com as principais capitais e cidades (incluindo Santiago - RS) para respostas instantâneas
export const DEFAULT_CITIES: Record<
  string,
  { name: string; state: string; lat: number; lon: number; ibgeId: number }
> = {
  'santiago-rs': { name: 'Santiago', state: 'RS', lat: -29.1917, lon: -54.8661, ibgeId: 4317400 },
  'porto alegre-rs': { name: 'Porto Alegre', state: 'RS', lat: -30.0346, lon: -51.2177, ibgeId: 4314902 },
  'santa maria-rs': { name: 'Santa Maria', state: 'RS', lat: -29.6842, lon: -53.8069, ibgeId: 4316907 },
  'caxias do sul-rs': { name: 'Caxias do Sul', state: 'RS', lat: -29.1678, lon: -51.1794, ibgeId: 4305108 },
  'pelotas-rs': { name: 'Pelotas', state: 'RS', lat: -31.7654, lon: -52.3376, ibgeId: 4314407 },
  'sao paulo-sp': { name: 'São Paulo', state: 'SP', lat: -23.5505, lon: -46.6333, ibgeId: 3550308 },
  'rio de janeiro-rj': { name: 'Rio de Janeiro', state: 'RJ', lat: -22.9068, lon: -43.1729, ibgeId: 3304557 },
  'curitiba-pr': { name: 'Curitiba', state: 'PR', lat: -25.4284, lon: -49.2733, ibgeId: 4106902 },
  'florianopolis-sc': { name: 'Florianópolis', state: 'SC', lat: -27.5954, lon: -48.548, ibgeId: 4205407 },
  'belo horizonte-mg': { name: 'Belo Horizonte', state: 'MG', lat: -19.9167, lon: -43.9345, ibgeId: 3106200 },
  'brasilia-df': { name: 'Brasília', state: 'DF', lat: -15.7975, lon: -47.8919, ibgeId: 5300108 },
  'salvador-ba': { name: 'Salvador', state: 'BA', lat: -12.9777, lon: -38.5016, ibgeId: 2927408 },
  'recife-pe': { name: 'Recife', state: 'PE', lat: -8.0476, lon: -34.877, ibgeId: 2611606 },
  'fortaleza-ce': { name: 'Fortaleza', state: 'CE', lat: -3.7319, lon: -38.5267, ibgeId: 2304400 },
  'goiania-go': { name: 'Goiânia', state: 'GO', lat: -16.6869, lon: -49.2648, ibgeId: 5208707 },
  'campo grande-ms': { name: 'Campo Grande', state: 'MS', lat: -20.4697, lon: -54.6201, ibgeId: 5002704 },
  'cuiaba-mt': { name: 'Cuiabá', state: 'MT', lat: -15.601, lon: -56.0974, ibgeId: 5103403 },
  'manaus-am': { name: 'Manaus', state: 'AM', lat: -3.119, lon: -60.0217, ibgeId: 1302603 },
  'belem-pa': { name: 'Belém', state: 'PA', lat: -1.4558, lon: -48.4902, ibgeId: 1501402 },
};

export function getWeatherCondition(code: number): { desc: string; emoji: string } {
  switch (code) {
    case 0:
      return { desc: 'Céu limpo', emoji: '☀️' };
    case 1:
      return { desc: 'Predomínio de sol', emoji: '🌤️' };
    case 2:
      return { desc: 'Parcialmente nublado', emoji: '⛅' };
    case 3:
      return { desc: 'Nublado / Encoberto', emoji: '☁️' };
    case 45:
    case 48:
      return { desc: 'Nevoeiro', emoji: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { desc: 'Garoa / Chuvisco', emoji: '🌦️' };
    case 61:
      return { desc: 'Chuva fraca', emoji: '🌦️' };
    case 63:
      return { desc: 'Chuva moderada', emoji: '🌧️' };
    case 65:
      return { desc: 'Chuva forte', emoji: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { desc: 'Neve / Geada', emoji: '❄️' };
    case 80:
    case 81:
      return { desc: 'Pancadas de chuva', emoji: '🌦️' };
    case 82:
      return { desc: 'Chuva torrencial', emoji: '⛈️' };
    case 95:
      return { desc: 'Tempestade', emoji: '⛈️' };
    case 96:
    case 99:
      return { desc: 'Tempestade com granizo', emoji: '⛈️' };
    default:
      return { desc: 'Tempo instável', emoji: '🌥️' };
  }
}

// Cache em memória de 1 hora (60 minutos) - Atualização estrita de hora em hora
const CACHE_TTL_MS = 60 * 60 * 1000;
const weatherCache = new Map<string, { timestamp: number; data: WeatherData }>();

export interface WeatherResult {
  data: WeatherData;
  cacheExpiresInMs: number;
  cachedAt: number;
  isFromCache: boolean;
}

/**
 * Busca previsão climática via Open-Meteo API com atualização de hora em hora
 */
export async function getWeatherData(
  city = 'Santiago',
  state = 'RS',
  lat?: number,
  lon?: number,
  forceRefresh = false
): Promise<WeatherResult> {
  const cacheKey = `${city.toLowerCase()}_${state.toLowerCase()}`;
  const cached = weatherCache.get(cacheKey);
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return {
      data: cached.data,
      cacheExpiresInMs: Math.max(0, CACHE_TTL_MS - (now - cached.timestamp)),
      cachedAt: cached.timestamp,
      isFromCache: true,
    };
  }

  // Determinar coordenadas
  let latitude = lat;
  let longitude = lon;

  if (!latitude || !longitude) {
    const key = `${city.trim().toLowerCase()}-${state.trim().toLowerCase()}`;
    const defaultCity = DEFAULT_CITIES[key];
    if (defaultCity) {
      latitude = defaultCity.lat;
      longitude = defaultCity.lon;
    } else {
      // Fallback para Santiago - RS se não encontrada
      latitude = -29.1917;
      longitude = -54.8661;
    }
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset&timezone=America%2FSao_Paulo&forecast_days=14`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();

      const currentCode = json.current?.weather_code ?? 0;
      const currentCond = getWeatherCondition(currentCode);

      const current: CurrentWeather = {
        temperature: Math.round(json.current?.temperature_2m ?? 22),
        apparentTemperature: Math.round(json.current?.apparent_temperature ?? 22),
        relativeHumidity: Math.round(json.current?.relative_humidity_2m ?? 65),
        precipitation: json.current?.precipitation ?? 0,
        windSpeed: Math.round(json.current?.wind_speed_10m ?? 12),
        weatherCode: currentCode,
        weatherDesc: currentCond.desc,
        weatherEmoji: currentCond.emoji,
        time: json.current?.time ?? new Date().toISOString(),
      };

      const dailyTimes: string[] = json.daily?.time ?? [];
      const daily: DayForecast[] = dailyTimes.map((dateStr, idx) => {
        const code = json.daily?.weather_code?.[idx] ?? 0;
        const cond = getWeatherCondition(code);
        return {
          date: dateStr,
          tempMax: Math.round(json.daily?.temperature_2m_max?.[idx] ?? 25),
          tempMin: Math.round(json.daily?.temperature_2m_min?.[idx] ?? 17),
          weatherCode: code,
          weatherDesc: cond.desc,
          weatherEmoji: cond.emoji,
          rainProbability: json.daily?.precipitation_probability_max?.[idx] ?? 0,
          precipitationMm: json.daily?.precipitation_sum?.[idx] ?? 0,
          uvIndex: Math.round((json.daily?.uv_index_max?.[idx] ?? 5) * 10) / 10,
          sunrise: json.daily?.sunrise?.[idx] ? json.daily.sunrise[idx].slice(11, 16) : undefined,
          sunset: json.daily?.sunset?.[idx] ? json.daily.sunset[idx].slice(11, 16) : undefined,
        };
      });

      const weatherData: WeatherData = {
        city,
        state,
        latitude,
        longitude,
        current,
        daily,
        fonte: 'Open-Meteo API',
        updatedAt: new Date().toISOString(),
      };

      weatherCache.set(cacheKey, { timestamp: now, data: weatherData });
      return {
        data: weatherData,
        cacheExpiresInMs: CACHE_TTL_MS,
        cachedAt: now,
        isFromCache: false,
      };
    }
  } catch (err) {
    console.warn('[Weather Service] Falha ao consultar Open-Meteo:', err);
  }

  // Fallback caso a API esteja inacessível
  const fallback = cached?.data || generateFallbackWeather(city, state, latitude, longitude);
  return {
    data: fallback,
    cacheExpiresInMs: cached ? Math.max(0, CACHE_TTL_MS - (now - cached.timestamp)) : CACHE_TTL_MS,
    cachedAt: cached ? cached.timestamp : now,
    isFromCache: Boolean(cached),
  };
}

function generateFallbackWeather(
  city: string,
  state: string,
  latitude: number,
  longitude: number
): WeatherData {
  const currentCond = getWeatherCondition(1);
  const now = new Date();

  const daily: DayForecast[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    daily.push({
      date: dateStr,
      tempMax: 26,
      tempMin: 18,
      weatherCode: 1,
      weatherDesc: 'Predomínio de sol',
      weatherEmoji: '🌤️',
      rainProbability: 20,
      precipitationMm: 0,
      uvIndex: 6,
    });
  }

  return {
    city,
    state,
    latitude,
    longitude,
    current: {
      temperature: 24,
      apparentTemperature: 25,
      relativeHumidity: 60,
      precipitation: 0,
      windSpeed: 14,
      weatherCode: 1,
      weatherDesc: currentCond.desc,
      weatherEmoji: currentCond.emoji,
      time: now.toISOString(),
    },
    daily,
    fonte: 'Open-Meteo API (Offline Fallback)',
    updatedAt: now.toISOString(),
  };
}
