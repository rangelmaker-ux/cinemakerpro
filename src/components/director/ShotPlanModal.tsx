'use client';

import React, { useState } from 'react';
import { Film, X, Check, Clock, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShotPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  takes: {
    sceneNumber: number;
    title: string;
    framing: string;
    movement: string;
    durationSec: number;
    description: string;
  }[];
}

export function ShotPlanModal({ isOpen, onClose, takes }: ShotPlanModalProps) {
  const [recordedTakes, setRecordedTakes] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleTake = (num: number) => {
    setRecordedTakes((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[85vh] bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Plano de Cenas (Takes)</h3>
              <p className="text-[11px] text-slate-400">
                {recordedTakes.length} de {takes.length} takes gravados
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

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-3">
          {takes.map((take) => {
            const isDone = recordedTakes.includes(take.sceneNumber);

            return (
              <div
                key={take.sceneNumber}
                onClick={() => toggleTake(take.sceneNumber)}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all cursor-pointer select-none',
                  isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-surface-raised border-surface-border hover:border-slate-600'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-light block">
                      Cena 0{take.sceneNumber}
                    </span>
                    <h4
                      className={cn(
                        'text-xs font-bold leading-tight',
                        isDone ? 'line-through text-slate-400' : 'text-white'
                      )}
                    >
                      {take.title}
                    </h4>
                  </div>
                  <div
                    className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                      isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-surface border border-slate-600 text-slate-400'
                    )}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : take.sceneNumber}
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                  {take.description}
                </p>

                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded-md">
                    <Video className="w-3 h-3 text-sky-400" />
                    {take.framing}
                  </span>
                  <span className="flex items-center gap-1 bg-surface px-2 py-0.5 rounded-md">
                    <Clock className="w-3 h-3 text-amber-400" />
                    ~{take.durationSec}s
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl transition-colors active:scale-95"
        >
          Fechar e Continuar Gravação
        </button>
      </div>
    </div>
  );
}
