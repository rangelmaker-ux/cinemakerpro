'use client';

import React, { useState } from 'react';
import { Camera, User, SunMedium, Sparkles, Mic, Move, Eye, Sliders, Zap } from 'lucide-react';
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
  onBlockElement,
  onOpenLightingPreview,
}: SpatialOverlayProps) {
  const [selectedId, setSelectedId] = useState<string>('camera');

  const { elements, lines } = spatialData;

  const getElementById = (id: string) => elements.find((e) => e.id === id);
  const selectedElement = elements.find((e) => e.id === selectedId) || elements[0];

  const isSelectedLight =
    selectedElement?.type === 'key_light' ||
    selectedElement?.type === 'back_light' ||
    selectedElement?.type === 'fill_light';

  return (
    <div className="flex flex-col gap-3">
      {/* Viewfinder Monitor Frame */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#0c0e14] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl">
        {/* HUD de Monitor de Set */}
        <div className="absolute inset-3 pointer-events-none z-20">
          {/* Marcadores sutis de cantos cinematográficos */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/30" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/30" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/30" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/30" />

          {/* HUD Status Bar */}
          <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[9px] font-mono text-white/70 tracking-wider">
            <span>REC • 24 FPS • 1/50</span>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold uppercase">MAPA TÉCNICO DE SET</span>
            </div>
          </div>
        </div>

        {/* Botão Flutuante de Atalho para Preview de Luz Artificial */}
        {photoUrl && onOpenLightingPreview && (
          <button
            type="button"
            onClick={onOpenLightingPreview}
            className="absolute bottom-3 right-3 z-30 px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-[11px] font-mono flex items-center gap-2 backdrop-blur-md shadow-lg transition-all active:scale-95"
            title="Gerar Preview com IA e Profundidade 3D na foto do ambiente"
          >
            <SunMedium className="w-3.5 h-3.5 text-amber-400" />
            <span>Preview IA com Profundidade 3D</span>
          </button>
        )}

        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Ambiente real fotografado"
            className="w-full h-full object-cover"
          />
        ) : (
          // Mock de estúdio com perspectiva limpa
          <div className="w-full h-full relative bg-gradient-to-b from-[#0a0c12] via-[#0f121a] to-[#08090e] flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #818cf8 1px, transparent 1px), linear-gradient(to right, #1a1e2e 1px, transparent 1px), linear-gradient(to bottom, #1a1e2e 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute top-4 left-6 right-6 border-b border-dashed border-zinc-700/50 pb-1 flex justify-between text-[9px] text-zinc-500 uppercase font-mono tracking-widest">
              <span>Parede de Fundo (1,5m do personagem)</span>
              <span>Luz Natural</span>
            </div>
          </div>
        )}

        {/* Camada SVG dos Vetores Limpos */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
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
                strokeOpacity="0.8"
              />
            );
          })}
        </svg>

        {/* Rótulos das Linhas em Camada HTML Absoluta (Sem Glitches de SVG) */}
        {lines.map((line, idx) => {
          const from = getElementById(line.fromId);
          const to = getElementById(line.toId);
          if (!from || !to || !line.label) return null;

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <div
              key={`label-${idx}`}
              style={{
                left: `${midX}%`,
                top: `${midY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-20 pointer-events-none px-2 py-0.5 rounded-full bg-black/85 border border-white/15 text-[9px] font-mono text-zinc-300 shadow-md whitespace-nowrap"
            >
              {line.label}
            </div>
          );
        })}

        {/* Marcadores dos Elementos Físicos */}
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
                'absolute z-20 flex flex-col items-center group transition-transform duration-200',
                isSelected ? 'scale-115 z-30' : 'hover:scale-105'
              )}
            >
              {/* Círculo do Marcador */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white border-2 shadow-lg transition-all',
                  isSelected
                    ? 'border-white shadow-xl ring-2 ring-white/40 ring-offset-2 ring-offset-black'
                    : 'border-white/30'
                )}
                style={{
                  backgroundColor: el.color,
                }}
              >
                {getIcon()}
              </div>

              {/* Rótulo */}
              <span
                className={cn(
                  'mt-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-medium tracking-tight whitespace-nowrap border shadow-sm transition-colors',
                  isSelected
                    ? 'bg-white text-zinc-950 border-white font-bold'
                    : 'bg-[#090a0f]/90 text-zinc-300 border-white/10'
                )}
              >
                {el.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cartão de Detalhes do Elemento Selecionado */}
      {selectedElement && (
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: selectedElement.color }}
            >
              {selectedElement.type === 'camera' && <Camera className="w-4 h-4" />}
              {selectedElement.type === 'subject' && <User className="w-4 h-4" />}
              {selectedElement.type === 'key_light' && <SunMedium className="w-4 h-4" />}
              {selectedElement.type === 'back_light' && <Sparkles className="w-4 h-4" />}
              {selectedElement.type === 'mic' && <Mic className="w-4 h-4" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white truncate">
                  {selectedElement.label}
                </h4>
                {isSelectedLight && (
                  <span className="text-[9px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.2 rounded">
                    Luz Ativa
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium truncate">
                {selectedElement.details}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {isSelectedLight && onOpenLightingPreview && (
              <button
                type="button"
                onClick={onOpenLightingPreview}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all active:scale-95"
              >
                <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                <span>Ver Luz na Foto</span>
              </button>
            )}

            {onBlockElement && (
              <button
                type="button"
                onClick={() => onBlockElement(selectedElement.id)}
                className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/10 px-2.5 py-1.5 rounded-xl transition-colors"
                title="A IA encontra outra posição livre"
              >
                <Move className="w-3 h-3" />
                <span>Mudar</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
