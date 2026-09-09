import { Client, Equipment, Kit, Project, Shoot, UserProfile } from '@/types/database';

export const INITIAL_USER: UserProfile = {
  id: 'usr-admin-rangel',
  name: 'Rangel Maker',
  email: 'rangelmaker@gmail.com',
  role: 'admin',
  status: 'active',
  is_paid: true,
  experience_level: 'profissional',
  frequent_job_types: ['institucional', 'reels', 'depoimento'],
  subscription_tier: 'studio',
  google_calendar_connected: false,
  created_at: new Date().toISOString(),
};

export const INITIAL_USERS_DIRECTORY: UserProfile[] = [
  INITIAL_USER,
];

export const INITIAL_EQUIPMENTS: Equipment[] = [
  {
    id: 'eq-cam-1',
    category: 'camera',
    brand: 'Sony',
    model: 'A7 IV',
    specs: { mount: 'E-Mount', battery_life_hours: 2.5 },
    is_favorite: true,
  },
  {
    id: 'eq-lens-1',
    category: 'lens',
    brand: 'Sony',
    model: 'FE 35mm f/1.8',
    specs: { focal_length: '35mm', aperture: 'f/1.8' },
    is_favorite: true,
  },
  {
    id: 'eq-lens-2',
    category: 'lens',
    brand: 'Sony',
    model: 'FE 24-70mm f/2.8 GM II',
    specs: { focal_length: '24-70mm', aperture: 'f/2.8' },
    is_favorite: true,
  },
  {
    id: 'eq-lens-3',
    category: 'lens',
    brand: 'Sony',
    model: 'FE 85mm f/1.8',
    specs: { focal_length: '85mm', aperture: 'f/1.8' },
    is_favorite: false,
  },
  {
    id: 'eq-light-1',
    category: 'lighting',
    brand: 'Amaran',
    model: '100d LED + Softbox 90cm',
    specs: { power_watts: 100 },
    is_favorite: true,
  },
  {
    id: 'eq-light-2',
    category: 'lighting',
    brand: 'Nanlite',
    model: 'Pavotube II 6C (Bastão RGB)',
    specs: { power_watts: 6, battery_life_hours: 1.5 },
    is_favorite: true,
  },
  {
    id: 'eq-audio-1',
    category: 'audio',
    brand: 'DJI',
    model: 'Mic 2 (Sem Fio Lapela)',
    specs: { wireless: true },
    is_favorite: true,
  },
  {
    id: 'eq-sup-1',
    category: 'support',
    brand: 'Manfrotto',
    model: 'Tripé com Cabeça Hidráulica 504HD',
    specs: {},
    is_favorite: true,
  },
  {
    id: 'eq-sup-2',
    category: 'support',
    brand: 'DJI',
    model: 'Gimbal RS 3 Pro',
    specs: {},
    is_favorite: false,
  },
];

export const INITIAL_KITS: Kit[] = [
  {
    id: 'kit-1',
    name: 'Kit Comercial / Institucional (Padrão)',
    is_default: true,
    equipment_ids: ['eq-cam-1', 'eq-lens-2', 'eq-lens-1', 'eq-light-1', 'eq-light-2', 'eq-audio-1', 'eq-sup-1'],
  },
  {
    id: 'kit-2',
    name: 'Kit Rápido (Reels / Social)',
    is_default: false,
    equipment_ids: ['eq-cam-1', 'eq-lens-1', 'eq-light-2', 'eq-audio-1'],
  },
  {
    id: 'kit-3',
    name: 'Kit Evento / Dinâmico',
    is_default: false,
    equipment_ids: ['eq-cam-1', 'eq-lens-2', 'eq-audio-1', 'eq-sup-2'],
  },
];

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_SHOOTS: Shoot[] = [];
