'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/local-store';
import { UserProfile, UserStatus, SubscriptionTier } from '@/types/database';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Search,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Lock,
  UserCheck,
  CreditCard,
  Sliders,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, usersDirectory, updateUserAccess } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Redireciona se não for o administrador
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
        <Lock className="w-10 h-10 text-rose-500 mb-3" />
        <h2 className="text-base font-bold text-white">Acesso Restrito ao Administrador Geral</h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Apenas a conta oficial <strong>rangelmaker@gmail.com</strong> possui permissão para
          gerenciar acessos e pagamentos da plataforma.
        </p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-white text-zinc-950 text-xs font-semibold rounded-lg"
        >
          Voltar para a Visão Geral
        </button>
      </div>
    );
  }

  // Filtragem dos usuários
  const filteredUsers = usersDirectory.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && u.status === filterStatus;
  });

  // Estatísticas
  const totalCount = usersDirectory.length;
  const activeCount = usersDirectory.filter((u) => (u.status || 'active') === 'active').length;
  const pausedCount = usersDirectory.filter((u) => u.status === 'paused').length;
  const blockedCount = usersDirectory.filter((u) => u.status === 'blocked').length;

  const handleAction = async (
    targetUser: UserProfile,
    newStatus: UserStatus,
    isPaid: boolean
  ) => {
    await updateUserAccess(targetUser.id, { status: newStatus, is_paid: isPaid });
    setFeedbackMsg(`Status de ${targetUser.name} atualizado para ${newStatus.toUpperCase()}.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleTierChange = async (targetUser: UserProfile, newTier: SubscriptionTier) => {
    await updateUserAccess(targetUser.id, { subscription_tier: newTier });
    setFeedbackMsg(`Plano de ${targetUser.name} atualizado para ${newTier.toUpperCase()}.`);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Painel de Acessos & Licenciamento
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full">
              ADMIN GERAL
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Controle mestre de assinaturas, liberação e bloqueio de inadimplentes.
          </p>
        </div>
      </div>

      {/* BANNER DE PRIVACIDADE ESTRITA */}
      <div className="p-4 bg-zinc-900/60 border border-white/[0.08] rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <EyeOff className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="text-xs space-y-1">
          <span className="font-semibold text-zinc-200">
            Política de Privacidade Estrita Ativa
          </span>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            Conforme as regras do sistema, você tem total controle sobre o status do acesso
            (liberar, pausar ou bloquear), mas os dados particulares dos videomakers (seus
            clientes, propostas de orçamento e diárias de filmagem) permanecem 100% confidenciais e
            inacessíveis, garantindo a ética e a confiança de cada produtor.
          </p>
        </div>
      </div>

      {/* Notificação Temporária de Feedback */}
      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-[#111318] border border-white/[0.08] rounded-2xl">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Total de Usuários</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">{totalCount}</div>
          <span className="text-[10px] text-zinc-500 font-mono">Contas cadastradas</span>
        </div>

        <div className="p-4 bg-[#111318] border border-emerald-500/20 rounded-2xl">
          <div className="flex items-center justify-between text-emerald-400 text-xs">
            <span>Acessos Liberados</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-2 font-mono">{activeCount}</div>
          <span className="text-[10px] text-emerald-500/80 font-mono">Em dia com pagamento</span>
        </div>

        <div className="p-4 bg-[#111318] border border-amber-500/20 rounded-2xl">
          <div className="flex items-center justify-between text-amber-400 text-xs">
            <span>Acessos Pausados</span>
            <PauseCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-2 font-mono">{pausedCount}</div>
          <span className="text-[10px] text-amber-500/80 font-mono">Inadimplentes / Mensalidade pendente</span>
        </div>

        <div className="p-4 bg-[#111318] border border-rose-500/20 rounded-2xl">
          <div className="flex items-center justify-between text-rose-400 text-xs">
            <span>Bloqueados</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-2 font-mono">{blockedCount}</div>
          <span className="text-[10px] text-rose-500/80 font-mono">Acesso revogado</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 bg-[#111318] border border-white/[0.08] rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/[0.06] rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none focus:border-white/20"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'active', label: 'Liberados' },
            { id: 'paused', label: 'Pausados' },
            { id: 'blocked', label: 'Bloqueados' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0',
                filterStatus === tab.id
                  ? 'bg-white text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-[#111318] border border-white/[0.08] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/40 border-b border-white/[0.06] font-mono text-[10px] text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 sm:px-4">Videomaker</th>
                <th className="p-3.5 sm:px-4">Plano</th>
                <th className="p-3.5 sm:px-4">Status Acesso</th>
                <th className="p-3.5 sm:px-4">Pagamento</th>
                <th className="p-3.5 sm:px-4 text-right">Ações de Liberação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-zinc-500 font-mono text-xs">
                    Nenhum usuário encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOwner = u.email === 'rangelmaker@gmail.com';
                  const currentStatus = u.status || 'active';

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Coluna 1: Usuário */}
                      <td className="p-3.5 sm:px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center font-semibold text-zinc-300 shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white truncate">{u.name}</span>
                              {isOwner && (
                                <span className="bg-white/10 text-white text-[9px] font-mono px-1.5 py-0.2 rounded">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-zinc-400 font-mono block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Coluna 2: Plano */}
                      <td className="p-3.5 sm:px-4">
                        {isOwner ? (
                          <span className="font-mono text-[11px] text-zinc-300 uppercase">
                            Studio (Mestre)
                          </span>
                        ) : (
                          <select
                            value={u.subscription_tier || 'pro'}
                            onChange={(e) =>
                              handleTierChange(u, e.target.value as SubscriptionTier)
                            }
                            className="bg-black/40 border border-white/[0.08] text-[11px] font-mono text-zinc-200 rounded-lg px-2 py-1 outline-none"
                          >
                            <option value="free">Free</option>
                            <option value="pro">Pro (R$ 49,90)</option>
                            <option value="studio">Studio (R$ 99,90)</option>
                          </select>
                        )}
                      </td>

                      {/* Coluna 3: Status */}
                      <td className="p-3.5 sm:px-4">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border',
                            currentStatus === 'active' &&
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                            currentStatus === 'paused' &&
                              'bg-amber-500/10 text-amber-400 border-amber-500/25',
                            currentStatus === 'blocked' &&
                              'bg-rose-500/10 text-rose-400 border-rose-500/25'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full',
                              currentStatus === 'active' && 'bg-emerald-400',
                              currentStatus === 'paused' && 'bg-amber-400',
                              currentStatus === 'blocked' && 'bg-rose-400'
                            )}
                          />
                          {currentStatus === 'active' && 'Liberado'}
                          {currentStatus === 'paused' && 'Pausado'}
                          {currentStatus === 'blocked' && 'Bloqueado'}
                        </span>
                      </td>

                      {/* Coluna 4: Pagamento */}
                      <td className="p-3.5 sm:px-4 font-mono text-[11px]">
                        {u.is_paid ? (
                          <span className="text-emerald-400">Em dia</span>
                        ) : (
                          <span className="text-amber-400">Inadimplente</span>
                        )}
                      </td>

                      {/* Coluna 5: Ações Rápidas */}
                      <td className="p-3.5 sm:px-4 text-right">
                        {isOwner ? (
                          <span className="text-[10px] font-mono text-zinc-500">Inalterável</span>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {currentStatus !== 'active' && (
                              <button
                                type="button"
                                onClick={() => handleAction(u, 'active', true)}
                                title="Liberar Acesso do Usuário"
                                className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-medium transition-colors"
                              >
                                Liberar
                              </button>
                            )}

                            {currentStatus !== 'paused' && (
                              <button
                                type="button"
                                onClick={() => handleAction(u, 'paused', false)}
                                title="Pausar por Falta de Pagamento"
                                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-medium transition-colors"
                              >
                                Pausar
                              </button>
                            )}

                            {currentStatus !== 'blocked' && (
                              <button
                                type="button"
                                onClick={() => handleAction(u, 'blocked', false)}
                                title="Bloquear Conta"
                                className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-medium transition-colors"
                              >
                                Bloquear
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
