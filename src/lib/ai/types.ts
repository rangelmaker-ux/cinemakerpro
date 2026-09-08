import { DirectorMode, VideoType } from '@/types/database';

export interface SpatialElement {
  id: string;
  type: 'subject' | 'camera' | 'key_light' | 'back_light' | 'fill_light' | 'mic';
  label: string;
  x: number; // 0 to 100% relative to image width
  y: number; // 0 to 100% relative to image height
  facingAngle?: number; // 0-360 degrees
  distanceLabel?: string; // e.g. "2,3 m da pessoa"
  heightLabel?: string; // e.g. "1,45 m (altura dos olhos)"
  details: string; // e.g. "Lente 35mm f/1.8 • Plano Médio"
  icon: string;
  color: string;
}

export interface VectorLine {
  fromId: string;
  toId: string;
  type: 'sight' | 'light_beam' | 'distance';
  label?: string;
  color: string;
  dashed?: boolean;
}

export interface AIDirectorSpatialData {
  elements: SpatialElement[];
  lines: VectorLine[];
  cameraSettings: {
    recommendedLensId?: string;
    lensName: string;
    focalLength: string;
    aperture: string;
    height: string;
    framing: string;
    shotType: string;
  };
  lightingSettings: {
    keyLightAngle: string;
    keyLightHeight: string;
    keyLightModifier: string;
    backLightNotes: string;
  };
  audioSettings: {
    micType: string;
    position: string;
    cautions: string;
  };
  subjectSettings: {
    distanceFromWall: string;
    orientation: string;
  };
  avoids: string[];
  whyExplanation: string;
  takesPlan: {
    sceneNumber: number;
    title: string;
    framing: string;
    movement: string;
    durationSec: number;
    description: string;
  }[];
}

export interface FramingTestFeedback {
  approved: boolean;
  score: number; // 0-100
  headroomStatus: 'bom' | 'muito_espaco' | 'cortando_cabeca';
  lightingStatus: 'equilibrada' | 'muito_alta' | 'subexposta';
  separationStatus: 'otima' | 'colado_na_parede';
  actionableTips: string[];
}
