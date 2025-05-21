// Test setup file for Vitest unit tests
import './src/test-setup.js';
import './src/lib/mocks/mock-components.js';
import { vi } from 'vitest';

// Mock IndexedDB for offline store tests
global.indexedDB = {
	open: vi.fn().mockImplementation(() => {
		const mockRequest = {
			result: {
				transaction: vi.fn().mockReturnValue({
					objectStore: vi.fn().mockReturnValue({
						put: vi.fn(),
						get: vi.fn(),
						delete: vi.fn()
					})
				}),
				objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
				createObjectStore: vi.fn()
			},
			onsuccess: null,
			onerror: null
		};
		setTimeout(() => {
			if (mockRequest.onsuccess) {
				mockRequest.onsuccess({ target: mockRequest });
			}
		}, 0);
		return mockRequest;
	}),
	deleteDatabase: vi.fn()
};

// Mock browser environment
Object.defineProperty(navigator, 'onLine', {
	writable: true,
	value: true
});

// Mock browser APIs
Object.defineProperty(global, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock localStorage
global.localStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	key: vi.fn(),
	length: 0
};

// Mock service worker globals for service worker test
global.caches = {
	open: vi.fn().mockResolvedValue({
		put: vi.fn(),
		match: vi.fn(),
		delete: vi.fn(),
		keys: vi.fn().mockResolvedValue([]),
		addAll: vi.fn()
	}),
	match: vi.fn(),
	keys: vi.fn().mockResolvedValue([]),
	delete: vi.fn().mockResolvedValue(true)
};

global.fetch = vi.fn();

// Setup browser mocks for tests
Object.defineProperty(global, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock browser APIs
global.fetch = vi.fn();
global.localStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
	key: vi.fn(),
	length: 0
};

// IndexedDB mock
global.indexedDB = {
	open: vi.fn().mockImplementation(() => ({
		result: {
			objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
			createObjectStore: vi.fn(),
			transaction: vi.fn().mockReturnValue({
				objectStore: vi.fn().mockReturnValue({
					put: vi.fn(),
					get: vi.fn(),
					delete: vi.fn()
				})
			})
		},
		onupgradeneeded: null,
		onsuccess: function (event) {
			if (typeof this.onsuccess === 'function') {
				this.onsuccess(event);
			}
		},
		onerror: null
	})),
	deleteDatabase: vi.fn()
};
