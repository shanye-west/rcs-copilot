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

  // Fetch players for this match (include player full_name, username, team_id)
  const { data: matchPlayers } = await supabase
    .from('match_players')
    .select('*, player:player_id(id, username, full_name, team_id)')
    .eq('match_id', matchId);

  // Sort players by team and then by username for consistent display
  if (matchPlayers) {
    matchPlayers.sort((a, b) => {
      if (a.team === b.team) {
        return a.player.username.localeCompare(b.player.username);
      }
      return a.team.localeCompare(b.team);
    });
  }

  // Group players by team for easier access in the UI
  const teamAPlayers = matchPlayers ? matchPlayers.filter(mp => mp.team === 'A') : [];
  const teamBPlayers = matchPlayers ? matchPlayers.filter(mp => mp.team === 'B') : [];

  // Also return a sorted list of all players for the UI (if needed)
  const sortedPlayers = matchPlayers ? [...matchPlayers].sort((a, b) => a.player.username.localeCompare(b.player.username)) : [];

  // Fetch scores for this match
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('match_id', matchId);

  return { match, teams, matchType, matchPlayers, teamAPlayers, teamBPlayers, sortedPlayers, scores };
};
