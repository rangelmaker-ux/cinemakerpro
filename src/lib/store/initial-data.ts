import { Client, Equipment, Kit, Project, Shoot, UserProfile } from '@/types/database';

export const INITIAL_USER: UserProfile = {
  id: 'user-01',
  name: 'Rangel Maker',
  email: 'rangel@cinemaker.pro',
  experience_level: 'profissional',
  frequent_job_types: ['institucional', 'reels', 'depoimento'],
  subscription_tier: 'pro',
  google_calendar_connected: true,
  created_at: new Date().toISOString(),
};

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

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'DF Móveis Planejados',
    company: 'DF Móveis',
    phone: '(61) 99881-2233',
    email: 'contato@dfmoveis.com.br',
    status: 'fechado',
    next_action: 'Gravação agendada hoje às 14:00',
    next_action_date: new Date().toISOString(),
    notes: 'Vídeo institucional da nova fábrica com depoimento do CEO.',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'cli-2',
    name: 'Dra. Camila Dermatologia',
    company: 'Clínica Lumine',
    phone: '(61) 98765-4321',
    email: 'camila@lumine.com.br',
    status: 'orcamento',
    next_action: 'Follow-up do pacote de 6 Reels',
    next_action_date: new Date(Date.now() + 86400000).toISOString(),
    notes: 'Interessada em vídeos semanais sobre procedimentos estéticos.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'cli-3',
    name: 'Restaurante Território',
    company: 'Território Gastronomia',
    phone: '(61) 99112-3344',
    email: 'gerencia@territorio.com.br',
    status: 'pos_venda',
    next_action: 'Solicitar depoimento e autorização de portfólio',
    next_action_date: new Date(Date.now() - 86400000).toISOString(),
    notes: 'Material entregue há 4 dias. Cliente elogiou muito o resultado.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    client_id: 'cli-1',
    title: 'Vídeo Institucional Nova Linha 2026',
    video_type: 'institucional',
    objective: 'Apresentar a tecnologia da marcenaria e gerar credibilidade B2B.',
    budget_value: 3800.0,
    status: 'preparacao',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

export const INITIAL_SHOOTS: Shoot[] = [
  {
    id: 'shoot-1',
    project_id: 'proj-1',
    kit_id: 'kit-1',
    scheduled_at: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 horas a frente
    location_address: 'SIA Trecho 3, Lote 620 — Brasília/DF',
    estimated_duration_min: 120,
    status: 'agendado',
    checklist_state: [
      { id: 'c1', label: 'Briefing e objetivos alinhados com o cliente', done: true, category: 'pre' },
      { id: 'c2', label: 'Baterias das câmeras e luzes 100% carregadas', done: true, category: 'pre' },
      { id: 'c3', label: 'Cartões SD formatados e conferidos', done: true, category: 'pre' },
      { id: 'c4', label: 'Lente 35mm limpa e montada', done: true, category: 'pre' },
      { id: 'c5', label: 'Ambiente escaneado pelo Diretor IA', done: false, category: 'shoot' },
      { id: 'c6', label: 'Luz principal ajustada a 45°', done: false, category: 'shoot' },
      { id: 'c7', label: 'Áudio testado sem ruído de ar-condicionado', done: false, category: 'shoot' },
      { id: 'c8', label: 'Enquadramento validado (Headroom OK)', done: false, category: 'shoot' },
      { id: 'c9', label: 'Take 1 (Entrevista Principal) gravado', done: false, category: 'takes' },
      { id: 'c10', label: 'B-Roll de detalhes e processos concluído', done: false, category: 'takes' },
      { id: 'c11', label: 'Backup imediato no HD externo iniciado', done: false, category: 'post' },
    ],
  },
];
