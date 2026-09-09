import { Client, DirectorMode, Equipment, Kit, Project, VideoType } from '@/types/database';

/**
 * Shared Project Context (Section 4 of Master Implementation Prompt)
 * All agents collaborate using this shared context.
 */
export interface SharedProjectContext {
  project: {
    id: string;
    title: string;
    videoType: VideoType;
    mode: DirectorMode;
    duration?: string;
    format?: '9:16' | '16:9' | '1:1';
  };
  client: {
    id?: string;
    name: string;
    company?: string;
    segment?: string;
  };
  briefing: {
    objective: string;
    audience: string;
    tone: string;
    keyMessage: string;
    targetEmotion: string;
  };
  video_type: VideoType;
  platform: 'reels' | 'tiktok' | 'youtube' | 'institucional' | 'comercial' | 'outro';
  format: '9:16' | '16:9' | '1:1';
  duration: string;
  environment: {
    photoUrl: string | null;
    type: 'interno' | 'externo' | 'estudio' | 'escritorio' | 'comercial';
    ambientLight: string;
    wallDistanceMeters: number; // Padrão recomendado 1.5m
    obstacles?: string[];
  };
  equipment: Equipment[];
  lenses: Equipment[];
  lighting: Equipment[];
  audio: Equipment[];
  style: 'cinematografico' | 'comercial' | 'documentario' | 'clean' | 'dramatico';
  constraints: {
    blockedZones: { id: string; x: number; y: number }[];
    maxDistanceMeters?: number;
    roomSize?: 'pequeno' | 'medio' | 'amplo';
    singleLightOnly?: boolean;
  };
  user_preferences: {
    customPrompt?: string;
    preferredAngle?: '45_left' | '45_right' | 'frontal';
  };
}

/**
 * Visual Direction Data (Section 37 of Master Implementation Prompt)
 */
export interface VisualDirectionData {
  subject: {
    position: string;
    distance_from_background_m: number; // Sempre >= 1.5m para profundidade
    body_orientation: string;
    eyeline: string;
  };
  camera: {
    position: string;
    distance_m: number;
    height_m: number;
    angle_deg: number;
    shot_type: string;
    framing: string;
  };
  lens: {
    model: string;
    focal_length_mm: number;
    recommended_aperture: string;
    shutter_speed: string;
    iso_note: string;
    reasoning: string;
  };
  lighting: {
    key: {
      position: string;
      side: 'left' | 'right';
      angle_deg: number;
      height: string;
      modifier: string;
      distance_to_wall_m: number;
      color_temp: '3200K' | '4300K' | '5600K' | 'bicolor';
      intensity_pct: number;
      purpose: string;
    };
    fill?: {
      position: string;
      type: string;
      intensity_pct: number;
    };
    rim?: {
      position: string;
      distance_to_wall_m: number;
      color_temp: string;
      purpose: string;
    };
    ambient?: {
      recommendation: string;
    };
  };
  depth: {
    subject_to_wall_clearance_m: number;
    layering_notes: string;
    separation_method: string;
  };
  audio: {
    mic_model: string;
    position: string;
    recommendation: string;
  };
}

/**
 * Script Scene Structure (Section 26 of Master Implementation Prompt)
 */
export interface ScriptScene {
  sceneNumber: number;
  sceneName: string; // Ex: "CENA 01 — O GANCHO"
  stage: 'hook' | 'central_question' | 'origin' | 'conflict' | 're_hook' | 'discovery' | 'test' | 'climax' | 'cta';
  objective: string;
  narrativePurpose: string;
  dialogue: string; // Diálogo humano em pt-BR com pausas e entonação natural
  action: string; // O que a pessoa faz no cenário
  visualIdea: string; // O que a câmera vê
  emotionalIntention: string;
  durationSec: number;
  shotType: string;
  brollSuggestion?: string;
  transition: string;
}

/**
 * Criador de Roteiro Output (Section 41)
 */
export interface ScriptCreatorOutput {
  agent: 'script_creator';
  language: 'pt-BR';
  concept: string;
  central_question: string;
  hook: string;
  narrative_strategy: string;
  retention_technique: string;
  scenes: ScriptScene[];
  dialogue_overview: string[];
  cta: string;
  visual_notes: string[];
  creative_angle?: string;
  creative_intent?: string;
  creative_justification?: string;
}

/**
 * Diretor de Cena Output (Section 39)
 */
export interface SceneDirectorOutput {
  agent: 'scene_director';
  language: 'pt-BR';
  subject_position: {
    description: string;
    spatial_x_pct: number;
    spatial_y_pct: number;
    distance_from_background_m: number;
  };
  body_orientation: string;
  eye_line: string;
  movement: {
    start_action: string;
    motion_flow: string;
    timing_seconds: number;
  };
  blocking: string;
  interaction: string;
  performance_notes: string[];
}

/**
 * Diretor de Fotografia Output (Section 40)
 */
export interface CinematographerOutput {
  agent: 'cinematographer';
  language: 'pt-BR';
  camera: {
    model: string;
    position: string;
    distance_m: number;
    height_m: number;
    angle_deg: number;
    movement: string;
    settings: {
      shutter: string;
      fps: number;
      aperture: string;
      iso: string;
    };
  };
  lens: {
    model: string;
    focal_length_mm: number;
    source: 'equipamento_proprio' | 'equipamento_opcional';
    choice_reason: string;
  };
  framing: {
    shot_type: string;
    composition_rules: string;
    headroom_note: string;
  };
  lighting: {
    key_light: {
      equipment_used: string;
      angle_deg: number;
      side: 'left' | 'right';
      height: string;
      modifier: string;
      color_temp: '3200K' | '4300K' | '5600K' | 'bicolor';
      distance_to_wall_m: number;
    };
    fill_light?: {
      method: string;
      intensity: string;
    };
    rim_light?: {
      equipment_used: string;
      position: string;
      distance_to_wall_m: number;
    };
  };
  depth: {
    subject_background_distance_m: number;
    separation_strategy: string;
  };
  composition: {
    aspect_ratio: string;
    focal_plane: string;
    atmosphere: string;
  };
  visual_style: string;
  optional_equipment_recommendations?: string[];
}

/**
 * Practical Take Item for Set Checklist (Section 47)
 */
export interface TakePlanItem {
  sceneNumber: number;
  takeNumber: number;
  title: string;
  framing: string;
  cameraMovement: string;
  durationSec: number;
  description: string;
  equipmentNeeded: string;
  isDone?: boolean;
}

/**
 * Diretor Geral Output (Section 38 & Master Plan)
 */
export interface GeneralDirectorOutput {
  agent: 'general_director';
  language: 'pt-BR';
  project_summary: {
    title: string;
    client: string;
    objective: string;
    tone: string;
    format: string;
  };
  creative_direction: {
    executive_summary: string;
    narrative_thesis: string;
    visual_thesis: string;
    acting_thesis: string;
  };
  conflict_resolutions: {
    conflict: string;
    resolution: string;
    priority_applied: string;
  }[];
  script_direction: ScriptCreatorOutput;
  scene_direction: SceneDirectorOutput;
  cinematography_direction: CinematographerOutput;
  visual_direction_data: VisualDirectionData;
  takes: TakePlanItem[];
  warnings: string[];
  alternatives: {
    option_name: string;
    description: string;
    adjustments: string;
  }[];
  version: number;
}

/**
 * Image Execution Layer Output (Section 42)
 */
export interface ImageExecutionOutput {
  original_image: string;
  preview_image: string;
  depth_map_image?: string;
  changes_applied: string[];
  warnings: string[];
  version: number;
}
