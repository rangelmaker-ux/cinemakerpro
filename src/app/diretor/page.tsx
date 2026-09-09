'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Camera,
  Sparkles,
  HelpCircle,
  Move,
  CheckSquare,
  Film,
  Upload,
  Layers,
  SunMedium,
  Mic,
  ChevronRight,
  Zap,
  Sliders,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { generateAIDirectorLayout, evaluateFramingTest } from '@/lib/ai/provider';
import { AIDirectorSpatialData, FramingTestFeedback, SpatialElement } from '@/lib/ai/types';
import { DirectorMode } from '@/types/database';
import { SpatialOverlay } from '@/components/director/SpatialOverlay';
import { WhyModal } from '@/components/director/WhyModal';
import { cn } from '@/lib/utils';

function DirectorContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const isQuick = searchParams.get('quick') === 'true';

  const { clients, equipments } = useAppStore();

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0];

  const [mode, setMode] = useState<DirectorMode>(isQuick ? 'rapido' : 'recomendado');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [blockedZones, setBlockedZones] = useState<{ id: string; x: number; y: number }[]>([]);
  const [spatialData, setSpatialData] = useState<AIDirectorSpatialData>(() =>
    generateAIDirectorLayout({
      videoType: 'institucional',
      mode: isQuick ? 'rapido' : 'recomendado',
      userEquipment: equipments,
    })
  );

  // Sistema de Gavetas / Abas no Painel Lateral
  const [activeTab, setActiveTab] = useState<'montagem' | 'takes' | 'enquadramento' | 'checklist'>('montagem');

  // Modal "Por quê?"
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Estados dos Takes e Checklist gravados
  const [doneTakes, setDoneTakes] = useState<number[]>([]);
  const [checks, setChecks] = useState<{ id: string; label: string; done: boolean }[]>([
    { id: 'c1', label: 'Baterias da câmera e luzes 100% carregadas', done: true },
    { id: 'c2', label: 'Cartão SD formatado e com espaço livre', done: true },
    { id: 'c3', label: 'Lente limpa sem poeira ou marcas de dedo', done: true },
    { id: 'c4', label: 'Luz principal a 45° sem queimar altas luzes', done: false },
    { id: 'c5', label: 'Lapela posicionado sem atrito com roupas', done: false },
    { id: 'c6', label: 'Ruído de ar-condicionado ou geladeira desligado', done: false },
    { id: 'c7', label: 'Take principal gravado com foco nos olhos', done: false },
    { id: 'c8', label: 'B-Roll de detalhes e processos finalizado', done: false },
  ]);

  // Teste de enquadramento
  const [framingResult, setFramingResult] = useState<FramingTestFeedback | null>(null);
  const [testingFraming, setTestingFraming] = useState(false);

  useEffect(() => {
    setIsRecalculating(true);
    const timer = setTimeout(() => {
      const updated = generateAIDirectorLayout({
        videoType: 'institucional',
        mode,
        userEquipment: equipments,
        blockedZones,
      });
      setSpatialData(updated);
      setIsRecalculating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [mode, blockedZones, equipments]);

  const handleBlockElement = (elementId: string) => {
    const el = spatialData.elements.find((e) => e.id === elementId);
    if (!el) return;
    setBlockedZones((prev) => [...prev, { id: elementId, x: el.x, y: el.y }]);
  };

  const handleResetBlocked = () => {
    setBlockedZones([]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const toggleTake = (num: number) => {
    setDoneTakes((prev) =>
      prev.includes(num) ? prev.filter((n) => n !== num) : [...prev, num]
    );
  };

  const toggleCheck = (id: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const runFramingCheck = () => {
    setTestingFraming(true);
    setTimeout(() => {
      setFramingResult(evaluateFramingTest());
      setTestingFraming(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header do Set com contexto do cliente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-surface-border rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/15 text-brand-light flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white leading-tight">
                Diretor de Gravação IA
              </h2>
              <span className="text-[10px] font-semibold text-brand-light bg-brand/15 border border-brand/25 px-2 py-0.5 rounded-full">
                {selectedClient?.name || 'Cliente'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Montagem física precisa adaptada ao ambiente e ao seu kit
            </p>
          </div>
        </div>

        {/* Seletor dos 3 Modos */}
        <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-surface-border self-start sm:self-auto">
          {(
            [
              { id: 'recomendado', label: 'Recomendado' },
              { id: 'rapido', label: 'Rápido' },
              { id: 'criativo', label: 'Criativo' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                mode === m.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* WORKSPACE PRINCIPAL: LAYOUT DE 2 COLUNAS NO DESKTOP (VIEWFINDER + GAVETAS DE CONTROLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: VIEWFINDER DO MONITOR CINE (Lg: 7 colunas) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative">
            {isRecalculating && (
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                <div className="bg-surface px-4 py-2.5 rounded-xl border border-surface-border flex items-center gap-2.5 text-xs font-semibold text-white shadow-xl">
                  <Sparkles className="w-4 h-4 text-brand-light animate-spin" />
                  <span>Recalculando posições com base no seu kit...</span>
                </div>
              </div>
            )}

            <SpatialOverlay
              photoUrl={photoUrl}
              spatialData={spatialData}
              onBlockElement={handleBlockElement}
            />
          </div>

          {/* Barra de Controles da Foto */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex-1 py-2.5 bg-surface hover:bg-surface-raised text-slate-200 font-semibold rounded-xl border border-surface-border flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm">
              <Upload className="w-3.5 h-3.5 text-brand-light" />
              <span>{photoUrl ? 'Substituir Foto do Espaço' : 'Fotografar Ambiente Real'}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>

            {blockedZones.length > 0 && (
              <button
                type="button"
                onClick={handleResetBlocked}
                className="py-2.5 px-3 bg-surface hover:bg-surface-raised text-slate-400 hover:text-white rounded-xl border border-surface-border flex items-center gap-1.5 transition-colors"
                title="Restaurar posições originais"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsWhyOpen(true)}
              className="py-2.5 px-3 bg-surface hover:bg-surface-raised text-brand-light font-semibold rounded-xl border border-surface-border flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Por quê?</span>
            </button>
          </div>
        </div>

        {/* COLUNA DIREITA: GAVETAS DE CONTROLE ORGANIZADAS POR ABAS (Lg: 5 colunas) */}
        <div className="lg:col-span-5 bg-surface border border-surface-border rounded-3xl p-5 shadow-sm space-y-4">
          {/* Menu de Gavetas / Abas */}
          <div className="grid grid-cols-4 gap-1 bg-surface-raised p-1 rounded-2xl border border-surface-border">
            {(
              [
                { id: 'montagem', label: 'Montagem', icon: Sliders },
                { id: 'takes', label: 'Takes', icon: Film },
                { id: 'enquadramento', label: 'Enquadro', icon: Camera },
                { id: 'checklist', label: 'Checklist', icon: CheckSquare },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'py-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all',
                    isActive
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* GAVETA 1: MONTAGEM & EQUIPAMENTOS DETECTADOS */}
          {activeTab === 'montagem' && (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="font-bold text-white">Configuração do Seu Kit</span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  100% no seu inventário
                </span>
              </div>

              {/* Lente */}
              <div className="bg-surface-raised p-3 rounded-2xl border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Câmera & Lente
                  </span>
                  <span className="text-slate-300 font-bold">
                    {spatialData.cameraSettings.height}
                  </span>
                </div>
                <h4 className="font-semibold text-white">
                  {spatialData.cameraSettings.lensName}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {spatialData.cameraSettings.shotType}
                </p>
              </div>

              {/* Luz */}
              <div className="bg-surface-raised p-3 rounded-2xl border border-surface-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Iluminação
                  </span>
                  <span className="text-slate-300 font-bold">
                    {spatialData.lightingSettings.keyLightAngle}
                  </span>
                </div>
                <h4 className="font-semibold text-white">
                  Altura {spatialData.lightingSettings.keyLightHeight}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {spatialData.lightingSettings.keyLightModifier}
                </p>
              </div>

              {/* Áudio */}
              <div className="bg-surface-raised p-3 rounded-2xl border border-surface-border space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Captação de Áudio
                </span>
                <h4 className="font-semibold text-white">
                  {spatialData.audioSettings.micType}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {spatialData.audioSettings.position}
                </p>
              </div>

              {/* Prevenção de Erros */}
              <div className="p-3 bg-surface-raised rounded-2xl border border-surface-border space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Cuidados Importantes Neste Ambiente:
                </span>
                {spatialData.avoids.map((avoid, idx) => (
                  <p key={idx} className="text-[11px] text-slate-300 leading-relaxed">
                    • {avoid}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* GAVETA 2: PLANO DE TAKES */}
          {activeTab === 'takes' && (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="font-bold text-white">Plano de Cenas Sugerido</span>
                <span className="text-[10px] text-slate-400">
                  {doneTakes.length} de {spatialData.takesPlan.length} gravados
                </span>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {spatialData.takesPlan.map((take) => {
                  const isDone = doneTakes.includes(take.sceneNumber);

                  return (
                    <div
                      key={take.sceneNumber}
                      onClick={() => toggleTake(take.sceneNumber)}
                      className={cn(
                        'p-3 rounded-2xl border transition-all cursor-pointer select-none',
                        isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-surface-raised border-surface-border hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-brand-light uppercase">
                          Cena 0{take.sceneNumber} • {take.framing}
                        </span>
                        <div
                          className={cn(
                            'w-4 h-4 rounded-md flex items-center justify-center text-xs',
                            isDone ? 'bg-emerald-500 text-white' : 'border border-slate-600'
                          )}
                        >
                          {isDone && <CheckCircle className="w-3 h-3" />}
                        </div>
                      </div>

                      <h4
                        className={cn(
                          'font-semibold text-white mb-1',
                          isDone && 'line-through text-slate-400'
                        )}
                      >
                        {take.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {take.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAVETA 3: ENQUADRAMENTO */}
          {activeTab === 'enquadramento' && (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="pb-2 border-b border-surface-border">
                <span className="font-bold text-white">Validador de Enquadramento</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verifique altura, headroom e equilíbrio de luz
                </p>
              </div>

              {!framingResult ? (
                <div className="p-6 bg-surface-raised rounded-2xl border border-dashed border-slate-700 text-center space-y-3">
                  <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-slate-300 text-xs">
                    Fotografe através do monitor da câmera montada para verificar headroom e posição dos olhos.
                  </p>
                  <button
                    type="button"
                    onClick={runFramingCheck}
                    disabled={testingFraming}
                    className="w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl shadow-sm transition-all"
                  >
                    {testingFraming ? 'Analisando enquadramento...' : 'Simular Validação de Quadro'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">Composição Aprovada</h4>
                      <p className="text-[10px] text-emerald-400">Score de qualidade: 88/100</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                      ÓTIMO
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-surface-raised p-3 rounded-2xl border border-surface-border">
                    <span className="font-bold text-slate-300 block text-[11px]">Dicas de Ajuste Fino:</span>
                    {framingResult.actionableTips.map((tip, i) => (
                      <p key={i} className="text-slate-300 text-[11px] leading-relaxed">
                        {tip}
                      </p>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFramingResult(null)}
                    className="w-full py-2 bg-surface-raised hover:bg-slate-800 text-slate-300 rounded-xl border border-surface-border font-semibold text-xs"
                  >
                    Testar Novamente
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GAVETA 4: CHECKLIST SET */}
          {activeTab === 'checklist' && (
            <div className="space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="font-bold text-white">Checklist de Produção</span>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {checks.filter((c) => c.done).length} de {checks.length} concluídos
                </span>
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {checks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={cn(
                      'p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition-all',
                      item.done
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-slate-400'
                        : 'bg-surface-raised border-surface-border text-slate-200 hover:border-slate-600'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-md flex items-center justify-center text-xs shrink-0',
                        item.done ? 'bg-emerald-500 text-white' : 'border border-slate-600'
                      )}
                    >
                      {item.done && <CheckCircle className="w-3 h-3" />}
                    </div>
                    <span className={cn('text-xs leading-snug', item.done && 'line-through')}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal "Por quê?" */}
      <WhyModal
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        spatialData={spatialData}
      />
    </div>
  );
}

export default function DirectorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-slate-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-brand-light animate-spin mr-2" />
          <span>Carregando Diretor IA...</span>
        </div>
      }
    >
      <DirectorContent />
    </Suspense>
  );
}
