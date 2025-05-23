<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { supabase } from '$lib/supabase';
	import { offlineStore, type OfflineScore } from '$lib/stores/offline-store';
	import Scorecard1v1 from '$lib/components/Scorecard1v1.svelte';
	import Scorecard2v2BestBall from '$lib/components/Scorecard2v2BestBall.svelte';
	import Scorecard2v2Scramble from '$lib/components/Scorecard2v2Scramble.svelte';
	import Scorecard2v2Shamble from '$lib/components/Scorecard2v2Shamble.svelte';
	import Scorecard4v4TeamScramble from '$lib/components/Scorecard4v4TeamScramble.svelte';

	export let data: {
		match: any;
		teams: any[];
		matchType: any;
		matchPlayers: any[];
		scores: any[];
		course: any;
		error: string[] | null;
	};

	// Type definitions
	interface PlayerScore {
		[key: number]: string | number;
	}

	interface PlayerScores {
		[key: string]: PlayerScore;
	}

	interface AuthState {
		user: {
			id: string;
			email: string;
			isAdmin?: boolean;
		} | null;
	}

	// Reactive data
	$: match = data.match || {};
	$: teams = data.teams || [];
	$: matchType = data.matchType || {};
	$: matchPlayers = data.matchPlayers || [];
	$: scores = data.scores || [];
	$: roundData = data.course || {}; // Changed from data.round to data.course

	// Local state
	let playerScores: PlayerScores = {};
	let currentHole = 1;
	let matchStatus = 'ALL SQUARE';
	let showModal = false;
	let completionDetails = {
		result: '',
		winnerTeamId: '',
		isTied: false
	};

	// Subscribe to auth store
	let authState: any;
	const unsubscribe = auth.subscribe((state) => {
		authState = state;
	});

	// Get team players
	const uniqueTeamIds = [...new Set(matchPlayers.map((mp) => mp.team_id))];
	$: teamAPlayers = matchPlayers.filter((mp) => mp.team_id === uniqueTeamIds[0]);
	$: teamBPlayers = matchPlayers.filter((mp) => mp.team_id === uniqueTeamIds[1]);

	// Helper to check if match is locked
	$: isLocked = match?.is_locked;

	// Par values for holes (simplified - normally would come from course data)
	const parValues: { [key: number]: { par: number; handicap: number } } = {
		1: { par: 4, handicap: 14 },
		2: { par: 4, handicap: 4 },
		3: { par: 3, handicap: 16 },
		4: { par: 5, handicap: 8 },
		5: { par: 4, handicap: 12 },
		6: { par: 4, handicap: 2 },
		7: { par: 5, handicap: 10 },
		8: { par: 3, handicap: 18 },
		9: { par: 4, handicap: 6 },
		10: { par: 4, handicap: 13 },
		11: { par: 5, handicap: 3 },
		12: { par: 3, handicap: 17 },
		13: { par: 4, handicap: 9 },
		14: { par: 4, handicap: 5 },
		15: { par: 5, handicap: 7 },
		16: { par: 3, handicap: 15 },
		17: { par: 4, handicap: 11 },
		18: { par: 4, handicap: 1 }
	};

	// Define all holes
	const allHoles = Array.from({ length: 18 }, (_, i) => i + 1);
	$: frontNine = allHoles.slice(0, 9);
	$: backNine = allHoles.slice(9, 18);
	$: holes =
		match.format_id === 'shotgun' ? allHoles : currentTab === 'front' ? frontNine : backNine;
	let currentTab = 'front'; // 'front' or 'back'

	onMount(() => {
		// Initialize player scores
		[...teamAPlayers, ...teamBPlayers].forEach((player) => {
			if (player.player_id) {
				playerScores[player.player_id] = {};
				for (let hole = 1; hole <= 18; hole++) {
					const existingScore = scores.find(
						(s) => s.player_id === player.player_id && s.hole_number === hole
					);
					playerScores[player.player_id][hole] = existingScore?.gross_score || '';
				}
			}
		});

		// Determine current tab based on existing scores
		if (scores.length > 0) {
			const lastScoreHole = Math.max(...scores.map((s) => s.hole_number));
			currentTab = lastScoreHole > 9 ? 'back' : 'front';
		}

		// Calculate initial match status
		updateMatchStatus();
	});

	// Calculate match status based on scores
	function updateMatchStatus() {
		// This will be implemented based on the match type
		if (matchType.id === '1v1') {
			const teamAPlayer = teamAPlayers[0];
			const teamBPlayer = teamBPlayers[0];

			let teamAUp = 0;
			let teamBUp = 0;

			allHoles.forEach((hole) => {
				if (teamAPlayer?.player_id && teamBPlayer?.player_id) {
					const scoreA = playerScores[teamAPlayer.player_id]?.[hole];
					const scoreB = playerScores[teamBPlayer.player_id]?.[hole];

					if (scoreA && scoreB) {
						if (Number(scoreA) < Number(scoreB)) teamAUp++;
						else if (Number(scoreB) < Number(scoreA)) teamBUp++;
					}
				}
			});

			if (teamAUp === teamBUp) {
				matchStatus = 'ALL SQUARE';
			} else if (teamAUp > teamBUp) {
				matchStatus = `AVIATORS ${teamAUp - teamBUp} UP`;
			} else {
				matchStatus = `PRODUCERS ${teamBUp - teamAUp} UP`;
			}
		}
		// Additional logic for other match types
	}

	// Save score function
	async function saveScore(playerId: string, hole: number, score: number | null): Promise<void> {
		if (!authState?.user || isLocked) return;

		if (playerScores[playerId]) {
			playerScores[playerId][hole] = score ?? '';
		}

		const playerEntry = matchPlayers.find((p) => p.player_id === playerId);
		if (!playerEntry) return;

		// Add to offline store first
		if (score !== null) {
			offlineStore.addScore({
				player_id: playerId,
				hole_number: hole,
				score: Number(score),
				match_id: match.id
			});
		}

		// If online, save to Supabase
		if ($offlineStore.isOnline) {
			try {
				const { error } = await supabase.from('scores').upsert(
					[
						{
							match_id: match.id,
							player_id: playerId,
							team: playerEntry.team_id,
							hole_number: hole,
							gross_score: score ? Number(score) : null
						}
					],
					{ onConflict: 'match_id,player_id,hole_number' }
				);

				if (error) {
					console.error('Error saving score:', error.message);
				} else {
					offlineStore.markSynced(playerId, hole, match.id);
					updateMatchStatus();
				}
			} catch (error) {
				console.error('Failed to save score:', error);
			}
		}
	}

	// Get sync status for a score
	function getSyncStatus(
		playerId: string | undefined,
		hole: number
	): 'pending' | 'synced' | 'failed' | undefined {
		if (!playerId || !hole) return undefined;
		const status = $offlineStore.scores.find(
			(s: OfflineScore) =>
				s.player_id === playerId && s.hole_number === hole && s.match_id === match.id
		);

		if (!status) return undefined;
		if (status.synced) return 'synced';
		if (status.retry_count > 2) return 'failed';
		return 'pending';
	}

	// Calculate totals
	function calculateTotal(holes: number[]): number {
		return holes.reduce((sum: number, hole: number) => {
			const par = parValues[hole]?.par || 4;
			return sum + par;
		}, 0);
	}

	// Toggle lock status of match
	async function toggleLock(): Promise<void> {
		try {
			const { error } = await supabase
				.from('matches')
				.update({ is_locked: !isLocked })
				.eq('id', match.id);

			if (error) throw error;
			match.is_locked = !isLocked;
		} catch (error) {
			console.error('Error toggling lock status:', error);
		}
	}

	// Open completion modal
	function openCompletionModal(): void {
		showModal = true;
	}

	// Close completion modal
	function closeCompletionModal(): void {
		showModal = false;
	}

	// Complete match
	async function completeMatch(): Promise<void> {
		try {
			const result = completionDetails.isTied
				? 'Tied'
				: `${completionDetails.winnerTeamId === uniqueTeamIds[0] ? 'Team A' : 'Team B'} wins`;

			const { error } = await supabase
				.from('matches')
				.update({
					is_completed: true,
					result,
					winner_team_id: completionDetails.isTied ? null : completionDetails.winnerTeamId
				})
				.eq('id', match.id);

			if (error) throw error;
			match.is_completed = true;
			match.result = result;
			showModal = false;
		} catch (error) {
			console.error('Error completing match:', error);
		}
	}

	// Render the appropriate scorecard based on match type
	function renderScorecard() {
		if (!matchType.id) return null;

		switch (matchType.id) {
			case '1v1':
				return Scorecard1v1;
			case '2v2-best-ball':
				return Scorecard2v2BestBall;
			case '2v2-scramble':
				return Scorecard2v2Scramble;
			case '2v2-shamble':
				return Scorecard2v2Shamble;
			case '4v4-team-scramble':
				return Scorecard4v4TeamScramble;
			default:
				return Scorecard1v1;
		}
	}

	$: ScorecardComponent = renderScorecard();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-6">
		<!-- Back Navigation -->
		<div class="mb-6">
			<a
				href="/rounds/{match.round_id}"
				class="flex items-center font-medium text-blue-600 hover:text-blue-700"
			>
				<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				Back to Round
			</a>
		</div>

		<!-- Match Header -->
		<div class="mb-6 rounded-lg bg-gray-800 p-6 text-white">
			<h1 class="mb-2 text-2xl font-bold">{match.name || `Match ${match.id}`}</h1>
			<div class="text-gray-300">
				<div>{matchType?.name || 'Match'} • {roundData?.name || 'Round'}</div>
			</div>
		</div>

		<!-- Team Display -->
		<div class="mb-6">
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="grid grid-cols-2 gap-8">
					<!-- Aviators -->
					<div class="text-center">
						<div class="mb-2 flex items-center justify-center">
							<div class="mr-3 h-6 w-6 rounded-full bg-blue-900"></div>
							<span class="font-bold text-gray-900">AVIATORS</span>
						</div>
						<div class="space-y-1 text-gray-700">
							{#each teamAPlayers as player}
								<div>{player.player?.username || player.username || 'Player'}</div>
							{/each}
						</div>
					</div>

					<!-- Producers -->
					<div class="text-center">
						<div class="mb-2 flex items-center justify-center">
							<div class="mr-3 h-6 w-6 rounded-full bg-red-700"></div>
							<span class="font-bold text-gray-900">PRODUCERS</span>
						</div>
						<div class="space-y-1 text-gray-700">
							{#each teamBPlayers as player}
								<div>{player.player?.username || player.username || 'Player'}</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Match Status -->
		<div class="mb-6 text-center">
			<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div class="text-2xl font-bold text-gray-900">{matchStatus}</div>
				<div class="text-gray-500">Hole {currentHole}</div>
			</div>
		</div>

		<!-- Hole Selection Tabs -->
		{#if !match.format_id || match.format_id !== 'shotgun'}
			<div class="mb-4 flex overflow-hidden rounded-lg border">
				<button
					class="flex-1 px-4 py-2 text-center font-medium transition-colors"
					class:bg-blue-600={currentTab === 'front'}
					class:text-white={currentTab === 'front'}
					class:bg-gray-200={currentTab !== 'front'}
					class:text-gray-700={currentTab !== 'front'}
					on:click={() => (currentTab = 'front')}
				>
					Front Nine
				</button>
				<button
					class="flex-1 px-4 py-2 text-center font-medium transition-colors"
					class:bg-blue-600={currentTab === 'back'}
					class:text-white={currentTab === 'back'}
					class:bg-gray-200={currentTab !== 'back'}
					class:text-gray-700={currentTab !== 'back'}
					on:click={() => (currentTab = 'back')}
				>
					Back Nine
				</button>
			</div>
		{/if}

		<!-- Dynamic Scorecard -->
		{#if matchType.id === '4v4-team-scramble'}
			<Scorecard4v4TeamScramble
				{teamAPlayers}
				{teamBPlayers}
				{holes}
				{isLocked}
				{saveScore}
				{getSyncStatus}
			/>
		{:else if matchType.id === '2v2-best-ball'}
			<Scorecard2v2BestBall
				{teamAPlayers}
				{teamBPlayers}
				{scores}
				{holes}
				{isLocked}
				{saveScore}
				{getSyncStatus}
			/>
		{:else if matchType.id === '2v2-scramble'}
			<Scorecard2v2Scramble
				{teamAPlayers}
				{teamBPlayers}
				{holes}
				{isLocked}
				{saveScore}
				{getSyncStatus}
			/>
		{:else if matchType.id === '2v2-shamble'}
			<Scorecard2v2Shamble
				{teamAPlayers}
				{teamBPlayers}
				{holes}
				{isLocked}
				{saveScore}
				{getSyncStatus}
			/>
		{:else}
			<Scorecard1v1
				players={[...teamAPlayers, ...teamBPlayers]}
				{scores}
				{holes}
				{isLocked}
				saveScore={(playerId, hole, value) => saveScore(playerId, hole, value)}
			/>
		{/if}

		<!-- Admin Controls -->
		{#if authState?.user?.isAdmin}
			<div class="mt-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<span class="text-sm font-medium text-gray-700">Admin Controls</span>
					<div class="flex gap-2">
						<button
							class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
							on:click={toggleLock}
						>
							{isLocked ? 'Unlock Match' : 'Lock Match'}
						</button>
						<button
							class="rounded-lg bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700"
							on:click={openCompletionModal}
							disabled={isLocked}
						>
							Complete Match
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Completion Modal -->
{#if showModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6">
			<h2 class="mb-4 text-xl font-bold">Complete Match</h2>
			<p class="mb-4 text-gray-700">Select the match result:</p>

			<div class="mb-4">
				<label class="mb-2 flex items-center">
					<input
						type="radio"
						name="result"
						value="aviators"
						checked={completionDetails.winnerTeamId === uniqueTeamIds[0]}
						on:change={() => {
							completionDetails.winnerTeamId = uniqueTeamIds[0];
							completionDetails.isTied = false;
						}}
						class="mr-2"
					/>
					Aviators Win
				</label>

				<label class="mb-2 flex items-center">
					<input
						type="radio"
						name="result"
						value="producers"
						checked={completionDetails.winnerTeamId === uniqueTeamIds[1]}
						on:change={() => {
							completionDetails.winnerTeamId = uniqueTeamIds[1];
							completionDetails.isTied = false;
						}}
						class="mr-2"
					/>
					Producers Win
				</label>

				<label class="flex items-center">
					<input
						type="radio"
						name="result"
						value="tie"
						checked={completionDetails.isTied}
						on:change={() => {
							completionDetails.isTied = true;
							completionDetails.winnerTeamId = '';
						}}
						class="mr-2"
					/>
					Match Tied
				</label>
			</div>

			<div class="flex justify-end space-x-3">
				<button
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
					on:click={closeCompletionModal}
				>
					Cancel
				</button>
				<button
					class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					on:click={completeMatch}
				>
					Complete Match
				</button>
			</div>
		</div>
	</div>
{/if}
