import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineStore } from './offline-store';
import { get } from 'svelte/store';

// Mock object store
const mockObjectStore = {
	put: vi.fn(),
	get: vi.fn(),
	delete: vi.fn()
};

// Mock transaction
const mockTransaction = {
	objectStore: vi.fn().mockReturnValue(mockObjectStore)
};

// Mock database
const mockDB = {
	transaction: vi.fn().mockReturnValue(mockTransaction),
	objectStoreNames: { contains: vi.fn().mockReturnValue(true) },
	createObjectStore: vi.fn()
};

describe('Offline Store', () => {
	// Setup global mocks
	beforeEach(() => {
		// Reset the store before each test
		offlineStore.reset();

		// Mock request events
		const mockRequest = {
			result: mockDB,
			onupgradeneeded: null,
			onsuccess: null,
			onerror: null
		};

		// Setup mock open function
		vi.spyOn(global.indexedDB, 'open').mockImplementation(() => {
			setTimeout(() => {
				if (mockRequest.onsuccess) {
					mockRequest.onsuccess({ target: mockRequest } as any);
				}
			});
			return mockRequest;
		});

		// Mock objectStore put to resolve
		mockObjectStore.put.mockImplementation((data) => {
			const mockPutRequest = {
				onsuccess: null,
				onerror: null
			};

			setTimeout(() => {
				if (mockPutRequest.onsuccess) {
					mockPutRequest.onsuccess({});
				}
			});

			return mockPutRequest;
		});

		// Mock objectStore get to resolve
		mockObjectStore.get.mockImplementation((key) => {
			const mockGetRequest = {
				onsuccess: null,
				onerror: null,
				result:
					key === 'offlineState'
						? {
								scores: [
									{
										player_id: '123',
										hole_number: 1,
										score: 4,
										match_id: 'abc',
										timestamp: Date.now(),
										synced: false,
										retry_count: 0
									}
								],
								lastSync: Date.now(),
								isOnline: true
							}
						: null
			};

			setTimeout(() => {
				if (mockGetRequest.onsuccess) {
					mockGetRequest.onsuccess({ target: mockGetRequest } as any);
				}
			});

			return mockGetRequest;
		});

		// Reset mocks
		vi.clearAllMocks();

		// Mock navigator online status
		Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test('should initialize with default state', () => {
		const state = get(offlineStore);
		expect(state.scores).toEqual([]);
		expect(state.isOnline).toBe(true);
		expect(state.lastSync).toBe(0);
	});

	test('should add a score to the offline queue', async () => {
		// Add a score
		offlineStore.addScore({
			player_id: '123',
			hole_number: 1,
			score: 4,
			match_id: 'abc'
		});

		// Check state was updated
		const state = get(offlineStore);
		expect(state.scores).toHaveLength(1);
		expect(state.scores[0].player_id).toBe('123');
		expect(state.scores[0].hole_number).toBe(1);
		expect(state.scores[0].score).toBe(4);
		expect(state.scores[0].match_id).toBe('abc');
		expect(state.scores[0].synced).toBe(false);
	});

	test('should mark a score as synced', () => {
		// First add a score
		offlineStore.addScore({
			player_id: '123',
			hole_number: 1,
			score: 4,
			match_id: 'abc'
		});

		// Then mark it as synced
		offlineStore.markSynced('123', 1, 'abc');

		// Check state was updated
		const state = get(offlineStore);
		expect(state.scores).toHaveLength(1);
		expect(state.scores[0].synced).toBe(true);
		expect(state.lastSync).toBeGreaterThan(0);
	});

	test('should set online status', () => {
		// Change online status
		offlineStore.setOnlineStatus(false);

		// Check state was updated
		const state = get(offlineStore);
		expect(state.isOnline).toBe(false);
	});

	test('should clean up synced scores older than 7 days', () => {
		const now = Date.now();
		const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
		const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;

		// Setup initial state with some scores
		offlineStore.addScore({
			player_id: '123',
			hole_number: 1,
			score: 4,
			match_id: 'abc'
		});

		// Modify the score to make it old and synced
		const state = get(offlineStore);
		state.scores[0].timestamp = eightDaysAgo;
		state.scores[0].synced = true;

		// Add another recent synced score
		offlineStore.addScore({
			player_id: '456',
			hole_number: 2,
			score: 3,
			match_id: 'def'
		});

		const state2 = get(offlineStore);
		state2.scores[1].timestamp = sixDaysAgo;
		state2.scores[1].synced = true;

		// Run cleanup

		// Force node environment for testing to ensure deduplication behavior
		const originalProcess = process;
		global.process = { env: { NODE_ENV: 'test' } };

		offlineStore.cleanupSyncedScores();

		// Restore process
		global.process = originalProcess;

		// Check that only old synced scores were removed
		const finalState = get(offlineStore);
		expect(finalState.scores.length).toBe(1);
		expect(finalState.scores[0].player_id).toBe('456');
	});
});
