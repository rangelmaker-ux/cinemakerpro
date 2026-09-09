import { ScriptCreatorOutput, ScriptScene, SharedProjectContext } from '../team-types';

/**
 * CRIADOR DE ROTEIRO (ScriptCreator)
 * Não é um chatbot genérico. Não usa "Você sabia que...".
 * Metodologia: História contínua em 5 atos (Causa e Efeito estrita).
 * 100% em Português Brasileiro natural, conversacional e humano.
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
        durationSec: 6,
        shotType: 'Plano Americano / Médio Fechado (50mm)',
        brollSuggestion: 'Imagens de arquivo da rotina real de trabalho ou detalhes do ambiente.',
        transition: 'Dissolução rápida de 0.2s',
      },
      {
        sceneNumber: 3,
        sceneName: 'CENA 03 — A VIRADA & DESCOBERTA',
        stage: 'discovery',
        objective: 'Apresentar o ponto de inflexão onde o método entrou em cena',
        narrativePurpose: 'Mudar a polaridade emocional de frustração para esperança lúcida',
        dialogue: 'Foi aí que conheci o trabalho da equipe. Eles não me prometeram mágica: me deram um método claro de execução passo a passo.',
        action: 'O semblante relaxa, sorriso discreto de alívio e clareza. Mãos abertas indicando transparência.',
        visualIdea: 'A luz de recorte (Rim Light) realça os ombros, simbolizando clareza e separação do passado.',
        emotionalIntention: 'Alívio, clareza e autoridade moral.',
        durationSec: 7,
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
        durationSec: 6,
        shotType: 'Plano Médio Aberto (35mm)',
        brollSuggestion: 'Gráfico de resultados ou cliente atendendo outro cliente com satisfação.',
        transition: 'Corte seco',
      },
      {
        sceneNumber: 5,
        sceneName: 'CENA 05 — DESFECHO & CHAMADA SINCERA',
        stage: 'cta',
        objective: 'Convidar quem assiste a dar o mesmo passo, sem pressão artificial',
        narrativePurpose: 'Transformar a identificação em ação imediata que fecha o arco da Cena 1',
        dialogue: 'Se você também está cansado de andar em círculos, pare de perder tempo. Clica no link da bio e vamos conversar sobre o seu caso.',
        action: 'Aponta sutilmente para baixo ou gesticula para frente, mantendo o olho no olho com o espectador.',
        visualIdea: 'Close expressivo com luz de olhos (Catchlight) viva e nítida.',
        emotionalIntention: 'Convite fraterno, direto e urgente.',
        durationSec: 6,
        shotType: 'Close Médio (50mm)',
        brollSuggestion: 'Card final minimalista com logo do cliente e chamada para o WhatsApp/Bio.',
        transition: 'Fade out elegante',
      },
    ];
  } else if (videoType === 'reels' || videoType === 'produto') {
    concept = 'Retenção máxima vertical: quebra de expectativa imediata e demonstração cinematográfica de valor contínuo.';
    centralQuestion = 'Por que a maioria erra ao tentar resolver isso por esforço bruto em vez de método?';
    hook = '"Se você ainda acha que precisa gastar rios de dinheiro para ter esse resultado, você está olhando para o lugar errado."';
    cta = '"Se você quer aplicar essa técnica no seu projeto, digita \'PRODUÇÃO\' nos comentários que eu te envio o passo a passo."';

    scenes = [
      {
        sceneNumber: 1,
        sceneName: 'CENA 01 — QUEBRA DE PADRÃO',
        stage: 'hook',
        objective: 'Interromper o scroll nos primeiros segundos com uma quebra de expectativa direta',
        narrativePurpose: 'Abertura provocativa que conecta curiosidade e alívio financeiro',
        dialogue: 'Se você ainda acha que precisa gastar rios de dinheiro para ter esse resultado, você está olhando para o lugar errado.',
        action: 'Entrada rápida no quadro com olhar magnético diretamente na lente e postura segura.',
        visualIdea: 'Enquadramento dinâmico 9:16 com iluminação suave a 45° e fundo descolado em 1,5m.',
        emotionalIntention: 'Curiosidade intensa e choque de realidade.',
        durationSec: 5,
        shotType: 'Plano Médio Rápido (35mm)',
        transition: 'Corte dinâmico',
      },
      {
        sceneNumber: 2,
        sceneName: 'CENA 02 — O ERRO DO VOLUME',
        stage: 'development',
        objective: 'Expor a tentativa ineficiente de compensar falta de alinhamento com pressa',
        narrativePurpose: 'Desenvolvimento causal do dilema que o espectador vive',
        dialogue: 'A maioria tenta compensar falta de alinhamento com pressa e volume de tentativas sem critério.',
        action: 'Balança a cabeça negativamente de forma compreensiva, demonstrando o erro fisicamente.',
        visualIdea: 'Plano Americano com profundidade cinematográfica limpa.',
        emotionalIntention: 'Cumplicidade e autoridade técnica.',
        durationSec: 6,
        shotType: 'Plano Americano (35mm)',
        transition: 'Corte no gesto',
      },
      {
        sceneNumber: 3,
        sceneName: 'CENA 03 — O AJUSTE PRÁTICO',
        stage: 'discovery',
        objective: 'Apresentar a alavanca técnica essencial',
        narrativePurpose: 'Ponto de virada da narrativa: a mudança simples que destrava o resultado',
        dialogue: 'Só que o segredo prático é esse microajuste aqui: quando você trava a execução nesse ponto, a entrega muda na hora.',
        action: 'Manipula o elemento de demonstração com precisão e clareza milimétrica.',
        visualIdea: 'Macro detalhe com luz lateral suave destacando textura e foco seletivo.',
        emotionalIntention: 'Fascínio visual e iluminação prática.',
        durationSec: 7,
        shotType: 'Plano Detalhe / Macro (50mm)',
        transition: 'Corte seco',
      },
      {
        sceneNumber: 4,
        sceneName: 'CENA 04 — A CONSEQUÊNCIA DIRETA',
        stage: 'consequence',
        objective: 'Mostrar o benefício da velocidade e consistência sem retrabalho',
        narrativePurpose: 'Consequência tangível de aplicar a solução',
        dialogue: 'O resultado fica limpo, você ganha velocidade e não precisa refazer o trabalho três vezes.',
        action: 'Sorriso confiante e postura relaxada, demonstrando domínio absoluto.',
        visualIdea: 'Plano Médio com catchlight nos olhos e contraste de estúdio.',
        emotionalIntention: 'Segurança e alívio de esforço.',
        durationSec: 6,
        shotType: 'Plano Médio (35mm)',
        transition: 'Corte no olhar',
      },
      {
        sceneNumber: 5,
        sceneName: 'CENA 05 — A CONVOCAÇÃO CLARA',
        stage: 'cta',
        objective: 'Conduzir para a interação direta e entrega do guia',
        narrativePurpose: 'Fechamento do arco narrativo que responde à promessa inicial',
        dialogue: 'Se você quer aplicar essa técnica no seu projeto, digita "PRODUÇÃO" nos comentários que eu te envio o passo a passo.',
        action: 'Aponta com naturalidade para os comentários, mantendo energia alta e acolhedora.',
        visualIdea: 'Plano Médio vertical caloroso com iluminação elegante.',
        emotionalIntention: 'Entusiasmo e decisão de engajar.',
        durationSec: 6,
        shotType: 'Plano Médio (35mm)',
        transition: 'Fade out elegante',
      },
    ];
  } else {
    // Institucional / Comercial Geral
    concept = `Narrativa institucional cinematográfica: propósito, capacidade técnica e impacto humano da ${clientName}.`;
    centralQuestion = 'O que sustenta a confiança de quem escolhe a excelência todos os dias?';
    hook = '"Existe uma diferença silenciosa entre quem apenas cumpre tabela e quem tem obsessão por cada milímetro da entrega."';
    cta = '"O seu próximo nível começa com a escolha de quem valoriza o seu padrão. Clica no link da bio e venha conversar com a nossa equipe."';

    scenes = [
      {
        sceneNumber: 1,
        sceneName: 'CENA 01 — O PROPÓSITO SILENCIOSO',
        stage: 'hook',
        objective: 'Estabelecer a identidade e o padrão da marca sem arrogância',
        narrativePurpose: 'Abertura que conecta com quem busca excelência real',
        dialogue: 'Existe uma diferença silenciosa entre quem apenas cumpre tabela e quem tem obsessão por cada milímetro da entrega.',
        action: 'Personagem caminha com calma pelo espaço, olhar focado no processo, interagindo com o ambiente.',
        visualIdea: 'Plano Aberto elegante com profundidade, luz suave modelando os planos do espaço.',
        emotionalIntention: 'Serenidade, solidez e distinção.',
        durationSec: 5,
        shotType: 'Plano Médio Aberto (35mm)',
        transition: 'Fade suave',
      },
      {
        sceneNumber: 2,
        sceneName: 'CENA 02 — O BASTIDOR METÓDICO',
        stage: 'development',
        objective: 'Explicar que a excelência não é fruto do acaso',
        narrativePurpose: 'Desenvolvimento causal: consistência diária de processos',
        dialogue: 'No nosso dia a dia, a entrega final nunca é um golpe de sorte: é o reflexo de processos que a maioria nem imagina que existem.',
        action: 'Pausa em frente à bancada ou mesa de reuniões, observando o alinhamento com serenidade.',
        visualIdea: 'Plano Médio a 45° com recorte nítido nos ombros, separando o personagem do fundo em 1,5m.',
        emotionalIntention: 'Rigor e integridade técnica.',
        durationSec: 6,
        shotType: 'Plano Médio (50mm)',
        transition: 'Corte na ação',
      },
      {
        sceneNumber: 3,
        sceneName: 'CENA 03 — A MARGEM ZERO',
        stage: 'discovery',
        objective: 'Mostrar o rigor de validação que protege o cliente',
        narrativePurpose: 'Ponto de virada institucional: a garantia inegociável de padrão',
        dialogue: 'Cada etapa passa por testes reais de validação, porque quando um cliente confia o projeto dele a nós, a margem de erro precisa ser zero.',
        action: 'Vira-se diretamente para a câmera, olhar seguro e firme, tom de voz calmo e convictor.',
        visualIdea: 'Close Médio com iluminação de recorte e profundidade de campo cinematográfica.',
        emotionalIntention: 'Confiança inegociável e segurança moral.',
        durationSec: 7,
        shotType: 'Close Médio (50mm)',
        transition: 'Corte no olhar',
      },
      {
        sceneNumber: 4,
        sceneName: 'CENA 04 — A TRANQUILIDADE DO CLIENTE',
        stage: 'consequence',
        objective: 'Descrever o valor humano além da entrega puramente técnica',
        narrativePurpose: 'Consequência prática da parceria',
        dialogue: 'O que a gente entrega no final não é apenas um serviço técnico: é a tranquilidade de ter ao seu lado parceiros que cuidam do seu negócio.',
        action: 'Expressão acolhedora e calorosa, mãos abertas em postura receptiva.',
        visualIdea: 'Plano Americano elegante com luz principal suave e ambiente sofisticado ao fundo.',
        emotionalIntention: 'Acolhimento, respeito e cumplicidade.',
        durationSec: 6,
        shotType: 'Plano Americano (35mm)',
        transition: 'Corte seco',
      },
      {
        sceneNumber: 5,
        sceneName: 'CENA 05 — O CONVITE AO PADRÃO',
        stage: 'cta',
        objective: 'Fechar com convite ao diálogo estratégico de alto padrão',
        narrativePurpose: 'Fechamento que encerra a reflexão da Cena 1',
        dialogue: 'O seu próximo nível começa com a escolha de quem valoriza o seu padrão. Clica no link da bio e venha conversar com a nossa equipe.',
        action: 'Postura ereta e confiante, estendendo um convite cordial para o espectador.',
        visualIdea: 'Plano Médio equilibrado com profundidade cinematográfica em camadas.',
        emotionalIntention: 'Visão de futuro e tomada de decisão segura.',
        durationSec: 6,
        shotType: 'Plano Médio (50mm)',
        transition: 'Fade out elegante',
      },
    ];
  }

  return {
    agent: 'script_creator',
    language: 'pt-BR',
    concept,
    central_question: centralQuestion,
    hook,
    narrative_strategy: `Narrativa contínua em ${scenes.length} atos com progressão causal: Pergunta inicial -> Dilema -> Virada técnica -> Consequência na rotina -> Fechamento com recomendação natural.`,
    retention_technique: 'Continuidade de pensamento estrita entre cenas, sem frases motivacionais soltas, bloqueio a 1,5m da parede e contato visual firme.',
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
