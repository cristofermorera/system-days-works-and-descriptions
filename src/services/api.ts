import type {
  User,
  IconItem,
  CalendarEntriesMap,
  AuditLog,
} from '../types';

const TOKEN_KEY = 'work_calendar_auth_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição.');
  }

  return data;
}

export const api = {
  // Authentication
  login: async (emailOrUsername: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    });
    tokenStorage.set(res.token);
    return res;
  },

  getMe: async (): Promise<{ user: User }> => {
    return request<{ user: User }>('/api/auth/me');
  },

  logout: () => {
    tokenStorage.clear();
  },

  // Icons
  getIcons: async (): Promise<{ icons: IconItem[] }> => {
    return request<{ icons: IconItem[] }>('/api/icons');
  },

  createIcon: async (data: {
    name: string;
    icon: string;
    description?: string;
    active?: boolean;
  }): Promise<{ icon: IconItem }> => {
    return request<{ icon: IconItem }>('/api/icons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateIcon: async (
    id: string,
    data: { name?: string; icon?: string; description?: string; active?: boolean }
  ): Promise<{ icon: IconItem }> => {
    return request<{ icon: IconItem }>(`/api/icons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteIcon: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/icons/${id}`, {
      method: 'DELETE',
    });
  },

  // Calendar
  getCalendar: async (
    month?: string,
    userId?: string
  ): Promise<{ entries: CalendarEntriesMap; targetUserId: string }> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (userId) params.append('userId', userId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{ entries: CalendarEntriesMap; targetUserId: string }>(`/api/calendar${query}`);
  },

  updateCalendarEntry: async (
    date: string,
    iconIds: string[],
    userId?: string
  ): Promise<{ message: string; date: string; icons: IconItem[] }> => {
    return request<{ message: string; date: string; icons: IconItem[] }>('/api/calendar/entry', {
      method: 'PUT',
      body: JSON.stringify({ date, iconIds, userId }),
    });
  },

  // Administration: Users
  getUsers: async (): Promise<{ users: User[] }> => {
    return request<{ users: User[] }>('/api/admin/users');
  },

  createUser: async (data: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
  }): Promise<{ user: User }> => {
    return request<{ user: User }>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: async (
    id: string,
    data: {
      name?: string;
      email?: string;
      role?: 'admin' | 'user';
      status?: 'active' | 'inactive';
      newPassword?: string;
    }
  ): Promise<{ user: User }> => {
    return request<{ user: User }>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id: string): Promise<{ message: string }> => {
    return request<{ message: string }>(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Administration: Audit Logs
  getAuditLogs: async (): Promise<{ logs: AuditLog[] }> => {
    return request<{ logs: AuditLog[] }>('/api/admin/audit-logs');
  },

  // Weather & INMET Official Alerts
  getWeather: async (params?: {
    city?: string;
    state?: string;
    ibgeId?: number;
    forceRefresh?: boolean;
  }): Promise<import('../types').WeatherResponse> => {
    const query = new URLSearchParams();
    if (params?.city) query.append('city', params.city);
    if (params?.state) query.append('state', params.state);
    if (params?.ibgeId) query.append('ibgeId', String(params.ibgeId));
    if (params?.forceRefresh) query.append('forceRefresh', 'true');
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<import('../types').WeatherResponse>(`/api/weather${qs}`);
  },

  getInmetAlerts: async (params?: {
    city?: string;
    state?: string;
    ibgeId?: number;
    forceRefresh?: boolean;
  }): Promise<{
    state: string;
    city: string;
    total: number;
    alerts: import('../types').InmetAlert[];
    fonte: string;
  }> => {
    const query = new URLSearchParams();
    if (params?.city) query.append('city', params.city);
    if (params?.state) query.append('state', params.state);
    if (params?.ibgeId) query.append('ibgeId', String(params.ibgeId));
    if (params?.forceRefresh) query.append('forceRefresh', 'true');
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request(`/api/weather/alerts${qs}`);
  },

  getCities: async (): Promise<{ cities: import('../types').CityOption[] }> => {
    return request<{ cities: import('../types').CityOption[] }>('/api/weather/cities');
  },

  getUserSettings: async (): Promise<{
    settings: import('../types').UserSettings;
    org: { name: string; defaultTheme: string };
  }> => {
    return request('/api/user/settings');
  },

  updateUserSettings: async (
    data: Partial<import('../types').UserSettings>
  ): Promise<{ settings: import('../types').UserSettings }> => {
    return request('/api/user/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateOrgSettings: async (data: {
    org_name?: string;
    default_theme?: string;
  }): Promise<{ message: string }> => {
    return request('/api/org/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

