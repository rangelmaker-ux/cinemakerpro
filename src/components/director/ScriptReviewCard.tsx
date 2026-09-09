'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Edit3,
  RefreshCw,
  Sparkles,
  Save,
  MessageSquare,
  Clock,
  Video,
  ChevronDown,
  ChevronUp,
  Bookmark,
} from 'lucide-react';
import { ScriptCreatorOutput, ScriptScene } from '@/lib/ai/team-types';
import { cn } from '@/lib/utils';

interface ScriptReviewCardProps {
  script: ScriptCreatorOutput;
  isApproved: boolean;
  onApprove: () => void;
  onRegenerate: () => void;
  onUpdateScript: (updatedScript: ScriptCreatorOutput) => void;
  onRequestAdjustment: (prompt: string) => void;
  onSaveToLibrary?: () => void;
  isSavedInLibrary?: boolean;
  versions?: { version: number; timestamp: string; script: any; note?: string }[];
  currentVersionNumber?: number;
  onSelectVersion?: (script: ScriptCreatorOutput) => void;
}

export function ScriptReviewCard({
  script,
  isApproved,
  onApprove,
  onRegenerate,
  onUpdateScript,
  onRequestAdjustment,
  onSaveToLibrary,
  isSavedInLibrary,
  versions = [],
  currentVersionNumber,
  onSelectVersion,
}: ScriptReviewCardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedHook, setEditedHook] = useState(script.hook);
  const [editedCta, setEditedCta] = useState(script.cta);
  const [editedScenes, setEditedScenes] = useState<ScriptScene[]>(script.scenes);

  // Sincroniza estado de edição ao receber novo script
  React.useEffect(() => {
    setEditedHook(script.hook);
    setEditedCta(script.cta);
    setEditedScenes(script.scenes);
  }, [script]);

  // Salvar alterações manuais
  const handleSaveEdits = () => {
    const updated: ScriptCreatorOutput = {
      ...script,
      hook: editedHook,
      cta: editedCta,
      scenes: editedScenes,
      dialogue_overview: editedScenes.map((s) => s.dialogue),
    };
    onUpdateScript(updated);
    setIsEditMode(false);
  };

  const handleSceneDialogueChange = (idx: number, newDialogue: string) => {
    setEditedScenes((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], dialogue: newDialogue };
      return copy;
    });
  };

  return (
    <div className="bg-[#111318] border border-white/10 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl animate-fade-in">
      {/* CABEÇALHO DO ROTEIRO COM STATUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wide">
                Roteiro Narrativo
              </h3>
              {isApproved ? (
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  APROVADO POR VOCÊ
                </span>
              ) : (
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] font-mono px-2 py-0.5 rounded animate-pulse">
                  AGUARDANDO SUA REVISÃO
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400">
              {script.scenes.length} {script.scenes.length === 1 ? 'cena' : 'cenas'} para o seu vídeo
            </p>

            {/* SELETOR DE VERSÕES HISTÓRICAS */}
            {versions && versions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                <span className="text-zinc-500">Versões:</span>
                {versions.map((v) => (
                  <button
                    key={v.version}
                    type="button"
                    onClick={() => onSelectVersion && onSelectVersion(v.script)}
                    className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white transition-colors"
                    title={`Ver Versão ${v.version} gravada em ${new Date(v.timestamp).toLocaleTimeString('pt-BR')}`}
                  >
                    V{v.version}
                  </button>
                ))}
                <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">
                  V{currentVersionNumber || versions.length + 1} (Atual)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLES RÁPIDOS DE MODO EDIÇÃO */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onSaveToLibrary && (
            <button
              type="button"
              onClick={onSaveToLibrary}
              className={cn(
                'py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95',
                isSavedInLibrary
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
              )}
              title="Salvar este roteiro em pasta permanente da biblioteca"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSavedInLibrary ? 'Salvo na Pasta ✓' : 'Salvar Roteiro'}</span>
            </button>
          )}

          {isEditMode ? (
            <button
              type="button"
              onClick={handleSaveEdits}
              className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Edições</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Editar Campos</span>
            </button>
          )}
        </div>
      </div>

      {/* BLOCO 1: GANCHO (0-3s) */}
      <div className="bg-purple-500/[0.04] border border-purple-500/20 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase text-purple-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gancho Inicial (0 a 3 segundos):</span>
          </span>
        </div>

        {isEditMode ? (
          <textarea
            value={editedHook}
            onChange={(e) => setEditedHook(e.target.value)}
            rows={2}
            className="w-full bg-black/50 border border-purple-500/40 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
          />
        ) : (
          <p className="text-white font-medium text-xs leading-relaxed">
            "{script.hook}"
          </p>
        )}
      </div>

      {/* BLOCO 2: CENAS E FALAS DIRETAS (SEM INFORMAÇÕES TÉCNICAS DESNECESSÁRIAS) */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono uppercase text-zinc-500 block">
          Cenas & Falas:
        </span>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {editedScenes.map((scene, idx) => (
            <div
              key={scene.sceneNumber}
              className="p-3 bg-black/30 border border-white/[0.06] rounded-xl space-y-2 hover:border-white/15 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                  {scene.sceneName}
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-2 py-0.5 rounded flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {scene.durationSec}s
                </span>
              </div>

              {/* FALA / DIÁLOGO */}
              <div className="p-2.5 bg-black/50 rounded-lg border-l-2 border-purple-500 space-y-1">
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">FALA / TEXTO:</span>
                {isEditMode ? (
                  <textarea
                    value={scene.dialogue}
                    onChange={(e) => handleSceneDialogueChange(idx, e.target.value)}
                    rows={2}
                    className="w-full bg-black/60 border border-white/15 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  />
                ) : (
                  <p className="text-zinc-100 text-xs leading-relaxed font-medium">
                    "{scene.dialogue}"
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* BLOCO 3: CHAMADA PARA AÇÃO (CTA) */}
          <div className="p-3 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl space-y-1.5">
            <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">
              Chamada para Ação (Final do Vídeo):
            </span>
            {isEditMode ? (
              <textarea
                value={editedCta}
                onChange={(e) => setEditedCta(e.target.value)}
                rows={2}
                className="w-full bg-black/50 border border-emerald-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              />
            ) : (
              <p className="text-white text-xs leading-relaxed font-medium">
                "{script.cta}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* BLOCO 4: CONTROLES DO USUÁRIO */}
      <div className="pt-2 border-t border-white/[0.08] space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* BOTÃO 1: APROVAR ROTEIRO */}
          <button
            type="button"
            onClick={onApprove}
            className={cn(
              'py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95',
              isApproved
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                : 'bg-emerald-500 hover:bg-emerald-600 text-zinc-950 shadow-emerald-500/20 hover:scale-[1.02]'
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isApproved ? 'Roteiro Aprovado ✓' : 'Aprovar Roteiro & Liberar Produção'}</span>
          </button>

          {/* BOTÃO 2: REGENERAR OUTRA VERSÃO */}
          <button
            type="button"
            onClick={onRegenerate}
            className="py-2.5 px-4 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Regenerar Outra Ideia</span>
          </button>
        </div>

        {/* BOTÃO SALVAR ROTEIRO NA PASTA DO CLIENTE */}
        {onSaveToLibrary && (
          <button
            type="button"
            onClick={onSaveToLibrary}
            className={cn(
              'w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98',
              isSavedInLibrary
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/40'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30'
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span>{isSavedInLibrary ? 'Roteiro Salvo na Pasta do Cliente ✓' : 'Salvar Roteiro em Pasta do Cliente'}</span>
          </button>
        )}

        {/* AJUSTES RÁPIDOS CONVERSACIONAIS */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-zinc-500 w-full mb-0.5">
            Ou peça um ajuste rápido:
          </span>
          {[
            { label: '🔥 Gancho Mais Forte', prompt: 'Muda apenas o gancho para algo mais provocativo e forte' },
            { label: '😂 Tom Mais Descontraído', prompt: 'Quero um tom mais descontraído e bem-humorado' },
            { label: '📲 CTA para WhatsApp', prompt: 'Muda a chamada para ação para chamar no WhatsApp' },
            { label: '⚡ Mais Rápido (15s)', prompt: 'Encurta o roteiro para 15 segundos bem dinâmico' },
          ].map((btn, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onRequestAdjustment(btn.prompt)}
              className="py-1 px-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
