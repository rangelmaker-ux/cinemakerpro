'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Crosshair,
  Sliders,
  HelpCircle,
  Move,
  CheckSquare,
  Film,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { generateAIDirectorLayout, evaluateFramingTest } from '@/lib/ai/provider';
import { AIDirectorSpatialData, FramingTestFeedback } from '@/lib/ai/types';
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

  // Sistema de Gavetas
  const [activeTab, setActiveTab] = useState<'montagem' | 'takes' | 'enquadramento' | 'checklist'>('montagem');
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Estados dos Takes e Checklist
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
    }, 250);

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
      {/* Header do Set */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111318] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
            <Crosshair className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Direção Técnica de Set
              </h2>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded">
                {selectedClient?.name || 'Cliente'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Posicionamento angular e mapa de câmera calculado para o espaço
            </p>
          </div>
        </div>

        {/* Seletor de Modo */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto font-mono text-xs">
          {(
            [
              { id: 'recomendado', label: 'Recomendado' },
              { id: 'rapido', label: 'Rápido' },
              { id: 'criativo', label: 'Cinematográfico' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs transition-colors',
                mode === m.id
                  ? 'bg-white text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de 2 Colunas: Viewfinder + Gavetas de Produção */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna do Viewfinder (7 colunas) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative">
            {isRecalculating && (
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                <div className="bg-[#111318] px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-mono text-white shadow-xl">
                  <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Calculando parâmetros espaciais...</span>
                </div>
              </div>
            )}

            <SpatialOverlay
              photoUrl={photoUrl}
              spatialData={spatialData}
              onBlockElement={handleBlockElement}
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex-1 py-2.5 bg-[#111318] hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-zinc-400" />
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
                className="py-2.5 px-3 bg-[#111318] hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors"
                title="Restaurar posições originais"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restaurar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsWhyOpen(true)}
              className="py-2.5 px-3 bg-[#111318] hover:bg-zinc-800 text-zinc-300 hover:text-white font-medium rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>Por quê?</span>
            </button>
          </div>
        </div>

        {/* Coluna das Gavetas Técnicas (5 colunas) */}
        <div className="lg:col-span-5 bg-[#111318] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          {/* Seletor de Gavetas */}
          <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
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
                    'py-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-colors',
                    isActive
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-mono">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* GAVETA: MONTAGEM */}
          {activeTab === 'montagem' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="font-semibold text-white">Especificações do Kit</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  EQUIPAMENTO PRÓPRIO
                </span>
              </div>

              {/* Lente */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>CÂMERA & ÓPTICA</span>
                  <span>{spatialData.cameraSettings.height}</span>
                </div>
                <h4 className="font-medium text-white">
                  {spatialData.cameraSettings.lensName}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {spatialData.cameraSettings.shotType}
                </p>
              </div>

              {/* Luz */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>ILUMINAÇÃO PRINCIPAL</span>
                  <span>{spatialData.lightingSettings.keyLightAngle}</span>
                </div>
                <h4 className="font-medium text-white">
                  Altura {spatialData.lightingSettings.keyLightHeight}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {spatialData.lightingSettings.keyLightModifier}
                </p>
              </div>

              {/* Áudio */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06] space-y-1">
                <span className="font-mono text-[10px] text-zinc-500 block">ÁUDIO</span>
                <h4 className="font-medium text-white">
                  {spatialData.audioSettings.micType}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {spatialData.audioSettings.position}
                </p>
              </div>

              {/* Cuidados */}
              <div className="p-3 bg-amber-500/[0.03] rounded-xl border border-amber-500/20 space-y-1">
                <span className="text-[10px] font-mono font-semibold uppercase text-amber-400 block">
                  Cuidados Técnicos do Espaço:
                </span>
                {spatialData.avoids.map((avoid, idx) => (
                  <p key={idx} className="text-[11px] text-zinc-300 leading-relaxed">
                    • {avoid}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* GAVETA: TAKES */}
          {activeTab === 'takes' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="font-semibold text-white">Plano de Cenas</span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {doneTakes.length}/{spatialData.takesPlan.length} gravados
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
                        'p-3 rounded-xl border transition-all cursor-pointer select-none',
                        isDone
                          ? 'bg-emerald-500/[0.05] border-emerald-500/30'
                          : 'bg-black/30 border-white/[0.06] hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase">
                          CENA 0{take.sceneNumber} • {take.framing}
                        </span>
                        <div
                          className={cn(
                            'w-4 h-4 rounded flex items-center justify-center text-xs',
                            isDone ? 'bg-emerald-400 text-zinc-950' : 'border border-zinc-600'
                          )}
                        >
                          {isDone && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <h4
                        className={cn(
                          'font-medium text-white mb-1',
                          isDone && 'line-through text-zinc-500'
                        )}
                      >
                        {take.title}
                      </h4>

                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        {take.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAVETA: ENQUADRAMENTO */}
          {activeTab === 'enquadramento' && (
            <div className="space-y-3 text-xs">
              <div className="pb-2 border-b border-white/[0.06]">
                <span className="font-semibold text-white">Validador de Enquadramento</span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Verificação de respiro (headroom), linha dos olhos e exposição
                </p>
              </div>

              {!framingResult ? (
                <div className="p-6 bg-black/30 rounded-xl border border-dashed border-white/15 text-center space-y-3">
                  <Camera className="w-8 h-8 text-zinc-500 mx-auto" />
                  <p className="text-zinc-300 text-xs">
                    Fotografe através do visor da câmera montada para avaliar a composição final.
                  </p>
                  <button
                    type="button"
                    onClick={runFramingCheck}
                    disabled={testingFraming}
                    className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold rounded-xl transition-colors"
                  >
                    {testingFraming ? 'Processando imagem...' : 'Simular Validação de Quadro'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-white">Enquadramento Aprovado</h4>
                      <p className="text-[10px] text-emerald-400 font-mono">Precisão técnica: 88/100</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                      OK
                    </span>
                  </div>

                  <div className="space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                    <span className="font-mono text-[10px] text-zinc-400 uppercase block">Ajustes Sugeridos:</span>
                    {framingResult.actionableTips.map((tip, i) => (
                      <p key={i} className="text-zinc-300 text-[11px] leading-relaxed">
                        • {tip}
                      </p>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFramingResult(null)}
                    className="w-full py-2 bg-white/[0.05] hover:bg-white/10 text-zinc-300 rounded-xl border border-white/10 text-xs"
                  >
                    Repetir Teste
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GAVETA: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="font-semibold text-white">Checklist de Set</span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {checks.filter((c) => c.done).length}/{checks.length} checados
                </span>
              </div>

              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {checks.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={cn(
                      'p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer select-none transition-colors',
                      item.done
                        ? 'bg-emerald-500/[0.04] border-emerald-500/20 text-zinc-400'
                        : 'bg-black/30 border-white/[0.06] text-zinc-200 hover:border-white/20'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center text-xs shrink-0',
                        item.done ? 'bg-emerald-400 text-zinc-950' : 'border border-zinc-600'
                      )}
                    >
                      {item.done && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
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
        <div className="flex items-center justify-center p-12 text-zinc-400 text-xs font-mono">
          <span>Carregando Diretor Técnico...</span>
        </div>
      }
    >
      <DirectorContent />
    </Suspense>
  );
}
