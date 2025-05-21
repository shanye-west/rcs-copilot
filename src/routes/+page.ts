import { supabase } from '$lib/supabase';

export const load = async () => {
	// Fetch the active tournament
	const { data: tournament } = await supabase
		.from('tournaments')
		.select('*')
		.eq('is_active', true)
		.single();

	let rounds = [];
	let matches = [];
	let matchTypes = [];

	if (tournament) {
		// Fetch rounds for the active tournament
		const { data: roundsData } = await supabase
			.from('rounds')
			.select('*')
			.eq('tournament_id', tournament.id)
			.order('sequence');
		rounds = roundsData || [];

		// Fetch matches for all rounds
		const roundIds = rounds.map((r) => r.id);
		if (roundIds.length > 0) {
			const { data: matchesData } = await supabase
				.from('matches')
				.select('*')
				.in('round_id', roundIds);
			matches = matchesData || [];
		}

		// Fetch all match types for lookup
		const { data: matchTypesData } = await supabase.from('match_types').select('*');
		matchTypes = matchTypesData || [];
	}

	return { tournament, rounds, matches, matchTypes };
};
