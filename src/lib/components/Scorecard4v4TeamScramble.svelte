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
	export let getSyncStatus:
		| ((playerId: string | undefined, hole: number) => 'pending' | 'synced' | 'failed' | undefined)
		| undefined;

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
				teamAPlayers = teamAPlayers.map((player) => {
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
					saveScore(teamAPlayers[0].player_id, hole, value === '' ? null : parseInt(value));
				}
			} else if (team === 'B') {
				// Create a new array with the updated player
				teamBPlayers = teamBPlayers.map((player) => {
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
					saveScore(teamBPlayers[0].player_id, hole, value === '' ? null : parseInt(value));
				}
			}
		}
	}

	// Calculate match status for team points
	function getMatchStatus(): string {
		let teamAPoints = 0;
		let teamBPoints = 0;

		// In 4v4 Scramble, each hole is worth 2 points for a win, 1 point for a tie
		for (let hole of safeHoles) {
			const winner = getWinningTeam(hole);
			if (winner === 'A') teamAPoints += 2;
			else if (winner === 'B') teamBPoints += 2;
			else if (winner === 'tie') {
				teamAPoints += 1;
				teamBPoints += 1;
			}
		}

		// Return the point difference
		if (teamAPoints === teamBPoints) return 'EVEN';
		if (teamAPoints > teamBPoints) return `+${teamAPoints - teamBPoints}`;
		return `-${teamBPoints - teamAPoints}`;
	}

	// Calculate team total scores
	function getTeamTotal(team: 'A' | 'B'): number {
		let total = 0;
		for (let hole of safeHoles) {
			const score = team === 'A' ? getTeamAScore(hole) : getTeamBScore(hole);
			if (
				typeof score === 'number' ||
				(typeof score === 'string' && !isNaN(Number(score)) && score !== '')
			) {
				total += Number(score);
			}
		}
		return total;
	}
</script>

<div class="mb-4">
	<h2 class="mb-2 text-center text-lg font-bold">4v4 Team Scramble Scorecard</h2>
	<div class="mb-2 text-center text-sm text-gray-600 italic">
		Each team has four players who select the best shot on each stroke, then all players play from
		that position. This format is worth 2 points for a win, 1 point for a tie.
	</div>
	<div class="mb-2 text-center text-lg font-semibold tracking-wide text-gray-600">
		Points: <span class="inline-block rounded bg-gray-100 px-2 py-1 text-blue-700"
			>{getMatchStatus()}</span
		>
	</div>
	<div class="overflow-x-auto">
		<table class="min-w-full rounded-lg border bg-white text-base shadow">
			<thead class="bg-gray-50">
				<tr>
					<th class="sticky left-0 z-10 border bg-gray-100 px-2 py-1 text-center text-xs font-bold"
						>Hole</th
					>
					<th class="border bg-blue-50 px-2 py-1 text-center font-bold text-blue-700">
						Team A
						<div class="mt-1 text-xs">
							{#each safeTeamAPlayers.slice(0, 4) as player, i (player.player_id)}
								{#if i > 0},
								{/if}
								{player.username || `Player ${i + 1}`}
							{/each}
						</div>
					</th>
					<th class="border bg-green-50 px-2 py-1 text-center font-bold text-green-700">
						Team B
						<div class="mt-1 text-xs">
							{#each safeTeamBPlayers.slice(0, 4) as player, i (player.player_id)}
								{#if i > 0},
								{/if}
								{player.username || `Player ${i + 1}`}
							{/each}
						</div>
					</th>
					<th class="border bg-gray-100 px-2 py-1 text-center font-bold">Points</th>
				</tr>
			</thead>
			<tbody>
				{#each safeHoles as hole (hole)}
					<tr>
						<td class="sticky left-0 z-10 border bg-gray-50 px-2 py-1 text-center font-bold"
							>{hole}</td
						>

						<!-- Team A Score -->
						<td
							class="border px-2 py-1 text-center"
							class:bg-green-100={getWinningTeam(hole) === 'A'}
							class:bg-yellow-100={getWinningTeam(hole) === 'tie'}
						>
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="h-10 w-16 rounded border bg-blue-50 p-1 text-center text-lg font-semibold shadow-inner focus:bg-blue-100 focus:outline-none"
									value={getTeamAScore(hole)}
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
							{:else}
								{getTeamAScore(hole)}
							{/if}
						</td>

						<!-- Team B Score -->
						<td
							class="border px-2 py-1 text-center"
							class:bg-green-100={getWinningTeam(hole) === 'B'}
							class:bg-yellow-100={getWinningTeam(hole) === 'tie'}
						>
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="h-10 w-16 rounded border bg-green-50 p-1 text-center text-lg font-semibold shadow-inner focus:bg-green-100 focus:outline-none"
									value={getTeamBScore(hole)}
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
							{:else}
								{getTeamBScore(hole)}
							{/if}
						</td>

						<!-- Points Column -->
						<td class="border px-2 py-1 text-center font-medium">
							{#if getWinningTeam(hole) === 'A'}
								<span class="text-blue-700">A: 2 pts</span>
							{:else if getWinningTeam(hole) === 'B'}
								<span class="text-green-700">B: 2 pts</span>
							{:else if getWinningTeam(hole) === 'tie'}
								<span class="text-gray-700">Tie: 1 pt each</span>
							{/if}
						</td>
					</tr>
				{/each}

				<!-- Totals row -->
				<tr class="bg-gray-100">
					<td class="sticky left-0 z-10 border bg-gray-200 px-2 py-1 text-center font-bold"
						>Total</td
					>
					<td class="border bg-blue-200 px-2 py-1 text-center font-bold">{getTeamTotal('A')}</td>
					<td class="border bg-green-200 px-2 py-1 text-center font-bold">{getTeamTotal('B')}</td>
					<td class="border px-2 py-1 text-center font-bold">{getMatchStatus()}</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
