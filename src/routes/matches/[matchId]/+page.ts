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

	if (matchError || !match) {
		console.error('Match fetch error:', matchError);
		throw error(500, `Match not found: ${matchError?.message || 'No match'}`);
	}

	// Fetch teams
	const { data: teams, error: teamsError } = await supabase.from('teams').select('*');
	if (teamsError || !teams) {
		console.error('Teams fetch error:', teamsError);
		throw error(500, `Teams fetch error: ${teamsError?.message || 'No teams'}`);
	}

	// Fetch match type
	const { data: matchType, error: matchTypeError } = await supabase
		.from('match_types')
		.select('*')
		.eq('id', match.match_type_id)
		.single();
	if (matchTypeError || !matchType) {
		console.error('Match type fetch error:', matchTypeError);
		throw error(500, `Match type fetch error: ${matchTypeError?.message || 'No match type'}`);
	}

	// Fetch match players
	const { data: matchPlayers, error: matchPlayersError } = await supabase
		.from('match_players')
		.select('*')
		.eq('match_id', matchId);
	if (matchPlayersError || !matchPlayers) {
		console.error('Match players fetch error:', matchPlayersError);
		throw error(500, `Match players fetch error: ${matchPlayersError?.message || 'No match players'}`);
	}

	// Fetch player details in a separate query
	let playerDetails = [];
	if (matchPlayers && matchPlayers.length > 0) {
		const playerIds = matchPlayers.map((mp) => mp.player_id);
		const { data: players, error: playersError } = await supabase.from('players').select('*').in('id', playerIds);
		if (playersError) {
			console.error('Players fetch error:', playersError);
			throw error(500, `Players fetch error: ${playersError.message}`);
		}
		playerDetails = players || [];
	}

	// Combine match players with their details
	const enhancedMatchPlayers = matchPlayers
		? matchPlayers.map((mp) => {
				const playerDetail = playerDetails.find((p) => p.id === mp.player_id);
				return {
					...mp,
					player: playerDetail || null,
					username: playerDetail?.username || null,
					full_name: playerDetail?.full_name || null
				};
			})
		: [];

	// Find unique team IDs
	const uniqueTeamIds = [...new Set(matchPlayers?.map((mp) => mp.team_id) || [])];

	// Group players by team
	let teamAPlayers = [];
	let teamBPlayers = [];

	if (uniqueTeamIds.length >= 1) {
		const teamAId = uniqueTeamIds[0];
		teamAPlayers = enhancedMatchPlayers.filter((mp) => mp.team_id === teamAId);

		if (uniqueTeamIds.length >= 2) {
			const teamBId = uniqueTeamIds[1];
			teamBPlayers = enhancedMatchPlayers.filter((mp) => mp.team_id === teamBId);
		}
	}

	// Fetch scores for this match
	const { data: scores, error: scoresError } = await supabase.from('match_scores').select('*').eq('match_id', matchId);
	if (scoresError || !scores) {
		console.error('Scores fetch error:', scoresError);
		throw error(500, `Scores fetch error: ${scoresError?.message || 'No scores'}`);
	}

	return {
		match,
		teams,
		matchType,
		matchPlayers: enhancedMatchPlayers,
		teamAPlayers,
		teamBPlayers,
		scores
	};
};
