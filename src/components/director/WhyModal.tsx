'use client';

import React from 'react';
import { HelpCircle, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AIDirectorSpatialData } from '@/lib/ai/types';

interface WhyModalProps {
  isOpen: boolean;
  onClose: () => void;
  spatialData: AIDirectorSpatialData;
}

export function WhyModal({ isOpen, onClose, spatialData }: WhyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand/20 text-brand-light flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Por que esta configuração?</h3>
              <p className="text-[11px] text-slate-400">Racional técnico e cinematográfico da IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 space-y-3.5 text-xs">
          <div className="p-3 bg-brand/10 border border-brand/25 rounded-2xl text-slate-200 leading-relaxed">
            <span className="font-bold text-brand-light block mb-1">💡 Princípio Visual Adotado:</span>
            {spatialData.whyExplanation}
          </div>

          <div>
            <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Erros que evitamos neste ambiente:
            </h4>
            <ul className="space-y-1.5">
              {spatialData.avoids.map((avoid, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{avoid}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-surface-raised hover:bg-slate-800 text-white font-semibold text-xs rounded-xl border border-surface-border transition-colors active:scale-95"
        >
          Entendido, voltar à montagem
        </button>
      </div>
    </div>
  );
}
