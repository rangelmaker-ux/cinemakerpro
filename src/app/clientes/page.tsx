'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/local-store';
import { ClientCard } from '@/components/crm/ClientCard';
import { Users, Plus, Search, Filter, X } from 'lucide-react';
import { ClientStatus } from '@/types/database';
import { cn } from '@/lib/utils';

export default function ClientesPage() {
  const { clients, addClient } = useAppStore();
  const [activeTab, setActiveTab] = useState<ClientStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newNextAction, setNewNextAction] = useState('');

  const filteredClients = clients.filter((c) => {
    const matchesTab = activeTab === 'todos' || c.status === activeTab;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    addClient({
      name: newName.trim(),
      company: newCompany.trim() || undefined,
      phone: newPhone.trim() || undefined,
      notes: newNotes.trim() || undefined,
      next_action: newNextAction.trim() || 'Fazer primeiro contato',
      status: 'lead',
    });

    setNewName('');
    setNewCompany('');
    setNewPhone('');
    setNewNotes('');
    setNewNextAction('');
    setIsNewClientOpen(false);
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Header com título e botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-light" />
            <span>Clientes & Mini CRM</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Acompanhe do lead ao pós-venda sem burocracia
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewClientOpen(true)}
          className="py-2 px-3 bg-brand hover:bg-brand-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-brand/20 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Busca rápida */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar cliente, empresa ou projeto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand transition-colors"
        />
      </div>

      {/* Abas de Filtro de Status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
        {(
          [
            { id: 'todos', label: 'Todos' },
            { id: 'lead', label: 'Leads' },
            { id: 'orcamento', label: 'Orçamentos' },
            { id: 'fechado', label: 'Fechados' },
            { id: 'pos_venda', label: 'Pós-Venda' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-xl whitespace-nowrap transition-all active:scale-95',
              activeTab === tab.id
                ? 'bg-brand text-white shadow-sm'
                : 'bg-surface text-slate-400 hover:text-white border border-surface-border'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))
        ) : (
          <div className="text-center py-12 bg-surface border border-surface-border rounded-2xl p-6">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">Nenhum cliente encontrado</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Cadastre seu primeiro cliente para iniciar novas gravações.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Novo Cliente */}
      {isNewClientOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleCreateClient}
            className="w-full max-w-md bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="font-bold text-sm text-white">Cadastrar Novo Cliente</h3>
              <button
                type="button"
                onClick={() => setIsNewClientOpen(false)}
                className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Nome do Cliente / Responsável *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João da Silva"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Empresa ou Marca
              </label>
              <input
                type="text"
                placeholder="Ex: DF Móveis Planejados"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                WhatsApp / Telefone
              </label>
              <input
                type="text"
                placeholder="(61) 99999-9999"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Próxima Ação
              </label>
              <input
                type="text"
                placeholder="Ex: Enviar roteiro para aprovação"
                value={newNextAction}
                onChange={(e) => setNewNextAction(e.target.value)}
                className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Observações do Projeto
              </label>
              <textarea
                rows={2}
                placeholder="Detalhes sobre o formato do vídeo, local ou preferências..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-3 py-2 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewClientOpen(false)}
                className="flex-1 py-2.5 bg-surface-raised text-slate-300 font-bold text-xs rounded-xl border border-surface-border"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Salvar Cliente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
