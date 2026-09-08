'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/local-store';
import { User, Calendar, ShieldCheck, Sparkles, Check, ExternalLink, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PerfilPage() {
  const { user } = useAppStore();
  const [googleConnected, setGoogleConnected] = useState(user.google_calendar_connected);

  const toggleGoogle = () => {
    setGoogleConnected((prev) => !prev);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Header com Dados do Usuário */}
      <div className="bg-surface border border-surface-border rounded-3xl p-5 text-center relative overflow-hidden shadow-lg">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-brand-dark to-brand flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-md shadow-brand/20">
          {user.name.charAt(0)}
        </div>
        <h2 className="text-base font-black text-white">{user.name}</h2>
        <p className="text-xs text-slate-400 mb-2">{user.email}</p>

        <div className="inline-flex items-center gap-1.5 bg-brand/15 text-brand-light border border-brand/30 px-3 py-1 rounded-full text-[11px] font-bold">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>Plano PRO Ativo</span>
        </div>
      </div>

      {/* INTEGRAÇÃO GOOGLE AGENDA */}
      <div className="bg-surface border border-surface-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white leading-tight">
                Google Agenda Oficial
              </h3>
              <p className="text-[10px] text-slate-400">
                Sincronização de gravações e detecção de conflitos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleGoogle}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95',
              googleConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-brand hover:bg-brand-hover text-white'
            )}
          >
            {googleConnected ? 'Conectado' : 'Conectar Google'}
          </button>
        </div>

        {googleConnected && (
          <div className="bg-surface-raised p-2.5 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">Calendário Selecionado:</span>
            <span className="font-bold text-white">Gravações & Clientes (Padrão)</span>
          </div>
        )}
      </div>

      {/* PLANOS E ASSINATURA SAAS */}
      <div className="bg-surface border border-surface-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-light" />
          <h3 className="font-bold text-xs text-white uppercase tracking-wider">
            Planos CineMaker Pro
          </h3>
        </div>

        <div className="space-y-2">
          {/* Plano Free */}
          <div className="p-3 bg-surface-raised rounded-xl border border-surface-border/60 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white block">FREE</span>
              <span className="text-[10px] text-slate-400">3 clientes • Diretor IA básico</span>
            </div>
            <span className="font-bold text-slate-400">R$ 0</span>
          </div>

          {/* Plano Pro */}
          <div className="p-3 bg-brand/10 rounded-xl border border-brand/40 flex items-center justify-between text-xs shadow-sm">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">PRO (Seu Plano)</span>
                <span className="bg-brand text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                  POPULAR
                </span>
              </div>
              <span className="text-[10px] text-brand-light block">
                Clientes ilimitados • Diretor IA completo • Google Agenda
              </span>
            </div>
            <span className="font-black text-brand-light">R$ 49,90/mês</span>
          </div>

          {/* Plano Studio */}
          <div className="p-3 bg-surface-raised rounded-xl border border-surface-border/60 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white block">STUDIO</span>
              <span className="text-[10px] text-slate-400">Equipes • Múltiplos usuários • IA expandida</span>
            </div>
            <span className="font-bold text-slate-300">R$ 89,90/mês</span>
          </div>
        </div>
      </div>

      {/* RODAPÉ DO PRODUTOR */}
      <div className="text-center pt-2 pb-4 text-xs text-slate-500">
        <p className="font-medium">Desenvolvido com visão cinematográfica por</p>
        <a
          href="https://www.instagram.com/rangelmaker_/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-brand-light hover:underline mt-0.5"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-400" />
          <span>@rangelmaker_</span>
        </a>
      </div>
    </div>
  );
}
