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
    
    // Add a score to the offline queue
    addScore: (score: Omit<OfflineScore, 'timestamp' | 'synced' | 'retry_count'>) => {
      update(state => {
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
      update(state => {
        const updatedScores = state.scores.map(score => {
          if (score.player_id === player_id && 
              score.hole_number === hole_number && 
              score.match_id === match_id && 
              !score.synced) {
            return { ...score, synced: true };
          }
          return score;
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
      update(state => ({ ...state, isOnline }));
      
      // If we're back online, try to sync
      if (isOnline) {
        syncWithServer();
      }
    },
    
    // Clear all synced scores that are older than 7 days
    cleanupSyncedScores: () => {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      
      update(state => {
        const filteredScores = state.scores.filter(score => {
          // Keep unsynced scores or recent synced scores
          return !score.synced || score.timestamp > sevenDaysAgo;
        });
        
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
            update(state => ({ ...state, isOnline: true }));
            syncWithServer();
          });
          
          window.addEventListener('offline', () => {
            update(state => ({ ...state, isOnline: false }));
          });
          
          // Initial online status
          update(state => ({ ...state, isOnline: navigator.onLine }));
        } catch (error) {
          console.error('Failed to initialize offline store:', error);
        }
      }
    }
  };
}

// Create and export the store
export const offlineStore = createOfflineStore();

// IndexedDB functions
async function saveToIndexedDB() {
  if (!browser) return;
  
  let state: OfflineState;
  offlineStore.subscribe(s => state = s)();
  
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['offlineData'], 'readwrite');
    const store = transaction.objectStore('offlineData');
    
    await store.put({ id: 'offlineState', ...state });
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
    
    const data = await store.get('offlineState');
    return data ? data as OfflineState : null;
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
  // Get unsynced scores
  let state: OfflineState;
  offlineStore.subscribe(s => state = s)();
  
  const unsyncedScores = state.scores.filter(score => !score.synced);
  if (unsyncedScores.length === 0) return;

  // TODO: Implement the actual server sync logic when we have the API endpoints
  // For now we'll just mark them as synced after a mock API call
  
  // This would be replaced with actual API calls
  for (const score of unsyncedScores) {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
