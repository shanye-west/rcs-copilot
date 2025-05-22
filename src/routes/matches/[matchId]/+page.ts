import { supabase } from '$lib/supabase';

export async function load({ params }) {
	const matchId = params.matchId;
	let match = null,
		teams = [],
		matchType = null,
		matchPlayers = [],
		scores = [],
		course = null;
	const errors: string[] = [];

	try {
		const { data: matchData, error: matchError } = await supabase
			.from('matches')
			.select('*')
			.eq('id', matchId)
			.single();
		if (matchError || !matchData) {
			errors.push('Failed to load match data.');
			console.error('Match fetch error:', matchError);
		} else {
			match = matchData;
		}

		const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*');
		if (teamsError) {
			errors.push('Failed to load teams.');
			console.error('Teams fetch error:', teamsError);
		} else {
			teams = teamsData || [];
		}

		const { data: matchTypeData, error: matchTypeError } = await supabase
			.from('match_types')
			.select('*')
			.eq('id', match?.match_type_id)
			.single();
		if (matchTypeError) {
			errors.push('Failed to load match type.');
			console.error('Match type fetch error:', matchTypeError);
		} else {
			matchType = matchTypeData;
		}

		const { data: matchPlayersData, error: matchPlayersError } = await supabase
			.from('match_players')
			.select('*, player:players(*)')
			.eq('match_id', matchId);
		if (matchPlayersError) {
			errors.push('Failed to load match players.');
			console.error('Match players fetch error:', matchPlayersError);
		} else {
			matchPlayers = matchPlayersData || [];
		}

		const { data: scoresData, error: scoresError } = await supabase.from('match_scores').select('*').eq('match_id', matchId);
		if (scoresError) {
			errors.push('Failed to load scores.');
			console.error('Scores fetch error:', scoresError);
		} else {
			scores = scoresData || [];
		}

		if (match?.course_id) {
			const { data: courseData, error: courseError } = await supabase
				.from('courses')
				.select('*')
				.eq('id', match.course_id)
				.single();
			if (courseError) {
				errors.push('Failed to load course.');
				console.error('Course fetch error:', courseError);
			} else {
				course = courseData;
			}
		}
	} catch (err) {
		errors.push('Unexpected error loading match data.');
		console.error('Unexpected match load error:', err);
	}

	return { match, teams, matchType, matchPlayers, scores, course, error: errors.length ? errors : null };
}
