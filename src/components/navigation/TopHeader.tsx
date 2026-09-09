'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, Calendar, Settings, Crosshair } from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';

export function TopHeader() {
  const pathname = usePathname();
  const { user } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Visão Geral do Estúdio';
      case '/diretor':
        return 'Diretor Técnico de Set';
      case '/clientes':
        return 'Clientes & Projetos';
      case '/equipamentos':
        return 'Kits & Inventário de Lentes';
      case '/gravacoes':
        return 'Diárias de Gravação';
      case '/perfil':
        return 'Configurações de Produção';
      default:
        return 'CineMaker Pro';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-[#0d0e12]/90 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Mobile: Logo minimalista */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-white">
                <Clapperboard className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs text-white">CineMaker</span>
            </Link>
          </div>

          {/* Desktop: Breadcrumb técnico */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-500">WORKSPACE</span>
            <span className="text-zinc-600">/</span>
            <h1 className="font-medium text-zinc-200">{getPageTitle()}</h1>
          </div>

          {/* Ações Rápidas: Google Calendar Sync + Perfil */}
          <div className="flex items-center gap-2">
            {/* Botão de Integração Google Calendar */}
            <button
              type="button"
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-[11px] font-medium text-zinc-300 transition-colors"
              title="Sincronizar Google Calendar"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span className="hidden sm:inline">Google Calendar</span>
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  user.google_calendar_connected ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
              />
            </button>

            <Link
              href="/perfil"
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title="Configurações"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <GoogleCalendarSyncModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  );
}
