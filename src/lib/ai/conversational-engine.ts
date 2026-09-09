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
  // Campos de inteligência criativa e raciocínio estratégico
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
 * PLAYBOOKS ESTRATÉGICOS POR NICHO (Metodologia CineMaker Pro)
 * Transforma: INTENÇÃO DO USUÁRIO -> RACIOCÍNIO -> ESTRATÉGIA CRIATIVA -> ROTEIRO REAL
 * REGRA ABSOLUTA: NÃO COPIAR O USUÁRIO, NÃO PARAFRASEAR, NÃO USAR AS PALAVRAS DO USUÁRIO COMO DIÁLOGO.
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
        name: 'O Erro da Durabilidade',
        shortLabel: '1. O Erro da Durabilidade',
        description: 'Explicar por que o corte perde o formato rápido quando a finalização diária em casa está errada.',
        hook: '"Se você faz esse corte e ele perde o formato em menos de uma semana, o problema quase nunca é o corte: é esse detalhe que quase ninguém te explica."',
        central_question: 'Por que o caimento natural e a finalização diária determinam a durabilidade do corte?',
        cta: '"No seu próximo corte, avisa que quer aprender a finalizar sozinho. Clica no link da bio e garante o seu horário nesta semana."',
        creative_justification: 'Em vez de uma propaganda genérica sobre corte de cabelo, atacamos a frustração real do cliente: o cabelo perder a forma logo após sair da barbearia. Isso posiciona o profissional como consultor técnico, gerando alta taxa de salvamento e agendamentos qualificados.',
        scenes: (durationSec, speaker) => {
          const s1 = Math.max(5, Math.round(durationSec * 0.2));
          const s2 = Math.max(14, Math.round(durationSec * 0.55));
          const s3 = Math.max(6, Math.round(durationSec * 0.25));
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O ALERTA DA DURABILIDADE',
              stage: 'hook',
              objective: 'Parar o scroll nos primeiros 3 segundos atacando uma frustração diária',
              narrativePurpose: 'Conexão instantânea por identificação de dor cotidiana',
              dialogue: 'Se você sai da barbearia com o cabelo impecável, mas em cinco dias ele já perdeu totalmente o desenho, o problema quase nunca foi a tesoura: foi o jeito que você seca em casa.',
              action: `${speaker} a 1,5m da parede de fundo, limpando a lâmina com toalha de microfibra, olhar seguro e calmo diretamente para a lente.`,
              visualIdea: 'Plano Médio vertical 9:16. Iluminação a 45° suave modelando os traços do rosto e o reflexo metálico das ferramentas.',
              emotionalIntention: 'Alívio e curiosidade técnica.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte seco no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — A REVELAÇÃO DO CAIMENTO',
              stage: 'discovery',
              objective: 'Entregar o valor prático sem jargões desnecessários',
              narrativePurpose: 'Demonstração de autoridade sem parecer arrogante',
              dialogue: 'O caimento perfeito não pede meio pote de pomada. Pede respeitar o sentido natural do redemoinho e alinhar o ar morno da raiz pras pontas antes de encostar qualquer produto no fio.',
              action: `${speaker} aponta para o topo da cabeça no espelho com um pente de dentes largos, demonstrando o fluxo correto do ar.`,
              visualIdea: 'Close Médio focado na destreza das mãos e no controle minucioso do movimento artesanal.',
              emotionalIntention: 'Clareza didática e credibilidade técnica.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte no movimento da mão',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — A CONVOCAÇÃO PARA A CADEIRA',
              stage: 'cta',
              objective: 'Direcionar para o agendamento de forma natural e consultiva',
              narrativePurpose: 'Convite direto com benefício explícito',
              dialogue: 'No seu próximo corte, avisa que você quer aprender a finalizar sozinho. Clica no link da bio e garante o seu horário nesta semana.',
              action: `${speaker} coloca o pente na bancada de madeira, sorri de forma receptiva e aponta com discrição para a bio.`,
              visualIdea: 'Plano Médio aberto com contraluz suave desenhando os ombros e a cadeira acolhedora ao fundo.',
              emotionalIntention: 'Decisão segura e agendamento sem fricção.',
              durationSec: s3,
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
        hook: '"Pedir corte de foto da internet é o jeito mais fácil de sair insatisfeito da barbearia. O seu formato de rosto dita o corte, e não o contrário."',
        central_question: 'Como o visagismo masculino harmoniza os traços do rosto e eleva a presença pessoal?',
        cta: '"Quer descobrir qual proporção valoriza seus traços reais? Clica no link da bio e vem sentar na cadeira de quem analisa antes de cortar."',
        creative_justification: 'Desarmamos a expectativa perigosa de levar fotos irreais de celebridades. O visagismo prático eleva o serviço de um simples corte para uma consultoria de imagem masculina de alto valor.',
        scenes: (durationSec, speaker) => {
          const s1 = Math.max(5, Math.round(durationSec * 0.2));
          const s2 = Math.max(14, Math.round(durationSec * 0.55));
          const s3 = Math.max(6, Math.round(durationSec * 0.25));
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — A ILUSÃO DA FOTO DA INTERNET',
              stage: 'hook',
              objective: 'Quebrar o padrão de levar foto do Pinterest sem critério',
              narrativePurpose: 'Choque de lucidez amigável',
              dialogue: 'Pedir o corte daquela foto do Pinterest é o caminho mais rápido para a decepção. O que funciona no jogador famoso quase nunca respeita o desenho da sua mandíbula.',
              action: `${speaker} a 1,5m do fundo, segurando a tesoura fechada, olhando com franqueza e empatia para a câmera.`,
              visualIdea: 'Plano Médio vertical com iluminação contrastada e fundo escuro descolado em profundidade.',
              emotionalIntention: 'Quebra de ilusão e atenção focada.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no olhar',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O MAPA DAS PROPORÇÕES',
              stage: 'discovery',
              objective: 'Explicar a mecânica visual das linhas do rosto',
              narrativePurpose: 'Demonstração de visagismo profissional',
              dialogue: 'Rosto mais redondo pede lateral limpa e topo com volume pra alongar. Já rosto triangular precisa de peso nas têmporas pra equilibrar a proporção. Isso é visagismo, não sorte.',
              action: `${speaker} delimita no ar com as mãos as linhas verticais e horizontais do rosto humano.`,
              visualIdea: 'Close Médio com foco nítido na expressão facial didática do especialista.',
              emotionalIntention: 'Fascinio e admiração pelo conhecimento.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte rápido no gesto',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — O CONVITE DE VALOR',
              stage: 'cta',
              objective: 'Transformar curiosidade em agendamento imediato',
              narrativePurpose: 'Posicionamento premium',
              dialogue: 'Quer descobrir qual proporção valoriza seus traços reais? Clica no link da bio e senta na cadeira de quem analisa antes de cortar.',
              action: `${speaker} ajeita a capa na cadeira de atendimento vazia e faz gesto convidativo para o espectador entrar na cena.`,
              visualIdea: 'Plano Médio cinematográfico com iluminação quente na cadeira de corte.',
              emotionalIntention: 'Vontade imediata de viver a experiência.',
              durationSec: s3,
              shotType: 'Plano Médio (35mm)',
              transition: 'Fade out',
            },
          ];
        },
      },
      {
        key: 'automatico',
        name: 'A Quebra do Automático',
        shortLabel: '3. A Quebra do Automático',
        description: 'Por que a maioria dos homens sempre pede o mesmo corte por puro medo de o barbeiro errar.',
        hook: '"Você ainda senta na cadeira da barbearia e fala \'faz igual da última vez\' só por puro medo de o barbeiro inventar moda e estragar seu cabelo?"',
        central_question: 'Por que nos acomodamos no corte padrão e como renovar o visual sem sustos?',
        cta: '"Deixa quem entende do assunto desenhar o seu estilo. Clica no link da bio e agenda o seu horário com a gente."',
        creative_justification: 'Tocamos na vulnerabilidade silenciosa da maioria dos homens: o medo de arriscar um corte novo e se arrepender. Oferecemos uma ponte de confiança com ajustes progressivos e seguros.',
        scenes: (durationSec, speaker) => {
          const s1 = Math.max(5, Math.round(durationSec * 0.2));
          const s2 = Math.max(14, Math.round(durationSec * 0.55));
          const s3 = Math.max(6, Math.round(durationSec * 0.25));
          return [
            {
              sceneNumber: 1,
              sceneName: 'CENA 01 — O CONFORTO DO MEDO',
              stage: 'hook',
              objective: 'Revelar o hábito silencioso de pedir sempre a mesma coisa',
              narrativePurpose: 'Conexão por humor e cumplicidade',
              dialogue: 'Você ainda senta na cadeira e fala "faz igual da última vez" por puro receio de arriscar e ter que passar três semanas usando boné?',
              action: `${speaker} cruza os braços com sorriso cúmplice a 1,5m da parede, falando como um velho amigo.`,
              visualIdea: 'Plano Médio vertical com iluminação envolvente a 45° criando sombras suaves e naturais.',
              emotionalIntention: 'Riso espontâneo e identificação total.',
              durationSec: s1,
              shotType: 'Plano Médio (35mm)',
              transition: 'Corte no sorriso',
            },
            {
              sceneNumber: 2,
              sceneName: 'CENA 02 — O AJUSTE MILIMÉTRICO',
              stage: 'discovery',
              objective: 'Mostrar que mudar não significa radicalizar',
              narrativePurpose: 'Desmistificar a mudança de corte',
              dialogue: 'A verdade é que você não precisa de uma mudança radical. Um ajuste de 1 centímetro na altura do fade e uma textura na tesoura já mudam completamente sua presença e elegância.',
              action: `${speaker} segura a máquina de acabamento e demonstra no ar a sutil diferença de graduação com extrema leveza.`,
              visualIdea: 'Close nos detalhes metálicos da máquina e na firmeza das mãos do barbeiro.',
              emotionalIntention: 'Segurança absoluta e encorajamento.',
              durationSec: s2,
              shotType: 'Close Médio (50mm)',
              transition: 'Corte na lâmina',
            },
            {
              sceneNumber: 3,
              sceneName: 'CENA 03 — O CHAMADO À EVOLUÇÃO',
              stage: 'cta',
              objective: 'Motivar a quebra da rotina agora mesmo',
              narrativePurpose: 'Fechamento inspirador',
              dialogue: 'Chega de corte no piloto automático. Clica no link da bio e agenda seu horário com quem pensa no seu estilo junto com você.',
              action: `${speaker} olha firme na lente com olhar acolhedor e seguro, estendendo a mão para a frente.`,
              visualIdea: 'Plano Médio com contraluz dourado conferindo ar de sofisticação ao ambiente.',
              emotionalIntention: 'Decisão tomada e entusiasmo.',
              durationSec: s3,
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
    targetAudience: 'Pacientes que desejam um sorriso harmônico sem parecer artificial',
    angles: [
      {
        key: 'clareamento',
        name: 'O Mito do Clareamento Rápido',
        shortLabel: '1. O Mito do Clareamento Caseiro',
        description: 'Desmistificar receitas caseiras de internet que destroem o esmalte dentário.',
        hook: '"Se você acha que dente branco é sinônimo de dente saudável, precisa saber o que os métodos caseiros de internet fazem com o seu esmalte."',
        central_question: 'Por que clareamentos milagrosos sem supervisão causam sensibilidade irreversível?',
        cta: '"Quer clarear com segurança e durabilidade? Clica no link da bio e avalie seu esmalte com quem entende."',
        creative_justification: 'Alerta de saúde pública que desarma soluções caseiras perigosas e atrai pacientes conscientes para o consultório.',
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — O ALERTA DO ESMALTE',
            stage: 'hook',
            objective: 'Interromper o hábito de seguir receitas milagrosas',
            narrativePurpose: 'Autoridade clínica e proteção do paciente',
            dialogue: 'Se você acha que dente branco é sinônimo de dente saudável, precisa saber o que as receitas de carvão e bicarbonato da internet fazem com o seu esmalte.',
            action: `${speaker} posicionado a 1,5m da parede de fundo do consultório, jaleco impecável, olhar atento e firme para a lente.`,
            visualIdea: 'Plano Médio vertical, luz suave envolvente com tons frios e limpos de consultório premium.',
            emotionalIntention: 'Alerta e respeito técnico.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte seco',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — A CIÊNCIA DO CLAREAMENTO',
            stage: 'discovery',
            objective: 'Explicar a permeabilidade do dente de forma simples',
            narrativePurpose: 'Educação preventiva de alto valor',
            dialogue: 'O esmalte não regenera. Quando você esfrega substâncias abrasivas, você desgasta a proteção e expõe a dentina. Clareamento de verdade age por oxigênio dentro do dente, sem lixar nada.',
            action: `${speaker} aponta para um modelo anatômico de dente na bancada, indicando as camadas com uma sonda clínica.`,
            visualIdea: 'Close Médio no modelo e na explicação visual serena do dentista.',
            emotionalIntention: 'Esclarecimento e alívio da dúvida.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte no instrumento',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — O CONVITE SEGURO',
            stage: 'cta',
            objective: 'Conduzir para a consulta diagnóstica',
            narrativePurpose: 'Fechamento com acolhimento profissional',
            dialogue: 'Não arrisque a saúde do seu sorriso com experimentos. Clica no link da bio e vem fazer uma avaliação segura com a nossa equipe.',
            action: `${speaker} sorri com dentes naturais e harmônicos, cruzando as mãos com tranquilidade na bancada.`,
            visualIdea: 'Plano Médio iluminado com luz de recorte suave nos ombros.',
            emotionalIntention: 'Segurança médica e agendamento confiante.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out',
          },
        ],
      },
      {
        key: 'harmonia',
        name: 'A Estética Invisível do Sorriso',
        shortLabel: '2. A Estética Invisível',
        description: 'Por que o melhor trabalho odontológico é aquele que ninguém percebe que é artificial.',
        hook: '"O melhor procedimento estético no dente é aquele que ninguém percebe que você fez. Sorriso bonito é harmonia, não um bloco branco artificial."',
        central_question: 'Como a odontologia moderna preserva a naturalidade e anatomia dos dentes?',
        cta: '"Agende sua avaliação estética no link da bio e descubra como a sutileza transforma o seu rosto."',
        creative_justification: 'Ataca o medo generalizado de ficar com "dentes de chiclete", atraindo um público maduro e de alto poder aquisitivo.',
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — O FIM DO DENTE DE CHICLETE',
            stage: 'hook',
            objective: 'Criticar a artificialidade dos sorrisos padronizados',
            narrativePurpose: 'Conexão com quem busca elegância discreta',
            dialogue: 'O melhor procedimento odontológico do mundo é aquele que ninguém percebe que você fez. Sorriso elegante é naturalidade, não uma fileira de dentes quadrados e opacos.',
            action: `${speaker} a 1,5m do fundo, postura serena, quebrando o mito do artificialismo estético.`,
            visualIdea: 'Plano Médio com contraluz que destaca a transparência das bordas incisais no consultório.',
            emotionalIntention: 'Alívio para quem tem receio de procedimentos estéticos.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte no olhar',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — ANATOMIA E TRANSLUCIDEZ',
            stage: 'discovery',
            objective: 'Mostrar o diferencial de restaurações biomiméticas',
            narrativePurpose: 'Autoridade estética avançada',
            dialogue: 'Dente de verdade tem textura, degradê de cor e translucidez na ponta. Respeitar as proporções do seu rosto e o arco do seu lábio é o que traz rejuvenescimento real.',
            action: `${speaker} analisa uma escala de cores cerâmicas sob luz neutra, mostrando as gradações sutis de tom.`,
            visualIdea: 'Close Médio nas pastilhas cerâmicas e no olhar clínico refinado.',
            emotionalIntention: 'Percepção de arte e alta precisão médica.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte na escala de cor',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — O CONVITE À HARMONIA',
            stage: 'cta',
            objective: 'Agendamento de consulta estética personalizada',
            narrativePurpose: 'Conversão com foco em sofisticação',
            dialogue: 'Se você busca harmonia sem perder a sua identidade, clica no link da bio e vem planejar o seu novo sorriso com a gente.',
            action: `${speaker} sorri com serenidade e aponta de forma sutil para a frente.`,
            visualIdea: 'Plano Médio elegante com ambiente acolhedor.',
            emotionalIntention: 'Desejo de transformação personalizada e segura.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out',
          },
        ],
      },
      {
        key: 'bruxismo',
        name: 'A Dor Oculta do Bruxismo',
        shortLabel: '3. A Dor Oculta do Bruxismo',
        description: 'Conectar dores de cabeça matinais e desgaste dental ao hábito noturno de apertar os dentes.',
        hook: '"Acordar com dor de cabeça matinal ou maxilar travado não é cansaço do dia anterior: é o reflexo do que acontece na sua mordida enquanto você dorme."',
        central_question: 'Como diagnosticar e proteger os dentes das fraturas causadas pelo bruxismo?',
        cta: '"Proteja seus dentes antes de quebrar. Clica no link da bio e faça seu diagnóstico de oclusão."',
        creative_justification: 'Relaciona um sintoma rotineiro ignorado por muitos a um problema clínico grave, gerando procura urgente por tratamento preventivo.',
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — O SINTOMA ENGANOSO',
            stage: 'hook',
            objective: 'Associar dor de cabeça matinal à saúde bucal',
            narrativePurpose: 'Descoberta que choca o espectador',
            dialogue: 'Acordar com dor de cabeça matinal ou sensação de peso no maxilar quase nunca é estresse passageiro: é o sinal claro de que você está apertando os dentes a noite inteira.',
            action: `${speaker} toca suavemente a região da articulação temporomandibular (ATM), olhar empático para a câmera.`,
            visualIdea: 'Plano Médio vertical, luz direcional destacando a expressão atenta do profissional.',
            emotionalIntention: 'Alerta e autoidentificação imediata.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte no toque',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — O DESGASTE INVISÍVEL',
            stage: 'discovery',
            objective: 'Alertar para as microfraturas e retração gengival',
            narrativePurpose: 'Conscientização preventiva',
            dialogue: 'A força da mordida dormindo chega a ser três vezes maior do que acordado. Isso trinca o esmalte, causa sensibilidade nas raízes e encurta os dentes ao longo dos anos.',
            action: `${speaker} mostra placa de proteção oclusal transparente de precisão milimétrica.`,
            visualIdea: 'Close Médio na placa oclusal cristalina e na solidez da explicação.',
            emotionalIntention: 'Urgência preventiva.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte na placa',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — A PREVENÇÃO URGENTE',
            stage: 'cta',
            objective: 'Conduzir para consulta de alívio e proteção',
            narrativePurpose: 'Solução acessível e necessária',
            dialogue: 'Não espere um dente quebrar para agir. Clica no link da bio e agenda uma avaliação da sua articulação ainda nesta semana.',
            action: `${speaker} convida o paciente com gesto afetuoso e acolhedor.`,
            visualIdea: 'Plano Médio iluminado com profundidade.',
            emotionalIntention: 'Alívio e decisão imediata.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out',
          },
        ],
      },
    ],
  },
  gastronomia: {
    nicheKey: 'gastronomia',
    nicheName: 'Gastronomia & Hambúrguer Artesanal',
    defaultClient: 'Hamburgueria Artesanal',
    defaultSpeaker: 'o chef chapeiro',
    targetAudience: 'Amantes de boa comida que valorizam sabor real e suculência técnica',
    angles: [
      {
        key: 'crosta',
        name: 'O Segredo da Crosta Perfeita (Maillard)',
        shortLabel: '1. O Segredo da Crosta Perfeita',
        description: 'Por que o hambúrguer de verdade nunca deve ser esmagado depois que já começou a chiar na chapa.',
        hook: '"Você sabe por que um hambúrguer artesanal de verdade nunca deve ser amassado na chapa depois que sela?"',
        central_question: 'Como a reação de Maillard concentra os sucos nobres dentro da carne?',
        cta: '"Quer provar essa crocância com suculência extrema? Clica no link da bio e confere o cardápio de hoje."',
        creative_justification: 'Desperta água na boca através da ciência culinária e sensorialidade visual, atraindo o cliente pelo desejo incontrolável do primeiro pedaço.',
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — O CRIME DA ESPÁTULA',
            stage: 'hook',
            objective: 'Chocar com um erro comum que estraga a carne',
            narrativePurpose: 'Autoridade sensorial instantânea',
            dialogue: 'Você sabe por que um hambúrguer artesanal nunca deve ser amassado na chapa depois que começa a chiar? Porque cada gota que evapora ali era a suculência da sua mordida.',
            action: `${speaker} com avental de couro em frente à chapa quente, segurando espátula pesada, olhar focado e direto na lente.`,
            visualIdea: 'Plano Médio vertical, vapor quente subindo suavemente ao fundo com iluminação quente de cozinha industrial.',
            emotionalIntention: 'Apetite agudo e curiosidade gastronômica.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte no vapor',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — A QUÍMICA DA CROSTINHA',
            stage: 'discovery',
            objective: 'Explicar a crosta caramelizada perfeita',
            narrativePurpose: 'Apetite visual e respeito ao ingrediente',
            dialogue: 'A crosta dourada é a reação de Maillard: calor violento nos primeiros segundos para trancar todo o sabor lá dentro, deixando o centro macio e rosado.',
            action: `${speaker} vira o burger na chapa revelando a crostinha caramelizada perfeita e crocante.`,
            visualIdea: 'Macro Close focado na carne borbulhando e na textura irresistível da crosta.',
            emotionalIntention: 'Desejo gustativo incontrolável.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Detalhe (85mm)',
            transition: 'Corte seco no som do chiar',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — A MORDIDA INEVITÁVEL',
            stage: 'cta',
            objective: 'Converter a fome visual em pedido imediato',
            narrativePurpose: 'Convocação para o delivery ou salão',
            dialogue: 'Sabor de verdade não precisa de exagero. Clica no link da bio, pede o seu agora e sente a diferença na primeira mordida.',
            action: `${speaker} fecha o burger no pão brioche amanteigado brilhante e apresenta à câmera com orgulho de artesão.`,
            visualIdea: 'Plano Médio em ângulo dinâmico com fumaça aromática.',
            emotionalIntention: 'Ação de compra imediata.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out apetitoso',
          },
        ],
      },
      {
        key: 'equilibrio',
        name: 'Menos é Mais no Sabor',
        shortLabel: '2. Menos é Mais no Sabor',
        description: 'Por que empilhar dezenas de molhos esconde a qualidade da carne em vez de valorizar.',
        hook: '"Pilha de queijo derretido escorrendo pode render foto bonita na internet, mas o verdadeiro teste do hambúrguer está no equilíbrio de apenas três ingredientes."',
        central_question: 'Por que o excesso de molhos esconde a má qualidade de um blend mal preparado?',
        cta: '"Prove o verdadeiro sabor da carne artesanal. Clica no link da bio e peça o clássico autoral da casa."',
        creative_justification: 'Critica a estética exagerada de "food porn" descartável e valoriza a receita autoral de quem realmente domina o corte e a temperagem.',
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — O EXCESSO ENGANOSO',
            stage: 'hook',
            objective: 'Criticar os lanches afogados em cheddar artificial',
            narrativePurpose: 'Afirmação de respeito gastronômico',
            dialogue: 'Pilha de queijo derretido escorrendo pode até render foto bonita na internet, mas na boca você só sente gosto de gordura hidrogenada.',
            action: `${speaker} a 1,5m da bancada de montagem, segurando um pão brioche dourado e fresco, postura firme e autêntica.`,
            visualIdea: 'Plano Médio vertical, luz quente acolhedora valorizando os tons dourados dos pães.',
            emotionalIntention: 'Quebra de modismo e conexão com o bom gosto.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte no olhar',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — O TRIO ESSENCIAL',
            stage: 'discovery',
            objective: 'Apresentar a tríade: pão macio, blend fresco e queijo curado',
            narrativePurpose: 'Construção de autoridade culinária',
            dialogue: 'O verdadeiro teste do hambúrguer está no trio clássico: um pão que sustenta até o final sem desmanchar, um blend bovino fresco de alta qualidade e o queijo derretido na medida certa.',
            action: `${speaker} corta o hambúrguer ao meio em tábua rústica de madeira, revelando a carne suculenta e rosada por dentro.`,
            visualIdea: 'Close Médio no corte transversal limpo, mostrando cada camada bem equilibrada.',
            emotionalIntention: 'Vontade imediata de saborear.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte no toque da lâmina',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — A EXPERIÊNCIA REAL',
            stage: 'cta',
            objective: 'Convidar para experimentar no salão ou pedir delivery',
            narrativePurpose: 'Chamada direta ao paladar refinado',
            dialogue: 'Se você valoriza sabor de verdade sem artimanhas, o link está na bio. Vem viver essa experiência hoje à noite.',
            action: `${speaker} sorri com orgulho do prato pronto e apoia os braços na bancada limpa.`,
            visualIdea: 'Plano Médio com ambiente da hamburgueria ao fundo.',
            emotionalIntention: 'Fome e decisão rápida.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out',
          },
        ],
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
        hook: '"Sair da academia destruído sem conseguir andar no dia seguinte não significa que o treino funcionou. Cansaço não é sinônimo de resultado."',
        central_question: 'Por que fadiga desorganizada apenas gera inflamação sem ganho muscular real?',
        cta: '"Quer treinar com inteligência e ver o físico mudar de verdade? Clica no link da bio e conheça nosso método."',
        creative_justification: 'Desmistifica a cultura do sofrimento inútil ("no pain no gain" irracional) e valoriza o método de progressão de cargas com recuperação otimizada.',
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — O MITO DO SOFRIMENTO',
            stage: 'hook',
            objective: 'Desmistificar que treino bom é treino que destrói',
            narrativePurpose: 'Choque de clareza e alívio mental',
            dialogue: 'Sair da academia se arrastando sem conseguir subir escadas no dia seguinte não significa que o seu treino foi eficiente. Cansaço não é sinônimo de hipertrofia.',
            action: `${speaker} a 1,5m dos aparelhos de musculação, segurando uma anilha com firmeza, postura atlética e olhar firme.`,
            visualIdea: 'Plano Médio vertical, iluminação de alto contraste destacando a musculatura e o ambiente de ferro.',
            emotionalIntention: 'Alívio e reflexão crítica.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte no peso',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — A CIÊNCIA DA PROGRESSÃO',
            stage: 'discovery',
            objective: 'Explicar a tensão mecânica e a sobrecarga progressiva',
            narrativePurpose: 'Autoridade biomecânica indiscutível',
            dialogue: 'O que faz o músculo crescer de verdade é tensão mecânica progressiva: executar o movimento completo com controle e adicionar peso ao longo das semanas, não mudar de exercício todo dia.',
            action: `${speaker} demonstra a cadência lenta na fase excêntrica de um movimento guiado, com controle absoluto da respiração.`,
            visualIdea: 'Close Médio nos cabos sob tensão e na contração muscular controlada.',
            emotionalIntention: 'Entendimento técnico e segurança.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte na contração',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — A CONVOCAÇÃO PARA O MÉTODO',
            stage: 'cta',
            objective: 'Convidar para um acompanhamento inteligente',
            narrativePurpose: 'Fechamento com foco em consistência',
            dialogue: 'Chega de cansaço sem espelho correspondente. Clica no link da bio e vem treinar com um plano feito para o seu corpo evoluir de verdade.',
            action: `${speaker} apoia a anilha no suporte com firmeza e olha direto nos olhos do aluno com incentivo genuíno.`,
            visualIdea: 'Plano Médio com luz de recorte nos ombros e postura vitoriosa.',
            emotionalIntention: 'Motivação renovada e ação imediata.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out forte',
          },
        ],
      },
      {
        key: 'cardio',
        name: 'O Erro do Cardio Antes do Peso',
        shortLabel: '2. Cardio Antes do Treino',
        description: 'Como gastar glicogênio correndo antes da musculação sabota o ganho de massa magra.',
        hook: '"Se você passa 40 minutos correndo na esteira antes de pegar peso achando que vai queimar mais gordura, está sabotando o seu metabolismo."',
        central_question: 'Qual é a ordem correta entre musculação e aeróbio para acelerar a queima de gordura?',
        cta: '"Ajuste sua rotina para queimar gordura dormindo. Clica no link da bio e confira nossa consultoria."',
        creative_justification: 'Corrige um dos erros mais comuns de quem entra na academia para emagrecer, educando sobre otimização metabólica e preservação muscular.',
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — A ARMADILHA DA ESTEIRA',
            stage: 'hook',
            objective: 'Alertar sobre a ordem ineficiente de exercícios',
            narrativePurpose: 'Interrupção de padrão de treino',
            dialogue: 'Se você chega na academia e corre 40 minutos na esteira antes de ir pros pesos achando que isso vai secar mais rápido, pare agora mesmo.',
            action: `${speaker} desce de uma esteira com expressão séria e acolhedora, posicionando-se a 1,5m do fundo da sala de cardio.`,
            visualIdea: 'Plano Médio vertical, fundo em desfoque cinematográfico.',
            emotionalIntention: 'Espanto e interesse imediato.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte no passo',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — A QUÍMICA DO GLICOGÊNIO',
            stage: 'discovery',
            objective: 'Explicar a reserva de energia primária',
            narrativePurpose: 'Didática fisiológica de fácil assimilação',
            dialogue: 'Você gasta sua energia nobre correndo, chega fraco na musculação e não gera estímulo para segurar a massa magra. Faça a musculação pesado primeiro e deixe o cardio para o final.',
            action: `${speaker} gesticula com clareza mostrando a diferença entre gastar energia útil e usar a gordura como combustível residual.`,
            visualIdea: 'Close Médio na firmeza do treinador explicando com autoridade.',
            emotionalIntention: 'Alívio por descobrir o segredo do resultado.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte seco',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — A ORDEM DO SUCESSO',
            stage: 'cta',
            objective: 'Conduzir para a consultoria de treino eficiente',
            narrativePurpose: 'Proposta clara de suporte profissional',
            dialogue: 'Treinar certo economiza seu tempo e acelera seu resultado. Clica no link da bio e venha estruturar sua periodização com a gente.',
            action: `${speaker} sorri com confiança e aponta convidativamente para a bio.`,
            visualIdea: 'Plano Médio com luz natural vindo das janelas da academia.',
            emotionalIntention: 'Entusiasmo e decisão prática.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out',
          },
        ],
      },
    ],
  },
};

/**
 * SINTETIZADOR UNIVERSAL DE ESTRATÉGIA CRIATIVA (Para nichos não cadastrados nos playbooks)
 * Garante que NUNCA haja paráfrase robótica ou cópia literal do usuário.
 */
export function createUniversalPlaybook(topic: string, clientName: string): NichePlaybook {
  const cleanTopic = topic.trim() || 'Serviços Especializados';
  return {
    nicheKey: 'universal',
    nicheName: cleanTopic,
    defaultClient: clientName || 'Especialista',
    defaultSpeaker: 'o especialista',
    targetAudience: `Pessoas que precisam de soluções concretas em ${cleanTopic} e querem evitar erros caros`,
    angles: [
      {
        key: 'senso_comum',
        name: 'A Quebra do Senso Comum',
        shortLabel: '1. A Quebra do Senso Comum',
        description: `Confrontar o erro mais comum que 90% das pessoas cometem ao lidar com ${cleanTopic}.`,
        hook: `"Existe um detalhe essencial sobre isso que a maioria das pessoas só descobre depois de perder tempo e dinheiro tentando resolver do jeito errado."`,
        central_question: `Por que as fórmulas fáceis falham e qual é o método seguro para ter resultado sustentável?`,
        cta: `"Quer parar de perder tempo com tentativas frustradas? Clica no link da bio e vamos conversar sobre o seu caso."`,
        creative_justification: `Desarmamos o senso comum sem repetir palavras do usuário, atacando a dor de quem já se frustrou com soluções superficiais e abrindo caminho para autoridade técnica.`,
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — O CONFRONTO DO MITO',
            stage: 'hook',
            objective: 'Parar o scroll quebrando uma crença popular limitante',
            narrativePurpose: 'Quebra de expectativa e atenção imediata',
            dialogue: 'A maioria das pessoas perde meses tentando resolver isso pelo caminho mais difícil, achando que o problema é falta de esforço, quando na verdade é apenas o método errado.',
            action: `${speaker} posicionado a 1,5m da parede de fundo, olhar firme e sincero na lente, postura aberta e acolhedora.`,
            visualIdea: 'Plano Médio vertical 9:16. Iluminação envolvente a 45° desenhando os traços do rosto com elegância.',
            emotionalIntention: 'Curiosidade e alívio mental.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte seco no olhar',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — O CAMINHO DA PREVISIBILIDADE',
            stage: 'discovery',
            objective: 'Apresentar a lógica do processo de forma clara',
            narrativePurpose: 'Construção de autoridade consultiva',
            dialogue: 'Quando você domina a sequência exata dos fatores e foca no que move o ponteiro, o resultado deixa de ser uma loteria e passa a ser uma consequência natural e previsível.',
            action: `${speaker} dá um passo sutil de 20cm em direção à câmera, gesticulando com as mãos abertas para enfatizar a clareza didática.`,
            visualIdea: 'Close Médio focado na expressão de certeza e domínio do profissional.',
            emotionalIntention: 'Segurança, clareza e credibilidade moral.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte no gesto',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — A AÇÃO DIRETA',
            stage: 'cta',
            objective: 'Conduzir para a tomada de contato sem rodeios',
            narrativePurpose: 'Chamada acolhedora e decisiva',
            dialogue: 'Se você quer dar esse próximo passo com quem já trilhou esse caminho centenas de vezes, clica no link da bio e manda uma mensagem.',
            action: `${speaker} conclui com sorriso sereno, fazendo convite receptivo com a mão direita.`,
            visualIdea: 'Plano Médio com luz de recorte suave separando o sujeito do fundo do ambiente.',
            emotionalIntention: 'Confiança mútua e incentivo à ação.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out elegante',
          },
        ],
      },
      {
        key: 'fator_invisivel',
        name: 'O Fator Técnico Invisível',
        shortLabel: '2. O Fator Invisível de Sucesso',
        description: `Revelar o elemento prático que separa amadores de profissionais experientes.`,
        hook: `"O que separa quem tem resultado constante de quem passa o ano inteiro patinando se resume a um único ajuste prático que quase ninguém compartilha."`,
        central_question: `Qual é o ajuste essencial que destrava consistência e resultados reais?`,
        cta: `"Quer aplicar esse ajuste na sua realidade ainda hoje? Clica no link da bio e vamos analisar juntos."`,
        creative_justification: `Substitui conversa genérica por uma revelação de bastidor que gera valor percebido imediato.`,
        scenes: (durationSec, speaker) => [
          {
            sceneNumber: 1,
            sceneName: 'CENA 01 — A REVELAÇÃO DO BASTIDOR',
            stage: 'hook',
            objective: 'Despertar a curiosidade de quem já tentou de tudo',
            narrativePurpose: 'Promessa de valor fundamentada',
            dialogue: 'O que separa quem tem resultado sólido de quem passa o ano patinando no mesmo lugar quase nunca é talento: é um critério técnico que quase ninguém ensina.',
            action: `${speaker} a 1,5m do fundo, postura focada, olhando diretamente no olho do espectador.`,
            visualIdea: 'Plano Médio com iluminação de recorte e fundo texturizado.',
            emotionalIntention: 'Intriga e respeito técnico.',
            durationSec: Math.max(5, Math.round(durationSec * 0.2)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Corte no olhar',
          },
          {
            sceneNumber: 2,
            sceneName: 'CENA 02 — A APLICAÇÃO PRÁTICA',
            stage: 'discovery',
            objective: 'Explicar a lógica por trás do ajuste',
            narrativePurpose: 'Demonstração de clareza cirúrgica',
            dialogue: 'Em vez de tentar abraçar tudo ao mesmo tempo, você ajusta essa alavanca específica. É o princípio de menor esforço com o máximo impacto prático na rotina.',
            action: `${speaker} utiliza um exemplo visual ou gesto métrico no ar para ilustrar o ponto de alavancagem.`,
            visualIdea: 'Close Médio com foco dinâmico valorizando a gesticulação precisa.',
            emotionalIntention: 'Iluminação mental e senso de oportunidade.',
            durationSec: Math.max(14, Math.round(durationSec * 0.55)),
            shotType: 'Close Médio (50mm)',
            transition: 'Corte no ritmo da fala',
          },
          {
            sceneNumber: 3,
            sceneName: 'CENA 03 — A CONVOCAÇÃO',
            stage: 'cta',
            objective: 'Estimular contato imediato',
            narrativePurpose: 'Fechamento profissional sem pressão',
            dialogue: 'Se você cansou de improviso e quer um plano feito sob medida para você, o link está fixado na bio. Vamos conversar.',
            action: `${speaker} sorri com tranquilidade e finaliza com postura firme.`,
            visualIdea: 'Plano Médio com atmosfera equilibrada e profissional.',
            emotionalIntention: 'Decisão segura.',
            durationSec: Math.max(6, Math.round(durationSec * 0.25)),
            shotType: 'Plano Médio (35mm)',
            transition: 'Fade out',
          },
        ],
      },
    ],
  };
}

/**
 * ANALISADOR DE INTENÇÃO E EXTRAÇÃO DE CONTEXTO (ÁUDIO OU TEXTO EM PT-BR)
 * Inferência Inteligente: Tópico, Objetivo, Público, Efeito Desejado, Contexto, Tom, Formato e Ângulo Criativo.
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

  if (
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

  // 6. Mapeamento e Detecção de Nicho Inteligente
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

  // 9. Construção do Texto de Esclarecimento Estratégico (Opção A do Master Prompt)
  let clarificationText: string | undefined = undefined;
  let suggestedActions: { label: string; action: string; variant?: 'primary' | 'secondary' | 'outline' }[] | undefined = undefined;

  if (activePlaybook.angles.length >= 2) {
    const angle1 = activePlaybook.angles[0];
    const angle2 = activePlaybook.angles[1];
    const angle3 = activePlaybook.angles[2];

    const anglesList = activePlaybook.angles
      .map((a, i) => `${i + 1}. **${a.name}**: ${a.description}`)
      .join('\n\n');

    clarificationText = `Para **${activePlaybook.nicheName}**, identifiquei três caminhos estratégicos com altíssima taxa de retenção e agendamento:\n\n${anglesList}\n\nQual dessas abordagens faz mais sentido para o seu cliente, ou prefere que eu faça a escolha profissional e gere direto?`;

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
    isCompleteEnough,
    wantsImmediateGeneration,
    selectedAngle,
    clarificationText,
    suggestedActions,
  };
}

/**
 * GERA TÍTULO AUTOMÁTICO E PROFISSIONAL PARA O PROJETO DE ROTEIRO
 * Exemplos do prompt: "3 Cortes Masculinos em Alta", "Visagismo e Proporção Facial"
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
 * GERADOR DE ROTEIRO NARRATIVO PROFISSIONAL (Seção 16 a 19 do Master Prompt)
 * Metodologia: INTENÇÃO -> RACIOCÍNIO -> ESTRATÉGIA -> ROTEIRO REAL FALADO
 * REGRA CRÍTICA: NÃO COPIAR O USUÁRIO, NÃO PARAFRASEAR, NÃO GERAR CLICHÊS.
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
    // Escolha profissional prioritária (Opção B do Master Prompt)
    chosenAngle = playbook.angles[0];
  }

  // Constrói cenas cinematográficas reais
  const scenes = chosenAngle.scenes(duration_seconds, speaker || playbook.defaultSpeaker);

  return {
    agent: 'script_creator',
    language: 'pt-BR',
    concept: `Produção audiovisual vertical de ${duration_seconds}s para ${playbook.nicheName}, construída sob a estratégia "${chosenAngle.name}".`,
    creative_angle: chosenAngle.name,
    creative_justification: chosenAngle.creative_justification,
    central_question: chosenAngle.central_question,
    hook: chosenAngle.hook,
    narrative_strategy: `Metodologia CineMaker Pro: Gancho de retenção humana (0-3s) -> Demonstração de domínio técnico -> CTA consultivo e convidativo.`,
    retention_technique: 'Pacing ágil, cortes de cena a cada 4-7 segundos, bloqueio a 1,5m da parede e contato visual magnético.',
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
 * REGENERAÇÃO CIRÚRGICA (Targeted Regeneration - Seção 35 do Master Prompt)
 * Altera cirurgicamente apenas o componente solicitado pelo usuário sem destruir o restante.
 */
export function applyTargetedAdjustment(
  currentScript: ScriptCreatorOutput,
  adjustmentType: 'hook' | 'cta' | 'duration' | 'tone' | 'dialogue',
  userDirective: string
): ScriptCreatorOutput {
  const updated = JSON.parse(JSON.stringify(currentScript)) as ScriptCreatorOutput;
  const directive = userDirective.toLowerCase();

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
      updated.scenes[0].narrativePurpose = `Gancho recalibrado: ${userDirective}`;
    }
  } else if (adjustmentType === 'cta') {
    if (directive.includes('whatsapp') || directive.includes('zap')) {
      updated.cta = '"Clica no botão do WhatsApp na bio e vem tirar suas dúvidas direto com a nossa equipe antes que a agenda lote."';
    } else if (directive.includes('comentar') || directive.includes('comentário')) {
      updated.cta = '"Comenta aqui embaixo \'EU QUERO\' que eu te mando a consultoria completa no seu direct agora mesmo."';
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
