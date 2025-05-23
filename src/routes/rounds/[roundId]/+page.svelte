import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const roundId = params.roundId;

	try {
		// Fetch round info with better error handling
		const { data: round, error: roundError } = await supabase
			.from('rounds')
			.select('*')
			.eq('id', roundId)
			.single();

		if (roundError) {
			console.error('Round fetch error:', roundError);
			throw error(404, `Round not found: ${roundError.message}`);
		}

		if (!round) {
			throw error(404, 'Round not found');
		}

		// Fetch tournament info
		const { data: tournament, error: tournamentError } = await supabase
			.from('tournaments')
			.select('*')
			.eq('id', round.tournament_id)
			.single();

		if (tournamentError) {
			console.error('Tournament fetch error:', tournamentError);
		}

		// Fetch matches for this round
		const { data: matches, error: matchesError } = await supabase
			.from('matches')
			.select('*')
			.eq('round_id', roundId)
			.order('created_at', { ascending: true });

		if (matchesError) {
			console.error('Matches fetch error:', matchesError);
		}

		// Fetch all match types for lookup
		const { data: matchTypes, error: matchTypesError } = await supabase
			.from('match_types')
			.select('*');

		if (matchTypesError) {
			console.error('Match types fetch error:', matchTypesError);
		}

		// If we have matches, get player information for each match
		const matchesWithPlayers = [];
		
		if (matches && matches.length > 0) {
			for (const match of matches) {
				try {
					// Get all players for this match
					const { data: matchPlayers, error: playersError } = await supabase
						.from('match_players')
						.select(`
							player_id,
							team_id,
							players:player_id(
								id,
								full_name,
								username
							)
						`)
						.eq('match_id', match.id);

					if (playersError) {
						console.error(`Error fetching players for match ${match.id}:`, playersError);
						// Continue with empty players rather than failing
						matchesWithPlayers.push({
							...match,
							team_a_players: [],
							team_b_players: []
						});
						continue;
					}

					// Group players by team
					const teamAPlayers = [];
					const teamBPlayers = [];

					if (matchPlayers) {
						for (const mp of matchPlayers) {
							const playerName = mp.players?.full_name || mp.players?.username || 'Unknown Player';
							
							// You'll need to determine team assignment logic here
							// For now, I'll assume team_id determines the team
							if (mp.team_id && mp.team_id.includes('A') || mp.team_id.includes('aviator')) {
								teamAPlayers.push(playerName);
							} else if (mp.team_id && mp.team_id.includes('B') || mp.team_id.includes('producer')) {
								teamBPlayers.push(playerName);
							} else {
								// Default assignment if team structure is unclear
								if (teamAPlayers.length <= teamBPlayers.length) {
									teamAPlayers.push(playerName);
								} else {
									teamBPlayers.push(playerName);
								}
							}
						}
					}

					// Add player data to match
					matchesWithPlayers.push({
						...match,
						team_a_players: teamAPlayers,
						team_b_players: teamBPlayers
					});

				} catch (matchError) {
					console.error(`Error processing match ${match.id}:`, matchError);
					// Add match with empty players rather than failing
					matchesWithPlayers.push({
						...match,
						team_a_players: [],
						team_b_players: []
					});
				}
			}
		}

		return { 
			round, 
			matches: matchesWithPlayers, 
			matchTypes: matchTypes || [], 
			tournament: tournament || null,
			error: null
		};

	} catch (err) {
		console.error('Round page load error:', err);
		
		// If it's already a SvelteKit error, re-throw it
		if (err.status) {
			throw err;
		}
		
		// Otherwise, throw a generic error
		throw error(500, `Failed to load round data: ${err.message}`);
	}
};