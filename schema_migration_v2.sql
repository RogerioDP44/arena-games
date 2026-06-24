-- ==========================================
-- ARENA GAMES — Migração v2
-- Execute no SQL Editor do Supabase
-- Dashboard → SQL Editor → New query → Cole e execute
-- ==========================================

-- 1. COLUNA has_password (flag segura — a senha real NUNCA vai ao cliente)
ALTER TABLE public.lobbies
    ADD COLUMN IF NOT EXISTS has_password BOOLEAN NOT NULL DEFAULT FALSE;

-- Sincronizar com dados existentes
UPDATE public.lobbies
SET has_password = (password IS NOT NULL AND password <> '');

-- 2. RPC: Verificação de senha server-side
--    O cliente chama esta função. A senha real fica dentro do Postgres.
CREATE OR REPLACE FUNCTION public.verify_lobby_password(
    lobby_id         UUID,
    entered_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    stored TEXT;
BEGIN
    SELECT password INTO stored
      FROM public.lobbies
     WHERE id = lobby_id AND is_active = TRUE;

    IF stored IS NULL OR stored = '' THEN
        RETURN TRUE; -- Sala sem senha = acesso livre
    END IF;

    RETURN stored = entered_password;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_lobby_password(UUID, TEXT) TO authenticated;

-- 3. RPC: Limpeza de salas fantasma (inativas há mais de 4 horas)
CREATE OR REPLACE FUNCTION public.cleanup_stale_lobbies()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE public.lobbies
       SET is_active = FALSE
     WHERE is_active = TRUE
       AND created_at < NOW() - INTERVAL '4 hours';

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_stale_lobbies() TO authenticated;
