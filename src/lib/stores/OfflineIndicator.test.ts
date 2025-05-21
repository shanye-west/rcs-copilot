import { describe, test, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import OfflineIndicator from '../components/OfflineIndicator.svelte';
import { offlineStore } from '../stores/offline-store';
import { get } from 'svelte/store';

// Mock the offlineStore
vi.mock('../stores/offline-store', () => {
  const { writable } = require('svelte/store');
  
  const mockStore = writable({
    scores: [],
    lastSync: Date.now(),
    isOnline: true
  });
  
  return { 
    offlineStore: {
      ...mockStore,
      setOnlineStatus: vi.fn((status) => {
        mockStore.update(state => ({...state, isOnline: status}));
      })
    }
  };
});

describe('OfflineIndicator Component', () => {
  beforeEach(() => {
    // Reset the store to online before each test
    offlineStore.setOnlineStatus(true);
  });
  
  test('displays online status when online', () => {
    render(OfflineIndicator);
    
    // Should show online status
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    
    // Should have the online class
    const indicator = screen.getByTestId('connection-status');
    expect(indicator.classList.contains('bg-green-500')).toBe(true);
  });
  
  test('displays offline status when offline', () => {
    // Set the store to offline
    offlineStore.setOnlineStatus(false);
    
    render(OfflineIndicator);
    
    // Should show offline status
    expect(screen.getByText('Offline')).toBeInTheDocument();
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
    
    // Should have the offline class
    const indicator = screen.getByTestId('connection-status');
    expect(indicator.classList.contains('bg-red-500')).toBe(true);
  });
  
  test('displays sync pending count when there are unsynced scores', () => {
    // Update the store with some unsynced scores
    offlineStore.subscribe(state => {
      state.scores = [
        { player_id: 'p1', hole_number: 1, score: 4, match_id: 'm1', timestamp: Date.now(), synced: false, retry_count: 0 },
        { player_id: 'p2', hole_number: 2, score: 5, match_id: 'm1', timestamp: Date.now(), synced: false, retry_count: 0 },
        { player_id: 'p3', hole_number: 3, score: 3, match_id: 'm2', timestamp: Date.now(), synced: true, retry_count: 0 }
      ];
      return state;
    });
    
    render(OfflineIndicator);
    
    // Should show the pending sync count
    expect(screen.getByText('2 changes pending')).toBeInTheDocument();
  });
  
  test('shows syncing status when online with pending changes', () => {
    // Set up unsynced scores but online status
    offlineStore.setOnlineStatus(true);
    offlineStore.subscribe(state => {
      state.scores = [
        { player_id: 'p1', hole_number: 1, score: 4, match_id: 'm1', timestamp: Date.now(), synced: false, retry_count: 0 },
      ];
      return state;
    });
    
    render(OfflineIndicator);
    
    // Should show syncing status
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    
    // Should have syncing class
    const syncStatus = screen.getByTestId('sync-status');
    expect(syncStatus.classList.contains('animate-pulse')).toBe(true);
  });
  
  test('shows last sync time when all changes are synced', () => {
    // Set timestamp to a known value
    const syncTime = new Date('2025-05-21T10:30:00');
    
    offlineStore.setOnlineStatus(true);
    offlineStore.subscribe(state => {
      state.scores = [
        { player_id: 'p1', hole_number: 1, score: 4, match_id: 'm1', timestamp: syncTime.getTime(), synced: true, retry_count: 0 },
      ];
      state.lastSync = syncTime.getTime();
      return state;
    });
    
    render(OfflineIndicator);
    
    // Should show last sync time
    expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
    // The exact format depends on the locale, but should include "10:30"
    expect(screen.getByTestId('last-sync').textContent).toContain('10:30');
  });
});
