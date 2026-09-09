'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
  SunMedium,
  Layers,
  Sparkles,
  User,
  Mic,
  MessageSquare,
  BookOpen,
  Send,
  RefreshCw,
  ChevronRight,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import {
  executeProductionTeamAI,
  GeneralDirectorOutput,
  SharedProjectContext,
} from '@/lib/ai/ai-orchestrator';
import { AIDirectorSpatialData, FramingTestFeedback, SpatialElement, VectorLine } from '@/lib/ai/types';
import { DirectorMode, VideoType } from '@/types/database';
import { SpatialOverlay } from '@/components/director/SpatialOverlay';
import { WhyModal } from '@/components/director/WhyModal';
import { LightingPreviewModal } from '@/components/director/LightingPreviewModal';
import { cn } from '@/lib/utils';

function DirectorContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const isQuick = searchParams.get('quick') === 'true';

  const { clients, projects, equipments, kits } = useAppStore();

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0];
  const activeProject = projects.find((p) => p.client_id === selectedClient?.id) || projects[0];
  const activeKit = kits.find((k) => k.is_default) || kits[0];

  // Modos de direção
  const [mode, setMode] = useState<DirectorMode>(isQuick ? 'rapido' : 'recomendado');
  const [videoType, setVideoType] = useState<VideoType>(activeProject?.video_type || 'institucional');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [blockedZones, setBlockedZones] = useState<{ id: string; x: number; y: number }[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [userFeedbackInput, setUserFeedbackInput] = useState('');
  const [activeRefinementPrompt, setActiveRefinementPrompt] = useState<string>('');
  const [teamVersion, setTeamVersion] = useState(1);

  // Gaveta ativa: 4 Agentes de IA + Takes
  const [activeTab, setActiveTab] = useState<'diretor_geral' | 'roteiro' | 'cena' | 'fotografia' | 'takes'>('diretor_geral');
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isLightingPreviewOpen, setIsLightingPreviewOpen] = useState(false);

  // Takes concluídos e checklist
  const [doneTakes, setDoneTakes] = useState<number[]>([]);
  const [checks, setChecks] = useState<{ id: string; label: string; done: boolean }[]>([
    { id: 'c1', label: 'Baterias da câmera e luzes 100% carregadas', done: true },
    { id: 'c2', label: 'Cartão SD formatado e com espaço livre', done: true },
    { id: 'c3', label: 'Lente limpa sem poeira ou marcas de dedo', done: true },
    { id: 'c4', label: 'Luz principal a 45° sem queimar altas luzes', done: false },
    { id: 'c5', label: 'Lapela posicionado a 15cm da boca sem atrito', done: false },
    { id: 'c6', label: 'Ruído de ar-condicionado ou geladeira desligado', done: false },
    { id: 'c7', label: 'Recuo do sujeito a pelo menos 1,5m da parede', done: false },
    { id: 'c8', label: 'Take principal gravado com foco cravado nos olhos', done: false },
  ]);

  // Contexto Compartilhado de Produção (Seção 4 do Master Prompt)
  const sharedContext = useMemo<SharedProjectContext>(() => {
    const userLenses = equipments.filter((e) => e.category === 'lens');
    const userLights = equipments.filter((e) => e.category === 'lighting');
    const userAudio = equipments.filter((e) => e.category === 'audio');

    return {
      project: {
        id: activeProject?.id || 'proj-1',
        title: activeProject?.title || 'Produção Audiovisual',
        videoType: videoType,
        mode: mode,
        format: '16:9',
      },
      client: {
        id: selectedClient?.id,
        name: selectedClient?.name || 'Cliente',
        company: selectedClient?.company,
        segment: 'Audiovisual / Negócios',
      },
      briefing: {
        objective: activeProject?.objective || 'Apresentação comercial e conexão humana com a audiência',
        audience: 'Clientes e parceiros estratégicos',
        tone: mode === 'criativo' ? 'Cinematográfico e envolvente' : 'Profissional e acolhedor',
        keyMessage: 'Excelência técnica e entrega de valor comprovada',
        targetEmotion: 'Confiança e desejo de transformação',
      },
      video_type: videoType,
      platform: videoType === 'reels' ? 'reels' : 'institucional',
      format: videoType === 'reels' ? '9:16' : '16:9',
      duration: videoType === 'reels' ? '45s' : '90s',
      environment: {
        photoUrl: photoUrl,
        type: 'interno',
        ambientLight: 'Luz natural de janela mista',
        wallDistanceMeters: 1.5,
      },
      equipment: equipments,
      lenses: userLenses,
      lighting: userLights,
      audio: userAudio,
      style: mode === 'criativo' ? 'cinematografico' : 'comercial',
      constraints: {
        blockedZones: blockedZones,
        roomSize: 'medio',
        singleLightOnly: userLights.length <= 1,
      },
      user_preferences: {
        customPrompt: activeRefinementPrompt || undefined,
        preferredAngle: blockedZones.some((b) => b.x < 40) ? '45_right' : '45_left',
      },
    };
  }, [selectedClient, activeProject, equipments, videoType, mode, photoUrl, blockedZones, activeRefinementPrompt]);

  // Execução da Equipe Criativa de IA (4 Agentes Orquestrados)
  const [teamOutput, setTeamOutput] = useState<GeneralDirectorOutput>(() =>
    executeProductionTeamAI(sharedContext)
  );

  // Recalcula a orquestração quando parâmetros mudam
  useEffect(() => {
    setIsRecalculating(true);
    const timer = setTimeout(() => {
      const output = executeProductionTeamAI(sharedContext);
      setTeamOutput(output);
      setIsRecalculating(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [sharedContext]);

  // Converte a saída da equipe de IA para o formato do Viewfinder e SVG
  const spatialData = useMemo<AIDirectorSpatialData>(() => {
    const vd = teamOutput.visual_direction_data;
    const isLeft = vd.lighting.key.side === 'left';

    const elements: SpatialElement[] = [
      {
        id: 'subject',
        type: 'subject',
        label: 'Personagem (1,5m da parede)',
        x: teamOutput.scene_direction.subject_position.spatial_x_pct,
        y: teamOutput.scene_direction.subject_position.spatial_y_pct,
        facingAngle: 180,
        distanceLabel: '1,5 m de recuo da parede de fundo',
        heightLabel: 'Linha dos olhos',
        details: vd.subject.body_orientation,
        icon: 'User',
        color: '#8b5cf6',
      },
      {
        id: 'camera',
        type: 'camera',
        label: `Câmera: ${vd.lens.model}`,
        x: 50,
        y: mode === 'rapido' ? 74 : 78,
        distanceLabel: `${vd.camera.distance_m}m do personagem`,
        heightLabel: `${vd.camera.height_m}m (altura dos olhos)`,
        details: `Lente ${vd.lens.focal_length_mm}mm • ${vd.lens.recommended_aperture} • ${vd.lens.shutter_speed}`,
        icon: 'Camera',
        color: '#3b82f6',
      },
      {
        id: 'key_light',
        type: 'key_light',
        label: `Luz Principal 45° (${vd.lighting.key.modifier})`,
        x: isLeft ? 28 : 72,
        y: 54,
        distanceLabel: '1,35m da pessoa • 1,5m da parede',
        heightLabel: vd.lighting.key.height,
        details: `${vd.lighting.key.color_temp} • ${vd.lighting.key.intensity_pct}% intensidade`,
        icon: 'SunMedium',
        color: '#f59e0b',
      },
      {
        id: 'back_light',
        type: 'back_light',
        label: 'Contra-luz (Recorte a 1,5m da parede)',
        x: isLeft ? 74 : 26,
        y: 32,
        distanceLabel: '1,5m da parede de fundo',
        heightLabel: '1,70m de altura',
        details: 'Desenha os ombros e separa o cabelo do fundo escuro',
        icon: 'Sparkles',
        color: '#06b6d4',
      },
      {
        id: 'mic',
        type: 'mic',
        label: vd.audio.mic_model,
        x: 50,
        y: teamOutput.scene_direction.subject_position.spatial_y_pct + 5,
        distanceLabel: '15cm da boca (esterno)',
        heightLabel: 'No peito sem atrito',
        details: vd.audio.recommendation,
        icon: 'Mic',
        color: '#10b981',
      },
    ];

    const lines: VectorLine[] = [
      {
        fromId: 'camera',
        toId: 'subject',
        type: 'sight',
        label: `${vd.camera.distance_m}m POV`,
        color: '#3b82f6',
        dashed: false,
      },
      {
        fromId: 'key_light',
        toId: 'subject',
        type: 'light_beam',
        label: 'Feixe 45° Suave',
        color: '#f59e0b',
        dashed: true,
      },
      {
        fromId: 'back_light',
        toId: 'subject',
        type: 'light_beam',
        label: 'Recorte 135°',
        color: '#06b6d4',
        dashed: true,
      },
    ];

    return {
      elements,
      lines,
      cameraSettings: {
        lensName: vd.lens.model,
        focalLength: `${vd.lens.focal_length_mm}mm`,
        aperture: vd.lens.recommended_aperture,
        height: `${vd.camera.height_m}m (linha dos olhos)`,
        framing: vd.camera.framing,
        shotType: vd.camera.shot_type,
      },
      lightingSettings: {
        keyLightAngle: `${vd.lighting.key.angle_deg}° (${vd.lighting.key.side === 'left' ? 'Esquerda' : 'Direita'})`,
        keyLightHeight: vd.lighting.key.height,
        keyLightModifier: vd.lighting.key.modifier,
        backLightNotes: 'Recuo de 1,5m da parede de fundo para desenho de contorno.',
      },
      audioSettings: {
        micType: vd.audio.mic_model,
        position: vd.audio.position,
        cautions: vd.audio.recommendation,
      },
      subjectSettings: {
        distanceFromWall: '1,5 m de recuo da parede de fundo',
        orientation: vd.subject.body_orientation,
      },
      avoids: teamOutput.warnings,
      whyExplanation: teamOutput.creative_direction.executive_summary,
      takesPlan: teamOutput.takes.map((t) => ({
        sceneNumber: t.sceneNumber,
        title: t.title,
        framing: t.framing,
        movement: t.cameraMovement,
        durationSec: t.durationSec,
        description: t.description,
      })),
    };
  }, [teamOutput, mode]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleBlockElement = (elementId: string) => {
    const el = spatialData.elements.find((e) => e.id === elementId);
    if (!el) return;
    setBlockedZones((prev) => [...prev, { id: elementId, x: el.x, y: el.y }]);
  };

  const handleResetBlocked = () => {
    setBlockedZones([]);
    setActiveRefinementPrompt('');
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

  const handleApplyRefinement = (promptText: string) => {
    setActiveRefinementPrompt(promptText);
    setTeamVersion((v) => v + 1);
    setUserFeedbackInput('');
  };

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* 1. BARRA DO KIT DE EQUIPAMENTOS ATIVO (Consciência de Kit Mandatória) */}
      <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                {activeKit ? activeKit.name : 'Kit de Produção Padrão'}
              </span>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-[9px] font-mono px-1.5 py-0.2 rounded">
                KIT CONECTADO À IA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
              A equipe de IA lê suas lentes e luzes reais para calcular a melhor escolha técnica
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Link
            href="/equipamentos"
            className="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Montar / Trocar Meu Kit</span>
          </Link>
        </div>
      </div>

      {/* 2. HEADER DO SET & SELETOR DE MODO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111318] border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
            <Crosshair className="w-4 h-4 text-zinc-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">
                Direção Criativa & Equipe de IA
              </h2>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded">
                {selectedClient?.name || 'Cliente'}
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                v{teamVersion}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Diretor Geral, Roteirista, Diretor de Cena e Fotógrafo colaborando em tempo real
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

      {/* 3. GRID PRINCIPAL: MONITOR VIEWFINDER (7 cols) + EQUIPE DE IA (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUNA DA ESQUERDA: Viewfinder Monitor & Controles */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative">
            {isRecalculating && (
              <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                <div className="bg-[#111318] px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 text-xs font-mono text-white shadow-xl">
                  <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>A equipe de IA está alinhando os parâmetros...</span>
                </div>
              </div>
            )}

            <SpatialOverlay
              photoUrl={photoUrl}
              spatialData={spatialData}
              onBlockElement={handleBlockElement}
              onOpenLightingPreview={() => setIsLightingPreviewOpen(true)}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <label className="flex-1 min-w-[170px] py-2.5 px-3 bg-[#111318] hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors">
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

            {/* BOTÃO DE PREVIEW DE ILUMINAÇÃO (Apenas quando a foto for enviada) */}
            {photoUrl ? (
              <button
                type="button"
                onClick={() => setIsLightingPreviewOpen(true)}
                className="py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold rounded-xl border border-amber-500/40 flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/10 animate-fade-in"
                title="Gerar preview fotorrealista com IA e profundidade 3D na foto real"
              >
                <SunMedium className="w-4 h-4 text-amber-400" />
                <span>Preview IA (Profundidade Real)</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-[11px] text-zinc-500 font-mono bg-white/[0.02] border border-white/[0.05] rounded-xl">
                <span>Fotografe o espaço para liberar o Preview 3D</span>
              </div>
            )}

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

        {/* COLUNA DA DIREITA: OS 4 AGENTES DE IA + PLANO DE TAKES (5 cols) */}
        <div className="lg:col-span-5 bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Seletor dos Especialistas de IA */}
          <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-center font-mono">
            {(
              [
                { id: 'diretor_geral', label: 'Geral', icon: Crosshair },
                { id: 'roteiro', label: 'Roteiro', icon: BookOpen },
                { id: 'cena', label: 'Cena', icon: User },
                { id: 'fotografia', label: 'Foto', icon: Camera },
                { id: 'takes', label: 'Takes', icon: Film },
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
                    'py-2 px-1 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all',
                    isActive
                      ? 'bg-white text-zinc-950 font-bold shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[9px] tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ABA 1: DIRETOR GERAL */}
          {activeTab === 'diretor_geral' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-bold text-white uppercase text-[11px] font-mono">
                    DIRETOR GERAL (Decisão Criativa)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                  LÍDER DA EQUIPE
                </span>
              </div>

              {/* Resumo Executivo */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 block">
                  Síntese da Produção:
                </span>
                <p className="text-zinc-200 text-xs leading-relaxed">
                  {teamOutput.creative_direction.executive_summary}
                </p>
              </div>

              {/* Teses dos Especialistas */}
              <div className="space-y-2">
                <div className="bg-black/20 p-3 rounded-xl border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono text-purple-400 font-semibold uppercase block">
                    📖 Tese Narrativa (Roteiro):
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {teamOutput.creative_direction.narrative_thesis}
                  </p>
                </div>

                <div className="bg-black/20 p-3 rounded-xl border border-white/[0.05] space-y-1">
                  <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase block">
                    🎥 Tese Visual (Fotografia & Iluminação):
                  </span>
                  <p className="text-zinc-300 text-[11px] leading-relaxed">
                    {teamOutput.creative_direction.visual_thesis}
                  </p>
                </div>
              </div>

              {/* Conflitos Resolvidos */}
              {teamOutput.conflict_resolutions.length > 0 && (
                <div className="bg-amber-500/[0.04] p-3 rounded-xl border border-amber-500/20 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conflito Físico Resolvido pelo Diretor Geral:</span>
                  </span>
                  {teamOutput.conflict_resolutions.map((c, i) => (
                    <div key={i} className="text-[11px] text-zinc-300 space-y-0.5">
                      <p className="text-amber-200/90 font-medium">• {c.conflict}</p>
                      <p className="text-zinc-400 pl-3">↳ Solução: {c.resolution}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Alternativas de Set */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400 block">
                  Alternativas para este Espaço:
                </span>
                {teamOutput.alternatives.map((alt, i) => (
                  <div key={i} className="bg-black/30 p-2.5 rounded-xl border border-white/[0.06] text-[11px]">
                    <span className="font-semibold text-white block mb-0.5">{alt.option_name}</span>
                    <p className="text-zinc-400 leading-relaxed">{alt.description}</p>
                    <p className="text-amber-300 font-mono text-[10px] mt-1">Ajuste: {alt.adjustments}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 2: CRIADOR DE ROTEIRO */}
          {activeTab === 'roteiro' && (
            <div className="space-y-3 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="font-bold text-white uppercase text-[11px] font-mono">
                    CRIADOR DE ROTEIRO (Narrativa Humana)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded">
                  {teamOutput.script_direction.scenes.length} CENAS
                </span>
              </div>

              {/* Gancho & Pergunta Central */}
              <div className="bg-purple-500/[0.04] p-3 rounded-xl border border-purple-500/20 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-purple-400 block">
                  Gancho Anti-Clichê (Primeiros 3s):
                </span>
                <p className="text-white font-medium text-xs italic leading-relaxed">
                  {teamOutput.script_direction.hook}
                </p>
                <div className="pt-1 text-[11px] text-zinc-400">
                  <span className="text-purple-300 font-mono">Pergunta Central: </span>
                  {teamOutput.script_direction.central_question}
                </div>
              </div>

              {/* Roteiro Cena a Cena */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {teamOutput.script_direction.scenes.map((scene) => (
                  <div
                    key={scene.sceneNumber}
                    className="p-3 bg-black/30 border border-white/[0.06] rounded-xl space-y-2 hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">
                        {scene.sceneName}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-1.5 py-0.2 rounded">
                        {scene.durationSec}s • {scene.shotType}
                      </span>
                    </div>

                    <div className="p-2.5 bg-black/40 rounded-lg border-l-2 border-purple-500 space-y-1">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block">FALA / DIÁLOGO:</span>
                      <p className="text-zinc-100 text-xs leading-relaxed font-medium">
                        "{scene.dialogue}"
                      </p>
                    </div>

                    <div className="text-[11px] space-y-1 text-zinc-400">
                      <p><span className="text-zinc-500 font-mono">Ação Física:</span> {scene.action}</p>
                      <p><span className="text-zinc-500 font-mono">Ideia Visual:</span> {scene.visualIdea}</p>
                      <p><span className="text-zinc-500 font-mono">Intenção:</span> <span className="text-amber-300">{scene.emotionalIntention}</span></p>
                    </div>
                  </div>
                ))}

                {/* Chamada para Ação */}
                <div className="p-3 bg-emerald-500/[0.04] border border-emerald-500/20 rounded-xl space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 block">
                    Chamada para Ação (CTA):
                  </span>
                  <p className="text-white text-xs leading-relaxed font-medium">
                    {teamOutput.script_direction.cta}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: DIRETOR DE CENA */}
          {activeTab === 'cena' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="font-bold text-white uppercase text-[11px] font-mono">
                    DIRETOR DE CENA (Corpo & Pessoas)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded">
                  ATUAÇÃO NO SET
                </span>
              </div>

              {/* Posicionamento Físico & Recuo de 1,5m */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400">
                  <span className="text-blue-400 font-semibold">POSIÇÃO NO ESPAÇO</span>
                  <span className="text-emerald-400 font-bold">1,5m DA PAREDE</span>
                </div>
                <p className="text-zinc-200 text-xs leading-relaxed">
                  {teamOutput.scene_direction.subject_position.description}
                </p>
              </div>

              {/* Orientação Corporal & Linha dos Olhos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Orientação Corporal</span>
                  <p className="text-zinc-200 text-[11px] leading-relaxed">
                    {teamOutput.scene_direction.body_orientation}
                  </p>
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06] space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">Linha de Olhar</span>
                  <p className="text-zinc-200 text-[11px] leading-relaxed">
                    {teamOutput.scene_direction.eye_line}
                  </p>
                </div>
              </div>

              {/* Movimentação e Bloqueio */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 block">
                  Movimentação & Bloqueio:
                </span>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  • Início: {teamOutput.scene_direction.movement.start_action}
                </p>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  • Fluxo: {teamOutput.scene_direction.movement.motion_flow}
                </p>
              </div>

              {/* Notas de Performance */}
              <div className="bg-blue-500/[0.03] p-3.5 rounded-xl border border-blue-500/20 space-y-1.5">
                <span className="text-[10px] font-mono font-semibold uppercase text-blue-400 block">
                  Instruções para o Apresentador:
                </span>
                {teamOutput.scene_direction.performance_notes.map((note, idx) => (
                  <p key={idx} className="text-zinc-300 text-[11px] leading-relaxed">
                    • {note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* ABA 4: DIRETOR DE FOTOGRAFIA */}
          {activeTab === 'fotografia' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="font-bold text-white uppercase text-[11px] font-mono">
                    DIRETOR DE FOTOGRAFIA (Óptica & Luz)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  {teamOutput.cinematography_direction.lens.source === 'equipamento_proprio' ? 'SEU KIT REAL' : 'RECOMENDADO'}
                </span>
              </div>

              {/* Lente Escolhida do Kit */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>LENTE ESCOLHIDA DO SEU KIT</span>
                  <span className="text-amber-400 font-bold">{teamOutput.cinematography_direction.lens.focal_length_mm}mm</span>
                </div>
                <h4 className="font-semibold text-white text-sm">
                  {teamOutput.cinematography_direction.lens.model}
                </h4>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {teamOutput.cinematography_direction.lens.choice_reason}
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-zinc-400">
                  <span>Abertura: {teamOutput.cinematography_direction.camera.settings.aperture}</span>
                  <span>Obturador: {teamOutput.cinematography_direction.camera.settings.shutter}</span>
                  <span>FPS: {teamOutput.cinematography_direction.camera.settings.fps}</span>
                </div>
              </div>

              {/* Iluminação Principal a 45° */}
              <div className="bg-black/30 p-3.5 rounded-xl border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                  <span>LUZ PRINCIPAL (KEY LIGHT)</span>
                  <span className="text-amber-400 font-bold">ÂNGULO 45°</span>
                </div>
                <h4 className="font-medium text-white text-xs">
                  {teamOutput.cinematography_direction.lighting.key_light.equipment_used}
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Altura {teamOutput.cinematography_direction.lighting.key_light.height} com {teamOutput.cinematography_direction.lighting.key_light.modifier}.
                </p>
                <p className="text-[10px] font-mono text-zinc-400">
                  Distância da parede: {teamOutput.cinematography_direction.lighting.key_light.distance_to_wall_m}m (Sombra suave calculada).
                </p>

                <button
                  type="button"
                  onClick={() => setIsLightingPreviewOpen(true)}
                  className="w-full mt-2 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 rounded-xl text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                >
                  <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver Simulação 3D Desta Luz na Sua Foto</span>
                </button>
              </div>

              {/* Luz de Recorte & Profundidade */}
              <div className="bg-black/30 p-3 rounded-xl border border-white/[0.06] space-y-1">
                <span className="font-mono text-[10px] text-zinc-500 block">SEPARAÇÃO DE PROFUNDIDADE:</span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {teamOutput.cinematography_direction.depth.separation_strategy}
                </p>
              </div>
            </div>
          )}

          {/* ABA 5: PLANO DE TAKES & CHECKLIST */}
          {activeTab === 'takes' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="font-bold text-white uppercase text-[11px] font-mono">
                  Plano Operacional de Takes
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {doneTakes.length}/{teamOutput.takes.length} gravados
                </span>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {teamOutput.takes.map((take) => {
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

              {/* Checklist de Segurança Técnica */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-zinc-400 block">
                  Checklist Rápido de Set:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {checks.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCheck(c.id)}
                      className={cn(
                        'p-2 rounded-lg border text-left text-[11px] flex items-center gap-2 transition-colors',
                        c.done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-black/20 border-white/[0.05] text-zinc-400'
                      )}
                    >
                      <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0', c.done ? 'text-emerald-400' : 'text-zinc-600')} />
                      <span className="line-clamp-1">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. BARRA DE REFINAMENTO INTERATIVO COM O DIRETOR GERAL */}
          <div className="pt-3 border-t border-white/[0.08] space-y-2">
            <span className="text-[10px] font-mono uppercase text-zinc-500 block">
              Ajuste Rápido com o Diretor Geral:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🎬 Mais Cinema', prompt: 'Mais cinematográfico com luz de recorte dramática e maior separação' },
                { label: '☀️ Luz Suave', prompt: 'Iluminação mais difusa e natural, sem sombras marcadas' },
                { label: '📐 Espaço Reduzido', prompt: 'Tenho pouco espaço na sala, aproximar câmera e luz para setup compacto' },
                { label: '💡 Apenas 1 Luz', prompt: 'Estou com apenas 1 tripé de iluminação disponível no set' },
              ].map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyRefinement(btn.prompt)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-300 hover:text-white text-[11px] font-mono transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Input customizado para falar com a equipe de IA */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (userFeedbackInput.trim()) {
                  handleApplyRefinement(userFeedbackInput.trim());
                }
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={userFeedbackInput}
                onChange={(e) => setUserFeedbackInput(e.target.value)}
                placeholder="Pedir ajuste à equipe (ex: fala mais curta, mudar lado da luz)..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
              <button
                type="submit"
                disabled={!userFeedbackInput.trim()}
                className="py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-medium disabled:opacity-40 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL DE PREVIEW DA ILUMINAÇÃO */}
      <LightingPreviewModal
        isOpen={isLightingPreviewOpen}
        onClose={() => setIsLightingPreviewOpen(false)}
        photoUrl={photoUrl}
        spatialData={spatialData}
      />

      {/* MODAL DE EXPLICAÇÃO TÉCNICA */}
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
        <div className="flex items-center justify-center min-h-[50vh] text-zinc-500 font-mono text-xs">
          Carregando Diretor Técnico e Equipe de IA...
        </div>
      }
    >
      <DirectorContent />
    </Suspense>
  );
}
