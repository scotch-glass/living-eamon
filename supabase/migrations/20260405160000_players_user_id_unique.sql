-- One player row per auth user; allows multiple legacy rows with user_id IS NULL.
CREATE UNIQUE INDEX IF NOT EXISTS players_user_id_key ON public.players (user_id)
WHERE user_id IS NOT NULL;
