'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Bell,
  Check,
  Video,
  User,
  AlertCircle,
  Crosshair,
  X,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { GoogleCalendarSyncModal } from '@/components/calendar/GoogleCalendarSyncModal';
import { cn, formatDate } from '@/lib/utils';

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
  htmlLink?: string;
}

function AgendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shoots, clients, projects, kits, user, createShoot, setGoogleCalendarConnected } = useAppStore();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isNewShootModalOpen, setIsNewShootModalOpen] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleEvent[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Formulário de Nova Diária na Agenda
  const [newTitle, setNewTitle] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newCustomClient, setNewCustomClient] = useState('');
  const [newDate, setNewDate] = useState(selectedDate);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newDurationMin, setNewDurationMin] = useState(240); // 4 horas
  const [newLocation, setNewLocation] = useState('');
  const [newReminderMin, setNewReminderMin] = useState(120); // 2 horas antes
  const [syncWithGoogle, setSyncWithGoogle] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const googleConnectedParam = searchParams.get('google_connected');
  const googleEmailParam = searchParams.get('google_email');

  useEffect(() => {
    if (googleConnectedParam === 'true') {
      setGoogleCalendarConnected(true);
      if (googleEmailParam) setGoogleEmail(googleEmailParam);
      setStatusMessage('Conta Google conectada com sucesso! Seus eventos e gravações estão sincronizados.');
      fetchGoogleEvents();
    }
  }, [googleConnectedParam, googleEmailParam, setGoogleCalendarConnected]);

  // Carregar eventos da Google Agenda
  const fetchGoogleEvents = async () => {
    setIsLoadingGoogle(true);
    try {
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        if (data.connected && data.events) {
          setGoogleEvents(data.events);
          if (data.email) setGoogleEmail(data.email);
        }
      }
    } catch (e) {
      console.error('Falha ao buscar eventos Google:', e);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (user?.google_calendar_connected) {
      fetchGoogleEvents();
    }
  }, [user?.google_calendar_connected]);

  // Cálculos do Calendário Mensal
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  // Mapeia eventos e diárias por data 'YYYY-MM-DD'
  const shootsByDate = useMemo(() => {
    const map = new Map<string, typeof shoots>();
    for (const s of shoots) {
      if (!s.scheduled_at) continue;
      const d = s.scheduled_at.split('T')[0];
      const arr = map.get(d) || [];
      arr.push(s);
      map.set(d, arr);
    }
    return map;
  }, [shoots]);

  const googleEventsByDate = useMemo(() => {
    const map = new Map<string, GoogleEvent[]>();
    for (const g of googleEvents) {
      if (!g.start) continue;
      const d = g.start.split('T')[0];
      const arr = map.get(d) || [];
      arr.push(g);
      map.set(d, arr);
    }
    return map;
  }, [googleEvents]);

  // Submissão de Novo Agendamento
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSaving(true);
    try {
      const targetDate = newDate || selectedDate;
      const scheduledDateTime = `${targetDate}T${newStartTime}:00`;

      // 1. Salvar no workspace local do usuário
      const matchedProject = projects.find((p) => p.client_id === (newClientId || clients[0]?.id)) || projects[0];

      const created = createShoot({
        project_id: matchedProject?.id || 'proj-1',
        status: 'agendado',
        scheduled_at: scheduledDateTime,
        estimated_duration_min: newDurationMin,
        location_address: newLocation || 'Estúdio do Videomaker',
        kit_id: kits[0]?.id || '',
        checklist_state: [
          { id: 'c1', label: 'Baterias e iluminadores 100% carregados', done: false, category: 'energia' },
          { id: 'c2', label: 'Cartões SD formatados e conferidos', done: false, category: 'midia' },
          { id: 'c3', label: 'Equipamento conferido na mala', done: false, category: 'equipamento' },
          { id: 'c4', label: 'Chegada no local com antecedência', done: false, category: 'logistica' },
        ],
      });

      // 2. Se a Google Agenda estiver conectada e o checkbox marcado, criar evento real no Google Calendar
      if (syncWithGoogle && user?.google_calendar_connected) {
        try {
          await fetch('/api/calendar/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: newTitle,
              date: targetDate,
              startTime: newStartTime,
              durationMin: newDurationMin,
              location: newLocation,
              reminderMinutes: newReminderMin,
              description: `Diária CineMaker Pro\nCliente: ${newCustomClient || clients.find(c => c.id === newClientId)?.name || 'Cliente'}\nNotas: Checklist e equipamentos cadastrados no app.`,
            }),
          });
          fetchGoogleEvents();
        } catch (gErr) {
          console.error('Erro ao sincronizar com Google Calendar:', gErr);
        }
      }

      setStatusMessage(`Diária "${newTitle}" agendada com sucesso!`);
      setTimeout(() => setStatusMessage(null), 4000);
      setIsNewShootModalOpen(false);
      setNewTitle('');
      setNewLocation('');
    } catch (err: any) {
      alert('Erro ao salvar agendamento: ' + err?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const selectedDayShoots = shootsByDate.get(selectedDate) || [];
  const selectedDayGoogleEvents = googleEventsByDate.get(selectedDate) || [];

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* MENSAGEM DE SUCESSO / FEEDBACK */}
      {statusMessage && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-300 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-[10px] font-mono hover:text-white underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* HEADER PRINCIPAL COM BARRA DE CONTROLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111318] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            title="Voltar para a Visão Geral"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-amber-400" />
                <span>Agenda Visual & Google Calendar</span>
              </h2>
              <span className="text-[10px] font-mono bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                SINCRONIA TOTAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Gerencie suas diárias de gravação e sincronize automaticamente com a sua agenda do Google.
            </p>
          </div>
        </div>

        {/* STATUS DA CONEXÃO GOOGLE & BOTÕES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-2">
          {user?.google_calendar_connected ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-mono">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="truncate max-w-[150px]">{googleEmail || user.email}</span>
              </div>

              <button
                type="button"
                onClick={fetchGoogleEvents}
                disabled={isLoadingGoogle}
                className="p-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors"
                title="Atualizar eventos da Google Agenda"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
              </button>

              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-zinc-300 hover:text-white transition-colors"
                title="Abrir Google Agenda Web"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="py-2 px-3 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.98 0 12s.45 3.83 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Conectar Google Agenda</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setNewDate(selectedDate);
              setIsNewShootModalOpen(true);
            }}
            className="py-2 px-3.5 bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Diária na Agenda</span>
          </button>
        </div>
      </div>

      {/* GRID PRINCIPAL: CALENDÁRIO MENSAL + LINHA DO TEMPO DO DIA SELECIONADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUNA DO CALENDÁRIO MENSAL VISUAL (7 colunas) */}
        <div className="lg:col-span-7 bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Navegação do Mês */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {monthNames[month]} {year}
              </h3>
              <button
                type="button"
                onClick={goToToday}
                className="px-2 py-0.5 bg-white/[0.05] hover:bg-white/10 border border-white/10 text-[10px] font-mono text-zinc-300 rounded transition-colors"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 text-center font-mono text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Grid dos Dias do Mês */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Espaços vazios antes do dia 1 */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square opacity-0 pointer-events-none" />
            ))}

            {/* Dias do Mês */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

              const isSelected = selectedDate === dayStr;
              const isToday = new Date().toISOString().split('T')[0] === dayStr;

              const dayShoots = shootsByDate.get(dayStr) || [];
              const dayGoogle = googleEventsByDate.get(dayStr) || [];
              const totalEvents = dayShoots.length + dayGoogle.length;

              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => setSelectedDate(dayStr)}
                  className={cn(
                    'aspect-square p-1 sm:p-1.5 rounded-xl border flex flex-col justify-between items-center transition-all relative group',
                    isSelected
                      ? 'bg-white text-zinc-950 border-white shadow-lg font-bold scale-[1.03] z-10'
                      : isToday
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
                      : 'bg-black/30 border-white/[0.06] text-zinc-300 hover:border-white/20 hover:bg-white/[0.03]'
                  )}
                >
                  <span className="text-xs sm:text-sm">{dayNum}</span>

                  {/* Marcadores de Eventos do Dia */}
                  <div className="flex items-center gap-1 mt-0.5">
                    {dayShoots.length > 0 && (
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isSelected ? 'bg-amber-600' : 'bg-amber-400'
                        )}
                        title={`${dayShoots.length} Diária(s) CineMaker`}
                      />
                    )}
                    {dayGoogle.length > 0 && (
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          isSelected ? 'bg-blue-600' : 'bg-blue-400'
                        )}
                        title={`${dayGoogle.length} Compromisso(s) Google`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legenda de Cores */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Diária de Gravação CineMaker</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Google Agenda</span>
              </div>
            </div>
            <span>Clique em um dia para ver ou agendar</span>
          </div>
        </div>

        {/* COLUNA DA LINHA DO TEMPO DO DIA SELECIONADO (5 colunas) */}
        <div className="lg:col-span-5 bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block">
                COMPROMISSOS DO DIA
              </span>
              <h3 className="text-sm font-bold text-white capitalize">
                {new Date(`${selectedDate}T12:00:00`).toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                setNewDate(selectedDate);
                setIsNewShootModalOpen(true);
              }}
              className="px-2.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white rounded-lg text-xs flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar</span>
            </button>
          </div>

          {/* Lista de Diárias e Eventos do Dia Selecionado */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {selectedDayShoots.length === 0 && selectedDayGoogleEvents.length === 0 ? (
              <div className="text-center py-10 bg-black/20 border border-white/[0.05] rounded-xl p-5 space-y-2">
                <CalendarIcon className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">Nenhum compromisso agendado para este dia.</p>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(selectedDate);
                    setIsNewShootModalOpen(true);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Agendar gravação neste dia
                </button>
              </div>
            ) : (
              <>
                {/* Diárias CineMaker Pro */}
                {selectedDayShoots.map((shoot) => {
                  const project = projects.find((p) => p.id === shoot.project_id);
                  const client = clients.find((c) => c.id === project?.client_id);
                  const time = shoot.scheduled_at?.split('T')[1]?.substring(0, 5) || '09:00';

                  return (
                    <div
                      key={shoot.id}
                      className="p-3.5 bg-black/40 border border-amber-500/25 rounded-xl space-y-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold rounded">
                              CINEMAKER PRO
                            </span>
                            <span className="text-xs font-semibold text-white truncate">
                              {project?.title || client?.name || 'Diária de Gravação'}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">
                            Cliente: {client?.name || 'Cliente Cadastrado'}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-bold text-amber-400">
                          {time}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-zinc-300 font-mono">
                        {shoot.location_address && (
                          <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span className="truncate">{shoot.location_address}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                          <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span>Duração: {shoot.estimated_duration_min} min</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <Link
                          href="/diretor"
                          className="px-2.5 py-1 bg-white text-zinc-950 hover:bg-zinc-200 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>Diretor Técnico</span>
                        </Link>

                        {user?.google_calendar_connected && (
                          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Sincronizado no Google</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Eventos da Google Agenda */}
                {selectedDayGoogleEvents.map((evt) => {
                  const startTime = evt.start?.includes('T') ? evt.start.split('T')[1].substring(0, 5) : 'Dia todo';

                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 bg-black/40 border border-blue-500/25 rounded-xl space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[9px] font-bold rounded">
                              GOOGLE AGENDA
                            </span>
                            <span className="text-xs font-semibold text-white truncate">
                              {evt.summary}
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold text-blue-400">
                          {startTime}
                        </span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-mono">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          <span className="truncate">{evt.location}</span>
                        </div>
                      )}

                      {evt.htmlLink && (
                        <div className="pt-1">
                          <a
                            href={evt.htmlLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-mono text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1"
                          >
                            <span>Ver na Google Agenda</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: NOVO AGENDAMENTO NA AGENDA & GOOGLE CALENDAR */}
      {isNewShootModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
          <div className="bg-[#111318] border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 text-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nova Diária de Gravação</h3>
                  <p className="text-[11px] text-zinc-400">Agende na sua ferramenta e envie para o Google Calendar</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewShootModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 text-xs">
              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400">
                  Título do Projeto / Gravação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Vídeo Institucional Odontologia"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-white/30 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none"
                />
              </div>

              {/* Cliente */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400">Cliente *</label>
                {clients.length > 0 ? (
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-white/30 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="">Selecione um cliente cadastrado...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Nome do Cliente ou Empresa"
                    value={newCustomClient}
                    onChange={(e) => setNewCustomClient(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-white/30 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                )}
              </div>

              {/* Data e Horário */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-400">Data da Diária</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-zinc-400">Horário (Call Time)</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Localização */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400">
                  Local / Endereço da Locação
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ex: Av. Paulista, 1000 - Sala 42"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-black/50 border border-white/10 focus:border-white/30 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none"
                  />
                </div>
              </div>

              {/* Lembrete / Alerta Google Calendar */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Aviso Prévia no Smartphone (Google Agenda)</span>
                </label>
                <select
                  value={newReminderMin}
                  onChange={(e) => setNewReminderMin(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white outline-none"
                >
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                  <option value={120}>2 horas antes (Tempo de trânsito & deslocamento) — Recomendado</option>
                  <option value={1440}>1 dia antes (24 horas)</option>
                </select>
              </div>

              {/* Checkbox Sincronizar Google */}
              {user?.google_calendar_connected && (
                <label className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncWithGoogle}
                    onChange={(e) => setSyncWithGoogle(e.target.checked)}
                    className="w-4 h-4 accent-emerald-400 rounded"
                  />
                  <span className="text-xs text-emerald-300 font-medium">
                    Inserir automaticamente na minha Google Agenda real ({googleEmail || user.email})
                  </span>
                </label>
              )}

              {/* Botões */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewShootModalOpen(false)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-medium rounded-xl border border-white/10 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 font-bold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Salvar na Agenda</span>
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONEXÃO GOOGLE */}
      <GoogleCalendarSyncModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center font-mono text-xs text-zinc-500">
          Carregando agenda...
        </div>
      }
    >
      <AgendaContent />
    </Suspense>
  );
}
