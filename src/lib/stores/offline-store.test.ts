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

	test('should deduplicate scores and keep only the most recent for each player/hole/match combination', () => {
		// Simulate production environment for deduplication logic
		const originalProcess = global.process;
		global.process = { env: { NODE_ENV: 'production' } };

		const now = Date.now();
		const earlier = now - 10000;
		const muchEarlier = now - 20000;

		// Add multiple scores for the same key with different timestamps and sync status
		offlineStore.reset();
		const key = { player_id: 'p1', hole_number: 1, match_id: 'm1' };
		// Oldest unsynced
		offlineStore.addScore({ ...key, score: 4 });
		let state = get(offlineStore);
		state.scores[0].timestamp = muchEarlier;
		state.scores[0].synced = false;
		// Newer synced
		offlineStore.addScore({ ...key, score: 5 });
		state = get(offlineStore);
		state.scores[1].timestamp = earlier;
		state.scores[1].synced = true;
		// Newest unsynced
		offlineStore.addScore({ ...key, score: 6 });
		state = get(offlineStore);
		state.scores[2].timestamp = now;
		state.scores[2].synced = false;

		// Add a different key to ensure it's not affected
		offlineStore.addScore({ player_id: 'p2', hole_number: 2, match_id: 'm2', score: 7 });
		state = get(offlineStore);
		state.scores[3].timestamp = now;
		state.scores[3].synced = false;

		// Run cleanup
		offlineStore.cleanupSyncedScores();
		const finalState = get(offlineStore);

		// Only the most recent for each key should remain
		const deduped = finalState.scores.filter(s => s.player_id === 'p1' && s.hole_number === 1 && s.match_id === 'm1');
		expect(deduped).toHaveLength(1);
		expect(deduped[0].score).toBe(6);
		// The other key should still be present
		const other = finalState.scores.find(s => s.player_id === 'p2' && s.hole_number === 2 && s.match_id === 'm2');
		expect(other).toBeDefined();

		// Restore process
		global.process = originalProcess;
	});
});
