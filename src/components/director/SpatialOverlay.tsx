'use client';

import React, { useState } from 'react';
import { Camera, User, SunMedium, Sparkles, Mic, Move, Eye, Info } from 'lucide-react';
import { AIDirectorSpatialData, SpatialElement } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface SpatialOverlayProps {
  photoUrl: string | null;
  spatialData: AIDirectorSpatialData;
  onElementClick?: (element: SpatialElement) => void;
  onBlockElement?: (elementId: string) => void;
}

export function SpatialOverlay({
  photoUrl,
  spatialData,
  onElementClick,
  onBlockElement,
}: SpatialOverlayProps) {
  const [selectedId, setSelectedId] = useState<string>('camera');

  const { elements, lines } = spatialData;

  const getElementById = (id: string) => elements.find((e) => e.id === id);

  const selectedElement = elements.find((e) => e.id === selectedId) || elements[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Viewfinder Monitor Frame */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-surface rounded-2xl overflow-hidden border border-surface-border shadow-2xl">
        {/* Marcadores de Enquadramento Cinematográfico (HUD de Câmera) */}
        <div className="absolute inset-3 pointer-events-none border border-white/10 rounded-xl z-20">
          {/* Marcadores de cantos */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40" />

          {/* Crosshair central sutil */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-25">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white" />
          </div>

          {/* HUD Status Bar */}
          <div className="absolute top-2 left-3 right-3 flex items-center justify-between text-[9px] font-mono text-white/60 tracking-wider">
            <span>REC • 24 FPS • 1/50</span>
            <span className="text-amber-400 font-bold uppercase">DIRETOR IA ATIVO</span>
          </div>
        </div>

        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Ambiente real fotografado"
            className="w-full h-full object-cover brightness-[0.7] contrast-[1.1]"
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
            <div className="absolute top-4 left-6 right-6 border-b border-dashed border-slate-700/50 pb-1 flex justify-between text-[9px] text-slate-500 uppercase font-mono tracking-widest">
              <span>Parede de Fundo (1,5m do personagem)</span>
              <span>Luz Natural</span>
            </div>
          </div>
        )}

        {/* Camada SVG dos Vetores */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {lines.map((line, idx) => {
            const from = getElementById(line.fromId);
            const to = getElementById(line.toId);
            if (!from || !to) return null;

            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            return (
              <g key={`line-${idx}`}>
                <line
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke={line.color}
                  strokeWidth="1.5"
                  strokeDasharray={line.dashed ? '4,4' : 'none'}
                  strokeOpacity="0.8"
                />
                {line.label && (
                  <g transform={`translate(${midX * 3.5}, ${midY * 2.5})`}>
                    <rect
                      x={`${midX}%`}
                      y={`${midY}%`}
                      width="50"
                      height="16"
                      rx="8"
                      fill="#090a0f"
                      fillOpacity="0.95"
                      stroke={line.color}
                      strokeWidth="1"
                      transform="translate(-25, -8)"
                    />
                    <text
                      x={`${midX}%`}
                      y={`${midY}%`}
                      fill="#f8fafc"
                      fontSize="8.5"
                      fontWeight="600"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {line.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Marcadores Interativos */}
        {elements.map((el) => {
          const isSelected = selectedId === el.id;

          const renderIcon = () => {
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
                return <Mic className="w-3 h-3" />;
              default:
                return <Eye className="w-3.5 h-3.5" />;
            }
          };

          return (
            <div
              key={el.id}
              onClick={() => {
                setSelectedId(el.id);
                if (onElementClick) onElementClick(el);
              }}
              style={{ left: `${el.x}%`, top: `${el.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 transition-transform duration-200 active:scale-95"
            >
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-all duration-200 shadow-md',
                  isSelected
                    ? 'w-10 h-10 ring-2 ring-white scale-110 shadow-lg'
                    : 'w-8 h-8 opacity-90 hover:scale-105'
                )}
                style={{ backgroundColor: el.color }}
              >
                <div className="text-white drop-shadow-sm">{renderIcon()}</div>

                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 border border-white/15 text-white text-[9px] font-semibold px-2 py-0.2 rounded-full shadow-sm pointer-events-none">
                  {el.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cartão de Detalhes do Elemento Selecionado */}
      {selectedElement && (
        <div className="bg-surface border border-surface-border rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
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
              <h4 className="text-xs font-bold text-white truncate">
                {selectedElement.label}
              </h4>
              <p className="text-[11px] text-slate-300 font-medium truncate">
                {selectedElement.details}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBlockElement && (
              <button
                type="button"
                onClick={() => onBlockElement(selectedElement.id)}
                className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 px-2.5 py-1.5 rounded-xl transition-colors active:scale-98"
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
