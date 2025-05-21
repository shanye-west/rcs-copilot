import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import OfflineIndicator from '../components/OfflineIndicator.svelte'; // Correct relative path
import { offlineStore } from '../stores/offline-store';
import { get } from 'svelte/store';
import { renderComponent } from '../mocks/svelte-test-helper';
import { tick } from 'svelte';

describe('OfflineIndicator Component', () => {
  // Use the real offlineStore, but reset its state before each test
  beforeEach(() => {
    // Reset the store to default state
    const state = get(offlineStore);
    if (state.scores.length > 0) {
      // Remove all scores by marking them as synced and running cleanup
      state.scores.forEach(score => {
        offlineStore.markSynced(score.player_id, score.hole_number, score.match_id);
      });
      offlineStore.cleanupSyncedScores && offlineStore.cleanupSyncedScores();
    }
    offlineStore.setOnlineStatus(true);
    // Optionally clear scores if needed
    // offlineStore.clearScores && offlineStore.clearScores();
  });
  
  test('displays online status when online', async () => {
    offlineStore.setOnlineStatus(true);
    render(OfflineIndicator, { props: {} });
    // Should not show Offline or Syncing
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    expect(screen.queryByText(/Syncing/)).not.toBeInTheDocument();
  });
  
  test('displays offline status when offline', async () => {
    offlineStore.setOnlineStatus(false);
    await tick();
    render(OfflineIndicator, { props: {} });
    await tick();
    expect(await screen.findByText('Offline')).toBeInTheDocument();
  });
  
  test('displays sync pending count when there are unsynced scores', async () => {
    offlineStore.setOnlineStatus(true);
    offlineStore.addScore({ player_id: 'p1', hole_number: 1, score: 4, match_id: 'm1' });
    offlineStore.addScore({ player_id: 'p2', hole_number: 2, score: 5, match_id: 'm1' });
    await tick();
    render(OfflineIndicator, { props: {} });
    await tick();
    expect(await screen.findByText('Syncing (2)')).toBeInTheDocument();
  });
  
  test('shows syncing status when online with pending changes', async () => {
    offlineStore.setOnlineStatus(true);
    offlineStore.addScore({ player_id: 'p1', hole_number: 1, score: 4, match_id: 'm1' });
    await tick();
    render(OfflineIndicator, { props: {} });
    await tick();
    expect(await screen.findByText('Syncing (1)')).toBeInTheDocument();
  });
});
