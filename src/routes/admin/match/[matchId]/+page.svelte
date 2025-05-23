<!-- src/routes/matches/[matchId]/+page.svelte -->
<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount, onDestroy } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { offlineStore } from '$lib/stores/offline-store';
	import { get } from 'svelte/store';

	// Import the new enhanced scorecard
	import EnhancedScorecard from '$lib/components/EnhancedScorecard.svelte';

	export let data;

	// Reactive data
	$: match = data.match || {};
	$: teams = data.teams || [];
	$: matchType = data.matchType || {};
	$: matchPlayers = data.matchPlayers || [];
	$: scores = data.scores || [];

	// Subscribe to auth store
	let authState: any;
	const unsubscribe = auth.subscribe((state) => {
		authState = state;
	});

	// Clean up subscription
	onDestroy(unsubscribe);

	// Get raw matchPlayers data and find unique team IDs
	const uniqueTeamIds = [...new Set(matchPlayers.map((mp) => mp.team_id))];

	// Filter players by team_id
	let teamAPlayers = [];
	let teamBPlayers = [];

	if (uniqueTeamIds.length >= 1) {
		const teamAId = uniqueTeamIds[0];
		teamAPlayers = matchPlayers.filter((mp) => mp.team_id === teamAId);

		if (uniqueTeamIds.length >= 2) {
			const teamBId = uniqueTeamIds[1];
			teamBPlayers = matchPlayers.filter((mp) => mp.team_id === teamBId);
		}
	}

	// Helper to check if match is locked
	const isLocked = match?.is_locked;

	// Save score to Supabase with offline support
	async function handleScoreChange(event: CustomEvent) {
		const { playerId, hole, score } = event.detail;

		if (!authState?.user) return;

		// Determine team ID from player's team_id
		const playerEntry = matchPlayers.find((p) => p.player_id === playerId);
		if (!playerEntry) return;

		// Add to offline store first
		if (score !== null) {
			offlineStore.addScore({
				player_id: playerId,
				hole_number: hole,
				score,
				match_id: match.id
			});
		}

		// If we're online, try to save to Supabase directly
		if ($offlineStore.isOnline) {
			try {
				const { error } = await supabase.from('scores').upsert(
					[
						{
							match_id: match.id,
							player_id: playerId,
							team: playerEntry.team_id,
							hole_number: hole,
							gross_score: score
						}
					],
					{ onConflict: 'match_id,player_id,hole_number' }
				);

				if (error) {
					console.error('Error saving score:', error.message);
				} else {
					// Mark as synced in the offline store
					offlineStore.markSynced(playerId, hole, match.id);
				}
			} catch (error) {
				console.error('Failed to save score:', error);
			}
		}
	}

	// Toggle lock functionality (admin only)
	async function toggleLock() {
		if (!authState?.user?.isAdmin) return;

		try {
			const { error } = await supabase
				.from('matches')
				.update({ is_locked: !isLocked })
				.eq('id', match.id);

			if (error) {
				console.error('Error toggling match lock:', error.message);
			} else {
				// Reload the page to get updated data
				window.location.reload();
			}
		} catch (error) {
			console.error('Failed to toggle match lock:', error);
		}
	}
</script>

<svelte:head>
	<title>{match.team_a_name} vs {match.team_b_name} - Rowdy Cup</title>
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
	<!-- Admin Controls (if admin) -->
	{#if authState?.user?.isAdmin}
		<div class="border-b border-yellow-200 bg-yellow-100 p-3">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium text-yellow-800">Admin Controls</span>
				<button
					on:click={toggleLock}
					class="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-700"
				>
					{isLocked ? 'Unlock Match' : 'Lock Match'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Enhanced Scorecard -->
	<EnhancedScorecard
		{match}
		{teamAPlayers}
		{teamBPlayers}
		{scores}
		{isLocked}
		{matchType}
		on:scoreChange={handleScoreChange}
	/>
</div>
