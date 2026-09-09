'use client';

import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoogleCalendarSyncModal({ isOpen, onClose }: GoogleCalendarSyncModalProps) {
  const { user } = useAppStore();
  const [isConnected, setIsConnected] = useState(user.google_calendar_connected);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string>('Hoje às 14:15');
  const [selectedCalendar, setSelectedCalendar] = useState('primary');

  if (!isOpen) return null;

  const handleConnectGoogle = () => {
    // Redireciona para o endpoint oficial de OAuth do Google
    window.location.href = '/api/auth/google';
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSync(`Hoje às ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#111318] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              {/* Ícone Oficial Google "G" SVG */}
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
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Integração Google Calendar
              </h3>
              <p className="text-[11px] text-zinc-400">
                Sincronização bidirecional de diárias e checagem de trânsito
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        {!isConnected ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl space-y-2">
              <h4 className="font-semibold text-white">Por que conectar o Google Calendar?</h4>
              <ul className="space-y-1.5 text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Suas gravações no CineMaker aparecem automaticamente na sua agenda.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Detecção de conflitos de horário com reuniões pessoais.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Cálculo inteligente do tempo de deslocamento até o local do cliente.</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={handleConnectGoogle}
              className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-98"
            >
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
              <span>Fazer Login com Google Calendar</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Status da Conta Conectada */}
            <div className="p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div>
                  <span className="font-semibold text-white block">Conta Conectada</span>
                  <span className="text-[11px] text-zinc-400">{user.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] font-medium text-zinc-400 hover:text-rose-400 underline"
              >
                Desconectar
              </button>
            </div>

            {/* Calendário Selecionado */}
            <div>
              <label className="text-[11px] uppercase font-semibold text-zinc-400 tracking-wider block mb-1.5">
                Calendário Principal para Gravações
              </label>
              <select
                value={selectedCalendar}
                onChange={(e) => setSelectedCalendar(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/30"
              >
                <option value="primary">Agenda Principal (Padrão)</option>
                <option value="producao">Diárias & Produção Audiovisual</option>
                <option value="clientes">Compromissos Externos</option>
              </select>
            </div>

            {/* Status da Última Sincronização */}
            <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1">
              <span>Última sincronização: {lastSync}</span>
              <span className="text-emerald-400 font-medium">3 diárias sincronizadas</span>
            </div>

            {/* Botão Sincronizar Agora */}
            <div className="pt-2 border-t border-white/10 flex gap-2">
              <button
                type="button"
                onClick={handleSimulateSync}
                disabled={isSyncing}
                className="flex-1 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando Agenda...' : 'Sincronizar Agora'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium rounded-xl border border-white/10"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
