import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const roundId = params.roundId;

	// Fetch round info
	const { data: round } = await supabase.from('rounds').select('*').eq('id', roundId).single();

	if (!round) throw error(404, 'Round not found');

	// Fetch tournament info
	const { data: tournament } = await supabase
		.from('tournaments')
		.select('*')
		.eq('id', round.tournament_id)
		.single();

	// Fetch matches for this round
	const { data: matches } = await supabase.from('matches').select('*').eq('round_id', roundId);

	// Fetch all match types for lookup
	const { data: matchTypes } = await supabase.from('match_types').select('*');
	
	// If we have matches, get player information for each match
	if (matches && matches.length > 0) {
		// For each match, get the players
		for (const match of matches) {
			// Get team A players
			const { data: teamAPlayers } = await supabase
				.from('match_players')
				.select('player_id, players:player_id(full_name, username)')
				.eq('match_id', match.id)
				.eq('team_id', 'team_a');

			// Get team B players
			const { data: teamBPlayers } = await supabase
				.from('match_players')
				.select('player_id, players:player_id(full_name, username)')
				.eq('match_id', match.id)
				.eq('team_id', 'team_b');

			// Add player names to the match object
			match.team_a_players = teamAPlayers?.map(
				player => player.players?.full_name || player.players?.username || 'Unknown'
			) || [];
			
			match.team_b_players = teamBPlayers?.map(
				player => player.players?.full_name || player.players?.username || 'Unknown'
			) || [];
		}
	}

	return { round, matches: matches || [], matchTypes: matchTypes || [], tournament };
};
