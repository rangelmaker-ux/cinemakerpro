'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SunMedium,
  Sliders,
  X,
  Layers,
  Eye,
  Download,
  Split,
  Sparkles,
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
  const [params, setParams] = useState<Relight3DParameters>({
    keyLightDistanceToWall: 1.5,
    keyLightHeight: 1.85,
    keyLightAngle: 45,
    keyLightSide: 'left',
    softboxDiameterCm: 90,
    intensity: 85,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSplit = useRef<boolean>(false);

  // Executa o processamento do PBR Engine quando a foto ou os parâmetros mudarem
  const runRelightSimulation = useCallback(async () => {
    if (!photoUrl) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      if (!photoUrl.startsWith('blob:') && !photoUrl.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.src = photoUrl;

      await new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Falha ao carregar imagem original'));
        }
      });

      const { finalCanvas, depthCanvas } = await processPhysicallyBasedRelight(img, params);
      setRenderedFinalUrl(finalCanvas.toDataURL('image/jpeg', 0.95));
      setRenderedDepthUrl(depthCanvas.toDataURL('image/png'));
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
          intensity: 85,
          softboxDiameterCm: 90,
          enableRimLight: true,
          enableCastShadow: true,
        }));
        break;
      case 'warm_3200':
        setParams((p) => ({
          ...p,
          keyLightAngle: 45,
          keyLightSide: 'left',
          colorTemp: '3200K',
          intensity: 90,
          softboxDiameterCm: 90,
          enableRimLight: true,
          enableCastShadow: true,
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
        }));
        break;
      case 'split_90':
        setParams((p) => ({
          ...p,
          keyLightAngle: 85,
          keyLightSide: 'right',
          colorTemp: '5600K',
          intensity: 95,
          softboxDiameterCm: 60,
          enableRimLight: true,
          enableCastShadow: true,
        }));
        break;
    }
  };

  // Controle de arrasto do comparador Split
  const updateSplit = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSplitPosition(pos);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'split') return;
    isDraggingSplit.current = true;
    updateSplit(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current) return;
    updateSplit(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || e.touches.length === 0) return;
    updateSplit(e.touches[0].clientX);
  };

  const handleMouseUp = () => {
    isDraggingSplit.current = false;
  };

  const handleDownload = () => {
    if (!renderedFinalUrl) return;
    const link = document.createElement('a');
    link.href = renderedFinalUrl;
    link.download = 'cinemaker-pro-iluminacao-cinema.jpg';
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
                  Simulação de Iluminação 3D com Profundidade Real
                </h3>
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] font-mono px-2 py-0.5 rounded">
                  PBR ENGINE • POV CÂMERA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Mostra como o ambiente real fotografado fica após a montagem da luz principal a 45° e contra-luz
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

        {/* Corpo Principal: Viewport 3D + Painel de Controle */}
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
                  <span>Renderizando 3D...</span>
                </div>
              )}
            </div>

            {/* Container da Imagem com Viewport 3D */}
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={(e) => {
                if (viewMode === 'split' && e.touches.length > 0) {
                  isDraggingSplit.current = true;
                  updateSplit(e.touches[0].clientX);
                }
              }}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-white/15 select-none shadow-2xl bg-black"
            >
              {/* Telemetria de Distâncias Reais */}
              <div className="absolute top-3 left-3 z-30 flex flex-col gap-1 pointer-events-none font-mono text-[10px]">
                <div className="bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-amber-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>
                    LUZ PRINCIPAL 45°: {params.keyLightSide === 'left' ? 'ESQUERDA' : 'DIREITA'} • RECUO 1,5m DA PAREDE
                  </span>
                </div>
                <div className="bg-black/80 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-lg text-zinc-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>ASSUNTO: ~{params.subjectDistanceCam.toFixed(1)}m • RECÚO DO FUNDO: 1,5m</span>
                </div>
              </div>

              {/* RENDER 1: PREVIEW 3D FINAL ILUMINADO */}
              {viewMode === 'relight' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={renderedFinalUrl || photoUrl || ''}
                  alt="Iluminação 3D com Profundidade"
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}

              {/* RENDER 2: MAPA DE PROFUNDIDADE 3D CONTÍNUO */}
              {viewMode === 'depth' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={renderedDepthUrl || photoUrl || ''}
                  alt="Mapa de Profundidade 3D Contínuo"
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}

              {/* RENDER 3: FOTO ORIGINAL CRUA */}
              {viewMode === 'original' && photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Foto Original do Espaço"
                  className="w-full h-full object-cover animate-fade-in"
                />
              )}

              {/* RENDER 4: COMPARADOR ANTES / DEPOIS (COM CLIP-PATH 100% ALINHADO) */}
              {viewMode === 'split' && photoUrl && (
                <div className="relative w-full h-full overflow-hidden cursor-ew-resize">
                  {/* Fundo: Foto Original (ANTES) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Antes (Original)"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Frente: Imagem com Iluminação 3D cortada perfeitamente por clipPath (DEPOIS) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{
                      clipPath: `inset(0 ${100 - splitPosition}% 0 0)`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={renderedFinalUrl || photoUrl}
                      alt="Depois (Iluminado)"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  {/* Linha Divisória de Arraste */}
                  <div
                    className="absolute top-0 bottom-0 z-30 pointer-events-none flex items-center justify-center"
                    style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="w-[2px] h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    <div className="absolute w-8 h-8 rounded-full bg-white text-zinc-950 shadow-2xl flex items-center justify-center border-2 border-black/30 font-mono text-[11px] font-bold">
                      ↔
                    </div>
                  </div>

                  {/* Badges de Identificação "Antes" e "Depois" */}
                  <div className="absolute bottom-3 left-3 z-30 bg-black/80 px-2.5 py-1 rounded-lg border border-white/15 text-[10px] font-mono font-bold text-amber-300">
                    DEPOIS (LUZ 3D)
                  </div>
                  <div className="absolute bottom-3 right-3 z-30 bg-black/80 px-2.5 py-1 rounded-lg border border-white/15 text-[10px] font-mono font-bold text-zinc-300">
                    ANTES (CRUA)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LADO DIREITO: Ajustes de Iluminação e Presets de Cinema (4 colunas) */}
          <div className="lg:col-span-4 p-4 space-y-4 bg-[#111318] text-xs">
            <div className="pb-2 border-b border-white/[0.08]">
              <h4 className="font-bold text-white uppercase font-mono tracking-wide text-[11px]">
                Controles de Iluminação Real
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Altere o ângulo e a temperatura de cor para ver o efeito na sua foto
              </p>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">Presets Cinematográficos:</span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('key_45')}
                  className={cn(
                    'p-2 rounded-xl border text-left transition-colors',
                    params.colorTemp === '5600K' && params.keyLightAngle === 45
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                  )}
                >
                  Luz 45° Daylight
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('warm_3200')}
                  className={cn(
                    'p-2 rounded-xl border text-left transition-colors',
                    params.colorTemp === '3200K'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                  )}
                >
                  Tungstênio 3200K
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('bicolor_cinema')}
                  className={cn(
                    'p-2 rounded-xl border text-left transition-colors',
                    params.colorTemp === 'bicolor'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                  )}
                >
                  Bicolor Cinema
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyPreset('split_90')}
                  className={cn(
                    'p-2 rounded-xl border text-left transition-colors',
                    params.keyLightAngle === 85
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                  )}
                >
                  Luz Lateral 90°
                </button>
              </div>
            </div>

            {/* Lado da Luz Principal */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block">Lado da Luz Principal:</span>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setParams((p) => ({ ...p, keyLightSide: 'left' }))}
                  className={cn(
                    'py-2 rounded-xl border font-bold transition-colors',
                    params.keyLightSide === 'left'
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                  )}
                >
                  Lado Esquerdo (45°)
                </button>

                <button
                  type="button"
                  onClick={() => setParams((p) => ({ ...p, keyLightSide: 'right' }))}
                  className={cn(
                    'py-2 rounded-xl border font-bold transition-colors',
                    params.keyLightSide === 'right'
                      ? 'bg-white text-zinc-950 border-white'
                      : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-white'
                  )}
                >
                  Lado Direito (45°)
                </button>
              </div>
            </div>

            {/* Slider de Intensidade */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                <span>Intensidade da Luz</span>
                <span className="text-amber-400 font-bold">{params.intensity}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={params.intensity}
                onChange={(e) => setParams((p) => ({ ...p, intensity: Number(e.target.value) }))}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Toggles de Recorte e Preenchimento */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Luz de Recorte (Rim Light)</span>
                <input
                  type="checkbox"
                  checked={params.enableRimLight}
                  onChange={(e) => setParams((p) => ({ ...p, enableRimLight: e.target.checked }))}
                  className="rounded accent-amber-400"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                <span>Luz de Preenchimento (Fill)</span>
                <input
                  type="checkbox"
                  checked={params.enableFillLight}
                  onChange={(e) => setParams((p) => ({ ...p, enableFillLight: e.target.checked }))}
                  className="rounded accent-amber-400"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
