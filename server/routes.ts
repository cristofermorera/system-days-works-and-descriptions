import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from './db.ts';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  requireAuth,
  requireAdmin,
  logAudit,
  type AuthRequest,
} from './auth.ts';
import { getWeatherData, DEFAULT_CITIES } from './services/weatherService.ts';
import { getAlertsForLocation, fetchInmetAlerts } from './services/inmetService.ts';

export const router = Router();

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// POST /api/auth/login
router.post('/auth/login', (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    res.status(400).json({ error: 'Informe o e-mail/usuário e a senha.' });
    return;
  }

  const query = emailOrUsername.trim().toLowerCase();
  const user = db
    .prepare(
      'SELECT id, name, email, password_hash, salt, status, role FROM users WHERE LOWER(email) = ? OR LOWER(name) = ?'
    )
    .get(query, query) as
    | {
        id: string;
        name: string;
        email: string;
        password_hash: string;
        salt: string;
        status: string;
        role: 'admin' | 'user';
      }
    | undefined;

  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas. Verifique usuário e senha.' });
    return;
  }

  const isValid = verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    res.status(401).json({ error: 'Credenciais inválidas. Verifique usuário e senha.' });
    return;
  }

  if (user.status !== 'active') {
    res.status(403).json({ error: 'Sua conta está inativa. Contate o administrador.' });
    return;
  }

  const token = generateToken({ userId: user.id, role: user.role });
  logAudit(user.id, user.name, 'Acesso ao sistema (Login)');

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

// GET /api/auth/me
router.get('/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// ==========================================
// 2. ICONS ROUTES
// ==========================================

// GET /api/icons
router.get('/icons', requireAuth, (req: AuthRequest, res) => {
  const isAdmin = req.user?.role === 'admin';
  // Regular users only see active icons; admins see all
  const icons = isAdmin
    ? db.prepare('SELECT * FROM icons ORDER BY created_at ASC').all()
    : db.prepare('SELECT * FROM icons WHERE active = 1 ORDER BY created_at ASC').all();

  res.json({ icons });
});

// POST /api/icons (Admin only)
router.post('/icons', requireAdmin, (req: AuthRequest, res) => {
  const { name, icon, description, active } = req.body;

  if (!name || !icon) {
    res.status(400).json({ error: 'Nome e representação visual (emoji/ícone) são obrigatórios.' });
    return;
  }

  const id = 'icon_' + crypto.randomUUID();
  const now = new Date().toISOString();
  const isActive = active !== undefined ? (active ? 1 : 0) : 1;

  db.prepare(
    'INSERT INTO icons (id, name, icon, description, active, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), icon.trim(), description?.trim() || null, isActive, now);

  logAudit(req.user!.id, req.user!.name, `Criou ícone "${name}" (${icon})`);

  res.status(201).json({
    icon: {
      id,
      name,
      icon,
      description,
      active: isActive,
      created_at: now,
    },
  });
});

// PUT /api/icons/:id (Admin only)
router.put('/icons/:id', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, icon, description, active } = req.body;

  const existing = db.prepare('SELECT * FROM icons WHERE id = ?').get(id);
  if (!existing) {
    res.status(404).json({ error: 'Ícone não encontrado.' });
    return;
  }

  const updatedActive = active !== undefined ? (active ? 1 : 0) : 1;

  db.prepare(
    'UPDATE icons SET name = COALESCE(?, name), icon = COALESCE(?, icon), description = ?, active = ? WHERE id = ?'
  ).run(name?.trim() || null, icon?.trim() || null, description?.trim() || null, updatedActive, id);

  logAudit(req.user!.id, req.user!.name, `Atualizou ícone "${name || id}"`);

  const updated = db.prepare('SELECT * FROM icons WHERE id = ?').get(id);
  res.json({ icon: updated });
});

// DELETE /api/icons/:id (Admin only)
router.delete('/icons/:id', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT name, icon FROM icons WHERE id = ?').get(id) as
    | { name: string; icon: string }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Ícone não encontrado.' });
    return;
  }

  // Check if icon is in use
  const usageCount = (
    db.prepare('SELECT COUNT(*) as count FROM calendar_entry_icons WHERE icon_id = ?').get(id) as {
      count: number;
    }
  ).count;

  if (usageCount > 0) {
    res.status(400).json({
      error: `Este ícone está em uso em ${usageCount} dia(s) marcado(s) no calendário. Para preservar o histórico, desative o ícone (Status: Inativo) em vez de excluí-lo.`,
    });
    return;
  }

  db.prepare('DELETE FROM icons WHERE id = ?').run(id);
  logAudit(req.user!.id, req.user!.name, `Excluiu ícone "${existing.name}" (${existing.icon})`);

  res.json({ message: 'Ícone removido com sucesso.' });
});

// ==========================================
// 3. CALENDAR ENTRIES (UP TO 6 ICONS PER DAY)
// ==========================================

// GET /api/calendar?month=YYYY-MM&userId=...
router.get('/calendar', requireAuth, (req: AuthRequest, res) => {
  const { month, userId } = req.query;

  // Determine target user: regular users are strictly constrained to their own id
  let targetUserId = req.user!.id;
  if (req.user!.role === 'admin' && userId && typeof userId === 'string') {
    targetUserId = userId;
  }

  let entriesQuery = 'SELECT id, user_id, date, created_at, updated_at FROM calendar_entries WHERE user_id = ?';
  const params: (string | number)[] = [targetUserId];

  if (month && typeof month === 'string') {
    entriesQuery += ' AND date LIKE ?';
    params.push(`${month}%`);
  }

  const entries = db.prepare(entriesQuery).all(...params) as Array<{
    id: string;
    user_id: string;
    date: string;
    created_at: string;
    updated_at: string;
  }>;

  // Fetch icons for all entries
  const result: Record<
    string,
    {
      entryId: string;
      icons: Array<{
        id: string;
        name: string;
        icon: string;
        description?: string;
      }>;
    }
  > = {};

  const getEntryIconsStmt = db.prepare(`
    SELECT i.id, i.name, i.icon, i.description, cei.position
    FROM calendar_entry_icons cei
    JOIN icons i ON i.id = cei.icon_id
    WHERE cei.calendar_entry_id = ?
    ORDER BY cei.position ASC
  `);

  for (const entry of entries) {
    const icons = getEntryIconsStmt.all(entry.id) as Array<{
      id: string;
      name: string;
      icon: string;
      description?: string;
      position: number;
    }>;

    result[entry.date] = {
      entryId: entry.id,
      icons: icons.map(({ id, name, icon, description }) => ({
        id,
        name,
        icon,
        description,
      })),
    };
  }

  res.json({ entries: result, targetUserId });
});

// PUT /api/calendar/entry
// Body: { date: 'YYYY-MM-DD', iconIds: string[], userId?: string }
router.put('/calendar/entry', requireAuth, (req: AuthRequest, res) => {
  const { date, iconIds, userId } = req.body;

  if (!date || !Array.isArray(iconIds)) {
    res.status(400).json({ error: 'Data e lista de iconIds são obrigatórios.' });
    return;
  }

  // Max 6 icons per day constraint
  if (iconIds.length > 6) {
    res.status(400).json({ error: 'Um dia não pode possuir mais de 6 ícones.' });
    return;
  }

  // Determine target user: regular users can only edit their own calendar
  let targetUserId = req.user!.id;
  if (req.user!.role === 'admin' && userId && typeof userId === 'string') {
    targetUserId = userId;
  }

  // Find or create entry
  let entry = db
    .prepare('SELECT id FROM calendar_entries WHERE user_id = ? AND date = ?')
    .get(targetUserId, date) as { id: string } | undefined;

  const now = new Date().toISOString();

  if (iconIds.length === 0) {
    // If no icons left, remove entry completely
    if (entry) {
      db.prepare('DELETE FROM calendar_entries WHERE id = ?').run(entry.id);
      logAudit(
        req.user!.id,
        req.user!.name,
        `Removeu todas as marcações do dia ${date}`,
        date
      );
    }
    res.json({ message: 'Dia limpo com sucesso.', date, icons: [] });
    return;
  }

  if (!entry) {
    const newEntryId = 'entry_' + crypto.randomUUID();
    db.prepare(
      'INSERT INTO calendar_entries (id, user_id, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).run(newEntryId, targetUserId, date, now, now);
    entry = { id: newEntryId };
  } else {
    db.prepare('UPDATE calendar_entries SET updated_at = ? WHERE id = ?').run(now, entry.id);
  }

  // Delete previous icons for this entry
  db.prepare('DELETE FROM calendar_entry_icons WHERE calendar_entry_id = ?').run(entry.id);

  // Insert updated icons with position preservation
  const insertLinkStmt = db.prepare(
    'INSERT INTO calendar_entry_icons (id, calendar_entry_id, icon_id, position, created_at) VALUES (?, ?, ?, ?, ?)'
  );

  for (let idx = 0; idx < iconIds.length; idx++) {
    const linkId = 'cei_' + crypto.randomUUID();
    insertLinkStmt.run(linkId, entry.id, iconIds[idx], idx, now);
  }

  // Log audit
  const iconNames = db
    .prepare(`SELECT icon FROM icons WHERE id IN (${iconIds.map(() => '?').join(',')})`)
    .all(...iconIds) as Array<{ icon: string }>;
  const visualIcons = iconNames.map((i) => i.icon).join(' ');

  logAudit(
    req.user!.id,
    req.user!.name,
    `Atualizou dia ${date} com ${iconIds.length} ícone(s): ${visualIcons}`,
    date
  );

  // Fetch updated icons
  const updatedIcons = db
    .prepare(`
      SELECT i.id, i.name, i.icon, i.description
      FROM calendar_entry_icons cei
      JOIN icons i ON i.id = cei.icon_id
      WHERE cei.calendar_entry_id = ?
      ORDER BY cei.position ASC
    `)
    .all(entry.id);

  res.json({
    message: 'Entrada atualizada com sucesso.',
    date,
    icons: updatedIcons,
  });
});

// ==========================================
// 4. USER ADMINISTRATION ROUTES (Admin only)
// ==========================================

// GET /api/admin/users
router.get('/admin/users', requireAdmin, (_req: AuthRequest, res) => {
  const users = db
    .prepare(
      'SELECT id, name, email, status, role, created_at FROM users ORDER BY created_at DESC'
    )
    .all();

  res.json({ users });
});

// POST /api/admin/users
router.post('/admin/users', requireAdmin, (req: AuthRequest, res) => {
  const { name, email, password, role, status } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email.trim().toLowerCase());
  if (existing) {
    res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    return;
  }

  const id = 'usr_' + crypto.randomUUID();
  const { hash, salt } = hashPassword(password);
  const userRole = role === 'admin' ? 'admin' : 'user';
  const userStatus = status === 'inactive' ? 'inactive' : 'active';
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, salt, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), email.trim().toLowerCase(), hash, salt, userStatus, userRole, now);

  logAudit(req.user!.id, req.user!.name, `Criou usuário "${name}" (${email}) com perfil ${userRole}`);

  res.status(201).json({
    user: {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      status: userStatus,
      role: userRole,
      created_at: now,
    },
  });
});

// PUT /api/admin/users/:id
router.put('/admin/users/:id', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, email, role, status, newPassword } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
    | { id: string; name: string; email: string; role: string; status: string }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  // Prevent admin from deactivating or demoting themselves
  if (req.user!.id === id) {
    if (status === 'inactive') {
      res.status(400).json({ error: 'Você não pode desativar seu próprio usuário.' });
      return;
    }
    if (role && role !== 'admin') {
      res.status(400).json({ error: 'Você não pode remover seu próprio perfil de administrador.' });
      return;
    }
  }

  // If email changed, check conflict
  if (email && email.trim().toLowerCase() !== user.email.toLowerCase()) {
    const conflict = db
      .prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?')
      .get(email.trim().toLowerCase(), id);
    if (conflict) {
      res.status(400).json({ error: 'E-mail já está em uso por outro usuário.' });
      return;
    }
  }

  const updatedName = name?.trim() || user.name;
  const updatedEmail = email?.trim().toLowerCase() || user.email;
  const updatedRole = role === 'admin' ? 'admin' : role === 'user' ? 'user' : user.role;
  const updatedStatus = status === 'inactive' ? 'inactive' : status === 'active' ? 'active' : user.status;

  db.prepare('UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?').run(
    updatedName,
    updatedEmail,
    updatedRole,
    updatedStatus,
    id
  );

  // If new password provided, reset password
  if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
    const { hash, salt } = hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, id);
    logAudit(req.user!.id, req.user!.name, `Redefiniu a senha do usuário "${updatedName}"`);
  }

  logAudit(
    req.user!.id,
    req.user!.name,
    `Atualizou dados do usuário "${updatedName}" (${updatedEmail}, perfil: ${updatedRole}, status: ${updatedStatus})`
  );

  res.json({
    user: {
      id,
      name: updatedName,
      email: updatedEmail,
      role: updatedRole,
      status: updatedStatus,
    },
  });
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;

  if (req.user!.id === id) {
    res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
    return;
  }

  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(id) as
    | { name: string; email: string }
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  logAudit(req.user!.id, req.user!.name, `Excluiu o usuário "${user.name}" (${user.email})`);

  res.json({ message: 'Usuário excluído com sucesso.' });
});

// GET /api/admin/audit-logs
router.get('/admin/audit-logs', requireAdmin, (_req: AuthRequest, res) => {
  const logs = db
    .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50')
    .all();

  res.json({ logs });
});

// ==========================================
// 5. WEATHER & INMET ALERTS ROUTES
// ==========================================

// GET /api/weather?city=...&state=...&ibgeId=...
router.get('/weather', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Load user saved settings if not passed via query
    const userSettings = db
      .prepare('SELECT * FROM user_settings WHERE user_id = ?')
      .get(userId) as
      | {
          city: string;
          state: string;
          ibge_id: number;
          latitude: number;
          longitude: number;
        }
      | undefined;

    const city = (req.query.city as string) || userSettings?.city || 'Santiago';
    const state = ((req.query.state as string) || userSettings?.state || 'RS').toUpperCase();
    const ibgeId = req.query.ibgeId ? Number(req.query.ibgeId) : userSettings?.ibge_id || 4317400;

    const forceRefresh = req.query.forceRefresh === 'true';

    // 1. Previsão meteorológica principal (Open-Meteo) com cache estrito de 1 hora
    const { data: weatherData, cacheExpiresInMs, cachedAt } = await getWeatherData(
      city,
      state,
      userSettings?.latitude,
      userSettings?.longitude,
      forceRefresh
    );

    // 2. Alertas oficiais do INMET para a localização (cache de 1 hora)
    const inmetAlerts = await getAlertsForLocation(state, city, ibgeId, forceRefresh);

    // 3. Mescla os alertas em cada dia da previsão
    const dailyWithAlerts = weatherData.daily.map((day) => {
      const matchingAlerts = inmetAlerts.filter((alert) => {
        const start = alert.inicio.slice(0, 10);
        const end = alert.fim.slice(0, 10);
        return day.date >= start && day.date <= end;
      });

      // O alerta de maior severidade (Vermelho > Laranja > Amarelo)
      const highestAlert = matchingAlerts.length > 0 ? matchingAlerts[0] : null;

      return {
        ...day,
        inmetAlerts: matchingAlerts,
        highestAlert,
      };
    });

    res.json({
      city,
      state,
      ibgeId,
      current: weatherData.current,
      daily: dailyWithAlerts,
      allInmetAlerts: inmetAlerts,
      fontes: {
        previsao: 'Open-Meteo API',
        alertas: 'INMET — Instituto Nacional de Meteorologia',
      },
      updatedAt: weatherData.updatedAt,
      nextUpdateAt: new Date(cachedAt + 60 * 60 * 1000).toISOString(),
      cacheExpiresInMinutes: Math.ceil(cacheExpiresInMs / (60 * 1000)),
      updateInterval: 'hourly',
    });
  } catch (err) {
    console.error('Erro na rota /api/weather:', err);
    res.status(500).json({ error: 'Falha ao obter dados meteorológicos.' });
  }
});

// GET /api/weather/alerts?state=...&city=...
router.get('/weather/alerts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const state = ((req.query.state as string) || 'RS').toUpperCase();
    const city = (req.query.city as string) || 'Santiago';
    const ibgeId = req.query.ibgeId ? Number(req.query.ibgeId) : undefined;
    const forceRefresh = req.query.forceRefresh === 'true';

    const alerts = await getAlertsForLocation(state, city, ibgeId, forceRefresh);

    res.json({
      state,
      city,
      total: alerts.length,
      alerts,
      fonte: 'INMET — Instituto Nacional de Meteorologia',
    });
  } catch (err) {
    console.error('Erro na rota /api/weather/alerts:', err);
    res.status(500).json({ error: 'Falha ao consultar alertas do INMET.' });
  }
});

// GET /api/weather/cities - Catálogo de cidades brasileiras
router.get('/weather/cities', requireAuth, (_req: AuthRequest, res) => {
  const list = Object.values(DEFAULT_CITIES);
  res.json({ cities: list });
});

// ==========================================
// 6. USER SETTINGS & THEME PREFERENCES
// ==========================================

// GET /api/user/settings
router.get('/user/settings', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  let settings = db
    .prepare('SELECT * FROM user_settings WHERE user_id = ?')
    .get(userId) as any;

  if (!settings) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_settings (user_id, city, state, ibge_id, latitude, longitude, theme, updated_at)
      VALUES (?, 'Santiago', 'RS', 4317400, -29.1917, -54.8661, 'system', ?)
    `).run(userId, now);

    settings = {
      user_id: userId,
      city: 'Santiago',
      state: 'RS',
      ibge_id: 4317400,
      latitude: -29.1917,
      longitude: -54.8661,
      theme: 'system',
      updated_at: now,
    };
  }

  // Load org settings if any
  const orgNameRow = db.prepare("SELECT value FROM org_settings WHERE key = 'org_name'").get() as any;
  const orgThemeRow = db.prepare("SELECT value FROM org_settings WHERE key = 'default_theme'").get() as any;

  res.json({
    settings,
    org: {
      name: orgNameRow?.value || 'Minha Organização',
      defaultTheme: orgThemeRow?.value || 'system',
    },
  });
});

// PUT /api/user/settings
router.put('/user/settings', requireAuth, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { city, state, ibge_id, latitude, longitude, theme } = req.body;
  const now = new Date().toISOString();

  // Find defaults for known city if lat/lon not provided
  let lat = latitude;
  let lon = longitude;
  let ibge = ibge_id;

  if (city && state && (!lat || !lon)) {
    const key = `${city.trim().toLowerCase()}-${state.trim().toLowerCase()}`;
    const def = DEFAULT_CITIES[key];
    if (def) {
      lat = def.lat;
      lon = def.lon;
      ibge = def.ibgeId;
    }
  }

  db.prepare(`
    INSERT INTO user_settings (user_id, city, state, ibge_id, latitude, longitude, theme, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      city = COALESCE(excluded.city, user_settings.city),
      state = COALESCE(excluded.state, user_settings.state),
      ibge_id = COALESCE(excluded.ibge_id, user_settings.ibge_id),
      latitude = COALESCE(excluded.latitude, user_settings.latitude),
      longitude = COALESCE(excluded.longitude, user_settings.longitude),
      theme = COALESCE(excluded.theme, user_settings.theme),
      updated_at = excluded.updated_at
  `).run(
    userId,
    city || 'Santiago',
    (state || 'RS').toUpperCase(),
    ibge || 4317400,
    lat || -29.1917,
    lon || -54.8661,
    theme || 'system',
    now
  );

  const updated = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
  res.json({ settings: updated });
});

// PUT /api/org/settings (Admin only)
router.put('/org/settings', requireAdmin, (req: AuthRequest, res) => {
  const { org_name, default_theme } = req.body;
  const now = new Date().toISOString();

  if (org_name) {
    db.prepare(`
      INSERT INTO org_settings (key, value, updated_at) VALUES ('org_name', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(org_name.trim(), now);
  }

  if (default_theme) {
    db.prepare(`
      INSERT INTO org_settings (key, value, updated_at) VALUES ('default_theme', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(default_theme, now);
  }

  logAudit(req.user!.id, req.user!.name, 'Atualizou configurações da organização');

  res.json({ message: 'Configurações da organização atualizadas.' });
});

