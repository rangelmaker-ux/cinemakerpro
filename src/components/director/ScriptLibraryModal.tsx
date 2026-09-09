'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderPlus,
  FolderOpen,
  Search,
  Copy,
  MoreVertical,
  AlertTriangle,
  Building2,
  Film,
  FileText,
  RotateCcw,
  Bookmark,
} from 'lucide-react';
import { Client, ScriptFolder, SavedScript, ScriptProject } from '@/types/database';
import { cn } from '@/lib/utils';

interface ScriptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Roteiros Salvos & Pastas Permanentes
  savedScripts: SavedScript[];
  scriptFolders: ScriptFolder[];
  clients: Client[];
  activeClientId?: string;
  onSelectSavedScript: (script: SavedScript) => void;
  onRenameSavedScript: (id: string, newTitle: string) => void;
  onDuplicateSavedScript: (id: string) => void;
  onDeleteSavedScript: (id: string) => void;
  onCreateFolder: (name: string, clientId: string) => ScriptFolder;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string, deleteScriptsInside: boolean) => void;
  // Conversas Temporárias (Working Sessions)
  scriptProjects: ScriptProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  onRenameProject: (id: string, newTitle: string) => void;
  onDeleteProject: (id: string) => void;
  onClearConversation?: () => void;
}

export function ScriptLibraryModal({
  isOpen,
  onClose,
  savedScripts = [],
  scriptFolders = [],
  clients = [],
  activeClientId,
  onSelectSavedScript,
  onRenameSavedScript,
  onDuplicateSavedScript,
  onDeleteSavedScript,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  scriptProjects = [],
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onRenameProject,
  onDeleteProject,
  onClearConversation,
}: ScriptLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'saved' | 'temp'>('saved');
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<string>(activeClientId || 'all');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Estados para renomeação inline
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [editingScriptTitle, setEditingScriptTitle] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Estados para nova pasta
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Modais de confirmação de exclusão
  const [scriptToDelete, setScriptToDelete] = useState<SavedScript | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<ScriptFolder | null>(null);
  const [tempProjectToDelete, setTempProjectToDelete] = useState<ScriptProject | null>(null);

  // Menu suspenso de ações
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleFolderCollapse = (folderId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Filtragem dos roteiros salvos por cliente e busca
  const filteredSavedScripts = useMemo(() => {
    return savedScripts.filter((s) => {
      const matchesClient = clientFilter === 'all' || s.client_id === clientFilter;
      const term = search.toLowerCase().trim();
      const matchesSearch =
        !term ||
        s.title.toLowerCase().includes(term) ||
        (s.script?.hook && s.script.hook.toLowerCase().includes(term));
      return matchesClient && matchesSearch;
    });
  }, [savedScripts, clientFilter, search]);

  // Pastas filtradas por cliente
  const filteredFolders = useMemo(() => {
    return scriptFolders.filter((f) => clientFilter === 'all' || f.client_id === clientFilter);
  }, [scriptFolders, clientFilter]);

  const handleCreateNewFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const targetClient = clientFilter !== 'all' ? clientFilter : clients[0]?.id || 'default';
    onCreateFolder(newFolderName.trim(), targetClient);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Recentemente';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recentemente';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={() => setOpenMenuId(null)}
    >
      <div
        className="w-full max-w-3xl bg-[#0f1115] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-zinc-200 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Biblioteca de Roteiros</span>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {savedScripts.length} Salvos
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Ativos permanentes organizados em pastas por cliente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onCreateNewProject();
                onClose();
              }}
              className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Ideia</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Navegação de Abas e Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={cn(
                'py-1.5 px-3.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
                activeTab === 'saved'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>Roteiros Salvos & Pastas ({savedScripts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('temp')}
              className={cn(
                'py-1.5 px-3.5 rounded-lg font-semibold transition-all flex items-center gap-1.5',
                activeTab === 'temp'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Conversas Temporárias ({scriptProjects.length})</span>
            </button>
          </div>

          {activeTab === 'saved' && (
            <div className="flex items-center gap-2">
              {/* Filtro de Cliente */}
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-black/50 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Todos os Clientes</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#111318]">
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Botão Nova Pasta */}
              <button
                type="button"
                onClick={() => setIsCreatingFolder(true)}
                className="py-1.5 px-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 rounded-xl text-xs flex items-center gap-1 transition-colors"
                title="Criar nova pasta para organizar roteiros"
              >
                <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Nova Pasta</span>
              </button>
            </div>
          )}
        </div>

        {/* Barra de Busca */}
        {activeTab === 'saved' && (
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar roteiro salvo por título ou trecho da fala..."
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        )}

        {/* Modal Inline: Criar Nova Pasta */}
        {isCreatingFolder && (
          <form
            onSubmit={handleCreateNewFolderSubmit}
            className="p-3 bg-purple-500/[0.08] border border-purple-500/30 rounded-xl flex items-center gap-2 animate-fade-in shrink-0"
          >
            <FolderPlus className="w-4 h-4 text-purple-400 shrink-0" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nome da pasta (Ex: Campanha Setembro, Reels, Institucional)..."
              autoFocus
              className="flex-1 bg-black/60 border border-purple-500/50 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="py-1.5 px-2 text-zinc-400 hover:text-white text-xs"
            >
              Cancelar
            </button>
          </form>
        )}

        {/* CONTEÚDO PRINCIPAL: ABA DE ROTEIROS SALVOS */}
        {activeTab === 'saved' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {savedScripts.length === 0 ? (
              <div className="py-14 px-4 text-center space-y-3 bg-black/30 border border-white/[0.06] rounded-2xl">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mx-auto">
                  <Bookmark className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-sm mx-auto">
                  <h3 className="text-sm font-bold text-white">
                    Nenhum roteiro salvo na biblioteca ainda
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Quando você gerar um roteiro na conversa com a IA, clique em &quot;Salvar Roteiro&quot; para guardá-lo permanentemente em uma pasta do cliente.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pastas e seus Roteiros */}
                {filteredFolders.map((folder) => {
                  const scriptsInFolder = filteredSavedScripts.filter(
                    (s) => s.folder_id === folder.id
                  );
                  const isCollapsed = collapsedFolders[folder.id];
                  const folderClient = clients.find((c) => c.id === folder.client_id);
                  const isEditingFolder = editingFolderId === folder.id;

                  return (
                    <div
                      key={folder.id}
                      className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-3"
                    >
                      {/* Cabeçalho da Pasta */}
                      <div className="flex items-center justify-between">
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none"
                          onClick={() => toggleFolderCollapse(folder.id)}
                        >
                          <button type="button" className="text-zinc-400 hover:text-white">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Folder className="w-3.5 h-3.5" />
                          </div>

                          {isEditingFolder ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (editingFolderName.trim()) {
                                  onRenameFolder(folder.id, editingFolderName.trim());
                                }
                                setEditingFolderId(null);
                              }}
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                autoFocus
                                className="bg-black/60 border border-purple-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                              />
                              <button
                                type="submit"
                                className="px-2 py-0.5 bg-emerald-500 text-zinc-950 font-bold rounded text-xs"
                              >
                                OK
                              </button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                                {folder.name}
                              </h3>
                              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.2 rounded-full">
                                {scriptsInFolder.length} {scriptsInFolder.length === 1 ? 'roteiro' : 'roteiros'}
                              </span>
                              {folderClient && (
                                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.2 rounded-full">
                                  {folderClient.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Menu da Pasta */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolderId(folder.id);
                              setEditingFolderName(folder.name);
                            }}
                            title="Renomear pasta"
                            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFolderToDelete(folder);
                            }}
                            title="Excluir pasta"
                            className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Lista de Roteiros dentro da Pasta */}
                      {!isCollapsed && (
                        <div className="pl-6 space-y-2">
                          {scriptsInFolder.length === 0 ? (
                            <p className="text-[11px] text-zinc-500 italic py-2">
                              Esta pasta está vazia. Salve roteiros aqui na tela de criação.
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {scriptsInFolder.map((saved) => (
                                <SavedScriptCard
                                  key={saved.id}
                                  script={saved}
                                  isEditing={editingScriptId === saved.id}
                                  editingTitle={editingScriptTitle}
                                  onStartRename={() => {
                                    setEditingScriptId(saved.id);
                                    setEditingScriptTitle(saved.title);
                                  }}
                                  onSaveRename={(newTitle) => {
                                    onRenameSavedScript(saved.id, newTitle);
                                    setEditingScriptId(null);
                                  }}
                                  onCancelRename={() => setEditingScriptId(null)}
                                  onOpen={() => {
                                    onSelectSavedScript(saved);
                                    onClose();
                                  }}
                                  onDuplicate={() => onDuplicateSavedScript(saved.id)}
                                  onDelete={() => setScriptToDelete(saved)}
                                  formatTime={formatRelativeTime}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Roteiros sem pasta (Geral do Cliente) */}
                {(() => {
                  const unassignedScripts = filteredSavedScripts.filter(
                    (s) => !s.folder_id || !scriptFolders.some((f) => f.id === s.folder_id)
                  );
                  if (unassignedScripts.length === 0) return null;

                  return (
                    <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-500/15 border border-zinc-500/30 flex items-center justify-center text-zinc-400">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          Geral (Sem Pasta)
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.2 rounded-full">
                          {unassignedScripts.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {unassignedScripts.map((saved) => (
                          <SavedScriptCard
                            key={saved.id}
                            script={saved}
                            isEditing={editingScriptId === saved.id}
                            editingTitle={editingScriptTitle}
                            onStartRename={() => {
                              setEditingScriptId(saved.id);
                              setEditingScriptTitle(saved.title);
                            }}
                            onSaveRename={(newTitle) => {
                              onRenameSavedScript(saved.id, newTitle);
                              setEditingScriptId(null);
                            }}
                            onCancelRename={() => setEditingScriptId(null)}
                            onOpen={() => {
                              onSelectSavedScript(saved);
                              onClose();
                            }}
                            onDuplicate={() => onDuplicateSavedScript(saved.id)}
                            onDelete={() => setScriptToDelete(saved)}
                            formatTime={formatRelativeTime}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* CONTEÚDO DA ABA: CONVERSAS TEMPORÁRIAS */}
        {activeTab === 'temp' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Espaço de Trabalho Temporário</p>
                <p className="text-[11px] text-zinc-300">
                  As conversas abaixo contêm rascunhos e mensagens de alinhamento com a IA. Limpar uma conversa **nunca** apaga os roteiros que você salvou na aba &quot;Roteiros Salvos&quot;.
                </p>
              </div>
            </div>

            {scriptProjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Nenhuma conversa temporária aberta.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scriptProjects.map((project) => {
                  const isActive = project.id === activeProjectId;
                  return (
                    <div
                      key={project.id}
                      onClick={() => {
                        onSelectProject(project.id);
                        onClose();
                      }}
                      className={cn(
                        'p-4 rounded-xl border text-left flex flex-col justify-between gap-3 cursor-pointer transition-all',
                        isActive
                          ? 'bg-purple-500/[0.08] border-purple-500/40 shadow-lg'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono text-zinc-400">
                            {formatRelativeTime(project.updated_at)}
                          </span>
                          {isActive && (
                            <span className="text-[9px] font-mono text-purple-300 font-bold bg-purple-500/20 px-1.5 py-0.2 rounded-full">
                              CONVERSA ATIVA
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                          {project.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                          {project.script?.hook || project.brief?.topic || 'Sessão temporária de alinhamento.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>{project.conversation?.length || 0} mensagens</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempProjectToDelete(project);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Excluir esta conversa temporária"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO: EXCLUIR ROTEIRO SALVO */}
        {scriptToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-[#111318] border border-red-500/30 rounded-2xl p-5 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Excluir este roteiro salvo?</h3>
                <p className="text-xs text-zinc-400">
                  Você está prestes a excluir <span className="text-white font-semibold">&quot;{scriptToDelete.title}&quot;</span>. Essa ação é permanente e não poderá ser desfeita.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScriptToDelete(null)}
                  className="py-2 px-3 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteSavedScript(scriptToDelete.id);
                    setScriptToDelete(null);
                  }}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Excluir Roteiro
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO: EXCLUIR PASTA */}
        {folderToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-[#111318] border border-red-500/30 rounded-2xl p-5 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                <Folder className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Excluir pasta &quot;{folderToDelete.name}&quot;?</h3>
                <p className="text-xs text-zinc-400">
                  Esta pasta pode conter roteiros salvos. O que você deseja fazer com o conteúdo dela?
                </p>
              </div>
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteFolder(folderToDelete.id, false);
                    setFolderToDelete(null);
                  }}
                  className="w-full py-2 px-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/15 text-white text-xs font-semibold rounded-xl"
                >
                  Excluir apenas a pasta (manter os roteiros na biblioteca)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteFolder(folderToDelete.id, true);
                    setFolderToDelete(null);
                  }}
                  className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
                >
                  Excluir a pasta e TODOS os roteiros dentro dela
                </button>
                <button
                  type="button"
                  onClick={() => setFolderToDelete(null)}
                  className="w-full py-1.5 text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE CONFIRMAÇÃO: EXCLUIR CONVERSA TEMPORÁRIA */}
        {tempProjectToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-[#111318] border border-white/15 rounded-2xl p-5 space-y-4 shadow-2xl text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Excluir conversa temporária?</h3>
                <p className="text-xs text-zinc-400">
                  Isso removerá as mensagens e rascunhos desta sessão. Seus roteiros salvos não serão afetados.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTempProjectToDelete(null)}
                  className="py-2 px-3 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/[0.06]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteProject(tempProjectToDelete.id);
                    setTempProjectToDelete(null);
                  }}
                  className="py-2 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SUBCOMPONENTE: CARD INDIVIDUAL DO ROTEIRO SALVO COM MENU DE 3 PONTOS
 */
interface SavedScriptCardProps {
  script: SavedScript;
  isEditing: boolean;
  editingTitle: string;
  onStartRename: () => void;
  onSaveRename: (newTitle: string) => void;
  onCancelRename: () => void;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  formatTime: (time?: string) => string;
}

function SavedScriptCard({
  script,
  isEditing,
  editingTitle,
  onStartRename,
  onSaveRename,
  onCancelRename,
  onOpen,
  onDuplicate,
  onDelete,
  formatTime,
}: SavedScriptCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [localTitle, setLocalTitle] = useState(script.title);

  return (
    <div
      onClick={onOpen}
      className="p-3.5 rounded-xl border border-white/10 hover:border-purple-500/40 bg-black/40 hover:bg-white/[0.02] text-left flex flex-col justify-between gap-2.5 group relative cursor-pointer transition-all shadow-sm"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Salvo
            </span>
            {(script.versions?.length || 1) > 1 && (
              <span className="bg-purple-500/15 text-purple-300 text-[9px] font-mono px-1.5 py-0.2 rounded">
                V{script.versions?.length}
              </span>
            )}
          </div>

          {/* Botão de Menu em 3 Pontos */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-6 z-20 w-36 bg-[#181a20] border border-white/15 rounded-xl p-1 shadow-2xl text-xs space-y-0.5 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onOpen();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-zinc-200 hover:text-white flex items-center gap-2"
                >
                  <FileText className="w-3 h-3 text-purple-400" />
                  <span>Abrir / Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onStartRename();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-zinc-200 hover:text-white flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3 text-zinc-400" />
                  <span>Renomear</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-zinc-200 hover:text-white flex items-center gap-2"
                >
                  <Copy className="w-3 h-3 text-blue-400" />
                  <span>Duplicar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-300 hover:text-red-200 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                  <span>Excluir</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Título com suporte a renomeação inline */}
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (localTitle.trim()) {
                onSaveRename(localTitle.trim());
              }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 pt-1"
          >
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              autoFocus
              className="flex-1 bg-black/70 border border-purple-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-emerald-500 text-zinc-950 font-bold rounded text-xs"
            >
              OK
            </button>
            <button
              type="button"
              onClick={onCancelRename}
              className="px-1 text-zinc-400 text-xs"
            >
              ✕
            </button>
          </form>
        ) : (
          <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight line-clamp-1 group-hover:text-purple-300 transition-colors">
            {script.title}
          </h4>
        )}

        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed italic">
          {script.script?.hook || 'Sem gancho definido.'}
        </p>
      </div>

      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <span>{script.script?.scenes?.length || 0} cenas</span>
        <span>Atualizado {formatTime(script.updated_at)}</span>
      </div>
    </div>
  );
}
