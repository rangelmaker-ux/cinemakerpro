'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
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
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import {
  activateDownstreamAgents,
  applyTargetedAdjustment,
  createInitialConversationState,
  extractContextFromInput,
  generateNarrativeScript,
  AIProductionStage,
  ChatMessage,
  CreativeBrief,
} from '@/lib/ai/conversational-engine';
import { GeneralDirectorOutput, ScriptCreatorOutput, SharedProjectContext } from '@/lib/ai/team-types';
import { AIDirectorSpatialData, SpatialElement, VectorLine } from '@/lib/ai/types';
import { DirectorMode, VideoType } from '@/types/database';
import { SpatialOverlay } from '@/components/director/SpatialOverlay';
import { WhyModal } from '@/components/director/WhyModal';
import { LightingPreviewModal } from '@/components/director/LightingPreviewModal';
import { VoiceInput } from '@/components/director/VoiceInput';
import { ScriptReviewCard } from '@/components/director/ScriptReviewCard';
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

  // 1. ESTADOS DA MÁQUINA DE ESTADOS CONVERSACIONAL (IDLE POR PADRÃO, ZERO PRÉ-CARREGAMENTO)
  const [stage, setStage] = useState<AIProductionStage>('idle');
  const [currentBrief, setCurrentBrief] = useState<CreativeBrief | null>(null);
  const [currentScript, setCurrentScript] = useState<ScriptCreatorOutput | null>(null);
  const [isScriptApproved, setIsScriptApproved] = useState(false);
  const [teamOutput, setTeamOutput] = useState<GeneralDirectorOutput | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [teamVersion, setTeamVersion] = useState(1);

  // Mensagens conversacionais (Inicia com saudação profissional convidando a falar ou digitar)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial = createInitialConversationState(selectedClient?.name);
    return initial.messages;
  });

  // Gaveta ativa: Conversa/Roteiro, Diretor Geral, Cena, Foto, Takes
  const [activeTab, setActiveTab] = useState<'conversar' | 'diretor_geral' | 'cena' | 'fotografia' | 'takes'>('conversar');
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

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do chat ao receber mensagens
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Contexto Compartilhado de Produção (Seção 4 do Master Prompt)
  const sharedContext = useMemo<SharedProjectContext>(() => {
    const userLenses = equipments.filter((e) => e.category === 'lens');
    const userLights = equipments.filter((e) => e.category === 'lighting');
    const userAudio = equipments.filter((e) => e.category === 'audio');

    return {
      project: {
        id: activeProject?.id || 'proj-1',
        title: activeProject?.title || currentBrief?.topic || 'Produção Audiovisual',
        videoType: videoType,
        mode: mode,
        format: currentBrief?.format || '9:16',
      },
      client: {
        id: selectedClient?.id,
        name: selectedClient?.name || currentBrief?.client || 'Cliente',
        company: selectedClient?.company,
        segment: 'Audiovisual / Negócios',
      },
      briefing: {
        objective: currentBrief?.objective || 'Apresentação comercial e conexão humana com a audiência',
        audience: 'Clientes e parceiros estratégicos',
        tone: currentBrief?.tone || 'Natural e profissional',
        keyMessage: currentBrief?.topic || 'Excelência técnica e entrega de valor comprovada',
        targetEmotion: 'Confiança e clareza',
      },
      video_type: videoType,
      platform: currentBrief?.platform === 'YouTube' ? 'youtube' : 'reels',
      format: currentBrief?.format || '9:16',
      duration: currentBrief ? `${currentBrief.duration_seconds}s` : '30s',
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
        preferredAngle: blockedZones.some((b) => b.x < 40) ? '45_right' : '45_left',
      },
    };
  }, [selectedClient, activeProject, equipments, videoType, mode, photoUrl, blockedZones, currentBrief]);

  // Recalcular downstream caso parâmetros mudem após aprovação
  useEffect(() => {
    if (isScriptApproved && currentScript) {
      const output = activateDownstreamAgents(sharedContext, currentScript);
      setTeamOutput(output);
    }
  }, [sharedContext, isScriptApproved, currentScript]);

  // Converte a saída da equipe de IA para o formato do Viewfinder e SVG
  const spatialData = useMemo<AIDirectorSpatialData>(() => {
    if (!teamOutput || !isScriptApproved) {
      // Estado de espera: guia visual limpo sem poluentes
      return {
        elements: [],
        lines: [],
        cameraSettings: {
          lensName: equipments.find((e) => e.category === 'lens')?.model || 'Lente 35mm',
          focalLength: '35mm',
          aperture: 'f/2.8',
          height: '1.45m',
          framing: 'Aguardando aprovação do roteiro',
          shotType: 'Plano Médio',
        },
        lightingSettings: {
          keyLightAngle: '45°',
          keyLightHeight: '1.80m',
          keyLightModifier: 'Softbox Difusor',
          backLightNotes: 'Recuo de 1,5m da parede de fundo',
        },
        audioSettings: {
          micType: 'Lapela Sem Fio',
          position: '15cm da boca',
          cautions: 'Fixar cabo sob a camisa',
        },
        subjectSettings: {
          distanceFromWall: '1,5m de recuo da parede',
          orientation: 'Corpo 20° virado para a luz principal',
        },
        avoids: ['Aguardando roteiro aprovado pelo usuário'],
        whyExplanation: 'O Diretor de Cena e o Fotógrafo calcularão os enquadramentos e a luz perfeitos assim que o roteiro for aprovado.',
        takesPlan: [],
      };
    }

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
  }, [teamOutput, isScriptApproved, equipments, mode]);

  // ENVIAR MENSAGEM (TEXTO OU ÁUDIO FALADO PELO USUÁRIO)
  const handleSendMessage = (text: string, isAudio: boolean = false) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderTitle: 'Você',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      isAudio: isAudio,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    setTimeout(() => {
      const analysis = extractContextFromInput(text, currentBrief);
      setCurrentBrief(analysis.brief);

      // CASO 1: USUÁRIO APROVOU O ROTEIRO EXISTENTE
      if (analysis.isApproval && currentScript) {
        handleApproveScript();
        setIsThinking(false);
        return;
      }

      // CASO 2: USUÁRIO PEDIU PARA REFAZER / REGENERAR TUDO
      if (analysis.isRejectionOrRegen && currentScript) {
        handleRegenerateScript();
        setIsThinking(false);
        return;
      }

      // CASO 3: USUÁRIO PEDIU AJUSTE CIRÚRGICO ESPECÍFICO (GANCHO, CTA, TOM)
      if (analysis.isTargetedAdjustment && currentScript && analysis.adjustmentType) {
        handleTargetedAdjustment(analysis.adjustmentType, text);
        setIsThinking(false);
        return;
      }

      // CASO 4: FALTA INFORMAÇÃO CRÍTICA (PRIMEIRO CONTATO VAGO)
      if (!analysis.isCompleteEnough && !currentScript) {
        const clarifyMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'diretor_geral',
          senderTitle: 'Diretor Geral',
          text:
            analysis.missingInfoQuestion ||
            'Excelente! Me conta um pouco mais sobre o nicho do negócio e qual mensagem central você quer passar nesse vídeo.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          stage: 'clarification',
        };
        setMessages((prev) => [...prev, clarifyMsg]);
        setStage('clarification');
        setIsThinking(false);
        return;
      }

      // CASO 5: INFORMAÇÃO SUFICIENTE -> GERAR ROTEIRO NARRATIVO DEDICADO
      const newScript = generateNarrativeScript(analysis.brief, false);
      setCurrentScript(newScript);
      setIsScriptApproved(false);
      setStage('script_review');

      const dgResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'diretor_geral',
        senderTitle: 'Diretor Geral',
        text: `Entendi perfeitamente! Vídeo de ${analysis.brief.duration_seconds}s para ${analysis.brief.client} focado em "${analysis.brief.topic}", gravado no formato ${analysis.brief.format} para ${analysis.brief.platform}. O Criador de Roteiro estruturou a narrativa abaixo. Revise, edite se desejar ou aprove para liberarmos os enquadramentos:`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stage: 'script_review',
        script: newScript,
        brief: analysis.brief,
      };

      setMessages((prev) => [...prev, dgResponse]);
      setActiveTab('conversar');
      setIsThinking(false);
    }, 350);
  };

  // APROVAR ROTEIRO (DESBLOQUEIA DIRETORES DE CENA, FOTO, VIEW FINDER E TAKES)
  const handleApproveScript = () => {
    if (!currentScript) return;

    setIsScriptApproved(true);
    setStage('production_ready');

    const output = activateDownstreamAgents(sharedContext, currentScript);
    setTeamOutput(output);
    setTeamVersion((v) => v + 1);

    const approvalMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'diretor_geral',
      senderTitle: 'Diretor Geral',
      text: `✓ Roteiro aprovado por você! O Diretor de Cena e o Diretor de Fotografia calcularam a posição a 1,5m da parede de fundo, as lentes do seu kit (${output.cinematography_direction.lens.model}) e a luz principal a 45°. O monitor espacial, plano de takes e checklist estão 100% liberados!`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      stage: 'production_ready',
    };

    setMessages((prev) => [...prev, approvalMsg]);
  };

  // REGENERAR ROTEIRO (OUTRA PROPOSTA NARRATIVA)
  const handleRegenerateScript = () => {
    if (!currentBrief) return;
    setIsThinking(true);

    setTimeout(() => {
      const alternativeScript = generateNarrativeScript(currentBrief, true);
      setCurrentScript(alternativeScript);
      setIsScriptApproved(false);
      setStage('script_review');

      const regenMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'criador_roteiro',
        senderTitle: 'Criador de Roteiro',
        text: `Criei uma proposta de narrativa alternativa com um novo ângulo de abordagem. Confira o novo gancho e as cenas abaixo:`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stage: 'script_review',
        script: alternativeScript,
      };

      setMessages((prev) => [...prev, regenMsg]);
      setIsThinking(false);
    }, 300);
  };

  // AJUSTE CIRÚRGICO (TARGETED REGENERATION)
  const handleTargetedAdjustment = (
    type: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue',
    directive: string
  ) => {
    if (!currentScript) return;
    setIsThinking(true);

    setTimeout(() => {
      const updated = applyTargetedAdjustment(currentScript, type, directive);
      setCurrentScript(updated);
      setIsScriptApproved(false);

      const adjMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'criador_roteiro',
        senderTitle: 'Criador de Roteiro',
        text: `Ajustei o ${type === 'hook' ? 'gancho' : type === 'cta' ? 'CTA' : 'roteiro'} conforme solicitado: "${directive}". As outras partes foram preservadas com sucesso.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stage: 'script_review',
        script: updated,
      };

      setMessages((prev) => [...prev, adjMsg]);
      setIsThinking(false);
    }, 250);
  };

  // EDIÇÃO MANUAL DO ROTEIRO PELO USUÁRIO
  const handleUpdateScript = (editedScript: ScriptCreatorOutput) => {
    setCurrentScript(editedScript);
    const editMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'diretor_geral',
      senderTitle: 'Diretor Geral',
      text: `Suas alterações manuais foram salvas e fixadas como conteúdo aprovado. Pronto para aprovação e gravação.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, editMsg]);
  };

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

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* 1. BARRA DO KIT DE EQUIPAMENTOS ATIVO */}
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

      {/* 2. HEADER DO SET & STATUS DO PROJETO */}
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
              {isScriptApproved ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded uppercase font-semibold">
                  PRODUÇÃO ATIVA (v{teamVersion})
                </span>
              ) : (
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                  ETAPA: {stage === 'idle' ? 'AGUARDANDO BRIEFING' : 'CRIANDO NARRATIVA'}
                </span>
              )}
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

      {/* 3. GRID PRINCIPAL: MONITOR VIEWFINDER (7 cols) + ÁREA CONVERSACIONAL E AGENTES (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* COLUNA DA ESQUERDA: Viewfinder Monitor & Controles */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative">
            {/* Se o roteiro ainda não foi aprovado, mostra aviso sutil no monitor */}
            {!isScriptApproved && (
              <div className="absolute inset-x-3 top-3 z-30 bg-black/85 backdrop-blur-xs border border-amber-500/30 rounded-xl p-3 text-xs text-zinc-300 shadow-xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-[11px] font-mono">
                      MONITOR ESPACIAL AGUARDANDO ROTEIRO
                    </span>
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Fale sua ideia no chat ao lado. A luz a 45° e os enquadramentos serão traçados após a aprovação do roteiro.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('conversar')}
                  className="py-1 px-2.5 bg-amber-500 text-zinc-950 font-bold text-[10px] rounded-lg shrink-0 hover:bg-amber-400 transition-colors"
                >
                  Ir ao Chat
                </button>
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

        {/* COLUNA DA DIREITA: ÁREA CONVERSACIONAL + OS 4 ESPECIALISTAS (5 cols) */}
        <div className="lg:col-span-5 bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Seletor dos Especialistas de IA */}
          <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-center font-mono">
            {(
              [
                { id: 'conversar', label: 'Chat & Roteiro', icon: MessageSquare },
                { id: 'diretor_geral', label: 'Geral', icon: Crosshair },
                { id: 'cena', label: 'Cena', icon: User },
                { id: 'fotografia', label: 'Foto', icon: Camera },
                { id: 'takes', label: 'Takes', icon: Film },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isLocked = !isScriptApproved && tab.id !== 'conversar';

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'py-2 px-1 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all relative',
                    isActive
                      ? 'bg-white text-zinc-950 font-bold shadow-md'
                      : isLocked
                      ? 'text-zinc-500 hover:text-zinc-400'
                      : 'text-zinc-400 hover:text-zinc-200'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-[9px] tracking-tight">{tab.label}</span>
                  {isLocked && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500/60" />
                  )}
                </button>
              );
            })}
          </div>

          {/* ABA 1: CONVERSA / ROTEIRO (MÁQUINA CONVERSACIONAL DE IA) */}
          {activeTab === 'conversar' && (
            <div className="space-y-4 animate-fade-in">
              {/* HISTÓRICO DE MENSAGENS CONVERSACIONAIS */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col gap-1',
                        isUser ? 'items-end' : 'items-start'
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 px-1">
                        {!isUser && (
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                        <span>{msg.senderTitle}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                        {msg.isAudio && (
                          <span className="bg-red-500/15 text-red-400 text-[9px] px-1 rounded flex items-center gap-1">
                            <Mic className="w-2.5 h-2.5" /> Áudio
                          </span>
                        )}
                      </div>

                      <div
                        className={cn(
                          'p-3 rounded-2xl text-xs leading-relaxed max-w-[92%]',
                          isUser
                            ? 'bg-amber-500/15 border border-amber-500/30 text-zinc-100 rounded-tr-xs'
                            : 'bg-black/40 border border-white/10 text-zinc-200 rounded-tl-xs'
                        )}
                      >
                        <p>{msg.text}</p>

                        {/* Ações sugeridas */}
                        {msg.suggestedActions && (
                          <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-white/[0.06]">
                            {msg.suggestedActions.map((action, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  if (action.action === 'example_barber') {
                                    handleSendMessage(
                                      'Quero gravar um vídeo de 30 segundos para uma barbearia falando sobre cortes masculinos que estão em alta.'
                                    );
                                  } else if (action.action === 'example_testimonial') {
                                    handleSendMessage(
                                      'Quero gravar um depoimento de cliente institucional de 45 segundos mostrando a transformação real e a satisfação com nosso serviço.'
                                    );
                                  }
                                }}
                                className="py-1 px-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg text-[11px] font-mono text-zinc-300 hover:text-white transition-colors"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isThinking && (
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl animate-pulse">
                    <div className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    <span>A equipe de IA está estruturando sua resposta...</span>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* CARD DE REVISÃO E APROVAÇÃO DO ROTEIRO (APARECE QUANDO HOUVER ROTEIRO) */}
              {currentScript && (
                <div className="pt-2">
                  <ScriptReviewCard
                    script={currentScript}
                    isApproved={isScriptApproved}
                    onApprove={handleApproveScript}
                    onRegenerate={handleRegenerateScript}
                    onUpdateScript={handleUpdateScript}
                    onRequestAdjustment={(prompt) => handleSendMessage(prompt)}
                  />
                </div>
              )}

              {/* BARRA DE ENTRADA CONVERSACIONAL: VOZ (ÁUDIO) OU TEXTO */}
              <div className="pt-2 border-t border-white/[0.08]">
                <VoiceInput
                  onSendMessage={(text, isAudio) => handleSendMessage(text, isAudio)}
                  disabled={isThinking}
                  placeholder={
                    currentScript
                      ? 'Peça um ajuste (ex: muda o gancho, tom mais engraçado) ou fale "Aprovado"...'
                      : 'Me conta o que você precisa gravar hoje (fale por áudio ou digite)...'
                  }
                />
              </div>
            </div>
          )}

          {/* ABA 2: DIRETOR GERAL */}
          {activeTab === 'diretor_geral' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {!isScriptApproved || !teamOutput ? (
                <div className="bg-black/30 border border-white/10 rounded-xl p-6 text-center space-y-3">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="font-bold text-white text-xs uppercase font-mono">
                    Aguardando Aprovação do Roteiro
                  </h4>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                    O Diretor Geral sintetiza a visão executiva e alinha a equipe técnica após você aprovar a narrativa.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('conversar')}
                    className="py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold"
                  >
                    Abrir Chat do Roteiro
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {/* ABA 3: DIRETOR DE CENA */}
          {activeTab === 'cena' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {!isScriptApproved || !teamOutput ? (
                <div className="bg-black/30 border border-white/10 rounded-xl p-6 text-center space-y-3">
                  <Lock className="w-8 h-8 text-blue-400 mx-auto" />
                  <h4 className="font-bold text-white text-xs uppercase font-mono">
                    Diretor de Cena Bloqueado
                  </h4>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                    O Diretor de Cena precisa do roteiro aprovado para posicionar os atores a 1,5m da parede e calcular a movimentação.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('conversar')}
                    className="py-2 px-4 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold"
                  >
                    Aprovar Roteiro no Chat
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {/* ABA 4: DIRETOR DE FOTOGRAFIA */}
          {activeTab === 'fotografia' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {!isScriptApproved || !teamOutput ? (
                <div className="bg-black/30 border border-white/10 rounded-xl p-6 text-center space-y-3">
                  <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="font-bold text-white text-xs uppercase font-mono">
                    Diretor de Fotografia Bloqueado
                  </h4>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                    O Fotógrafo selecionará as lentes do seu kit real e montará a iluminação a 45° assim que o roteiro for aprovado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('conversar')}
                    className="py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold"
                  >
                    Aprovar Roteiro no Chat
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {/* ABA 5: PLANO DE TAKES */}
          {activeTab === 'takes' && (
            <div className="space-y-3.5 text-xs animate-fade-in">
              {!isScriptApproved || !teamOutput ? (
                <div className="bg-black/30 border border-white/10 rounded-xl p-6 text-center space-y-3">
                  <Lock className="w-8 h-8 text-purple-400 mx-auto" />
                  <h4 className="font-bold text-white text-xs uppercase font-mono">
                    Plano de Takes Aguardando Roteiro
                  </h4>
                  <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                    Os takes operacionais são desmembrados diretamente das cenas do roteiro aprovado.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('conversar')}
                    className="py-2 px-4 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold"
                  >
                    Aprovar Roteiro no Chat
                  </button>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
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
          Carregando Diretor Criativo e Equipe de IA...
        </div>
      }
    >
      <DirectorContent />
    </Suspense>
  );
}
