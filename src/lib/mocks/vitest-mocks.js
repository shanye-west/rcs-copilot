import { vi } from 'vitest';

// Mock Supabase for all tests
export const mockSupabase = {
	from: vi.fn().mockReturnThis(),
	select: vi.fn().mockReturnThis(),
	insert: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	eq: vi.fn().mockReturnThis(),
	or: vi.fn().mockReturnThis(),
	order: vi.fn().mockResolvedValue({
		data: [],
		error: null
	}),
	channel: vi.fn().mockReturnValue({
		on: vi.fn().mockReturnThis(),
		subscribe: vi.fn().mockReturnValue({
			unsubscribe: vi.fn()
		})
	})
};

// Mock auth store
export const mockAuthStore = {
	subscribe: (cb) => {
		cb({ user: { id: 'user1', username: 'testuser' }, loading: false, error: null });
		return () => {};
	}
};

// Set up global mocks
vi.mock('$lib/supabase', () => {
	return { supabase: mockSupabase };
});

vi.mock('$lib/stores/auth', () => {
	return { auth: mockAuthStore };
});

// Mock browser APIs for service worker tests
if (typeof global !== 'undefined') {
	// Mock service worker APIs
	global.caches = {
		open: vi.fn().mockResolvedValue({
			put: vi.fn(),
			match: vi.fn(),
			delete: vi.fn(),
			keys: vi.fn(),
			addAll: vi.fn()
		}),
		match: vi.fn(),
		keys: vi.fn().mockResolvedValue([]),
		delete: vi.fn().mockResolvedValue(true)
	};

	// Mock service worker
	global.self = {
		addEventListener: vi.fn(),
		clients: {
			claim: vi.fn(),
			matchAll: vi.fn().mockResolvedValue([])
		},
		registration: {
			scope: 'https://example.com/',
			navigationPreload: {
				enable: vi.fn()
			}
		},
		skipWaiting: vi.fn(),
		waitUntil: vi.fn()
	};
}
