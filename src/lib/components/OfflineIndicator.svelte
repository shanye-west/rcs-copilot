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
<div class="fixed top-3 right-3 z-50">
	{#if !isOnline}
		<span class="block h-3 w-3 rounded-full bg-red-500 border-2 border-white shadow"></span>
	{:else if unsyncedCount > 0}
		<span class="block h-3 w-3 rounded-full bg-yellow-400 border-2 border-white shadow animate-pulse"></span>
	{:else}
		<span class="block h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow"></span>
	{/if}
</div>
