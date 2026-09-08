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
      {/* Container visual da Foto + Overlay */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-surface rounded-2xl overflow-hidden border border-surface-border shadow-2xl">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Ambiente real fotografado"
            className="w-full h-full object-cover brightness-[0.75] contrast-[1.05]"
          />
        ) : (
          // Mock de ambiente com grade de perspectiva realista
          <div className="w-full h-full relative bg-gradient-to-b from-[#0e121a] via-[#121622] to-[#0a0d14] flex items-center justify-center">
            {/* Grade de perspectiva isométrica */}
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1f293d 1px, transparent 1px), linear-gradient(to bottom, #1f293d 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            {/* Indicador de parede de fundo */}
            <div className="absolute top-4 left-6 right-6 border-b border-dashed border-slate-700/60 pb-1 flex justify-between text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              <span>Parede de Fundo (1,5m do personagem)</span>
              <span>Luz Natural / Janela</span>
            </div>
          </div>
        )}

        {/* Camada SVG dos Vetores e Linhas de Visada */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Gradiente do feixe de luz principal */}
            <linearGradient id="lightBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.1" />
            </linearGradient>
            {/* Gradiente da visada da câmera */}
            <linearGradient id="cameraSight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
            </linearGradient>
          </defs>

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
                  strokeWidth="2"
                  strokeDasharray={line.dashed ? '5,5' : 'none'}
                  strokeOpacity="0.85"
                />
                {line.label && (
                  <g transform={`translate(${midX * 3.5}, ${midY * 2.5})`}>
                    <rect
                      x={`${midX}%`}
                      y={`${midY}%`}
                      width="54"
                      height="18"
                      rx="9"
                      fill="#080a0f"
                      fillOpacity="0.9"
                      stroke={line.color}
                      strokeWidth="1"
                      transform="translate(-27, -9)"
                    />
                    <text
                      x={`${midX}%`}
                      y={`${midY}%`}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
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

        {/* Marcadores Interativos na Foto */}
        {elements.map((el) => {
          const isSelected = selectedId === el.id;

          const renderIcon = () => {
            switch (el.type) {
              case 'camera':
                return <Camera className="w-4 h-4" />;
              case 'subject':
                return <User className="w-4 h-4" />;
              case 'key_light':
                return <SunMedium className="w-4 h-4" />;
              case 'back_light':
                return <Sparkles className="w-4 h-4" />;
              case 'mic':
                return <Mic className="w-3.5 h-3.5" />;
              default:
                return <Eye className="w-4 h-4" />;
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
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10 transition-transform duration-200 active:scale-95"
            >
              {/* Anel de destaque com pulso */}
              <div
                className={cn(
                  'relative flex items-center justify-center rounded-full transition-all duration-300',
                  isSelected ? 'w-11 h-11 ring-4 ring-white/30 scale-110 shadow-lg' : 'w-9 h-9 opacity-95 hover:scale-105'
                )}
                style={{ backgroundColor: el.color }}
              >
                <div className="text-white drop-shadow-md">{renderIcon()}</div>

                {/* Badge flutuante de identificação rápida */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 backdrop-blur-sm border border-surface-border text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md pointer-events-none">
                  {el.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cartão de Detalhes do Elemento Selecionado */}
      {selectedElement && (
        <div className="bg-surface-raised border border-surface-border rounded-2xl p-3.5 transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: selectedElement.color }}
              >
                {selectedElement.type === 'camera' && <Camera className="w-4 h-4" />}
                {selectedElement.type === 'subject' && <User className="w-4 h-4" />}
                {selectedElement.type === 'key_light' && <SunMedium className="w-4 h-4" />}
                {selectedElement.type === 'back_light' && <Sparkles className="w-4 h-4" />}
                {selectedElement.type === 'mic' && <Mic className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-tight">
                  {selectedElement.label}
                </h4>
                <p className="text-[11px] text-brand-light font-medium">
                  {selectedElement.details}
                </p>
              </div>
            </div>

            {/* Ação: Não consigo colocar aqui */}
            {onBlockElement && (
              <button
                type="button"
                onClick={() => onBlockElement(selectedElement.id)}
                className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 whitespace-nowrap"
                title="A IA encontrará outra posição alternativa instantaneamente"
              >
                <Move className="w-3 h-3" />
                <span>Mudar posição</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-surface-border/60 text-[11px]">
            {selectedElement.distanceLabel && (
              <div className="bg-surface/70 px-2.5 py-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                  Distância
                </span>
                <span className="font-semibold text-slate-200">
                  {selectedElement.distanceLabel}
                </span>
              </div>
            )}
            {selectedElement.heightLabel && (
              <div className="bg-surface/70 px-2.5 py-1.5 rounded-lg">
                <span className="text-slate-400 block text-[9px] uppercase font-bold tracking-wider">
                  Altura
                </span>
                <span className="font-semibold text-slate-200">
                  {selectedElement.heightLabel}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
