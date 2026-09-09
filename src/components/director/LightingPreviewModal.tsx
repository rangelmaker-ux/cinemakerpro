'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SunMedium,
  Sparkles,
  Sliders,
  X,
  Layers,
  Eye,
  RotateCcw,
  Download,
  Check,
  Zap,
  Camera,
  CheckCircle2,
  Maximize2,
  Info,
  Split,
  ChevronRight,
} from 'lucide-react';
import { AIDirectorSpatialData } from '@/lib/ai/types';
import { processPhysicallyBasedRelight, Relight3DParameters } from '@/lib/ai/depth-engine';
import { cn } from '@/lib/utils';

interface LightingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  spatialData: AIDirectorSpatialData;
}

export type ViewMode = 'relight' | 'split' | 'depth' | 'original';

export function LightingPreviewModal({
  isOpen,
  onClose,
  photoUrl,
  spatialData,
}: LightingPreviewModalProps) {
  // Parâmetros de iluminação física e espacial
  const [params, setParams] = useState<Relight3DParameters>({
    keyLightDistanceToWall: 1.5,
    keyLightHeight: 1.85,
    keyLightAngle: 45,
    keyLightSide: 'left',
    softboxDiameterCm: 90,
    intensity: 80,
    colorTemp: '5600K',
    enableRimLight: true,
    enableFillLight: true,
    enableCastShadow: true,
    enableVolumetricHaze: true,
    subjectDistanceCam: 2.2,
    backWallDistanceCam: 3.7,
  });

  const [viewMode, setViewMode] = useState<ViewMode>('relight');
  const [splitPosition, setSplitPosition] = useState<number>(50); // 0 a 100%
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [renderedFinalUrl, setRenderedFinalUrl] = useState<string | null>(null);
  const [renderedDepthUrl, setRenderedDepthUrl] = useState<string | null>(null);
  const [spatialMetrics, setSpatialMetrics] = useState<{
    cameraDepthMeters: number;
    subjectDepthMeters: number;
    keyLightDepthMeters: number;
    wallDepthMeters: number;
    wallClearanceMeters: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSplit = useRef<boolean>(false);

  // Executa o processamento do PBR Engine quando a foto ou os parâmetros mudarem
  const runRelightSimulation = useCallback(async () => {
    if (!photoUrl) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = photoUrl;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
      });

      const { finalCanvas, depthCanvas, metrics } = await processPhysicallyBasedRelight(img, params);
      setRenderedFinalUrl(finalCanvas.toDataURL('image/jpeg', 0.95));
      setRenderedDepthUrl(depthCanvas.toDataURL('image/png'));
      setSpatialMetrics(metrics);
    } catch (err) {
      console.error('Erro ao renderizar relighting 3D:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [photoUrl, params]);

  useEffect(() => {
    if (isOpen && photoUrl) {
      runRelightSimulation();
    }
  }, [isOpen, photoUrl, runRelightSimulation]);

  // Aplicação de Presets Cinematográficos
  const handleApplyPreset = (presetKey: 'key_45' | 'warm_3200' | 'bicolor_cinema' | 'split_90') => {
    switch (presetKey) {
      case 'key_45':
        setParams((p) => ({
          ...p,
          keyLightAngle: 45,
          keyLightSide: 'left',
          colorTemp: '5600K',
          intensity: 80,
          softboxDiameterCm: 90,
          enableRimLight: true,
          enableCastShadow: true,
          keyLightDistanceToWall: 1.5,
        }));
        break;
      case 'warm_3200':
        setParams((p) => ({
          ...p,
          keyLightAngle: 40,
          keyLightSide: 'left',
          colorTemp: '3200K',
          intensity: 85,
          softboxDiameterCm: 90,
          enableRimLight: true,
          enableCastShadow: true,
          keyLightDistanceToWall: 1.5,
        }));
        break;
      case 'bicolor_cinema':
        setParams((p) => ({
          ...p,
          keyLightAngle: 45,
          keyLightSide: 'left',
          colorTemp: 'bicolor',
          intensity: 90,
          softboxDiameterCm: 90,
          enableRimLight: true,
          enableCastShadow: true,
          keyLightDistanceToWall: 1.5,
        }));
        break;
      case 'split_90':
        setParams((p) => ({
          ...p,
          keyLightAngle: 85,
          keyLightSide: 'left',
          colorTemp: '5600K',
          intensity: 95,
          softboxDiameterCm: 60,
          enableRimLight: true,
          enableCastShadow: true,
          keyLightDistanceToWall: 1.5,
        }));
        break;
    }
  };

  // Controle de arrasto do comparador Split
  const handleSplitMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const pos = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSplitPosition(pos);
  };

  const handleDownload = () => {
    if (!renderedFinalUrl) return;
    const link = document.createElement('a');
    link.href = renderedFinalUrl;
    link.download = 'cinemaker-pro-preview-iluminacao.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#0f1117] border border-white/[0.1] rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header da Simulação */}
        <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#13151d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white tracking-tight">
                  Simulação de Luz Real com Profundidade 3D
                </h3>
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-mono px-2 py-0.5 rounded">
                  PBR ENGINE • POV CÂMERA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                A foto representa o ponto de vista da câmera. A luz é calculada na profundidade real do espaço físico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderedFinalUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs text-zinc-300 hover:text-white transition-colors"
                title="Baixar imagem iluminada em alta resolução"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Salvar Foto</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo Principal: Viewport 3D + Painel de Controle Físico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          {/* LADO ESQUERDO: Viewport com Render e Comparador Split (8 colunas) */}
          <div className="lg:col-span-8 p-3 sm:p-5 flex flex-col gap-3 justify-center items-center bg-[#090a0f]">
            {/* Seletor de Modo de Visualização */}
            <div className="w-full flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setViewMode('relight')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5',
                    viewMode === 'relight'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  <SunMedium className="w-3.5 h-3.5" />
                  <span>Preview 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5',
                    viewMode === 'split'
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  <Split className="w-3.5 h-3.5" />
                  <span>Antes / Depois</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('depth')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5',
                    viewMode === 'depth'
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Mapa de Profundidade</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('original')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5',
                    viewMode === 'original'
                      ? 'bg-white text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Original</span>
                </button>
              </div>

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span>Calculando 3D...</span>
                </div>
              )}
            </div>

            {/* Container da Imagem com Viewport de Profundidade */}
            <div
              ref={containerRef}
              onMouseDown={() => {
                if (viewMode === 'split') isDraggingSplit.current = true;
              }}
              onMouseUp={() => {
                isDraggingSplit.current = false;
              }}
              onMouseLeave={() => {
                isDraggingSplit.current = false;
              }}
              onMouseMove={handleSplitMouseMove}
              onTouchMove={handleSplitMouseMove}
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-white/15 select-none shadow-2xl bg-black"
            >
              {/* Telemetria HUD Flutuante no Viewport (Distâncias Métricas Exatas) */}
              <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-none font-mono text-[10px]">
                <div className="bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>CÂMERA (POV): 0.0m (Ponto de tomada)</span>
                </div>
                <div className="bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>PERSONAGEM: ~{params.subjectDistanceCam.toFixed(1)}m</span>
                </div>
                <div className="bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>
                    LUZ PRINCIPAL: {params.keyLightAngle}° {params.keyLightSide === 'left' ? 'ESQ' : 'DIR'} • {params.keyLightDistanceToWall}m DA PAREDE
                  </span>
                </div>
                <div className="bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-zinc-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  <span>PAREDE DE FUNDO: ~{params.backWallDistanceCam.toFixed(1)}m (1.5m de recuo)</span>
                </div>
              </div>

              {/* RENDER VIEW 1: PREVIEW 3D FINAL */}
              {viewMode === 'relight' && renderedFinalUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={renderedFinalUrl}
                  alt="Iluminação 3D com Profundidade"
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}

              {/* RENDER VIEW 2: MAPA DE PROFUNDIDADE 3D */}
              {viewMode === 'depth' && renderedDepthUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={renderedDepthUrl}
                  alt="Mapa de Profundidade 3D"
                  className="w-full h-full object-cover animate-fade-in filter contrast-125"
                />
              )}

              {/* RENDER VIEW 3: FOTO ORIGINAL LIMPA */}
              {viewMode === 'original' && photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Foto Original do Espaço"
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}

              {/* RENDER VIEW 4: COMPARADOR SPLIT WIPE INTERATIVO */}
              {viewMode === 'split' && photoUrl && renderedFinalUrl && (
                <div className="relative w-full h-full overflow-hidden">
                  {/* Fundo: Foto Original */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Frente: Imagem com Iluminação 3D cortada pelo split */}
                  <div
                    className="absolute inset-0 overflow-hidden border-r-2 border-white shadow-2xl pointer-events-none"
                    style={{ width: `${splitPosition}%` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={renderedFinalUrl}
                      alt="Iluminação 3D"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        width: containerRef.current?.clientWidth || '100%',
                        maxWidth: 'none',
                      }}
                    />
                  </div>

                  {/* Linha Divisória com Alça de Arraste */}
                  <div
                    className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center justify-center pointer-events-none"
                    style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white text-zinc-950 shadow-xl flex items-center justify-center border-2 border-black/40 font-mono text-[10px] font-bold">
                      ↔
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 z-20 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                    ILUMINADO (3D PBR)
                  </div>
                  <div className="absolute bottom-3 right-3 z-20 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                    ORIGINAL
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé informativo com cálculo físico */}
            <div className="w-full bg-[#111318] border border-white/[0.08] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px]">
                  <strong>Cálculo Óptico Aplicado:</strong> A luz principal decai na razão física 1/d² e projeta sombra suave na parede a {params.keyLightDistanceToWall}m de recuo.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runRelightSimulation}
                  className="px-3 py-1.5 bg-white text-zinc-950 hover:bg-zinc-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Recalcular Luz</span>
                </button>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: Controles de Física & Equipamentos (4 colunas) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-[#111318] space-y-5 overflow-y-auto">
            {/* Presets de Iluminação */}
            <div>
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block mb-2 font-semibold">
                Esquemas Técnicos Recomendados
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('key_45')}
                  className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left space-y-1 transition-colors"
                >
                  <span className="font-semibold text-white block">Key 45° Daylight</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">5600K • Octa 90cm</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('warm_3200')}
                  className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left space-y-1 transition-colors"
                >
                  <span className="font-semibold text-amber-300 block">Tungstênio Quente</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">3200K • Acolhedor</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('bicolor_cinema')}
                  className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left space-y-1 transition-colors"
                >
                  <span className="font-semibold text-cyan-300 block">Bi-Color Cinema</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">Key Âmbar + Rim Ciano</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('split_90')}
                  className="p-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-left space-y-1 transition-colors"
                >
                  <span className="font-semibold text-purple-300 block">Split Dramático</span>
                  <span className="text-[10px] text-zinc-400 block font-mono">90° Lateral • Alto Contraste</span>
                </button>
              </div>
            </div>

            {/* Ajustes da Luz Principal (Key Light) */}
            <div className="space-y-3 pt-3 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                  <span>Luz Principal (Key Light)</span>
                </span>
                <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, keyLightSide: 'left' }))}
                    className={cn(
                      'px-2 py-0.5 rounded',
                      params.keyLightSide === 'left' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400'
                    )}
                  >
                    Esq (45°)
                  </button>
                  <button
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, keyLightSide: 'right' }))}
                    className={cn(
                      'px-2 py-0.5 rounded',
                      params.keyLightSide === 'right' ? 'bg-white text-zinc-950 font-bold' : 'text-zinc-400'
                    )}
                  >
                    Dir (45°)
                  </button>
                </div>
              </div>

              {/* Potência da Luz */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Potência / Intensidade</span>
                  <span className="text-white font-semibold">{params.intensity}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={100}
                  value={params.intensity}
                  onChange={(e) => setParams((p) => ({ ...p, intensity: Number(e.target.value) }))}
                  className="w-full accent-white"
                />
              </div>

              {/* Distância da Luz em Relação à Parede de Fundo */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Distância da Parede de Fundo</span>
                  <span className="text-amber-400 font-semibold">{params.keyLightDistanceToWall.toFixed(1)} m</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  {[1.0, 1.5, 2.0].map((dist) => (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, keyLightDistanceToWall: dist }))}
                      className={cn(
                        'py-1.5 rounded-lg border transition-colors',
                        params.keyLightDistanceToWall === dist
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                          : 'bg-white/[0.03] text-zinc-400 border-white/[0.07] hover:text-white'
                      )}
                    >
                      {dist.toFixed(1)} m {dist === 1.5 ? '(Ideal)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamanho do Softbox / Difusão */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                  <span>Modificador de Difusão</span>
                  <span className="text-white font-semibold">{params.softboxDiameterCm} cm</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px]">
                  {[
                    { cm: 60, label: '60cm (Direta)' },
                    { cm: 90, label: '90cm (Octa)' },
                    { cm: 120, label: '120cm (Dome)' },
                  ].map((item) => (
                    <button
                      key={item.cm}
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, softboxDiameterCm: item.cm }))}
                      className={cn(
                        'py-1.5 rounded-lg border transition-colors text-center',
                        params.softboxDiameterCm === item.cm
                          ? 'bg-white text-zinc-950 font-bold border-white'
                          : 'bg-white/[0.03] text-zinc-400 border-white/[0.07] hover:text-white'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperatura de Cor */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-zinc-400 block">Temperatura Kelvin</span>
                <div className="grid grid-cols-4 gap-1 font-mono text-[10px]">
                  {(['3200K', '4300K', '5600K', 'bicolor'] as const).map((temp) => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => setParams((p) => ({ ...p, colorTemp: temp }))}
                      className={cn(
                        'py-1.5 rounded-lg border transition-colors uppercase text-center',
                        params.colorTemp === temp
                          ? 'bg-white text-zinc-950 font-bold border-white'
                          : 'bg-white/[0.03] text-zinc-400 border-white/[0.07] hover:text-white'
                      )}
                    >
                      {temp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Camadas Técnicas Adicionais */}
            <div className="space-y-2 pt-3 border-t border-white/[0.08]">
              <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block font-semibold">
                Física Óptica & Camadas de Set
              </span>

              <label className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl cursor-pointer hover:bg-white/[0.05] transition-colors">
                <div>
                  <span className="text-xs text-white font-medium block">Contra-Luz (Rim / Hair Light)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Separa a silhueta da parede de fundo</span>
                </div>
                <input
                  type="checkbox"
                  checked={params.enableRimLight}
                  onChange={(e) => setParams((p) => ({ ...p, enableRimLight: e.target.checked }))}
                  className="w-4 h-4 accent-amber-400 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl cursor-pointer hover:bg-white/[0.05] transition-colors">
                <div>
                  <span className="text-xs text-white font-medium block">Sombra Projetada na Parede</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Projeta sombra realista a 1.5m atrás</span>
                </div>
                <input
                  type="checkbox"
                  checked={params.enableCastShadow}
                  onChange={(e) => setParams((p) => ({ ...p, enableCastShadow: e.target.checked }))}
                  className="w-4 h-4 accent-amber-400 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl cursor-pointer hover:bg-white/[0.05] transition-colors">
                <div>
                  <span className="text-xs text-white font-medium block">Preenchimento Suave (Fill)</span>
                  <span className="text-[10px] text-zinc-400 font-mono">Mantém detalhe no lado da sombra</span>
                </div>
                <input
                  type="checkbox"
                  checked={params.enableFillLight}
                  onChange={(e) => setParams((p) => ({ ...p, enableFillLight: e.target.checked }))}
                  className="w-4 h-4 accent-amber-400 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
