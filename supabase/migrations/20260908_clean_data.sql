-- ==============================================================================
-- CINEMAKER PRO — SCRIPT DE OFICIALIZAÇÃO & LIMPEZA DE DADOS FICTÍCIOS
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase para limpar qualquer dado de
-- demonstração/teste antes do lançamento oficial.
-- Mantém apenas as tabelas, RLS e a conta do Administrador Mestre.
-- ==============================================================================

-- 1. Limpar gravações e diárias de teste
DELETE FROM public.takes WHERE true;
DELETE FROM public.ai_analyses WHERE true;
DELETE FROM public.shoots WHERE true;

-- 2. Limpar projetos e clientes fictícios
DELETE FROM public.post_sales WHERE true;
DELETE FROM public.projects WHERE true;
DELETE FROM public.clients WHERE true;

-- 3. Limpar usuários de teste (mantendo apenas o Administrador rangelmaker@gmail.com)
DELETE FROM public.users WHERE email != 'rangelmaker@gmail.com';

-- 4. Garantir que o Administrador esteja com acesso ativo e plano Studio
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
