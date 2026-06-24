-- ==========================================
-- ARENA GAMES — Migração v3
-- Execute no SQL Editor do Supabase
-- Dashboard → SQL Editor → New query → Cole e execute
-- ==========================================

-- 1. Atualizar RPC: Limpeza de salas fantasma (excluir completamente para limpar banco de dados e chat)
--    Muda a ação de UPDATE is_active = false para DELETE direto.
--    O ON DELETE CASCADE configurado na tabela messages vai apagar os chats dessas salas limpas.
CREATE OR REPLACE FUNCTION public.cleanup_stale_lobbies()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    DELETE FROM public.lobbies
     WHERE is_active = TRUE
       AND created_at < NOW() - INTERVAL '4 hours';

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_stale_lobbies() TO authenticated;
