import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { offlineStore } from '$lib/stores/offline-store';
import { get } from 'svelte/store';
import {
	createScoreSaver,
	createSyncStatusChecker,
	loadOfflineScores,
	simulateSyncForMatch
} from './offline-integration';

// Mock offline store methods
vi.mock('$lib/stores/offline-store', () => {
	const scores = [];

	const mockStore = {
		subscribe: vi.fn((callback) => {
			callback({ scores, isOnline: true, lastSync: 0 });
			return () => {};
		}),
		addScore: vi.fn((score) => {
			scores.push({
				...score,
				timestamp: Date.now(),
				synced: false,
				retry_count: 0
			});
		}),
		markSynced: vi.fn((playerId, holeNumber, matchId) => {
			const scoreIndex = scores.findIndex(
				(s) => s.player_id === playerId && s.hole_number === holeNumber && s.match_id === matchId
			);
			if (scoreIndex >= 0) {
				scores[scoreIndex].synced = true;
			}
		})
	};

	return {
		offlineStore: mockStore,
		get: vi.fn().mockImplementation(() => ({ scores, isOnline: true, lastSync: 0 }))
	};
});

describe('Offline Integration Utils', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the scores array in the mock
		get(offlineStore).scores.length = 0;
	});

	test('createScoreSaver should add scores to offline store', () => {
		const matchId = 'match-123';
		const saveScore = createScoreSaver(matchId);

		// Save a score
		saveScore('player-1', 1, 4);

		// Verify score was added to offline store
		expect(offlineStore.addScore).toHaveBeenCalledWith({
			player_id: 'player-1',
			hole_number: 1,
			score: 4,
			match_id: matchId
		});
	});

	test('createScoreSaver should not add null scores', () => {
		const matchId = 'match-123';
		const saveScore = createScoreSaver(matchId);

		// Try to save a null score
		saveScore('player-1', 1, null);

		// Verify score was NOT added to offline store
		expect(offlineStore.addScore).not.toHaveBeenCalled();
	});

	test('createSyncStatusChecker should return correct status', () => {
		const matchId = 'match-123';
		const getSyncStatus = createSyncStatusChecker(matchId);

		// Mock offline store state with various score statuses
		get(offlineStore).scores.push(
			{
				player_id: 'player-1',
				hole_number: 1,
				match_id: matchId,
				score: 4,
				timestamp: Date.now(),
				synced: true,
				retry_count: 0
			},
			{
				player_id: 'player-1',
				hole_number: 2,
				match_id: matchId,
				score: 5,
				timestamp: Date.now(),
				synced: false,
				retry_count: 0
			},
			{
				player_id: 'player-1',
				hole_number: 3,
				match_id: matchId,
				score: 3,
				timestamp: Date.now(),
				synced: false,
				retry_count: 3
			}
		);

		// Check sync statuses
		expect(getSyncStatus('player-1', 1)).toBe('synced');
		expect(getSyncStatus('player-1', 2)).toBe('pending');
		expect(getSyncStatus('player-1', 3)).toBe('failed');
		expect(getSyncStatus('player-1', 4)).toBeUndefined();
	});

	test('simulateSyncForMatch should mark all scores as synced', () => {
		const matchId = 'match-123';

		// Add some unsynced scores
		get(offlineStore).scores.push(
			{
				player_id: 'player-1',
				hole_number: 1,
				match_id: matchId,
				score: 4,
				timestamp: Date.now(),
				synced: false,
				retry_count: 0
			},
			{
				player_id: 'player-2',
				hole_number: 1,
				match_id: matchId,
				score: 5,
				timestamp: Date.now(),
				synced: false,
				retry_count: 0
			}
		);

		// Simulate sync
		simulateSyncForMatch(matchId);

		// Verify all scores were marked as synced
		expect(offlineStore.markSynced).toHaveBeenCalledTimes(2);
		expect(offlineStore.markSynced).toHaveBeenCalledWith('player-1', 1, matchId);
		expect(offlineStore.markSynced).toHaveBeenCalledWith('player-2', 1, matchId);
	});

	test('loadOfflineScores should return all scores for a match', () => {
		const matchId = 'match-123';
		const otherMatchId = 'match-456';

		// Add scores for different matches
		get(offlineStore).scores.push(
			{
				player_id: 'player-1',
				hole_number: 1,
				match_id: matchId,
				score: 4,
				timestamp: Date.now(),
				synced: true,
				retry_count: 0
			},
			{
				player_id: 'player-2',
				hole_number: 1,
				match_id: matchId,
				score: 5,
				timestamp: Date.now(),
				synced: false,
				retry_count: 0
			},
			{
				player_id: 'player-3',
				hole_number: 1,
				match_id: otherMatchId,
				score: 3,
				timestamp: Date.now(),
				synced: false,
				retry_count: 0
			}
		);

		// Load scores for matchId
		const scores = loadOfflineScores(matchId);

		// Verify only scores for matchId were returned
		expect(scores.length).toBe(2);
		expect(scores.every((s) => s.match_id === matchId)).toBe(true);
		expect(scores.some((s) => s.player_id === 'player-3')).toBe(false);
	});
});
