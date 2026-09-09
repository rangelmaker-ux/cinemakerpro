import {
  GeneralDirectorOutput,
  ScriptCreatorOutput,
  ScriptScene,
  SharedProjectContext,
  TakePlanItem,
  VisualDirectionData,
} from './team-types';
import { runScriptCreator } from './agents/script-creator';
import { runSceneDirector } from './agents/scene-director';
import { runCinematographer } from './agents/cinematographer';
import { runGeneralDirector } from './agents/general-director';

/**
 * ESTADOS DA MÁQUINA DE ESTADOS CONVERSACIONAL (Seção 4 & 10 do Master Prompt)
 */
export type AIProductionStage =
  | 'idle' // Estado inicial: nada pré-carregado. "Me conta o que você precisa gravar."
  | 'user_input' // Usuário digitando ou falando por áudio
  | 'understanding' // IA processando o áudio / texto
  | 'clarification' // IA faz 1 pergunta focada caso falte informação crítica
  | 'creative_brief' // Briefing estruturado gerado da conversa
  | 'script_generation' // Criador de Roteiro gerando narrativa específica
  | 'script_review' // Roteiro aguardando aprovação, regeneração ou edição do usuário
  | 'script_approved' // Usuário aprovou o roteiro!
  | 'scene_generation' // Diretor de Cena ativado
  | 'take_generation' // Geração do plano de takes
  | 'visual_direction' // Diretor de Fotografia calcula luz a 45° e lentes do kit
  | 'image_analysis' // Análise do espaço real quando a foto for enviada
  | 'image_preview' // Simulação 3D fotorrealista com profundidade
  | 'production_ready'; // Set 100% pronto para gravação

/**
 * BRIEFING CRIATIVO EXTRAÍDO DINAMICAMENTE DA CONVERSA (Seção 13)
 */
export interface CreativeBrief {
  client: string;
  video_type: string;
  duration_seconds: number;
  topic: string;
  objective: string;
  speaker: string;
  platform: 'Instagram Reels' | 'TikTok' | 'YouTube' | 'Institucional' | 'Comercial' | 'Geral';
  format: '9:16' | '16:9' | '1:1';
  tone: string;
  style: string;
  specific_requests?: string[];
}

/**
 * MENSAGEM CONVERSACIONAL
 */
export interface ChatMessage {
  id: string;
  sender: 'user' | 'diretor_geral' | 'criador_roteiro' | 'diretor_cena' | 'diretor_fotografia';
  senderTitle: string;
  text: string;
  timestamp: string;
  isAudio?: boolean;
  audioDurationSec?: number;
  stage?: AIProductionStage;
  brief?: CreativeBrief;
  script?: ScriptCreatorOutput;
  suggestedActions?: { label: string; action: string; variant?: 'primary' | 'secondary' | 'outline' }[];
}

/**
 * ESTADO DO PROJETO CONVERSACIONAL
 */
export interface ProjectConversationState {
  stage: AIProductionStage;
  brief: CreativeBrief | null;
  script: ScriptCreatorOutput | null;
  sceneDirection: any | null;
  cinematography: any | null;
  generalDirection: GeneralDirectorOutput | null;
  isScriptApproved: boolean;
  userEditedFields: Record<string, boolean>;
  version: number;
  messages: ChatMessage[];
}

/**
 * CRIA O ESTADO INICIAL 100% LIMPO (SEÇÃO 1 & 45: ZERO SCRIPTS PRÉ-CARREGADOS)
 */
export function createInitialConversationState(clientName?: string): ProjectConversationState {
  return {
    stage: 'idle',
    brief: null,
    script: null,
    sceneDirection: null,
    cinematography: null,
    generalDirection: null,
    isScriptApproved: false,
    userEditedFields: {},
    version: 1,
    messages: [
      {
        id: 'msg-init',
        sender: 'criador_roteiro',
        senderTitle: 'Criador de Roteiro',
        text: 'Me conta o que você precisa gravar.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        stage: 'idle',
        suggestedActions: [
          { label: '🎙️ Falar por Áudio', action: 'start_audio', variant: 'primary' },
          { label: 'Vídeo para barbearia com cortes em alta', action: 'example_barber', variant: 'outline' },
          { label: 'Depoimento institucional de cliente', action: 'example_testimonial', variant: 'outline' },
          { label: 'Apresentação comercial de serviço', action: 'example_sales', variant: 'outline' },
        ],
      },
    ],
  };
}

/**
 * ANALISADOR DE INTENÇÃO E EXTRAÇÃO DE CONTEXTO (ÁUDIO OU TEXTO EM PT-BR)
 */
export function extractContextFromInput(
  rawInput: string,
  existingBrief: CreativeBrief | null
): {
  brief: CreativeBrief;
  isApproval: boolean;
  isRejectionOrRegen: boolean;
  isTargetedAdjustment: boolean;
  adjustmentType?: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue';
  adjustmentDetail?: string;
  isCompleteEnough: boolean;
  missingInfoQuestion?: string;
  wantsImmediateGeneration?: boolean;
} {
  const text = rawInput.toLowerCase().trim();

  // 1. Detecção de Aprovação
  const approvalKeywords = [
    'aprovar',
    'aprovado',
    'aprovo',
    'gostei',
    'ficou bom',
    'perfeito',
    'pode seguir',
    'seguir',
    'fechou',
    'pode gerar as cenas',
    'bora gravar',
    'excelente',
    'ótimo',
    'vamos nessa',
  ];
  const isApproval = approvalKeywords.some((kw) => text.includes(kw));

  // 2. Detecção de Rejeição / Regeneração Global
  const rejectionKeywords = [
    'não gostei',
    'nao gostei',
    'faz outro',
    'refaz',
    'outra ideia',
    'muda tudo',
    'tenta outra coisa',
    'não curti',
    'troca esse roteiro',
  ];
  const isRejectionOrRegen = rejectionKeywords.some((kw) => text.includes(kw));

  // 3. Detecção de Ajustes Específicos (Targeted Regeneration)
  let isTargetedAdjustment = false;
  let adjustmentType: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue' | undefined;
  let adjustmentDetail = text;

  if (text.includes('gancho') || text.includes('começo') || text.includes('abertura') || text.includes('primeiros segundos')) {
    isTargetedAdjustment = true;
    adjustmentType = 'hook';
  } else if (text.includes('cta') || text.includes('chamada') || text.includes('final') || text.includes('fechamento')) {
    isTargetedAdjustment = true;
    adjustmentType = 'cta';
  } else if (text.includes('curto') || text.includes('rápido') || text.includes('longo') || text.includes('segundos') || text.includes('minuto')) {
    isTargetedAdjustment = true;
    adjustmentType = 'duration';
  } else if (text.includes('engraçado') || text.includes('natural') || text.includes('forte') || text.includes('cinematográfico') || text.includes('sério')) {
    isTargetedAdjustment = true;
    adjustmentType = 'tone';
  } else if (text.includes('fala') || text.includes('diálogo') || text.includes('texto') || text.includes('cena')) {
    isTargetedAdjustment = true;
    adjustmentType = 'dialogue';
  }

  // 4. Extração de Duração
  let durationSec = existingBrief?.duration_seconds || 30;
  if (text.includes('15 segundos') || text.includes('15s')) durationSec = 15;
  else if (text.includes('30 segundos') || text.includes('30s') || text.includes('meio minuto')) durationSec = 30;
  else if (text.includes('45 segundos') || text.includes('45s')) durationSec = 45;
  else if (text.includes('60 segundos') || text.includes('60s') || text.includes('1 minuto') || text.includes('um minuto')) durationSec = 60;
  else if (text.includes('90 segundos') || text.includes('90s') || text.includes('1 minuto e meio') || text.includes('um minuto e meio')) durationSec = 90;
  else if (text.includes('2 minutos') || text.includes('dois minutos')) durationSec = 120;

  // 5. Extração de Nicho / Tópico
  let topic = existingBrief?.topic || '';
  let client = existingBrief?.client || 'Cliente';

  const nicheMap: Record<string, { topic: string; client: string; defaultSpeaker: string }> = {
    barbearia: { topic: 'cortes masculinos e estilo de cabelo', client: 'Barbearia', defaultSpeaker: 'o barbeiro' },
    cabelo: { topic: 'cuidados e tendências de corte de cabelo', client: 'Salão / Barbearia', defaultSpeaker: 'o especialista' },
    dentista: { topic: 'odontologia estética e saúde do sorriso', client: 'Clínica Odontológica', defaultSpeaker: 'o dentista' },
    médico: { topic: 'saúde preventiva e bem-estar', client: 'Consultório Médico', defaultSpeaker: 'o médico' },
    advogado: { topic: 'orientação jurídica e direitos práticos', client: 'Escritório de Advocacia', defaultSpeaker: 'o advogado' },
    academia: { topic: 'treino consistente, disciplina e resultados', client: 'Academia & Fitness', defaultSpeaker: 'o treinador' },
    restaurante: { topic: 'experiência gastronômica e pratos autorais', client: 'Restaurante', defaultSpeaker: 'o chef / proprietário' },
    hamburgueria: { topic: 'hambúrguer artesanal e sabor irresistível', client: 'Hamburgueria', defaultSpeaker: 'o criador da receita' },
    imobiliária: { topic: 'tour imobiliário e valorização de imóveis', client: 'Imobiliária', defaultSpeaker: 'o corretor' },
    psicólogo: { topic: 'saúde emocional e autoconhecimento', client: 'Consultório de Psicologia', defaultSpeaker: 'a psicóloga' },
    café: { topic: 'cafés especiais e método de extração', client: 'Cafeteria Especial', defaultSpeaker: 'o barista' },
  };

  let detectedSpeaker = existingBrief?.speaker || 'o apresentador';
  for (const [key, value] of Object.entries(nicheMap)) {
    if (text.includes(key)) {
      if (!topic) topic = value.topic;
      if (client === 'Cliente') client = value.client;
      if (detectedSpeaker === 'o apresentador') detectedSpeaker = value.defaultSpeaker;
      break;
    }
  }

  // Se o usuário falou livremente sem nicho da tabela, extrai a frase
  if (!topic) {
    if (text.includes('falando sobre')) {
      topic = rawInput.split(/falando sobre/i)[1]?.trim().split(/[.,]/)[0] || rawInput;
    } else if (text.includes('sobre')) {
      topic = rawInput.split(/sobre/i)[1]?.trim().split(/[.,]/)[0] || rawInput;
    } else {
      topic = rawInput.replace(/quero gravar|um vídeo|de \d+ segundos|para/gi, '').trim() || 'Apresentação de valor';
    }
  }

  // 6. Extração de Quem Aparece (Speaker)
  if (text.includes('barbeiro')) detectedSpeaker = 'o barbeiro';
  else if (text.includes('não quero aparecer') || text.includes('sem aparecer') || text.includes('apenas narração') || text.includes('voz em off')) {
    detectedSpeaker = 'voz em off com B-roll (sem rosto na câmera)';
  } else if (text.includes('eu mesmo') || text.includes('eu falando') || text.includes('olhando pra câmera') || text.includes('olhando para a câmera')) {
    detectedSpeaker = 'apresentador falando diretamente para a lente da câmera';
  }

  // 7. Extração de Tom
  let tone = existingBrief?.tone || 'Natural, direto e envolvente';
  if (text.includes('engraçado') || text.includes('humor')) tone = 'Descontraído com pitada de humor inteligente';
  else if (text.includes('cinematográfico') || text.includes('cinema')) tone = 'Cinematográfico, imersivo e elegante';
  else if (text.includes('natural') || text.includes('sem parecer propaganda') || text.includes('não quero vendedor')) {
    tone = 'Conversa sincera e natural, zero clichê publicitário';
  } else if (text.includes('direto ao ponto') || text.includes('curto e grosso')) {
    tone = 'Ultra direto ao ponto, foco em retenção instantânea';
  } else if (text.includes('sério') || text.includes('corporativo')) {
    tone = 'Profissional, acolhedor e com autoridade';
  }

  // 8. Plataforma e Formato
  let platform: CreativeBrief['platform'] = existingBrief?.platform || 'Instagram Reels';
  let format: CreativeBrief['format'] = existingBrief?.format || '9:16';
  if (text.includes('youtube') || text.includes('horizontal') || text.includes('16:9')) {
    platform = 'YouTube';
    format = '16:9';
  } else if (text.includes('tiktok')) {
    platform = 'TikTok';
    format = '9:16';
  } else if (text.includes('feed') || text.includes('1:1')) {
    format = '1:1';
  }

  // 9. Objetivo
  let objective = existingBrief?.objective || 'Educar a audiência e gerar desejo imediato';
  if (text.includes('vender') || text.includes('venda')) objective = 'Conversão direta e atração de novos clientes';
  else if (text.includes('ensinar') || text.includes('dica') || text.includes('dicas')) objective = 'Compartilhar dicas valiosas gerando autoridade';
  else if (text.includes('apresentar') || text.includes('institucional')) objective = 'Apresentar a estrutura e o diferencial da marca';

  const updatedBrief: CreativeBrief = {
    client: existingBrief?.client !== 'Cliente' && existingBrief?.client ? existingBrief.client : client,
    video_type: durationSec <= 60 ? 'reels' : 'institucional',
    duration_seconds: durationSec,
    topic: topic,
    objective: objective,
    speaker: detectedSpeaker,
    platform: platform,
    format: format,
    tone: tone,
    style: tone.includes('Cinematográfico') ? 'cinematografico' : 'dinamico',
    specific_requests: existingBrief?.specific_requests
      ? [...existingBrief.specific_requests, rawInput]
      : [rawInput],
  };

  // Avaliação de completude: precisa saber ao menos o tópico/nicho
  const isTooVague =
    text.length < 12 ||
    (text === 'quero gravar' || text === 'um vídeo' || text === 'quero um vídeo' || text === 'olá' || text === 'oi');

  const isCompleteEnough = !isTooVague && updatedBrief.topic.length > 3;

  let missingInfoQuestion: string | undefined = undefined;
  // Detecção se o usuário pediu explicitamente para já gerar o roteiro direto
  const generateKeywords = [
    'pode gerar',
    'gera o roteiro',
    'gera com o que tem',
    'já pode fazer',
    'cria o roteiro',
    'escreve o roteiro',
    'manda bala',
    'pode criar',
    'já pode gerar',
    'faz o roteiro',
    'já pode escrever',
  ];
  const wantsImmediateGeneration = generateKeywords.some((kw) => text.includes(kw));

  return {
    brief: updatedBrief,
    isApproval,
    isRejectionOrRegen,
    isTargetedAdjustment,
    adjustmentType,
    adjustmentDetail,
    isCompleteEnough,
    missingInfoQuestion,
    wantsImmediateGeneration,
  };
}

/**
 * GERA TÍTULO AUTOMÁTICO PARA O PROJETO DE ROTEIRO (Seção 3 & 29 do Master Prompt)
 * Exemplo do prompt: "3 Cortes Masculinos em Alta"
 */
export function generateScriptProjectTitle(rawInput: string, brief: CreativeBrief): string {
  const text = rawInput.toLowerCase();

  if (
    text.includes('três cortes') ||
    text.includes('3 cortes') ||
    (text.includes('corte') && text.includes('barbearia'))
  ) {
    return '3 Cortes Masculinos em Alta';
  }
  if (text.includes('promoção') || text.includes('inverno')) {
    return 'Promoção de Inverno';
  }
  if (text.includes('transformação')) {
    return 'Transformação da Barbearia';
  }
  if (text.includes('depoimento') || text.includes('transformação real')) {
    return 'Depoimento de Cliente Satisfeito';
  }
  if (text.includes('institucional')) {
    return 'Vídeo Institucional da Marca';
  }
  if (text.includes('hambúrguer') || text.includes('lanche')) {
    return 'Hambúrguer Artesanal Supremo';
  }
  if (text.includes('café') || text.includes('barista')) {
    return 'Segredos do Café Especial';
  }
  if (text.includes('academia') || text.includes('treino')) {
    return 'Disciplina e Resultados no Treino';
  }

  if (brief.topic && brief.topic !== 'Apresentação de valor') {
    const cleanWords = brief.topic
      .split(' ')
      .slice(0, 5)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return cleanWords.join(' ');
  }

  return 'Novo Projeto de Roteiro';
}

/**
 * GERADOR DE ROTEIRO NARRATIVO ESPECÍFICO (Seção 16 a 19 do Master Prompt)
 * Totalmente construído sobre a fala real do usuário, adaptando gancho, cenas e CTA.
 */
export function generateNarrativeScript(brief: CreativeBrief, isAlternative: boolean = false): ScriptCreatorOutput {
  const { topic, duration_seconds, tone, speaker, client } = brief;

  const isBarbershop = topic.toLowerCase().includes('barbearia') || topic.toLowerCase().includes('cabelo') || topic.toLowerCase().includes('corte');

  let hook = '';
  let centralQuestion = '';
  let cta = '';
  let scenes: ScriptScene[] = [];

  if (isBarbershop) {
    if (isAlternative) {
      hook = '"O erro mais comum que 90% dos homens cometem é pedir o corte da moda sem olhar o formato do próprio rosto."';
      centralQuestion = 'Como escolher o corte certo para valorizar seus traços sem depender de finalizador todo dia?';
      cta = '"Clica no botão da bio e agenda seu horário com quem entende de visagismo na prática."';
      scenes = [
        {
          sceneNumber: 1,
          sceneName: 'CENA 01 — O GANCHO VISAGISTA',
          stage: 'hook',
          objective: 'Quebrar o padrão e prender atenção nos primeiros 3 segundos',
          narrativePurpose: 'Alerta provocativo e autêntico',
          dialogue: 'O erro que a maioria dos homens comete é pedir o corte da moda sem saber se ele combina com o formato do rosto.',
          action: `${speaker} posicionado a 1,5m da parede de fundo, ajustando a capa de corte na cadeira enquanto fala diretamente para a câmera.`,
          visualIdea: 'Plano Médio vertical 9:16. Luz suave a 45° desenhando os traços da navalha e bancada de trabalho.',
          emotionalIntention: 'Alerta e curiosidade genuína.',
          durationSec: Math.min(6, Math.round(duration_seconds * 0.18)),
          shotType: 'Plano Médio (35mm)',
          transition: 'Corte seco no olhar',
        },
        {
          sceneNumber: 2,
          sceneName: 'CENA 02 — OS TRÊS CORTES EM ALTA',
          stage: 'discovery',
          objective: 'Entregar o conteúdo de valor sem enrolação',
          narrativePurpose: 'Demonstração de autoridade técnica',
          dialogue: 'Hoje, três estilos dominam: o Fade Suave para quem quer versatilidade, o Taper Fade discreto para ambientes corporativos e o Buzz Cut texturizado para quem quer praticidade máxima.',
          action: `${speaker} aponta para referências no espelho ou gesticula demonstrando a linha da costeleta e acabamento na nuca.`,
          visualIdea: 'Push-in suave da câmera destacando a precisão da tesoura e o degradê limpo.',
          emotionalIntention: 'Domínio profissional e clareza.',
          durationSec: Math.max(12, Math.round(duration_seconds * 0.55)),
          shotType: 'Close Médio (50mm)',
          transition: 'Corte rápido no movimento da tesoura',
        },
        {
          sceneNumber: 3,
          sceneName: 'CENA 03 — CHAMADA DIRETA',
          stage: 'cta',
          objective: 'Converter a atenção em agendamento',
          narrativePurpose: 'Encerramento acolhedor e seguro',
          dialogue: 'Não escolha no escuro. Clica no link da bio, agenda seu horário e a gente descobre junto qual corte nasceu pra você.',
          action: `${speaker} sorri com naturalidade, coloca a tesoura na bancada e faz gesto convidativo com a mão.`,
          visualIdea: 'Plano Médio com luz de recorte destacando a silhueta e ambiente da barbearia.',
          emotionalIntention: 'Confiança e ação imediata.',
          durationSec: Math.max(6, Math.round(duration_seconds * 0.27)),
          shotType: 'Plano Médio (35mm)',
          transition: 'Fade out sutil',
        },
      ];
    } else {
      hook = '"Você ainda chega na barbearia e fala \'faz igual da última vez\' porque tem medo do barbeiro errar o degradê?"';
      centralQuestion = 'Por que encontrar o corte ideal muda a sua presença em qualquer ambiente?';
      cta = '"Seu estilo merece mais do que o básico. Agende seu horário no link da bio e venha viver essa experiência."';
      scenes = [
        {
          sceneNumber: 1,
          sceneName: 'CENA 01 — O GANCHO DA IDENTIFICAÇÃO',
          stage: 'hook',
          objective: 'Tocar na dor real do cliente sem clichê publicitário',
          narrativePurpose: 'Conexão imediata nos 3 primeiros segundos',
          dialogue: 'Você ainda chega na barbearia e fala "faz igual da última vez" por puro receio de arriscar e ficar ruim?',
          action: `${speaker} segura uma tesoura na mão, olhar sincero para a lente, expressão descontraída de cumplicidade.`,
          visualIdea: 'Plano Médio com luz lateral suave a 45°. Fundo com profundidade descolada em 1,5m para destacar o personagem.',
          emotionalIntention: 'Empatia e identificação instantânea.',
          durationSec: Math.min(6, Math.round(duration_seconds * 0.18)),
          shotType: 'Plano Médio (35mm)',
          transition: 'Corte no ritmo da fala',
        },
        {
          sceneNumber: 2,
          sceneName: 'CENA 02 — A DICA PRÁTICA',
          stage: 'discovery',
          objective: 'Mostrar o diferencial de um corte bem desenhado',
          narrativePurpose: 'Construção de autoridade sem parecer arrogante',
          dialogue: 'O segredo de um degradê impecável não é só tirar volume, é respeitar o caimento natural do seu cabelo e a simetria da sua barba.',
          action: `${speaker} demonstra o movimento de corte suave no ar ou ajeita a navalha, mantendo postura dinâmica.`,
          visualIdea: 'Close detalhe nas mãos firmes e na lâmina, cortando com precisão.',
          emotionalIntention: 'Admiração e segurança técnica.',
          durationSec: Math.max(14, Math.round(duration_seconds * 0.54)),
          shotType: 'Close Médio (50mm)',
          transition: 'Corte no movimento da mão',
        },
        {
          sceneNumber: 3,
          sceneName: 'CENA 03 — A CONVOCAÇÃO',
          stage: 'cta',
          objective: 'Chamada para ação natural',
          narrativePurpose: 'Convidar para a cadeira',
          dialogue: 'Chega de corte improvisado. Clica no link da bio e garante o seu horário nesta semana.',
          action: `${speaker} gesticula em direção à cadeira da barbearia com sorriso acolhedor.`,
          visualIdea: 'Plano Médio aberto mostrando a bancada limpa e a cadeira pronta para receber o cliente.',
          emotionalIntention: 'Acolhimento e decisão tomada.',
          durationSec: Math.max(6, Math.round(duration_seconds * 0.28)),
          shotType: 'Plano Médio (35mm)',
          transition: 'Fade out elegante',
        },
      ];
    }
  } else {
    // Roteiro Dinâmico Geral construído sob medida para o tópico fornecido
    hook = isAlternative
      ? `"Se você ainda acha que ${topic} é complicado, é porque te ensinaram do jeito errado."`
      : `"Existe um detalhe essencial sobre ${topic} que quase ninguém tem coragem de falar abertamente."`;

    centralQuestion = `Qual é o caminho mais direto para ter resultado com ${topic}?`;
    cta = `"Quer saber como aplicar isso no seu caso? Deixa um comentário ou me chama no link da bio."`;

    const s1Duration = Math.max(4, Math.round(duration_seconds * 0.2));
    const s2Duration = Math.max(8, Math.round(duration_seconds * 0.55));
    const s3Duration = Math.max(5, Math.round(duration_seconds * 0.25));

    scenes = [
      {
        sceneNumber: 1,
        sceneName: 'CENA 01 — O GANCHO MAGNÉTICO',
        stage: 'hook',
        objective: 'Conquistar a atenção da audiência nos primeiros 3 segundos',
        narrativePurpose: 'Quebra de expectativa e curiosidade imediata',
        dialogue: isAlternative
          ? `Se você ainda acha que ${topic} é difícil ou inacessível, é porque nunca te mostraram esse ponto de vista.`
          : `A maioria das pessoas perde tempo tentando acertar em ${topic}, quando a solução real é muito mais simples.`,
        action: `${speaker} posicionado a 1,5m da parede de fundo, olhar firme e sincero na lente, quebrando a quarta parede.`,
        visualIdea: 'Plano Médio vertical com iluminação envolvente a 45° e recuo calculado da parede.',
        emotionalIntention: 'Curiosidade e quebra de padrão.',
        durationSec: s1Duration,
        shotType: 'Plano Médio (35mm)',
        transition: 'Corte seco',
      },
      {
        sceneNumber: 2,
        sceneName: 'CENA 02 — O NÚCLEO DA MENSAGEM',
        stage: 'discovery',
        objective: 'Entregar o valor central com clareza e autoridade',
        narrativePurpose: 'Construir confiança e esclarecimento',
        dialogue: `Quando você entende o processo e foca no que realmente importa, o resultado deixa de ser sorte e passa a ser previsível e consistente.`,
        action: `${speaker} dá um passo sutil de 20cm em direção à câmera, gesticulando com as mãos abertas para enfatizar a clareza.`,
        visualIdea: 'Enquadramento focado na expressão do apresentador, fundo com leve desfoque suave.',
        emotionalIntention: 'Clareza, firmeza e autoridade moral.',
        durationSec: s2Duration,
        shotType: 'Close Médio (50mm)',
        transition: 'Corte no gesto',
      },
      {
        sceneNumber: 3,
        sceneName: 'CENA 03 — CHAMADA PARA AÇÃO',
        stage: 'cta',
        objective: 'Direcionar a audiência para o próximo passo',
        narrativePurpose: 'Engajamento ou conversão objetiva',
        dialogue: `Se você quer dar esse próximo passo com tranquilidade, clica no link aqui embaixo e vamos conversar.`,
        action: `${speaker} conclui com postura aberta, sorriso acolhedor e apontamento sutil para o link.`,
        visualIdea: 'Plano Médio confortável, luz de recorte destacando a separação do cenário.',
        emotionalIntention: 'Convite fraterno e incentivo à ação.',
        durationSec: s3Duration,
        shotType: 'Plano Médio (35mm)',
        transition: 'Fade out',
      },
    ];
  }

  return {
    agent: 'script_creator',
    language: 'pt-BR',
    concept: `Produção vertical de ${duration_seconds}s focada em ${topic}, com linguagem humana e tom ${tone}.`,
    central_question: centralQuestion,
    hook: hook,
    narrative_strategy: 'Metodologia CineMaker: Gancho de retenção -> Revelação prática -> CTA direto sem clichês.',
    retention_technique: 'Pacing ágil, cortes de cena a cada 4-7 segundos e contato visual magnético com a lente.',
    scenes: scenes,
    dialogue_overview: scenes.map((s) => s.dialogue),
    cta: cta,
    visual_notes: [
      'Manter 1,5m de recuo da parede de fundo para profundidade cinematográfica real.',
      'Luz principal a 45° desenhando sombra suave no lado oposto do rosto.',
      'Lapela na altura do osso esterno a 15cm da boca.',
    ],
  };
}

/**
 * REGENERAÇÃO CIRÚRGICA (Targeted Regeneration - Seção 35)
 * Altera apenas o componente solicitado pelo usuário sem destruir o restante.
 */
export function applyTargetedAdjustment(
  currentScript: ScriptCreatorOutput,
  adjustmentType: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue',
  userDirective: string
): ScriptCreatorOutput {
  const updated = JSON.parse(JSON.stringify(currentScript)) as ScriptCreatorOutput;

  if (adjustmentType === 'hook') {
    if (userDirective.includes('agressivo') || userDirective.includes('forte') || userDirective.includes('impacto')) {
      updated.hook = '"Pare de fazer isso agora mesmo se você não quiser jogar dinheiro e tempo no lixo."';
    } else if (userDirective.includes('engraçado') || userDirective.includes('humor')) {
      updated.hook = '"Eu prometi que não ia falar nada, mas depois do que eu vi hoje, fui obrigado a ligar essa câmera."';
    } else {
      updated.hook = '"Se você pudesse mudar só uma coisa no seu visual hoje, qual seria a primeira?"';
    }
    if (updated.scenes[0]) {
      updated.scenes[0].dialogue = updated.hook.replace(/^"|"$/g, '');
      updated.scenes[0].narrativePurpose = `Gancho revisado conforme pedido: ${userDirective}`;
    }
  } else if (adjustmentType === 'cta') {
    if (userDirective.includes('whatsapp') || userDirective.includes('zap')) {
      updated.cta = '"Clica no botão do WhatsApp na bio e vem tirar suas dúvidas direto com a nossa equipe."';
    } else if (userDirective.includes('comentar') || userDirective.includes('comentário')) {
      updated.cta = '"Comenta aqui embaixo \'EU QUERO\' que eu te mando o passo a passo completo no direct."';
    } else {
      updated.cta = '"Se você quer garantir seu horário antes que a agenda feche, o link está fixado na bio."';
    }
    const lastScene = updated.scenes[updated.scenes.length - 1];
    if (lastScene) {
      lastScene.dialogue = updated.cta.replace(/^"|"$/g, '');
      lastScene.narrativePurpose = `CTA revisado: ${userDirective}`;
    }
  } else if (adjustmentType === 'tone') {
    updated.narrative_strategy = `Tom recalculado: ${userDirective}. Ajuste nas pausas e intenções de fala.`;
    updated.scenes = updated.scenes.map((s) => ({
      ...s,
      emotionalIntention: `Ajustado para tom ${userDirective}`,
    }));
  }

  return updated;
}

/**
 * ATIVAÇÃO DOS AGENTES DOWNSTREAM (CENA, FOTO, TAKES) APÓS APROVAÇÃO DO ROTEIRO (Seção 21 a 24)
 */
export function activateDownstreamAgents(
  context: SharedProjectContext,
  approvedScript: ScriptCreatorOutput
): GeneralDirectorOutput {
  // 1. Diretor de Cena traduz a narrativa aprovada em bloqueio físico no espaço (a 1,5m da parede)
  const sceneOutput = runSceneDirector(context, approvedScript);

  // 2. Diretor de Fotografia escolhe lentes do kit do usuário e iluminação a 45°
  const photoOutput = runCinematographer(context, approvedScript, sceneOutput);

  // 3. Monta Takes operacionais baseados nas cenas aprovadas
  const takes: TakePlanItem[] = approvedScript.scenes.map((scene, idx) => ({
    sceneNumber: scene.sceneNumber,
    takeNumber: 1,
    title: scene.sceneName,
    framing: scene.shotType,
    cameraMovement: idx === 0 ? 'Fixo em tripé firme' : 'Push-in lento e suave',
    durationSec: scene.durationSec,
    description: `Gravar fala: "${scene.dialogue.slice(0, 50)}...". ${scene.action}`,
    equipmentNeeded: `${photoOutput.lens.model} • Luz Principal a 45° • Lapela`,
    isDone: false,
  }));

  // 4. Monta Direção Visual Unificada
  const visualDirectionData: VisualDirectionData = {
    subject: {
      position: sceneOutput.subject_position.description,
      distance_from_background_m: 1.5,
      body_orientation: sceneOutput.body_orientation,
      eyeline: sceneOutput.eye_line,
    },
    camera: {
      position: photoOutput.camera.position,
      distance_m: photoOutput.camera.distance_m,
      height_m: photoOutput.camera.height_m,
      angle_deg: photoOutput.camera.angle_deg,
      shot_type: photoOutput.framing.shot_type,
      framing: photoOutput.framing.composition_rules,
    },
    lens: {
      model: photoOutput.lens.model,
      focal_length_mm: photoOutput.lens.focal_length_mm,
      recommended_aperture: photoOutput.camera.settings.aperture,
      shutter_speed: photoOutput.camera.settings.shutter,
      iso_note: photoOutput.camera.settings.iso,
      reasoning: photoOutput.lens.choice_reason,
    },
    lighting: {
      key: {
        position: `Lateral ${photoOutput.lighting.key_light.side === 'left' ? 'Esquerda' : 'Direita'} a 45°`,
        side: photoOutput.lighting.key_light.side,
        angle_deg: photoOutput.lighting.key_light.angle_deg,
        height: photoOutput.lighting.key_light.height,
        modifier: photoOutput.lighting.key_light.modifier,
        distance_to_wall_m: photoOutput.lighting.key_light.distance_to_wall_m,
        color_temp: photoOutput.lighting.key_light.color_temp,
        intensity_pct: 85,
        purpose: 'Modelagem tridimensional dos traços faciais mantendo catchlight vivo nos olhos.',
      },
      fill: {
        position: 'Lado oposto à luz principal',
        type: 'Rebatedor Suave ou Parede Branca',
        intensity_pct: 30,
      },
      rim: {
        position: 'Diagonal traseira a 135°',
        distance_to_wall_m: 1.5,
        color_temp: '5600K',
        purpose: 'Contorno dos ombros e separação do ambiente de fundo.',
      },
      ambient: {
        recommendation: 'Desligar lâmpadas de teto comuns (fluorescentes) que causam sombras duras sob os olhos.',
      },
    },
    depth: {
      subject_to_wall_clearance_m: 1.5,
      layering_notes: 'Recuo de 1,5m da parede de fundo garante desfoque óptico e sem sombras duras no fundo.',
      separation_method: 'Recuo físico de 1,5m da parede de fundo + contraste de luz de recorte.',
    },
    audio: {
      mic_model: context.audio[0]?.model || 'Microfone Lapela Sem Fio',
      position: 'Cápsula posicionada a 15cm da boca (altura do osso esterno), apontada para cima.',
      recommendation: 'Fixar cabo sob a camisa para eliminar atrito e desligar ruídos de fundo.',
    },
  };

  return {
    agent: 'general_director',
    language: 'pt-BR',
    project_summary: {
      title: context.project.title,
      client: context.client.name,
      objective: approvedScript.concept,
      tone: context.briefing.tone,
      format: context.project.format || '9:16',
    },
    creative_direction: {
      executive_summary: `Produção alinhada em torno do roteiro aprovado: "${approvedScript.hook.slice(0, 40)}...". Bloqueio a 1,5m da parede e luz principal a 45° calculada para o kit de equipamentos.`,
      narrative_thesis: approvedScript.narrative_strategy,
      visual_thesis: `Lente ${photoOutput.lens.focal_length_mm}mm com recuo de 1,5m e iluminação direcional suave.`,
      acting_thesis: sceneOutput.performance_notes[0] || 'Atuação orgânica e contato visual firme.',
    },
    conflict_resolutions: [
      {
        conflict: 'Posicionamento do sujeito em relação ao fundo.',
        resolution: 'Diretor Geral fixou a marcação a exatamente 1,5m de recuo da parede para criar profundidade real.',
        priority_applied: 'Linguagem Visual e Qualidade da Imagem',
      },
    ],
    script_direction: approvedScript,
    scene_direction: sceneOutput,
    cinematography_direction: photoOutput,
    visual_direction_data: visualDirectionData,
    takes: takes,
    warnings: [
      'Garantir recuo mínimo de 1,5m entre o personagem e a parede para manter a profundidade calculada.',
      'Posicionar a luz principal a 45° em relação ao nariz do sujeito para criar a sombra suave clássica.',
    ],
    alternatives: [
      {
        option_name: 'Setup Compacto (Espaço Reduzido)',
        description: 'Caso a sala seja menor que 3m, aproximar a câmera e usar lente 24mm ou 28mm mantendo o recuo da parede.',
        adjustments: 'Aproximar luz principal para 1 metro com dimmer em 60%.',
      },
    ],
    version: 1,
  };
}
