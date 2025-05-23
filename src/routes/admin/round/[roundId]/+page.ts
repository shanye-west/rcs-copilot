// Round admin page - load the specific round and its matches
import { protectAdminRoute } from '$lib/utils/admin-protection';
import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export async function load(event) {
	// First ensure only admins can access this route
	await protectAdminRoute(event);

	const roundId = event.params.roundId;

	// Get round details
	const { data: round, error: roundError } = await supabase
		.from('rounds')
		.select('*')
		.eq('id', roundId)
		.single();

	if (roundError) {
		throw error(404, { message: 'Round not found' });
	}

	// Get matches for this round
	const { data: matches, error: matchesError } = await supabase
		.from('matches')
		.select('*')
		.eq('round_id', roundId);

	return {
		round,
		matches: matches || [],
		error: matchesError?.message || null
	};
}
