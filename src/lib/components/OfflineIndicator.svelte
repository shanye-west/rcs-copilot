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
</script>

<!-- Minimal dot indicator, top right -->
<div class="fixed top-4 right-4 z-50">
	{#if !isOnline}
		<span class="block h-4 w-4 rounded-full bg-red-500 border-2 border-white shadow" title="Offline"></span>
	{:else if unsyncedCount > 0}
		<span class="block h-4 w-4 rounded-full bg-yellow-400 border-2 border-white shadow animate-pulse" title="Unsynced changes"></span>
	{:else}
		<span class="block h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow" title="Online"></span>
	{/if}
</div>
