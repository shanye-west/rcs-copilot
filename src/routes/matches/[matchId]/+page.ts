import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
  const matchId = params.matchId;

  // Fetch match details
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();
  if (matchError || !match) throw error(404, 'Match not found');

  // Fetch teams
  const { data: teams } = await supabase.from('teams').select('*');

  // Fetch match type
  const { data: matchType } = await supabase
    .from('match_types')
    .select('*')
    .eq('id', match.match_type_id)
    .single();

  // Fetch players for this match
  const { data: matchPlayers } = await supabase
    .from('match_players')
    .select('*, player:player_id(*, team_id)')
    .eq('match_id', matchId);

  // Fetch scores for this match
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('match_id', matchId);

  return { match, teams, matchType, matchPlayers, scores };
};
