'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, ShieldCheck, LogOut } from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';

export function TopHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, signOut } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Ocultar em telas de autenticação/bloqueio
  if (pathname === '/login' || pathname === '/bloqueado') {
    return null;
  }

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
      case '/admin':
        return 'Painel Geral do Administrador';
      default:
        return 'CineMaker Pro';
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-[#0d0e12]/90 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Mobile: Logo e Nome com o novo ícone */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/15 bg-zinc-900 shrink-0">
                <Image
                  src="/icon.png"
                  alt="CineMaker Pro"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-semibold text-xs text-white">CineMaker Pro</span>
            </Link>
          </div>

          {/* Desktop: Breadcrumb técnico */}
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px]">
            <span className="text-zinc-500">WORKSPACE</span>
            <span className="text-zinc-600">/</span>
            <h1 className="font-medium text-zinc-200">{getPageTitle()}</h1>
          </div>

          {/* Ações Rápidas: Google Calendar Sync + Perfil + Admin */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-lg text-[11px] font-mono text-emerald-300 transition-colors"
                title="Painel do Administrador"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

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
                  user?.google_calendar_connected ? 'bg-emerald-400' : 'bg-zinc-600'
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

            <button
              type="button"
              onClick={handleLogout}
              className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-rose-500/15 border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-rose-400 transition-colors md:hidden"
              title="Sair"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
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
