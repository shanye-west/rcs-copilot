// Tournament page for admin section - load the specific tournament details
import { protectAdminRoute } from '$lib/utils/admin-protection';
import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export async function load(event) {
	// First ensure only admins can access this route
	await protectAdminRoute(event);

	const tournamentId = event.params.tournamentId;

	// Get tournament details
	const { data: tournament, error: tournamentError } = await supabase
		.from('tournaments')
		.select('*')
		.eq('id', tournamentId)
		.single();

	if (tournamentError) {
		throw error(404, { message: 'Tournament not found' });
	}

	// Get rounds for this tournament
	const { data: rounds, error: roundsError } = await supabase
		.from('rounds')
		.select('*')
		.eq('tournament_id', tournamentId);

	return {
		tournament,
		rounds: rounds || [],
		error: roundsError?.message || null
	};
}
