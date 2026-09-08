'use client';

import React from 'react';
import Link from 'next/link';
import { Clapperboard, CalendarCheck, User } from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';

export function TopHeader() {
  const { user } = useAppStore();

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-surface-border pt-safe px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white shadow-md shadow-brand/20 group-active:scale-95 transition-transform">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-base text-white">CineMaker</span>
              <span className="bg-brand/20 text-brand-light text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-brand/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Assistente do Videomaker</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user.google_calendar_connected && (
            <div
              className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full"
              title="Google Agenda sincronizada"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Agenda OK</span>
            </div>
          )}

          <Link
            href="/perfil"
            className="w-9 h-9 rounded-xl bg-surface border border-surface-border flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-600 transition-colors active:scale-95"
            title="Meu Perfil & Configurações"
          >
            <User className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
