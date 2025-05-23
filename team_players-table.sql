CREATE TABLE IF NOT EXISTS public.team_players (
  team_id UUID NOT NULL REFERENCES public.teams(id),
  player_id UUID NOT NULL REFERENCES public.players(id),
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (team_id, player_id, tournament_id)
);

COMMENT ON TABLE public.team_players IS 'Junction table to associate players with teams for a specific tournament.';
