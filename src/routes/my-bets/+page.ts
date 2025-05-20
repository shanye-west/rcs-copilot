// Protects this page so only authenticated users can access it
import { protectedRoute } from '$lib/utils/protected';

export const load = protectedRoute;
