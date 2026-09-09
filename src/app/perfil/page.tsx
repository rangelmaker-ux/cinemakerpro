'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/local-store';
import { ShieldCheck, LogOut, Check, ExternalLink, Instagram } from 'lucide-react';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';
import { cn } from '@/lib/utils';

export default function PerfilPage() {
  const router = useRouter();
  const { user, isAdmin, signOut } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="space-y-6 max-w-2xl">
        {/* Identificação do Usuário */}
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-white text-base font-semibold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white truncate">{user.name}</h2>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] border border-white/10 px-2 py-0.2 rounded uppercase">
                  {user.subscription_tier || 'PRO'}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.2 rounded">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>

        {/* INTEGRAÇÃO GOOGLE CALENDAR OFICIAL */}
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Integração Google Calendar
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sincronização bidirecional de diárias e cálculo de tempo de trânsito
                </p>
              </div>
            </div>

            <span
              className={cn(
                'text-[10px] font-mono px-2.5 py-1 rounded-full border shrink-0',
                user.google_calendar_connected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-zinc-800 text-zinc-400 border-white/10'
              )}
            >
              {user.google_calendar_connected ? 'Ativo' : 'Desconectado'}
            </span>
          </div>

          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                Agenda Vinculada
              </span>
              <span className="text-zinc-200 font-medium">
                {user.google_calendar_connected ? 'Agenda Principal (Padrão)' : 'Nenhuma conta vinculada'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="px-3 py-1.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-lg transition-colors"
            >
              {user.google_calendar_connected ? 'Gerenciar Sincronia' : 'Conectar Conta Google'}
            </button>
          </div>
        </div>

        {/* PLANO DE ASSINATURA SAAS */}
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-300">
              Status da Assinatura
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3.5 bg-white/[0.04] border border-white/15 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {user.subscription_tier === 'studio' ? 'Plano Studio' : 'Plano Profissional'}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded',
                      user.status === 'active'
                        ? 'bg-emerald-400 text-zinc-950'
                        : 'bg-amber-400 text-zinc-950'
                    )}
                  >
                    {user.status === 'active' ? 'LIBERADO' : 'PAUSADO'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Diretor IA ilimitado, Kits personalizados, Mini CRM e Sincronia Google Calendar
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-white">
                {user.subscription_tier === 'studio' ? 'R$ 99,90/mês' : 'R$ 49,90/mês'}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé do Desenvolvedor */}
        <div className="text-center pt-2 pb-6 text-xs text-zinc-500 space-y-1">
          <p>CineMaker Pro — Desenvolvido por Rangel Maker</p>
          <a
            href="https://www.instagram.com/rangelmaker_/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white font-mono transition-colors"
          >
            @rangelmaker_
          </a>
        </div>
      </div>

      <GoogleCalendarSyncModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  );
}
