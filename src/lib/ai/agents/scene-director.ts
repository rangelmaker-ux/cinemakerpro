import { SceneDirectorOutput, ScriptCreatorOutput, SharedProjectContext } from '../team-types';

/**
 * DIRETOR DE CENA (SceneDirector)
 * Controla o que acontece dentro da cena física:
 * - Pessoas, atores, apresentador
 * - Posicionamento do sujeito no espaço (a 1,5m da parede para profundidade)
 * - Orientação corporal (15° a 25° virado para a Luz Principal)
 * - Linha de olhar (eyeline)
 * - Movimento, bloqueio e atuação orgânica
 * - 100% em Português Brasileiro.
 */
export function runSceneDirector(
  context: SharedProjectContext,
  script: ScriptCreatorOutput
): SceneDirectorOutput {
  const videoType = context.video_type || 'institucional';
  const mode = context.project.mode || 'recomendado';
  const blockedZones = context.constraints.blockedZones || [];

  // Posição espacial calculada com respeito à profundidade física (1,5m de recuo da parede de fundo)
  let spatialXPct = 50;
  let spatialYPct = 42;
  let bodyAngle = 'Corpo angulado a 20° em direção à Luz Principal (Key Light) para esculpir o rosto com sombras suaves.';
  let eyeline = 'Linha dos olhos 5° ao lado da lente da câmera (em direção ao entrevistador imaginário), transmitindo empatia sem parecer comercial frio.';

  if (videoType === 'reels' || videoType === 'produto') {
    spatialXPct = 50;
    spatialYPct = 45;
    bodyAngle = 'Corpo frontal com leve rotação de ombros a 10°, peso do corpo apoiado na perna direita.';
    eyeline = 'Olhar 100% direto na lente da câmera. Contato visual firme e envolvente desde o primeiro segundo.';
  } else if (videoType === 'depoimento') {
    spatialXPct = 46; // Levemente descentralizado para a esquerda
    spatialYPct = 40;
    bodyAngle = 'Corpo relaxado virado a 25° para o lado da luz suave, evitando postura engessada de estúdio.';
    eyeline = 'Olhar voltado para o diretor de cena ao lado da câmera, mantendo o nível dos olhos alinhado à altura da lente.';
  }

  // Se a posição padrão estiver bloqueada por obstáculo no espaço real
  const isSubjectBlocked = blockedZones.some(
    (b) => b.id === 'subject' || (Math.abs(b.x - spatialXPct) < 15 && Math.abs(b.y - spatialYPct) < 15)
  );

  if (isSubjectBlocked) {
    spatialXPct = 56;
    spatialYPct = 44;
  }

  const movementNotes =
    videoType === 'reels'
      ? {
          start_action: 'Inicia com postura dinâmica, mãos na altura do peito prontas para enfatizar o gancho.',
          motion_flow: 'Dá um passo sutil de 20cm em direção à câmera na transição do gancho para o dilema.',
          timing_seconds: 4,
        }
      : {
          start_action: 'Inicia sentado ou em pé natural, apoiado confortavelmente no ambiente.',
          motion_flow: 'Movimentação contida: apenas gestos de mãos e leve inclinação de cabeça nos momentos de clímax.',
          timing_seconds: 8,
        };

  return {
    agent: 'scene_director',
    language: 'pt-BR',
    subject_position: {
      description: 'Posicionado a exatamente 1,5 metros de distância da parede de fundo. Isso garante separação física do cenário e evita que a sombra da luz principal caia dura sobre o fundo.',
      spatial_x_pct: spatialXPct,
      spatial_y_pct: spatialYPct,
      distance_from_background_m: 1.5,
    },
    body_orientation: bodyAngle,
    eye_line: eyeline,
    movement: movementNotes,
    blocking: 'Área livre de 2 metros ao redor do apresentador para permitir gesticulação livre e passagem de luz de recorte.',
    interaction: 'Interação direta com as mãos abertas e postura de acolhimento. Evitar cruzar os braços ou segurar objetos que tirem a atenção.',
    performance_notes: [
      'Pausas de respiração intencionais entre as frases para facilitar o corte na pós-produção.',
      'Sorriso natural apenas nos pontos de virada e CTA; manter seriedade confortável durante a exposição do dilema.',
      'Gesticulação contida no terço médio do corpo, nunca cobrindo o rosto ou o microfone lapela.',
    ],
  };
}
