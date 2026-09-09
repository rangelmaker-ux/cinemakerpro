'use client';

import React, { useState } from 'react';
import { Camera, User, SunMedium, Sparkles, Mic, Sliders, Check } from 'lucide-react';
import { AIDirectorSpatialData, SpatialElement } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface SpatialOverlayProps {
  photoUrl: string | null;
  spatialData: AIDirectorSpatialData;
  onElementClick?: (element: SpatialElement) => void;
  onBlockElement?: (elementId: string) => void;
  onOpenLightingPreview?: () => void;
}

export function SpatialOverlay({
  photoUrl,
  spatialData,
  onElementClick,
  onOpenLightingPreview,
}: SpatialOverlayProps) {
  const [selectedId, setSelectedId] = useState<string>('subject');

  const { elements, lines } = spatialData;
  const getElementById = (id: string) => elements.find((e) => e.id === id);
  const selectedElement = elements.find((e) => e.id === selectedId) || elements[0];

  return (
    <div className="flex flex-col gap-3">
      {/* 1. MONITOR VIEWFINDER: FOTO 100% LIMPA (SEM NENHUM TEXTO POR CIMA) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#0c0e14] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl">
        {/* Marcadores sutis de cantos cinematográficos (sem texto) */}
        <div className="absolute inset-2.5 pointer-events-none z-10">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/40" />
        </div>

        {/* FOTO REAL DO AMBIENTE (Limpa, natural e nítida) */}
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Ambiente real fotografado"
            className="w-full h-full object-cover"
          />
        ) : (
          // Mock de estúdio para quando ainda não houver foto
          <div className="w-full h-full relative bg-gradient-to-b from-[#0a0c12] via-[#0f121a] to-[#08090e] flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #818cf8 1px, transparent 1px), linear-gradient(to right, #1a1e2e 1px, transparent 1px), linear-gradient(to bottom, #1a1e2e 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="text-center space-y-1 z-10 px-4">
              <Camera className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">Nenhuma foto do espaço carregada</p>
              <p className="text-[11px] text-zinc-600 font-mono">Tire uma foto do ambiente para posicionar a equipe</p>
            </div>
          </div>
        )}

        {/* Linhas Vetoriais Conectoras Sutis (Sem nenhum texto sobre a foto) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-15">
          {lines.map((line, idx) => {
            const from = getElementById(line.fromId);
            const to = getElementById(line.toId);
            if (!from || !to) return null;

            return (
              <line
                key={`line-${idx}`}
                x1={`${from.x}%`}
                y1={`${from.y}%`}
                x2={`${to.x}%`}
                y2={`${to.y}%`}
                stroke={line.color}
                strokeWidth="1.5"
                strokeDasharray={line.dashed ? '4,4' : 'none'}
                strokeOpacity="0.7"
              />
            );
          })}
        </svg>

        {/* PONTOS PREENCHIDOS COM CORES (Sem nenhum texto na frente da foto) */}
        {elements.map((el) => {
          const isSelected = selectedId === el.id;

          const getIcon = () => {
            switch (el.type) {
              case 'camera':
                return <Camera className="w-3.5 h-3.5" />;
              case 'subject':
                return <User className="w-3.5 h-3.5" />;
              case 'key_light':
                return <SunMedium className="w-3.5 h-3.5" />;
              case 'back_light':
                return <Sparkles className="w-3.5 h-3.5" />;
              case 'mic':
                return <Mic className="w-3.5 h-3.5" />;
              default:
                return <Camera className="w-3.5 h-3.5" />;
            }
          };

          return (
            <button
              key={el.id}
              type="button"
              onClick={() => {
                setSelectedId(el.id);
                onElementClick?.(el);
              }}
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={cn(
                'absolute z-20 transition-all duration-200 focus:outline-none group',
                isSelected ? 'scale-125 z-30' : 'hover:scale-110 opacity-90 hover:opacity-100'
              )}
              title={el.label}
            >
              {/* Ponto Circular Luminoso Colorido (Sem texto poluindo a foto) */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-white border-2 shadow-xl transition-all',
                  isSelected
                    ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.6)] ring-2 ring-white/50 ring-offset-2 ring-offset-black'
                    : 'border-white/50 shadow-md'
                )}
                style={{
                  backgroundColor: el.color,
                }}
              >
                {getIcon()}
              </div>
            </button>
          );
        })}

        {/* Botão Flutuante Discreto para Abrir Preview 3D */}
        {photoUrl && onOpenLightingPreview && (
          <button
            type="button"
            onClick={onOpenLightingPreview}
            className="absolute bottom-3 right-3 z-30 px-3 py-1.5 bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/50 text-amber-200 rounded-xl text-xs font-mono flex items-center gap-1.5 backdrop-blur-md shadow-xl transition-all active:scale-95"
            title="Abrir Simulação 3D com iluminação realista e antes/depois"
          >
            <SunMedium className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Simular Iluminação 3D</span>
          </button>
        )}
      </div>

      {/* 2. LEGENDA DE CORES EMBAIXO DA FOTO (Exatamente como o usuário pediu) */}
      <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Legenda de Posicionamento no Espaço
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Toque em uma cor para ver detalhes</span>
        </div>

        {/* Grade com os Pontos e Cores Explicados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {elements.map((el) => {
            const isSelected = selectedId === el.id;

            return (
              <button
                key={el.id}
                type="button"
                onClick={() => setSelectedId(el.id)}
                className={cn(
                  'p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all',
                  isSelected
                    ? 'bg-white/[0.08] border-white/40 shadow-sm ring-1 ring-white/20'
                    : 'bg-black/30 border-white/[0.05] hover:border-white/20'
                )}
              >
                {/* Ponto da Cor */}
                <div
                  className="w-4 h-4 rounded-full shrink-0 mt-0.5 border border-white/40 shadow-sm"
                  style={{ backgroundColor: el.color }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-white truncate">{el.label}</span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-2">
                    {el.details}
                  </p>
                  {el.distanceLabel && (
                    <span className="text-[10px] font-mono text-amber-400 block mt-1">
                      Distância: {el.distanceLabel}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalhe Específico do Ponto Selecionado */}
        {selectedElement && (
          <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 font-mono text-[11px]">Elemento em foco:</span>
              <span className="font-semibold text-white">{selectedElement.label}</span>
              {selectedElement.heightLabel && (
                <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] px-2 py-0.5 rounded">
                  Altura: {selectedElement.heightLabel}
                </span>
              )}
            </div>
            <p className="text-zinc-300 text-[11px]">
              {selectedElement.details}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
