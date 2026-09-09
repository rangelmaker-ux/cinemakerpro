'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Clock,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RealCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  htmlLink?: string;
}

export function GoogleCalendarSyncModal({ isOpen, onClose }: GoogleCalendarSyncModalProps) {
  const { user, shoots, setGoogleCalendarConnected } = useAppStore();

  const [isConnected, setIsConnected] = useState(user?.google_calendar_connected ?? false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [hasCredentials, setHasCredentials] = useState<boolean>(true);
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [copiedUri, setCopiedUri] = useState<boolean>(false);
  const [showConfigGuide, setShowConfigGuide] = useState<boolean>(false);

  // Eventos reais da Google Agenda
  const [realEvents, setRealEvents] = useState<RealCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [isSyncingShoots, setIsSyncingShoots] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Checar status real dos cookies e Google OAuth
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/calendar/status');
      if (res.ok) {
        const data = await res.json();
        setHasCredentials(data.hasCredentialsConfigured ?? true);
        setRedirectUri(data.redirectUri || '');

        if (data.connected) {
          setIsConnected(true);
          setGoogleEmail(data.email || user?.email || null);
          setGoogleCalendarConnected(true);
          loadRealEvents();
        } else if (!user?.google_calendar_connected) {
          setIsConnected(false);
          setGoogleEmail(null);
        }
      }
    } catch (e) {
      console.error('Erro ao verificar status do Google Calendar:', e);
    }
  };

  // Carregar eventos reais da Google Agenda
  const loadRealEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        if (data.connected && data.events) {
          setRealEvents(data.events);
          if (data.email) setGoogleEmail(data.email);
        }
      }
    } catch (err) {
      console.error('Falha ao buscar eventos reais da Google Agenda:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Redireciona para o OAuth Oficial da Google
  const handleConnectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  // Sincronizar diárias do CineMaker Pro diretamente para a Google Agenda Real
  const handleSyncAllShoots = async () => {
    setIsSyncingShoots(true);
    setSyncFeedback(null);

    try {
      const res = await fetch('/api/calendar/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shoots }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncFeedback(`${data.syncedCount || 0} gravações sincronizadas diretamente na sua Google Agenda!`);
        loadRealEvents();
      } else {
        setSyncFeedback(data.error || 'Falha ao sincronizar diárias com a Google.');
      }
    } catch (err: any) {
      setSyncFeedback(err?.message || 'Erro de conexão com a API Google Calendar.');
    } finally {
      setIsSyncingShoots(false);
    }
  };

  // Desconectar Conta Google
  const handleDisconnect = async () => {
    try {
      await fetch('/api/calendar/status', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    setIsConnected(false);
    setGoogleEmail(null);
    setRealEvents([]);
    setGoogleCalendarConnected(false);
  };

  const handleCopyRedirectUri = () => {
    if (redirectUri) {
      navigator.clipboard.writeText(redirectUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-[#101217] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 text-zinc-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0">
              {/* Ícone Oficial Google "G" SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Google Agenda (Google Calendar)
                </h3>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                    isConnected
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-white/10'
                  }`}
                >
                  {isConnected ? 'CONECTADO' : 'NÃO VINCULADO'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Sincronização bidirecional de diárias, call times e prevenção de conflitos
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

        {/* FEEDBACK DE STATUS */}
        {syncFeedback && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* ESTADO 1: DESCONECTADO (Fluxo de Login Google) */}
        {!isConnected ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white/[0.03] border border-white/[0.08] rounded-xl space-y-2.5">
              <h4 className="font-semibold text-white">Como funciona a integração real:</h4>
              <ul className="space-y-2 text-zinc-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Ao clicar no botão abaixo, você será direcionado para o login seguro do Google (OAuth 2.0).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Suas diárias do CineMaker Pro são inseridas automaticamente na sua Google Agenda primária.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Avisos de trânsito e lembrete de call-time de 2 horas enviados para o seu smartphone.
                  </span>
                </li>
              </ul>
            </div>

            {/* BOTÃO OFICIAL GOOGLE OAUTH */}
            <button
              type="button"
              onClick={handleConnectGoogle}
              className="w-full py-3 bg-white text-zinc-950 hover:bg-zinc-100 font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-[0.99]"
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
              <span>Fazer Login com Google Agenda</span>
            </button>

            {/* GUIA DE CONFIGURAÇÃO DO GOOGLE CLOUD (EXPANSÍVEL) */}
            <div className="pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowConfigGuide(!showConfigGuide)}
                className="w-full flex items-center justify-between text-zinc-400 hover:text-zinc-200 text-xs py-1 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span>Instruções do Google Cloud Console (Vercel)</span>
                </span>
                {showConfigGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showConfigGuide && (
                <div className="mt-2.5 p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5 text-[11px] text-zinc-400 font-mono">
                  <p className="text-white font-semibold">Configuração das chaves na Vercel:</p>
                  <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                    <li>
                      Acesse{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 underline inline-flex items-center gap-1"
                      >
                        Google Cloud Console <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </li>
                    <li>Crie um <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                    <li>Em <strong>Authorized redirect URIs</strong>, cole este endereço exato:</li>
                  </ol>

                  <div className="flex items-center justify-between p-2 bg-black/80 rounded-lg border border-white/10 text-[10px] text-emerald-400">
                    <span className="truncate">{redirectUri || 'https://cinemakerpro.vercel.app/api/auth/google/callback'}</span>
                    <button
                      type="button"
                      onClick={handleCopyRedirectUri}
                      className="ml-2 px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded flex items-center gap-1 shrink-0"
                    >
                      {copiedUri ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUri ? 'Copiado!' : 'Copiar URI'}</span>
                    </button>
                  </div>

                  <p className="text-zinc-500 text-[10px]">
                    Cole o <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> nas variáveis da Vercel.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ESTADO 2: CONECTADO (Gerenciamento & Eventos Reais) */
          <div className="space-y-4 text-xs">
            {/* Conta Google Conectada */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <span className="font-semibold text-white block">Conta Google Conectada</span>
                  <span className="text-[11px] text-zinc-400 font-mono">{googleEmail || user?.email}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDisconnect}
                className="text-[11px] font-medium text-rose-400 hover:text-rose-300 underline"
              >
                Desconectar
              </button>
            </div>

            {/* Ações de Sincronia */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSyncAllShoots}
                disabled={isSyncingShoots}
                className="flex-1 py-2.5 px-4 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingShoots ? 'animate-spin' : ''}`} />
                <span>{isSyncingShoots ? 'Enviando para Google Agenda...' : 'Sincronizar Todas as Diárias'}</span>
              </button>

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-4 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Abrir Google Agenda Web</span>
              </a>
            </div>

            {/* Lista de Próximos Eventos Reais da Google Agenda */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase font-semibold text-zinc-400 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Próximos Compromissos na Google Agenda</span>
                </span>

                <button
                  type="button"
                  onClick={loadRealEvents}
                  disabled={isLoadingEvents}
                  className="text-[10px] text-zinc-400 hover:text-white font-mono flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  <span>Atualizar</span>
                </button>
              </div>

              {isLoadingEvents ? (
                <div className="p-6 text-center text-zinc-500 font-mono text-xs flex flex-col items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-500 border-t-white animate-spin" />
                  <span>Buscando eventos da Google Agenda...</span>
                </div>
              ) : realEvents.length === 0 ? (
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-center text-zinc-400 text-xs">
                  Nenhum evento agendado nos próximos dias na sua agenda Google. Suas diárias sincronizadas aparecerão aqui.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {realEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 bg-black/40 border border-white/[0.07] rounded-xl flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-white block truncate">{evt.summary}</span>
                        <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-mono mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {new Date(evt.start).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{evt.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {evt.htmlLink && (
                        <a
                          href={evt.htmlLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                          title="Ver na Google Agenda"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
