<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import Scorecard1v1 from '$lib/components/Scorecard1v1.svelte';
	import Scorecard2v2Scramble from '$lib/components/Scorecard2v2Scramble.svelte';
	import Scorecard2v2BestBall from '$lib/components/Scorecard2v2BestBall.svelte';
	import Scorecard2v2Shamble from '$lib/components/Scorecard2v2Shamble.svelte';
	import Scorecard4v4TeamScramble from '$lib/components/Scorecard4v4TeamScramble.svelte';
	import { get } from 'svelte/store';
	import { offlineStore } from '$lib/stores/offline-store';
	import { createScoreSaver, createSyncStatusChecker } from '$lib/utils/offline-integration';
	import type { Score } from '$lib/utils/scoring';

	interface User {
		id: string;
		username: string;
		fullName: string;
		isAdmin: boolean;
	}

	// Subscribe to auth store
	let authState: { user: User | null; loading: boolean; error: string | null };
	auth.subscribe((state) => {
		authState = state;
	});

	export let data;

	// Defensive destructuring - only get what we know exists in data
	const match = data.match || {};
	const teams = data.teams || [];
	const matchType = data.matchType || {};
	const matchPlayers = data.matchPlayers || [];
	const scores = data.scores || [];

	// Get raw matchPlayers data and find unique team IDs
	const uniqueTeamIds = [...new Set(matchPlayers.map((mp) => mp.team_id))];

	// Filter players by team_id - using the first two unique team IDs
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

	// Get team objects from player team_id values
	const teamA = uniqueTeamIds.length >= 1 ? teams.find((t) => t.id === uniqueTeamIds[0]) : null;
	const teamB = uniqueTeamIds.length >= 2 ? teams.find((t) => t.id === uniqueTeamIds[1]) : null;

	// For now, just show 18 holes
	const holes = Array.from({ length: 18 }, (_, i) => i + 1);

	// Helper to get score for a player/team/hole
	function getScore(playerId: string, hole: number) {
		return (
			scores.find((s) => s.player_id === playerId && s.hole_number === hole)?.gross_score ?? ''
		);
	}

	// Helper to check if match is locked
	const isLocked = match?.is_locked;

	// Initialize local score state for each player
	onMount(() => {
		for (const p of matchPlayers) {
			p.scores = {};
			for (const hole of holes) {
				p.scores[hole] = getScore(p.player_id, hole);
			}
		}
	});

	// Create helpers for offline integration
	const matchId = match?.id || '';
	const saveScoreHandler = createScoreSaver(matchId);
	const getSyncStatusHandler = createSyncStatusChecker(matchId);

	// Save score to Supabase with offline support
	async function saveScore(playerId: string, hole: number, value: number | null) {
		if (!authState?.user) return;

		// Just use our offline integration utility
		if (value !== null) {
			saveScoreHandler(playerId, hole, value);
		}

		// If we're online, also try to save directly to Supabase
		// (the offline store will handle syncing, but this gives immediate feedback)
		if (navigator.onLine) {
			try {
				const { error } = await supabase.from('match_scores').upsert({
					match_id: matchId,
					player_id: playerId,
					hole_number: hole,
					gross_score: value,
					updated_by: authState.user.id,
					updated_at: new Date().toISOString()
				});

				if (!error) {
					// Mark as synced in offline store
					offlineStore.markSynced(playerId, hole, matchId);
				}
			} catch (err) {
				console.error('Error saving score:', err);
				// offline store will retry later
			}
		}
	}

	// Helper to determine match types
	const is1v1 = matchType?.name === '1v1 Individual Match';
	const is2v2Scramble = matchType?.name === '2v2 Team Scramble';
	const is2v2BestBall = matchType?.name === '2v2 Team Best Ball';
	const is2v2Shamble = matchType?.name === '2v2 Team Shamble';
	const is4v4TeamScramble = matchType?.name === '4v4 Team Scramble';
</script>

<OfflineIndicator />

<section class="mx-auto max-w-3xl p-4">
	<h1 class="mb-2 text-2xl font-bold">{teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}</h1>
	<div class="mb-2 text-gray-600">Match Type: {matchType?.name || 'Unknown'}</div>
	<div class="mb-6 text-gray-500">Status: {match.status || 'Unknown'}</div>

	{#if is1v1}
		<Scorecard1v1
			players={[teamAPlayers[0], teamBPlayers[0]]}
			{scores}
			{holes}
			{isLocked}
			{saveScore}
			getSyncStatus={getSyncStatusHandler}
		/>
	{:else if is2v2Scramble}
		<Scorecard2v2Scramble 
			{teamAPlayers} 
			{teamBPlayers} 
			{scores} 
			{holes} 
			{isLocked} 
			{saveScore} 
			getSyncStatus={getSyncStatusHandler} 
		/>
	{:else if is2v2BestBall}
		<Scorecard2v2BestBall 
			{teamAPlayers} 
			{teamBPlayers} 
			{scores} 
			{holes} 
			{isLocked} 
			{saveScore} 
			getSyncStatus={getSyncStatusHandler} 
		/>
	{:else if is2v2Shamble}
		<Scorecard2v2Shamble 
			{teamAPlayers} 
			{teamBPlayers} 
			{scores} 
			{holes} 
			{isLocked} 
			{saveScore} 
			getSyncStatus={getSyncStatusHandler} 
		/>
	{:else if is4v4TeamScramble}
		<Scorecard4v4TeamScramble 
			{teamAPlayers} 
			{teamBPlayers} 
			{scores} 
			{holes} 
			{isLocked} 
			{saveScore} 
			getSyncStatus={getSyncStatusHandler} 
		/>
	{:else}
		<div class="p-4 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
			<h3 class="font-bold">Match Type Not Implemented</h3>
			<p>This match type ({matchType?.name || 'Unknown'}) is not yet fully implemented.</p>
		</div>
	{/if}
</section>
