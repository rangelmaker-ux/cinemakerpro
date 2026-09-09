'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/local-store';
import { Video, Clock, MapPin, Briefcase, Plus, ArrowRight, CheckCircle2, Calendar, RefreshCw } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';

export default function GravacoesPage() {
  const { shoots, clients, kits, user } = useAppStore();
  const [tab, setTab] = useState<'proximas' | 'concluidas'>('proximas');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [syncingShootId, setSyncingShootId] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const filteredShoots = shoots.filter((s) =>
    tab === 'proximas' ? s.status !== 'concluido' : s.status === 'concluido'
  );

  const handleSyncSingleShoot = async (shoot: any) => {
    setSyncingShootId(shoot.id);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: shoot.title || 'Diária de Gravação',
          date: shoot.scheduled_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          startTime: '09:00',
          durationMin: shoot.estimated_duration_min || 180,
          location: shoot.location_address || '',
          description: `Diária cadastrada no CineMaker Pro.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncSuccessMsg(`Diária sincronizada com sucesso na sua Google Agenda!`);
        setTimeout(() => setSyncSuccessMsg(null), 4000);
      } else {
        setIsCalendarModalOpen(true);
      }
    } catch (e) {
      setIsCalendarModalOpen(true);
    } finally {
      setSyncingShootId(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {syncSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-brand-light" />
            <span>Minhas Gravações</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Acompanhe diárias agendadas, equipamentos e sincronização com Google Calendar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Sincronizar Google Agenda */}
          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(true)}
            className="py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-zinc-200 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
            title="Sincronizar com a Google Agenda"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Google Agenda</span>
            <div className={`w-1.5 h-1.5 rounded-full ${user?.google_calendar_connected ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </button>

          <Link
            href="/diretor"
            className="py-2 px-3 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Gravação</span>
          </Link>
        </div>
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
                    Gravação Agendada
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
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Duração: {shoot.estimated_duration_min} min</span>
                </div>
              </div>

              {/* Barra de Progresso do Checklist */}
              <div className="mb-3">
                <div className="flex justify-between text-[11px] font-semibold mb-1">
                  <span className="text-slate-400">Preparação (Checklist)</span>
                  <span className="text-brand-light font-mono">{progress}%</span>
                </div>
                <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSyncSingleShoot(shoot)}
                  disabled={syncingShootId === shoot.id}
                  className="py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                  title="Enviar diária para a Google Agenda"
                >
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{syncingShootId === shoot.id ? 'Sincronizando...' : 'Google Agenda'}</span>
                </button>

                <Link
                  href="/diretor"
                  className="py-2 px-3 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                >
                  <span>Diretor IA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredShoots.length === 0 && (
        <div className="text-center py-16 bg-[#111318] border border-white/[0.08] rounded-3xl p-8 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
            <Video className="w-6 h-6 text-zinc-300" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">Nenhuma gravação agendada</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Quando você agendar uma nova diária ou iniciar um plano de set no Diretor Técnico, ele aparecerá aqui.
            </p>
          </div>
          <Link
            href="/diretor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-zinc-950 text-xs font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Abrir Diretor Técnico
          </Link>
        </div>
      )}

      <GoogleCalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </div>
  );
}
