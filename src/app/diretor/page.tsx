'use client';

import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Crosshair,
  Sliders,
  HelpCircle,
  Film,
  Camera,
  CheckCircle2,
  AlertCircle,
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
  Compass,
  FolderOpen,
  Plus,
  Pencil,
  Trash2,
  Bookmark,
  RotateCcw,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/local-store';
import {
  activateDownstreamAgents,
  applyTargetedAdjustment,
  createInitialConversationState,
  extractContextFromInput,
  generateNarrativeScript,
  generateScriptProjectTitle,
  AIProductionStage,
  ChatMessage,
  CreativeBrief,
} from '@/lib/ai/conversational-engine';
import { GeneralDirectorOutput, ScriptCreatorOutput, SharedProjectContext } from '@/lib/ai/team-types';
import { CustomLightingSetup } from '@/lib/ai/lighting-3d-types';
import { generate3DLightingFromKit } from '@/lib/ai/lighting-presets';
import { DirectorMode, VideoType, SavedScript } from '@/types/database';
import { Studio3DLightingMap } from '@/components/director/Studio3DLightingMap';
import { WhyModal } from '@/components/director/WhyModal';
import { VoiceInput } from '@/components/director/VoiceInput';
import { ScriptReviewCard } from '@/components/director/ScriptReviewCard';
import { ScriptLibraryModal } from '@/components/director/ScriptLibraryModal';
import { SaveScriptModal } from '@/components/director/SaveScriptModal';
import { cn } from '@/lib/utils';

function DirectorContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const isQuick = searchParams.get('quick') === 'true';
  const savedScriptIdParam = searchParams.get('saved_script_id');

  const {
    clients,
    projects,
    equipments,
    kits,
    isLoaded,
    scriptProjects,
    activeScriptProjectId,
    activeScriptProject,
    createScriptProject,
    selectScriptProject,
    updateScriptProject,
    renameScriptProject,
    deleteScriptProject,
    addScriptVersion,
    savedScripts,
    scriptFolders,
    createScriptFolder,
    renameScriptFolder,
    deleteScriptFolder,
    saveScript,
    updateSavedScript,
    duplicateSavedScript,
    deleteSavedScript,
    clearActiveConversation,
  } = useAppStore();

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0];
  const activeProject = projects.find((p) => p.client_id === selectedClient?.id) || projects[0];
  const activeKit = kits.find((k) => k.is_default) || kits[0];

  // Modos de direção
  const [mode, setMode] = useState<DirectorMode>(isQuick ? 'rapido' : 'recomendado');
  const [videoType, setVideoType] = useState<VideoType>(activeProject?.video_type || 'institucional');

  // 1. ESTADOS DA MÁQUINA DE ESTADOS CONVERSACIONAL (IDLE POR PADRÃO, ZERO PRÉ-CARREGAMENTO)
  const [stage, setStage] = useState<AIProductionStage>('idle');
  const [currentBrief, setCurrentBrief] = useState<CreativeBrief | null>(null);
  const [currentScript, setCurrentScript] = useState<ScriptCreatorOutput | null>(null);
  const [isScriptApproved, setIsScriptApproved] = useState(false);
  const [teamOutput, setTeamOutput] = useState<GeneralDirectorOutput | null>(null);
  const [custom3DSetup, setCustom3DSetup] = useState<CustomLightingSetup | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [teamVersion, setTeamVersion] = useState(1);

  // Mensagens conversacionais (Inicia com saudação profissional convidando a falar ou digitar)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initial = createInitialConversationState(selectedClient?.name);
    return initial.messages;
  });

  // Gaveta ativa: Conversar/Roteiro, Diretor Geral, Cena, Foto, Takes
  const [activeTab, setActiveTab] = useState<'conversar' | 'diretor_geral' | 'cena' | 'fotografia' | 'takes'>('conversar');
  const [isWhyOpen, setIsWhyOpen] = useState(false);

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

  // Estados de Gerenciamento da Biblioteca de Roteiros ("Meus Roteiros")
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameInput, setRenameInput] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [activeSavedScriptId, setActiveSavedScriptId] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const prevProjectIdRef = useRef<string | null>(null);

  // Carregar roteiro salvo direto via URL se houver ?saved_script_id=...
  useEffect(() => {
    if (savedScriptIdParam && savedScripts.length > 0) {
      const found = savedScripts.find((s) => s.id === savedScriptIdParam);
      if (found) {
        setActiveSavedScriptId(found.id);
        setCurrentScript(found.script);
        setCurrentBrief(found.brief || null);
        setIsScriptApproved(true);
        setStage('script_review');
        setActiveTab('conversar');
      }
    }
  }, [savedScriptIdParam, savedScripts]);

  // Auto-scroll do chat ao receber mensagens
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Sincronização e isolamento estrito de cada Projeto de Roteiro
  useEffect(() => {
    if (!isLoaded) return;

    // Se nenhum projeto de roteiro existir ainda, cria o primeiro limpo
    if (scriptProjects.length === 0) {
      createScriptProject('Novo Roteiro', selectedClient?.id);
      return;
    }

    // Se não há projeto ativo selecionado, seleciona o primeiro disponível
    if (!activeScriptProjectId && scriptProjects.length > 0) {
      selectScriptProject(scriptProjects[0].id);
      return;
    }

    // Quando o activeScriptProject mudar (ex: ao criar novo ou trocar na biblioteca)
    if (activeScriptProject && activeScriptProject.id !== prevProjectIdRef.current) {
      prevProjectIdRef.current = activeScriptProject.id;
      setStage((activeScriptProject.stage as AIProductionStage) || 'idle');
      setCurrentBrief(activeScriptProject.brief || null);
      setCurrentScript(activeScriptProject.script || null);
      setIsScriptApproved(Boolean(activeScriptProject.is_approved));
      setMessages(
        activeScriptProject.conversation && activeScriptProject.conversation.length > 0
          ? activeScriptProject.conversation
          : createInitialConversationState(selectedClient?.name).messages
      );
      setDoneTakes([]);

      if (!activeScriptProject.is_approved) {
        setTeamOutput(null);
        setCustom3DSetup(null);
        setActiveTab('conversar');
      }
    }
  }, [isLoaded, activeScriptProjectId, activeScriptProject, scriptProjects.length]);

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
        photoUrl: null,
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
        blockedZones: [],
        roomSize: 'medio',
        singleLightOnly: userLights.length <= 1,
      },
      user_preferences: {
        preferredAngle: '45_left',
      },
    };
  }, [selectedClient, activeProject, equipments, videoType, mode, currentBrief]);

  // Recalcular downstream caso parâmetros mudem após aprovação
  useEffect(() => {
    if (isScriptApproved && currentScript) {
      const output = activateDownstreamAgents(sharedContext, currentScript);
      setTeamOutput(output);
      if (!custom3DSetup) {
        const initial3D = generate3DLightingFromKit(sharedContext, currentScript.scenes[0]?.sceneName || 'Cena 01');
        setCustom3DSetup(initial3D);
      }
    }
  }, [sharedContext, isScriptApproved, currentScript]);

  // NOVO PROJETO DE ROTEIRO (100% LIMPO, SEM MISTURAR COM O ANTERIOR)
  const handleNewScriptProject = () => {
    createScriptProject('Novo Roteiro', selectedClient?.id);
    setActiveSavedScriptId(null);
    setActiveTab('conversar');
    setIsLibraryOpen(false);
  };

  // LIMPAR CONVERSA TEMPORÁRIA (REGRA CRÍTICA: NUNCA DELETA ROTEIROS SALVOS OU PASTAS)
  const handleConfirmClearConversation = () => {
    clearActiveConversation();
    const initial = createInitialConversationState(selectedClient?.name);
    setMessages(initial.messages);
    setCurrentScript(null);
    setCurrentBrief(null);
    setIsScriptApproved(false);
    setTeamOutput(null);
    setCustom3DSetup(null);
    setActiveSavedScriptId(null);
    setStage('idle');
    setConfirmClearOpen(false);
  };

  // ABRIR MODAL PARA SALVAR ROTEIRO PERMANENTE EM PASTA
  const handleOpenSaveModal = () => {
    if (!currentScript) return;
    setIsSaveModalOpen(true);
  };

  // QUANDO O ROTEIRO FOR SALVO COM SUCESSO NA BIBLIOTECA
  const handleSavedSuccess = (saved: SavedScript) => {
    setActiveSavedScriptId(saved.id);
    const saveFeedbackMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'criador_roteiro',
      senderTitle: 'Criador de Roteiro',
      text: `✓ Roteiro "${saved.title}" salvo permanentemente na biblioteca! Ele está protegido em pasta e permanecerá intacto mesmo se você limpar esta conversa.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      stage: 'script_review',
    };
    setMessages((prev) => [...prev, saveFeedbackMsg]);
  };

  // SELECIONAR ROTEIRO SALVO DA BIBLIOTECA PARA EDIÇÃO
  const handleSelectSavedScript = (saved: SavedScript) => {
    setActiveSavedScriptId(saved.id);
    setCurrentScript(saved.script);
    setCurrentBrief(saved.brief || null);
    setIsScriptApproved(true);
    setStage('script_review');
    setActiveTab('conversar');

    const loadMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'criador_roteiro',
      senderTitle: 'Criador de Roteiro',
      text: `Carreguei o roteiro salvo "${saved.title}" da sua biblioteca para visualização e edição. Suas alterações serão salvas diretamente neste roteiro permanente.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      stage: 'script_review',
      script: saved.script,
    };
    setMessages([loadMsg]);
  };

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

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsThinking(true);

    // Auto-derivação de título inteligente a partir da primeira ideia de roteiro
    if (
      activeScriptProject &&
      (activeScriptProject.title === 'Novo Roteiro' ||
        activeScriptProject.title === 'Roteiro sem título' ||
        !activeScriptProject.title)
    ) {
      const analysisPreview = extractContextFromInput(text, currentBrief);
      const derived = generateScriptProjectTitle(text, analysisPreview.brief);
      renameScriptProject(activeScriptProject.id, derived);
    }

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

      // CASO 4: PRIMEIRO CONTATO (ESTÁGIO IDLE) — APRESENTAÇÃO DOS 3 ÂNGULOS ESTRATÉGICOS (OPÇÃO A)
      if (stage === 'idle' && !currentScript && !analysis.wantsImmediateGeneration && !analysis.selectedAngle) {
        const clarifyMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: 'criador_roteiro',
          senderTitle: 'Criador de Roteiro',
          text:
            analysis.clarificationText ||
            `Para a sua produção, identifiquei três caminhos estratégicos com alta retenção e agendamento.\n\nQual abordagem faz mais sentido para o seu cliente, ou prefere que eu faça a escolha profissional e gere direto?`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          stage: 'clarification',
          brief: analysis.brief,
          suggestedActions: analysis.suggestedActions || [
            { label: '🎯 Fazer a escolha profissional e gerar direto', action: 'send:Pode fazer a escolha profissional e gerar o roteiro direto!', variant: 'primary' },
            { label: '🎙️ Responder por Áudio', action: 'start_audio' },
          ],
        };
        const nextMsgs = [...updatedMessages, clarifyMsg];
        setMessages(nextMsgs);
        setStage('clarification');
        if (activeScriptProject) {
          updateScriptProject(activeScriptProject.id, {
            conversation: nextMsgs,
            stage: 'clarification',
            brief: analysis.brief,
            status: 'in_conversation',
          });
        }
        setIsThinking(false);
        return;
      }

      // CASO 5: CONTEXTO ESTABELECIDO OU ESCOLHA PROFISSIONAL -> CRIADOR DE ROTEIRO GERA NARRATIVA REAL (OPÇÃO B)
      const newScript = generateNarrativeScript(analysis.brief, false, analysis.selectedAngle);
      setCurrentScript(newScript);
      setIsScriptApproved(false);
      setStage('script_review');

      const scriptResponse: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'criador_roteiro',
        senderTitle: 'Criador de Roteiro',
        text: `Estruturei o roteiro com gancho de retenção nos primeiros 3 segundos, falas em linguagem natural e chamada para ação objetiva.\n\nConfira o roteiro abaixo no card. Você pode aprovar direto, pedir ajustes ou editar qualquer fala:`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stage: 'script_review',
        script: newScript,
        brief: analysis.brief,
      };

      const finalMsgs = [...updatedMessages, scriptResponse];
      setMessages(finalMsgs);
      setActiveTab('conversar');
      if (activeScriptProject) {
        updateScriptProject(activeScriptProject.id, {
          conversation: finalMsgs,
          stage: 'script_review',
          script: newScript,
          brief: analysis.brief,
          is_approved: false,
          status: 'script_generated',
        });
      }
      setIsThinking(false);
    }, 350);
  };

  // APROVAR ROTEIRO (DESBLOQUEIA DIRETORES DE CENA, FOTO, MAPA 3D E TAKES)
  const handleApproveScript = () => {
    if (!currentScript) return;

    setIsScriptApproved(true);
    setStage('production_ready');

    const output = activateDownstreamAgents(sharedContext, currentScript);
    setTeamOutput(output);
    setTeamVersion((v) => v + 1);

    // Gerar iluminação 3D com base no kit real
    const initial3D = generate3DLightingFromKit(
      sharedContext,
      currentScript.scenes[0]?.sceneName || 'Cena 01'
    );
    setCustom3DSetup(initial3D);

    const approvalMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'diretor_geral',
      senderTitle: 'Diretor Geral',
      text: `✓ Roteiro aprovado por você! O Diretor de Cena e o Diretor de Fotografia calcularam a posição do sujeito a 1,5m da parede de fundo, as lentes do seu kit (${output.cinematography_direction.lens.model}) e a luz principal a 45°. O Mapa 3D de Iluminação, Visão da Câmera e o plano de takes estão 100% liberados!`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      stage: 'production_ready',
    };

    const finalMsgs = [...messages, approvalMsg];
    setMessages(finalMsgs);
    if (activeScriptProject) {
      updateScriptProject(activeScriptProject.id, {
        conversation: finalMsgs,
        stage: 'production_ready',
        is_approved: true,
        status: 'approved',
      });
    }
  };

  // REGENERAR ROTEIRO (PRESERVA VERSÃO ANTERIOR NO HISTÓRICO)
  const handleRegenerateScript = () => {
    if (!currentBrief) return;
    setIsThinking(true);

    if (activeScriptProject && currentScript) {
      addScriptVersion(activeScriptProject.id, currentScript, 'Versão anterior antes de regenerar');
    }

    setTimeout(() => {
      const alternativeScript = generateNarrativeScript(currentBrief, true);
      setCurrentScript(alternativeScript);
      setIsScriptApproved(false);
      setStage('script_review');

      const regenMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'criador_roteiro',
        senderTitle: 'Criador de Roteiro',
        text: `Criei uma nova proposta de roteiro alternativa. Confira o novo gancho e as falas abaixo no card:`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stage: 'script_review',
        script: alternativeScript,
      };

      const finalMsgs = [...messages, regenMsg];
      setMessages(finalMsgs);
      if (activeScriptProject) {
        updateScriptProject(activeScriptProject.id, {
          conversation: finalMsgs,
          stage: 'script_review',
          script: alternativeScript,
          is_approved: false,
          status: 'editing',
        });
      }
      setIsThinking(false);
    }, 300);
  };

  // AJUSTE CIRÚRGICO (PRESERVA VERSÃO ANTERIOR NO HISTÓRICO)
  const handleTargetedAdjustment = (
    type: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue',
    directive: string
  ) => {
    if (!currentScript) return;
    setIsThinking(true);

    if (activeScriptProject) {
      addScriptVersion(activeScriptProject.id, currentScript, `Versão anterior ao ajuste de ${type}`);
    }

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

      const finalMsgs = [...messages, adjMsg];
      setMessages(finalMsgs);
      if (activeScriptProject) {
        updateScriptProject(activeScriptProject.id, {
          conversation: finalMsgs,
          stage: 'script_review',
          script: updated,
          is_approved: false,
          status: 'editing',
        });
      }
      setIsThinking(false);
    }, 250);
  };

  // EDIÇÃO MANUAL DO ROTEIRO PELO USUÁRIO (PERSISTE NO BANCO PERMANENTE SE SALVO)
  const handleUpdateScript = (editedScript: ScriptCreatorOutput) => {
    setCurrentScript(editedScript);

    // Se este roteiro já foi salvo como ativo permanente, persiste as alterações na biblioteca
    if (activeSavedScriptId) {
      updateSavedScript(activeSavedScriptId, {
        script: editedScript,
        brief: currentBrief,
      });
    }

    const editMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'diretor_geral',
      senderTitle: 'Diretor Geral',
      text: `Suas alterações manuais foram salvas e fixadas como conteúdo aprovado. Pronto para aprovação e gravação.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    const finalMsgs = [...messages, editMsg];
    setMessages(finalMsgs);
    if (activeScriptProject) {
      updateScriptProject(activeScriptProject.id, {
        script: editedScript,
        conversation: finalMsgs,
        user_edits: { ...(activeScriptProject.user_edits || {}), [Date.now()]: editedScript },
        status: 'editing',
      });
    }
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
              A equipe de IA lê suas lentes e luzes reais para calcular o mapa 3D de posicionamento
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

      {/* 1.5 BARRA DO PROJETO DE ROTEIRO ATIVO & BIBLIOTECA ("MEUS ROTEIROS") */}
      <div className="bg-[#111318] border border-purple-500/20 bg-gradient-to-r from-purple-950/20 via-[#111318] to-amber-950/10 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-semibold">
                ROTEIRO:
              </span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-md">
                {activeScriptProject?.title || 'Novo Roteiro'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setRenameInput(activeScriptProject?.title || '');
                  setIsRenaming(true);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
                title="Renomear este roteiro"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {activeScriptProject && (
                <span
                  className={cn(
                    'text-[9px] font-mono px-2 py-0.5 rounded border font-semibold uppercase',
                    activeScriptProject.status === 'approved'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                      : activeScriptProject.status === 'script_generated'
                      ? 'bg-purple-500/15 text-purple-400 border-purple-500/25'
                      : activeScriptProject.status === 'editing'
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                      : activeScriptProject.status === 'in_conversation'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25'
                  )}
                >
                  {activeScriptProject.status === 'approved'
                    ? 'Aprovado'
                    : activeScriptProject.status === 'script_generated'
                    ? 'Roteiro gerado'
                    : activeScriptProject.status === 'editing'
                    ? 'Roteiro em edição'
                    : activeScriptProject.status === 'in_conversation'
                    ? 'Em conversa'
                    : 'Rascunho'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
              Ideia isolada com histórico, versões e plano de takes dedicados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsLibraryOpen(true)}
            className="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Meus Roteiros ({scriptProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={handleNewScriptProject}
            className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Novo Roteiro</span>
          </button>
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

      {/* 3. SELETOR DE ABAS PRINCIPAIS — CADA UM NO SEU CANTO */}
      <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-1.5 shadow-md">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-mono text-center">
          {(
            [
              { id: 'conversar', label: 'Chat do Roteiro', icon: MessageSquare, desc: 'Criação & Falas' },
              { id: 'diretor_geral', label: 'Diretor Geral', icon: Crosshair, desc: 'Visão Executiva' },
              { id: 'cena', label: 'Diretor de Cena', icon: User, desc: 'Posição & Corpo' },
              { id: 'fotografia', label: 'Fotografia & Luz', icon: Camera, desc: 'Mapa 3D & Kit' },
              { id: 'takes', label: 'Plano de Takes', icon: Film, desc: 'Operação de Gravação' },
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
                  'py-2.5 px-2 rounded-xl text-xs font-medium flex flex-col items-center gap-1 transition-all relative',
                  isActive
                    ? 'bg-white text-zinc-950 font-bold shadow-md'
                    : isLocked
                    ? 'text-zinc-500 hover:text-zinc-400 bg-white/[0.02]'
                    : 'text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold">{tab.label}</span>
                </div>
                <span className={cn('text-[9px] hidden sm:block', isActive ? 'text-zinc-600' : 'text-zinc-500')}>
                  {tab.desc}
                </span>
                {isLocked && (
                  <div
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80"
                    title="Requer aprovação do roteiro"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. CONTEÚDO EXCLUSIVO DA ABA ATIVA */}

      {/* ABA 1: CHAT DO ROTEIRO (CHAT E ROTEIRO ISOLADOS, SEM MAPA 3D OU METADADOS DESNECESSÁRIOS) */}
      {activeTab === 'conversar' && (
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4 shadow-md max-w-4xl mx-auto w-full animate-fade-in">
          {/* CABEÇALHO DO CHAT COM CONTROLE DE LIMPEZA E STATUS */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-300 font-semibold">Chat de Criação do Roteiro</span>
              {activeSavedScriptId && (
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono px-2.5 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                  <Bookmark className="w-2.5 h-2.5" />
                  Roteiro Salvo em Pasta
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="py-1.5 px-3 rounded-xl bg-white/[0.04] hover:bg-red-500/15 text-zinc-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Limpar mensagens e rascunhos temporários da conversa atual"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar conversa</span>
            </button>
          </div>

          {/* HISTÓRICO DE MENSAGENS CONVERSACIONAIS */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
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
                      <div
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          msg.sender === 'criador_roteiro' ? 'bg-purple-400' : 'bg-amber-400'
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        msg.sender === 'criador_roteiro' ? 'text-purple-300 font-semibold' : ''
                      )}
                    >
                      {msg.senderTitle}
                    </span>
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
                      'p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%]',
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
                              if (action.action.startsWith('send:')) {
                                handleSendMessage(action.action.replace('send:', ''));
                              } else if (action.action === 'example_barber') {
                                handleSendMessage(
                                  'Quero gravar um vídeo de 30 segundos para uma barbearia falando sobre cortes masculinos que estão em alta.'
                                );
                              } else if (action.action === 'example_testimonial') {
                                handleSendMessage(
                                  'Quero gravar um depoimento de cliente institucional de 45 segundos mostrando a transformação real e a satisfação com nosso serviço.'
                                );
                              } else if (action.action === 'example_sales') {
                                handleSendMessage(
                                  'Quero gravar uma apresentação comercial direta de 30 segundos para atrair novos clientes com foco em resultado rápido.'
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

          {/* CARD DE REVISÃO E APROVAÇÃO DO ROTEIRO (ROTEIRO LIMPO) */}
          {currentScript && (
            <div className="pt-2">
              <ScriptReviewCard
                script={currentScript}
                isApproved={isScriptApproved}
                onApprove={handleApproveScript}
                onRegenerate={handleRegenerateScript}
                onUpdateScript={handleUpdateScript}
                onRequestAdjustment={(prompt) => handleSendMessage(prompt)}
                onSaveToLibrary={handleOpenSaveModal}
                isSavedInLibrary={Boolean(activeSavedScriptId || savedScripts.some((s) => s.title === activeScriptProject?.title))}
                versions={activeScriptProject?.versions || []}
                currentVersionNumber={(activeScriptProject?.versions?.length || 0) + 1}
                onSelectVersion={(versionScript) => setCurrentScript(versionScript)}
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
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4 shadow-md max-w-4xl mx-auto w-full animate-fade-in">
          {!isScriptApproved || !teamOutput ? (
            <div className="bg-black/30 border border-white/10 rounded-2xl p-8 text-center space-y-3">
              <Lock className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-white text-xs uppercase font-mono">
                Aguardando Aprovação do Roteiro
              </h4>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                O Diretor Geral sintetiza a visão executiva e alinha a equipe técnica após você aprovar a narrativa no Chat do Roteiro.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('conversar')}
                className="py-2.5 px-5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                Abrir Chat do Roteiro
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-bold text-white uppercase text-xs font-mono">
                    DIRETOR GERAL (Decisão Criativa & Executiva)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded font-semibold">
                  LÍDER DA PRODUÇÃO
                </span>
              </div>

              {/* Resumo Executivo */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 block">
                  Síntese da Produção:
                </span>
                <p className="text-zinc-200 text-xs leading-relaxed">
                  {teamOutput.creative_direction.executive_summary}
                </p>
              </div>

              {/* Teses dos Especialistas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-black/20 p-4 rounded-xl border border-white/[0.05] space-y-1.5">
                  <span className="text-[10px] font-mono text-purple-400 font-semibold uppercase block">
                    📖 Tese Narrativa (Roteiro):
                  </span>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    {teamOutput.creative_direction.narrative_thesis}
                  </p>
                </div>

                <div className="bg-black/20 p-4 rounded-xl border border-white/[0.05] space-y-1.5">
                  <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase block">
                    🎥 Tese Visual (Fotografia & Luz):
                  </span>
                  <p className="text-zinc-300 text-xs leading-relaxed">
                    {teamOutput.creative_direction.visual_thesis}
                  </p>
                </div>
              </div>

              {/* Conflitos Resolvidos */}
              {teamOutput.conflict_resolutions.length > 0 && (
                <div className="bg-amber-500/[0.04] p-4 rounded-xl border border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Conflito Físico Resolvido pelo Diretor Geral:</span>
                  </span>
                  {teamOutput.conflict_resolutions.map((c, i) => (
                    <div key={i} className="text-xs text-zinc-300 space-y-1">
                      <p className="text-amber-200 font-medium">• {c.conflict}</p>
                      <p className="text-zinc-400 pl-3">↳ Solução: {c.resolution}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: DIRETOR DE CENA (SOMENTE AS INFORMAÇÕES DE CENA) */}
      {activeTab === 'cena' && (
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4 shadow-md max-w-4xl mx-auto w-full animate-fade-in">
          {!isScriptApproved || !teamOutput ? (
            <div className="bg-black/30 border border-white/10 rounded-2xl p-8 text-center space-y-3">
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
                className="py-2.5 px-5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                Aprovar Roteiro no Chat
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="font-bold text-white uppercase text-xs font-mono">
                    DIRETOR DE CENA (Corpo, Pessoas & Bloqueio)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded font-semibold">
                  ATUAÇÃO NO SET
                </span>
              </div>

              {/* Posicionamento Físico & Recuo de 1,5m */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-zinc-400">
                  <span className="text-blue-400 font-bold uppercase">Posição no Espaço</span>
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    1,5m DA PAREDE DE FUNDO
                  </span>
                </div>
                <p className="text-zinc-200 text-xs leading-relaxed">
                  {teamOutput.scene_direction.subject_position.description}
                </p>
              </div>

              {/* Orientação Corporal & Linha dos Olhos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-black/30 p-4 rounded-xl border border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold block">Orientação Corporal</span>
                  <p className="text-zinc-200 text-xs leading-relaxed">
                    {teamOutput.scene_direction.body_orientation}
                  </p>
                </div>

                <div className="bg-black/30 p-4 rounded-xl border border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase font-semibold block">Linha de Olhar</span>
                  <p className="text-zinc-200 text-xs leading-relaxed">
                    {teamOutput.scene_direction.eye_line}
                  </p>
                </div>
              </div>

              {/* Movimentação e Bloqueio */}
              <div className="bg-black/30 p-4 rounded-xl border border-white/[0.06] space-y-2">
                <span className="text-[10px] font-mono font-semibold uppercase text-zinc-400 block">
                  Movimentação & Bloqueio Cênico:
                </span>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  • Início da Cena: {teamOutput.scene_direction.movement.start_action}
                </p>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  • Fluxo de Movimento: {teamOutput.scene_direction.movement.motion_flow}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 4: FOTOGRAFIA & LUZ (MAPA 3D DEDICADO AQUI) */}
      {activeTab === 'fotografia' && (
        <div className="space-y-4 max-w-5xl mx-auto w-full animate-fade-in">
          {!isScriptApproved || !teamOutput ? (
            <div className="bg-[#111318] border border-white/10 rounded-2xl p-8 text-center space-y-3">
              <Lock className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-white text-xs uppercase font-mono">
                Diretor de Fotografia Bloqueado
              </h4>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                O Fotógrafo selecionará as lentes do seu kit real e montará o mapa de luz a 45° assim que o roteiro for aprovado no Chat do Roteiro.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('conversar')}
                className="py-2.5 px-5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                Aprovar Roteiro no Chat
              </button>
            </div>
          ) : (
            <>
              {/* CABEÇALHO DO FOTÓGRAFO */}
              <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="font-bold text-white uppercase text-xs font-mono">
                    DIRETOR DE FOTOGRAFIA (Mapa 3D de Iluminação & Câmera)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded font-semibold">
                  {teamOutput.cinematography_direction.lens.source === 'equipamento_proprio' ? 'SEU KIT REAL' : 'RECOMENDADO'}
                </span>
              </div>

              {/* MAPA 3D DO ESTÚDIO DEDICADO NESTA ABA */}
              <Studio3DLightingMap
                currentSetup={custom3DSetup}
                isScriptApproved={isScriptApproved}
                onUpdateSetup={setCustom3DSetup}
                onOpenChat={() => setActiveTab('conversar')}
                activeSceneName={currentScript?.scenes[0]?.sceneName || 'Cena 01'}
              />

              {/* DETALHES TÉCNICOS: LENTES E ILUMINAÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lente Escolhida do Kit */}
                <div className="bg-[#111318] border border-white/[0.08] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                    <span className="uppercase font-semibold">Lente do seu Kit</span>
                    <span className="text-amber-400 font-bold">{teamOutput.cinematography_direction.lens.focal_length_mm}mm</span>
                  </div>
                  <h4 className="font-semibold text-white text-sm">
                    {teamOutput.cinematography_direction.lens.model}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {teamOutput.cinematography_direction.lens.choice_reason}
                  </p>
                </div>

                {/* Iluminação Principal a 45° */}
                <div className="bg-[#111318] border border-white/[0.08] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                    <span className="uppercase font-semibold">Luz Principal (Key Light)</span>
                    <span className="text-amber-400 font-bold">ÂNGULO 45°</span>
                  </div>
                  <h4 className="font-medium text-white text-xs">
                    {teamOutput.cinematography_direction.lighting.key_light.equipment_used}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Altura {teamOutput.cinematography_direction.lighting.key_light.height} com {teamOutput.cinematography_direction.lighting.key_light.modifier}.
                  </p>
                  <p className="text-[10px] font-mono text-zinc-400">
                    Distância da parede: {teamOutput.cinematography_direction.lighting.key_light.distance_to_wall_m}m (Sombra suave calculada).
                  </p>
                </div>
              </div>

              {/* Barra de Ação & Por Quê */}
              <div className="flex items-center justify-between bg-[#111318] border border-white/[0.08] p-3 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Posições em metros e graus calculadas para montagem física no set</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsWhyOpen(true)}
                  className="py-2 px-3.5 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white font-medium rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Por quê?</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ABA 5: PLANO DE TAKES (SOMENTE OS TAKES) */}
      {activeTab === 'takes' && (
        <div className="bg-[#111318] border border-white/[0.08] rounded-2xl p-4 sm:p-6 space-y-4 shadow-md max-w-4xl mx-auto w-full animate-fade-in">
          {!isScriptApproved || !teamOutput ? (
            <div className="bg-black/30 border border-white/10 rounded-2xl p-8 text-center space-y-3">
              <Lock className="w-8 h-8 text-purple-400 mx-auto" />
              <h4 className="font-bold text-white text-xs uppercase font-mono">
                Plano de Takes Aguardando Roteiro
              </h4>
              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed">
                Os takes operacionais são gerados a partir das cenas do roteiro aprovado no Chat do Roteiro.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('conversar')}
                className="py-2.5 px-5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                Aprovar Roteiro no Chat
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span className="font-bold text-white uppercase text-xs font-mono">
                    Plano Operacional de Takes
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-300 bg-white/[0.04] px-3 py-1 rounded-xl border border-white/10">
                  <strong className="text-emerald-400">{doneTakes.length}</strong> de <strong>{teamOutput.takes.length}</strong> gravados
                </span>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {teamOutput.takes.map((take) => {
                  const isDone = doneTakes.includes(take.sceneNumber);

                  return (
                    <div
                      key={take.sceneNumber}
                      onClick={() => toggleTake(take.sceneNumber)}
                      className={cn(
                        'p-4 rounded-xl border transition-all cursor-pointer select-none',
                        isDone
                          ? 'bg-emerald-500/[0.06] border-emerald-500/30'
                          : 'bg-black/30 border-white/[0.06] hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                          CENA 0{take.sceneNumber} • {take.framing}
                        </span>
                        <div
                          className={cn(
                            'w-5 h-5 rounded-lg flex items-center justify-center text-xs transition-colors',
                            isDone ? 'bg-emerald-400 text-zinc-950' : 'border border-zinc-600 hover:border-zinc-400'
                          )}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <h4
                        className={cn(
                          'font-semibold text-white text-xs mb-1',
                          isDone && 'line-through text-zinc-500'
                        )}
                      >
                        {take.title}
                      </h4>

                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {take.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE EXPLICAÇÃO TÉCNICA */}
      <WhyModal
        isOpen={isWhyOpen}
        onClose={() => setIsWhyOpen(false)}
        spatialData={{
          elements: [],
          lines: [],
          cameraSettings: {
            lensName: custom3DSetup?.camera.model || 'Lente Principal',
            focalLength: `${custom3DSetup?.camera.focalLengthMm || 35}mm`,
            aperture: custom3DSetup?.camera.aperture || 'f/2.8',
            height: `${custom3DSetup?.camera.heightM || 1.45}m`,
            framing: custom3DSetup?.camera.framing || 'Plano Médio',
            shotType: custom3DSetup?.camera.shotType || 'Plano Médio',
          },
          lightingSettings: {
            keyLightAngle: `${custom3DSetup?.lights[0]?.angleDeg || 45}°`,
            keyLightHeight: `${custom3DSetup?.lights[0]?.heightM || 1.85}m`,
            keyLightModifier: custom3DSetup?.lights[0]?.modifier || 'Softbox',
            backLightNotes: `Recuo de ${custom3DSetup?.subject.distanceFromWallM || 1.5}m da parede`,
          },
          audioSettings: {
            micType: custom3DSetup?.audio.model || 'Lapela Sem Fio',
            position: custom3DSetup?.audio.positionLabel || 'No esterno a 15cm da boca',
            cautions: 'Fixar cabo sob a camisa',
          },
          subjectSettings: {
            distanceFromWall: `${custom3DSetup?.subject.distanceFromWallM || 1.5}m da parede`,
            orientation: custom3DSetup?.subject.bodyOrientation || '20° virado para a luz',
          },
          avoids: ['Evitar posicionar o sujeito colado na parede'],
          whyExplanation: custom3DSetup?.purpose || 'Criar tridimensionalidade e separação visual cinematográfica.',
          takesPlan: [],
        }}
      />

      {/* MODAL DE RENOMEAR TÍTULO DO ROTEIRO */}
      {isRenaming && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111318] border border-white/10 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Pencil className="w-4 h-4 text-purple-400" />
              <span>Renomear Projeto de Roteiro</span>
            </div>
            <p className="text-xs text-zinc-400">
              Escolha um nome descritivo para identificar facilmente este roteiro na sua biblioteca.
            </p>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
              placeholder="Ex: 3 Cortes Masculinos em Alta"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeScriptProject && renameInput.trim()) {
                    renameScriptProject(activeScriptProject.id, renameInput.trim());
                    setIsRenaming(false);
                  }
                }
              }}
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeScriptProject && renameInput.trim()) {
                    renameScriptProject(activeScriptProject.id, renameInput.trim());
                    setIsRenaming(false);
                  }
                }}
                className="py-1.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-md"
              >
                Salvar Título
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PARA LIMPAR CONVERSA TEMPORÁRIA */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#111318] border border-amber-500/30 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Limpar conversa temporária?</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Isso limpará as mensagens e rascunhos desta conversa para começar uma nova ideia. <strong className="text-white">Seus roteiros e pastas salvos continuarão 100% protegidos na biblioteca.</strong>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="py-2 px-3 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:bg-white/[0.06] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClearConversation}
                className="py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                Limpar Conversa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA SALVAR ROTEIRO EM PASTA DA BIBLIOTECA */}
      {currentScript && (
        <SaveScriptModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          currentScript={currentScript}
          currentBrief={currentBrief}
          initialTitle={activeScriptProject?.title || 'Novo Roteiro'}
          defaultClientId={selectedClient?.id}
          clients={clients}
          scriptFolders={scriptFolders}
          onCreateFolder={createScriptFolder}
          onSaveScript={saveScript}
          onSavedSuccess={handleSavedSuccess}
        />
      )}

      {/* BIBLIOTECA DE ROTEIROS SALVOS & CONVERSAS */}
      <ScriptLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        savedScripts={savedScripts}
        scriptFolders={scriptFolders}
        clients={clients}
        activeClientId={selectedClient?.id}
        onSelectSavedScript={handleSelectSavedScript}
        onRenameSavedScript={(id, newTitle) => updateSavedScript(id, { title: newTitle })}
        onDuplicateSavedScript={duplicateSavedScript}
        onDeleteSavedScript={deleteSavedScript}
        onCreateFolder={createScriptFolder}
        onRenameFolder={renameScriptFolder}
        onDeleteFolder={deleteScriptFolder}
        scriptProjects={scriptProjects}
        activeProjectId={activeScriptProjectId}
        onSelectProject={(id) => {
          setActiveSavedScriptId(null);
          selectScriptProject(id);
          setIsLibraryOpen(false);
        }}
        onCreateNewProject={handleNewScriptProject}
        onRenameProject={(id, newTitle) => renameScriptProject(id, newTitle)}
        onDeleteProject={(id) => deleteScriptProject(id)}
        onClearConversation={handleConfirmClearConversation}
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
