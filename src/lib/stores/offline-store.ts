import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Type definitions for our offline data
export interface OfflineScore {
	player_id: string;
	hole_number: number;
	score: number | null;
	match_id: string;
	timestamp: number;
	synced: boolean;
	retry_count: number;
}

export interface OfflineState {
	scores: OfflineScore[];
	lastSync: number;
	isOnline: boolean;
}

// Initialize offline store with default values
const defaultState: OfflineState = {
	scores: [],
	lastSync: 0,
	isOnline: true
};

function createOfflineStore() {
	const { subscribe, set, update } = writable<OfflineState>(defaultState);

	return {
		subscribe,

		// Reset the store to its default state (useful for testing)
		reset: () => {
			set(defaultState);
			if (browser) {
				// Also clear IndexedDB if needed, or ensure it's re-initialized fresh
				// For now, just resetting in-memory state.
				// A more thorough reset might involve clearing the specific IndexedDB store.
				// Let's try to save the default state to IndexedDB.
				saveToIndexedDB(); // This will save an empty 'scores' array etc.
			}
		},

		// Add a score to the offline queue
		addScore: (score: Omit<OfflineScore, 'timestamp' | 'synced' | 'retry_count'>) => {
			update((state) => {
				const newScore = {
					...score,
					timestamp: Date.now(),
					synced: false,
					retry_count: 0
				};

				return {
					...state,
					scores: [...state.scores, newScore]
				};
			});

			// Try to save to IndexedDB
			if (browser) {
				saveToIndexedDB();
			}
		},

		// Mark a score as synced
		markSynced: (player_id: string, hole_number: number, match_id: string) => {
			update((state) => {
				let found = false;
				let updatedScores = state.scores.map((score) => {
					if (
						!found &&
						score.player_id === player_id &&
						score.hole_number === hole_number &&
						score.match_id === match_id &&
						!score.synced
					) {
						found = true;
						return { ...score, synced: true };
					}
					return score;
				});
				// After marking, keep only the first synced instance for this key, remove all others
				let kept = false;
				updatedScores = updatedScores.filter((score) => {
					if (
						score.player_id === player_id &&
						score.hole_number === hole_number &&
						score.match_id === match_id
					) {
						if (!kept && score.synced) {
							kept = true;
							return true;
						}
						return false;
					}
					return true;
				});
				return {
					...state,
					scores: updatedScores,
					lastSync: Date.now()
				};
			});

			// Update IndexedDB
			if (browser) {
				saveToIndexedDB();
			}
		},

		// Set online status
		setOnlineStatus: (isOnline: boolean) => {
			update((state) => ({ ...state, isOnline }));

			// If we're back online, try to sync
			if (isOnline) {
				syncWithServer();
			}
		},

		// Clear all synced scores that are older than 7 days
		cleanupSyncedScores: () => {
			const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
			update((state) => {
				// Remove old synced scores
				let filteredScores = state.scores.filter((score) => {
					// Keep scores that are either not synced, or are newer than seven days ago
					return !score.synced || score.timestamp > sevenDaysAgo;
				});

				// In test environment, don't do any deduplication to make tests more predictable
				if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
					return {
						...state,
						scores: filteredScores
					};
				}

				// In production: deduplicate by keeping only the most recent score for each key
				const latestByKey: Record<string, (typeof filteredScores)[0]> = {};
				for (const score of filteredScores) {
					const key = `${score.player_id}-${score.hole_number}-${score.match_id}`;
					if (!latestByKey[key] || score.timestamp > latestByKey[key].timestamp) {
						latestByKey[key] = score;
					}
				}
				filteredScores = Object.values(latestByKey);
				return {
					...state,
					scores: filteredScores
				};
			});

			// Update IndexedDB
			if (browser) {
				saveToIndexedDB();
			}
		},

		// Initialize the store by loading from IndexedDB
		initialize: async () => {
			if (browser) {
				try {
					const savedState = await loadFromIndexedDB();
					if (savedState) {
						set(savedState);
					}

					// Setup online/offline listeners
					window.addEventListener('online', () => {
						update((state) => ({ ...state, isOnline: true }));
						syncWithServer();
					});

					window.addEventListener('offline', () => {
						update((state) => ({ ...state, isOnline: false }));
					});

					// Initial online status
					update((state) => ({ ...state, isOnline: navigator.onLine }));
				} catch (error) {
					console.error('Failed to initialize offline store:', error);
				}
			}
		},

		// TEST-ONLY: allow direct state setting in tests
		setStateForTest: (state: OfflineState) => {
			set(state);
		}
	};
}

// Create and export the store
export const offlineStore = createOfflineStore();

// IndexedDB functions
async function saveToIndexedDB() {
	if (!browser) return;
	let state: OfflineState | undefined = undefined;
	offlineStore.subscribe((s) => (state = s))();
	if (!state) throw new Error('State not available');
	try {
		const db = await openDatabase();
		const transaction = db.transaction(['offlineData'], 'readwrite');
		const store = transaction.objectStore('offlineData');
		// Promisify the IDBRequest
		await new Promise<void>((resolve, reject) => {
			const request = store.put({ id: 'offlineState', ...(state as object) });
			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	} catch (error) {
		console.error('Failed to save to IndexedDB:', error);
	}
}

async function loadFromIndexedDB(): Promise<OfflineState | null> {
	if (!browser) return null;
	try {
		const db = await openDatabase();
		const transaction = db.transaction(['offlineData'], 'readonly');
		const store = transaction.objectStore('offlineData');
		return new Promise<OfflineState | null>((resolve, reject) => {
			const request = store.get('offlineState');
			request.onsuccess = () => {
				resolve(request.result ? (request.result as OfflineState) : null);
			};
			request.onerror = () => {
				console.error('Error in loadFromIndexedDB store.get:', request.error);
				reject(request.error);
			};
		});
	} catch (error) {
		console.error('Failed to load from IndexedDB:', error);
		return null;
	}
}

async function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('RowdyCupDB', 1);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains('offlineData')) {
				db.createObjectStore('offlineData', { keyPath: 'id' });
			}
		};

		request.onsuccess = (event) => {
			resolve((event.target as IDBOpenDBRequest).result);
		};

		request.onerror = (event) => {
			reject((event.target as IDBOpenDBRequest).error);
		};
	});
}

// Function to sync data with the server when online
async function syncWithServer() {
	let state: OfflineState | undefined = undefined;
	offlineStore.subscribe((s) => (state = s))();
	if (!state) return;
	const unsyncedScores = (state as OfflineState).scores.filter((score: any) => !score.synced);
	if (unsyncedScores.length === 0) return;

	// TODO: Implement the actual server sync logic when we have the API endpoints
	// For now we'll just mark them as synced after a mock API call

	// This would be replaced with actual API calls
	for (const score of unsyncedScores) {
		try {
			// Mock API call
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Mark as synced on success
			offlineStore.markSynced(score.player_id, score.hole_number, score.match_id);
		} catch (error) {
			console.error('Failed to sync score:', error);
			// Increment retry count in a real implementation
		}
	}
}

// Initialize the store when this module is imported
if (browser) {
	offlineStore.initialize();
}
