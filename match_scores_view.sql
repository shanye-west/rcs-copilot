-- View: public.match_scores
-- This view aggregates scores per match/player/hole for easier querying in the app.
-- Adjust the SELECT as needed for your app's requirements.

create or replace view public.match_scores as
select
  s.id as score_id,
  s.match_id,
  s.player_id,
  s.team,
  s.hole_number,
  s.gross_score,
  s.net_score,
  s.created_at as score_created_at,
  m.round_id,
  m.tournament_id,
  p.name as player_name
from public.scores s
join public.matches m on s.match_id = m.id
join public.players p on s.player_id = p.id;

-- To drop: drop view if exists public.match_scores;
