'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clapperboard, CalendarCheck, User, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';

export function TopHeader() {
  const pathname = usePathname();
  const { user } = useAppStore();

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Visão Geral do Estúdio';
      case '/diretor':
        return 'Diretor de Gravação IA';
      case '/clientes':
        return 'Gestão de Clientes & CRM';
      case '/equipamentos':
        return 'Inventário & Kits Salvos';
      case '/gravacoes':
        return 'Diárias & Set de Gravação';
      case '/perfil':
        return 'Configurações do Videomaker';
      default:
        return 'CineMaker Pro';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur-md border-b border-surface-border px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Mobile: Logo compacto */}
        <div className="flex items-center gap-2.5 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white shadow-sm">
              <Clapperboard className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-sm text-white">CineMaker</span>
          </Link>
        </div>

        {/* Desktop: Breadcrumb & Título de Página */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Workspace</span>
          <span className="text-slate-600">/</span>
          <h1 className="text-xs font-bold text-slate-200">{getPageTitle()}</h1>
        </div>

        {/* Status / Ações rápidas */}
        <div className="flex items-center gap-2">
          {user.google_calendar_connected && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Agenda Conectada</span>
            </div>
          )}

          <Link
            href="/diretor"
            className="flex md:hidden items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 rounded-full"
          >
            <Sparkles className="w-3 h-3" />
            <span>Diretor IA</span>
          </Link>

          <Link
            href="/perfil"
            className="w-8 h-8 rounded-xl bg-surface-raised border border-surface-border flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Meu Perfil"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
