'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Clapperboard, Crosshair, Users, Layers, ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useAppStore();

  // Ocultar em telas de autenticação/bloqueio
  if (pathname === '/login' || pathname === '/bloqueado') {
    return null;
  }

  const navItems = [
    { href: '/', label: 'Início', icon: LayoutGrid },
    { href: '/gravacoes', label: 'Diárias', icon: Clapperboard },
    { href: '/diretor', label: 'Diretor', icon: Crosshair, isHighlight: true },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: isAdmin ? '/admin' : '/equipamentos', label: isAdmin ? 'Admin' : 'Kits', icon: isAdmin ? ShieldCheck : Layers },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0e12]/95 backdrop-blur-md border-t border-white/[0.08] pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isHighlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-2.5 flex flex-col items-center group"
              >
                <div
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center border shadow-lg transition-transform active:scale-95',
                    isActive
                      ? 'bg-white text-zinc-950 border-white shadow-white/10'
                      : 'bg-zinc-800 text-zinc-100 border-white/20'
                  )}
                >
                  <Crosshair className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-mono tracking-tight mt-0.5 transition-colors',
                    isActive ? 'text-white font-medium' : 'text-zinc-500'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-all active:scale-95',
                isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-md transition-colors',
                  isActive && 'bg-white/[0.08] text-white'
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
