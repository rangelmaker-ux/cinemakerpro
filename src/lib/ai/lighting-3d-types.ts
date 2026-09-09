/**
 * TIPOS ESTRUTURADOS DO SISTEMA DE ILUMINAÇÃO E POSICIONAMENTO 3D (Seções 3, 4, 6, 7, 8 & 21)
 * CineMaker Pro - 3D Studio & Lighting Direction
 */

export type LightType3D =
  | 'key' // Luz Principal
  | 'fill' // Luz de Preenchimento
  | 'rim' // Luz de Recorte / Contra-luz
  | 'back' // Luz de Fundo
  | 'hair' // Luz de Cabelo
  | 'practical' // Luz Prática de Cenário (abajur, letreiro)
  | 'ambient' // Luz Ambiente
  | 'rgb_tube' // Tubo de LED RGB
  | 'led_panel' // Painel de LED
  | 'fresnel'; // Fresnel Focado

export type LightModifier3D =
  | 'softbox' // Softbox Difusor
  | 'refletor' // Panela / Refletor Padrão
  | 'barndoor' // Bandeiras Corta-Luz
  | 'tubo_difuso' // Tubo com Difusão
  | 'colmeia' // Grid / Colmeia Direcional
  | 'nenhum'; // Luz Dura Direta

export type ColorTemperature3D = '3200K' | '4300K' | '5600K' | 'rgb';

export interface Light3DItem {
  id: string;
  name: string;
  type: LightType3D;
  position: {
    x: number; // Em metros relativo ao sujeito (0, 0, 0): negativo = esquerda, positivo = direita
    y: number; // Em metros de profundidade: negativo = atrás do sujeito, positivo = na frente
    z: number; // Altura do chão em metros
  };
  angleDeg: number; // Ângulo em graus em relação ao nariz do sujeito (0° frontal, 45° clássico)
  distanceM: number; // Distância física do sujeito em metros
  heightM: number; // Altura da fonte em metros
  intensityPct: number; // Intensidade (0% a 100%)
  colorTemp: ColorTemperature3D;
  rgbColor?: string; // Cor hex quando colorTemp === 'rgb'
  modifier: LightModifier3D;
  equipmentModel: string; // Ex: "LED 100W", "Bastão RGB", "Softbox 90cm"
  isOptional?: boolean; // Se for recomendação além do kit que o usuário possui
  purposeDescription?: string; // Ex: "Modelar traços do rosto e criar sombra suave no lado oposto"
}

export interface Camera3DItem {
  model: string; // Câmera do kit do usuário
  distanceM: number; // Distância do sujeito em metros (ex: 2.3m)
  heightM: number; // Altura da lente em metros (ex: 1.45m - linha dos olhos)
  angleDeg: number; // 0° = frontal, 15° = 3/4
  focalLengthMm: number; // Lente do kit (ex: 35mm, 50mm, 85mm)
  aperture: string; // Ex: "f/2.8", "f/1.8"
  framing: string; // Ex: "Plano Médio", "Plano Americano", "Close-up"
  shotType: string;
}

export interface Subject3DItem {
  name: string; // Ex: "Personagem / Apresentador"
  distanceFromWallM: number; // Distância física da parede de fundo (mínimo 1.5m para profundidade real)
  bodyOrientation: string; // Ex: "Corpo angulado a 20° em direção à Luz Principal"
  eyeline: string; // Ex: "Olhar direto para a lente da câmera"
  position: {
    x: number;
    y: number;
    z: number;
  };
}

export interface Audio3DItem {
  type: 'lapela' | 'boom' | 'wireless';
  model: string;
  positionLabel: string; // Ex: "No esterno a 15cm da boca"
  distanceFromMouthCm: number;
}

export interface StudioRoom3D {
  widthM: number; // Largura da sala em metros (padrão 4m)
  depthM: number; // Comprimento da sala em metros (padrão 5m)
  heightM: number; // Altura do teto em metros (padrão 2.8m)
  wallColor: string;
  floorColor: string;
}

export type LightingCategory =
  | 'Entrevista'
  | 'Retrato'
  | 'Produto'
  | 'Social Media'
  | 'Cinemático';

export interface CustomLightingSetup {
  id: string;
  name: string;
  category: LightingCategory;
  description: string;
  purpose: string;
  whenToUse: string;
  targetSubject: string;
  visualResult: string;
  requiredEquipment: string[];
  lights: Light3DItem[];
  camera: Camera3DItem;
  subject: Subject3DItem;
  audio: Audio3DItem;
  studio: StudioRoom3D;
  createdAt: string;
  isPreset?: boolean; // Se faz parte da biblioteca educativa padrão
  isUserCustom?: boolean; // Se foi criado/editado e salvo pelo usuário
}

export type ViewMode3D = 'top' | 'camera' | 'orbit';
