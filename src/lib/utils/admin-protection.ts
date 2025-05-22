// Admin route protection handler for SvelteKit
import { redirect } from '@sveltejs/kit';
import type { LoadEvent } from '@sveltejs/kit';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';

/**
 * SvelteKit load function to protect admin routes
 * Only allows access if user is authenticated and has isAdmin=true
 */
export async function protectAdminRoute(event: LoadEvent) {
  const authState = get(auth);
  
  // If auth is still loading, wait briefly
  if (authState.loading) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // After waiting, get the latest auth state
  const latestAuthState = get(auth);
  
  // If user isn't authenticated or isn't an admin, redirect to login
  if (!latestAuthState.user || !latestAuthState.user.isAdmin) {
    throw redirect(302, `/login?redirectTo=${event.url.pathname}`);
  }
  
  // User is admin, allow access
  return {};
}
