<script lang="ts">
	import { onMount } from 'svelte';

	// Define interfaces for type safety
	interface Player {
		player_id: string;
		team_id: string;
		username?: string;
		full_name?: string;
		scores?: Record<number, string | number>;
	}

	interface ScoreData {
		player_id: string;
		hole_number: number;
		gross_score?: number;
		net_score?: number;
	}

	// Your props
	export let teamAPlayers: Player[] = [];
	export let teamBPlayers: Player[] = [];
	export const scores: ScoreData[] = [];
	export let holes: number[] = [];
	export let isLocked = false;
	export let saveScore: (playerId: string, hole: number, value: number | null) => void;

	// Defensive: make sure arrays are never undefined and players have scores
	$: safeTeamAPlayers = teamAPlayers || [];
	$: safeTeamBPlayers = teamBPlayers || [];
	$: safeHoles = holes || [];

	// Ensure each team has at least one representative for scoring
	$: teamAPlayer1 = safeTeamAPlayers[0] || null;
	$: teamBPlayer1 = safeTeamBPlayers[0] || null;

	// Ensure each player has a scores object
	onMount(() => {
		// Initialize scores object for each player if it doesn't exist
		safeTeamAPlayers.forEach((player) => {
			if (!player.scores) {
				player.scores = {};
				safeHoles.forEach((hole) => {
					player.scores[hole] = '';
				});
			}
		});

		safeTeamBPlayers.forEach((player) => {
			if (!player.scores) {
				player.scores = {};
				safeHoles.forEach((hole) => {
					player.scores[hole] = '';
				});
			}
		});
	});

	// Safe score getters
	function getTeamAScore(hole: number): string | number {
		if (!teamAPlayer1 || !teamAPlayer1.scores) return '';
		return teamAPlayer1.scores[hole] || '';
	}
	
	function getTeamBScore(hole: number): string | number {
		if (!teamBPlayer1 || !teamBPlayer1.scores) return '';
		return teamBPlayer1.scores[hole] || '';
	}

	// Helper to determine which team is winning on a hole
	function getWinningTeam(hole: number): string | null {
		const scoreA = getTeamAScore(hole);
		const scoreB = getTeamBScore(hole);

		if (!scoreA || !scoreB) return null;

		const numA = Number(scoreA);
		const numB = Number(scoreB);

		if (isNaN(numA) || isNaN(numB)) return null;
		if (numA < numB) return 'A';
		if (numB < numA) return 'B';
		return 'tie';
	}

	// Handle score change
	function handleScoreChange(team: string, hole: number, e: Event) {
		if (isLocked) return;

		const value = (e.target as HTMLInputElement).value;
		// Allow empty string or a number between 1-12
		if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
			if (team === 'A') {
				// Create a new array with the updated player
				teamAPlayers = teamAPlayers.map(player => {
					if (player === teamAPlayers[0]) {
						// Create new scores object if it doesn't exist
						const updatedScores = { ...(player.scores || {}) };
						updatedScores[hole] = value;
						
						// Return updated player with new scores
						return {
							...player,
							scores: updatedScores
						};
					}
					return player;
				});
				
				// Save it outside of the reactive assignment
				if (teamAPlayers[0]?.player_id) {
					saveScore(
						teamAPlayers[0].player_id, 
						hole, 
						value === '' ? null : parseInt(value)
					);
				}
			} else if (team === 'B') {
				// Create a new array with the updated player
				teamBPlayers = teamBPlayers.map(player => {
					if (player === teamBPlayers[0]) {
						// Create new scores object if it doesn't exist
						const updatedScores = { ...(player.scores || {}) };
						updatedScores[hole] = value;
						
						// Return updated player with new scores
						return {
							...player,
							scores: updatedScores
						};
					}
					return player;
				});
				
				// Save it outside of the reactive assignment
				if (teamBPlayers[0]?.player_id) {
					saveScore(
						teamBPlayers[0].player_id, 
						hole, 
						value === '' ? null : parseInt(value)
					);
				}
			}
		}
	}
</script>

<div class="scoreboard overflow-x-auto">
	<div class="mb-4">
		<h2 class="text-lg font-bold">4v4 Team Scramble Scorecard</h2>
		<p class="text-sm text-gray-500">
			Each team has four players who select the best shot on each stroke, then all players play from that position.
			This format is worth 2 points for a win, 1 point for a tie.
		</p>
	</div>
	
	<table class="min-w-full border-collapse">
		<thead>
			<tr>
				<th class="sticky left-0 border bg-white px-2 py-1">Team</th>
				{#each safeHoles as hole (hole)}
					<th class="w-12 border px-2 py-1">{hole}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			<!-- Team A Row -->
			<tr class="bg-blue-50">
				<td class="sticky left-0 border bg-blue-50 px-2 py-1 font-semibold">
					Team A
					<div class="text-xs">
						{#each safeTeamAPlayers.slice(0, 4) as player, i (player.player_id)}
							{#if i > 0}, {/if}
							{player.username || `Player ${i+1}`}
						{/each}
					</div>
				</td>
				{#each safeHoles as hole (hole)}
					<td
						class="border px-1 py-1 text-center"
						class:bg-green-100={getWinningTeam(hole) === 'A'}
						class:bg-yellow-100={getWinningTeam(hole) === 'tie'}
					>
						<input
							type="text"
							class="w-full bg-transparent text-center"
							value={getTeamAScore(hole)}
							disabled={isLocked}
							on:input={(e) => handleScoreChange('A', hole, e)}
						/>
						<!-- Sync status indicator -->
						{#if typeof getSyncStatus === 'function'}
							{#if getSyncStatus(teamAPlayer1?.player_id, hole) === 'pending'}
								<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
							{:else if getSyncStatus(teamAPlayer1?.player_id, hole) === 'synced'}
								<span title="Synced" class="ml-1 text-green-600">✔️</span>
							{:else if getSyncStatus(teamAPlayer1?.player_id, hole) === 'failed'}
								<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
							{/if}
						{/if}
					</td>
				{/each}
			</tr>

			<!-- Team B Row -->
			<tr class="bg-green-50">
				<td class="sticky left-0 border bg-green-50 px-2 py-1 font-semibold">
					Team B
					<div class="text-xs">
						{#each safeTeamBPlayers.slice(0, 4) as player, i (player.player_id)}
							{#if i > 0}, {/if}
							{player.username || `Player ${i+1}`}
						{/each}
					</div>
				</td>
				{#each safeHoles as hole (hole)}
					<td
						class="border px-1 py-1 text-center"
						class:bg-green-100={getWinningTeam(hole) === 'B'}
						class:bg-yellow-100={getWinningTeam(hole) === 'tie'}
					>
						<input
							type="text"
							class="w-full bg-transparent text-center"
							value={getTeamBScore(hole)}
							disabled={isLocked}
							on:input={(e) => handleScoreChange('B', hole, e)}
						/>
						<!-- Sync status indicator -->
						{#if typeof getSyncStatus === 'function'}
							{#if getSyncStatus(teamBPlayer1?.player_id, hole) === 'pending'}
								<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
							{:else if getSyncStatus(teamBPlayer1?.player_id, hole) === 'synced'}
								<span title="Synced" class="ml-1 text-green-600">✔️</span>
							{:else if getSyncStatus(teamBPlayer1?.player_id, hole) === 'failed'}
								<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
							{/if}
						{/if}
					</td>
				{/each}
			</tr>
		</tbody>
	</table>
</div>
