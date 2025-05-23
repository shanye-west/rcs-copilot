import type { PageLoad } from './$types';
import { error as svelteError } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export const load: PageLoad = async () => {
	// 1) Fetch the active tournament
	const { data: tournament, error: tournamentError } = await supabase
		.from('tournaments')
		.select('*')
		.eq('status', 'active')
		.single();

	if (tournamentError) {
		throw svelteError(500, tournamentError.message);
	}

	let rounds = [];
	let matches = [];
	let matchTypes = [];

	if (tournament) {
		// 2) Fetch rounds for the active tournament, ordered by round_number
		const { data: roundsData, error: roundsError } = await supabase
			.from('rounds')
			.select('*')
			.eq('tournament_id', tournament.id)
			.order('round_number', { ascending: true });

		if (roundsError) {
			throw svelteError(500, roundsError.message);
		}

		rounds = roundsData ?? [];

		// 3) Fetch matches for all those rounds
		if (rounds.length > 0) {
			const roundIds = rounds.map((r) => r.id);
			const { data: matchesData, error: matchesError } = await supabase
				.from('matches')
				.select('*')
				.in('round_id', roundIds);

			if (matchesError) {
				throw svelteError(500, matchesError.message);
			}

			matches = matchesData ?? [];
		}

		// 4) Fetch all match types for lookup
		const { data: matchTypesData, error: matchTypesError } = await supabase
			.from('match_types')
			.select('*');

		if (matchTypesError) {
			throw svelteError(500, matchTypesError.message);
		}

		matchTypes = matchTypesData ?? [];
	}

	return { tournament, rounds, matches, matchTypes };
};
