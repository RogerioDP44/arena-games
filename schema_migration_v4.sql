-- ==========================================
-- ARENA GAMES — Migração v4
-- Execute no SQL Editor do Supabase
-- Dashboard → SQL Editor → New query → Cole e execute
-- ==========================================

-- 1. Adicionar coluna connection_type se não existir
ALTER TABLE public.lobbies 
ADD COLUMN IF NOT EXISTS connection_type VARCHAR(50) DEFAULT 'direct_ip' NOT NULL;
