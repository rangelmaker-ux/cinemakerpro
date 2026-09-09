'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Camera,
  User,
  SunMedium,
  Sparkles,
  Mic,
  Sliders,
  Eye,
  Layers,
  Save,
  Copy,
  Trash2,
  Plus,
  Compass,
  RotateCw,
  BookOpen,
  X,
  CheckCircle2,
  ArrowRight,
  Maximize2,
  Info,
  Palette,
  ShieldAlert,
} from 'lucide-react';
import {
  CustomLightingSetup,
  Light3DItem,
  LightModifier3D,
  LightType3D,
  ViewMode3D,
} from '@/lib/ai/lighting-3d-types';
import {
  EDUCATIONAL_LIGHTING_PRESETS,
  getStoredUserLightings,
  saveUserLighting,
  duplicateUserLighting,
  deleteUserLighting,
} from '@/lib/ai/lighting-presets';
import { cn } from '@/lib/utils';

interface Studio3DLightingMapProps {
  currentSetup: CustomLightingSetup | null;
  isScriptApproved: boolean;
  onUpdateSetup: (updated: CustomLightingSetup) => void;
  onOpenChat: () => void;
  activeSceneName?: string;
}

export function Studio3DLightingMap({
  currentSetup,
  isScriptApproved,
  onUpdateSetup,
  onOpenChat,
  activeSceneName = 'Cena 01',
}: Studio3DLightingMapProps) {
  // Modo de visualização: Top (Planta Baixa), Camera (POV da Câmera), Orbit (Perspectiva 3D)
  const [viewMode, setViewMode] = useState<ViewMode3D>('top');

  // Modo de operação: IA vs Criativo Manual
  const [isCreativeMode, setIsCreativeMode] = useState(false);

  // Elemento selecionado para inspeção / edição técnica
  const [selectedLightId, setSelectedLightId] = useState<string | null>(null);

  // Modal da Biblioteca Educativa & Minhas Iluminações
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTab, setLibraryTab] = useState<'presets' | 'custom'>('presets');
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<string>('Todas');

  // Modal para salvar iluminação personalizada
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState<any>('Comercial');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Ângulo de rotação da Órbita 3D interativa
  const [orbitRotation, setOrbitRotation] = useState({ yaw: 35, pitch: 30, zoom: 1 });
  const isDraggingOrbit = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Fallback seguro de setup para quando estiver aguardando aprovação
  const setup = currentSetup || EDUCATIONAL_LIGHTING_PRESETS[0];

  // Luz selecionada atualmente
  const selectedLight = useMemo(() => {
    if (!setup) return null;
    return setup.lights.find((l) => l.id === selectedLightId) || setup.lights[0] || null;
  }, [setup, selectedLightId]);

  // Manipulação de órbita 3D com mouse/touch
  const handleOrbitMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'orbit') return;
    isDraggingOrbit.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleOrbitMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingOrbit.current || viewMode !== 'orbit') return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = { x: e.clientX, y: e.clientY };

    setOrbitRotation((prev) => ({
      ...prev,
      yaw: (prev.yaw + dx * 0.8) % 360,
      pitch: Math.max(10, Math.min(75, prev.pitch - dy * 0.5)),
    }));
  };

  const handleOrbitMouseUp = () => {
    isDraggingOrbit.current = false;
  };

  // Funções do Modo Criativo: Editar Luz
  const handleUpdateSelectedLight = (changes: Partial<Light3DItem>) => {
    if (!selectedLight || !setup) return;
    const updatedLights = setup.lights.map((l) =>
      l.id === selectedLight.id ? { ...l, ...changes } : l
    );

    // Recalcular posições relativas (x, y) com base no ângulo e distância
    if (changes.angleDeg !== undefined || changes.distanceM !== undefined) {
      const angle = changes.angleDeg !== undefined ? changes.angleDeg : selectedLight.angleDeg;
      const dist = changes.distanceM !== undefined ? changes.distanceM : selectedLight.distanceM;
      const rad = (angle * Math.PI) / 180;
      const x = parseFloat((dist * Math.sin(rad)).toFixed(2));
      const y = parseFloat((dist * Math.cos(rad)).toFixed(2));

      const idx = updatedLights.findIndex((l) => l.id === selectedLight.id);
      if (idx >= 0) {
        updatedLights[idx].position = {
          x,
          y,
          z: changes.heightM !== undefined ? changes.heightM : selectedLight.heightM,
        };
      }
    }

    onUpdateSetup({
      ...setup,
      lights: updatedLights,
      isUserCustom: true,
    });
  };

  // Adicionar Nova Luz no Modo Criativo
  const handleAddLight = (type: LightType3D) => {
    if (!setup) return;
    const newId = `light-${Date.now()}`;
    const newLight: Light3DItem = {
      id: newId,
      name:
        type === 'key'
          ? 'Nova Luz Principal'
          : type === 'rim'
          ? 'Nova Luz de Recorte'
          : type === 'rgb_tube'
          ? 'Tubo RGB Criativo'
          : 'Luz de Preenchimento',
      type: type,
      position: { x: -1.4, y: 1.2, z: 1.8 },
      angleDeg: type === 'rim' ? 135 : 315,
      distanceM: 1.7,
      heightM: 1.8,
      intensityPct: 60,
      colorTemp: type === 'rgb_tube' ? 'rgb' : '5600K',
      rgbColor: type === 'rgb_tube' ? '#3b82f6' : undefined,
      modifier: type === 'rgb_tube' ? 'tubo_difuso' : 'softbox',
      equipmentModel: type === 'rgb_tube' ? 'Bastão LED RGB' : 'LED 100W',
    };

    onUpdateSetup({
      ...setup,
      lights: [...setup.lights, newLight],
      isUserCustom: true,
    });
    setSelectedLightId(newId);
  };

  // Excluir Luz Selecionada
  const handleDeleteSelectedLight = () => {
    if (!selectedLight || !setup || setup.lights.length <= 1) return;
    const filtered = setup.lights.filter((l) => l.id !== selectedLight.id);
    onUpdateSetup({
      ...setup,
      lights: filtered,
      isUserCustom: true,
    });
    setSelectedLightId(filtered[0]?.id || null);
  };

  // Salvar setup personalizado
  const handleConfirmSaveCustom = () => {
    if (!saveName.trim() || !setup) return;
    const toSave: CustomLightingSetup = {
      ...setup,
      id: `custom-${Date.now()}`,
      name: saveName.trim(),
      category: saveCategory,
      createdAt: new Date().toISOString(),
      isUserCustom: true,
    };
    saveUserLighting(toSave);
    setIsSaveModalOpen(false);
    setSaveToast(`Iluminação "${saveName}" salva em "Minhas Iluminações"!`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Duplicar setup atual
  const handleDuplicateSetup = () => {
    if (!setup) return;
    const duplicated = duplicateUserLighting(setup.id, `${setup.name} (Variação)`);
    if (duplicated) {
      onUpdateSetup(duplicated);
      setSaveToast(`Iluminação duplicada: "${duplicated.name}"!`);
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  // 1. ESTADO DE ESPERA: QUANDO O ROTEIRO AINDA NÃO FOI APROVADO
  if (!isScriptApproved) {
    return (
      <div className="bg-[#111318] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl min-h-[380px] sm:min-h-[440px] relative overflow-hidden animate-fade-in">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #818cf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-xl relative z-10">
          <Compass className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1.5 max-w-md z-10">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
            MAPA DE ILUMINAÇÃO & ESTÚDIO 3D
          </span>
          <h3 className="text-base font-bold text-white tracking-tight">
            Aguardando Definição da Cena
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Seu mapa de iluminação 3D aparecerá aqui depois que o Diretor de Fotografia definir a configuração da cena com base no roteiro aprovado.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-3 z-10">
          <button
            type="button"
            onClick={onOpenChat}
            className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <span>Falar ou Aprovar Roteiro no Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="py-2.5 px-4 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-white/10 flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ver Biblioteca Educativa</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. ESTADO ATIVO: MAPA DE ILUMINAÇÃO E POSICIONAMENTO 3D LIBERADO
  return (
    <div className="bg-[#111318] border border-white/10 rounded-2xl overflow-hidden shadow-2xl space-y-0 flex flex-col">
      {/* TOAST DE NOTIFICAÇÃO */}
      {saveToast && (
        <div className="bg-emerald-500/90 text-zinc-950 text-xs font-bold px-4 py-2 text-center shadow-lg animate-fade-in flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* CABEÇALHO DO MAPA 3D COM CONTROLES E MODOS */}
      <div className="p-3.5 bg-black/40 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wide">
                Mapa 3D de Iluminação
              </h3>
              <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.06] px-2 py-0.2 rounded">
                {activeSceneName}
              </span>
              {setup.isUserCustom && (
                <span className="text-[9px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.2 rounded font-semibold">
                  PERSONALIZADO
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 line-clamp-1">
              Posições, ângulos e distâncias físicas exatas para montagem no set real
            </p>
          </div>
        </div>

        {/* SELETOR DE VISÃO (MODO 1: SUPERIOR | MODO 2: CÂMERA | MODO 3: ÓRBITA 3D) */}
        <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => setViewMode('top')}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors',
              viewMode === 'top'
                ? 'bg-white text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            )}
            title="Planta baixa superior com feixes de luz e distâncias em metros"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Visão Superior</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('camera')}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors',
              viewMode === 'camera'
                ? 'bg-white text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            )}
            title="O que a câmera enquadra com base na lente do seu kit"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Visão da Câmera</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('orbit')}
            className={cn(
              'px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors',
              viewMode === 'orbit'
                ? 'bg-white text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            )}
            title="Órbita tridimensional interativa no estúdio"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Órbita 3D</span>
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO ESTÚDIO 3D (CANVAS VISUAL) */}
      <div
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-[#0c0e14] overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleOrbitMouseDown}
        onMouseMove={handleOrbitMouseMove}
        onMouseUp={handleOrbitMouseUp}
        onMouseLeave={handleOrbitMouseUp}
      >
        {/* GRID DE FUNDO E PAREDES DO ESTÚDIO */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, #818cf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* ============================================================ */}
        {/* VISÃO 1: TOP / OVERHEAD VIEW (PLANTA BAIXA EM METROS)        */}
        {/* ============================================================ */}
        {viewMode === 'top' && (
          <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
            {/* PAREDE DE FUNDO (BACK WALL) */}
            <div className="w-full pb-2 border-b-2 border-dashed border-zinc-700/80 flex items-center justify-between text-[10px] font-mono text-zinc-400 uppercase">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-zinc-600" />
                PAREDE DE FUNDO DO ESPAÇO
              </span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                RECUO DO SUJEITO: {setup.subject.distanceFromWallM} m
              </span>
            </div>

            {/* SVG OVERLAY: FEIXES DE LUZ CONICAMENTE PROJETADOS, LINHAS DE MEDIÇÃO E ÂNGULOS */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="beamGradientKey" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="beamGradientRim" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="cameraFovGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Cones de Feixe de Luz das Luzes Ativas */}
              {setup.lights.map((l) => {
                const isKey = l.type === 'key';
                const color = l.colorTemp === 'rgb' && l.rgbColor ? l.rgbColor : isKey ? '#f59e0b' : '#06b6d4';
                const lightX = 50 + l.position.x * 20;
                const lightY = 46 - l.position.y * 14;

                return (
                  <g key={`beam-${l.id}`}>
                    {/* Cone de Feixe Suave Direcionado ao Sujeito */}
                    <path
                      d={`M ${lightX}% ${lightY}% L 47% 43% L 53% 43% Z`}
                      fill={color}
                      opacity={l.intensityPct / 250}
                    />
                    {/* Linha de vetor direcional */}
                    <line
                      x1={`${lightX}%`}
                      y1={`${lightY}%`}
                      x2="50%"
                      y2="43%"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      opacity="0.8"
                    />
                  </g>
                );
              })}

              {/* Campo de Visão da Câmera (FOV Frustum) */}
              <path
                d="M 50% 82% L 36% 40% L 64% 40% Z"
                fill="url(#cameraFovGradient)"
              />
              {/* Linha de linha de visão Câmera -> Personagem */}
              <line
                x1="50%"
                y1="82%"
                x2="50%"
                y2="43%"
                stroke="#3b82f6"
                strokeWidth="1.5"
                opacity="0.6"
              />
            </svg>

            {/* PERSONAGEM (SUJEITO NO CENTRO A 1,5M DA PAREDE) */}
            <div
              style={{ left: '50%', top: '43%', transform: 'translate(-50%, -50%)' }}
              className="absolute z-20 flex flex-col items-center group cursor-pointer"
              title="Personagem posicionado a 1,5m da parede de fundo"
            >
              <div className="w-9 h-9 rounded-full bg-purple-600/90 border-2 border-white text-white flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.6)]">
                <User className="w-5 h-5" />
              </div>
              <span className="mt-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-purple-300 border border-purple-500/30 whitespace-nowrap shadow-md">
                👤 {setup.subject.name} (1,5m da parede)
              </span>
            </div>

            {/* MICROFONE LAPELA */}
            <div
              style={{ left: '50%', top: '49%', transform: 'translate(-50%, -50%)' }}
              className="absolute z-20 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[9px] font-mono text-emerald-400"
            >
              <Mic className="w-3 h-3" />
              <span>{setup.audio.model}</span>
            </div>

            {/* LUZES RENDERIZADAS NO MAPA ESPACIAL */}
            {setup.lights.map((light) => {
              const isSelected = selectedLightId === light.id;
              const isKey = light.type === 'key';
              const color =
                light.colorTemp === 'rgb' && light.rgbColor
                  ? light.rgbColor
                  : isKey
                  ? '#f59e0b'
                  : '#06b6d4';

              // Coordenadas projetadas na planta baixa
              const posX = 50 + light.position.x * 20;
              const posY = 46 - light.position.y * 14;

              return (
                <button
                  key={light.id}
                  type="button"
                  onClick={() => setSelectedLightId(light.id)}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={cn(
                    'absolute z-30 flex flex-col items-center transition-all group focus:outline-none',
                    isSelected ? 'scale-110 z-40' : 'hover:scale-105 opacity-95'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white border-2 shadow-xl transition-all',
                      isSelected
                        ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.8)] ring-2 ring-amber-400/50'
                        : 'border-white/60'
                    )}
                    style={{ backgroundColor: color }}
                  >
                    <SunMedium className="w-4 h-4" />
                  </div>

                  <div className="mt-1 bg-black/85 px-2 py-0.5 rounded border border-white/15 text-[9px] font-mono text-zinc-200 whitespace-nowrap shadow-lg flex items-center gap-1.5">
                    <span className="font-bold" style={{ color }}>
                      {light.name}
                    </span>
                    <span>•</span>
                    <span>{light.angleDeg}°</span>
                    <span>•</span>
                    <span>{light.distanceM}m</span>
                  </div>
                </button>
              );
            })}

            {/* CÂMERA POV NO SET */}
            <div
              style={{ left: '50%', top: '82%', transform: 'translate(-50%, -50%)' }}
              className="absolute z-20 flex flex-col items-center"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.6)]">
                <Camera className="w-4 h-4" />
              </div>
              <div className="mt-1 bg-black/85 px-2.5 py-0.5 rounded border border-blue-500/30 text-[10px] font-mono text-blue-300 shadow-md whitespace-nowrap flex items-center gap-1.5">
                <span className="font-bold">📷 Câmera ({setup.camera.focalLengthMm}mm)</span>
                <span>•</span>
                <span>{setup.camera.distanceM}m</span>
                <span>•</span>
                <span>Alt: {setup.camera.heightM}m</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VISÃO 2: CAMERA VIEW (POV DO QUE A CÂMERA VÊ NO SET)         */}
        {/* ============================================================ */}
        {viewMode === 'camera' && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* GUIA DE ENQUADRAMENTO DA CÂMERA (VIEWFINDER CINEMA) */}
            <div className="relative w-full max-w-lg aspect-[16/9] bg-gradient-to-b from-[#11141c] to-[#0a0c10] rounded-xl border border-white/20 overflow-hidden shadow-2xl flex flex-col justify-between p-3">
              {/* Grid dos terços da câmera */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-15">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Top Bar do Viewfinder */}
              <div className="flex items-center justify-between z-10 text-[10px] font-mono text-zinc-300 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10">
                <span className="text-red-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  REC POV • LENTE {setup.camera.focalLengthMm}mm
                </span>
                <span>{setup.camera.aperture} • ISO 400 • 1/50s</span>
                <span className="text-amber-400 font-bold">{setup.camera.framing}</span>
              </div>

              {/* SIMULAÇÃO DE MODELAGEM DE LUZ NO PERSONAGEM (PBR ESTILIZADO) */}
              <div className="relative flex-1 flex items-center justify-center z-10">
                {/* Personagem com luz calculada */}
                <div className="relative flex flex-col items-center">
                  {/* Luz de recorte (Rim) nas bordas dos ombros */}
                  <div
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 flex items-center justify-center relative shadow-2xl"
                    style={{
                      background:
                        'radial-gradient(circle at 75% 30%, #475569 0%, #1e293b 60%, #0f172a 100%)',
                      borderColor: '#f59e0b80',
                      boxShadow: '0 0 35px rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <User className="w-12 h-12 text-zinc-200" />
                  </div>

                  {/* Corpo / Ombros */}
                  <div
                    className="w-36 h-16 sm:w-44 sm:h-20 bg-gradient-to-t from-slate-900 to-slate-700 rounded-t-3xl border-t-2 border-amber-400/40 -mt-2 shadow-xl"
                  />
                </div>
              </div>

              {/* Bottom Bar do Viewfinder */}
              <div className="flex items-center justify-between z-10 text-[10px] font-mono text-zinc-400 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-white/10">
                <span>Distância do Sujeito: {setup.camera.distanceM}m</span>
                <span className="text-emerald-400">Recuo da Parede: {setup.subject.distanceFromWallM}m</span>
                <span>Luz: {setup.lights[0]?.name || 'Key'} (45°)</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VISÃO 3: ÓRBITA 3D INTERATIVA (PERSPECTIVA DO ESTÚDIO)       */}
        {/* ============================================================ */}
        {viewMode === 'orbit' && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center space-y-2 select-none">
              {/* Elementos 3D com projeção geométrica */}
              <div
                className="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto transition-transform duration-75"
                style={{
                  transform: `perspective(600px) rotateX(${orbitRotation.pitch}deg) rotateZ(${orbitRotation.yaw}deg)`,
                }}
              >
                {/* Piso da Sala em 3D */}
                <div
                  className="absolute inset-0 bg-[#141824] border-2 border-white/20 rounded-2xl shadow-2xl"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                  }}
                />

                {/* Sujeito em 3D */}
                <div
                  className="absolute w-8 h-8 rounded-full bg-purple-500 border-2 border-white shadow-xl flex items-center justify-center text-white"
                  style={{ left: '50%', top: '45%', transform: 'translate(-50%, -50%)' }}
                >
                  <User className="w-4 h-4" />
                </div>

                {/* Câmera em 3D */}
                <div
                  className="absolute w-8 h-8 rounded-xl bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center text-white"
                  style={{ left: '50%', top: '80%', transform: 'translate(-50%, -50%)' }}
                >
                  <Camera className="w-4 h-4" />
                </div>

                {/* Luz Principal em 3D */}
                <div
                  className="absolute w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-white animate-pulse"
                  style={{ left: '72%', top: '35%', transform: 'translate(-50%, -50%)' }}
                >
                  <SunMedium className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-black/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-zinc-400 inline-flex items-center gap-2">
                <span>Arraste para orbitar o estúdio em 3D</span>
                <span>•</span>
                <span className="text-amber-400">Yaw: {Math.round(orbitRotation.yaw)}°</span>
                <span>•</span>
                <span className="text-amber-400">Pitch: {Math.round(orbitRotation.pitch)}°</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PAINEL INFERIOR: MODO IA VS CRIATIVO + INSPEÇÃO DO ELEMENTO */}
      <div className="p-3.5 bg-black/40 border-t border-white/[0.08] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Alternador de Modo: Modo IA vs Modo Criativo */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreativeMode(false)}
              className={cn(
                'py-1.5 px-3 rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5',
                !isCreativeMode
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
              )}
            >
              <span>🤖 Modo IA (Diretor de Foto)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreativeMode(true)}
              className={cn(
                'py-1.5 px-3 rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5',
                isCreativeMode
                  ? 'bg-purple-500 text-white font-bold shadow-md'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/10'
              )}
            >
              <span>🎨 Modo Criativo (Manual)</span>
            </button>
          </div>

          {/* Ações: Salvar Iluminação, Duplicar e Biblioteca */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Salvar este setup em Minhas Iluminações"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Salvar Iluminação</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicateSetup}
              className="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/10 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Duplicar para criar variação sem perder a original"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Duplicar</span>
            </button>

            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="py-1.5 px-3 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Biblioteca & Presets</span>
            </button>
          </div>
        </div>

        {/* CONTROLES DO MODO CRIATIVO (QUANDO ATIVADO) */}
        {isCreativeMode && (
          <div className="bg-purple-500/[0.05] border border-purple-500/20 rounded-xl p-3 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase text-purple-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Ajuste Manual do Setup (Modo Criativo)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddLight('key')}
                  className="py-1 px-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Luz
                </button>
                <button
                  type="button"
                  onClick={() => handleAddLight('rgb_tube')}
                  className="py-1 px-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1"
                >
                  <Palette className="w-3 h-3" /> Tubo RGB
                </button>
                {setup.lights.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelectedLight}
                    className="py-1 px-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-mono flex items-center gap-1"
                    title="Excluir luz selecionada"
                  >
                    <Trash2 className="w-3 h-3" /> Excluir
                  </button>
                )}
              </div>
            </div>

            {/* SLIDERS E CAMPOS DA LUZ SELECIONADA */}
            {selectedLight && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {/* Ângulo */}
                <div className="bg-black/40 p-2 rounded-lg border border-white/10 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Ângulo</span>
                    <span className="text-amber-400 font-bold">{selectedLight.angleDeg}°</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={5}
                    value={selectedLight.angleDeg}
                    onChange={(e) => handleUpdateSelectedLight({ angleDeg: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Distância */}
                <div className="bg-black/40 p-2 rounded-lg border border-white/10 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Distância</span>
                    <span className="text-amber-400 font-bold">{selectedLight.distanceM}m</span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={3.5}
                    step={0.1}
                    value={selectedLight.distanceM}
                    onChange={(e) => handleUpdateSelectedLight({ distanceM: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Altura */}
                <div className="bg-black/40 p-2 rounded-lg border border-white/10 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Altura</span>
                    <span className="text-amber-400 font-bold">{selectedLight.heightM}m</span>
                  </div>
                  <input
                    type="range"
                    min={0.8}
                    max={2.8}
                    step={0.05}
                    value={selectedLight.heightM}
                    onChange={(e) => handleUpdateSelectedLight({ heightM: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Intensidade */}
                <div className="bg-black/40 p-2 rounded-lg border border-white/10 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span>Intensidade</span>
                    <span className="text-amber-400 font-bold">{selectedLight.intensityPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={selectedLight.intensityPct}
                    onChange={(e) => handleUpdateSelectedLight({ intensityPct: Number(e.target.value) })}
                    className="w-full accent-amber-500 h-1.5 bg-zinc-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* INSPETOR DO ELEMENTO SELECIONADO (DETALHES FÍSICOS REAIS) */}
        {selectedLight && (
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-bold text-white">{selectedLight.name}</span>
              <span className="text-zinc-500">({selectedLight.equipmentModel})</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-zinc-400">
              <span>
                Ângulo: <strong className="text-white">{selectedLight.angleDeg}°</strong>
              </span>
              <span>
                Distância: <strong className="text-white">{selectedLight.distanceM} m</strong>
              </span>
              <span>
                Altura: <strong className="text-white">{selectedLight.heightM} m</strong>
              </span>
              <span>
                Modificador: <strong className="text-white">{selectedLight.modifier}</strong>
              </span>
              <span>
                Temperatura: <strong className="text-amber-300">{selectedLight.colorTemp}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: BIBLIOTECA EDUCATIVA DE PRESETS & MINHAS ILUMINAÇÕES   */}
      {/* ============================================================ */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111318] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header do Modal */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Biblioteca de Iluminação Profissional
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs da Biblioteca */}
            <div className="px-4 pt-3 flex items-center justify-between border-b border-white/[0.06] bg-black/20">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLibraryTab('presets')}
                  className={cn(
                    'pb-2 px-2 text-xs font-mono border-b-2 transition-colors',
                    libraryTab === 'presets'
                      ? 'border-amber-400 text-white font-bold'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  )}
                >
                  Presets Educativos ({EDUCATIONAL_LIGHTING_PRESETS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setLibraryTab('custom')}
                  className={cn(
                    'pb-2 px-2 text-xs font-mono border-b-2 transition-colors',
                    libraryTab === 'custom'
                      ? 'border-amber-400 text-white font-bold'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  )}
                >
                  Minhas Iluminações Salvas ({getStoredUserLightings().length})
                </button>
              </div>

              {libraryTab === 'presets' && (
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  {['Todas', 'Entrevista', 'Retrato', 'Social Media', 'Cinemático'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setPresetCategoryFilter(cat)}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px]',
                        presetCategoryFilter === cat
                          ? 'bg-white text-zinc-950 font-bold'
                          : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Conteúdo da Biblioteca */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {libraryTab === 'presets' ? (
                EDUCATIONAL_LIGHTING_PRESETS.filter(
                  (p) => presetCategoryFilter === 'Todas' || p.category === presetCategoryFilter
                ).map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 bg-black/40 border border-white/[0.06] hover:border-white/20 rounded-xl space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono uppercase">
                          {preset.name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.2 rounded">
                          {preset.category}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSetup(preset);
                          setIsLibraryOpen(false);
                          setSaveToast(`Setup "${preset.name}" aplicado no seu Set 3D!`);
                          setTimeout(() => setSaveToast(null), 3000);
                        }}
                        className="py-1 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors"
                      >
                        Aplicar no Set
                      </button>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{preset.description}</p>

                    {/* Explicação Didática da Técnica */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-400">
                      <p>
                        <strong className="text-zinc-300">🎯 Propósito:</strong> {preset.purpose}
                      </p>
                      <p>
                        <strong className="text-zinc-300">⏱️ Quando usar:</strong> {preset.whenToUse}
                      </p>
                      <p>
                        <strong className="text-zinc-300">✨ Resultado Visual:</strong> {preset.visualResult}
                      </p>
                      <p>
                        <strong className="text-zinc-300">💡 Equipamento:</strong>{' '}
                        {preset.requiredEquipment.join(', ')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                /* Minhas Iluminações Salvas */
                <div className="space-y-2.5">
                  {getStoredUserLightings().length === 0 ? (
                    <div className="text-center py-8 space-y-2 text-zinc-500 font-mono text-xs">
                      <p>Você ainda não salvou nenhuma iluminação personalizada.</p>
                      <p className="text-[11px] text-zinc-600">
                        Crie ou edite um setup no Modo Criativo e clique em "Salvar Iluminação".
                      </p>
                    </div>
                  ) : (
                    getStoredUserLightings().map((custom) => (
                      <div
                        key={custom.id}
                        className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white font-mono">{custom.name}</h4>
                            <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.05] px-1.5 py-0.2 rounded">
                              {custom.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {custom.lights.length} luzes • Câmera {custom.camera.focalLengthMm}mm • Recuo {custom.subject.distanceFromWallM}m
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateSetup(custom);
                              setIsLibraryOpen(false);
                            }}
                            className="py-1 px-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg"
                          >
                            Carregar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUserLighting(custom.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SALVAR ILUMINAÇÃO PERSONALIZADA (SEÇÃO 16)            */}
      {/* ============================================================ */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111318] border border-white/10 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white font-mono uppercase flex items-center gap-2">
                <Save className="w-4 h-4 text-amber-400" />
                <span>Salvar Setup em Minhas Iluminações</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Nome da Iluminação:</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Ex: Barbearia Moody, Entrevista Clean..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-zinc-400">Categoria:</label>
                <select
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value as any)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="Comercial">Comercial</option>
                  <option value="Entrevista">Entrevista</option>
                  <option value="Retrato">Retrato</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Cinemático">Cinemático</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="py-2 px-3 text-xs text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveCustom}
                disabled={!saveName.trim()}
                className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors disabled:opacity-40"
              >
                Salvar Iluminação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
