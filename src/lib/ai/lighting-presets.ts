import { CustomLightingSetup, Light3DItem, Camera3DItem, Subject3DItem, Audio3DItem, StudioRoom3D } from './lighting-3d-types';
import { SharedProjectContext } from './team-types';

/**
 * BIBLIOTECA EDUCATIVA DE PRESETS COMERCIAIS & CINEMATOGRÁFICOS (Seções 8, 9 & 10 do Master Prompt)
 * Explica o propósito, quando usar, tipo de sujeito e resultado visual gerado.
 */
export const EDUCATIONAL_LIGHTING_PRESETS: CustomLightingSetup[] = [
  // ─── 1. ENTREVISTA ───
  {
    id: 'preset-entrevista-cinema',
    name: 'Entrevista Cinematográfica',
    category: 'Entrevista',
    description: 'Iluminação clássica com razão de contraste 3:1 e luz de recorte para separação limpa do fundo.',
    purpose: 'Criar tridimensionalidade e separar o personagem do cenário com elegância e seriedade.',
    whenToUse: 'Entrevistas documentais, vídeos institucionais premium e depoimentos de alta credibilidade.',
    targetSubject: 'Executivos, fundadores, especialistas e pessoas contando histórias reais.',
    visualResult: 'Rosto esculpido com sombra suave e aveludada no lado oposto e contorno brilhante nos ombros.',
    requiredEquipment: ['Luz Principal (Key Light) com Softbox', 'Luz de Recorte (Rim Light)', 'Microfone Lapela'],
    studio: { widthM: 4.5, depthM: 5.0, heightM: 2.8, wallColor: '#161922', floorColor: '#0f1117' },
    subject: {
      name: 'Entrevistado',
      distanceFromWallM: 1.5,
      bodyOrientation: 'Corpo angulado a 20° em direção à Luz Principal',
      eyeline: 'Linha dos olhos voltada 5° ao lado da lente da câmera',
      position: { x: 0, y: 0, z: 1.45 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.3,
      heightM: 1.45,
      angleDeg: 0,
      focalLengthMm: 35,
      aperture: 'f/2.8',
      framing: 'Plano Médio',
      shotType: 'Plano Médio (35mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Sem Fio',
      positionLabel: 'No osso esterno a 15cm da boca',
      distanceFromMouthCm: 15,
    },
    lights: [
      {
        id: 'light-key-1',
        name: 'Luz Principal (Key Light)',
        type: 'key',
        position: { x: 1.3, y: 1.3, z: 1.85 },
        angleDeg: 45,
        distanceM: 1.8,
        heightM: 1.85,
        intensityPct: 85,
        colorTemp: '5600K',
        modifier: 'softbox',
        equipmentModel: 'LED 100W + Softbox 90cm',
        purposeDescription: 'Ilumina o lado dominante do rosto criando catchlight vivo nos olhos.',
      },
      {
        id: 'light-rim-1',
        name: 'Contra-luz / Recorte (Rim Light)',
        type: 'rim',
        position: { x: -1.1, y: -0.9, z: 1.75 },
        angleDeg: 135,
        distanceM: 1.5,
        heightM: 1.75,
        intensityPct: 55,
        colorTemp: '5600K',
        modifier: 'refletor',
        equipmentModel: 'Bastão LED / Refletor Direcional',
        purposeDescription: 'Desenha os ombros e cabelo, descolando o personagem do fundo escuro.',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },
  {
    id: 'preset-entrevista-clean',
    name: 'Entrevista Corporativa Clean',
    category: 'Entrevista',
    description: 'Iluminação equilibrada e aberta, sem sombras dramáticas, transmitindo transparência e clareza.',
    purpose: 'Garantir nitidez absoluta e leitura visual rápida de mensagens institucionais.',
    whenToUse: 'Comunicados oficiais, treinamentos empresariais e apresentações de resultados.',
    targetSubject: 'Diretores corporativos, apresentadores institucionais e porta-vozes.',
    visualResult: 'Luz uniforme e acolhedora com sombras mínimas e pele suavizada.',
    requiredEquipment: ['Luz Principal Suave', 'Luz de Preenchimento (Fill Light)', 'Lapela'],
    studio: { widthM: 4.5, depthM: 5.0, heightM: 2.8, wallColor: '#202430', floorColor: '#12141a' },
    subject: {
      name: 'Porta-Voz',
      distanceFromWallM: 1.6,
      bodyOrientation: 'Frontal com leve postura de ombros a 10°',
      eyeline: 'Olhar direto na lente da câmera',
      position: { x: 0, y: 0, z: 1.5 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.4,
      heightM: 1.5,
      angleDeg: 0,
      focalLengthMm: 35,
      aperture: 'f/4.0',
      framing: 'Plano Médio Aberto',
      shotType: 'Plano Médio Aberto (35mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Sem Fio',
      positionLabel: 'Discreto na lapela a 15cm da boca',
      distanceFromMouthCm: 15,
    },
    lights: [
      {
        id: 'light-clean-key',
        name: 'Luz Principal Suave',
        type: 'key',
        position: { x: 1.2, y: 1.4, z: 1.8 },
        angleDeg: 40,
        distanceM: 1.8,
        heightM: 1.8,
        intensityPct: 80,
        colorTemp: '5600K',
        modifier: 'softbox',
        equipmentModel: 'LED 100W + Difusor Duplo',
        purposeDescription: 'Iluminação difusa principal sem queimar altas luzes.',
      },
      {
        id: 'light-clean-fill',
        name: 'Luz de Preenchimento (Fill Light)',
        type: 'fill',
        position: { x: -1.3, y: 1.4, z: 1.6 },
        angleDeg: 320,
        distanceM: 1.9,
        heightM: 1.6,
        intensityPct: 40,
        colorTemp: '5600K',
        modifier: 'softbox',
        equipmentModel: 'Rebatedor / Painel LED Suave',
        purposeDescription: 'Preenche suavemente as sombras do lado oposto mantendo a textura natural.',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },
  {
    id: 'preset-entrevista-lowkey',
    name: 'Entrevista Low-Key Dramática',
    category: 'Entrevista',
    description: 'Alto contraste com fundo mergulhado na penumbra e luz direcional lateral.',
    purpose: 'Gerar mistério, intimismo profundo e gravidade emocional.',
    whenToUse: 'Narrativas de superação, revelações exclusivas ou documentários investigativos.',
    targetSubject: 'Personagens com histórias intensas ou relatos marcantes.',
    visualResult: 'Contraste agressivo 4:1 com metade do rosto na penumbra e recorte metálico.',
    requiredEquipment: ['Luz com Colmeia / Grid', 'Luz de Recorte Pontual'],
    studio: { widthM: 4.0, depthM: 5.0, heightM: 2.8, wallColor: '#0a0c10', floorColor: '#050608' },
    subject: {
      name: 'Personagem',
      distanceFromWallM: 2.0,
      bodyOrientation: 'Virado a 35° para a lateral escura',
      eyeline: 'Olhar perdido no horizonte ou no entrevistador',
      position: { x: 0, y: 0, z: 1.4 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.2,
      heightM: 1.4,
      angleDeg: 0,
      focalLengthMm: 50,
      aperture: 'f/1.8',
      framing: 'Close-up Médio',
      shotType: 'Close-up Médio (50mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Escondido',
      positionLabel: 'Interno sob a gola',
      distanceFromMouthCm: 14,
    },
    lights: [
      {
        id: 'light-lowkey-key',
        name: 'Key Direcional Estreito (Grid)',
        type: 'key',
        position: { x: 1.5, y: 0.8, z: 1.7 },
        angleDeg: 65,
        distanceM: 1.7,
        heightM: 1.7,
        intensityPct: 90,
        colorTemp: '4300K',
        modifier: 'colmeia',
        equipmentModel: 'LED com Softbox e Colmeia',
        purposeDescription: 'Luz pontual que incide apenas no rosto sem vazar nas paredes de fundo.',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },

  // ─── 2. RETRATO ───
  {
    id: 'preset-retrato-rembrandt',
    name: 'Iluminação Rembrandt',
    category: 'Retrato',
    description: 'O padrão dourado das artes visuais: cria o triângulo característico de luz sob o olho do lado sombreado.',
    purpose: 'Conferir sofisticação pictórica, maturidade estética e peso visual.',
    whenToUse: 'Retratos editoriais, apresentações executivas premium e perfis de autoridade.',
    targetSubject: 'Profissionaisliberais, artistas, líderes e pensadores.',
    visualResult: 'Triângulo luminoso sob o olho oposto à luz principal, conferindo profundidade escultural.',
    requiredEquipment: ['Luz Principal a 45° elevada', 'Luz de Cabelo / Recorte'],
    studio: { widthM: 4.0, depthM: 4.5, heightM: 2.8, wallColor: '#1a1816', floorColor: '#0e0c0b' },
    subject: {
      name: 'Modelo / Especialista',
      distanceFromWallM: 1.5,
      bodyOrientation: 'Corpo a 30° com cabeça girada para a câmera',
      eyeline: 'Olhar penetrante na lente',
      position: { x: 0, y: 0, z: 1.5 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.2,
      heightM: 1.5,
      angleDeg: 0,
      focalLengthMm: 50,
      aperture: 'f/2.0',
      framing: 'Primeiro Plano (Retrato)',
      shotType: 'Plano Médio Fechado (50mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Sem Fio',
      positionLabel: 'Discreto no peito',
      distanceFromMouthCm: 15,
    },
    lights: [
      {
        id: 'light-rembrandt-key',
        name: 'Key Light Rembrandt 45°',
        type: 'key',
        position: { x: 1.2, y: 1.2, z: 2.0 },
        angleDeg: 45,
        distanceM: 1.7,
        heightM: 2.0,
        intensityPct: 85,
        colorTemp: '4300K',
        modifier: 'softbox',
        equipmentModel: 'LED 100W a 45° acima da linha dos olhos',
        purposeDescription: 'Posicionado alto a 45° para projetar a sombra do nariz conectando à bochecha.',
      },
      {
        id: 'light-rembrandt-rim',
        name: 'Contra-luz Sutil',
        type: 'rim',
        position: { x: -1.2, y: -1.0, z: 1.8 },
        angleDeg: 140,
        distanceM: 1.6,
        heightM: 1.8,
        intensityPct: 40,
        colorTemp: '5600K',
        modifier: 'refletor',
        equipmentModel: 'LED Difuso Traseiro',
        purposeDescription: 'Delineia a curvatura dos ombros evitando que o preto da roupa se funda ao fundo.',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },
  {
    id: 'preset-retrato-butterfly',
    name: 'Butterfly / Beauty Lighting',
    category: 'Retrato',
    description: 'Luz frontal superior alinhada ao nariz, gerando uma suave sombra de borboleta sob as narinas.',
    purpose: 'Acentuar maçãs do rosto, delinear a mandíbula e suavizar imperfeições da pele.',
    whenToUse: 'Comerciais de estética, moda, maquiagem e retratos de beleza.',
    targetSubject: 'Apresentadoras, modelos, esteticistas e influenciadores de beleza.',
    visualResult: 'Rosto simétrico, queixo desenhado e brilho duplo elegante nos olhos (catchlight perfeito).',
    requiredEquipment: ['Luz Frontal Alta', 'Rebatedor Inferior de Queixo'],
    studio: { widthM: 4.0, depthM: 4.5, heightM: 2.8, wallColor: '#28242c', floorColor: '#120f16' },
    subject: {
      name: 'Apresentadora',
      distanceFromWallM: 1.5,
      bodyOrientation: 'Frontal absoluta com queixo levemente erguido',
      eyeline: 'Olhar magnético na câmera',
      position: { x: 0, y: 0, z: 1.5 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.0,
      heightM: 1.5,
      angleDeg: 0,
      focalLengthMm: 50,
      aperture: 'f/2.8',
      framing: 'Plano Médio Fechado',
      shotType: 'Plano Médio Fechado (50mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Sem Fio',
      positionLabel: 'Na gola a 15cm',
      distanceFromMouthCm: 15,
    },
    lights: [
      {
        id: 'light-butterfly-key',
        name: 'Luz Butterfly Superior',
        type: 'key',
        position: { x: 0, y: 1.4, z: 2.1 },
        angleDeg: 0,
        distanceM: 1.4,
        heightM: 2.1,
        intensityPct: 85,
        colorTemp: '5600K',
        modifier: 'softbox',
        equipmentModel: 'Octabox / Softbox Frontal Superior',
        purposeDescription: 'Cria sombra sutil em formato de asas de borboleta logo abaixo do nariz.',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },

  // ─── 3. SOCIAL MEDIA ───
  {
    id: 'preset-social-barbearia',
    name: 'Barbearia Moody / Creator',
    category: 'Social Media',
    description: 'Key a 45° destacando o visual masculino e bastão de LED com cor de fundo no ambiente.',
    purpose: 'Transmitir modernidade, ambiente de barbearia autêntica e estilo sem parecer comercial falso.',
    whenToUse: 'Reels, TikToks e Shorts de barbearias, cafés artesanais e estúdios criativos.',
    targetSubject: 'Barbeiros, tatuadores, baristas e criadores de conteúdo com identidade visual forte.',
    visualResult: 'Traços masculinos modelados com sombra marcante e fundo contrastado com toque de cor.',
    requiredEquipment: ['Luz Principal com Softbox', 'Bastão LED RGB de Fundo', 'Lapela Wireless'],
    studio: { widthM: 4.0, depthM: 5.0, heightM: 2.8, wallColor: '#12141a', floorColor: '#0a0b0e' },
    subject: {
      name: 'Barbeiro',
      distanceFromWallM: 1.5,
      bodyOrientation: 'Corpo a 15° para a luz, segurando ferramenta de trabalho',
      eyeline: 'Olhar direto e descontraído na câmera',
      position: { x: 0, y: 0, z: 1.45 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.1,
      heightM: 1.45,
      angleDeg: 0,
      focalLengthMm: 35,
      aperture: 'f/2.0',
      framing: 'Plano Médio 9:16',
      shotType: 'Plano Médio Vertical (35mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Wireless',
      positionLabel: 'No colarinho da camiseta a 15cm da boca',
      distanceFromMouthCm: 15,
    },
    lights: [
      {
        id: 'light-barber-key',
        name: 'Key Light 45° Suave',
        type: 'key',
        position: { x: 1.2, y: 1.3, z: 1.85 },
        angleDeg: 45,
        distanceM: 1.7,
        heightM: 1.85,
        intensityPct: 80,
        colorTemp: '4300K',
        modifier: 'softbox',
        equipmentModel: 'LED 100W + Softbox',
        purposeDescription: 'Modela o rosto valorizando o corte de cabelo e o alinhamento da barba.',
      },
      {
        id: 'light-barber-rgb',
        name: 'Tubo RGB de Fundo (Ciano/Âmbar)',
        type: 'rgb_tube',
        position: { x: -1.4, y: -1.2, z: 1.2 },
        angleDeg: 150,
        distanceM: 1.8,
        heightM: 1.2,
        intensityPct: 60,
        colorTemp: 'rgb',
        rgbColor: '#06b6d4',
        modifier: 'tubo_difuso',
        equipmentModel: 'Bastão LED RGB',
        purposeDescription: 'Colore o fundo da barbearia criando profundidade e ar contemporâneo.',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },
  {
    id: 'preset-social-1luz',
    name: 'Setup Rápido (Apenas 1 Luz)',
    category: 'Social Media',
    description: 'Configuração ultra prática para videomakers solo com apenas 1 tripé de iluminação no set.',
    purpose: 'Obter o máximo de impacto cinematográfico com o mínimo de peso e tempo de montagem.',
    whenToUse: 'Gravações rápidas em clientes externos, quartos, consultórios ou quando não há espaço.',
    targetSubject: 'Qualquer apresentador que precise gravar com agilidade e qualidade técnica.',
    visualResult: 'Luz principal suave que ilumina o rosto e aproveita o recuo de 1,5m para evitar sombras duras na parede.',
    requiredEquipment: ['1 LED Contínuo com Softbox Grande', 'Lapela Wireless'],
    studio: { widthM: 3.5, depthM: 4.0, heightM: 2.6, wallColor: '#1a1c24', floorColor: '#0f1015' },
    subject: {
      name: 'Apresentador',
      distanceFromWallM: 1.5,
      bodyOrientation: 'Virado 20° para a única luz',
      eyeline: 'Olho na câmera',
      position: { x: 0, y: 0, z: 1.45 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.0,
      heightM: 1.45,
      angleDeg: 0,
      focalLengthMm: 35,
      aperture: 'f/2.8',
      framing: 'Plano Médio',
      shotType: 'Plano Médio (35mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Sem Fio',
      positionLabel: 'No peito',
      distanceFromMouthCm: 15,
    },
    lights: [
      {
        id: 'light-single-key',
        name: 'Luz Principal Única a 40°',
        type: 'key',
        position: { x: 1.1, y: 1.2, z: 1.8 },
        angleDeg: 40,
        distanceM: 1.6,
        heightM: 1.8,
        intensityPct: 85,
        colorTemp: '5600K',
        modifier: 'softbox',
        equipmentModel: 'LED 100W com Softbox 80cm',
        purposeDescription: 'Uma única fonte bem difusa que abraça o rosto e deixa a sombra oposta natural.',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },

  // ─── 4. CINEMÁTICO ───
  {
    id: 'preset-cinematic-moody',
    name: 'Cinemático Moody / Bicolor',
    category: 'Cinemático',
    description: 'Contraste térmico de cores: Luz principal fria (5600K) contrastando com luz de recorte quente (3200K).',
    purpose: 'Criar atmosfera de cinema contemporâneo com rica separação cromática entre planos.',
    whenToUse: 'Filmes conceituais, teasers, comerciais de alto padrão e vídeos de posicionamento artístico.',
    targetSubject: 'Líderes visionários, fundadores de marcas premium e narrativas profundas.',
    visualResult: 'Lado do rosto banhado em luz natural de lua/dia nublado e contorno âmbar dourado desenhando a silhueta.',
    requiredEquipment: ['1 LED Daylight (5600K)', '1 LED Bicolor/Tungstênio (3200K)', 'Lente Clara'],
    studio: { widthM: 4.5, depthM: 5.5, heightM: 3.0, wallColor: '#0e1017', floorColor: '#07080c' },
    subject: {
      name: 'Personagem',
      distanceFromWallM: 1.8,
      bodyOrientation: 'Corpo a 25° para o lado frio',
      eyeline: 'Olhar cinematográfico',
      position: { x: 0, y: 0, z: 1.5 },
    },
    camera: {
      model: 'Câmera Principal',
      distanceM: 2.3,
      heightM: 1.5,
      angleDeg: 0,
      focalLengthMm: 50,
      aperture: 'f/1.8',
      framing: 'Plano Médio Fechado',
      shotType: 'Plano Médio Fechado (50mm)',
    },
    audio: {
      type: 'lapela',
      model: 'Lapela Sem Fio',
      positionLabel: 'No peito',
      distanceFromMouthCm: 15,
    },
    lights: [
      {
        id: 'light-moody-key',
        name: 'Key Fria 5600K (Daylight)',
        type: 'key',
        position: { x: 1.4, y: 1.3, z: 1.9 },
        angleDeg: 45,
        distanceM: 1.9,
        heightM: 1.9,
        intensityPct: 80,
        colorTemp: '5600K',
        modifier: 'softbox',
        equipmentModel: 'LED 100W 5600K + Softbox',
        purposeDescription: 'Fornece a luz base neutra e fria com modelagem precisa.',
      },
      {
        id: 'light-moody-rim',
        name: 'Recorte Quente 3200K (Tungstênio)',
        type: 'rim',
        position: { x: -1.3, y: -1.1, z: 1.8 },
        angleDeg: 140,
        distanceM: 1.7,
        heightM: 1.8,
        intensityPct: 65,
        colorTemp: '3200K',
        modifier: 'refletor',
        equipmentModel: 'LED Bicolor em 3200K',
        purposeDescription: 'Borda quente que esculpe a silhueta com contraste complementar clássico (Teal & Orange).',
      },
    ],
    createdAt: '2026-01-01',
    isPreset: true,
  },
];

const STORAGE_KEY = 'cinemakerpro_custom_lightings_v1';

/**
 * CARREGA ILUMINAÇÕES SALVAS PELO USUÁRIO DO LOCALSTORAGE
 */
export function getStoredUserLightings(): CustomLightingSetup[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    return JSON.parse(saved);
  } catch (e) {
    console.error('Erro ao ler iluminações salvas:', e);
    return [];
  }
}

/**
 * SALVA UMA ILUMINAÇÃO PERSONALIZADA DO USUÁRIO
 */
export function saveUserLighting(setup: CustomLightingSetup): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredUserLightings();
    const existingIndex = current.findIndex((item) => item.id === setup.id);

    let updated: CustomLightingSetup[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = { ...setup, isUserCustom: true };
    } else {
      updated = [
        { ...setup, id: setup.id || `custom-${Date.now()}`, isUserCustom: true, createdAt: new Date().toISOString() },
        ...current,
      ];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar iluminação personalizada:', e);
  }
}

/**
 * DUPLICA UMA ILUMINAÇÃO EXISTENTE (Seção 18 do Master Prompt)
 */
export function duplicateUserLighting(id: string, newName?: string): CustomLightingSetup | null {
  const all = [...getStoredUserLightings(), ...EDUCATIONAL_LIGHTING_PRESETS];
  const target = all.find((item) => item.id === id);
  if (!target) return null;

  const duplicated: CustomLightingSetup = {
    ...JSON.parse(JSON.stringify(target)),
    id: `custom-${Date.now()}`,
    name: newName || `${target.name} (Cópia)`,
    isUserCustom: true,
    isPreset: false,
    createdAt: new Date().toISOString(),
  };

  saveUserLighting(duplicated);
  return duplicated;
}

/**
 * EXCLUI UMA ILUMINAÇÃO PERSONALIZADA DO USUÁRIO
 */
export function deleteUserLighting(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredUserLightings();
    const filtered = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Erro ao excluir iluminação:', e);
  }
}

/**
 * GERA A ILUMINAÇÃO 3D AUTOMÁTICA ADAPTADA AO KIT REAL DO USUÁRIO E À CENA APROVADA
 */
export function generate3DLightingFromKit(
  context: SharedProjectContext,
  sceneName: string = 'Cena Principal'
): CustomLightingSetup {
  const userLenses = context.lenses || [];
  const userLights = context.lighting || [];
  const userCameras = (context.equipment || []).filter((e) => e.category === 'camera');

  const chosenCam = userCameras[0]?.model || 'Câmera Mirrorless';
  const chosenLens = userLenses[0]?.specs.focal_length?.includes('50')
    ? 50
    : userLenses[0]?.specs.focal_length?.includes('85')
    ? 85
    : 35;
  const chosenAperture = userLenses[0]?.specs.aperture || 'f/2.8';

  const lights: Light3DItem[] = [
    {
      id: 'light-main-key',
      name: 'Luz Principal (Key Light 45°)',
      type: 'key',
      position: { x: 1.3, y: 1.3, z: 1.85 },
      angleDeg: 45,
      distanceM: 1.8,
      heightM: 1.85,
      intensityPct: 85,
      colorTemp: '5600K',
      modifier: 'softbox',
      equipmentModel: userLights[0]?.model || 'LED 100W com Softbox',
      purposeDescription: 'Modelagem dos traços faciais a 45° respeitando o recuo da parede de fundo.',
    },
  ];

  if (userLights.length > 1) {
    lights.push({
      id: 'light-second-rim',
      name: 'Contra-luz / Recorte (Rim Light)',
      type: 'rim',
      position: { x: -1.2, y: -1.0, z: 1.75 },
      angleDeg: 135,
      distanceM: 1.5,
      heightM: 1.75,
      intensityPct: 60,
      colorTemp: '5600K',
      modifier: 'refletor',
      equipmentModel: userLights[1]?.model || 'Luz de Recorte',
      purposeDescription: 'Separação dos ombros e cabelo do fundo escuro.',
    });
  }

  return {
    id: `auto-${Date.now()}`,
    name: `Iluminação IA — ${sceneName}`,
    category: 'Comercial' as any,
    description: `Setup calculado pelo Diretor de Fotografia para a cena "${sceneName}" com as lentes e luzes do seu kit real.`,
    purpose: 'Máxima separação de planos com recuo obrigatório de 1,5m da parede de fundo.',
    whenToUse: 'Na gravação desta cena específica do roteiro aprovado.',
    targetSubject: 'Personagem principal da cena',
    visualResult: 'Luz suave direcional a 45° e fundo cinematográfico limpo.',
    requiredEquipment: lights.map((l) => l.equipmentModel),
    studio: { widthM: 4.5, depthM: 5.0, heightM: 2.8, wallColor: '#151720', floorColor: '#0e1016' },
    subject: {
      name: 'Personagem',
      distanceFromWallM: 1.5,
      bodyOrientation: 'Corpo angulado a 20° em direção à Luz Principal',
      eyeline: 'Olhar direto na lente da câmera',
      position: { x: 0, y: 0, z: 1.45 },
    },
    camera: {
      model: chosenCam,
      distanceM: 2.2,
      heightM: 1.45,
      angleDeg: 0,
      focalLengthMm: chosenLens,
      aperture: chosenAperture,
      framing: 'Plano Médio',
      shotType: `Plano Médio (${chosenLens}mm)`,
    },
    audio: {
      type: 'lapela',
      model: context.audio[0]?.model || 'Microfone Lapela Sem Fio',
      positionLabel: 'No esterno a 15cm da boca',
      distanceFromMouthCm: 15,
    },
    lights: lights,
    createdAt: new Date().toISOString(),
    isUserCustom: false,
  };
}
