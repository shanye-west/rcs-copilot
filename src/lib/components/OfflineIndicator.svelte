<!-- src/lib/components/OfflineIndicator.svelte -->
<script lang="ts">
	import { offlineStore } from '../stores/offline-store';
	import { get } from 'svelte/store';

	// Local state for store
	let state = get(offlineStore);
	const unsubscribe = offlineStore.subscribe((val) => {
		state = val;
	});

	// Derived values
	$: isOnline = state.isOnline;
	$: unsyncedCount = state.scores.filter((score) => !score.synced).length;
	$: failedCount = state.scores.filter((score) => score.retry_count > 2).length;

	// Get status message
	$: statusMessage = getStatusMessage();
	$: statusColor = getStatusColor();

	function getStatusMessage(): string {
		if (!isOnline && unsyncedCount > 0) {
			return `${unsyncedCount} scores saved offline`;
		}
		if (!isOnline) {
			return 'Offline - scores will sync when connected';
		}
		if (failedCount > 0) {
			return `${failedCount} scores failed to sync`;
		}
		if (unsyncedCount > 0) {
			return `Syncing ${unsyncedCount} scores...`;
		}
		return 'All scores synced';
	}

	function getStatusColor(): string {
		if (!isOnline) return 'bg-yellow-500';
		if (failedCount > 0) return 'bg-red-500';
		if (unsyncedCount > 0) return 'bg-blue-500';
		return 'bg-green-500';
	}

	let showDetails = false;
</script>

<!-- Main indicator -->
<div class="fixed top-4 right-4 z-50">
	<button
		on:click={() => (showDetails = !showDetails)}
		class="flex items-center space-x-2 {statusColor} rounded-full px-3 py-2 text-sm font-medium text-white shadow-lg transition-all hover:scale-105"
	>
		<div class="h-2 w-2 rounded-full bg-white {unsyncedCount > 0 ? 'animate-pulse' : ''}"></div>
		<span class="hidden sm:inline">{statusMessage}</span>
		<span class="sm:hidden">
			{#if !isOnline}📱{:else if failedCount > 0}⚠️{:else if unsyncedCount > 0}🔄{:else}✓{/if}
		</span>
	</button>

	<!-- Details popup -->
	{#if showDetails}
		<div
			class="absolute top-12 right-0 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-2xl"
		>
			<div class="mb-3">
				<h3 class="mb-1 font-semibold text-gray-800">Sync Status</h3>
				<p class="text-sm text-gray-600">{statusMessage}</p>
			</div>

			{#if state.scores.length > 0}
				<div class="max-h-40 space-y-2 overflow-y-auto">
					{#each state.scores.slice(-5) as score}
						<div class="flex items-center justify-between rounded-lg bg-gray-50 p-2 text-xs">
							<span>Hole {score.hole_number}: {score.score}</span>
							<div class="flex items-center space-x-1">
								{#if score.synced}
									<span class="text-green-600">✓</span>
								{:else if score.retry_count > 2}
									<span class="text-red-600">⚠️</span>
								{:else}
									<span class="animate-spin text-blue-600">🔄</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				{#if state.scores.length > 5}
					<div class="mt-2 text-center text-xs text-gray-500">
						Showing latest 5 of {state.scores.length} scores
					</div>
				{/if}
			{:else}
				<div class="py-4 text-center text-sm text-gray-500">No scores recorded yet</div>
			{/if}

			<div class="mt-3 border-t border-gray-100 pt-3">
				<div class="flex justify-between text-xs text-gray-500">
					<span>Connection: {isOnline ? 'Online' : 'Offline'}</span>
					<span>Last sync: {new Date(state.lastSync).toLocaleTimeString()}</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if showDetails}
	<div
		class="fixed inset-0 z-40"
		on:click={() => (showDetails = false)}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && (showDetails = false)}
	></div>
{/if}

<style>
	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
