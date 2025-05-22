<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount, onDestroy } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import Scorecard1v1 from '$lib/components/Scorecard1v1.svelte';
	import Scorecard2v2Scramble from '$lib/components/Scorecard2v2Scramble.svelte';
	import Scorecard2v2BestBall from '$lib/components/Scorecard2v2BestBall.svelte';
	import { get } from 'svelte/store';
	import { offlineStore } from '$lib/stores/offline-store';
	import MatchHeader from '$lib/components/MatchHeader.svelte';
	import EnhancedMatchScorecard from '$lib/components/EnhancedMatchScorecard.svelte'; 
	import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
	import Scorecard2v2Shamble from '$lib/components/Scorecard2v2Shamble.svelte';
	import Scorecard4v4TeamScramble from '$lib/components/Scorecard4v4TeamScramble.svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import ScorecardV2 from '$lib/components/ScorecardV2.svelte';

	interface User {
		id: string;
		username: string;
		fullName: string;
		isAdmin: boolean;
	}

	// Subscribe to auth store
	let authState: { user: User | null; loading: boolean; error: string | null };
	const unsubscribe = auth.subscribe((state) => {
		authState = state;
	});

	// Clean up subscription
	onDestroy(unsubscribe);

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
	
	// Match completion state
	let showCompletionDialog = false;
	let showEditDialog = false;
	let matchSummary = {
		teamATotal: 0,
		teamBTotal: 0,
		result: '',
		leadingTeam: '',
		matchPlayResult: ''
	};

	// Calculate current leading team and amount
	let currentLeadingTeam = null;
	let currentLeadAmount = 0;
	let currentHole = 1;

	// Initialize local score state for each player
	onMount(() => {
		for (const p of matchPlayers) {
			p.scores = {};
			for (const hole of holes) {
				p.scores[hole] = getScore(p.player_id, hole);
			}
		}
		
		// Calculate current hole and leading team/amount
		updateMatchStatus();
	});
	
	// Function to update match status
	function updateMatchStatus() {
		// Find the highest hole with any score
		const completedScores = scores.filter(
			(score) => score.gross_score !== null
		);
		
		if (completedScores.length > 0) {
			currentHole = Math.max(...completedScores.map((s) => s.hole_number));
		} else {
			currentHole = 1;
		}
		
		// Calculate leading team and amount
		// This is a simplified version - would need to be expanded based on match type
		if (completedScores.length > 0) {
			let teamAPoints = 0;
			let teamBPoints = 0;
			
			// Group scores by hole
			const holeScores = {};
			for (const score of completedScores) {
				const hole = score.hole_number;
				if (!holeScores[hole]) {
					holeScores[hole] = [];
				}
				holeScores[hole].push(score);
			}
			
			// For each hole with complete scores, determine winner
			for (const [hole, scores] of Object.entries(holeScores)) {
				const teamAScore = scores.find(s => 
					matchPlayers.find(mp => mp.player_id === s.player_id && mp.team_id === teamA?.id)
				);
				const teamBScore = scores.find(s => 
					matchPlayers.find(mp => mp.player_id === s.player_id && mp.team_id === teamB?.id)
				);
				
				if (teamAScore && teamBScore) {
					if (teamAScore.gross_score < teamBScore.gross_score) {
						teamAPoints++;
					} else if (teamBScore.gross_score < teamAScore.gross_score) {
						teamBPoints++;
					}
					// Tied scores don't add points
				}
			}
			
			// Determine leading team
			if (teamAPoints > teamBPoints) {
				currentLeadingTeam = teamA?.id;
				currentLeadAmount = teamAPoints - teamBPoints;
			} else if (teamBPoints > teamAPoints) {
				currentLeadingTeam = teamB?.id;
				currentLeadAmount = teamBPoints - teamAPoints;
			} else {
				currentLeadingTeam = null;
				currentLeadAmount = 0;
			}
		}
	}

	// Helper to get sync status for a score
	function getSyncStatus(playerId: string, hole: number): 'pending' | 'synced' | 'failed' | null {
		const state = get(offlineStore);
		const matchId = match?.id;
		if (!matchId) return null;
		const score = state.scores.find(
			(s) => s.player_id === playerId && s.hole_number === hole && s.match_id === matchId
		);
		if (!score) return null;
		if (score.synced) return 'synced';
		if (score.retry_count > 3) return 'failed';
		return 'pending';
	}

	// Save score to Supabase with offline support
	async function saveScore(playerId: string, hole: number, value: number | null) {
		if (!authState?.user) return;

		// Determine team ID from player's team_id
		const playerEntry = matchPlayers.find((p) => p.player_id === playerId);
		if (!playerEntry) return;

		// Add to offline store first (this ensures data is saved even if offline)
		offlineStore.addScore({
			player_id: playerId,
			hole_number: hole,
			score: value,
			match_id: match.id
		});

		// If we're online, try to save to Supabase directly
		if ($offlineStore.isOnline) {
			try {
				// Upsert score for this player/hole/match
				const { error } = await supabase.from('scores').upsert(
					[
						{
							match_id: match.id,
							player_id: playerId,
							team: playerEntry.team_id, // Use player's team_id directly
							hole_number: hole,
							gross_score: value !== null ? Number(value) : null
						}
					],
					{ onConflict: 'match_id,player_id,hole_number' }
				);
				
				if (error) {
					console.error('Error saving score:', error.message);
				} else {
					// Mark as synced in the offline store
					offlineStore.markSynced(playerId, hole, match.id);
					
					// Update match status
					updateMatchStatus();
					
					// Check if match should be completed
					checkMatchCompletion();
				}
			} catch (error) {
				console.error('Failed to save score:', error);
				// Score remains in offline store for later sync
			}
		}
	}
	
	// Check if match should be completed
	function checkMatchCompletion() {
		// Calculate completed holes
		const completedScores = scores.filter(
			(score) => score.gross_score !== null
		);
		
		// If all 18 holes are filled or match is clinched
		if (completedScores.length === 18 * matchPlayers.length || 
			(currentLeadAmount > 0 && currentLeadAmount > 18 - currentHole)) {
			
			// Calculate totals for the summary
			let teamATotal = 0;
			let teamBTotal = 0;
			
			for (const score of completedScores) {
				const player = matchPlayers.find(p => p.player_id === score.player_id);
				if (player) {
					if (player.team_id === teamA?.id) {
						teamATotal += score.gross_score;
					} else if (player.team_id === teamB?.id) {
						teamBTotal += score.gross_score;
					}
				}
			}
			
			// Calculate the match play result
			const matchPlayResult = currentLeadAmount > 0 
				? `${currentLeadAmount} UP` 
				: 'AS';
			
			// Set match summary data
			matchSummary = {
				teamATotal,
				teamBTotal,
				result: matchPlayResult,
				leadingTeam: currentLeadingTeam || 'tied',
				matchPlayResult
			};
			
			// Mark match as completed in Supabase
			async function completeMatch() {
				try {
					const { error } = await supabase
						.from('matches')
						.update({
							status: 'completed',
							result: matchPlayResult,
							leading_team: currentLeadingTeam,
							lead_amount: currentLeadAmount
						})
						.eq('id', match.id);
						
					if (error) {
						console.error('Error completing match:', error.message);
					} else {
						// Show completion dialog
						showCompletionDialog = true;
					}
				} catch (error) {
					console.error('Failed to complete match:', error);
				}
			}
			
			completeMatch();
		}
	}

	// Toggle lock functionality
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
				// Redirect to reload data
				window.location.reload();
			}
		} catch (error) {
			console.error('Failed to toggle match lock:', error);
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

<section class="container mx-auto max-w-4xl p-4">
	<Card>
		<div class="mb-6">
			<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
				<div>
					<h1 class="heading-lg mb-2">{teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}</h1>
					<div class="flex flex-wrap gap-3 items-center">
						<Badge variant="primary">{matchType?.name || 'Unknown'}</Badge>
						<Badge variant={match.status === 'complete' ? 'success' : match.status === 'in_progress' ? 'warning' : 'secondary'}>
							{match.status === 'complete' ? 'Completed' : match.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
						</Badge>
					</div>
				</div>
				
				{#if authState?.user?.isAdmin}
					<div class="mt-4 md:mt-0">
						<Button 
							variant={isLocked ? "danger" : "primary"} 
							size="sm" 
							on:click={toggleMatchLock}
						>
							{isLocked ? 'Unlock Match' : 'Lock Match'}
						</Button>
					</div>
				{/if}
			</div>
			
			{#if currentLeadAmount !== null}
				<div class="bg-blue-50 border border-blue-100 rounded-md p-4 mt-4">
					<div class="font-semibold text-blue-800">Match Status: {currentLeadAmount > 0 ? `${leadingTeam?.name || 'Team'} leads by ${currentLeadAmount}` : 'All Square'}</div>
					<div class="text-blue-600 text-sm mt-1">Current Hole: {currentHole}</div>
				</div>
			{/if}
		</div>

		{#if is1v1}
			<Scorecard1v1
				players={[teamAPlayers[0], teamBPlayers[0]]}
				{scores}
				{holes}
				{isLocked}
				{saveScore}
				getSyncStatus={getSyncStatus}
			/>
		{:else if is2v2Scramble}
			<Scorecard2v2Scramble {teamAPlayers} {teamBPlayers} {scores} {holes} {isLocked} {saveScore} getSyncStatus={getSyncStatus} />
		{:else if is2v2BestBall}
			<Scorecard2v2BestBall {teamAPlayers} {teamBPlayers} {scores} {holes} {isLocked} {saveScore} getSyncStatus={getSyncStatus} />
		{:else if is2v2Shamble}
			<Scorecard2v2Shamble {teamAPlayers} {teamBPlayers} {scores} {holes} {isLocked} {saveScore} getSyncStatus={getSyncStatus} />
		{:else if is4v4TeamScramble}
			<Scorecard4v4TeamScramble {teamAPlayers} {teamBPlayers} {scores} {holes} {isLocked} {saveScore} getSyncStatus={getSyncStatus} />
		{:else}
			<div class="p-4 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
				<h3 class="font-bold">Match Type Not Implemented</h3>
				<p>This match type ({matchType?.name || 'Unknown'}) is not yet fully implemented.</p>
			</div>
		{/if}
	</Card>
</section>
