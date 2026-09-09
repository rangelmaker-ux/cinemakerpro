import { ScriptCreatorOutput, ScriptScene, SharedProjectContext } from '../team-types';

/**
 * CRIADOR DE ROTEIRO (ScriptCreator)
 * Não é um chatbot genérico. Não usa "Você sabia que...".
 * Metodologia: Gancho -> Pergunta Central -> Origem do Problema -> Conflito -> Re-Gancho -> Descoberta -> Prova Real -> Clímax -> CTA.
 * 100% em Português Brasileiro natural e humano.
 */
export function runScriptCreator(context: SharedProjectContext): ScriptCreatorOutput {
  const clientName = context.client.name || 'Cliente';
  const videoType = context.video_type || 'institucional';

  let concept = '';
  let centralQuestion = '';
  let hook = '';
  let cta = '';
  let scenes: ScriptScene[] = [];

  if (videoType === 'depoimento') {
    concept = `Jornada de transformação real: como ${clientName} superou a incerteza inicial e alcançou o resultado comprovado.`;
    centralQuestion = 'O que realmente muda quando você decide não adiar mais a solução?';
    hook = '"Eu quase desisti na primeira semana. Achei que não era pra mim... até o momento em que vi a primeira mudança prática."';
    cta = '"Se você também sente que está travado no mesmo ponto, o primeiro passo é simples. Chame nossa equipe no link da bio."';

    scenes = [
      {
        sceneNumber: 1,
        sceneName: 'CENA 01 — O GANCHO HUMANO',
        stage: 'hook',
        objective: 'Quebrar o padrão de depoimento corporativo falso com vulnerabilidade imediata',
        narrativePurpose: 'Prender a atenção nos primeiros 3 segundos sem clichês',
        dialogue: 'Eu quase desisti na primeira semana. Sabe quando você tenta de tudo e parece que nada funciona? Foi exatamente assim.',
        action: 'Personagem sentado em posição 3/4, respira fundo, olhar sincero para o lado da câmera, expressão de lembrança real.',
        visualIdea: 'Plano Médio com luz suave lateral a 45°. Fundo com profundidade descolada em 1,5m, criando intimidade.',
        emotionalIntention: 'Vulnerabilidade, identificação genuína e honestidade.',
        durationSec: 5,
        shotType: 'Plano Médio (35mm)',
        brollSuggestion: 'Corte sutil para as mãos do personagem gesticulando com naturalidade.',
        transition: 'Corte seco no ritmo da respiração',
      },
      {
        sceneNumber: 2,
        sceneName: 'CENA 02 — O DILEMA REAL',
        stage: 'conflict',
        objective: 'Expor a dor sem vitimismo, conectando com o problema da audiência',
        narrativePurpose: 'Construir a tensão narrativa que justifica a busca pela solução',
        dialogue: 'O problema não era falta de esforço. Eu acordava cedo, executava tudo, mas o resultado simplesmente não aparecia.',
        action: 'Pequena mudança de postura: corpo avança 5cm para frente, enfatizando a frustração daquele momento passado.',
        visualIdea: 'Leve push-in lento da câmera, intensificando o contraste suave no rosto.',
        emotionalIntention: 'Tensão controlada e busca por respostas.',
        durationSec: 8,
        shotType: 'Plano Americano / Médio Fechado (50mm)',
        brollSuggestion: 'Imagens de arquivo da rotina real de trabalho ou detalhes do ambiente.',
        transition: 'Dissolução rápida de 0.2s',
      },
      {
        sceneNumber: 3,
        sceneName: 'CENA 03 — A VIRADA & DESCOBERTA',
        stage: 'discovery',
        objective: 'Apresentar o ponto de inflexão onde a parceria/método entrou em cena',
        narrativePurpose: 'Mudar a polaridade emocional de frustração para esperança lúcida',
        dialogue: 'Foi aí que conheci o trabalho da equipe. Eles não me prometeram mágica... me deram um método claro de execução.',
        action: 'O semblante relaxa, sorriso discreto de alívio e clareza. Mãos abertas indicando transparência.',
        visualIdea: 'A luz de recorte (Rim Light) realça os ombros, simbolizando clareza e separação do passado.',
        emotionalIntention: 'Alívio, clareza e autoridade moral.',
        durationSec: 10,
        shotType: 'Plano Médio com luz de recorte destacada',
        brollSuggestion: 'Take da equipe em ação, telas de processos ou ferramentas sendo utilizadas.',
        transition: 'Corte no movimento da mão',
      },
      {
        sceneNumber: 4,
        sceneName: 'CENA 04 — A PROVA REAL',
        stage: 'test',
        objective: 'Demonstrar os números, resultados tangíveis e a rotina transformada',
        narrativePurpose: 'Provar que a virada não foi sorte, foi consistência técnica',
        dialogue: 'Em menos de 30 dias, a diferença foi gritante. Não só no faturamento, mas na paz de espírito no dia a dia.',
        action: 'Olhar firme e sereno. Tom de voz mais cadenciado e seguro.',
        visualIdea: 'Plano mais aberto contextualizando o espaço de trabalho real, limpo e organizado.',
        emotionalIntention: 'Segurança absoluta e conquista.',
        durationSec: 10,
        shotType: 'Plano Médio Aberto (35mm)',
        brollSuggestion: 'Gráfico de resultados ou cliente atendendo outro cliente com satisfação.',
        transition: 'Corte seco',
      },
      {
        sceneNumber: 5,
        sceneName: 'CENA 05 — DESFECHO & CHAMADA SINCERA',
        stage: 'cta',
        objective: 'Convidar quem assiste a dar o mesmo passo, sem pressão artificial',
        narrativePurpose: 'Transformar a identificação em ação imediata',
        dialogue: 'Se você também está cansado de andar em círculos, pare de perder tempo. Dá uma olhada no link aqui embaixo.',
        action: 'Aponta sutilmente para baixo ou gesticula para frente, mantendo o olho no olho com o espectador.',
        visualIdea: 'Close expressivo com luz de olhos (Catchlight) viva e nítida.',
        emotionalIntention: 'Convite fraterno, direto e urgente.',
        durationSec: 7,
        shotType: 'Close Médio (50mm)',
        brollSuggestion: 'Card final minimalista com logo do cliente e chamada para o WhatsApp/Bio.',
        transition: 'Fade out elegante',
      },
    ];
  } else if (videoType === 'reels' || videoType === 'produto') {
    concept = 'Retenção máxima para Reels/TikTok: foco em quebra de expectativa imediata e demonstração cinematográfica de valor.';
    centralQuestion = 'Por que 90% das pessoas cometem esse erro sem perceber?';
    hook = '"Pare de fazer isso se você quiser ter resultado de verdade ainda este mês."';
    cta = '"Comente \'QUERO\' que eu te mando o passo a passo completo no direct."';

    scenes = [
      {
        sceneNumber: 1,
        sceneName: 'CENA 01 — QUEBRA DE PADRÃO',
        stage: 'hook',
        objective: 'Interromper o scroll nos primeiros 1.5 segundos',
        narrativePurpose: 'Gerar curiosidade irresistível com corte rápido e ação física',
        dialogue: 'Se você ainda acha que precisa gastar rios de dinheiro pra ter esse resultado... você tá olhando pro lugar errado.',
        action: 'Entrada rápida no quadro ou gesto afirmativo com a mão, olhar magnético diretamente na lente.',
        visualIdea: 'Enquadramento dinâmico 9:16, ângulo ligeiramente dramático com luz de recorte marcada.',
        emotionalIntention: 'Curiosidade intensa e choque de realidade.',
        durationSec: 4,
        shotType: 'Close Médio Rápido (35mm)',
        brollSuggestion: 'Corte de 0.8s mostrando o produto em detalhe extremo.',
        transition: 'Whip pan ou corte seco ultra dinâmico',
      },
      {
        sceneNumber: 2,
        sceneName: 'CENA 02 — O ERRO COMUM',
        stage: 'origin',
        objective: 'Nomear o vilão da história (o erro invisível)',
        narrativePurpose: 'Criar o "momento aham!" na cabeça da audiência',
        dialogue: 'A maioria tenta compensar volume com pressa. Mas o segredo nunca esteve na quantidade, esteve no alinhamento.',
        action: 'Balança a cabeça negativamente, demonstra o erro fisicamente com um objeto ou postura.',
        visualIdea: 'Câmera estática com profundidade rasa destacando a expressão analítica do apresentador.',
        emotionalIntention: 'Autoridade técnica e cumplicidade.',
        durationSec: 8,
        shotType: 'Plano Americano (35mm)',
        brollSuggestion: 'Exemplo do jeito errado vs jeito certo em split-screen.',
        transition: 'Zoom digital sutil',
      },
      {
        sceneNumber: 3,
        sceneName: 'CENA 03 — A DEMONSTRAÇÃO PRÁTICA',
        stage: 'discovery',
        objective: 'Mostrar o produto ou método em ação com qualidade cinematográfica',
        narrativePurpose: 'Satisfazer a curiosidade prometida no gancho',
        dialogue: 'Olha só o que acontece quando você aplica exatamente este ajuste simples bem aqui.',
        action: 'Manipula o produto ou mostra a tela/resultado com movimentos precisos e seguros.',
        visualIdea: 'Macro detalhe com luz lateral destacando textura e acabamento de alta qualidade.',
        emotionalIntention: 'Fascínio visual e tangibilidade.',
        durationSec: 9,
        shotType: 'Plano Detalhe / Macro (50mm)',
        brollSuggestion: 'B-Roll em 60fps com luz rasante destacando brilho e forma.',
        transition: 'Corte no ritmo da trilha',
      },
      {
        sceneNumber: 4,
        sceneName: 'CENA 04 — O CLÍMAX & CTA',
        stage: 'cta',
        objective: 'Converter visualização em leads ou engajamento orgânico',
        narrativePurpose: 'Direcionar a energia de satisfação para o próximo passo',
        dialogue: 'Eu preparei um guia detalhando cada etapa disso. Escreve "PRODUÇÃO" nos comentários que eu te envio agora.',
        action: 'Sorriso confiante, aponta para os comentários com energia alta e natural.',
        visualIdea: 'Plano Médio com catchlight nos olhos e contraste de estúdio profissional.',
        emotionalIntention: 'Entusiasmo, reciprocidade e ação.',
        durationSec: 6,
        shotType: 'Plano Médio (35mm)',
        brollSuggestion: 'Animação sutil de texto na tela com a palavra-chave.',
        transition: 'Corte final',
      },
    ];
  } else {
    // Institucional / Comercial Geral
    concept = `Narrativa institucional cinematográfica: propósito, capacidade técnica e impacto humano da ${clientName}.`;
    centralQuestion = 'O que sustenta a confiança de quem escolhe a excelência todos os dias?';
    hook = '"Existe uma diferença invisível entre quem apenas cumpre tabela e quem constrói legado."';
    cta = '"Conheça nosso ecossistema e descubra como elevar o seu padrão. Agende uma conversa com nossos especialistas."';

    scenes = [
      {
        sceneNumber: 1,
        sceneName: 'CENA 01 — O PROPÓSITO',
        stage: 'hook',
        objective: 'Estabelecer a identidade e o peso da marca sem arrogância',
        narrativePurpose: 'Conectar emocionalmente com a busca por excelência',
        dialogue: 'Existe uma diferença silenciosa entre quem apenas entrega o básico... e quem tem obsessão por cada milímetro.',
        action: 'Personagem caminha com calma pelo espaço, olhar focado no processo produtivo, interagindo com o ambiente.',
        visualIdea: 'Plano Aberto elegante com profundidade, luz natural entrando pelas janelas combinada com LED suave.',
        emotionalIntention: 'Serenidade, solidez e requinte.',
        durationSec: 6,
        shotType: 'Plano Médio Aberto (35mm)',
        brollSuggestion: 'Imagens de textura, arquitetura e pessoas trabalhando com precisão.',
        transition: 'Fade suave',
      },
      {
        sceneNumber: 2,
        sceneName: 'CENA 02 — A DEDICAÇÃO TÉCNICA',
        stage: 'origin',
        objective: 'Mostrar o bastidor rigoroso que fundamenta a entrega final',
        narrativePurpose: 'Provar autoridade através do cuidado artesanal ou tecnológico',
        dialogue: 'Aqui, cada detalhe passa por testes que a maioria nem imagina que existem. Porque quando você confia o seu projeto, a margem de erro é zero.',
        action: 'Pausa em frente à bancada ou mesa de reuniões, toca suavemente na matéria-prima ou na tela de controle.',
        visualIdea: 'Plano Médio a 45° com recorte nítido nos ombros, separando o personagem do fundo em 1,5m.',
        emotionalIntention: 'Rigor, integridade e confiança inegociável.',
        durationSec: 10,
        shotType: 'Plano Médio (50mm)',
        brollSuggestion: 'Close nos instrumentos de precisão, ferramentas ou equipe em alinhamento.',
        transition: 'Corte na ação',
      },
      {
        sceneNumber: 3,
        sceneName: 'CENA 03 — A EXPERIÊNCIA DO CLIENTE',
        stage: 'discovery',
        objective: 'Demonstrar o impacto humano e o alívio que o cliente sente',
        narrativePurpose: 'Levar a narrativa do racional para a transformação prática',
        dialogue: 'O que a gente entrega no final não é só um serviço. É a tranquilidade de saber que você tem ao seu lado quem realmente se importa.',
        action: 'Vira-se diretamente para a câmera, olhar acolhedor e seguro, tom de voz caloroso e firme.',
        visualIdea: 'Luz principal suave com softbox de 90cm gerando sombras aveludadas no rosto.',
        emotionalIntention: 'Parceria genuína, calor humano e acolhimento.',
        durationSec: 9,
        shotType: 'Plano Americano (35mm)',
        brollSuggestion: 'Aperto de mão sincero com cliente ou entrega do produto concluído.',
        transition: 'Corte seco elegante',
      },
      {
        sceneNumber: 4,
        sceneName: 'CENA 04 — CONVITE AO FUTURO',
        stage: 'cta',
        objective: 'Fechar com elegância institucional e abertura para novos negócios',
        narrativePurpose: 'Posicionar a marca como o próximo passo natural para o cliente',
        dialogue: 'O seu próximo nível começa com a escolha certa. Conheça a nossa estrutura.',
        action: 'Postura ereta e confiante, olhar seguro para a lente.',
        visualIdea: 'Plano Médio elegante com profundidade cinematográfica em camadas.',
        emotionalIntention: 'Visão de futuro e liderança de mercado.',
        durationSec: 6,
        shotType: 'Plano Médio (50mm)',
        brollSuggestion: 'Lettering sofisticado com marca e site oficial.',
        transition: 'Fade out preto suave',
      },
    ];
  }

  return {
    agent: 'script_creator',
    language: 'pt-BR',
    concept,
    central_question: centralQuestion,
    hook,
    narrative_strategy: `Estrutura narrativa em ${scenes.length} atos focada em retenção imediata, humanização das falas e filmabilidade física no ambiente real.`,
    retention_technique: 'Quebra de padrão inicial nos primeiros 3s + Progressão de tensão com recompensa visual em cada corte.',
    scenes,
    dialogue_overview: scenes.map((s) => `${s.sceneName}: "${s.dialogue}"`),
    cta,
    visual_notes: [
      'Priorizar linguagem visual direta: mostrar o processo antes de falar sobre ele.',
      'Diálogos com pontuação rítmica para permitir pausas naturais na fala do personagem.',
      'Todas as cenas respeitam o ambiente físico fotografado sem exigir cenários impossíveis.',
    ],
  };
}
