-- ==========================================
-- SCHEMA PARA ARENA GAMES - RETRO MATCHMAKER
-- Executar este script no SQL Editor do Supabase
-- ==========================================

-- Habilitar a extensão pgcrypto para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Limpar tabelas existentes para recriação limpa com chaves estrangeiras corretas
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.lobbies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Criar tabela de perfis de usuário (perfis)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    username VARCHAR(100),
    avatar_url TEXT
);

-- 2. Criar tabela de lobbies (salas de jogos)
CREATE TABLE IF NOT EXISTS public.lobbies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    game VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host_name VARCHAR(100) NOT NULL,
    host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Referencia profiles em vez de auth.users
    ip_address VARCHAR(100) NOT NULL,
    port VARCHAR(10),
    max_players INT DEFAULT 4 NOT NULL,
    active_players INT DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    password VARCHAR(50)
);

-- 3. Criar tabela de mensagens do chat das salas
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    lobby_id UUID REFERENCES public.lobbies(id) ON DELETE CASCADE NOT NULL,
    sender_name VARCHAR(100) NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Referencia profiles em vez de auth.users
    content TEXT NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso (Row Level Security)

-- Políticas para Perfis (profiles)
DROP POLICY IF EXISTS "Leitura pública para perfis" ON public.profiles;
CREATE POLICY "Leitura pública para perfis" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserção pelo próprio usuário" ON public.profiles;
CREATE POLICY "Inserção pelo próprio usuário" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Atualização pelo próprio usuário" ON public.profiles;
CREATE POLICY "Atualização pelo próprio usuário" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Políticas para lobbies (públicas para manter simplicidade no MVP)
DROP POLICY IF EXISTS "Acesso público total para lobbies" ON public.lobbies;
CREATE POLICY "Acesso público total para lobbies" ON public.lobbies
    FOR ALL USING (true) WITH CHECK (true);

-- Políticas para mensagens (públicas para manter simplicidade no MVP)
DROP POLICY IF EXISTS "Acesso público total para mensagens" ON public.messages;
CREATE POLICY "Acesso público total para mensagens" ON public.messages
    FOR ALL USING (true) WITH CHECK (true);

-- 5. Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), 
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=' || new.id::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Habilitar Realtime para as tabelas
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE public.lobbies, public.messages, public.profiles;
COMMIT;
