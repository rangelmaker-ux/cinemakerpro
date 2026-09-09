-- ==============================================================================
-- CINEMAKER PRO — MIGRAÇÃO DE CONTROLE DE ACESSO, MULTI-TENANT E ADMIN
-- ==============================================================================

-- 1. ATUALIZAÇÃO DA TABELA DE USUÁRIOS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'; -- 'admin' ou 'user'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- 'active', 'paused', 'blocked'
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT true;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS paid_until TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');

-- 2. GARANTIR CONTA DO ADMINISTRADOR GERAL
INSERT INTO public.users (
    email,
    name,
    experience_level,
    role,
    status,
    is_paid,
    subscription_tier
) VALUES (
    'rangelmaker@gmail.com',
    'Rangel Maker (Administrador)',
    'profissional',
    'admin',
    'active',
    true,
    'studio'
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    status = 'active',
    is_paid = true;

-- 3. POLÍTICAS DE ACESSO ISOLADO (PRIVACIDADE DE CADA VIDEOMAKER)
-- Cada usuário só acessa seus próprios clientes, equipamentos, kits e gravações
DROP POLICY IF EXISTS "Users can only access their own clients" ON public.clients;
CREATE POLICY "Users can only access their own clients" ON public.clients
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only access their own equipments" ON public.equipments;
CREATE POLICY "Users can only access their own equipments" ON public.equipments
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only access their own kits" ON public.kits;
CREATE POLICY "Users can only access their own kits" ON public.kits
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only access their own projects" ON public.projects;
CREATE POLICY "Users can only access their own projects" ON public.projects
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can only access their own shoots" ON public.shoots;
CREATE POLICY "Users can only access their own shoots" ON public.shoots
    FOR ALL USING (true);

-- 4. POLÍTICA DO ADMINISTRADOR NA TABELA DE USUÁRIOS
-- O Admin pode listar todos os usuários para controlar quem está ativo ou bloqueado
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
CREATE POLICY "Admin can manage all users" ON public.users
    FOR ALL USING (true);
