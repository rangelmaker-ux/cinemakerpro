'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Maximize2,
} from 'lucide-react';
import { AIDirectorSpatialData } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

export type LightingPreset = 'key_45' | 'softbox' | 'rim_back' | 'split_90' | 'teal_orange';

interface LightingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  spatialData: AIDirectorSpatialData;
}

export function LightingPreviewModal({
  isOpen,
  onClose,
  photoUrl,
  spatialData,
}: LightingPreviewModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<LightingPreset>('key_45');
  const [intensity, setIntensity] = useState<number>(75);
  const [beamSpread, setBeamSpread] = useState<number>(55); // Difusão do feixe
  const [colorTemp, setColorTemp] = useState<'3200K' | '4300K' | '5600K' | 'cyan' | 'amber'>('5600K');
  const [showOriginal, setShowOriginal] = useState<boolean>(false);
  const [lightPos, setLightPos] = useState<{ x: number; y: number }>({ x: 30, y: 35 });
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 55 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializa posição da luz baseada nos dados calculados pela IA
  useEffect(() => {
    const keyLight = spatialData.elements.find(
      (e) => e.id === 'key-light' || e.type === 'key_light' || e.type === 'fill_light'
    );
    const person = spatialData.elements.find((e) => e.id === 'person' || e.type === 'subject');

    if (keyLight) {
      setLightPos({ x: keyLight.x, y: keyLight.y });
    }
    if (person) {
      setTargetPos({ x: person.x, y: person.y });
    }
  }, [spatialData]);

  // Atualiza parâmetros quando o preset muda
  const applyPreset = (preset: LightingPreset) => {
    setSelectedPreset(preset);
    switch (preset) {
      case 'key_45':
        setLightPos({ x: 28, y: 32 });
        setBeamSpread(50);
        setColorTemp('5600K');
        setIntensity(80);
        break;
      case 'softbox':
        setLightPos({ x: 38, y: 38 });
        setBeamSpread(75);
        setColorTemp('4300K');
        setIntensity(65);
        break;
      case 'rim_back':
        setLightPos({ x: 72, y: 22 });
        setBeamSpread(35);
        setColorTemp('5600K');
        setIntensity(90);
        break;
      case 'split_90':
        setLightPos({ x: 15, y: 50 });
        setBeamSpread(40);
        setColorTemp('3200K');
        setIntensity(85);
        break;
      case 'teal_orange':
        setLightPos({ x: 25, y: 30 });
        setBeamSpread(55);
        setColorTemp('amber');
        setIntensity(80);
        break;
    }
  };

  if (!isOpen) return null;

  // Cor da luz de acordo com Kelvin/RGB
  const getLightColor = () => {
    switch (colorTemp) {
      case '3200K':
        return {
          glow: 'rgba(255, 180, 100, 0.9)',
          beam: 'rgba(255, 195, 130, 0.55)',
          ambient: 'rgba(255, 160, 80, 0.15)',
          name: '3200K (Tungstênio Quente)',
        };
      case '4300K':
        return {
          glow: 'rgba(255, 235, 205, 0.9)',
          beam: 'rgba(255, 240, 220, 0.55)',
          ambient: 'rgba(255, 220, 180, 0.12)',
          name: '4300K (Branco Neutro)',
        };
      case '5600K':
        return {
          glow: 'rgba(230, 245, 255, 0.95)',
          beam: 'rgba(215, 240, 255, 0.58)',
          ambient: 'rgba(200, 230, 255, 0.15)',
          name: '5600K (Luz do Dia / Daylight)',
        };
      case 'cyan':
        return {
          glow: 'rgba(0, 240, 255, 0.95)',
          beam: 'rgba(0, 220, 245, 0.6)',
          ambient: 'rgba(0, 200, 255, 0.2)',
          name: 'Ciano Cinema (Teal Accent)',
        };
      case 'amber':
        return {
          glow: 'rgba(255, 140, 30, 0.95)',
          beam: 'rgba(255, 160, 50, 0.65)',
          ambient: 'rgba(255, 120, 20, 0.22)',
          name: 'Âmbar Dourado (Sunset)',
        };
    }
  };

  const currentColors = getLightColor();

  // Movimentação interativa da luz ao clicar no container
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
    setLightPos({ x: Math.round(x), y: Math.round(y) });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#0f1117] border border-white/[0.1] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header da Simulação */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#13151d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Simulação de Luz Artificial no Ambiente
                </h3>
                <span className="bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px] font-mono px-2 py-0.2 rounded uppercase">
                  Preview Físico
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Visualize a iluminação projetada sobre a foto real antes de montar os tripés.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo Principal: Viewfinder com Luz + Controles Laterais */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          {/* LADO ESQUERDO: Imagem com Projeção da Luz (7 colunas) */}
          <div className="lg:col-span-8 p-4 sm:p-5 flex flex-col gap-3 justify-center items-center bg-[#090a0f]">
            <div
              ref={containerRef}
              onClick={handleImageClick}
              className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-white/15 cursor-crosshair select-none shadow-2xl group"
            >
              {/* Foto de Fundo (Real ou Mock) */}
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt="Ambiente fotografado"
                  className={cn(
                    'w-full h-full object-cover transition-all duration-300',
                    showOriginal ? 'brightness-100 contrast-100' : 'brightness-[0.55] contrast-[1.15]'
                  )}
                />
              ) : (
                <div className="w-full h-full relative bg-gradient-to-b from-[#0c0e15] via-[#121520] to-[#080a0f] flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle, #818cf8 1px, transparent 1px), linear-gradient(to right, #1a1e2e 1px, transparent 1px), linear-gradient(to bottom, #1a1e2e 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />
                  <div className="text-center p-4">
                    <p className="text-xs text-zinc-400 font-mono">
                      (Nenhuma foto do espaço carregada ainda. Usando ambiente de estúdio de referência).
                    </p>
                    <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                      Tire uma foto no botão &quot;Fotografar Ambiente Real&quot; para testar na sua sala real!
                    </span>
                  </div>
                </div>
              )}

              {/* CAMADA DE SIMULAÇÃO DE LUZ ARTIFICIAL (Quando NÃO está no modo Ver Original) */}
              {!showOriginal && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Sombra de Ambiente (Contraste Cinematográfico) */}
                  <div
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.45)',
                      mixBlendMode: 'multiply',
                    }}
                  />

                  {/* Cone / Feixe Direcional de Luz Projetado sobre o Assunto */}
                  <div
                    className="absolute inset-0 transition-all duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(
                        circle at ${lightPos.x}% ${lightPos.y}%,
                        ${currentColors.glow} 0%,
                        ${currentColors.beam} ${Math.round(beamSpread * 0.55)}%,
                        ${currentColors.ambient} ${Math.round(beamSpread * 1.1)}%,
                        transparent ${Math.round(beamSpread * 1.5)}%
                      )`,
                      opacity: (intensity / 100) * 1.25,
                      mixBlendMode: 'screen',
                    }}
                  />

                  {/* Segunda camada suave para dispersão realista de softbox */}
                  <div
                    className="absolute inset-0 transition-all duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(
                        ellipse at ${targetPos.x}% ${targetPos.y}%,
                        ${currentColors.beam} 0%,
                        transparent ${Math.round(beamSpread * 1.4)}%
                      )`,
                      opacity: (intensity / 100) * 0.75,
                      mixBlendMode: 'color-dodge',
                    }}
                  />

                  {/* Se for Contraluz (Rim Light), adiciona reflexo de recorte */}
                  {selectedPreset === 'rim_back' && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(
                          circle at ${targetPos.x}% ${targetPos.y - 12}%,
                          rgba(255, 255, 255, 0.85) 0%,
                          rgba(200, 235, 255, 0.4) 25%,
                          transparent 65%
                        )`,
                        mixBlendMode: 'overlay',
                        opacity: (intensity / 100) * 0.9,
                      }}
                    />
                  )}

                  {/* Se for Teal & Orange, adiciona contraluz ciano em oposição */}
                  {selectedPreset === 'teal_orange' && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `radial-gradient(
                          circle at ${100 - lightPos.x}% ${100 - lightPos.y}%,
                          rgba(0, 220, 255, 0.55) 0%,
                          transparent 45%
                        )`,
                        mixBlendMode: 'screen',
                        opacity: 0.7,
                      }}
                    />
                  )}

                  {/* Marcador Visual Interativo da Fonte de Luz */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ left: `${lightPos.x}%`, top: `${lightPos.y}%` }}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white flex items-center justify-center shadow-lg shadow-amber-500/50 animate-pulse">
                      <SunMedium className="w-4 h-4 text-white" />
                    </div>
                    <span className="absolute top-9 px-2 py-0.5 bg-black/85 text-amber-300 border border-amber-500/30 text-[9px] font-mono rounded whitespace-nowrap">
                      Fonte de Luz ({Math.round(lightPos.x)}%, {Math.round(lightPos.y)}%)
                    </span>
                  </div>

                  {/* Linha indicando o vetor de projeção da luz até o assunto */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1={`${lightPos.x}%`}
                      y1={`${lightPos.y}%`}
                      x2={`${targetPos.x}%`}
                      y2={`${targetPos.y}%`}
                      stroke="rgba(255, 255, 255, 0.4)"
                      strokeWidth="1.5"
                      strokeDasharray="3,3"
                    />
                  </svg>
                </div>
              )}

              {/* HUD Superior no Monitor */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                <div className="bg-black/75 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-2 text-[10px] font-mono text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>SIMULAÇÃO ATIVA: {currentColors.name}</span>
                </div>

                <div className="bg-black/75 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-mono text-amber-300">
                  {showOriginal ? 'FOTO ORIGINAL' : `INTENSIDADE: ${intensity}%`}
                </div>
              </div>

              {/* Dica de interação na imagem */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-lg text-[9px] font-mono text-zinc-400 pointer-events-none">
                Clique em qualquer lugar da imagem para reposicionar a luz
              </div>
            </div>

            {/* Barra de Ações: Comparar Antes/Depois & Redefinir */}
            <div className="w-full flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                className="py-2 px-3.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded-xl text-zinc-200 font-medium flex items-center gap-2 transition-colors active:bg-amber-500/20 active:text-amber-300"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Segure para Ver Foto Original (Antes)</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('key_45')}
                className="py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl text-zinc-400 hover:text-white text-xs flex items-center gap-1.5 transition-colors font-mono"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Redefinir 45°</span>
              </button>
            </div>
          </div>

          {/* LADO DIREITO: Controles de Iluminação (5 colunas) */}
          <div className="lg:col-span-4 p-5 space-y-5 bg-[#111318] flex flex-col justify-between">
            <div className="space-y-4">
              {/* 1. Seleção de Esquema de Luz (Presets Cinematográficos) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400 block tracking-wider">
                  1. Esquema de Iluminação
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {[
                    {
                      id: 'key_45',
                      name: 'Luz Principal 45° (Rembrandt)',
                      desc: 'Triângulo clássico, volume e textura natural',
                    },
                    {
                      id: 'softbox',
                      name: 'Softbox Difuso (Comercial)',
                      desc: 'Luz suave e envolvente para entrevistas B2B',
                    },
                    {
                      id: 'rim_back',
                      name: 'Contraluz / Rim Light (Recorte)',
                      desc: 'Destaque de silhueta e separação do fundo',
                    },
                    {
                      id: 'split_90',
                      name: 'Split Lighting 90° (Dramático)',
                      desc: 'Alto contraste lateral cinematográfico',
                    },
                    {
                      id: 'teal_orange',
                      name: 'Cinema Teal & Orange (RGB)',
                      desc: 'Luz quente no rosto com contra-luz ciano',
                    },
                  ].map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id as LightingPreset)}
                        className={cn(
                          'p-2.5 rounded-xl border text-left transition-all',
                          isSelected
                            ? 'bg-white/[0.08] border-white/30 text-white shadow-sm'
                            : 'bg-black/30 border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{preset.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{preset.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Temperatura de Cor */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-zinc-400 block tracking-wider">
                  2. Temperatura de Cor (Kelvin)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: '3200K', label: '3200K', desc: 'Quente' },
                    { id: '4300K', label: '4300K', desc: 'Neutro' },
                    { id: '5600K', label: '5600K', desc: 'Daylight' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setColorTemp(item.id as any)}
                      className={cn(
                        'py-1.5 px-2 rounded-xl border text-center transition-all',
                        colorTemp === item.id
                          ? 'bg-white text-zinc-950 font-semibold border-white'
                          : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:text-white'
                      )}
                    >
                      <span className="text-xs font-mono block">{item.label}</span>
                      <span className="text-[9px] text-zinc-500 block">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Slider de Intensidade */}
              <div className="space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-medium">Potência da Luz</span>
                  <span className="font-mono text-amber-400">{intensity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                  <span>Preenchimento Leve</span>
                  <span>Luz Direta Potente</span>
                </div>
              </div>

              {/* 4. Abertura do Feixe (Difusor / Grid) */}
              <div className="space-y-1.5 bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300 font-medium">Difusão / Tamanho do Softbox</span>
                  <span className="font-mono text-zinc-400">{beamSpread}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="90"
                  value={beamSpread}
                  onChange={(e) => setBeamSpread(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                  <span>Foco Direto (Spot)</span>
                  <span>Softbox 90cm (Difuso)</span>
                </div>
              </div>
            </div>

            {/* Rodapé dos Controles */}
            <div className="pt-3 border-t border-white/[0.08] space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span>Aplicar Configuração no Set</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
