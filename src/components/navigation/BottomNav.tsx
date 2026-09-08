'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Video, Sparkles, Users, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/gravacoes', label: 'Gravações', icon: Video },
    { href: '/diretor', label: 'Diretor IA', icon: Sparkles, isHighlight: true },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/equipamentos', label: 'Equipamentos', icon: Camera },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isHighlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3 flex flex-col items-center group"
              >
                <div
                  className={cn(
                    'w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95',
                    isActive
                      ? 'bg-gradient-to-tr from-brand to-brand-light text-white glow-purple'
                      : 'bg-gradient-to-tr from-brand-dark to-brand text-white/90 hover:brightness-110'
                  )}
                  style={{ width: '52px', height: '52px' }}
                >
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold mt-1 transition-colors',
                    isActive ? 'text-brand-light' : 'text-slate-400'
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
                'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 active:scale-95',
                isActive ? 'text-brand-light' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div
                className={cn(
                  'p-1.5 rounded-lg transition-colors',
                  isActive && 'bg-brand/15 text-brand-light'
                )}
              >
                <Icon className="w-5 h-5" />
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
