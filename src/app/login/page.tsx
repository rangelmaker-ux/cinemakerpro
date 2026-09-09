'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/local-store';
import { Clapperboard, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAppStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          setErrorMsg('Por favor, informe seu e-mail e senha.');
          setLoading(false);
          return;
        }

        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao autenticar.');
          setLoading(false);
          return;
        }

        if (res.status === 'paused' || res.status === 'blocked') {
          router.replace('/bloqueado');
        } else {
          router.replace('/');
        }
      } else {
        if (!name.trim() || !email.trim() || !password) {
          setErrorMsg('Preencha todos os campos para criar sua conta.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }

        const res = await signUp(email, password, name);
        if (!res.success) {
          setErrorMsg(res.error || 'Falha ao criar conta.');
          setLoading(false);
          return;
        }

        router.replace('/');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    setEmail('rangelmaker@gmail.com');
    setPassword('2505.Raj');
    setMode('login');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-[#0f1117] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6">
        {/* App Logo & Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-white/15 p-2 shadow-inner">
            {/* Logo Image */}
            <div className="relative w-full h-full rounded-xl overflow-hidden">
              <Image
                src="/icon.png"
                alt="CineMaker Pro"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CineMaker Pro</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Assistente de Produção & Diretor de Gravação IA
            </p>
          </div>
        </div>

        {/* Tabs de Seleção */}
        <div className="grid grid-cols-2 p-1 bg-white/[0.03] border border-white/[0.07] rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Mensagem de Erro */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase text-zinc-400">
                Seu Nome ou Produtora
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Videomaker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/[0.08] focus:border-white/25 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase text-zinc-400">
              E-mail Profissional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/[0.08] focus:border-white/25 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase text-zinc-400">Senha</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-black/40 border border-white/[0.08] focus:border-white/25 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Acesso liberado imediatamente (sem confirmação por e-mail).</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'login' ? 'Entrar no CineMaker Pro' : 'Criar Conta Instantânea'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Acesso Rápido Admin */}
        <div className="pt-2 border-t border-white/[0.06] text-center">
          <button
            type="button"
            onClick={handleQuickAdmin}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-mono"
          >
            Preencher credenciais do Administrador (Rangel Maker)
          </button>
        </div>
      </div>
    </div>
  );
}
