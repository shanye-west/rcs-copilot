// src/lib/mocks/__mocks__/app-stores.js
import { readable, writable } from 'svelte/store';
import { vi } from 'vitest';

// Mock for getStores
export const getStores = vi.fn(() => ({
	page: readable({ url: new URL('http://localhost'), params: {} }),
	navigating: readable(null),
	updated: readable(false)
}));

// Mock for page store
export const page = readable({ url: new URL('http://localhost'), params: {} });

// Mock for navigating store
export const navigating = readable(null);

// Mock for updated store (if needed by app)
export const updated = readable(false);

// If your app uses specific custom stores from $app/stores, mock them here too
// For example, if you have a session store:
// export const session = writable({ user: null });
