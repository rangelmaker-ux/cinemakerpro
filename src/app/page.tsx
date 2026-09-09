'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Crosshair,
  Clock,
  MapPin,
  ArrowRight,
  Users,
  Layers,
  Zap,
  Calendar,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Clapperboard,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';

export default function HomePage() {
  const { clients, projects, activeShoot, kits, user } = useAppStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const defaultKit = kits.find((k) => k.is_default) || kits[0];
  const activeProject = projects.find((p) => p.id === activeShoot?.project_id);
  const activeClient = clients.find((c) => c.id === activeProject?.client_id);

  const leadsCount = clients.filter((c) => c.status === 'lead').length;
  const orcamentosCount = clients.filter((c) => c.status === 'orcamento').length;
  const fechadosCount = clients.filter((c) => c.status === 'fechado').length;
  const posVendaCount = clients.filter((c) => c.status === 'pos_venda').length;

  return (
    <>
      <div className="space-y-6">
        {/* Set Header / Hero de Produção */}
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 sm:p-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>SISTEMA DE DIREÇÃO TÉCNICA E MAPA DE SET</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
              Assistente de Posicionamento de Câmera, Luz e Áudio
            </h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Analisa o espaço real em campo e calcula a posição angular da luz principal (45°),
              altura da câmera na linha dos olhos e lente recomendada do seu kit.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/diretor"
                className="px-4 py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
              >
                <Crosshair className="w-4 h-4 text-zinc-900" />
                <span>Iniciar Escaneamento do Espaço</span>
              </Link>

              <Link
                href="/diretor?quick=true"
                className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-xs font-medium rounded-xl border border-white/10 flex items-center gap-2 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Rápido de Set</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Grid de Operações */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Diária Imediata & Checklist do Set (7 colunas) */}
          <div className="lg:col-span-7 space-y-4">
            {activeShoot ? (
              <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-mono font-semibold uppercase text-zinc-300 tracking-wider">
                      Próxima Diária
                    </span>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    Agendada
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">
                    {activeProject?.title || activeClient?.name || 'Diária de Gravação'}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-xs text-zinc-400 mt-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{activeShoot.estimated_duration_min || 120}min previstos</span>
                    </div>
                    {activeShoot.location_address && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">{activeShoot.location_address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Kit: {defaultKit?.name || 'Padrão'}</span>
                    </div>
                  </div>
                </div>

                {/* Preparação de Baterias e Mídia */}
                <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-300">Conferência de Equipamentos</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      {activeShoot.checklist_state.filter((c) => c.done).length} de{' '}
                      {activeShoot.checklist_state.length} itens checados
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-300"
                      style={{
                        width: `${Math.round(
                          (activeShoot.checklist_state.filter((c) => c.done).length /
                            (activeShoot.checklist_state.length || 1)) *
                            100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <Link
                    href="/diretor"
                    className="flex-1 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Abrir Diretor Técnico</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/gravacoes"
                    className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium rounded-xl border border-white/10 transition-colors"
                  >
                    Ver Diárias
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                  <Clapperboard className="w-6 h-6 text-zinc-300" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">
                    Nenhuma diária agendada no momento
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Seu cronograma está livre. Cadastre um novo cliente no CRM ou use o Diretor Técnico para escanear a iluminação do seu próximo set.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <Link
                    href="/diretor"
                    className="py-2.5 px-4 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-zinc-950" />
                    <span>Novo Escaneamento IA</span>
                  </Link>
                  <Link
                    href="/clientes"
                    className="py-2.5 px-4 bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 text-xs font-medium rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Cadastrar Cliente</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Alerta de Logística / Deslocamento se houver endereço */}
            {activeShoot?.location_address && (
              <div className="p-3.5 bg-amber-500/[0.04] border border-amber-500/20 rounded-xl flex items-start gap-3 text-xs text-zinc-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-400 block mb-0.5">
                    Previsão de Deslocamento
                  </span>
                  Endereço do set: {activeShoot.location_address}. Verifique o trânsito com antecedência.
                </div>
              </div>
            )}
          </div>

          {/* CRM & Google Calendar Widget (5 colunas) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Widget de Integração Google Calendar */}
            <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  <h3 className="text-xs font-semibold text-white">Google Calendar</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(true)}
                  className="text-[11px] font-medium text-zinc-400 hover:text-white underline"
                >
                  Gerenciar
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {user?.google_calendar_connected
                  ? 'Sincronização ativa. Suas diárias de gravação e reuniões estão alinhadas.'
                  : 'Conecte sua conta do Google para sincronizar diárias de gravação diretamente na sua agenda.'}
              </p>

              <button
                type="button"
                onClick={() => setIsCalendarOpen(true)}
                className="w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-xs font-medium text-white flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>
                  {user?.google_calendar_connected ? 'Sincronizar Agenda Agora' : 'Conectar com o Google'}
                </span>
              </button>
            </div>

            {/* Pipeline do CRM */}
            <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-semibold text-white">Funil de Clientes</h3>
                </div>
                <Link
                  href="/clientes"
                  className="text-[11px] font-medium text-zinc-400 hover:text-white underline"
                >
                  Ver todos
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <Link
                  href="/clientes?tab=lead"
                  className="bg-black/30 hover:bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06] transition-colors"
                >
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">LEADS</span>
                  <span className="text-base font-bold text-sky-400 font-mono">{leadsCount}</span>
                </Link>
                <Link
                  href="/clientes?tab=orcamento"
                  className="bg-black/30 hover:bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06] transition-colors"
                >
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">PROPOSTAS</span>
                  <span className="text-base font-bold text-amber-400 font-mono">{orcamentosCount}</span>
                </Link>
                <Link
                  href="/clientes?tab=fechado"
                  className="bg-black/30 hover:bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06] transition-colors"
                >
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">EM SET</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{fechadosCount}</span>
                </Link>
                <Link
                  href="/clientes?tab=pos_venda"
                  className="bg-black/30 hover:bg-white/[0.04] p-2.5 rounded-xl border border-white/[0.06] transition-colors"
                >
                  <span className="text-[9px] font-mono text-zinc-500 block uppercase">PÓS-VENDA</span>
                  <span className="text-base font-bold text-zinc-300 font-mono">{posVendaCount}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <GoogleCalendarSyncModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  );
}
