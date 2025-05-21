import { redirect, type RequestEvent } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export async function protectedRoute(event: RequestEvent) {
	const { locals, url } = event;

	// Check if user is authenticated
	const { data } = await supabase.auth.getSession();

	if (!data.session) {
		// Redirect to login with the requested URL as a redirect parameter
		const redirectTo = encodeURIComponent(url.pathname + url.search);
		throw redirect(303, `/login?redirect=${redirectTo}`);
	}

	return {
		userId: data.session.user.id
	};
}

export async function adminRoute(event: RequestEvent) {
	// First verify they're authenticated
	const { userId } = await protectedRoute(event);

	// Then check if they're an admin
	const { data, error } = await supabase
		.from('players')
		.select('is_admin')
		.eq('id', userId)
		.single();

	if (error || !data || !data.is_admin) {
		// Not an admin, redirect to home
		throw redirect(303, '/');
	}

	return { userId, isAdmin: true };
}
