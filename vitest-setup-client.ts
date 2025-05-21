import '@testing-library/jest-dom/vitest';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';
import * as svelte from 'svelte';

// required for svelte5 + jsdom as jsdom does not support matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	enumerable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock IndexedDB for offline store tests
global.indexedDB = {
	open: vi.fn(),
	deleteDatabase: vi.fn()
};

// Mock browser environment
Object.defineProperty(navigator, 'onLine', {
	writable: true,
	value: true
});

// Mock for svelte component tests to work in a Node environment
beforeEach(() => {
	// Set up svelte.mount to avoid server render errors
	if (svelte.mount) {
		vi.spyOn(svelte, 'mount').mockImplementation(() => {
			return {
				destroy: vi.fn()
			};
		});
	}
});

// Clean up after each test
afterEach(() => {
	cleanup();
});

// add more mocks here if you need them
