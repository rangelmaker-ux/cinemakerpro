-- ==============================================================================
-- CINEMAKER PRO — SCRIPT SQL PARA SUPABASE
-- Schema Relacional Completo, Políticas de RLS e Seeds Iniciais
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA: USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    experience_level TEXT DEFAULT 'intermediario', -- iniciante, intermediario, profissional
    frequent_job_types JSONB DEFAULT '["reels", "institucional", "depoimento"]'::jsonb,
    subscription_tier TEXT DEFAULT 'pro', -- free, pro, studio
    google_calendar_connected BOOLEAN DEFAULT false,
    google_selected_calendar_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA: EQUIPMENTS (Inventário de Câmeras, Lentes, Luzes, Áudio e Suporte)
CREATE TABLE IF NOT EXISTS public.equipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- camera, lens, lighting, audio, support, custom
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    specs JSONB DEFAULT '{}'::jsonb, -- focal_length: "35mm", aperture: "f/1.8", power_watts: 100, etc.
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABELA: KITS (Combinações Rápidas de Equipamentos)
CREATE TABLE IF NOT EXISTS public.kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- "Kit Rápido (Reels)", "Kit Comercial", "Kit Entrevista"
    is_default BOOLEAN DEFAULT false,
    equipment_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA: CLIENTS (Mini CRM Especializado)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    email TEXT,
    status TEXT DEFAULT 'lead', -- lead, orcamento, fechado, pos_venda
    next_action TEXT,
    next_action_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA: PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    video_type TEXT NOT NULL, -- institucional, depoimento, reels, produto, evento
    objective TEXT,
    budget_value NUMERIC(12, 2) DEFAULT 0.00,
    status TEXT DEFAULT 'briefing', -- briefing, preparacao, gravacao, edicao, aprovacao, entregue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABELA: SHOOTS (Gravações e Diárias)
CREATE TABLE IF NOT EXISTS public.shoots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    kit_id UUID REFERENCES public.kits(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    location_address TEXT,
    estimated_duration_min INT DEFAULT 90,
    status TEXT DEFAULT 'agendado', -- agendado, em_andamento, concluido
    google_event_id TEXT,
    checklist_state JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA: AI_ANALYSES (Diretor de Gravação IA)
CREATE TABLE IF NOT EXISTS public.ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shoot_id UUID REFERENCES public.shoots(id) ON DELETE CASCADE,
    environment_photo_url TEXT,
    framing_test_photo_url TEXT,
    selected_mode TEXT DEFAULT 'recomendado', -- recomendado, rapido, criativo
    spatial_data JSONB NOT NULL,
    why_explanation TEXT,
    framing_feedback JSONB,
    confidence TEXT DEFAULT 'alta',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABELA: TAKES (Plano de Cenas e Gravação)
CREATE TABLE IF NOT EXISTS public.takes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shoot_id UUID REFERENCES public.shoots(id) ON DELETE CASCADE,
    scene_number INT NOT NULL,
    title TEXT NOT NULL,
    framing TEXT, -- plano_medio, close_up, aberto, b_roll
    description TEXT,
    duration_seconds INT DEFAULT 5,
    status TEXT DEFAULT 'pendente', -- pendente, gravado, descartado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. TABELA: POST_SALES (Pós-Venda, Depoimentos e Prova Social)
CREATE TABLE IF NOT EXISTS public.post_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    satisfaction_rating INT, -- 1 a 5
    testimonial_text TEXT,
    authorized_for_portfolio BOOLEAN DEFAULT true,
    future_opportunity_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ATIVAÇÃO DE RLS (ROW LEVEL SECURITY)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_sales ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO LIVRE EM DESENVOLVIMENTO (Substituir por auth.uid() = user_id em produção autenticada)
CREATE POLICY "Public dev access for users" ON public.users FOR ALL USING (true);
CREATE POLICY "Public dev access for equipments" ON public.equipments FOR ALL USING (true);
CREATE POLICY "Public dev access for kits" ON public.kits FOR ALL USING (true);
CREATE POLICY "Public dev access for clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Public dev access for projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Public dev access for shoots" ON public.shoots FOR ALL USING (true);
CREATE POLICY "Public dev access for ai_analyses" ON public.ai_analyses FOR ALL USING (true);
CREATE POLICY "Public dev access for takes" ON public.takes FOR ALL USING (true);
CREATE POLICY "Public dev access for post_sales" ON public.post_sales FOR ALL USING (true);
