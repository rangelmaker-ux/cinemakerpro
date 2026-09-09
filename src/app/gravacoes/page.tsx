'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/local-store';
import { Video, Clock, MapPin, Briefcase, Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function GravacoesPage() {
  const { shoots, clients, kits } = useAppStore();
  const [tab, setTab] = useState<'proximas' | 'concluidas'>('proximas');

  const filteredShoots = shoots.filter((s) =>
    tab === 'proximas' ? s.status !== 'concluido' : s.status === 'concluido'
  );

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-brand-light" />
            <span>Minhas Gravações</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Acompanhe diárias agendadas e preparação de set
          </p>
        </div>

        <Link
          href="/diretor"
          className="py-2 px-3 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/20 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Gravação</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 bg-surface p-1 rounded-2xl border border-surface-border">
        <button
          type="button"
          onClick={() => setTab('proximas')}
          className={cn(
            'py-2 rounded-xl text-center text-xs font-bold transition-all active:scale-95',
            tab === 'proximas'
              ? 'bg-brand text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-surface-raised'
          )}
        >
          Próximas Diárias
        </button>

        <button
          type="button"
          onClick={() => setTab('concluidas')}
          className={cn(
            'py-2 rounded-xl text-center text-xs font-bold transition-all active:scale-95',
            tab === 'concluidas'
              ? 'bg-brand text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-surface-raised'
          )}
        >
          Concluídas
        </button>
      </div>

      {/* Lista de Gravações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredShoots.map((shoot) => {
          const kit = kits.find((k) => k.id === shoot.kit_id);
          const checks = shoot.checklist_state;
          const doneChecks = checks.filter((c) => c.done).length;
          const progress = checks.length > 0 ? Math.round((doneChecks / checks.length) * 100) : 0;

          return (
            <div
              key={shoot.id}
              className="bg-surface border border-surface-border rounded-2xl p-4 shadow-md transition-all hover:border-slate-600"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-sm text-white">
                    Gravação Institucional — DF Móveis
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(shoot.scheduled_at)}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {shoot.status === 'agendado' ? 'Agendada' : 'Em Andamento'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 mb-3">
                {shoot.location_address && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{shoot.location_address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Kit: {kit?.name || 'Kit Padrão'}</span>
                </div>
              </div>

              {/* Barra de Checklist */}
              <div className="bg-surface-raised rounded-xl p-2.5 mb-3 border border-surface-border/60">
                <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
                  <span className="text-slate-400 uppercase tracking-wider">
                    Preparação do Set
                  </span>
                  <span className="text-emerald-400">{progress}% pronto</span>
                </div>
                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <Link
                href="/diretor"
                className="w-full py-2 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-brand/20 transition-all active:scale-95"
              >
                <span>Abrir no Diretor IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
