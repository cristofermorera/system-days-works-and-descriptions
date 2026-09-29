/**
 * INMET Service - Integração Oficial de Alertas Meteorológicos no Brasil
 * Fonte oficial: Instituto Nacional de Meteorologia (INMET)
 */

export interface InmetAlert {
  id: number | string;
  evento: string;
  severidade: string; // 'Perigo Potencial' | 'Perigo' | 'Grande Perigo'
  nivel: number; // 1 = Amarelo, 2 = Laranja, 3 = Vermelho
  cor: 'amarelo' | 'laranja' | 'vermelho';
  corHex: string;
  corLabel: string;
  emoji: string;
  inicio: string; // 'YYYY-MM-DD HH:mm'
  fim: string; // 'YYYY-MM-DD HH:mm'
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

interface InmetCache {
  timestamp: number;
  alertas: any[];
}

// Cache em memória de 1 hora (60 minutos) - Atualização estrita de hora em hora
const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: InmetCache | null = null;

// Normalização da classificação oficial do INMET
export function parseSeverity(nivelOrText: number | string): {
  nivel: number;
  cor: 'amarelo' | 'laranja' | 'vermelho';
  corHex: string;
  corLabel: string;
  emoji: string;
} {
  const str = String(nivelOrText).toLowerCase();

  if (str.includes('grande perigo') || str === '3' || str.includes('vermelh')) {
    return {
      nivel: 3,
      cor: 'vermelho',
      corHex: '#ef4444',
      corLabel: 'Grande Perigo (Alerta Vermelho)',
      emoji: '🔴',
    };
  }

  if (str.includes('perigo') && !str.includes('potencial') || str === '2' || str.includes('laranja')) {
    return {
      nivel: 2,
      cor: 'laranja',
      corHex: '#f97316',
      corLabel: 'Perigo (Alerta Laranja)',
      emoji: '🟠',
    };
  }

  // Nível 1 ou Perigo Potencial
  return {
    nivel: 1,
    cor: 'amarelo',
    corHex: '#eab308',
    corLabel: 'Perigo Potencial (Alerta Amarelo)',
    emoji: '🟡',
  };
}

function formatInmetDate(dateStr: string): string {
  try {
    // Formato esperado: "YYYY-MM-DD HH:mm" ou ISO
    const [datePart, timePart] = dateStr.includes('T') ? dateStr.split('T') : dateStr.split(' ');
    const [year, month, day] = datePart.split('-');
    const time = (timePart || '00:00').slice(0, 5);
    return `${day}/${month} às ${time}`;
  } catch {
    return dateStr;
  }
}

/**
 * Busca todos os alertas ativos do INMET com cache e tratamento resiliente de erros
 */
export async function fetchInmetAlerts(forceRefresh = false): Promise<any[]> {
  const now = Date.now();
  if (!forceRefresh && cache && now - cache.timestamp < CACHE_TTL_MS) {
    return cache.alertas;
  }

  try {
    // Fonte primária via espelho em tempo real dos avisos do INMET
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch('https://radarmeteorologico.com.br/api/v1/alertas', {
      headers: {
        'User-Agent': 'ControleTrabalhoApp/1.0 (INMET Integration)',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const rawAlertas = Array.isArray(data.alertas) ? data.alertas : [];
      cache = {
        timestamp: now,
        alertas: rawAlertas,
      };
      return rawAlertas;
    }
  } catch (err) {
    console.warn('[INMET Service] Falha ao consultar feed ao vivo, utilizando cache se disponível:', err);
  }

  if (cache) {
    return cache.alertas;
  }

  return [];
}

/**
 * Filtra e enriquece os alertas do INMET para uma determinada localização e intervalo de datas
 */
export async function getAlertsForLocation(
  state: string,
  city?: string,
  ibgeId?: number,
  forceRefresh = false
): Promise<InmetAlert[]> {
  const rawAlertas = await fetchInmetAlerts(forceRefresh);
  const normalizedState = (state || 'RS').trim().toUpperCase();

  const formattedAlerts: InmetAlert[] = [];

  for (const item of rawAlertas) {
    const estados: string[] = Array.isArray(item.estados)
      ? item.estados.map((e: string) => String(e).trim().toUpperCase())
      : [];

    // Verificação de abrangência geográfica
    const matchesState = estados.includes(normalizedState);

    let matchesCity = true;
    if (ibgeId && Array.isArray(item.geocodes) && item.geocodes.length > 0) {
      // Se há geocodes, verifica se o código IBGE do município está explicitamente listado
      matchesCity = item.geocodes.includes(Number(ibgeId));
    }

    // Se não bate nem no estado, ignora o alerta
    if (!matchesState) {
      continue;
    }

    const { nivel, cor, corHex, corLabel, emoji } = parseSeverity(item.severidade || item.nivel);

    const alertObj: InmetAlert = {
      id: item.id || `inmet_${Math.random()}`,
      evento: item.evento || 'Fenômeno Adverso',
      severidade: item.severidade || corLabel,
      nivel,
      cor,
      corHex,
      corLabel,
      emoji,
      inicio: item.inicio || '',
      fim: item.fim || '',
      inicioFormatado: formatInmetDate(item.inicio || ''),
      fimFormatado: formatInmetDate(item.fim || ''),
      estados,
      municipiosAfetados: item.municipios_afetados || (item.geocodes ? item.geocodes.length : 0),
      geocodes: item.geocodes,
      riscos: Array.isArray(item.riscos) ? item.riscos : [item.descricao || 'Condições meteorológicas adversas.'],
      instrucoes: Array.isArray(item.instrucoes)
        ? item.instrucoes
        : ['Contate a Defesa Civil (telefone 199) e o Corpo de Bombeiros (telefone 193).'],
      fonte: 'INMET — Instituto Nacional de Meteorologia',
      url: item.url || 'https://alertas2.inmet.gov.br/',
      afetaUsuario: matchesState && matchesCity,
    };

    // Apenas inclui se afeta a localização do usuário conforme item 6 do requisito
    if (alertObj.afetaUsuario) {
      formattedAlerts.push(alertObj);
    }
  }

  // Ordena por maior severidade (Vermelho > Laranja > Amarelo) e depois por data de início
  formattedAlerts.sort((a, b) => {
    if (b.nivel !== a.nivel) {
      return b.nivel - a.nivel;
    }
    return a.inicio.localeCompare(b.inicio);
  });

  return formattedAlerts;
}

/**
 * Relaciona os alertas com cada dia do calendário (YYYY-MM-DD)
 */
export function groupAlertsByDay(
  alerts: InmetAlert[],
  year: number,
  month: number
): Record<string, { alerts: InmetAlert[]; highestAlert: InmetAlert }> {
  const result: Record<string, { alerts: InmetAlert[]; highestAlert: InmetAlert }> = {};

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const matchingAlerts = alerts.filter((alert) => {
      // Verifica se o alerta abrange este dia
      const startDate = alert.inicio.slice(0, 10);
      const endDate = alert.fim.slice(0, 10);
      return dateKey >= startDate && dateKey <= endDate;
    });

    if (matchingAlerts.length > 0) {
      // O alerta de maior severidade já fica no topo devido à ordenação prévia
      result[dateKey] = {
        alerts: matchingAlerts,
        highestAlert: matchingAlerts[0],
      };
    }
  }

  return result;
}
