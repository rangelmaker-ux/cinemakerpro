export type SubscriptionTier = 'free' | 'pro' | 'studio';
export type ExperienceLevel = 'iniciante' | 'intermediario' | 'profissional';
export type EquipmentCategory = 'camera' | 'lens' | 'lighting' | 'audio' | 'support' | 'custom';
export type ClientStatus = 'lead' | 'orcamento' | 'fechado' | 'pos_venda';
export type VideoType = 'institucional' | 'depoimento' | 'reels' | 'produto' | 'entrevista' | 'evento' | 'outro';
export type ProjectStatus = 'briefing' | 'preparacao' | 'gravacao' | 'edicao' | 'aprovacao' | 'entregue';
export type ShootStatus = 'agendado' | 'em_andamento' | 'concluido';
export type DirectorMode = 'recomendado' | 'rapido' | 'criativo';
export type UserRole = 'admin' | 'user';
export type UserStatus = 'active' | 'paused' | 'blocked';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
  status?: UserStatus;
  is_paid?: boolean;
  paid_until?: string;
  experience_level: ExperienceLevel;
  frequent_job_types: VideoType[];
  subscription_tier: SubscriptionTier;
  google_calendar_connected: boolean;
  google_selected_calendar_id?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  user_id?: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  specs: {
    focal_length?: string;
    aperture?: string;
    power_watts?: number;
    mount?: string;
    battery_life_hours?: number;
    wireless?: boolean;
  };
  is_favorite?: boolean;
}

export interface Kit {
  id: string;
  user_id?: string;
  name: string;
  is_default: boolean;
  equipment_ids: string[];
}

export interface Client {
  id: string;
  user_id?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  status: ClientStatus;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id?: string;
  client_id: string;
  title: string;
  video_type: VideoType;
  objective?: string;
  budget_value?: number;
  status: ProjectStatus;
  created_at: string;
}

export interface Shoot {
  id: string;
  project_id: string;
  kit_id?: string;
  scheduled_at: string;
  location_address?: string;
  estimated_duration_min: number;
  status: ShootStatus;
  google_event_id?: string;
  checklist_state: { id: string; label: string; done: boolean; category: string }[];
}

export interface TakeItem {
  id: string;
  shoot_id: string;
  scene_number: number;
  title: string;
  framing: string;
  description: string;
  duration_seconds: number;
  status: 'pendente' | 'gravado' | 'descartado';
}
