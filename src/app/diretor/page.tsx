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
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import { generateAIDirectorLayout } from '@/lib/ai/provider';
import { AIDirectorSpatialData } from '@/lib/ai/types';
import { DirectorMode, VideoType } from '@/types/database';
import { SpatialOverlay } from '@/components/director/SpatialOverlay';
import { WhyModal } from '@/components/director/WhyModal';
import { FramingModal } from '@/components/director/FramingModal';
import { ChecklistModal } from '@/components/director/ChecklistModal';
import { ShotPlanModal } from '@/components/director/ShotPlanModal';
import { cn } from '@/lib/utils';

function DirectorContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const isQuick = searchParams.get('quick') === 'true';

  const { clients, equipments, kits } = useAppStore();

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

  // Modais
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isFramingOpen, setIsFramingOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isShotPlanOpen, setIsShotPlanOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Recalcular quando o modo muda ou quando uma zona é bloqueada
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
    }, 350);

    return () => clearTimeout(timer);
  }, [mode, blockedZones, equipments]);

  const handleBlockElement = (elementId: string) => {
    const el = spatialData.elements.find((e) => e.id === elementId);
    if (!el) return;

    setBlockedZones((prev) => [...prev, { id: elementId, x: el.x, y: el.y }]);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Header Contextual */}
      <div className="bg-surface border border-surface-border rounded-2xl p-3.5 shadow-sm">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-brand-light">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Diretor de Gravação IA</span>
          </div>
          <span className="bg-surface-raised px-2 py-0.5 rounded-full border border-surface-border text-slate-300">
            {selectedClient?.name || 'Cliente'}
          </span>
        </div>

        {/* Stepper de progresso */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 overflow-x-auto py-1 font-medium">
          <span className="text-emerald-400">Briefing</span>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="text-emerald-400">Equipamentos</span>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="text-white font-bold bg-brand/20 px-2 py-0.5 rounded-md border border-brand/40">
            Ambiente & IA
          </span>
          <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="text-slate-500">Takes</span>
        </div>
      </div>

      {/* Seletor dos 3 Modos de Direção */}
      <div className="grid grid-cols-3 gap-1.5 bg-surface p-1 rounded-2xl border border-surface-border">
        {(
          [
            { id: 'recomendado', label: 'Recomendado', desc: 'Melhor Equilíbrio' },
            { id: 'rapido', label: 'Rápido', desc: 'Pouco Equipamento' },
            { id: 'criativo', label: 'Criativo', desc: 'Cinematográfico' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              'py-2 px-1 rounded-xl text-center transition-all active:scale-95',
              mode === m.id
                ? 'bg-brand text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white font-medium hover:bg-surface-raised'
            )}
          >
            <span className="block text-xs leading-tight">{m.label}</span>
            <span className="block text-[9px] opacity-80 mt-0.5">{m.desc}</span>
          </button>
        ))}
      </div>

      {/* Componente Central: Foto do Ambiente + Overlay Visual Interativo */}
      <div className="relative">
        {isRecalculating && (
          <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-xs rounded-2xl flex items-center justify-center">
            <div className="bg-surface px-4 py-2 rounded-xl border border-surface-border flex items-center gap-2 text-xs font-bold text-white shadow-xl">
              <Sparkles className="w-4 h-4 text-brand-light animate-spin" />
              <span>IA recalculando posições...</span>
            </div>
          </div>
        )}

        <SpatialOverlay
          photoUrl={photoUrl}
          spatialData={spatialData}
          onBlockElement={handleBlockElement}
        />
      </div>

      {/* Botões de Ação Imediata na Foto */}
      <div className="flex items-center gap-2">
        <label className="flex-1 py-2.5 bg-surface-raised hover:bg-slate-800 text-slate-200 font-bold text-xs rounded-xl border border-surface-border flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-95">
          <Upload className="w-3.5 h-3.5 text-brand-light" />
          <span>{photoUrl ? 'Trocar Foto do Espaço' : 'Fotografar Ambiente Real'}</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </label>

        <button
          type="button"
          onClick={() => setIsWhyOpen(true)}
          className="py-2.5 px-3 bg-surface-raised hover:bg-slate-800 text-brand-light font-bold text-xs rounded-xl border border-surface-border flex items-center gap-1.5 transition-colors active:scale-95"
          title="Ver o porquê desta recomendação"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Por quê?</span>
        </button>
      </div>

      {/* AVISO DE EQUIPAMENTOS REAIS RECOMENDADOS */}
      <div className="bg-surface border border-surface-border rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            Configuração Ideal com Seu Kit:
          </h4>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            100% no seu inventário
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="bg-surface-raised p-2.5 rounded-xl border border-surface-border/80">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Lente Recomendada
            </span>
            <span className="text-slate-200 font-bold">
              {spatialData.cameraSettings.lensName}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {spatialData.cameraSettings.shotType}
            </p>
          </div>

          <div className="bg-surface-raised p-2.5 rounded-xl border border-surface-border/80">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Luz Principal
            </span>
            <span className="text-slate-200 font-bold">
              {spatialData.lightingSettings.keyLightAngle} • Altura {spatialData.lightingSettings.keyLightHeight}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {spatialData.lightingSettings.keyLightModifier}
            </p>
          </div>

          <div className="bg-surface-raised p-2.5 rounded-xl border border-surface-border/80">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Microfone & Áudio
            </span>
            <span className="text-slate-200 font-bold">
              {spatialData.audioSettings.micType}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {spatialData.audioSettings.position}
            </p>
          </div>

          <div className="bg-surface-raised p-2.5 rounded-xl border border-surface-border/80">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Distância da Parede
            </span>
            <span className="text-slate-200 font-bold">
              {spatialData.subjectSettings.distanceFromWall}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {spatialData.subjectSettings.orientation}
            </p>
          </div>
        </div>
      </div>

      {/* FERRAMENTAS DO SET DE GRAVAÇÃO */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setIsFramingOpen(true)}
          className="p-3 bg-surface hover:bg-surface-raised border border-surface-border rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 group"
        >
          <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-white">Testar Enquadramento</span>
          <span className="text-[9px] text-slate-400">Headroom & Altura</span>
        </button>

        <button
          type="button"
          onClick={() => setIsShotPlanOpen(true)}
          className="p-3 bg-surface hover:bg-surface-raised border border-surface-border rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <Film className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-white">Plano de Cenas</span>
          <span className="text-[9px] text-slate-400">4 Takes Sugeridos</span>
        </button>

        <button
          type="button"
          onClick={() => setIsChecklistOpen(true)}
          className="p-3 bg-surface hover:bg-surface-raised border border-surface-border rounded-2xl flex flex-col items-center justify-center text-center transition-all active:scale-95 group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold text-white">Checklist Set</span>
          <span className="text-[9px] text-slate-400">Status & Baterias</span>
        </button>
      </div>

      {/* Modais Interativos */}
      <WhyModal
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        spatialData={spatialData}
      />
      <FramingModal
        isOpen={isFramingOpen}
        onClose={() => setIsFramingOpen(false)}
      />
      <ChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
      />
      <ShotPlanModal
        isOpen={isShotPlanOpen}
        onClose={() => setIsShotPlanOpen(false)}
        takes={spatialData.takesPlan}
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
          <span>Iniciando Diretor de Gravação IA...</span>
        </div>
      }
    >
      <DirectorContent />
    </Suspense>
  );
}

