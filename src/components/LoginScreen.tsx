import React, { useState } from 'react';
import { api } from '../services/api';
import type { User } from '../types';
import { CheckCircle2, Lock, Mail, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setErrorMessage('Por favor, preencha o e-mail/usuário e a senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login(emailOrUsername.trim(), password);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciais inválidas.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (userType: 'admin' | 'user') => {
    if (userType === 'admin') {
      setEmailOrUsername('admin@exemplo.com');
      setPassword('admin123');
    } else {
      setEmailOrUsername('joao@exemplo.com');
      setPassword('user123');
    }
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-stone-100/70 text-stone-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Controle de Dias Trabalhados
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Entre com suas credenciais para acessar seu calendário
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in duration-150"
          >
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="emailOrUsername"
              className="text-xs font-semibold text-stone-700 block"
            >
              Usuário ou E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="emailOrUsername"
                type="text"
                autoComplete="username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="ex: admin@exemplo.com ou João"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-stone-700 block"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50/60 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isLoading ? (
              <span>Entrando...</span>
            ) : (
              <>
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials quick filler */}
        <div className="pt-4 border-t border-stone-100">
          <div className="text-[11px] text-stone-500 font-medium mb-2.5 text-center">
            Acesso rápido para testes:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Administrador</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                admin@exemplo.com
              </div>
              <div className="text-[10px] text-stone-400">Senha: admin123</div>
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('user')}
              className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <UserIcon className="w-3.5 h-3.5 text-stone-600" />
                <span>Usuário Padrão</span>
              </div>
              <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                joao@exemplo.com
              </div>
              <div className="text-[10px] text-stone-400">Senha: user123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
