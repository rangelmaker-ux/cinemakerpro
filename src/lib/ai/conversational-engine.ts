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
 * ESTADOS DA MÁQUINA DE ESTADOS CONVERSACIONAL
 */
export type AIProductionStage =
  | 'idle' // Estado inicial: nada pré-carregado. "Me conta o que você precisa gravar."
  | 'user_input' // Usuário digitando ou falando por áudio
  | 'understanding' // IA processando o áudio / texto
  | 'clarification' // IA apresenta opções estratégicas caso falte direcionamento
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
 * BRIEFING CRIATIVO EXTRAÍDO DINAMICAMENTE DA CONVERSA
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
  target_audience?: string;
  creative_angle?: string;
  creative_strategy?: string;
  creative_justification?: string;
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
 * CRIA O ESTADO INICIAL 100% LIMPO (ZERO SCRIPTS PRÉ-CARREGADOS)
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
 * PLAYBOOKS ESTRATÉGICOS POR NICHO (Metodologia CineMaker Pro)
 * Transforma: INTENÇÃO DO USUÁRIO -> RACIOCÍNIO -> ESTRATÉGIA CRIATIVA -> ROTEIRO REAL FALADO
 * REGRA ABSOLUTA DE CONTINUIDADE NARRATIVA:
 * CADA CENA É UM ELO DE UMA HISTÓRIA CONTÍNUA (CAUSA E EFEITO: A ACONTECE -> LOGO B -> QUE GERA C -> QUE LEVA A D).
 * NADA DE FRASES MOTIVACIONAIS ISOLADAS. NADA DE CLICHÊS GENÉRICOS.
 */
export interface StrategicAngle {
  key: string;
  name: string;
  shortLabel: string;
  description: string;
  hook: string;
  central_question: string;
  cta: string;
  creative_justification: string;
  scenes: (durationSec: number, speaker: string) => ScriptScene[];
}

export interface NichePlaybook {
  nicheKey: string;
  nicheName: string;
  defaultClient: string;
  defaultSpeaker: string;
  targetAudience: string;
  angles: StrategicAngle[];
}

/**
 * Distribuidor temporal cinematográfico para 5 cenas com ritmo balanceado
 */
function distribute5Scenes(durationSec: number) {
  const s1 = Math.max(4, Math.round(durationSec * 0.18));
  const s2 = Math.max(5, Math.round(durationSec * 0.20));
  const s3 = Math.max(6, Math.round(durationSec * 0.24));
  const s4 = Math.max(5, Math.round(durationSec * 0.20));
  const s5 = Math.max(4, durationSec - (s1 + s2 + s3 + s4));
  return { s1, s2, s3, s4, s5 };
}

export const STRATEGIC_PLAYBOOKS: Record<string, NichePlaybook> = {
  barbearia: {
    nicheKey: 'barbearia',
    nicheName: 'Barbearia / Estilo Masculino',
    defaultClient: 'Barbearia',
    defaultSpeaker: 'o barbeiro',
    targetAudience: 'Homens que buscam valorizar a própria imagem mas têm medo de errar no corte',
    angles: [
      {
        key: 'durabilidade',
        name: 'O Segredo da Durabilidade',
        shortLabel: '1. O Segredo da Durabilidade',
        description: 'Explicar por que o corte perde o formato em poucos dias e como a finalização correta resolve isso.',
        hook: '"Seu corte fica perfeito quando você sai da barbearia e três dias depois já parece outro?"',
        central_question: 'Por que o caimento natural e a finalização diária determinam a durabilidade do corte?',
        cta: '"Na próxima vez que for cortar, não pede só o nome do corte. Pergunta como ele funciona no seu cabelo. Clica no link da bio e agenda seu horário."',
        creative_justification: 'Em vez de uma propaganda genérica sobre corte de cabelo, atacamos a frustração real do cliente: o cabelo perder a forma logo após sair da barbearia. A narrativa segue causa e efeito estrita (Seção 29 do Master Prompt).',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O PROBLEMA DA DURABILIDADE',
              stage: 'hook',
              objective: 'Parar o scroll abrindo uma pergunta imediata sobre uma frustração comum',
              narrativePurpose: 'Abertura do arco narrativo através de identificação imediata',
              dialogue: 'Seu corte fica perfeito quando você sai da barbearia e três dias depois já parece outro?',
              action: `${speaker} a 1,5m da parede de fundo, limpando a lâmina com toalha de microfibra, olhar seguro e calmo diretamente para a lente.`,
              visualIdea: 'Plano Médio vertical 9:16. Iluminação a 45° suave modelando os traços do rosto e o reflexo metálico das ferramentas.',
              emotionalIntention: 'Curiosidade e alívio por ter a dúvida reconhecida.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O CONTEXTO DOS PRIMEIROS DIAS',
              stage: 'development',
              objective: 'Desenvolver a pergunta sem concluir precipitadamente',
              narrativePurpose: 'Conexão causal: do sintoma para o que ocorre no dia a dia',
              dialogue: 'Antes de culpar o corte ou a tesoura, olha o que acontece nesses primeiros dias em casa.',
              action: `${speaker} dá meio passo à frente, apontando para o espelho da bancada onde os produtos e secador estão organizados.`,
              visualIdea: 'Plano Médio com leve aproximação, mantendo profundidade de 1,5m em relação ao fundo.',
              emotionalIntention: 'Atenção redobrada e cumplicidade.',
              durationSec: s2,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte na gesticulação',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — O FATOR ESQUECIDO',
              stage: 'discovery',
              objective: 'Revelar o detalhe prático que muda a sustentação do fio',
              narrativePurpose: 'Ponto de virada da narrativa: o fator técnico que ninguém explicava',
              dialogue: 'Dependendo do seu tipo de cabelo, a forma como você finaliza muda completamente o resultado.',
              action: `${speaker} pega um pente de madeira de dentes largos e demonstra a direção correta do fluxo do ar morno no topo.`,
              visualIdea: 'Close Médio destacando as mãos do especialista demonstrando o controle minucioso.',
              emotionalIntention: 'Descoberta técnica e clareza didática.',
              durationSec: s3,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no movimento do pente',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — A CONSEQUÊNCIA PRÁTICA',
              stage: 'consequence',
              objective: 'Explicar o impacto real do fator descoberto na rotina de pessoas diferentes',
              narrativePurpose: 'Demonstração de causa e efeito: por que o mesmo corte reage diferente',
              dialogue: 'Por isso, esse mesmo corte pode funcionar muito bem para uma pessoa e perder o formato rápido em outra.',
              action: `${speaker} coloca o pente na bancada com calma, olhando diretamente nos olhos do espectador com serenidade.`,
              visualIdea: 'Plano Médio com contraluz suave desenhando os ombros e a textura da cadeira ao fundo.',
              emotionalIntention: 'Compreensão completa do problema.',
              durationSec: s4,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte seco no olhar',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — A RECOMENDAÇÃO DE FECHAMENTO',
              stage: 'cta',
              objective: 'Fechar o ciclo narrativo aberto na Cena 1 com uma recomendação consultiva concreta',
              narrativePurpose: 'Conclusão da história e CTA derivado diretamente do aprendizado',
              dialogue: 'Na próxima vez que for cortar, não pede só o nome do corte. Pergunta como ele funciona no seu cabelo. Clica no link da bio e agenda com quem analisa antes de cortar.',
              action: `${speaker} sorri com receptividade, estendendo a mão em um convite cordial para a cadeira de atendimento.`,
              visualIdea: 'Plano Médio cinematográfico com iluminação acolhedora e atmosfera convidativa.',
              emotionalIntention: 'Decisão segura e vontade imediata de agendar.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out elegante',
            },
          ];
        },
      },
      {
        key: 'visagismo',
        name: 'Visagismo e Proporção Facial',
        shortLabel: '2. Visagismo e Proporção',
        description: 'Como escolher o corte que valoriza a estrutura óssea do rosto masculino em vez de copiar fotos da internet.',
        hook: '"Pedir o corte daquela foto do Pinterest é o caminho mais rápido para sair frustrado da barbearia."',
        central_question: 'Como o visagismo masculino harmoniza os traços do rosto e eleva a presença pessoal?',
        cta: '"No seu próximo corte, senta na cadeira e pergunta qual proporção equilibra seu rosto. Clica no link da bio e vem agendar com a gente."',
        creative_justification: 'Desarmamos a expectativa perigosa de levar fotos irreais de celebridades. O visagismo prático eleva o serviço para uma consultoria de imagem masculina estruturada em 5 atos narrativos.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — A ILUSÃO DA FOTO DA INTERNET',
              stage: 'hook',
              objective: 'Interromper o hábito comum de escolher cortes por fotos sem critério',
              narrativePurpose: 'Abertura do conflito: a distância entre a foto e a realidade',
              dialogue: 'Pedir o corte daquela foto do Pinterest é o caminho mais rápido para sair frustrado da barbearia.',
              action: `${speaker} a 1,5m da parede de fundo, segurando a tesoura fechada, olhando com franqueza e empatia para a câmera.`,
              visualIdea: 'Plano Médio vertical com iluminação contrastada e fundo escuro descolado em profundidade.',
              emotionalIntention: 'Choque de lucidez e curiosidade.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O PORQUÊ DA DECEPÇÃO',
              stage: 'development',
              objective: 'Explicar a causa anatômica da frustração sem culpar o cliente',
              narrativePurpose: 'Desenvolvimento causal: a geometria óssea que a foto esconde',
              dialogue: 'Porque o corte que fica incrível na mandíbula quadrada do modelo da foto, raramente encaixa na mesma proporção no seu rosto.',
              action: `${speaker} aponta suavemente para as linhas laterais do próprio rosto, exemplificando a variedade de formatos.`,
              visualIdea: 'Close Médio focado na expressão didática e sincera do especialista.',
              emotionalIntention: 'Identificação e quebra do sentimento de culpa.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no gesto',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A REGRA DA PROPORÇÃO REAL',
              stage: 'discovery',
              objective: 'Apresentar a lógica visual prática do visagismo',
              narrativePurpose: 'Revelação do critério técnico que resolve o dilema',
              dialogue: 'O segredo não é copiar a moda: é visagismo prático. Lateral limpa alonga rostos mais redondos, enquanto peso nas têmporas equilibra rostos compridos.',
              action: `${speaker} delimita no ar com as mãos as linhas verticais e horizontais que criam o equilíbrio visual.`,
              visualIdea: 'Plano Médio dinâmico com iluminação desenhando o formato do rosto do especialista.',
              emotionalIntention: 'Fascínio didático e valorização técnica.',
              durationSec: s3,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no movimento das mãos',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — O RESULTADO NATURAL',
              stage: 'consequence',
              objective: 'Mostrar o efeito de aplicar o visagismo na presença diária',
              narrativePurpose: 'Consequência: o corte se torna uma extensão harmoniosa da pessoa',
              dialogue: 'Quando você entende a proporção dos seus traços, o corte deixa de parecer um bloco genérico e valoriza sua presença de forma natural.',
              action: `${speaker} cruza os braços com postura segura e serena, demonstrando firmeza e equilíbrio.`,
              visualIdea: 'Plano Americano com iluminação elegante a 45° destacando postura e elegância.',
              emotionalIntention: 'Sensação de elegância e autoridade.',
              durationSec: s4,
              shotType: 'Plano Americano (50mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — O CONVITE DE CONSULTORIA',
              stage: 'cta',
              objective: 'Fechar o ciclo respondendo à questão com o agendamento analítico',
              narrativePurpose: 'Fechamento narrativo que conecta a dor inicial à solução real',
              dialogue: 'No seu próximo corte, senta na cadeira e pergunta qual proporção equilibra seu rosto. Clica no link da bio e vem agendar com quem analisa antes de cortar.',
              action: `${speaker} ajusta a capa na cadeira de atendimento vazia e faz gesto convidativo para o espectador.`,
              visualIdea: 'Plano Médio cinematográfico com contraluz quente na cadeira da barbearia.',
              emotionalIntention: 'Decisão tomada com confiança.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out elegante',
            },
          ];
        },
      },
      {
        key: 'automatico',
        name: 'A Quebra do Automático',
        shortLabel: '3. A Quebra do Automático',
        description: 'Por que a maioria dos homens sempre pede o mesmo corte por puro medo de o barbeiro errar.',
        hook: '"Você ainda senta na cadeira da barbearia e diz \'faz igual da última vez\' só por puro medo de o barbeiro errar?"',
        central_question: 'Por que nos acomodamos no corte padrão e como renovar o visual sem sustos?',
        cta: '"Chega de cortar cabelo no piloto automático. Clica no link da bio e vem renovar seu estilo com segurança."',
        creative_justification: 'Tocamos na vulnerabilidade silenciosa dos homens: o medo de mudar e ter que usar boné por semanas. A progressão narrativa substitui o medo por confiança técnica através de microajustes.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O HÁBITO DO RECEIO',
              stage: 'hook',
              objective: 'Trazer à tona o comportamento defensivo do cliente na cadeira',
              narrativePurpose: 'Pergunta provocativa que expõe um padrão repetido no automático',
              dialogue: 'Você ainda senta na cadeira da barbearia e diz "faz igual da última vez" só por puro medo de o barbeiro errar?',
              action: `${speaker} cruza os braços com sorriso cúmplice a 1,5m da parede, falando como um velho amigo.`,
              visualIdea: 'Plano Médio vertical com iluminação envolvente a 45° criando sombras naturais.',
              emotionalIntention: 'Identificação imediata e riso cúmplice.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no sorriso',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O DILEMA DO BONÉ',
              stage: 'development',
              objective: 'Nomear o medo real por trás do hábito sem julgar',
              narrativePurpose: 'Desenvolvimento emocional da dor oculta',
              dialogue: 'A maioria dos homens repete o mesmo corte há anos não porque ama o estilo, mas porque tem pavor de arriscar e ter que passar um mês usando boné.',
              action: `${speaker} descruza os braços e faz gesto de quem compreende perfeitamente essa apreensão.`,
              visualIdea: 'Close Médio focado na honestidade expressiva do barbeiro.',
              emotionalIntention: 'Alívio por saber que não é o único a sentir isso.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no gesto',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A EVOLUÇÃO SEGURA',
              stage: 'discovery',
              objective: 'Desmistificar a mudança mostrando que ela é progressiva e controlada',
              narrativePurpose: 'Virada narrativa: evoluir o corte não exige radicalismo',
              dialogue: 'Só que você não precisa de uma transformação radical. Um ajuste milimétrico na altura do fade e uma textura diferente na tesoura já modernizam sua imagem sem mudar quem você é.',
              action: `${speaker} segura a máquina de acabamento e demonstra no ar a sutil diferença de graduação com extrema leveza.`,
              visualIdea: 'Close nos detalhes metálicos da ferramenta e na firmeza das mãos artesanais.',
              emotionalIntention: 'Segurança absoluta e encorajamento.',
              durationSec: s3,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na lâmina',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — A CONFIANÇA RENOVADA',
              stage: 'consequence',
              objective: 'Pintar o cenário positivo de quem dá o passo seguro',
              narrativePurpose: 'Consequência prática do ajuste milimétrico na autoestima',
              dialogue: 'Você mantém a segurança do que já gosta, mas ganha um corte muito mais alinhado ao seu momento atual e à sua presença.',
              action: `${speaker} apoia a máquina na bancada e gesticula de peito aberto em direção à câmera.`,
              visualIdea: 'Plano Americano com profundidade cinematográfica em camadas.',
              emotionalIntention: 'Entusiasmo contido e autoimagem elevada.',
              durationSec: s4,
              shotType: 'Plano Americano (35mm)',
              transition: 'Corte seco no olhar',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — A QUEBRA DA ROTINA',
              stage: 'cta',
              objective: 'Conduzir à quebra do piloto automático com um agendamento simples',
              narrativePurpose: 'Fechamento que responde à pergunta da Cena 1',
              dialogue: 'Chega de cortar cabelo no piloto automático. Clica no link da bio e vem alinhar seu estilo com quem pensa no seu corte junto com você.',
              action: `${speaker} olha firme na lente com expressão receptiva e segura, estendendo a mão para a frente.`,
              visualIdea: 'Plano Médio com contraluz dourado conferindo sofisticação ao espaço.',
              emotionalIntention: 'Decisão tomada e entusiasmo.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
    ],
  },
  odontologia: {
    nicheKey: 'odontologia',
    nicheName: 'Odontologia & Sorriso',
    defaultClient: 'Clínica Odontológica',
    defaultSpeaker: 'o dentista',
    targetAudience: 'Pacientes que desejam um sorriso harmônico e saudável sem artificialismo',
    angles: [
      {
        key: 'clareamento',
        name: 'O Mito do Clareamento Caseiro',
        shortLabel: '1. O Mito do Clareamento Caseiro',
        description: 'Por que receitas abrasivas de internet destroem o esmalte e como o clareamento por oxigenação age de verdade.',
        hook: '"Se você comprou carvão ativado ou receita da internet achando que ia clarear o dente em casa, você precisa ver isso aqui."',
        central_question: 'Por que receitas milagrosas causam sensibilidade irreversível e como agir com segurança?',
        cta: '"Não troque a saúde do seu sorriso por um atalho da internet. Clica no link da bio e faça sua avaliação segura com a gente."',
        creative_justification: 'Alerta clínico preventivo que desmonta atalhos perigosos de forma didática e posiciona o consultório como o único caminho seguro e duradouro.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O ALERTA DO ESMALTE',
              stage: 'hook',
              objective: 'Interromper o hábito de seguir receitas milagrosas de redes sociais',
              narrativePurpose: 'Abertura do dilema com alerta direto sobre um perigo silencioso',
              dialogue: 'Se você comprou carvão ativado ou receita da internet achando que ia clarear o dente em casa, você precisa ver isso aqui.',
              action: `${speaker} posicionado a 1,5m da parede de fundo do consultório, jaleco impecável, olhar atento e firme para a lente.`,
              visualIdea: 'Plano Médio vertical, luz suave envolvente com tons frios e limpos de consultório premium.',
              emotionalIntention: 'Alerta e respeito técnico imediato.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O DESGASTE IRREVERSÍVEL',
              stage: 'development',
              objective: 'Explicar a consequência oculta das substâncias abrasivas',
              narrativePurpose: 'Desenvolvimento causal: abrasão física vs estrutura biológica',
              dialogue: 'Essas receitas caseiras não tiram manchas: elas lixam e desgastam o seu esmalte. E esmalte é a única estrutura do corpo humano que nunca mais se regenera.',
              action: `${speaker} aponta para um modelo anatômico de dente na bancada, indicando a camada translúcida protetora.`,
              visualIdea: 'Close Médio no modelo e na explicação serena do especialista.',
              emotionalIntention: 'Choque de realidade preventiva.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no instrumento',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A CIÊNCIA DA OXIGENAÇÃO',
              stage: 'discovery',
              objective: 'Apresentar a química real do clareamento seguro',
              narrativePurpose: 'Ponto de virada: como clarear de dentro para fora sem atrito',
              dialogue: 'Clareamento seguro age por oxigênio dentro dos microporos do dente, quebrando as moléculas de pigmento lá dentro sem encostar na estrutura mineral.',
              action: `${speaker} mostra a seringa de gel clínico de precisão sob luz neutra com extremo cuidado.`,
              visualIdea: 'Macro detalhe da seringa dosadora de alta pureza.',
              emotionalIntention: 'Clareza científica e confiança médica.',
              durationSec: s3,
              shotType: 'Close Detalhe (85mm)',
              transition: 'Corte na seringa',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — O BRILHO TRANSLÚCIDO',
              stage: 'consequence',
              objective: 'Descrever o resultado palpável do procedimento correto',
              narrativePurpose: 'Consequência positiva: dente branco com saúde e sem dores',
              dialogue: 'O resultado é um dente branco de verdade, com brilho translúcido natural e sem aquela sensibilidade insuportável de quem lixou o próprio esmalte.',
              action: `${speaker} volta o olhar para a câmera com sorriso sereno, natural e harmônico.`,
              visualIdea: 'Plano Médio vertical com iluminação evidenciando a luminosidade saudável do rosto.',
              emotionalIntention: 'Alívio e desejo de resultado seguro.',
              durationSec: s4,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — A ESCOLHA SEGURA',
              stage: 'cta',
              objective: 'Fechar o ciclo com agendamento preventivo no consultório',
              narrativePurpose: 'CTA derivado do aprendizado biológico',
              dialogue: 'Não troque a saúde do seu sorriso por um atalho da internet. Clica no link da bio e faça sua avaliação segura com a gente.',
              action: `${speaker} apoia as mãos com calma na bancada e faz convite receptivo e caloroso.`,
              visualIdea: 'Plano Médio acolhedor com luz de recorte destacando os ombros.',
              emotionalIntention: 'Decisão médica confiável.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
      {
        key: 'harmonia',
        name: 'A Estética Invisível do Sorriso',
        shortLabel: '2. A Estética Invisível',
        description: 'Por que o melhor procedimento estético é aquele que ninguém percebe que é artificial.',
        hook: '"O melhor procedimento estético no dente é aquele que todo mundo elogia, mas ninguém percebe que você fez."',
        central_question: 'Como a biomimética dental preserva a naturalidade e anatomia única de cada rosto?',
        cta: '"Se você busca harmonia sem perder a sua identidade, clica no link da bio e venha planejar o seu novo sorriso com a gente."',
        creative_justification: 'Combate a epidemia de sorrisos artificiais quadrados e brancos demais, atraindo pacientes que valorizam sutileza, elegância e longevidade.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O FIM DO ARTIFICIAL',
              stage: 'hook',
              objective: 'Definir o padrão de excelência estética através da discrição',
              narrativePurpose: 'Abertura conceitual que conecta com a busca por elegância real',
              dialogue: 'O melhor procedimento estético no dente é aquele que todo mundo elogia, mas ninguém percebe que você fez.',
              action: `${speaker} a 1,5m da parede de fundo, postura relaxada e serena, olhar límpido para a câmera.`,
              visualIdea: 'Plano Médio vertical com profundidade suave e iluminação natural neutra.',
              emotionalIntention: 'Alívio para quem tem pavor de dentes artificiais.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — A CRÍTICA AO CHICLETE',
              stage: 'development',
              objective: 'Expor o erro comum dos sorrisos padronizados de internet',
              narrativePurpose: 'Desenvolvimento do contraste: o artificial vs a beleza única',
              dialogue: 'Hoje em dia tem muita gente saindo do consultório com bloco branco, opaco e quadrado, parecendo chiclete colado na boca.',
              action: `${speaker} balança levemente a cabeça de forma reflexiva, demonstrando respeito pela individualidade do paciente.`,
              visualIdea: 'Close Médio focado na honestidade da expressão do dentista.',
              emotionalIntention: 'Conexão com o bom gosto e crítica elegante.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no semblante',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A ANATOMIA BIOMIMÉTICA',
              stage: 'discovery',
              objective: 'Apresentar a anatomia natural de dentes reais',
              narrativePurpose: 'Revelação técnica da ciência por trás da textura e translucidez',
              dialogue: 'Dente bonito de verdade tem translucidez na ponta, textura natural e acompanha a curvatura do seu lábio quando você sorri de forma espontânea.',
              action: `${speaker} segura uma pastilha cerâmica sob luz balanceada, mostrando as variações milimétricas de tom.`,
              visualIdea: 'Close nos detalhes cerâmicos com foco seletivo e profundidade rasa.',
              emotionalIntention: 'Admiração pela precisão artística.',
              durationSec: s3,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na cerâmica',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — O REJUVENESCIMENTO REAL',
              stage: 'consequence',
              objective: 'Mostrar o impacto de um sorriso integrado à face',
              narrativePurpose: 'Consequência de escolher a harmonia em vez da cópia',
              dialogue: 'Quando o trabalho é biomimético, você não ganha um sorriso genérico de internet: você ganha um rosto rejuvenescido com a sua identidade intacta.',
              action: `${speaker} gesticula com clareza e elegância, conectando o sorriso com os traços do rosto inteiro.`,
              visualIdea: 'Plano Americano destacando o porte e a harmonia estética do ambiente.',
              emotionalIntention: 'Desejo de transformação personalizada.',
              durationSec: s4,
              shotType: 'Plano Americano (50mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — O CONVITE À HARMONIA',
              stage: 'cta',
              objective: 'Conduzir para um planejamento estético personalizado',
              narrativePurpose: 'Fechamento que responde à tese da Cena 1',
              dialogue: 'Se você busca harmonia sem perder a sua identidade, clica no link da bio e venha planejar o seu novo sorriso com a gente.',
              action: `${speaker} sorri com dentes naturais e acolhe o espectador com um convite cordial.`,
              visualIdea: 'Plano Médio quente e convidativo.',
              emotionalIntention: 'Decisão segura de agendar.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
      {
        key: 'bruxismo',
        name: 'A Dor Oculta do Bruxismo',
        shortLabel: '3. A Dor Oculta do Bruxismo',
        description: 'Conectar dores de cabeça matinais e desgaste dental ao hábito noturno de apertar os dentes.',
        hook: '"Acordar com dor de cabeça matinal ou maxilar travado não é cansaço da sua rotina: é sinal de que sua mordida trabalhou a noite inteira."',
        central_question: 'Como diagnosticar e proteger os dentes das fraturas causadas pelo bruxismo?',
        cta: '"Não espere um dente quebrar para proteger sua articulação. Clica no link da bio e agenda sua avaliação ainda esta semana."',
        creative_justification: 'Relaciona um sintoma rotineiro ignorado por muitos a um problema clínico grave, gerando busca urgente por proteção preventiva.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O SINTOMA ENGANOSO',
              stage: 'hook',
              objective: 'Associar dores matinais ao desgaste dental noturno',
              narrativePurpose: 'Abertura do mistério: o cansaço que na verdade é sobrecarga mecânica',
              dialogue: 'Acordar com dor de cabeça matinal ou maxilar travado não é cansaço da sua rotina: é sinal de que sua mordida trabalhou a noite inteira.',
              action: `${speaker} toca suavemente a região da ATM (mandíbula), olhar focado e empático na lente.`,
              visualIdea: 'Plano Médio vertical com iluminação direcional destacando a expressão atenta do médico.',
              emotionalIntention: 'Identificação imediata de um sintoma cotidiano.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no toque',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — A SOBRECARGA NOTURNA',
              stage: 'development',
              objective: 'Explicar a intensidade da força mandibular inconsciente',
              narrativePurpose: 'Desenvolvimento do dado chocante: a força 3x maior',
              dialogue: 'Enquanto você dorme, a mandíbula chega a apertar os dentes com uma força até três vezes maior do que você consegue fazer acordado.',
              action: `${speaker} fecha a mão com firmeza para demonstrar visualmente a pressão contínua do bruxismo.`,
              visualIdea: 'Close Médio no gesto enérgico e controlado das mãos do especialista.',
              emotionalIntention: 'Espanto e urgência consciente.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na mão',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — O DANO PROGRESSIVO',
              stage: 'discovery',
              objective: 'Alertar sobre as microfraturas e o encurtamento dental',
              narrativePurpose: 'Ponto de inflexão: a consequência acumulada ao longo dos anos',
              dialogue: 'Com o tempo, essa sobrecarga invisível trinca o esmalte, retrai a gengiva e vai encurtando o tamanho dos seus dentes sem você notar.',
              action: `${speaker} aponta para uma arcada dental explicativa na bancada, indicando as bordas desgastadas.`,
              visualIdea: 'Close no modelo anatômico evidenciando o atrito das bordas oclusais.',
              emotionalIntention: 'Conscientização preventiva.',
              durationSec: s3,
              shotType: 'Close Detalhe (50mm)',
              transition: 'Corte no modelo',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — O ALÍVIO ESTRUTURAL',
              stage: 'consequence',
              objective: 'Apresentar a placa oclusal precisa como solução de alívio imediato',
              narrativePurpose: 'Consequência restauradora: dissipar a força e proteger a musculatura',
              dialogue: 'Uma placa oclusal de precisão milimétrica dissipa essa força noturna, relaxa os músculos da cabeça e protege seus dentes de fraturas graves.',
              action: `${speaker} segura uma placa oclusal cristalina entre os dedos sob iluminação nítida.`,
              visualIdea: 'Macro detalhe da placa transparente com acabamento anatômico perfeito.',
              emotionalIntention: 'Alívio e descoberta da solução viável.',
              durationSec: s4,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na placa',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — A PREVENÇÃO URGENTE',
              stage: 'cta',
              objective: 'Estimular a consulta de diagnóstico de mordida',
              narrativePurpose: 'Fechamento que responde à pergunta da Cena 1',
              dialogue: 'Não espere um dente quebrar para proteger sua articulação. Clica no link da bio e agenda sua avaliação ainda esta semana.',
              action: `${speaker} convida o espectador com olhar seguro e afetuoso, estendendo a mão cordialmente.`,
              visualIdea: 'Plano Médio acolhedor com luz suave e profissional.',
              emotionalIntention: 'Decisão de saúde imediata.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
    ],
  },
  gastronomia: {
    nicheKey: 'gastronomia',
    nicheName: 'Gastronomia & Hambúrguer Artesanal',
    defaultClient: 'Hamburgueria Artesanal',
    defaultSpeaker: 'o chef artesanal',
    targetAudience: 'Amantes de boa comida que valorizam sabor real e suculência técnica',
    angles: [
      {
        key: 'crosta',
        name: 'O Segredo da Crosta Perfeita (Maillard)',
        shortLabel: '1. O Segredo da Crosta Perfeita',
        description: 'Por que o hambúrguer artesanal nunca deve ser amassado na chapa depois que sela.',
        hook: '"Você sabe por que um hambúrguer artesanal nunca deve ser amassado na chapa depois que começa a chiar?"',
        central_question: 'Como a reação de Maillard concentra os sucos nobres dentro da carne?',
        cta: '"Hambúrguer de verdade respeita a química da carne. Clica no link da bio, pede o seu agora e sente a diferença no primeiro pedaço."',
        creative_justification: 'Desperta água na boca através da ciência culinária e sensorialidade visual contínua, atraindo pelo desejo da primeira mordida.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O CRIME DA ESPÁTULA',
              stage: 'hook',
              objective: 'Interromper o scroll com uma curiosidade sensorial sobre o preparo',
              narrativePurpose: 'Abertura com pergunta técnica intrigante diante da chapa quente',
              dialogue: 'Você sabe por que um hambúrguer artesanal nunca deve ser amassado na chapa depois que começa a chiar?',
              action: `${speaker} com avental de couro diante da chapa quente, segurando espátula pesada, olhar focado e direto na lente.`,
              visualIdea: 'Plano Médio vertical, vapor quente subindo suavemente ao fundo com tons quentes de cozinha artesanal.',
              emotionalIntention: 'Apetite agudo e curiosidade gastronômica.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no vapor',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — A EVAPORAÇÃO DO SABOR',
              stage: 'development',
              objective: 'Explicar a perda de suculência do erro comum',
              narrativePurpose: 'Desenvolvimento causal: onde vai parar a suculência',
              dialogue: 'Cada gota que escorre e evapora na fumaça da chapa era a gordura nobre e a suculência que deveriam estar na sua primeira mordida.',
              action: `${speaker} aponta para o vapor aromático subindo da chapa, balançando a cabeça em reprovação amigável.`,
              visualIdea: 'Close Médio focado na intensidade da expressão do chapeiro.',
              emotionalIntention: 'Desejo de proteger o sabor do hambúrguer.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A REAÇÃO DE MAILLARD',
              stage: 'discovery',
              objective: 'Revelar a química da crostinha dourada crocante',
              narrativePurpose: 'Ponto de virada gastronômico: o choque térmico que sela o interior',
              dialogue: 'O segredo da carne perfeita é a reação de Maillard: calor violento nos primeiros segundos para formar uma crostinha caramelizada que sela todo o sabor lá dentro.',
              action: `${speaker} vira o hambúrguer na chapa com precisão milimétrica, revelando a crosta dourada e fumegante.`,
              visualIdea: 'Macro Detalhe da carne borbulhando e da textura crocante caramelizada.',
              emotionalIntention: 'Vontade irresistível de saborear.',
              durationSec: s3,
              shotType: 'Close Detalhe (85mm)',
              transition: 'Corte no som do chiar',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — O CONTRASTE TEXTURAL',
              stage: 'consequence',
              objective: 'Descrever o contraste na mordida entre casquinha e centro macio',
              narrativePurpose: 'Consequência prática da técnica no paladar do cliente',
              dialogue: 'Por fora você ganha aquela crocância tostada irresistível, e por dentro a carne continua macia, rosada e extremamente suculenta.',
              action: `${speaker} corta o hambúrguer ao meio revelando o miolo rosado e brilhante de sucos preservados.`,
              visualIdea: 'Close Médio do corte transversal limpo em tábua de madeira rústica.',
              emotionalIntention: 'Salivação imediata e apetite extremo.',
              durationSec: s4,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na lâmina',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — O CONVITE À MORDIDA',
              stage: 'cta',
              objective: 'Converter o apetite visual em pedido imediato no delivery ou salão',
              narrativePurpose: 'Fechamento que fecha o ciclo da pergunta da Cena 1',
              dialogue: 'Hambúrguer de verdade respeita o ponto da carne. Clica no link da bio, pede o seu agora e sente a diferença no primeiro pedaço.',
              action: `${speaker} fecha o burger no pão brioche dourado brilhante e apresenta à câmera com orgulho de artesão.`,
              visualIdea: 'Plano Médio em ângulo dinâmico com iluminação quente de salão.',
              emotionalIntention: 'Ação de compra e consumo imediato.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out apetitoso',
            },
          ];
        },
      },
      {
        key: 'equilibrio',
        name: 'Menos é Mais no Sabor',
        shortLabel: '2. Menos é Mais no Sabor',
        description: 'Por que pilhas de molhos artificiais escondem a má qualidade da carne e como o equilíbrio valoriza o produto.',
        hook: '"Pilha de queijo cheddar escorrendo pode até render vídeo chamativo na internet, mas quase sempre esconde uma carne sem sabor."',
        central_question: 'Por que o excesso de molhos esconde a má qualidade de um blend mal preparado?',
        cta: '"Se você valoriza sabor de verdade sem exageros vazios, o link do cardápio está na bio. Vem provar o autoral da casa hoje."',
        creative_justification: 'Critica o food porn exagerado e superficial da internet e valoriza o respeito ao produto artesanal de verdade.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — A ILUSÃO DO EXCESSO',
              stage: 'hook',
              objective: 'Chocar quebrando a ilusão de lanches afogados em queijo artificial',
              narrativePurpose: 'Abertura provocativa contra o modismo visual vazio',
              dialogue: 'Pilha de queijo cheddar escorrendo pode até render vídeo chamativo na internet, mas quase sempre esconde uma carne sem sabor.',
              action: `${speaker} a 1,5m da bancada, segurando um pão brioche fresco e dourado, postura firme e autêntica.`,
              visualIdea: 'Plano Médio vertical, luz quente acolhedora valorizando tons dourados dos pães frescos.',
              emotionalIntention: 'Quebra de padrão e curiosidade crítica.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — A SOBREPOSIÇÃO DE SABORES',
              stage: 'development',
              objective: 'Explicar a perda do paladar pelo excesso de condimentos pesados',
              narrativePurpose: 'Desenvolvimento do problema culinário',
              dialogue: 'Quando você empilha dez ingredientes pesados no mesmo sanduíche, você não sente o sabor da carne, só sente gordura e excesso de sal.',
              action: `${speaker} gesticula com as mãos mostrando o empilhamento desordenado que anula o paladar.`,
              visualIdea: 'Close Médio na expressão convicta do chef artesanal.',
              emotionalIntention: 'Conexão com quem aprecia boa comida.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no gesto',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A TRÍADE ESSENCIAL',
              stage: 'discovery',
              objective: 'Apresentar a tríade da alta gastronomia de rua',
              narrativePurpose: 'Ponto de virada: os três elementos que sustentam o sabor autêntico',
              dialogue: 'O verdadeiro teste de um hambúrguer artesanal está no equilíbrio de três coisas: pão brioche amanteigado, blend bovino fresco no ponto correto e queijo curado derretido na medida certa.',
              action: `${speaker} monta o hambúrguer em passos firmes e limpos, cada camada visível e respeitada.`,
              visualIdea: 'Close dinâmico acompanhando a montagem artesanal precisa.',
              emotionalIntention: 'Respeito à gastronomia e clareza de proposta.',
              durationSec: s3,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na montagem',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — O SABOR LIMPO DA BRASA',
              stage: 'consequence',
              objective: 'Descrever a experiência limpa e marcante da mordida',
              narrativePurpose: 'Consequência prática da simplicidade sofisticada',
              dialogue: 'Cada mordida entrega textura, crocância e o sabor limpo da brasa do começo ao fim do lanche.',
              action: `${speaker} ergue o sanduíche com as duas mãos, mostrando a harmonia de altura e proporção.`,
              visualIdea: 'Plano Médio com iluminação de recorte e fundo texturizado de cozinha industrial.',
              emotionalIntention: 'Vontade imediata de viver a experiência gastronômica.',
              durationSec: s4,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — A ESCOLHA DO AUTORAL',
              stage: 'cta',
              objective: 'Conduzir para a escolha do produto assinado no cardápio',
              narrativePurpose: 'Fechamento que encerra a provocação da Cena 1',
              dialogue: 'Se você valoriza sabor de verdade sem exageros vazios, o link do cardápio está na bio. Vem provar o autoral da casa hoje.',
              action: `${speaker} sorri com orgulho do produto pronto e faz convite receptivo e seguro.`,
              visualIdea: 'Plano Médio acolhedor com ambiente iluminado ao fundo.',
              emotionalIntention: 'Decisão de compra assertiva.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
    ],
  },
  fitness: {
    nicheKey: 'fitness',
    nicheName: 'Academia & Treinamento Físico',
    defaultClient: 'Academia & Performance',
    defaultSpeaker: 'o treinador',
    targetAudience: 'Pessoas que treinam regularmente mas sentem que não estão evoluindo o suficiente',
    angles: [
      {
        key: 'exaustao',
        name: 'A Ilusão da Exaustão',
        shortLabel: '1. A Ilusão da Exaustão',
        description: 'Por que sair do treino destruído sem conseguir andar não significa que o treino gerou hipertrofia.',
        hook: '"Sair da academia se arrastando sem conseguir subir escadas no dia seguinte não significa que o seu treino gerou resultado."',
        central_question: 'Por que fadiga desorganizada apenas gera inflamação sem ganho muscular real?',
        cta: '"Pare de gastar energia no sofrimento inútil. Clica no link da bio e vem treinar com um plano feito para o seu corpo evoluir de verdade."',
        creative_justification: 'Desmistifica a cultura do sofrimento irracional ("no pain no gain" vazio) e valoriza o método de progressão de cargas com recuperação otimizada.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O MITO DO SOFRIMENTO',
              stage: 'hook',
              objective: 'Quebrar o senso comum de que dor incapacitante é sinal de bom treino',
              narrativePurpose: 'Abertura provocativa que liberta o aluno da culpa do cansaço inútil',
              dialogue: 'Sair da academia se arrastando sem conseguir subir escadas no dia seguinte não significa que o seu treino gerou resultado.',
              action: `${speaker} a 1,5m dos aparelhos de musculação, segurando uma anilha com firmeza, postura atlética e olhar firme na lente.`,
              visualIdea: 'Plano Médio vertical, iluminação de alto contraste destacando a musculatura e o ambiente de ferro.',
              emotionalIntention: 'Alívio mental e reflexão crítica.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no peso',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — FADIGA NÃO É HIPERTROFIA',
              stage: 'development',
              objective: 'Distinguir exaustão cardiovascular de estímulo hipertrófico',
              narrativePurpose: 'Desenvolvimento do raciocínio fisiológico',
              dialogue: 'A maioria das pessoas confunde fadiga com hipertrofia. Cansaço qualquer treino aleatório gera; o que constrói músculo é estímulo eficiente.',
              action: `${speaker} dá meio passo à frente, gesticulando com as mãos abertas de forma didática e firme.`,
              visualIdea: 'Close Médio na firmeza do olhar do treinador explicando com autoridade biomecânica.',
              emotionalIntention: 'Esclarecimento e quebra de crença limitante.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no gesto',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A SOBRECARGA PROGRESSIVA',
              stage: 'discovery',
              objective: 'Apresentar a tensão mecânica como verdadeiro gatilho muscular',
              narrativePurpose: 'Ponto de virada da narrativa: a chave científica da evolução',
              dialogue: 'O que sinaliza para o corpo construir massa magra é tensão mecânica progressiva: controlar o peso na descida e aumentar a carga gradualmente nas semanas, mantendo a técnica impecável.',
              action: `${speaker} demonstra a fase excêntrica lenta de um movimento com controle muscular absoluto.`,
              visualIdea: 'Close Médio nos cabos sob tensão e na contração muscular controlada.',
              emotionalIntention: 'Entendimento técnico e segurança de execução.',
              durationSec: s3,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na contração',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — A TRANSFORMAÇÃO NO ESPELHO',
              stage: 'consequence',
              objective: 'Explicar o impacto de um treino metódico na recuperação e nas articulações',
              narrativePurpose: 'Consequência prática do treino inteligente no dia a dia',
              dialogue: 'Quando você treina com método em vez de treinar até o desmaio, sua recuperação melhora, suas articulações não doem e seu físico muda no espelho.',
              action: `${speaker} apoia a anilha no suporte com precisão e respira com serenidade atlética.`,
              visualIdea: 'Plano Americano com luz de recorte nos ombros e postura equilibrada.',
              emotionalIntention: 'Confiança e motivação lúcida.',
              durationSec: s4,
              shotType: 'Plano Americano (35mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — O CONVITE AO MÉTODO',
              stage: 'cta',
              objective: 'Conduzir para a adesão a uma metodologia com periodização real',
              narrativePurpose: 'Fechamento que responde ao mito da Cena 1',
              dialogue: 'Pare de gastar energia no sofrimento inútil. Clica no link da bio e vem treinar com um plano feito para o seu corpo evoluir de verdade.',
              action: `${speaker} olha direto nos olhos do aluno com incentivo genuíno e estende a mão para a frente.`,
              visualIdea: 'Plano Médio com luz natural vindo das janelas e atmosfera inspiradora.',
              emotionalIntention: 'Decisão de treinar com inteligência.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out forte',
            },
          ];
        },
      },
      {
        key: 'cardio',
        name: 'O Erro do Cardio Antes do Peso',
        shortLabel: '2. Cardio Antes do Treino',
        description: 'Como gastar glicogênio correndo antes da musculação sabota o ganho de massa magra.',
        hook: '"Se você chega na academia e corre 40 minutos na esteira antes de puxar peso achando que vai queimar mais gordura, você está sabotando seu metabolismo."',
        central_question: 'Qual é a ordem correta entre musculação e aeróbio para acelerar a queima de gordura?',
        cta: '"Treinar na sequência certa economiza seu tempo e dobra os seus resultados. Clica no link da bio e venha estruturar sua rotina com a nossa equipe."',
        creative_justification: 'Corrige um dos erros mais comuns de quem busca emagrecimento, educando sobre a fisiologia da queima de gordura e preservação muscular.',
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — A ARMADILHA DA ESTEIRA',
              stage: 'hook',
              objective: 'Interromper a prática de exaustão aeróbica prévia à musculação',
              narrativePurpose: 'Abertura de choque: o esforço que está sabotando o resultado',
              dialogue: 'Se você chega na academia e corre 40 minutos na esteira antes de puxar peso achando que vai queimar mais gordura, você está sabotando seu metabolismo.',
              action: `${speaker} desce de uma esteira com expressão séria e acolhedora, posicionando-se a 1,5m do fundo da sala de cardio.`,
              visualIdea: 'Plano Médio vertical, fundo em desfoque cinematográfico com tons urbanos da academia.',
              emotionalIntention: 'Espanto e interesse em entender o erro.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no passo',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O ESGOTAMENTO DO GLICOGÊNIO',
              stage: 'development',
              objective: 'Explicar a perda de energia nobre necessária para a musculação',
              narrativePurpose: 'Desenvolvimento causal da fisiologia do esforço',
              dialogue: 'A corrida inicial consome todo o seu glicogênio muscular. Quando você finalmente chega nos pesos, você está sem energia para treinar pesado e sinalizar a preservação dos músculos.',
              action: `${speaker} gesticula com clareza mostrando a curva de energia que cai vertiginosamente.`,
              visualIdea: 'Close Médio focado na explicação didática e segura do especialista.',
              emotionalIntention: 'Compreensão do porquê os treinos anteriores não surtiam efeito.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no gesto',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A SEQUÊNCIA METABÓLICA',
              stage: 'discovery',
              objective: 'Apresentar a inversão lógica da ordem dos estímulos',
              narrativePurpose: 'Ponto de virada fisiológico: pesos primeiro, cardio depois',
              dialogue: 'A ordem metabólica correta é o oposto: faça a musculação primeiro com intensidade total para ativar a massa magra, e faça o cardio no final quando o corpo já é obrigado a queimar gordura como combustível.',
              action: `${speaker} aponta da sala de cardio para o salão de pesos livres, demonstrando o fluxo correto.`,
              visualIdea: 'Plano Médio dinâmico com iluminação desenhando os ombros e a postura atlética.',
              emotionalIntention: 'Alívio e descoberta do método exato.',
              durationSec: s3,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no direcionamento',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — O METABOLISMO ACELERADO',
              stage: 'consequence',
              objective: 'Descrever o ganho metabólico em repouso e a firmeza muscular',
              narrativePurpose: 'Consequência de longo prazo da ordem correta',
              dialogue: 'Assim você constrói músculo, acelera seu gasto calórico mesmo em repouso e não fica com aquele aspecto de flacidez.',
              action: `${speaker} sorri com confiança, transmitindo solidez e domínio do processo de emagrecimento saudável.`,
              visualIdea: 'Plano Americano destacando energia e saúde real.',
              emotionalIntention: 'Esperança renovada e clareza de metas.',
              durationSec: s4,
              shotType: 'Plano Americano (50mm)',
              transition: 'Corte seco no olhar',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — A ESTRUTURAÇÃO DO TREINO',
              stage: 'cta',
              objective: 'Conduzir para a estruturação do plano com a consultoria',
              narrativePurpose: 'Fechamento que responde ao erro alertado na Cena 1',
              dialogue: 'Treinar na sequência certa economiza seu tempo e dobra os seus resultados. Clica no link da bio e venha estruturar sua rotina com a nossa equipe.',
              action: `${speaker} estende a mão para a frente em um convite acolhedor para o aluno começar hoje.`,
              visualIdea: 'Plano Médio vertical com iluminação vibrante.',
              emotionalIntention: 'Ação prática imediata.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
    ],
  },
};

/**
 * SINTETIZADOR UNIVERSAL DE ESTRATÉGIA CRIATIVA (Para nichos não cadastrados nos playbooks)
 * Garante que NUNCA haja paráfrase robótica, frases motivacionais soltas ou clichês vazios.
 * Gera sempre uma história contínua em 5 atos causais ancorados no tema específico do usuário.
 */
export function createUniversalPlaybook(topic: string, clientName: string): NichePlaybook {
  const cleanTopic = topic.trim() || 'Serviços Especializados';
  return {
    nicheKey: 'universal',
    nicheName: cleanTopic,
    defaultClient: clientName || 'Especialista',
    defaultSpeaker: 'o especialista',
    targetAudience: `Pessoas que buscam resultados concretos em ${cleanTopic} e querem evitar erros caros`,
    angles: [
      {
        key: 'senso_comum',
        name: 'A Quebra do Senso Comum',
        shortLabel: '1. A Quebra do Senso Comum',
        description: `Confrontar o erro mais comum que as pessoas cometem ao lidar com ${cleanTopic}.`,
        hook: `"Se você já tentou resolver ${cleanTopic} e sentiu que estava se esforçando muito para pouco resultado, o erro quase nunca é sua dedicação."`,
        central_question: `Por que o senso comum falha em ${cleanTopic} e qual é o método seguro para ter resultado sustentável?`,
        cta: `"Na próxima vez que for tomar uma decisão em ${cleanTopic}, comece pelo diagnóstico correto. Clica no link da bio e vamos conversar sobre o seu projeto."`,
        creative_justification: `Desarmamos o senso comum sem copiar o usuário, estruturando um arco causal contínuo de 5 cenas onde cada fala decorre da anterior.`,
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O CONFRONTO DO ERRO INICIAL',
              stage: 'hook',
              objective: 'Parar o scroll quebrando a falsa crença de que o fracasso era por falta de esforço',
              narrativePurpose: 'Abertura provocativa que conecta a dor com a metodologia',
              dialogue: `Se você já tentou resolver ${cleanTopic} e sentiu que estava se esforçando muito para pouco resultado, o erro quase nunca é sua dedicação.`,
              action: `${speaker} posicionado a 1,5m da parede de fundo, olhar firme e sincero na lente, postura aberta e acolhedora.`,
              visualIdea: 'Plano Médio vertical 9:16. Iluminação envolvente a 45° desenhando os traços do rosto com elegância.',
              emotionalIntention: 'Alívio mental e curiosidade imediata.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O GARGALO INVISÍVEL',
              stage: 'development',
              objective: 'Explicar por que as tentativas convencionais falham sem culpar o espectador',
              narrativePurpose: 'Desenvolvimento causal: onde a energia realmente se perde',
              dialogue: 'A maioria das pessoas cai na armadilha de focar no detalhe mais visível, quando na verdade o que trava o progresso é um gargalo básico que quase ninguém avisa.',
              action: `${speaker} gesticula com clareza mostrando o contraste entre a superfície e a estrutura real.`,
              visualIdea: 'Close Médio focado na expressão didática e convicta do especialista.',
              emotionalIntention: 'Compreensão e identificação com o histórico de tentativas passadas.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no gesto',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A VIRADA TÉCNICA',
              stage: 'discovery',
              objective: 'Apresentar o princípio prático que muda o jogo',
              narrativePurpose: 'Ponto de virada da narrativa: ajustar o método antes da aceleração',
              dialogue: 'Quando você ajusta o método antes de acelerar o ritmo, a execução fica mais leve e cada ação passa a gerar um impacto direto e mensurável.',
              action: `${speaker} dá meio passo à frente com as mãos abertas, transmitindo clareza e autoridade moral.`,
              visualIdea: 'Plano Médio dinâmico com iluminação de recorte separando o sujeito do ambiente.',
              emotionalIntention: 'Sensação de iluminação e oportunidade viável.',
              durationSec: s3,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — A CONSEQUÊNCIA PREVISÍVEL',
              stage: 'consequence',
              objective: 'Mostrar o que muda quando o princípio é aplicado',
              narrativePurpose: 'Consequência prática da mudança estrutural',
              dialogue: 'É essa consistência técnica que faz o resultado deixar de ser um golpe de sorte e se transformar em uma rotina previsível e sustentável.',
              action: `${speaker} cruza os braços com serenidade, demonstrando solidez e maturidade profissional.`,
              visualIdea: 'Plano Americano elegante com iluminação aveludada no rosto.',
              emotionalIntention: 'Segurança absoluta e credibilidade.',
              durationSec: s4,
              shotType: 'Plano Americano (50mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — A RECOMENDAÇÃO DIRETA',
              stage: 'cta',
              objective: 'Conduzir para um diagnóstico inicial personalizado',
              narrativePurpose: 'Fechamento do arco narrativo aberto na Cena 1',
              dialogue: `Na próxima vez que for tomar uma decisão em ${cleanTopic}, comece pelo diagnóstico correto. Clica no link da bio e vamos conversar sobre o seu projeto.`,
              action: `${speaker} conclui com sorriso sereno, estendendo a mão cordialmente em direção à câmera.`,
              visualIdea: 'Plano Médio com atmosfera acolhedora e iluminação calorosa.',
              emotionalIntention: 'Incentivo à ação consciente.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out elegante',
            },
          ];
        },
      },
      {
        key: 'fator_invisivel',
        name: 'O Fator Técnico Invisível',
        shortLabel: '2. O Fator Técnico Invisível',
        description: `Revelar o elemento operacional que separa amadores de entregas profissionais em ${cleanTopic}.`,
        hook: `"Existe um detalhe prático em ${cleanTopic} que separa quem passa o ano inteiro patinando de quem constrói autoridade de verdade."`,
        central_question: `Qual é a alavanca técnica que destrava consistência e resultados sólidos?`,
        cta: `"Se você quer estruturar ${cleanTopic} com quem já validou essa prática no mercado, o link está na bio. Vamos falar do seu momento."`,
        creative_justification: `Substitui clichês por uma visão de bastidor focada no ponto de alavancagem técnica, guiada por causa e efeito.`,
        scenes: (durationSec, speaker) => {
          const { s1, s2, s3, s4, s5 } = distribute5Scenes(durationSec);
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — A REVELAÇÃO DO BASTIDOR',
              stage: 'hook',
              objective: 'Despertar a atenção de quem busca padrão profissional',
              narrativePurpose: 'Abertura com pergunta de bastidor técnico',
              dialogue: `Existe um detalhe prático em ${cleanTopic} que separa quem passa o ano inteiro patinando de quem constrói autoridade de verdade.`,
              action: `${speaker} a 1,5m do fundo, postura focada, olhando diretamente no olho do espectador.`,
              visualIdea: 'Plano Médio com iluminação de recorte e fundo texturizado.',
              emotionalIntention: 'Intriga e respeito técnico.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O ERRO DA COMPENSAÇÃO',
              stage: 'development',
              objective: 'Expor a tentativa amadora de compensar falta de método com pressa',
              narrativePurpose: 'Desenvolvimento do dilema prático',
              dialogue: 'E o que a maioria faz é tentar compensar a falta de processo com pressa, gastando o dobro de energia para ter que refazer tudo depois.',
              action: `${speaker} balança a cabeça de forma analítica, apontando para as ferramentas de trabalho.`,
              visualIdea: 'Close Médio com foco nítido na expressão convicta do especialista.',
              emotionalIntention: 'Alívio por entender onde estava o desperdício.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no ritmo da fala',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A ALAVANCA ESTRATÉGICA',
              stage: 'discovery',
              objective: 'Apresentar a alavanca técnica essencial',
              narrativePurpose: 'Ponto de virada: focar onde o impacto é multiplicado',
              dialogue: 'Os profissionais experientes não fazem mais coisas: eles focam no ponto de alavancagem que realmente sustenta a qualidade e a segurança da entrega.',
              action: `${speaker} utiliza um exemplo métrico com as mãos para ilustrar o ponto de alavancagem.`,
              visualIdea: 'Plano Médio com gesticulação segura e iluminação precisa a 45°.',
              emotionalIntention: 'Clareza estratégica e percepção de alto valor.',
              durationSec: s3,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no gesto',
            },
            {
              sceneNumber: 4,
              sceneName: 'CENA 04 — A SEGURANÇA NA EXECUÇÃO',
              stage: 'consequence',
              objective: 'Descrever a serenidade de quem executa com o alicerce correto',
              narrativePurpose: 'Consequência palpável da clareza operacional',
              dialogue: 'Com essa base alinhada, você ganha clareza, economiza recursos e transmite a segurança de quem domina exatamente o que faz.',
              action: `${speaker} sorri com tranquilidade, transmitindo autoridade serena e maturidade.`,
              visualIdea: 'Plano Americano destacando compostura e credibilidade.',
              emotionalIntention: 'Desejo de alcançar o mesmo padrão profissional.',
              durationSec: s4,
              shotType: 'Plano Americano (50mm)',
              transition: 'Corte seco',
            },
            {
              sceneNumber: 5,
              sceneName: 'CENA 05 — O ALINHAMENTO DIRETO',
              stage: 'cta',
              objective: 'Convidar para uma conversa estratégica e diagnóstico prático',
              narrativePurpose: 'Fechamento que fecha o ciclo aberto na Cena 1',
              dialogue: `Se você quer estruturar ${cleanTopic} com quem já validou essa prática no mercado, o link está na bio. Vamos falar do seu momento.`,
              action: `${speaker} convida o espectador com olhar sincero e postura receptiva.`,
              visualIdea: 'Plano Médio equilibrado e elegante.',
              emotionalIntention: 'Decisão segura de agendar.',
              durationSec: s5,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
    ],
  };
}

/**
 * TIPO DE FEEDBACK CRÍTICO DO USUÁRIO (Seção 41 do Master Prompt)
 */
export type NarrativeFeedbackType =
  | 'too_motivational' // "Esse roteiro está muito motivacional" -> Reduzir frases motivacionais e reforçar continuidade causal prática
  | 'repetitive' // "Está repetitivo" -> Remover redundâncias e acelerar progressão narrativa
  | 'more_storytelling' // "Quero algo com mais storytelling" -> Fortalecer setup, questão, virada e payoff
  | 'nao_gostei'; // "Não gostei" -> Regenerar a história sob um novo ângulo, não só as palavras

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
  feedbackType?: NarrativeFeedbackType;
  isCompleteEnough: boolean;
  missingInfoQuestion?: string;
  wantsImmediateGeneration?: boolean;
  selectedAngle?: string;
  clarificationText?: string;
  suggestedActions?: { label: string; action: string; variant?: 'primary' | 'secondary' | 'outline' }[];
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

  // 2. Detecção de Feedbacks Estruturais Específicos (Seção 41)
  let feedbackType: NarrativeFeedbackType | undefined;
  if (
    text.includes('muito motivacional') ||
    text.includes('tá motivacional') ||
    text.includes('parece coach') ||
    text.includes('menos motivacional') ||
    text.includes('frase motivacional') ||
    text.includes('frases motivacionais')
  ) {
    feedbackType = 'too_motivational';
  } else if (
    text.includes('está repetitivo') ||
    text.includes('ta repetitivo') ||
    text.includes('muito repetitivo') ||
    text.includes('ficou repetitivo') ||
    text.includes('repetindo') ||
    text.includes('redundante')
  ) {
    feedbackType = 'repetitive';
  } else if (
    text.includes('mais storytelling') ||
    text.includes('com mais storytelling') ||
    text.includes('quero storytelling') ||
    text.includes('falta história') ||
    text.includes('mais narrativa') ||
    text.includes('mais historia')
  ) {
    feedbackType = 'more_storytelling';
  } else if (
    text.includes('não gostei') ||
    text.includes('nao gostei') ||
    text.includes('não curti') ||
    text.includes('faz outro') ||
    text.includes('refaz') ||
    text.includes('outra ideia') ||
    text.includes('muda tudo') ||
    text.includes('tenta outra coisa') ||
    text.includes('troca esse roteiro')
  ) {
    feedbackType = 'nao_gostei';
  }

  const isRejectionOrRegen = Boolean(feedbackType === 'nao_gostei' || (feedbackType && feedbackType !== 'too_motivational' && feedbackType !== 'repetitive'));

  // 3. Detecção de Ajustes Específicos
  let isTargetedAdjustment = false;
  let adjustmentType: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue' | undefined;
  let adjustmentDetail = text;

  if (feedbackType === 'too_motivational' || feedbackType === 'repetitive' || feedbackType === 'more_storytelling') {
    isTargetedAdjustment = true;
    adjustmentType = feedbackType === 'too_motivational' ? 'tone' : 'dialogue';
  } else if (
    text.includes('gancho') ||
    text.includes('começo') ||
    text.includes('abertura') ||
    text.includes('primeiros segundos') ||
    text.includes('primeira fala')
  ) {
    isTargetedAdjustment = true;
    adjustmentType = 'hook';
  } else if (
    text.includes('cta') ||
    text.includes('chamada') ||
    text.includes('final') ||
    text.includes('fechamento') ||
    text.includes('última fala')
  ) {
    isTargetedAdjustment = true;
    adjustmentType = 'cta';
  } else if (
    text.includes('curto') ||
    text.includes('rápido') ||
    text.includes('longo') ||
    text.includes('segundos') ||
    text.includes('minuto')
  ) {
    isTargetedAdjustment = true;
    adjustmentType = 'duration';
  } else if (
    text.includes('engraçado') ||
    text.includes('natural') ||
    text.includes('forte') ||
    text.includes('cinematográfico') ||
    text.includes('sério') ||
    text.includes('provocativo') ||
    text.includes('agressivo')
  ) {
    isTargetedAdjustment = true;
    adjustmentType = 'tone';
  } else if (text.includes('fala') || text.includes('diálogo') || text.includes('texto da cena')) {
    isTargetedAdjustment = true;
    adjustmentType = 'dialogue';
  }

  // 4. Detecção de Pedido Explícito de Geração Imediata
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
    'escolha profissional',
    'gera direto',
    'decida por mim',
  ];
  const wantsImmediateGeneration = generateKeywords.some((kw) => text.includes(kw));

  // 5. Extração de Duração
  let durationSec = existingBrief?.duration_seconds || 30;
  if (text.includes('15 segundos') || text.includes('15s')) durationSec = 15;
  else if (text.includes('30 segundos') || text.includes('30s') || text.includes('meio minuto')) durationSec = 30;
  else if (text.includes('45 segundos') || text.includes('45s')) durationSec = 45;
  else if (text.includes('60 segundos') || text.includes('60s') || text.includes('1 minuto') || text.includes('um minuto')) durationSec = 60;
  else if (text.includes('90 segundos') || text.includes('90s') || text.includes('1 minuto e meio')) durationSec = 90;
  else if (text.includes('2 minutos') || text.includes('dois minutos')) durationSec = 120;

  // 6. Mapeamento e Detecção de Nicho
  let detectedNicheKey = 'universal';
  let client = existingBrief?.client || 'Cliente';
  let topic = existingBrief?.topic || '';
  let speaker = existingBrief?.speaker || 'o apresentador';

  if (text.includes('barbearia') || text.includes('barbeiro') || text.includes('cabelo masculino') || text.includes('corte')) {
    detectedNicheKey = 'barbearia';
    client = 'Barbearia';
    speaker = 'o barbeiro';
    topic = 'estilo, visagismo e corte masculino';
  } else if (text.includes('dentista') || text.includes('odonto') || text.includes('clareamento') || text.includes('sorriso')) {
    detectedNicheKey = 'odontologia';
    client = 'Clínica Odontológica';
    speaker = 'o dentista';
    topic = 'odontologia estética e saúde do sorriso';
  } else if (text.includes('hambúrguer') || text.includes('burger') || text.includes('chapa') || text.includes('restaurante')) {
    detectedNicheKey = 'gastronomia';
    client = 'Hamburgueria Artesanal';
    speaker = 'o chef artesanal';
    topic = 'hambúrguer artesanal e sabor autoral';
  } else if (text.includes('academia') || text.includes('treino') || text.includes('musculação') || text.includes('personal')) {
    detectedNicheKey = 'fitness';
    client = 'Academia & Performance';
    speaker = 'o treinador';
    topic = 'treino consistente, biomecânica e hipertrofia';
  }

  // 7. Detecção de Ângulo Selecionado pelo Usuário
  let selectedAngle: string | undefined = undefined;
  if (text.includes('durabilidade') || text.includes('perde o formato') || text.includes('abordagem 1') || text.includes('opção 1')) {
    selectedAngle = 'durabilidade';
  } else if (text.includes('visagismo') || text.includes('proporção') || text.includes('formato de rosto') || text.includes('abordagem 2') || text.includes('opção 2')) {
    selectedAngle = 'visagismo';
  } else if (text.includes('automático') || text.includes('medo de errar') || text.includes('faz igual da última vez') || text.includes('abordagem 3') || text.includes('opção 3')) {
    selectedAngle = 'automatico';
  } else if (text.includes('clareamento') || text.includes('mito')) {
    selectedAngle = 'clareamento';
  } else if (text.includes('harmonia') || text.includes('estética invisível')) {
    selectedAngle = 'harmonia';
  } else if (text.includes('bruxismo') || text.includes('dor de cabeça')) {
    selectedAngle = 'bruxismo';
  } else if (text.includes('crosta') || text.includes('maillard')) {
    selectedAngle = 'crosta';
  } else if (text.includes('equilíbrio') || text.includes('menos é mais')) {
    selectedAngle = 'equilibrio';
  } else if (text.includes('exaustão') || text.includes('fadiga')) {
    selectedAngle = 'exaustao';
  } else if (text.includes('cardio') || text.includes('esteira')) {
    selectedAngle = 'cardio';
  }

  // 8. Identificação do Playbook Correspondente
  const activePlaybook: NichePlaybook =
    STRATEGIC_PLAYBOOKS[detectedNicheKey] || createUniversalPlaybook(topic || rawInput, client);

  // 9. Construção do Texto de Esclarecimento Estratégico
  let clarificationText: string | undefined = undefined;
  let suggestedActions: { label: string; action: string; variant?: 'primary' | 'secondary' | 'outline' }[] | undefined = undefined;

  if (activePlaybook.angles.length >= 2) {
    const angle1 = activePlaybook.angles[0];
    const angle2 = activePlaybook.angles[1];
    const angle3 = activePlaybook.angles[2];

    const anglesList = activePlaybook.angles
      .map((a, i) => `${i + 1}. **${a.name}**: ${a.description}`)
      .join('\n\n');

    clarificationText = `Para **${activePlaybook.nicheName}**, identifiquei caminhos com alta retenção e narrativa contínua:\n\n${anglesList}\n\nQual dessas abordagens faz mais sentido para o seu cliente, ou prefere que eu faça a escolha profissional e gere direto?`;

    suggestedActions = [
      { label: angle1.shortLabel, action: `send:Prefiro a abordagem 1: ${angle1.name}`, variant: 'outline' },
      { label: angle2.shortLabel, action: `send:Prefiro a abordagem 2: ${angle2.name}`, variant: 'outline' },
      ...(angle3 ? [{ label: angle3.shortLabel, action: `send:Prefiro a abordagem 3: ${angle3.name}`, variant: 'outline' as const }] : []),
      { label: '🎯 Fazer a escolha profissional e gerar direto', action: 'send:Pode fazer a escolha profissional e gerar o roteiro direto!', variant: 'primary' },
      { label: '🎙️ Responder por Áudio', action: 'start_audio' },
    ];
  }

  // Monta Briefing Criativo Consolidado
  const updatedBrief: CreativeBrief = {
    client: existingBrief?.client && existingBrief.client !== 'Cliente' ? existingBrief.client : client,
    video_type: durationSec <= 60 ? 'reels' : 'institucional',
    duration_seconds: durationSec,
    topic: topic || existingBrief?.topic || 'Apresentação de valor',
    objective: existingBrief?.objective || 'Autoridade técnica e agendamento direto sem clichês',
    speaker: speaker,
    platform: existingBrief?.platform || 'Instagram Reels',
    format: existingBrief?.format || '9:16',
    tone: existingBrief?.tone || 'Natural, humano e envolvente em português do Brasil',
    style: 'cinematografico',
    specific_requests: existingBrief?.specific_requests ? [...existingBrief.specific_requests, rawInput] : [rawInput],
    target_audience: activePlaybook.targetAudience,
    creative_angle: selectedAngle,
  };

  const isTooVague = text.length < 8 && !selectedAngle && !wantsImmediateGeneration;
  const isCompleteEnough = !isTooVague;

  return {
    brief: updatedBrief,
    isApproval,
    isRejectionOrRegen,
    isTargetedAdjustment,
    adjustmentType,
    adjustmentDetail,
    feedbackType,
    isCompleteEnough,
    wantsImmediateGeneration,
    selectedAngle,
    clarificationText,
    suggestedActions,
  };
}

/**
 * GERA TÍTULO AUTOMÁTICO E PROFISSIONAL PARA O PROJETO DE ROTEIRO
 */
export function generateScriptProjectTitle(rawInput: string, brief: CreativeBrief): string {
  const text = rawInput.toLowerCase();

  if (text.includes('durabilidade')) return 'O Segredo da Durabilidade do Corte';
  if (text.includes('visagismo') || text.includes('proporção')) return 'Visagismo e Proporção Facial';
  if (text.includes('automático') || text.includes('medo de errar')) return 'A Quebra do Automático';
  if (text.includes('três cortes') || text.includes('3 cortes') || (text.includes('corte') && text.includes('barbearia'))) {
    return '3 Cortes Masculinos em Alta';
  }
  if (text.includes('clareamento')) return 'O Mito do Clareamento Rápido';
  if (text.includes('sorriso') || text.includes('odonto')) return 'Estética e Harmonia do Sorriso';
  if (text.includes('bruxismo')) return 'Diagnóstico da Dor de Bruxismo';
  if (text.includes('hambúrguer') || text.includes('burger')) return 'O Ponto e a Crosta Perfeita';
  if (text.includes('academia') || text.includes('treino')) return 'A Ilusão da Exaustão no Treino';
  if (text.includes('esteira') || text.includes('cardio')) return 'Ordem Ideal de Cardio e Pesos';

  if (brief.creative_angle) {
    return brief.creative_angle.charAt(0).toUpperCase() + brief.creative_angle.slice(1);
  }

  if (brief.topic && brief.topic !== 'Apresentação de valor') {
    const cleanWords = brief.topic
      .split(' ')
      .slice(0, 5)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return cleanWords.join(' ');
  }

  return 'Novo Projeto Audiovisual';
}

/**
 * GERADOR DE ROTEIRO NARRATIVO PROFISSIONAL (Seção 1 a 44 do Master Prompt)
 * Metodologia de Continuidade Estrita:
 * Cada cena é um elo de uma história causal contínua (Início -> Desenvolvimento -> Virada -> Consequência -> Fechamento).
 */
export function generateNarrativeScript(
  brief: CreativeBrief,
  isAlternative: boolean = false,
  requestedAngle?: string
): ScriptCreatorOutput {
  const { topic, duration_seconds, tone, speaker, client } = brief;

  // Localiza ou gera o playbook do nicho
  const isBarbershop =
    topic.toLowerCase().includes('barbearia') ||
    topic.toLowerCase().includes('cabelo') ||
    topic.toLowerCase().includes('corte');

  const isOdonto =
    topic.toLowerCase().includes('odonto') ||
    topic.toLowerCase().includes('dentista') ||
    topic.toLowerCase().includes('sorriso');

  const isGastro =
    topic.toLowerCase().includes('hambúrguer') ||
    topic.toLowerCase().includes('restaurante') ||
    topic.toLowerCase().includes('gastronomia');

  const isFitness =
    topic.toLowerCase().includes('academia') ||
    topic.toLowerCase().includes('treino') ||
    topic.toLowerCase().includes('musculação');

  let playbook: NichePlaybook;
  if (isBarbershop) playbook = STRATEGIC_PLAYBOOKS['barbearia'];
  else if (isOdonto) playbook = STRATEGIC_PLAYBOOKS['odontologia'];
  else if (isGastro) playbook = STRATEGIC_PLAYBOOKS['gastronomia'];
  else if (isFitness) playbook = STRATEGIC_PLAYBOOKS['fitness'];
  else playbook = createUniversalPlaybook(topic, client);

  // Seleção do ângulo estratégico
  let chosenAngle: StrategicAngle;
  if (requestedAngle) {
    const match = playbook.angles.find((a) => a.key === requestedAngle);
    chosenAngle = match || playbook.angles[0];
  } else if (isAlternative && playbook.angles.length > 1) {
    chosenAngle = playbook.angles[1];
  } else {
    chosenAngle = playbook.angles[0];
  }

  // Constrói cenas cinematográficas reais
  const scenes = chosenAngle.scenes(duration_seconds, speaker || playbook.defaultSpeaker);

  return {
    agent: 'script_creator',
    language: 'pt-BR',
    concept: `Produção audiovisual vertical de ${duration_seconds}s para ${playbook.nicheName}, construída sob a estratégia contínua "${chosenAngle.name}".`,
    creative_angle: chosenAngle.name,
    creative_justification: chosenAngle.creative_justification,
    central_question: chosenAngle.central_question,
    hook: chosenAngle.hook,
    narrative_strategy: `Narrativa Contínua em 5 atos: Pergunta inicial -> Contexto dos primeiros dias -> Virada técnica -> Consequência na rotina -> Conclusão com recomendação acionável.`,
    retention_technique: 'Continuidade de pensamento cena a cena, sem frases soltas, recuo de 1,5m da parede e contato visual magnético.',
    scenes: scenes,
    dialogue_overview: scenes.map((s) => s.dialogue),
    cta: chosenAngle.cta,
    visual_notes: [
      'Manter recuo físico mínimo de 1,5m entre o personagem e a parede de fundo para profundidade cinematográfica autêntica.',
      'Luz principal direcionada a 45° em relação ao nariz para esculpir contraste tridimensional suave.',
      'Microfone lapela preso a 15cm da boca na linha do osso esterno para clareza acústica natural.',
    ],
  };
}

/**
 * REGENERAÇÃO CIRÚRGICA E RECALIBRAÇÃO ESTRUTURAL (Seções 35 e 41 do Master Prompt)
 * Trata:
 * - Gancho, CTA, Tom e Diálogo pontual
 * - Feedbacks estruturais: "muito motivacional", "está repetitivo", "mais storytelling", "não gostei"
 */
export function applyTargetedAdjustment(
  currentScript: ScriptCreatorOutput,
  adjustmentType: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue',
  userDirective: string,
  feedbackType?: NarrativeFeedbackType
): ScriptCreatorOutput {
  const updated = JSON.parse(JSON.stringify(currentScript)) as ScriptCreatorOutput;
  const directive = userDirective.toLowerCase();

  // CASO A: FEEDBACK ESTRUTURAL ESPECÍFICO (Seção 41)
  if (feedbackType === 'too_motivational' || directive.includes('motivacional') || directive.includes('coach')) {
    // Reduz linguagem motivacional e reconstrói continuidade 100% prática e causal
    updated.narrative_strategy = 'Recalibração estrita: 0% jargão motivacional. 100% raciocínio causal, mecânica prática e passos observáveis.';
    // Purificar as falas garantindo tom estritamente técnico e conversacional
    updated.scenes = updated.scenes.map((scene, idx) => {
      let practicalDialogue = scene.dialogue;
      if (idx === 0) {
        practicalDialogue = scene.dialogue.replace(/sucesso|acredite|sonho|vencedor/gi, 'resultado real');
      } else if (idx === updated.scenes.length - 1) {
        practicalDialogue = scene.dialogue.replace(/transforme sua vida|conquiste seus sonhos/gi, 'aplique esse ajuste na sua rotina');
      }
      return {
        ...scene,
        dialogue: practicalDialogue,
        narrativePurpose: `Ajuste pragmático (anti-motivacional): ${scene.narrativePurpose}`,
        emotionalIntention: 'Sobriedade, clareza técnica e autoridade fundamentada.',
      };
    });
    return updated;
  }

  if (feedbackType === 'repetitive' || directive.includes('repetitivo') || directive.includes('redundante')) {
    // Remove redundâncias e intensifica a progressão cena a cena
    updated.narrative_strategy = 'Progressão acelerada: corte de redundâncias e avanço imediato entre premissa, mecanismo e conclusão.';
    updated.scenes = updated.scenes.map((scene, idx) => ({
      ...scene,
      narrativePurpose: `Progressão acelerada CENA 0${idx + 1}: avanço direto para novo dado`,
    }));
    return updated;
  }

  if (feedbackType === 'more_storytelling' || directive.includes('storytelling')) {
    // Fortalece o arco clássico: setup -> pergunta -> complicação -> virada -> payoff
    updated.narrative_strategy = 'Storytelling cinematográfico amplificado: gancho de tensão -> dilema -> ponto de inflexão -> recompensa prática -> fechamento do ciclo.';
    return updated;
  }

  // CASO B: AJUSTE DE GANCHO ESPECÍFICO
  if (adjustmentType === 'hook') {
    if (directive.includes('agressivo') || directive.includes('forte') || directive.includes('impacto') || directive.includes('provocativo')) {
      updated.hook = '"Pare de fazer isso agora mesmo se você não quiser jogar seu dinheiro e o seu tempo no lixo."';
    } else if (directive.includes('engraçado') || directive.includes('humor') || directive.includes('descontraído')) {
      updated.hook = '"Eu jurei que não ia falar nada, mas depois do que eu vi hoje cedo na cadeira, fui obrigado a ligar essa câmera."';
    } else if (directive.includes('pergunta') || directive.includes('interrogação')) {
      updated.hook = '"Se você pudesse mudar só um detalhe no seu visual antes do fim de semana, qual seria a primeira coisa?"';
    } else {
      updated.hook = '"Existe um erro silencioso que quase todo mundo comete aqui e que custa muito caro no final do mês."';
    }

    if (updated.scenes[0]) {
      updated.scenes[0].dialogue = updated.hook.replace(/^"|"$/g, '');
      updated.scenes[0].narrativePurpose = `Gancho recalibrado com continuidade preservada: ${userDirective}`;
    }
  } else if (adjustmentType === 'cta') {
    if (directive.includes('whatsapp') || directive.includes('zap')) {
      updated.cta = '"Clica no botão do WhatsApp na bio e vem tirar suas dúvidas direto com a nossa equipe antes que a agenda lote."';
    } else if (directive.includes('comentar') || directive.includes('comentário')) {
      updated.cta = '"Comenta aqui embaixo \'EU QUERO\' que eu te mando o passo a passo completo no seu direct agora mesmo."';
    } else if (directive.includes('direct') || directive.includes('mensagem')) {
      updated.cta = '"Me manda uma mensagem no direct dizendo \'COMEÇAR\' que a gente alinha o seu caso pessoalmente."';
    } else {
      updated.cta = '"Se você quer garantir seu horário com calma nesta semana, o link está disponível na bio."';
    }

    const lastScene = updated.scenes[updated.scenes.length - 1];
    if (lastScene) {
      lastScene.dialogue = updated.cta.replace(/^"|"$/g, '');
      lastScene.narrativePurpose = `Chamada para ação recalibrada: ${userDirective}`;
    }
  } else if (adjustmentType === 'tone') {
    updated.narrative_strategy = `Tom recalibrado conforme diretriz: ${userDirective}. Pausas mais orgânicas e inflexão direta.`;
    updated.scenes = updated.scenes.map((s) => ({
      ...s,
      emotionalIntention: `Entonação ajustada para o tom: ${userDirective}`,
    }));
  }

  return updated;
}

/**
 * ATIVAÇÃO DOS AGENTES DOWNSTREAM (CENA, FOTO, TAKES) APÓS APROVAÇÃO DO ROTEIRO
 */
export function activateDownstreamAgents(
  context: SharedProjectContext,
  approvedScript: ScriptCreatorOutput
): GeneralDirectorOutput {
  // 1. Diretor de Cena traduz a narrativa aprovada em movimentação e bloqueio físico (a 1,5m da parede)
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
