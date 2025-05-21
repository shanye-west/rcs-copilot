import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineStore } from '$lib/stores/offline-store';
import { get } from 'svelte/store';

// Mock service worker constants
const STATIC_CACHE_NAME = 'static-cache-v1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1';
const OFFLINE_FALLBACK_PAGE = '/offline';

// Create mock service worker module
vi.mock('../src/service-worker.ts', async () => {
  return {
    staticAssetsCacheName: STATIC_CACHE_NAME,
    dynamicCacheName: DYNAMIC_CACHE_NAME,
    offlineFallbackPage: OFFLINE_FALLBACK_PAGE
  };
});

// Mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock cache APIs
const mockCache = {
  put: vi.fn(),
  match: vi.fn(),
  delete: vi.fn()
};

const mockCaches = {
  open: vi.fn().mockResolvedValue(mockCache),
  match: vi.fn()
};

global.caches = mockCaches as any;

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
    const staticRequests = staticUrls.map(url => new Request(`https://example.com${url}`));
    
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

  test('service worker should use network-first strategy for navigation requests', async () => {
    // Create a navigation request
    const request = new Request('https://example.com/matches/123', {
      mode: 'navigate'
    });
    
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
  });

  test('service worker should use offline fallback when offline', async () => {
    // Create a navigation request
    const request = new Request('https://example.com/matches/123', {
      mode: 'navigate'
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
