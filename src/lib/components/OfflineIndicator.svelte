<script lang="ts">
	import { offlineStore } from '$lib/stores/offline-store';
	import { onMount } from 'svelte';

	// Get the offline store state
	$: isOnline = $offlineStore.isOnline;
	$: unsyncedCount = $offlineStore.scores.filter((score) => !score.synced).length;

	// Show a toast when coming back online
	let showToast = false;
	let toastMessage = '';
	let toastType = '';

	function displayToast(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;
		showToast = true;

		// Auto-hide toast after 3 seconds
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	// Watch for changes in online status
	$: {
		if (isOnline && unsyncedCount > 0) {
			displayToast(
				`You're back online. Syncing ${unsyncedCount} score${unsyncedCount === 1 ? '' : 's'}...`,
				'success'
			);
		} else if (!isOnline) {
			displayToast("You're offline. Scores will sync when reconnected.", 'error');
		}
	}

	// Check connection on mount
	onMount(() => {
		if (!isOnline && unsyncedCount > 0) {
			displayToast(
				`You're offline with ${unsyncedCount} unsynced score${unsyncedCount === 1 ? '' : 's'}.`,
				'error'
			);
		}
	});
</script>

<!-- Offline indicator that's always visible -->
<div class="fixed top-0 right-0 z-50 p-2">
	<div class="flex items-center gap-2">
		{#if !isOnline}
			<div class="flex items-center rounded bg-gray-800 px-3 py-1 text-sm text-white shadow-md">
				<span class="mr-2 h-3 w-3 rounded-full bg-red-500"></span>
				<span>Offline</span>
			</div>
		{:else if unsyncedCount > 0}
			<div class="flex items-center rounded bg-gray-800 px-3 py-1 text-sm text-white shadow-md">
				<span data-testid="sync-status" class="mr-2 h-3 w-3 animate-pulse rounded-full bg-yellow-500"></span>
				<span>Syncing ({unsyncedCount})</span>
			</div>
		{:else}
			<div class="flex items-center rounded bg-green-700 px-3 py-1 text-sm text-white shadow-md">
				<span class="mr-2 h-3 w-3 rounded-full bg-green-400"></span>
				<span>Online</span>
				<span class="ml-2 text-xs text-gray-200">Last sync: {new Date($offlineStore.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
			</div>
		{/if}
	</div>
</div>

<!-- Toast notification -->
{#if showToast}
	<div class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform">
		<div
			class={`rounded px-4 py-2 shadow-lg ${toastType === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}
		>
			{toastMessage}
		</div>
	</div>
{/if}
