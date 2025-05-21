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
		throw error(404, 'Match not found');
	}

	// Fetch teams
	const { data: teams } = await supabase.from('teams').select('*');

	// Fetch match type
	const { data: matchType } = await supabase
		.from('match_types')
		.select('*')
		.eq('id', match.match_type_id)
		.single();

	// Fetch match players
	const { data: matchPlayers, error: matchPlayersError } = await supabase
		.from('match_players')
		.select('*')
		.eq('match_id', matchId);

	if (matchPlayersError) {
		console.error('Error fetching match players:', matchPlayersError);
	}

	// Fetch player details in a separate query
	let playerDetails = [];
	if (matchPlayers && matchPlayers.length > 0) {
		const playerIds = matchPlayers.map((mp) => mp.player_id);

		const { data: players } = await supabase.from('players').select('*').in('id', playerIds);

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
	} // Fetch scores for this match
	const { data: scores } = await supabase.from('scores').select('*').eq('match_id', matchId);

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
