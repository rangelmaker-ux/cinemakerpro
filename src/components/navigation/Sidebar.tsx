'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  Clapperboard,
  Crosshair,
  Users,
  Layers,
  Calendar,
  Settings,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, signOut } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Não exibe a barra lateral na tela de login ou bloqueio
  if (pathname === '/login' || pathname === '/bloqueado') {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Visão Geral', icon: LayoutGrid },
    { href: '/agenda', label: 'Agenda & Google', icon: Calendar },
    { href: '/diretor', label: 'Diretor Técnico', icon: Crosshair },
    { href: '/gravacoes', label: 'Diárias de Set', icon: Clapperboard },
    { href: '/clientes', label: 'Clientes & Projetos', icon: Users },
    { href: '/equipamentos', label: 'Kits & Inventário', icon: Layers },
  ];

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <>
      <aside className="hidden md:flex flex-col w-60 bg-[#0d0e12] border-r border-white/[0.07] h-screen sticky top-0 shrink-0 select-none z-30">
        {/* Brand Header */}
        <div className="p-4 border-b border-white/[0.07]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/15 bg-zinc-900 shrink-0">
              <Image
                src="/icon.png"
                alt="CineMaker Pro"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs tracking-tight text-white">
                  CineMaker Pro
                </span>
                <span className="bg-zinc-800 text-zinc-300 text-[9px] font-mono px-1.5 py-0.2 rounded border border-white/10">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Assistente de Produção</p>
            </div>
          </Link>

          <Link
            href="/diretor"
            className="mt-3 w-full py-2 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Crosshair className="w-3.5 h-3.5 text-zinc-800" />
            <span>Novo Escaneamento</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          <span className="px-2.5 text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-1.5 mt-1">
            Produção
          </span>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors',
                  isActive
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-zinc-100' : 'text-zinc-500'
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Se for Administrador, exibe link para Painel Admin */}
          {isAdmin && (
            <div className="pt-3">
              <span className="px-2.5 text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-1.5">
                Administração
              </span>
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors',
                  pathname === '/admin'
                    ? 'bg-white/[0.08] text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                )}
              >
                <ShieldCheck
                  className={cn(
                    'w-4 h-4 shrink-0',
                    pathname === '/admin' ? 'text-emerald-400' : 'text-zinc-500'
                  )}
                />
                <span>Painel Admin</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Sincronização Google & Footer */}
        <div className="p-3 border-t border-white/[0.07] bg-black/30 space-y-2">
          {/* Botão de Sincronia Google Calendar */}
          <button
            type="button"
            onClick={() => setIsCalendarOpen(true)}
            className="w-full p-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl flex items-center justify-between text-left transition-colors group"
          >
            <div className="flex items-center gap-2">
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
              <div>
                <span className="text-[11px] font-medium text-white block leading-tight">
                  Google Calendar
                </span>
                <span className="text-[9px] text-zinc-400">
                  {user?.google_calendar_connected ? 'Sincronizado' : 'Conectar agenda'}
                </span>
              </div>
            </div>

            <div
              className={cn(
                'w-2 h-2 rounded-full',
                user?.google_calendar_connected ? 'bg-emerald-400' : 'bg-zinc-600'
              )}
            />
          </button>

          {/* Perfil & Logout */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <Link
              href="/perfil"
              className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-semibold text-zinc-200 shrink-0">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="min-w-0">
                <span className="text-xs truncate block text-zinc-200 font-medium leading-tight">
                  {user?.name || 'Videomaker'}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 block truncate">
                  {user?.email || ''}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                href="/perfil"
                className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
                title="Configurações"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
                title="Sair da Conta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <GoogleCalendarSyncModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  );
}
