'use client';

import React, { useState } from 'react';
import { Camera, X, CheckCircle, AlertCircle, RefreshCw, Upload } from 'lucide-react';
import { evaluateFramingTest } from '@/lib/ai/provider';
import { FramingTestFeedback } from '@/lib/ai/types';

interface FramingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FramingModal({ isOpen, onClose }: FramingModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<FramingTestFeedback | null>(null);
  const [testImage, setTestImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulateCapture = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setFeedback(evaluateFramingTest());
      setAnalyzing(false);
    }, 1200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTestImage(url);
      setAnalyzing(true);
      setTimeout(() => {
        setFeedback(evaluateFramingTest());
        setAnalyzing(false);
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-surface-border rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Testar Enquadramento</h3>
              <p className="text-[11px] text-slate-400">Validação de Headroom, Altura e Luz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-surface-raised flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 space-y-4">
          {!feedback ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-brand/10 text-brand-light flex items-center justify-center mb-3">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                Tire uma foto através da câmera montada
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs mb-4">
                A IA analisará o espaço acima da cabeça (headroom), separação e se a altura está na linha dos olhos.
              </p>

              <div className="flex flex-col w-full gap-2">
                <label className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand/20 active:scale-95 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>Fotografar ou Escolher Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleSimulateCapture}
                  disabled={analyzing}
                  className="w-full py-2 bg-surface-raised hover:bg-slate-800 text-slate-300 font-medium text-xs rounded-xl border border-surface-border transition-colors"
                >
                  {analyzing ? 'Analisando enquadramento...' : 'Simular Foto de Teste'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 animate-fade-in">
              {/* Score de Qualidade */}
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Enquadramento Aprovado</h4>
                    <p className="text-[10px] text-emerald-400">Score de composição: 88/100</p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                  ÓTIMO
                </span>
              </div>

              {/* Indicadores */}
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div className="bg-surface-raised p-2 rounded-xl border border-surface-border">
                  <span className="text-slate-400 block font-bold">HEADROOM</span>
                  <span className="text-emerald-400 font-bold">No Ponto</span>
                </div>
                <div className="bg-surface-raised p-2 rounded-xl border border-surface-border">
                  <span className="text-slate-400 block font-bold">ALTURA</span>
                  <span className="text-amber-400 font-bold">-10 cm</span>
                </div>
                <div className="bg-surface-raised p-2 rounded-xl border border-surface-border">
                  <span className="text-slate-400 block font-bold">ILUMINAÇÃO</span>
                  <span className="text-emerald-400 font-bold">Equilibrada</span>
                </div>
              </div>

              {/* Dicas acionáveis */}
              <div className="p-3 bg-surface-raised border border-surface-border rounded-xl space-y-1.5 text-xs">
                <span className="font-bold text-slate-300 block text-[11px]">Recomendações da IA:</span>
                {feedback.actionableTips.map((tip, idx) => (
                  <p key={idx} className="text-slate-300 text-[11px] leading-relaxed">
                    {tip}
                  </p>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="w-full py-2 bg-surface-raised hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl border border-surface-border flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Testar Outro Ângulo</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-bold text-xs rounded-xl transition-colors active:scale-95"
        >
          Pronto para Gravar Takes
        </button>
      </div>
    </div>
  );
}
