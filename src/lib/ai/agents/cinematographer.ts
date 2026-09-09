import { CinematographerOutput, SceneDirectorOutput, ScriptCreatorOutput, SharedProjectContext } from '../team-types';

/**
 * DIRETOR DE FOTOGRAFIA (Cinematographer)
 * Especialista visual:
 * - Câmera, enquadramento, altura e ângulo
 * - Lente (CONSCIÊNCIA OBRIGATÓRIA DO KIT REAL DO USUÁRIO)
 * - Iluminação física (Luz Principal a 45°, Contra-luz a 1,5m da parede, Preenchimento)
 * - Profundidade e separação de planos
 * - 100% em Português Brasileiro.
 */
export function runCinematographer(
  context: SharedProjectContext,
  script: ScriptCreatorOutput,
  scene: SceneDirectorOutput
): CinematographerOutput {
  const userLenses = context.lenses || [];
  const userLights = context.lighting || [];
  const userCameras = (context.equipment || []).filter((e) => e.category === 'camera');
  const mode = context.project.mode || 'recomendado';
  const videoType = context.video_type || 'institucional';
  const blockedZones = context.constraints.blockedZones || [];

  // 1. CÂMERA REAL DO USUÁRIO
  const activeCamera = userCameras[0] || {
    id: 'cam-def',
    brand: 'Câmera Mirrorless',
    model: 'Full Frame / APS-C',
    category: 'camera',
    specs: {},
  };

  // 2. LENTE REAL DO USUÁRIO (EQUIPMENT AWARENESS OBRIGATÓRIO)
  let chosenLens = userLenses[0];
  let focalLength = 35;
  let aperture = 'f/2.8';
  let lensSource: 'equipamento_proprio' | 'equipamento_opcional' = 'equipamento_proprio';
  let lensReason = '';

  if (userLenses.length > 0) {
    // Procurar a melhor lente para a cena dentro do que o usuário REALMENTE possui
    if (mode === 'criativo') {
      // Priorizar lente prime ou de abertura maior (ex: 50mm, 35mm, 85mm)
      const fastLens = userLenses.find(
        (l) => l.specs.focal_length?.includes('50') || l.specs.focal_length?.includes('35') || l.specs.aperture?.includes('1.')
      );
      if (fastLens) chosenLens = fastLens;
    } else {
      // Priorizar 35mm ou 24-70mm versátil
      const versatileLens = userLenses.find(
        (l) => l.specs.focal_length?.includes('35') || l.specs.focal_length?.includes('24-70')
      );
      if (versatileLens) chosenLens = versatileLens;
    }

    if (chosenLens) {
      if (chosenLens.specs.focal_length?.includes('35')) focalLength = 35;
      else if (chosenLens.specs.focal_length?.includes('50')) focalLength = 50;
      else if (chosenLens.specs.focal_length?.includes('85')) focalLength = 85;
      else if (chosenLens.specs.focal_length?.includes('24-70')) focalLength = 35; // zoom setado em 35mm

      aperture = chosenLens.specs.aperture || 'f/2.8';
      lensReason = `Lente do seu kit: ${chosenLens.brand} ${chosenLens.model}. Distância focal de ${focalLength}mm recomendada para enquadrar o ambiente mantendo proporções faciais perfeitas sem distorção periférica.`;
    }
  } else {
    // Caso o usuário ainda não tenha cadastrado lentes
    lensSource = 'equipamento_opcional';
    lensReason = 'Recomendação técnica base: Lente 35mm f/1.8 para preservar o contexto do cenário com desfoque de fundo cremoso.';
  }

  // 3. ILUMINAÇÃO REAL DO USUÁRIO
  const mainLight = userLights[0] || {
    brand: 'LED Contínuo',
    model: '100W com Softbox',
    category: 'lighting',
    specs: { power_watts: 100 },
  };

  const rimLightGear = userLights[1] || {
    brand: 'Luz de Recorte / Bastão LED',
    model: 'Luz Pontual de Fundo',
    category: 'lighting',
    specs: {},
  };

  // Verificar se o lado esquerdo da luz está bloqueado
  const isLeftBlocked = blockedZones.some((b) => b.id === 'key_light' || b.x < 40);
  const keyLightSide: 'left' | 'right' = isLeftBlocked ? 'right' : 'left';
  const keyLightAngle = 45;

  return {
    agent: 'cinematographer',
    language: 'pt-BR',
    camera: {
      model: `${activeCamera.brand} ${activeCamera.model}`,
      position: 'Frontal a 2,2 metros do personagem, perfeitamente alinhada na altura dos olhos.',
      distance_m: 2.2,
      height_m: 1.45,
      angle_deg: 0,
      movement: 'Estática em tripé firme para falas principais; push-in motorizado suave de 5% no momento do clímax.',
      settings: {
        shutter: '1/50s (Regra dos 180° para movimento cinematográfico fluido)',
        fps: 24,
        aperture: aperture,
        iso: 'ISO 640/800 (ISO base nativo do sensor para máximo alcance dinâmico)',
      },
    },
    lens: {
      model: chosenLens ? `${chosenLens.brand} ${chosenLens.model}` : 'Lente 35mm Prime',
      focal_length_mm: focalLength,
      source: lensSource,
      choice_reason: lensReason,
    },
    framing: {
      shot_type: videoType === 'reels' ? 'Plano Médio 9:16 (Cintura para cima)' : 'Plano Médio Cinematográfico (Peito para cima)',
      composition_rules: 'Regra dos terços com olhos no terço superior. 2 dedos de respiro de teto (headroom) para evitar sufocar o enquadramento.',
      headroom_note: 'Headroom calibrado: 10% a 12% da altura total do quadro.',
    },
    lighting: {
      key_light: {
        equipment_used: `${mainLight.brand} ${mainLight.model}`,
        angle_deg: keyLightAngle,
        side: keyLightSide,
        height: '1,85m do piso (ligeiramente inclinada a 30° para baixo em direção aos olhos)',
        modifier: 'Softbox parabólico de 90cm com difusor duplo para transição suave de penumbra',
        color_temp: '5600K',
        distance_to_wall_m: 1.5,
      },
      fill_light: {
        method: 'Rebatedor 5 em 1 branco no lado oposto ou preenchimento passivo da parede clara.',
        intensity: 'Razão de contraste 3:1 (lado da sombra retém 33% da luminosidade da luz principal).',
      },
      rim_light: {
        equipment_used: `${rimLightGear.brand} ${rimLightGear.model}`,
        position: 'Atrás do personagem a 135°, a 1,5m de distância da parede de fundo, desenhando o contorno dos ombros e cabelo.',
        distance_to_wall_m: 1.5,
      },
    },
    depth: {
      subject_background_distance_m: 1.5,
      separation_strategy: 'Profundidade real em camadas: Primeiro Plano (personagem nítido) + Plano Médio (espaço livre de 1,5m) + Fundo (parede com textura iluminada suavemente).',
    },
    composition: {
      aspect_ratio: context.format || '16:9',
      focal_plane: 'Ponto focal cravado nos olhos do apresentador com detecção de fase contínua.',
      atmosphere: 'Cinematográfica, limpa, com contraste controlado e tons de pele protegidos de superexposição.',
    },
    visual_style: `Estilo ${context.style.toUpperCase()}: valorização da arquitetura do local real com realce dos volumes faciais.`,
    optional_equipment_recommendations: userLights.length < 2 ? ['Bastão LED RGB portátil para reforçar a contra-luz de recorte'] : undefined,
  };
}
