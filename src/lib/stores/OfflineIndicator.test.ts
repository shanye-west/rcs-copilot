import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import OfflineIndicator from '../components/OfflineIndicator.svelte';
import { offlineStore } from '../stores/offline-store';
import { get } from 'svelte/store';
import { renderComponent } from '../mocks/svelte-test-helper';

// Mock the offlineStore
vi.mock('../stores/offline-store', async () => {
	const { writable } = await import('svelte/store');

	const defaultState = {
		scores: [],
		lastSync: Date.now(),
		isOnline: true
	};
	const mockStore = writable({ ...defaultState });

	return {
		offlineStore: {
			subscribe: mockStore.subscribe,
			reset: () => mockStore.set({ ...defaultState }),
			setOnlineStatus: vi.fn((status) => {
				mockStore.update((state) => ({ ...state, isOnline: status }));
			}),
			setStateForTest: (state: any) => mockStore.set(state)
		}
	};
});

describe('OfflineIndicator Component', () => {
	beforeEach(() => {
		offlineStore.setOnlineStatus(true);
		// Reset to default state
		offlineStore.reset();
	});

	test('displays online status when online', () => {
		// Set the store state before rendering
		offlineStore.setStateForTest({
			scores: [],
			lastSync: Date.now(),
			isOnline: true
		});

		render(OfflineIndicator);

		// Debug: print the rendered HTML for inspection
		// eslint-disable-next-line no-console
		console.log('Rendered HTML:', document.body.innerHTML);
		// eslint-disable-next-line no-console
		console.log('Store value:', get(offlineStore));

		// Should show online status
		expect(screen.getByText('Online')).toBeInTheDocument();
		expect(screen.queryByText('Offline')).not.toBeInTheDocument();

		// Should have the online class
		// The indicator should have a green dot (bg-green-500)
		const indicator = screen.getByText('Online').previousSibling;
		expect(indicator).toHaveClass('bg-green-500');
	});

	test('displays offline status when offline', () => {
		// Set the store state to offline before rendering
		offlineStore.setStateForTest({
			scores: [],
			lastSync: Date.now(),
			isOnline: false
		});

		render(OfflineIndicator);

		// Debug: print the rendered HTML for inspection
		// eslint-disable-next-line no-console
		console.log('Rendered HTML:', document.body.innerHTML);

		// Should show offline status
		expect(screen.getByText('Offline')).toBeInTheDocument();
		expect(screen.queryByText('Online')).not.toBeInTheDocument();

		// Should have the offline class
		const indicator = screen.getByText('Offline').previousSibling;
		expect(indicator).toHaveClass('bg-red-500');
	});

	test('displays sync pending count when there are unsynced scores', () => {
		offlineStore.setOnlineStatus(true);
		offlineStore.setStateForTest({
			scores: [
				{
					player_id: 'p1',
					hole_number: 1,
					score: 4,
					match_id: 'm1',
					timestamp: Date.now(),
					synced: false,
					retry_count: 0
				},
				{
					player_id: 'p2',
					hole_number: 2,
					score: 5,
					match_id: 'm1',
					timestamp: Date.now(),
					synced: false,
					retry_count: 0
				},
				{
					player_id: 'p3',
					hole_number: 3,
					score: 3,
					match_id: 'm2',
					timestamp: Date.now(),
					synced: true,
					retry_count: 0
				}
			],
			lastSync: Date.now(),
			isOnline: true
		});
		render(OfflineIndicator);

		// Should show the pending sync count
		expect(screen.getByText(/Syncing \(2\)/)).toBeInTheDocument();
	});

	test('shows syncing status when online with pending changes', () => {
		// Set up unsynced scores but online status
		offlineStore.setOnlineStatus(true);
		offlineStore.setStateForTest({
			scores: [
				{
					player_id: 'p1',
					hole_number: 1,
					score: 4,
					match_id: 'm1',
					timestamp: Date.now(),
					synced: false,
					retry_count: 0
				}
			],
			lastSync: Date.now(),
			isOnline: true
		});
		render(OfflineIndicator);

		// Should show syncing status
		expect(screen.getByText(/Syncing/)).toBeInTheDocument();

		// Should have syncing class
		const syncStatus = screen.getByTestId('sync-status');
		expect(syncStatus.classList.contains('animate-pulse')).toBe(true);
	});

	test('shows last sync time when all changes are synced', () => {
		// Set timestamp to a known value
		const syncTime = new Date('2025-05-21T10:30:00');
		offlineStore.setOnlineStatus(true);
		offlineStore.setStateForTest({
			scores: [
				{
					player_id: 'p1',
					hole_number: 1,
					score: 4,
					match_id: 'm1',
					timestamp: syncTime.getTime(),
					synced: true,
					retry_count: 0
				}
			],
			lastSync: syncTime.getTime(),
			isOnline: true
		});
		render(OfflineIndicator);

		// Should show last sync time
		expect(screen.getByText(/Last sync:/)).toBeInTheDocument();
		// The exact format depends on the locale, but should include "10:30"
		// (skip the getByTestId for now, just check the text)
		const lastSyncText = screen.getByText(/Last sync:/).textContent;
		expect(lastSyncText).toContain('10:30');
	});
});
