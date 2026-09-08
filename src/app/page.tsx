'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Users,
  Briefcase,
  Zap,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const { user, clients, shoots, activeShoot, kits } = useAppStore();

  const defaultKit = kits.find((k) => k.is_default) || kits[0];

  // Métricas do Mini CRM
  const leadsCount = clients.filter((c) => c.status === 'lead').length;
  const orcamentosCount = clients.filter((c) => c.status === 'orcamento').length;
  const fechadosCount = clients.filter((c) => c.status === 'fechado').length;
  const posVendaCount = clients.filter((c) => c.status === 'pos_venda').length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. CTA MESTRE: ME AJUDA A GRAVAR */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-hover rounded-3xl p-5 shadow-xl shadow-brand/25 border border-brand-light/30">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-brand-light border border-white/10 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Diretor de Gravação IA</span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white mb-1 leading-tight">
            Chegou no cliente e precisa montar?
          </h2>
          <p className="text-xs text-white/80 mb-4 max-w-[280px] leading-relaxed">
            Fotografe o ambiente e a IA indica exatamente onde colocar câmera, luz, pessoa e qual lente usar.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href="/diretor"
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4 text-brand-dark" />
              <span>📷 ME AJUDA A GRAVAR</span>
            </Link>

            <Link
              href="/diretor?quick=true"
              className="py-2.5 px-3 bg-black/30 hover:bg-black/40 text-white font-bold text-xs rounded-2xl border border-white/20 flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Rápido</span>
            </Link>
          </div>
        </div>

        {/* Efeito decorativo de iluminação */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. PRÓXIMO COMPROMISSO / GRAVAÇÃO IMEDIATA */}
      {activeShoot && (
        <div className="bg-surface border border-surface-border rounded-3xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Próximo Compromisso
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Hoje • 14:00
            </span>
          </div>

          <h3 className="font-bold text-base text-white mb-1">
            DF Móveis — Vídeo Institucional
          </h3>

          <div className="space-y-1.5 text-xs text-slate-300 mb-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Duração estimada: 2 horas</span>
            </div>
            {activeShoot.location_address && (
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{activeShoot.location_address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Kit: {defaultKit?.name || 'Padrão'}</span>
            </div>
          </div>

          <Link
            href="/diretor"
            className="w-full py-2.5 bg-surface-raised hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-surface-border flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Abrir Preparação & Direção IA</span>
            <ArrowRight className="w-3.5 h-3.5 text-brand-light" />
          </Link>
        </div>
      )}

      {/* 3. ALERTA INTELIGENTE DE AGENDA (Detecção de Conflitos / Deslocamento) */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200">
          <span className="font-bold text-amber-400 block leading-tight">
            Lembrete de Deslocamento
          </span>
          Sua gravação no SIA começa às 14:00. O tempo estimado de deslocamento no horário de pico é de 35 minutos.
        </div>
      </div>

      {/* 4. PIPELINE DO MINI CRM */}
      <div className="bg-surface border border-surface-border rounded-3xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-light" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              Meus Clientes & Oportunidades
            </h3>
          </div>
          <Link
            href="/clientes"
            className="text-[11px] font-semibold text-brand-light hover:underline"
          >
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <Link
            href="/clientes?tab=lead"
            className="bg-surface-raised p-2 rounded-xl border border-surface-border hover:border-sky-500/50 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 block">LEADS</span>
            <span className="text-base font-black text-sky-400">{leadsCount}</span>
          </Link>
          <Link
            href="/clientes?tab=orcamento"
            className="bg-surface-raised p-2 rounded-xl border border-surface-border hover:border-amber-500/50 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 block">ORÇAMENTOS</span>
            <span className="text-base font-black text-amber-400">{orcamentosCount}</span>
          </Link>
          <Link
            href="/clientes?tab=fechado"
            className="bg-surface-raised p-2 rounded-xl border border-surface-border hover:border-emerald-500/50 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 block">FECHADOS</span>
            <span className="text-base font-black text-emerald-400">{fechadosCount}</span>
          </Link>
          <Link
            href="/clientes?tab=pos_venda"
            className="bg-surface-raised p-2 rounded-xl border border-surface-border hover:border-purple-500/50 transition-colors"
          >
            <span className="text-[10px] font-bold text-slate-400 block">PÓS-VENDA</span>
            <span className="text-base font-black text-purple-400">{posVendaCount}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
