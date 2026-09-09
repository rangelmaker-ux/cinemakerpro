'use client';

import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  FolderPlus,
  Folder,
  X,
  Check,
  Building2,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Client, ScriptFolder, SavedScript } from '@/types/database';
import { ScriptCreatorOutput } from '@/lib/ai/team-types';
import { cn } from '@/lib/utils';

interface SaveScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScript: ScriptCreatorOutput;
  currentBrief?: any;
  initialTitle?: string;
  defaultClientId?: string;
  clients: Client[];
  scriptFolders: ScriptFolder[];
  onCreateFolder: (name: string, clientId: string) => ScriptFolder;
  onSaveScript: (data: {
    clientId: string;
    folderId?: string;
    title: string;
    script: any;
    brief?: any;
  }) => SavedScript;
  onSavedSuccess?: (saved: SavedScript) => void;
}

export function SaveScriptModal({
  isOpen,
  onClose,
  currentScript,
  currentBrief,
  initialTitle = 'Novo Roteiro',
  defaultClientId,
  clients,
  scriptFolders,
  onCreateFolder,
  onSaveScript,
  onSavedSuccess,
}: SaveScriptModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    defaultClientId || clients[0]?.id || ''
  );
  const [title, setTitle] = useState(initialTitle);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('none');
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (defaultClientId) {
        setSelectedClientId(defaultClientId);
      } else if (clients[0]?.id) {
        setSelectedClientId(clients[0].id);
      }
      setTitle(initialTitle || 'Novo Roteiro');
      setSelectedFolderId('none');
      setIsCreatingNewFolder(false);
      setNewFolderName('');
      setError(null);
    }
  }, [isOpen, defaultClientId, initialTitle, clients]);

  if (!isOpen) return null;

  // Pastas filtradas pelo cliente selecionado
  const clientFolders = scriptFolders.filter(
    (f) => f.client_id === selectedClientId
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Informe um título para o roteiro.');
      return;
    }

    if (!selectedClientId) {
      setError('Selecione o cliente ao qual este roteiro pertence.');
      return;
    }

    let finalFolderId: string | undefined = undefined;

    if (isCreatingNewFolder) {
      if (!newFolderName.trim()) {
        setError('Informe o nome da nova pasta.');
        return;
      }
      const createdFolder = onCreateFolder(newFolderName.trim(), selectedClientId);
      finalFolderId = createdFolder.id;
    } else if (selectedFolderId && selectedFolderId !== 'none') {
      finalFolderId = selectedFolderId;
    }

    const saved = onSaveScript({
      clientId: selectedClientId,
      folderId: finalFolderId,
      title: title.trim(),
      script: currentScript,
      brief: currentBrief,
    });

    if (onSavedSuccess) {
      onSavedSuccess(saved);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0f1115] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 text-zinc-200 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Salvar Roteiro na Biblioteca
              </h3>
              <p className="text-xs text-zinc-400">
                Torne este roteiro um ativo permanente protegido por pasta.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Título do Roteiro */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-400" />
              <span>Nome do Roteiro:</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: 3 Cortes Masculinos em Alta"
              required
              className="w-full bg-black/50 border border-white/15 focus:border-purple-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
            />
          </div>

          {/* Cliente Associado */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Cliente / Projeto:</span>
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setSelectedFolderId('none');
                setIsCreatingNewFolder(false);
              }}
              className="w-full bg-black/50 border border-white/15 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111318] text-white">
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Seleção de Pasta */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-zinc-400" />
                <span>Salvar em qual pasta?</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewFolder(!isCreatingNewFolder);
                  if (!isCreatingNewFolder) {
                    setSelectedFolderId('none');
                  }
                }}
                className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <FolderPlus className="w-3 h-3" />
                <span>{isCreatingNewFolder ? 'Escolher pasta existente' : '+ Nova pasta'}</span>
              </button>
            </div>

            {isCreatingNewFolder ? (
              <div className="space-y-1.5 p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/25 animate-fade-in">
                <span className="text-[11px] font-mono text-purple-300 font-semibold block">
                  Criar Nova Pasta para este Cliente:
                </span>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ex: Campanha Setembro, Institucional, Reels..."
                  autoFocus
                  className="w-full bg-black/60 border border-purple-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 focus:border-purple-500/60 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-all"
                >
                  <option value="none" className="bg-[#111318] text-zinc-400">
                    Sem pasta (Geral do Cliente)
                  </option>
                  {clientFolders.map((f) => (
                    <option key={f.id} value={f.id} className="bg-[#111318] text-white">
                      📁 {f.name}
                    </option>
                  ))}
                </select>
                {clientFolders.length === 0 && (
                  <p className="text-[11px] text-zinc-500 italic">
                    Nenhuma pasta criada ainda para este cliente. Você pode criar uma clicando em &quot;+ Nova pasta&quot;.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Resumo visual do roteiro a ser salvo */}
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3 space-y-1.5 text-xs">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-semibold block">
              Prévia do Conteúdo:
            </span>
            <p className="text-zinc-300 line-clamp-2 italic leading-relaxed">
              {currentScript.hook}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[10px] font-mono text-zinc-500">
              <span>{currentScript.scenes.length} cenas</span>
              <span>•</span>
              <span className="text-purple-400">{currentScript.creative_angle || 'Metodologia CineMaker'}</span>
            </div>
          </div>

          {/* Rodapé e Botões */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="py-2 px-5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all active:scale-95"
            >
              <Bookmark className="w-4 h-4" />
              <span>Salvar Roteiro</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
