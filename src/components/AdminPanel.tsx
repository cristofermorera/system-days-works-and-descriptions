import React, { useState, useEffect } from 'react';
import type { User, IconItem, AuditLog } from '../types';
import { api } from '../services/api';
import { IconRenderer } from './IconRenderer';
import {
  Users,
  Smile,
  FileText,
  UserPlus,
  Plus,
  ArrowLeft,
  Edit2,
  Trash2,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  Settings,
  CloudRain,
  Check,
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
  onBackToCalendar: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onBackToCalendar,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'icons' | 'audit' | 'settings'>('users');

  // Organization settings state
  const [orgName, setOrgName] = useState('Minha Organização');
  const [orgTheme, setOrgTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form state for user modal
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'user'>('user');
  const [userStatus, setUserStatus] = useState<'active' | 'inactive'>('active');

  // Icons state
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [iconSearch, setIconSearch] = useState('');
  const [isLoadingIcons, setIsLoadingIcons] = useState(false);
  const [iconModalOpen, setIconModalOpen] = useState(false);
  const [editingIcon, setEditingIcon] = useState<IconItem | null>(null);

  // Form state for icon modal
  const [iconName, setIconName] = useState('');
  const [iconSymbol, setIconSymbol] = useState('');
  const [iconDesc, setIconDesc] = useState('');
  const [iconActive, setIconActive] = useState(true);

  // Audit state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Global notice & error
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data based on tab
  useEffect(() => {
    loadUsers();
    loadIcons();
    loadLogs();
  }, []);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.getUsers();
      setUsers(res.users);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar usuários.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadIcons = async () => {
    setIsLoadingIcons(true);
    try {
      const res = await api.getIcons();
      setIcons(res.icons);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar ícones.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoadingIcons(false);
    }
  };

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await api.getAuditLogs();
      setLogs(res.logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao carregar logs de auditoria.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('user');
    setUserStatus('active');
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPassword(''); // Only if resetting
    setUserRole(u.role);
    setUserStatus(u.status);
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: userName,
          email: userEmail,
          role: userRole,
          status: userStatus,
          newPassword: userPassword ? userPassword : undefined,
        });
        setMessage({ type: 'success', text: `Usuário "${userName}" atualizado com sucesso.` });
      } else {
        await api.createUser({
          name: userName,
          email: userEmail,
          password: userPassword,
          role: userRole,
          status: userStatus,
        });
        setMessage({ type: 'success', text: `Usuário "${userName}" criado com sucesso.` });
      }
      setUserModalOpen(false);
      loadUsers();
      loadLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar usuário.';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleToggleUserStatus = async (u: User) => {
    if (u.id === currentUser.id) {
      setMessage({ type: 'error', text: 'Você não pode desativar seu próprio usuário.' });
      return;
    }
    const nextStatus = u.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateUser(u.id, { status: nextStatus });
      setMessage({
        type: 'success',
        text: `Status do usuário ${u.name} alterado para ${nextStatus === 'active' ? 'ativo' : 'inativo'}.`,
      });
      loadUsers();
      loadLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status.';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (u.id === currentUser.id) {
      setMessage({ type: 'error', text: 'Você não pode excluir sua própria conta.' });
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${u.name}" (${u.email})?`)) {
      return;
    }
    try {
      await api.deleteUser(u.id);
      setMessage({ type: 'success', text: `Usuário "${u.name}" excluído com sucesso.` });
      loadUsers();
      loadLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir usuário.';
      setMessage({ type: 'error', text: msg });
    }
  };

  // --- ICON MANAGEMENT HANDLERS ---
  const handleOpenCreateIcon = () => {
    setEditingIcon(null);
    setIconName('');
    setIconSymbol('');
    setIconDesc('');
    setIconActive(true);
    setIconModalOpen(true);
  };

  const handleOpenEditIcon = (iconItem: IconItem) => {
    setEditingIcon(iconItem);
    setIconName(iconItem.name);
    setIconSymbol(iconItem.icon);
    setIconDesc(iconItem.description || '');
    setIconActive(iconItem.active === 1);
    setIconModalOpen(true);
  };

  const handleSaveIcon = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      if (editingIcon) {
        await api.updateIcon(editingIcon.id, {
          name: iconName,
          icon: iconSymbol,
          description: iconDesc,
          active: iconActive,
        });
        setMessage({ type: 'success', text: `Ícone "${iconName}" atualizado com sucesso.` });
      } else {
        await api.createIcon({
          name: iconName,
          icon: iconSymbol,
          description: iconDesc,
          active: iconActive,
        });
        setMessage({ type: 'success', text: `Novo ícone "${iconName}" cadastrado com sucesso.` });
      }
      setIconModalOpen(false);
      loadIcons();
      loadLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar ícone.';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleToggleIconActive = async (iconItem: IconItem) => {
    const nextActive = iconItem.active === 1 ? false : true;
    try {
      await api.updateIcon(iconItem.id, { active: nextActive });
      loadIcons();
      loadLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status do ícone.';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleDeleteIcon = async (iconItem: IconItem) => {
    if (!window.confirm(`Tem certeza que deseja excluir o ícone "${iconItem.name}" (${iconItem.icon})?`)) {
      return;
    }
    setMessage(null);
    try {
      await api.deleteIcon(iconItem.id);
      setMessage({ type: 'success', text: `Ícone "${iconItem.name}" excluído com sucesso.` });
      loadIcons();
      loadLogs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir ícone.';
      setMessage({ type: 'error', text: msg });
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 pb-16 pt-4 sm:pt-8 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
          <div>
            <button
              type="button"
              onClick={onBackToCalendar}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 mb-2 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Calendário</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              Painel de Administração
            </h1>
            <p className="text-xs text-stone-500 font-medium">
              Gerencie usuários, permissões de acesso, ícones personalizados e auditoria do sistema
            </p>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-1 p-1 bg-white border border-stone-200/80 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Usuários</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('icons')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'icons'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Smile className="w-3.5 h-3.5" />
              <span>Ícones</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Auditoria</span>
            </button>
          </div>
        </header>

        {/* Global Feedback message */}
        {message && (
          <div
            className={`p-3 text-xs rounded-xl flex items-center justify-between animate-in fade-in duration-150 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-xs font-bold px-1.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ==========================================
            TAB 1: USUÁRIOS
           ========================================== */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Gerenciamento de Usuários
                </h2>
                <span className="text-xs text-stone-500 font-medium">
                  {users.length} usuário(s) cadastrado(s)
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateUser}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Novo Usuário</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-stone-200/80 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Perfil</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-stone-900">
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            {u.id === currentUser.id && (
                              <span className="text-[10px] text-stone-600 font-normal">
                                (você)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-stone-600 tabular-nums">
                          {u.email}
                        </td>
                        <td className="py-3 px-4">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <Shield className="w-3 h-3 text-emerald-600" />
                              Administrador
                            </span>
                          ) : (
                            <span className="text-stone-600">Usuário</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleUserStatus(u)}
                            className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
                            title="Clique para alternar status"
                          >
                            {u.status === 'active' ? (
                              <span className="text-emerald-700 inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Ativo
                              </span>
                            ) : (
                              <span className="text-stone-400 inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-stone-400" />
                                Inativo
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar usuário e redefinir senha"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {u.id !== currentUser.id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: ÍCONES PERSONALIZADOS
           ========================================== */}
        {activeTab === 'icons' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900">
                  Biblioteca de Ícones do Sistema
                </h2>
                <span className="text-xs text-stone-500 font-medium">
                  {icons.length} ícone(s) cadastrados na biblioteca (sem limite de quantidade)
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenCreateIcon}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Ícone</span>
              </button>
            </div>

            {/* Icon Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                placeholder="🔎 Filtrar ícones por nome, símbolo ou descrição..."
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              {iconSearch && (
                <button
                  type="button"
                  onClick={() => setIconSearch('')}
                  className="p-1 text-xs text-stone-400 hover:text-stone-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {isLoadingIcons ? (
                <div className="col-span-full py-8 text-center text-stone-400 text-xs">
                  Carregando ícones...
                </div>
              ) : icons.length === 0 ? (
                <div className="col-span-full py-8 text-center text-stone-400 text-xs">
                  Nenhum ícone cadastrado.
                </div>
              ) : (
                icons
                  .filter((item) => {
                    const q = iconSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      item.name.toLowerCase().includes(q) ||
                      (item.description && item.description.toLowerCase().includes(q)) ||
                      item.icon.toLowerCase().includes(q)
                    );
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        item.active === 1
                          ? 'bg-stone-50/60 border-stone-200/90'
                          : 'bg-stone-100/40 border-stone-200/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-stone-200/80 shadow-2xs flex items-center justify-center shrink-0">
                            <IconRenderer icon={item.icon} size="md" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-stone-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-stone-500 line-clamp-1">
                              {item.description || 'Sem descrição'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditIcon(item)}
                            className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg cursor-pointer"
                            title="Editar ícone"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteIcon(item)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Excluir ícone da biblioteca"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 font-mono text-[10px]">
                          {item.icon === 'check_full'
                            ? 'check_full'
                            : item.icon === 'check_half'
                              ? 'check_half'
                              : item.icon}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleIconActive(item)}
                          className="font-semibold cursor-pointer"
                        >
                          {item.active === 1 ? (
                            <span className="text-emerald-700">Ativo</span>
                          ) : (
                            <span className="text-stone-400">Inativo</span>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: AUDITORIA
           ========================================== */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-7 shadow-xs space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900">
                Registro de Auditoria
              </h2>
              <span className="text-xs text-stone-500 font-medium">
                Últimas 50 ações realizadas no sistema
              </span>
            </div>

            <div className="overflow-x-auto border border-stone-200/80 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-600 font-semibold">
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Ação Realizada</th>
                    <th className="py-3 px-4">Alvo / Detalhe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400">
                        Carregando registros...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-400">
                        Nenhum registro de auditoria encontrado.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const dateObj = new Date(log.created_at);
                      const formattedDate = dateObj.toLocaleString('pt-BR');
                      return (
                        <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 text-stone-500 font-mono text-[11px] tabular-nums whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-900">
                            {log.user_name}
                          </td>
                          <td className="py-3 px-4 text-stone-800">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                            {log.target || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==========================================
            USER CREATE / EDIT MODAL
           ========================================== */}
        {userModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                {editingUser
                  ? 'Atualize as informações de perfil ou redefina a senha.'
                  : 'Preencha os dados para criar uma nova conta de acesso.'}
              </p>

              <form onSubmit={handleSaveUser} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="ex: Carlos Alberto"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    E-mail de Acesso
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="ex: carlos@exemplo.com"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    {editingUser ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha Inicial'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    minLength={6}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Perfil / Permissão
                    </label>
                    <select
                      value={userRole}
                      disabled={editingUser?.id === currentUser.id}
                      onChange={(e) => setUserRole(e.target.value as 'admin' | 'user')}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="user">Usuário Padrão</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-700 block mb-1">
                      Status da Conta
                    </label>
                    <select
                      value={userStatus}
                      disabled={editingUser?.id === currentUser.id}
                      onChange={(e) => setUserStatus(e.target.value as 'active' | 'inactive')}
                      className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Salvar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==========================================
            ICON CREATE / EDIT MODAL
           ========================================== */}
        {iconModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-150">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1">
                {editingIcon ? 'Editar Ícone' : 'Novo Ícone'}
              </h3>
              <p className="text-xs text-stone-500 mb-4">
                Cadastre um novo emoji ou representação visual para as marcações diárias.
              </p>

              <form onSubmit={handleSaveIcon} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Nome do Ícone
                  </label>
                  <input
                    type="text"
                    required
                    value={iconName}
                    onChange={(e) => setIconName(e.target.value)}
                    placeholder="ex: Reunião Presencial"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Representação Visual (Emoji ou Identificador)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      value={iconSymbol}
                      onChange={(e) => setIconSymbol(e.target.value)}
                      placeholder="ex: 🚀, 📦, 🎯 ou check_full"
                      className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                    />
                    <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center shrink-0">
                      <IconRenderer icon={iconSymbol || '❓'} size="sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Descrição (Opcional)
                  </label>
                  <input
                    type="text"
                    value={iconDesc}
                    onChange={(e) => setIconDesc(e.target.value)}
                    placeholder="ex: Viagem externa ou visita a cliente"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="pt-1">
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Status
                  </label>
                  <select
                    value={iconActive ? 'active' : 'inactive'}
                    onChange={(e) => setIconActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value="active">Ativo (visível para os usuários)</option>
                    <option value="inactive">Inativo (oculto no calendário)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIconModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Salvar Ícone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
