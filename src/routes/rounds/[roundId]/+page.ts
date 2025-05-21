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

	return { round, matches: matches || [], matchTypes: matchTypes || [], tournament };
};
