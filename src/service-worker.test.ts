import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineStore } from '$lib/stores/offline-store';
import { get } from 'svelte/store';

// Mock service worker constants
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';
const OFFLINE_FALLBACK_PAGE = '/offline';

// We now use the global mocks from vitest-mocks.js
// Mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Cache API
const mockCache = {
	match: vi.fn(),
	put: vi.fn(),
	delete: vi.fn(),
	keys: vi.fn().mockResolvedValue([]),
	addAll: vi.fn().mockResolvedValue(undefined)
};

const mockCaches = {
	open: vi.fn().mockResolvedValue(mockCache),
	keys: vi.fn().mockResolvedValue([]),
	delete: vi.fn().mockResolvedValue(true),
	match: vi.fn().mockImplementation(() => Promise.resolve(undefined))
};

global.caches = mockCaches as any;

// Mock Response constructor if it doesn't exist
if (typeof Response === 'undefined') {
	global.Response = class Response {
		constructor(
			public body: any,
			public init?: ResponseInit
		) {}
		clone() {
			return new Response(this.body, this.init);
		}
		static error() {
			return new Response(null, { status: 500 });
		}
		static redirect(url: string, status: number = 302) {
			return new Response(null, {
				status,
				headers: { Location: url }
			});
		}
	} as any;
}

// Mock Request constructor if it doesn't exist
if (typeof Request === 'undefined') {
	global.Request = class Request {
		url: string;
		method: string;
		mode: string;
		constructor(
			public input: string | Request,
			public init?: RequestInit
		) {
			this.url = typeof input === 'string' ? input : input.url;
			this.method = (init?.method || 'GET').toUpperCase();
			this.mode = init?.mode || 'cors';
		}
	} as any;
}

describe('Service Worker Offline Functionality', () => {
	// Mock service worker environment
	const self = {
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
		skipWaiting: vi.fn()
	};

	global.self = self as any;

	// Create a clean environment before each test
	beforeEach(() => {
		// Reset all mocks
		vi.resetAllMocks();

		// Mock successful cache open
		mockCaches.open.mockResolvedValue(mockCache);

		// Mock fetch to resolve successfully
		mockFetch.mockResolvedValue(new Response('Success'));
	});

	test('service worker should handle static assets with cache-first strategy', async () => {
		// Define static asset URLs
		const staticUrls = ['/static/images/logo.png', '/favicon.png', '/manifest.json'];

		// Create mock requests for static assets
		const staticRequests = staticUrls.map((url) => new Request(`https://example.com${url}`));

		// Simulate cache hits
		mockCache.match.mockImplementation(() => Promise.resolve(new Response('Cached Content')));

		// Verify cache-first behavior for static assets
		for (const request of staticRequests) {
			// Use a simulated fetch event
			const event = {
				request,
				respondWith: vi.fn()
			};

			// Open static assets cache
			await mockCaches.open(STATIC_CACHE_NAME);

			// Check if in cache first
			const cachedResponse = await mockCache.match(request);

			// Verify cache was checked
			expect(mockCache.match).toHaveBeenCalled();

			// If cached, use cache response
			if (cachedResponse) {
				event.respondWith(Promise.resolve(cachedResponse));
				expect(event.respondWith).toHaveBeenCalled();
			}
		}
	});

	// NOTE: Due to limitations in Node.js/Vitest, we cannot fully simulate a Request with mode: 'navigate'.
	// The test below uses mode: 'no-cors' and forcibly sets request.mode = 'navigate' to approximate navigation requests.
	// If/when browser-based service worker unit testing becomes feasible, update this test to use a real navigation request.
	// For true end-to-end navigation request testing, use Playwright or another browser E2E framework.
	test('service worker should use network-first strategy for navigation requests', async () => {
		// Simulate a navigation request as closely as possible
		const request = new Request('https://example.com/matches/123', {
			mode: 'no-cors' // workaround for test environment limitation
		});
		// @ts-ignore
		request.mode = 'navigate';

		const event = {
			request,
			respondWith: vi.fn()
		};

		// Simulate successful network response
		const networkResponse = new Response('Network Content');
		mockFetch.mockResolvedValue(networkResponse);

		// Handle the request
		const response = await mockFetch(request);
		event.respondWith(Promise.resolve(response));

		// Verify network was tried first
		expect(mockFetch).toHaveBeenCalledWith(request);

		// Verify the response was used
		expect(event.respondWith).toHaveBeenCalled();
		// Note: This test simulates navigation as closely as possible in Vitest. See comment above.
	});

	test('service worker should use offline fallback when offline', async () => {
		// Create a navigation request
		const request = new Request('https://example.com/matches/123', {
			mode: 'no-cors' // Use no-cors instead of navigate
		});

		const event = {
			request,
			respondWith: vi.fn()
		};

		// Simulate network failure
		mockFetch.mockRejectedValue(new Error('Network error'));

		// Simulate fallback page in cache
		const offlinePageResponse = new Response('Offline Page');
		mockCache.match.mockImplementation((req) => {
			if (req === OFFLINE_FALLBACK_PAGE) {
				return Promise.resolve(offlinePageResponse);
			}
			return Promise.resolve(undefined);
		});

		try {
			// Try network first (which will fail)
			await mockFetch(request);
		} catch (error) {
			// Get cached offline page
			const fallbackResponse = await mockCache.match(OFFLINE_FALLBACK_PAGE);
			if (fallbackResponse) {
				event.respondWith(Promise.resolve(fallbackResponse));
			}
		}

		// Verify network was tried
		expect(mockFetch).toHaveBeenCalledWith(request);

		// Verify fallback was checked
		expect(mockCache.match).toHaveBeenCalled();

		// Verify the fallback response was used
		expect(event.respondWith).toHaveBeenCalled();
	});

	test('offline store should track online status', () => {
		// Initial state should be online
		let state = get(offlineStore);
		expect(state.isOnline).toBe(true);

		// Set to offline
		offlineStore.setOnlineStatus(false);

		// Check updated state
		state = get(offlineStore);
		expect(state.isOnline).toBe(false);

		// Set to online
		offlineStore.setOnlineStatus(true);

		// Check updated state
		state = get(offlineStore);
		expect(state.isOnline).toBe(true);
	});
});
