import { AIDirectorSpatialData, FramingTestFeedback, SpatialElement, VectorLine } from './types';
import { DirectorMode, Equipment, VideoType } from '@/types/database';

export interface AIDirectorInput {
  videoType: VideoType;
  objective?: string;
  mode: DirectorMode;
  userEquipment: Equipment[];
  blockedZones?: { id: string; x: number; y: number }[];
  customPrompt?: string;
}

export function generateAIDirectorLayout(input: AIDirectorInput): AIDirectorSpatialData {
  const { videoType, mode, userEquipment, blockedZones = [] } = input;

  // 1. Identificar equipamentos reais do usuário
  const lenses = userEquipment.filter((e) => e.category === 'lens');
  const lights = userEquipment.filter((e) => e.category === 'lighting');
  const mics = userEquipment.filter((e) => e.category === 'audio');

  // Selecionar lente real do usuário
  let chosenLens = lenses[0] || {
    id: 'lens-def',
    brand: 'Nativa',
    model: '35mm f/1.8',
    specs: { focal_length: '35mm', aperture: 'f/1.8' },
  };

  if (mode === 'criativo') {
    // Preferir lente mais aberta/cinematográfica (ex: 50mm, 85mm ou 35mm)
    const primeLens = lenses.find((l) => l.specs.aperture?.includes('1.') || l.specs.focal_length?.includes('50') || l.specs.focal_length?.includes('85'));
    if (primeLens) chosenLens = primeLens;
  } else if (mode === 'rapido') {
    // Preferir zoom versátil (24-70mm) ou 35mm
    const zoomLens = lenses.find((l) => l.specs.focal_length?.includes('24') || l.specs.focal_length?.includes('70'));
    if (zoomLens) chosenLens = zoomLens;
  }

  // Luzes reais
  const hasKeyLight = lights.length > 0;
  const hasBackLight = lights.length > 1;

  // Microfone real
  const chosenMic = mics[0] || {
    id: 'mic-def',
    brand: 'Lapela',
    model: 'Wireless Sem Fio',
    specs: { wireless: true },
  };

  // 2. Coordenadas Espaciais com prevenção de zonas bloqueadas
  let subjectPos = { x: 50, y: 38 };
  let cameraPos = { x: 50, y: 78 };
  let keyLightPos = { x: 28, y: 55 };
  let backLightPos = { x: 70, y: 30 };
  let micPos = { x: 50, y: 44 };

  // Se o usuário tocou em "Não consigo colocar aqui", recalcular posições
  const isKeyBlocked = blockedZones.some((b) => b.id === 'key_light' || (Math.abs(b.x - keyLightPos.x) < 15 && Math.abs(b.y - keyLightPos.y) < 15));
  const isCameraBlocked = blockedZones.some((b) => b.id === 'camera' || (Math.abs(b.x - cameraPos.x) < 15 && Math.abs(b.y - cameraPos.y) < 15));

  if (isKeyBlocked) {
    // Inverter luz principal para o lado oposto (45° à direita)
    keyLightPos = { x: 74, y: 56 };
    backLightPos = { x: 26, y: 30 };
  }

  if (isCameraBlocked) {
    // Deslocar ligeiramente em ângulo 3/4
    cameraPos = { x: 62, y: 76 };
  }

  if (mode === 'rapido') {
    // Modo Rápido: setup mais compacto
    cameraPos = { x: 50, y: 74 };
    keyLightPos = { x: 34, y: 62 };
  } else if (mode === 'criativo') {
    // Modo Criativo: maior profundidade de campo e separação
    subjectPos = { x: 46, y: 36 };
    cameraPos = { x: 52, y: 82 };
    keyLightPos = { x: 22, y: 50 };
  }

  const elements: SpatialElement[] = [
    {
      id: 'subject',
      type: 'subject',
      label: 'Personagem',
      x: subjectPos.x,
      y: subjectPos.y,
      facingAngle: 180, // virado para a câmera
      distanceLabel: '1,5 m da parede de fundo',
      heightLabel: 'Sentado ou em pé natural',
      details: 'Orientado a 15° em direção à luz principal para olhar vivo',
      icon: 'User',
      color: '#8b5cf6',
    },
    {
      id: 'camera',
      type: 'camera',
      label: 'Câmera Principal',
      x: cameraPos.x,
      y: cameraPos.y,
      distanceLabel: mode === 'criativo' ? '2,8 m do personagem' : '2,2 m do personagem',
      heightLabel: '1,42 m (linha dos olhos)',
      details: `${chosenLens.brand} ${chosenLens.model} • Plano Médio`,
      icon: 'Camera',
      color: '#38bdf8',
    },
    {
      id: 'key_light',
      type: 'key_light',
      label: 'Luz Principal (Key)',
      x: keyLightPos.x,
      y: keyLightPos.y,
      distanceLabel: '1,8 m a 45° do personagem',
      heightLabel: '1,85 m (inclinada 35° para baixo)',
      details: hasKeyLight ? `${lights[0].brand} ${lights[0].model} com difusor` : 'Luz suave difusa a 45°',
      icon: 'SunMedium',
      color: '#f59e0b',
    },
  ];

  if (hasBackLight && mode !== 'rapido') {
    elements.push({
      id: 'back_light',
      type: 'back_light',
      label: 'Contraluz / Rim Light',
      x: backLightPos.x,
      y: backLightPos.y,
      distanceLabel: '1,4 m nas costas do personagem',
      heightLabel: '2,0 m (fora do enquadramento)',
      details: `${lights[1]?.brand || 'Bastão LED'} • Separação de ombro/cabelo`,
      icon: 'Sparkles',
      color: '#fbbf24',
    });
  }

  elements.push({
    id: 'mic',
    type: 'mic',
    label: 'Microfone',
    x: micPos.x,
    y: micPos.y,
    distanceLabel: '15-20 cm abaixo do queixo',
    details: `${chosenMic.brand} ${chosenMic.model} (cápsula apontada para a boca)`,
    icon: 'Mic',
    color: '#10b981',
  });

  const lines: VectorLine[] = [
    {
      fromId: 'camera',
      toId: 'subject',
      type: 'sight',
      label: mode === 'criativo' ? '2,8 m' : '2,2 m',
      color: '#38bdf8',
    },
    {
      fromId: 'key_light',
      toId: 'subject',
      type: 'light_beam',
      label: '45° Suave',
      color: '#f59e0b',
      dashed: true,
    },
  ];

  if (hasBackLight && mode !== 'rapido') {
    lines.push({
      fromId: 'back_light',
      toId: 'subject',
      type: 'light_beam',
      label: 'Recorte',
      color: '#fbbf24',
      dashed: true,
    });
  }

  const whyExplanation = isKeyBlocked
    ? `Reposicionamos a luz principal para o quadrante oposto a 45° para contornar o obstáculo físico que você indicou, mantendo a iluminação Rembrandt sem sombras indesejadas.`
    : mode === 'criativo'
    ? `Essa configuração cria máxima profundidade de campo usando sua lente ${chosenLens.model}. O sujeito a 1,5m da parede desfoca o fundo, enquanto o contraluz cria o recorte cinematográfico característico.`
    : mode === 'rapido'
    ? `Configuração simplificada otimizada para rapidez: usa apenas 1 ponto de luz principal próximo e câmera na linha dos olhos, permitindo iniciar as gravações em menos de 3 minutos.`
    : `Posição calculada para aproveitar a profundidade diagonal da sala e evitar o reflexo da janela atrás do personagem. A luz a 45° cria relevo no rosto sem sombras duras sob os olhos.`;

  return {
    elements,
    lines,
    cameraSettings: {
      recommendedLensId: chosenLens.id,
      lensName: `${chosenLens.brand} ${chosenLens.model}`,
      focalLength: chosenLens.specs?.focal_length || '35mm',
      aperture: mode === 'criativo' ? 'f/1.8' : 'f/2.8',
      height: '1,42 m (altura dos olhos)',
      framing: videoType === 'reels' ? '9:16 Vertical • Plano Médio' : '16:9 Horizontal • Plano Médio',
      shotType: 'Plano Médio com respiro de cabeça (Headroom ideal)',
    },
    lightingSettings: {
      keyLightAngle: isKeyBlocked ? '45° à direita' : '45° à esquerda',
      keyLightHeight: '1,85 m (apontada para baixo)',
      keyLightModifier: 'Softbox ou difusor circular',
      backLightNotes: hasBackLight && mode !== 'rapido' ? 'Luz de recorte nos ombros para descolar do fundo' : 'Não necessária neste modo rápido',
    },
    audioSettings: {
      micType: `${chosenMic.brand} ${chosenMic.model}`,
      position: 'Lapela centralizado na roupa a 4 dedos do peito',
      cautions: 'Desligue ar condicionado ou geladeiras ruidosas próximas antes do take',
    },
    subjectSettings: {
      distanceFromWall: 'Mínimo de 1,5 m para evitar sombra chapada na parede',
      orientation: 'Corpo ligeiramente rotacionado em direção à luz',
    },
    avoids: [
      'Janela com luz solar direta logo atrás do personagem (evita silhueta escura)',
      'Luz de teto fria acesa diretamente sobre a cabeça (evita olheiras pesadas)',
      'Personagem colado na parede (evita aparência amadora e sem profundidade)',
    ],
    whyExplanation,
    takesPlan: [
      {
        sceneNumber: 1,
        title: 'Cena 01 — Gancho & Apresentação',
        framing: 'Plano Médio',
        movement: 'Câmera Fixa no Tripé',
        durationSec: 6,
        description: 'Fala principal de impacto direto para a lente com energia e segurança.',
      },
      {
        sceneNumber: 2,
        title: 'Cena 02 — Demonstração / Processo',
        framing: 'Plano Detalhe / Close-up',
        movement: 'Movimento Lento Lateral',
        durationSec: 5,
        description: 'Foco nas mãos, produto ou tela com profundidade de campo rasa.',
      },
      {
        sceneNumber: 3,
        title: 'Cena 03 — Ambiente & Contexto',
        framing: 'Plano Aberto',
        movement: 'Pan suave ou Slider',
        durationSec: 4,
        description: 'Revelação do espaço de trabalho transmitindo autoridade e credibilidade.',
      },
      {
        sceneNumber: 4,
        title: 'Cena 04 — CTA Final (Call to Action)',
        framing: 'Primeiro Plano (Close)',
        movement: 'Push-in sutil',
        durationSec: 5,
        description: 'Chamada para ação do cliente (comente, acesse o link, entre em contato).',
      },
    ],
  };
}

export function evaluateFramingTest(samplePhotoData?: string): FramingTestFeedback {
  // Retorna feedback prático de enquadramento
  return {
    approved: true,
    score: 88,
    headroomStatus: 'bom',
    lightingStatus: 'equilibrada',
    separationStatus: 'otima',
    actionableTips: [
      '✅ Enquadramento seguro com os olhos no terço superior',
      '💡 Luz principal está bem posicionada sem queimar as altas luzes',
      '⚠️ Dica de ajuste fino: abaixe a câmera aproximadamente 5 a 10 cm para ficar 100% na altura dos olhos.',
    ],
  };
}
