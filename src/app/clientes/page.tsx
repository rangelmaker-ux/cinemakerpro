'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/local-store';
import { Client, ClientStatus } from '@/types/database';
import {
  Users,
  Plus,
  Search,
  Video,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  X,
  Check,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  MessageCircle,
  Folder,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

export default function ClientesPage() {
  const { clients, addClient, updateClient, deleteClient, scriptFolders = [], savedScripts = [] } = useAppStore();

  const [activeTab, setActiveTab] = useState<ClientStatus | 'todos'>('todos');
  const [search, setSearch] = useState('');

  // Modais e Gavetas
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);
  const [drawerClient, setDrawerClient] = useState<Client | null>(null);

  // Form states (Criação / Edição)
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formStatus, setFormStatus] = useState<ClientStatus>('lead');
  const [formNextAction, setFormNextAction] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const openCreateModal = () => {
    setFormName('');
    setFormCompany('');
    setFormPhone('');
    setFormEmail('');
    setFormStatus('lead');
    setFormNextAction('');
    setFormNotes('');
    setIsCreateOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCompany(client.company || '');
    setFormPhone(client.phone || '');
    setFormEmail(client.email || '');
    setFormStatus(client.status);
    setFormNextAction(client.next_action || '');
    setFormNotes(client.notes || '');
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    addClient({
      name: formName.trim(),
      company: formCompany.trim() || undefined,
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      status: formStatus,
      next_action: formNextAction.trim() || 'Fazer primeiro alinhamento',
      notes: formNotes.trim() || undefined,
    });

    setIsCreateOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !formName.trim()) return;

    updateClient(editingClient.id, {
      name: formName.trim(),
      company: formCompany.trim() || undefined,
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      status: formStatus,
      next_action: formNextAction.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });

    if (drawerClient?.id === editingClient.id) {
      setDrawerClient({
        ...drawerClient,
        name: formName.trim(),
        company: formCompany.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        status: formStatus,
        next_action: formNextAction.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    }

    setEditingClient(null);
  };

  const handleDeleteConfirm = () => {
    if (deletingClientId) {
      deleteClient(deletingClientId);
      if (drawerClient?.id === deletingClientId) {
        setDrawerClient(null);
      }
      setDeletingClientId(null);
    }
  };

  const filteredClients = clients.filter((c) => {
    const matchesTab = activeTab === 'todos' || c.status === activeTab;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: ClientStatus) => {
    switch (status) {
      case 'fechado':
        return { label: 'Fechado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'orcamento':
        return { label: 'Orçamento', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'pos_venda':
        return { label: 'Pós-Venda', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'lead':
      default:
        return { label: 'Lead', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Ação Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-light" />
            <span>Gestão de Clientes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mini CRM desenhado para a rotina de produção audiovisual
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="self-start sm:self-auto px-4 py-2.5 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Barra de Filtros & Pesquisa */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por nome, empresa ou observações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-surface-border rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-medium">
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
                'px-3.5 py-2 rounded-xl whitespace-nowrap transition-all text-xs active:scale-98',
                activeTab === tab.id
                  ? 'bg-brand text-white font-semibold shadow-sm'
                  : 'bg-surface text-slate-400 hover:text-white border border-surface-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Clientes com Design Refinado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const badge = getStatusBadge(client.status);

          return (
            <div
              key={client.id}
              className="bg-surface hover:bg-surface-raised border border-surface-border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-brand-light transition-colors">
                      {client.name}
                    </h3>
                    {client.company && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{client.company}</span>
                      </p>
                    )}
                  </div>

                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0',
                      badge.color
                    )}
                  >
                    {badge.label}
                  </span>
                </div>

                {client.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {client.notes}
                  </p>
                )}

                {/* Próxima ação gaveta */}
                {client.next_action && (
                  <div className="bg-background/80 border border-surface-border/60 rounded-xl p-2.5 flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-light shrink-0 mt-0.5" />
                    <div className="text-[11px] min-w-0">
                      <span className="text-slate-500 block font-semibold text-[9px] uppercase tracking-wider">
                        Próxima Ação
                      </span>
                      <span className="text-slate-200 font-medium truncate block">
                        {client.next_action}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de Ações Rápidas */}
              <div className="flex items-center justify-between pt-3 border-t border-surface-border gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDrawerClient(client)}
                    className="p-2 text-slate-400 hover:text-white bg-surface-raised rounded-lg border border-surface-border transition-colors"
                    title="Ver detalhes do cliente"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(client)}
                    className="p-2 text-slate-400 hover:text-white bg-surface-raised rounded-lg border border-surface-border transition-colors"
                    title="Editar cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingClientId(client.id)}
                    className="p-2 text-slate-400 hover:text-rose-400 bg-surface-raised rounded-lg border border-surface-border transition-colors"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Link
                  href={`/diretor?client_id=${client.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand hover:bg-brand-hover px-3 py-1.5 rounded-xl shadow-sm transition-all active:scale-98"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Gravar</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-16 bg-surface border border-surface-border rounded-3xl p-8 max-w-md mx-auto">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white mb-1">Nenhum cliente nesta lista</h3>
          <p className="text-xs text-slate-400 mb-4">
            Cadastre novos clientes para planejar suas gravações com a IA.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>
        </div>
      )}

      {/* GAVETA LATERAL DE DETALHES (Slide-over Drawer) */}
      {drawerClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-surface border-l border-surface-border h-full p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-brand-light tracking-wider">
                    Dossiê do Cliente
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {drawerClient.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerClient(null)}
                  className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {drawerClient.company && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Empresa
                    </span>
                    <p className="text-slate-200 font-medium">{drawerClient.company}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Status no Funil
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-2.5 py-0.5 rounded-full border inline-block',
                        getStatusBadge(drawerClient.status).color
                      )}
                    >
                      {getStatusBadge(drawerClient.status).label}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Cadastrado em
                    </span>
                    <span className="text-slate-300 font-medium">
                      {formatDate(drawerClient.created_at)}
                    </span>
                  </div>
                </div>

                {drawerClient.phone && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      WhatsApp / Contato
                    </span>
                    <a
                      href={`https://wa.me/55${drawerClient.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-brand-light hover:underline font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{drawerClient.phone}</span>
                    </a>
                  </div>
                )}

                {drawerClient.next_action && (
                  <div className="p-3 bg-surface-raised rounded-xl border border-surface-border">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Próxima Ação Agendada
                    </span>
                    <p className="text-slate-200 font-semibold">{drawerClient.next_action}</p>
                  </div>
                )}

                {drawerClient.notes && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Anotações do Projeto & Briefing
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-background/60 p-3 rounded-xl border border-surface-border">
                      {drawerClient.notes}
                    </p>
                  </div>
                )}

                {/* Pastas & Roteiros Salvos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Pastas & Roteiros Salvos
                    </span>
                    <Link
                      href={`/diretor?client_id=${drawerClient.id}`}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
                    >
                      <span>Novo Roteiro</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {(() => {
                    const clientFolders = scriptFolders.filter((f) => f.client_id === drawerClient.id);
                    const clientScripts = savedScripts.filter((s) => s.client_id === drawerClient.id);

                    if (clientFolders.length === 0 && clientScripts.length === 0) {
                      return (
                        <div className="p-3 bg-surface-raised/60 rounded-xl border border-surface-border text-center text-slate-400">
                          <p className="text-[11px]">Nenhum roteiro salvo ainda para este cliente.</p>
                          <Link
                            href={`/diretor?client_id=${drawerClient.id}`}
                            className="inline-flex items-center gap-1 text-xs text-amber-400 hover:underline mt-1 font-medium"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Criar primeiro roteiro com a IA</span>
                          </Link>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {/* Folders */}
                        {clientFolders.map((folder) => {
                          const folderScripts = clientScripts.filter((s) => s.folder_id === folder.id);
                          return (
                            <div key={folder.id} className="p-2.5 bg-surface-raised rounded-xl border border-surface-border">
                              <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1.5">
                                <div className="flex items-center gap-1.5 truncate">
                                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="truncate">{folder.name}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-normal shrink-0">
                                  {folderScripts.length} {folderScripts.length === 1 ? 'roteiro' : 'roteiros'}
                                </span>
                              </div>
                              {folderScripts.length > 0 ? (
                                <div className="space-y-1 pl-4 border-l border-surface-border mt-1">
                                  {folderScripts.map((s) => (
                                    <Link
                                      key={s.id}
                                      href={`/diretor?client_id=${drawerClient.id}&saved_script_id=${s.id}`}
                                      className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-800/80 text-[11px] text-slate-300 hover:text-white transition-colors"
                                    >
                                      <div className="flex items-center gap-1.5 truncate">
                                        <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate font-medium">{s.title}</span>
                                      </div>
                                      <span className="text-[9px] text-slate-500 font-mono shrink-0 ml-2">
                                        v{s.version || s.versions?.length || 1}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-500 italic pl-4">Pasta vazia</p>
                              )}
                            </div>
                          );
                        })}

                        {/* Unfiled scripts */}
                        {clientScripts
                          .filter((s) => !s.folder_id || !clientFolders.some((f) => f.id === s.folder_id))
                          .map((s) => (
                            <Link
                              key={s.id}
                              href={`/diretor?client_id=${drawerClient.id}&saved_script_id=${s.id}`}
                              className="flex items-center justify-between p-2.5 bg-surface-raised rounded-xl border border-surface-border hover:border-slate-600 transition-colors text-xs text-slate-200"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="truncate font-medium">{s.title}</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                                v{s.version || s.versions?.length || 1}
                              </span>
                            </Link>
                          ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-border flex gap-2">
              <button
                type="button"
                onClick={() => {
                  openEditModal(drawerClient);
                }}
                className="flex-1 py-2.5 bg-surface-raised hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-surface-border transition-colors"
              >
                Editar Informações
              </button>

              <Link
                href={`/diretor?client_id=${drawerClient.id}`}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Iniciar Gravação</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR CLIENTE */}
      {(isCreateOpen || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={editingClient ? handleSaveEdit : handleSaveCreate}
            className="w-full max-w-lg bg-surface border border-surface-border rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="font-bold text-sm text-white">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingClient(null);
                }}
                className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Nome do Cliente / Responsável *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roberto Alencar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Empresa / Marca
                </label>
                <input
                  type="text"
                  placeholder="Ex: DF Móveis Planejados"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  WhatsApp / Telefone
                </label>
                <input
                  type="text"
                  placeholder="(61) 99999-9999"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Status no Pipeline
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ClientStatus)}
                  className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
                >
                  <option value="lead">Lead (Primeiro Contato)</option>
                  <option value="orcamento">Orçamento Enviado</option>
                  <option value="fechado">Fechado / Em Gravação</option>
                  <option value="pos_venda">Pós-Venda / Follow-up</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Próxima Ação
              </label>
              <input
                type="text"
                placeholder="Ex: Gravação agendada para 14:00"
                value={formNextAction}
                onChange={(e) => setFormNextAction(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Anotações do Briefing
              </label>
              <textarea
                rows={3}
                placeholder="Objetivo do vídeo, formatos requeridos, ideias de roteiro..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-xs text-white focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingClient(null);
                }}
                className="flex-1 py-2.5 bg-surface-raised text-slate-300 font-semibold text-xs rounded-xl border border-surface-border hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand hover:bg-brand-hover text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                {editingClient ? 'Salvar Alterações' : 'Criar Cliente'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deletingClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface border border-surface-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-sm text-white">Excluir este cliente?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Todas as anotações e histórico associados serão removidos. Essa ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClientId(null)}
                className="flex-1 py-2.5 bg-surface-raised text-slate-300 font-semibold text-xs rounded-xl border border-surface-border"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
