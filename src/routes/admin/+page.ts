import { protectAdminRoute } from '$lib/utils/admin-protection';
import { supabase } from '$lib/supabase';

export async function load(event) {
	// First ensure only admins can access this route
	await protectAdminRoute(event);

	// Then load data for admin tournament list
	const { data: tournaments, error } = await supabase.from('tournaments').select('*');

	return {
		tournaments: tournaments || [],
		error: error?.message || null
	};
}
