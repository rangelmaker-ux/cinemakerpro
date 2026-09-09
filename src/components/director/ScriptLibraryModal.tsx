'use client';

import React, { useState } from 'react';
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
  Calendar,
  Film,
} from 'lucide-react';
import { ScriptProject } from '@/types/database';
import { cn } from '@/lib/utils';

interface ScriptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scriptProjects: ScriptProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onCreateNewProject: () => void;
  onRenameProject: (id: string, newTitle: string) => void;
  onDeleteProject: (id: string) => void;
}

export function ScriptLibraryModal({
  isOpen,
  onClose,
  scriptProjects,
  activeProjectId,
  onSelectProject,
  onCreateNewProject,
  onRenameProject,
  onDeleteProject,
}: ScriptLibraryModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  if (!isOpen) return null;

  const handleStartRename = (project: ScriptProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(project.id);
    setEditingTitle(project.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameProject(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este projeto de roteiro?')) {
      onDeleteProject(id);
    }
  };

  const formatRelativeTime = (isoString: string) => {
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

  const getStatusBadge = (status: ScriptProject['status'], isApproved: boolean) => {
    if (isApproved || status === 'approved') {
      return (
        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
          <CheckCircle2 className="w-2.5 h-2.5" />
          Aprovado
        </span>
      );
    }
    if (status === 'editing') {
      return (
        <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
          <Edit2 className="w-2.5 h-2.5" />
          Roteiro em edição
        </span>
      );
    }
    if (status === 'script_generated') {
      return (
        <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" />
          Aguardando revisão
        </span>
      );
    }
    if (status === 'in_conversation') {
      return (
        <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          Em alinhamento
        </span>
      );
    }
    return (
      <span className="bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
        Rascunho
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0f1115] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 text-zinc-200 max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Meus Roteiros</span>
                <span className="bg-white/10 text-zinc-300 text-xs px-2 py-0.5 rounded-full font-mono font-normal">
                  {scriptProjects.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Biblioteca de projetos e ideias de roteiro isoladas.
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
              className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Roteiro</span>
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

        {/* Lista de Projetos ou Estado Vazio */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {scriptProjects.length === 0 ? (
            /* ESTADO VAZIO EXIGIDO NA SEÇÃO 13 DO MASTER PROMPT */
            <div className="py-12 px-4 text-center space-y-4 bg-black/30 border border-white/[0.06] rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500 mx-auto">
                <Film className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-white font-mono">
                  Você ainda não criou nenhum roteiro.
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Comece uma nova ideia e desenvolva o roteiro com a IA.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCreateNewProject();
                  onClose();
                }}
                className="py-2.5 px-5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Novo roteiro</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scriptProjects.map((project) => {
                const isActive = project.id === activeProjectId;
                const isEditing = editingId === project.id;
                const sceneCount = project.script?.scenes?.length || 0;
                const versionCount = (project.versions?.length || 0) + (project.script ? 1 : 0);

                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectProject(project.id);
                        onClose();
                      }
                    }}
                    className={cn(
                      'p-4 rounded-xl border transition-all text-left flex flex-col justify-between gap-3 group relative cursor-pointer',
                      isActive
                        ? 'bg-purple-500/[0.08] border-purple-500/40 shadow-lg shadow-purple-500/5'
                        : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                    )}
                  >
                    {/* Topo do Card: Título e Status */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {getStatusBadge(project.status, project.is_approved)}
                        {isActive && (
                          <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/20 px-2 py-0.5 rounded-full">
                            ATIVO AGORA
                          </span>
                        )}
                      </div>

                      {/* Título com suporte a renomear inline */}
                      {isEditing ? (
                        <form
                          onSubmit={(e) => handleSaveRename(project.id, e)}
                          className="flex items-center gap-1.5 pt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            autoFocus
                            className="flex-1 bg-black/60 border border-purple-500/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(project.id, e)}
                            className="py-1 px-2.5 bg-emerald-500 text-zinc-950 font-bold rounded-lg text-xs"
                          >
                            OK
                          </button>
                        </form>
                      ) : (
                        <h4 className="font-bold text-white text-xs sm:text-sm tracking-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                          {project.title}
                        </h4>
                      )}

                      {/* Tópico resumido ou gancho */}
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                        {project.script?.hook
                          ? project.script.hook
                          : project.brief?.topic
                          ? `Tema: ${project.brief.topic}`
                          : 'Ideia inicial em fase de alinhamento com a IA.'}
                      </p>
                    </div>

                    {/* Rodapé do Card: Metadados e Ações */}
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <div className="flex items-center gap-2">
                        <span>Atualizado {formatRelativeTime(project.updated_at)}</span>
                        {versionCount > 1 && (
                          <span className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                            {versionCount} versões
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(project, e)}
                          title="Renomear roteiro"
                          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(project.id, e)}
                          title="Excluir roteiro"
                          className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
