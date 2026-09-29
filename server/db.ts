import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'work_calendar.db');
export const db = new DatabaseSync(DB_PATH);

// Initialize schema and seed data
export function initDatabase() {
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );
  `);

  // Icons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS icons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // Calendar entries table (1 entry per user per date)
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Calendar entry icons table (relational link, max 6 per entry)
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_entry_icons (
      id TEXT PRIMARY KEY,
      calendar_entry_id TEXT NOT NULL,
      icon_id TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (calendar_entry_id) REFERENCES calendar_entries(id) ON DELETE CASCADE,
      FOREIGN KEY (icon_id) REFERENCES icons(id) ON DELETE CASCADE
    );
  `);

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // User preferences & location settings (Weather & Theme)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      city TEXT NOT NULL DEFAULT 'Santiago',
      state TEXT NOT NULL DEFAULT 'RS',
      ibge_id INTEGER DEFAULT 4317400,
      latitude REAL DEFAULT -29.1917,
      longitude REAL DEFAULT -54.8661,
      theme TEXT NOT NULL DEFAULT 'system',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Organization settings (visual identity, default theme)
  db.exec(`
    CREATE TABLE IF NOT EXISTS org_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed rich default icons library
  const insertIcon = db.prepare(
    'INSERT OR IGNORE INTO icons (id, name, icon, description, active, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const now = new Date().toISOString();

  const defaultIcons = [
    {
      id: 'icon_check_full',
      name: 'Trabalhei (Integral)',
      icon: 'check_full',
      description: 'Dia trabalhado integralmente (1,0 dia)',
    },
    {
      id: 'icon_check_half',
      name: 'Meio Turno',
      icon: 'check_half',
      description: 'Meio turno trabalhado (0,5 dia)',
    },
    {
      id: 'icon_home_office',
      name: 'Home Office',
      icon: '🏠',
      description: 'Trabalho remoto / em casa',
    },
    {
      id: 'icon_office',
      name: 'Trabalho Presencial',
      icon: '🏢',
      description: 'Atividade na empresa / escritório',
    },
    {
      id: 'icon_car',
      name: 'Deslocamento',
      icon: '🚗',
      description: 'Viagem ou deslocamento a trabalho',
    },
    {
      id: 'icon_flight',
      name: 'Viagem a Negócios',
      icon: '✈️',
      description: 'Viagem corporativa externa',
    },
    {
      id: 'icon_laptop',
      name: 'Reunião / Projeto',
      icon: '💻',
      description: 'Alinhamento ou desenvolvimento de projeto',
    },
    {
      id: 'icon_clipboard',
      name: 'Atividade / Relatório',
      icon: '📋',
      description: 'Inspeção, formulário ou relatório',
    },
    {
      id: 'icon_vacation',
      name: 'Férias / Folga',
      icon: '🌴',
      description: 'Descanso, feriado ou férias',
    },
    {
      id: 'icon_doctor',
      name: 'Consulta Médica',
      icon: '🩺',
      description: 'Exame de rotina ou consulta',
    },
    {
      id: 'icon_study',
      name: 'Treinamento / Curso',
      icon: '📚',
      description: 'Capacitação, aula ou leitura técnica',
    },
    {
      id: 'icon_certificate',
      name: 'Certificação',
      icon: '🎓',
      description: 'Exame ou conclusão de curso',
    },
    {
      id: 'icon_phone',
      name: 'Atendimento / Suporte',
      icon: '📞',
      description: 'Chamadas e suporte a clientes',
    },
    {
      id: 'icon_box',
      name: 'Logística / Envio',
      icon: '📦',
      description: 'Entrega ou recebimento de materiais',
    },
    {
      id: 'icon_tools',
      name: 'Manutenção / Reparo',
      icon: '🛠️',
      description: 'Suporte técnico ou conserto',
    },
    {
      id: 'icon_star',
      name: 'Especial / Plantão',
      icon: '⭐',
      description: 'Dia de destaque ou plantão',
    },
    {
      id: 'icon_overtime',
      name: 'Hora Extra',
      icon: '⏱️',
      description: 'Jornada estendida / horas extras',
    },
    {
      id: 'icon_coffee',
      name: 'Pausa / Alinhamento',
      icon: '☕',
      description: 'Café de equipe ou alinhamento informal',
    },
    {
      id: 'icon_target',
      name: 'Meta Atingida',
      icon: '🎯',
      description: 'Conquista ou fechamento de objetivo',
    },
    {
      id: 'icon_client',
      name: 'Visita a Cliente',
      icon: '🤝',
      description: 'Reunião presencial com parceiro ou cliente',
    },
    {
      id: 'icon_briefcase',
      name: 'Diretoria / Apresentação',
      icon: '💼',
      description: 'Apresentação formal de resultados',
    },
    {
      id: 'icon_money',
      name: 'Fechamento Financeiro',
      icon: '💰',
      description: 'Faturamento, pagamento ou comissão',
    },
    {
      id: 'icon_hospital',
      name: 'Atestado Médico',
      icon: '🏥',
      description: 'Afastamento médico documentado',
    },
    {
      id: 'icon_warning',
      name: 'Imprevisto / Urgência',
      icon: '⚠️',
      description: 'Situação de contingência ou urgência',
    },
  ];

  for (const item of defaultIcons) {
    insertIcon.run(item.id, item.name, item.icon, item.description, 1, now);
  }

  // Seed default admin and user if none exist
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount === 0) {
    const now = new Date().toISOString();
    const insertUser = db.prepare(
      'INSERT INTO users (id, name, email, password_hash, salt, status, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );

    // Admin user: admin@exemplo.com / admin123
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = crypto.scryptSync('admin123', adminSalt, 64).toString('hex');
    insertUser.run(
      'usr_admin_01',
      'Administrador',
      'admin@exemplo.com',
      adminHash,
      adminSalt,
      'active',
      'admin',
      now
    );

    // Regular user: joao@exemplo.com / user123
    const userSalt = crypto.randomBytes(16).toString('hex');
    const userHash = crypto.scryptSync('user123', userSalt, 64).toString('hex');
    insertUser.run(
      'usr_joao_02',
      'João Silva',
      'joao@exemplo.com',
      userHash,
      userSalt,
      'active',
      'user',
      now
    );
  }
}
