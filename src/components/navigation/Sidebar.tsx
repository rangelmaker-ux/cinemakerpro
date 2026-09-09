'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clapperboard,
  LayoutDashboard,
  Video,
  Sparkles,
  Users,
  Camera,
  CalendarCheck,
  User,
  Plus,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppStore();

  const navItems = [
    { href: '/', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/diretor', label: 'Diretor IA', icon: Sparkles, isHighlight: true },
    { href: '/gravacoes', label: 'Gravações & Set', icon: Video },
    { href: '/clientes', label: 'Clientes & CRM', icon: Users },
    { href: '/equipamentos', label: 'Kits & Inventário', icon: Camera },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-surface-border h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-surface-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white shadow-lg shadow-brand/20 group-hover:scale-105 transition-transform">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-sm text-white">
                CineMaker
              </span>
              <span className="bg-brand/20 text-brand-light text-[9px] font-black px-1.5 py-0.5 rounded-full border border-brand/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Assistente do Videomaker</p>
          </div>
        </Link>

        <Link
          href="/diretor"
          className="mt-4 w-full py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Iniciar Direção IA</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <span className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2 mt-1">
          Navegação Principal
        </span>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group',
                isActive
                  ? 'bg-brand/15 text-brand-light font-semibold border border-brand/25'
                  : 'text-slate-400 hover:text-white hover:bg-surface-raised'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-brand-light' : 'text-slate-500 group-hover:text-slate-300',
                  item.isHighlight && !isActive && 'text-amber-400'
                )}
              />
              <span>{item.label}</span>

              {item.isHighlight && (
                <span className="ml-auto text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-md">
                  IA
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Calendar Footer */}
      <div className="p-4 border-t border-surface-border bg-surface-raised/40 space-y-2.5">
        {user.google_calendar_connected && (
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
            <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Google Agenda sincronizada</span>
          </div>
        )}

        <Link
          href="/perfil"
          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-raised transition-colors group"
        >
          <div className="w-8 h-8 rounded-lg bg-surface border border-surface-border flex items-center justify-center text-slate-300 group-hover:text-white">
            <User className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-white truncate">{user.name}</h4>
            <p className="text-[10px] text-slate-400 truncate">Configurações & Plano</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
