'use client';

import React from 'react';
import { CheckSquare, X, Check, Circle } from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { cn } from '@/lib/utils';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChecklistModal({ isOpen, onClose }: ChecklistModalProps) {
  const { activeShoot, toggleChecklistItem } = useAppStore();

  if (!isOpen || !activeShoot) return null;

  const items = activeShoot.checklist_state;
  const completedCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[85vh] bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Checklist de Gravação</h3>
              <p className="text-[11px] text-slate-400">
                {completedCount} de {totalCount} itens conferidos ({progressPercent}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-surface-raised h-2 rounded-full my-3 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Lista de Itens com Scroll */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(activeShoot.id, item.id)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.98]',
                item.done
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-300'
                  : 'bg-surface-raised border-surface-border text-white hover:border-slate-600'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-lg flex items-center justify-center transition-colors',
                  item.done ? 'bg-emerald-500 text-white' : 'border border-slate-600 text-transparent'
                )}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
              <span
                className={cn(
                  'text-xs font-medium flex-1 leading-snug',
                  item.done && 'line-through text-slate-400'
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl transition-colors mt-2 active:scale-95"
        >
          Salvar Progresso
        </button>
      </div>
    </div>
  );
}
