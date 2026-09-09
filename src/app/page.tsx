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
  AlertTriangle,
  Users,
  Briefcase,
  Zap,
  Plus,
  FileText,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const { clients, activeShoot, kits } = useAppStore();

  const defaultKit = kits.find((k) => k.is_default) || kits[0];

  const leadsCount = clients.filter((c) => c.status === 'lead').length;
  const orcamentosCount = clients.filter((c) => c.status === 'orcamento').length;
  const fechadosCount = clients.filter((c) => c.status === 'fechado').length;
  const posVendaCount = clients.filter((c) => c.status === 'pos_venda').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO STUDIO BANNER (Clean, Pro, Dark Studio) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-surface to-surface-raised border border-surface-border rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-brand/10 border border-brand/25 px-3 py-1 rounded-full text-[11px] font-semibold text-brand-light mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Assistente Operacional Audiovisual</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2 leading-tight">
            Diretor de Gravação IA
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
            Fotografe o ambiente real e receba a montagem exata de câmera, lente, luz a 45° e microfone baseada no seu kit real.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/diretor"
              className="px-5 py-3 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-98"
            >
              <Camera className="w-4 h-4" />
              <span>Iniciar Escaneamento IA</span>
            </Link>

            <Link
              href="/diretor?quick=true"
              className="px-4 py-3 bg-surface-raised hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-surface-border flex items-center gap-2 transition-all active:scale-98"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Rápido (Pressa no Set)</span>
            </Link>
          </div>
        </div>

        {/* Efeito sutil de luz de fundo */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-brand/10 to-transparent pointer-events-none" />
      </div>

      {/* 2. GRID PRINCIPAL DESKTOP (2 Colunas Fluidas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Próxima Diária & Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {activeShoot && (
            <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Próxima Gravação Agendada
                  </span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  Hoje • 14:00
                </span>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">
                  DF Móveis — Vídeo Institucional Linha 2026
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>2h estimadas</span>
                  </div>
                  {activeShoot.location_address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{activeShoot.location_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kit: {defaultKit?.name || 'Comercial'}</span>
                  </div>
                </div>
              </div>

              {/* Checklist de Preparação Rápida */}
              <div className="bg-surface-raised border border-surface-border/60 rounded-2xl p-4 mb-4">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-300">Preparação de Equipamento</span>
                  <span className="text-emerald-400">
                    {activeShoot.checklist_state.filter((c) => c.done).length} de{' '}
                    {activeShoot.checklist_state.length} itens prontos
                  </span>
                </div>
                <div className="w-full bg-background h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        (activeShoot.checklist_state.filter((c) => c.done).length /
                          activeShoot.checklist_state.length) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Baterias carregadas, cartões formatados e lente 35mm limpa.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href="/diretor"
                  className="flex-1 py-3 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
                >
                  <span>Abrir Diretor IA para esta Gravação</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/gravacoes"
                  className="py-3 px-4 bg-surface-raised hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-surface-border transition-colors"
                >
                  Ver Diárias
                </Link>
              </div>
            </div>
          )}

          {/* Alerta de Deslocamento de Agenda */}
          <div className="bg-surface border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-amber-400 block mb-0.5">
                Alerta de Deslocamento & Trânsito
              </span>
              Sua gravação no SIA Trecho 3 começa às 14:00. O deslocamento no horário de pico está estimado em 35 minutos.
            </div>
          </div>
        </div>

        {/* Coluna 3: Pipeline do Mini CRM & Clientes Recentes */}
        <div className="space-y-6">
          <div className="bg-surface border border-surface-border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-light" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                  Pipeline de Clientes
                </h3>
              </div>
              <Link
                href="/clientes"
                className="text-xs font-semibold text-brand-light hover:underline"
              >
                Ver todos
              </Link>
            </div>

            {/* Badges de Contagem */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <Link
                href="/clientes?tab=lead"
                className="bg-surface-raised hover:bg-slate-800/80 p-3 rounded-2xl border border-surface-border transition-colors"
              >
                <span className="text-[10px] font-semibold text-slate-400 block">LEADS</span>
                <span className="text-xl font-bold text-sky-400">{leadsCount}</span>
              </Link>
              <Link
                href="/clientes?tab=orcamento"
                className="bg-surface-raised hover:bg-slate-800/80 p-3 rounded-2xl border border-surface-border transition-colors"
              >
                <span className="text-[10px] font-semibold text-slate-400 block">PROPOSTAS</span>
                <span className="text-xl font-bold text-amber-400">{orcamentosCount}</span>
              </Link>
              <Link
                href="/clientes?tab=fechado"
                className="bg-surface-raised hover:bg-slate-800/80 p-3 rounded-2xl border border-surface-border transition-colors"
              >
                <span className="text-[10px] font-semibold text-slate-400 block">FECHADOS</span>
                <span className="text-xl font-bold text-emerald-400">{fechadosCount}</span>
              </Link>
              <Link
                href="/clientes?tab=pos_venda"
                className="bg-surface-raised hover:bg-slate-800/80 p-3 rounded-2xl border border-surface-border transition-colors"
              >
                <span className="text-[10px] font-semibold text-slate-400 block">PÓS-VENDA</span>
                <span className="text-xl font-bold text-purple-400">{posVendaCount}</span>
              </Link>
            </div>

            {/* Lista Compacta de Clientes Ativos */}
            <div className="space-y-2">
              {clients.slice(0, 3).map((client) => (
                <Link
                  key={client.id}
                  href={`/clientes`}
                  className="block p-3 rounded-xl bg-surface-raised hover:bg-slate-800/60 border border-surface-border transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white group-hover:text-brand-light truncate">
                      {client.name}
                    </h4>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {client.status}
                    </span>
                  </div>
                  {client.next_action && (
                    <p className="text-[11px] text-slate-400 truncate mt-1">
                      {client.next_action}
                    </p>
                  )}
                </Link>
              ))}
            </div>

            <Link
              href="/clientes"
              className="mt-4 w-full py-2.5 bg-surface-raised hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-surface-border flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Gerenciar Mini CRM</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
