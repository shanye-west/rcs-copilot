<script lang="ts">
	import { onMount } from 'svelte';

	// Define interfaces for type safety
	interface Player {
		player_id: string;
		team_id: string;
		username?: string;
		full_name?: string;
		player?: {
			id: string;
			username: string;
			handicap?: number;
			handicap_strokes?: number[];
		};
		scores?: Record<number, string | number>;
	}

	interface ScoreData {
		player_id: string;
		hole_number: number;
		gross_score?: number;
		net_score?: number;
	}

	// Props
	export let teamAPlayers: Player[] = [];
	export let teamBPlayers: Player[] = [];
	export const scores: ScoreData[] = [];
	export let holes: number[] = [];
	export let isLocked = false;
	export let saveScore: (playerId: string, hole: number, value: number | null) => void;
	export let getSyncStatus:
		| ((playerId: string, hole: number) => 'pending' | 'synced' | 'failed' | undefined)
		| undefined;

	// Defensive: make sure arrays are never undefined
	$: safeTeamAPlayers = teamAPlayers || [];
	$: safeTeamBPlayers = teamBPlayers || [];
	$: safeHoles = holes || [];

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

	// Get player by index from team (with safety)
	function getTeamPlayer(team: Player[], index: number): Player | null {
		return team[index] || null;
	}

	// Safe score getters for individual players
	function getPlayerScore(player: Player | null, hole: number): string | number {
		if (!player || !player.scores) return '';
		return player.scores[hole] || '';
	}

	// Calculate best drive team score
	function getBestTeamScore(teamPlayers: Player[], hole: number): string | number {
		// In Shamble format, players use the best drive, then play their own ball
		// We'll show individual scores for each player
		return '';
	}

	// Helper to determine which team is winning on a hole
	function getWinningTeam(hole: number): string | null {
		const teamAScores = safeTeamAPlayers.map((p) => getPlayerScore(p, hole));
		const teamBScores = safeTeamBPlayers.map((p) => getPlayerScore(p, hole));

		// Need all scores to determine a winner
		if (teamAScores.some((score) => !score) || teamBScores.some((score) => !score)) {
			return null;
		}

		// Convert to numbers and find the best (lowest) score for each team
		const teamABest = Math.min(...teamAScores.map((s) => Number(s)).filter((n) => !isNaN(n)));
		const teamBBest = Math.min(...teamBScores.map((s) => Number(s)).filter((n) => !isNaN(n)));

		if (isNaN(teamABest) || isNaN(teamBBest)) return null;
		if (teamABest < teamBBest) return 'A';
		if (teamBBest < teamABest) return 'B';
		return 'tie';
	}

	// Calculate match status based on holes won
	function getMatchStatus(): string {
		let teamAUp = 0;
		let teamBUp = 0;

		for (let hole of safeHoles) {
			const winner = getWinningTeam(hole);
			if (winner === 'A') teamAUp++;
			else if (winner === 'B') teamBUp++;
		}

		if (teamAUp === teamBUp) return 'AS';
		if (teamAUp > teamBUp) return `${teamAUp - teamBUp}↑`;
		return `${teamBUp - teamAUp}↓`;
	}

	// Calculate team total scores
	function getTeamTotal(teamPlayers: Player[]): number {
		let total = 0;

		// For each hole, find the best (lowest) score from either player
		for (let hole of safeHoles) {
			const scores = teamPlayers
				.map((p) => getPlayerScore(p, hole))
				.filter((score) => score !== '')
				.map((score) => Number(score))
				.filter((score) => !isNaN(score));

			if (scores.length > 0) {
				const bestScore = Math.min(...scores);
				total += bestScore;
			}
		}

		return total;
	}

	// Handle score change
	function handleScoreChange(teamId: string, playerIndex: number, hole: number, e: Event) {
		if (isLocked) return;

		const value = (e.target as HTMLInputElement).value;

		// Allow empty string or a number between 1-12
		if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
			// Get the team array based on teamId
			const teamArray = teamId === 'A' ? teamAPlayers : teamBPlayers;

			// Get the player (safely)
			if (teamArray.length > playerIndex) {
				const player = teamArray[playerIndex];
				if (player) {
					// Create a new array with updated player
					if (teamId === 'A') {
						teamAPlayers = teamAPlayers.map((p, idx) => {
							if (idx === playerIndex) {
								// Create new scores object if it doesn't exist
								const updatedScores = { ...(p.scores || {}) };
								updatedScores[hole] = value;

								// Return updated player with new scores
								return {
									...p,
									scores: updatedScores
								};
							}
							return p;
						});
					} else {
						teamBPlayers = teamBPlayers.map((p, idx) => {
							if (idx === playerIndex) {
								// Create new scores object if it doesn't exist
								const updatedScores = { ...(p.scores || {}) };
								updatedScores[hole] = value;

								// Return updated player with new scores
								return {
									...p,
									scores: updatedScores
								};
							}
							return p;
						});
					}

					// Save score to database
					const playerId = player.player_id;
					if (playerId) {
						saveScore(playerId, hole, value === '' ? null : parseInt(value));
					}
				}
			}
		}
	}
</script>

<div class="mb-4">
	<h2 class="mb-2 text-center text-lg font-bold">2v2 Team Shamble Scorecard</h2>
	<div class="mb-2 text-center text-sm text-gray-600 italic">
		Players select the best drive, then play their own ball for the remainder of the hole.
	</div>
	<div class="mb-2 text-center text-lg font-semibold tracking-wide text-gray-600">
		Status: <span class="inline-block rounded bg-gray-100 px-2 py-1 text-blue-700"
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
					{#each safeTeamAPlayers as player, index (player.player_id)}
						<th class="border bg-blue-50 px-2 py-1 text-center font-bold text-blue-700">
							A{index + 1}: {player.username || player.player?.username || 'Player'}
						</th>
					{/each}
					<th class="border bg-blue-100 px-2 py-1 text-center font-bold">Team A Best</th>
					{#each safeTeamBPlayers as player, index (player.player_id)}
						<th class="border bg-green-50 px-2 py-1 text-center font-bold text-green-700">
							B{index + 1}: {player.username || player.player?.username || 'Player'}
						</th>
					{/each}
					<th class="border bg-green-100 px-2 py-1 text-center font-bold">Team B Best</th>
				</tr>
			</thead>
			<tbody>
				{#each safeHoles as hole (hole)}
					<tr>
						<td class="sticky left-0 z-10 border bg-gray-50 px-2 py-1 text-center font-bold"
							>{hole}</td
						>

						<!-- Team A Players -->
						{#each safeTeamAPlayers as player, index (player.player_id)}
							<td class="border px-2 py-1 text-center">
								{#if !isLocked}
									<input
										type="number"
										min="1"
										max="20"
										class="h-10 w-16 rounded border bg-blue-50 p-1 text-center text-lg font-semibold shadow-inner focus:bg-blue-100 focus:outline-none"
										value={getPlayerScore(player, hole)}
										on:input={(e) => handleScoreChange('A', index, hole, e)}
									/>
									<!-- Sync status indicator -->
									{#if typeof getSyncStatus === 'function'}
										{#if getSyncStatus(player.player_id, hole) === 'pending'}
											<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
										{:else if getSyncStatus(player.player_id, hole) === 'synced'}
											<span title="Synced" class="ml-1 text-green-600">✔️</span>
										{:else if getSyncStatus(player.player_id, hole) === 'failed'}
											<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
										{/if}
									{/if}
								{:else}
									{getPlayerScore(player, hole)}
								{/if}
							</td>
						{/each}

						<!-- Team A Best Score -->
						<td
							class="border bg-blue-100 px-2 py-1 text-center font-bold"
							class:bg-green-200={getWinningTeam(hole) === 'A'}
							class:bg-yellow-200={getWinningTeam(hole) === 'tie'}
						>
							{safeTeamAPlayers
								.map((p) => getPlayerScore(p, hole))
								.filter((score) => score !== '')
								.map((score) => Number(score))
								.filter((score) => !isNaN(score)).length > 0
								? Math.min(
										...safeTeamAPlayers
											.map((p) => getPlayerScore(p, hole))
											.filter((score) => score !== '')
											.map((score) => Number(score))
											.filter((score) => !isNaN(score))
									)
								: ''}
						</td>

						<!-- Team B Players -->
						{#each safeTeamBPlayers as player, index (player.player_id)}
							<td class="border px-2 py-1 text-center">
								{#if !isLocked}
									<input
										type="number"
										min="1"
										max="20"
										class="h-10 w-16 rounded border bg-green-50 p-1 text-center text-lg font-semibold shadow-inner focus:bg-green-100 focus:outline-none"
										value={getPlayerScore(player, hole)}
										on:input={(e) => handleScoreChange('B', index, hole, e)}
									/>
									<!-- Sync status indicator -->
									{#if typeof getSyncStatus === 'function'}
										{#if getSyncStatus(player.player_id, hole) === 'pending'}
											<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
										{:else if getSyncStatus(player.player_id, hole) === 'synced'}
											<span title="Synced" class="ml-1 text-green-600">✔️</span>
										{:else if getSyncStatus(player.player_id, hole) === 'failed'}
											<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
										{/if}
									{/if}
								{:else}
									{getPlayerScore(player, hole)}
								{/if}
							</td>
						{/each}

						<!-- Team B Best Score -->
						<td
							class="border bg-green-100 px-2 py-1 text-center font-bold"
							class:bg-green-200={getWinningTeam(hole) === 'B'}
							class:bg-yellow-200={getWinningTeam(hole) === 'tie'}
						>
							{safeTeamBPlayers
								.map((p) => getPlayerScore(p, hole))
								.filter((score) => score !== '')
								.map((score) => Number(score))
								.filter((score) => !isNaN(score)).length > 0
								? Math.min(
										...safeTeamBPlayers
											.map((p) => getPlayerScore(p, hole))
											.filter((score) => score !== '')
											.map((score) => Number(score))
											.filter((score) => !isNaN(score))
									)
								: ''}
						</td>
					</tr>
				{/each}

				<!-- Totals row -->
				<tr class="bg-gray-100">
					<td class="sticky left-0 z-10 border bg-gray-200 px-2 py-1 text-center font-bold"
						>Total</td
					>
					{#each safeTeamAPlayers as player, index (player.player_id)}
						<td class="border px-2 py-1 text-center"></td>
					{/each}
					<td class="border bg-blue-200 px-2 py-1 text-center font-bold"
						>{getTeamTotal(safeTeamAPlayers)}</td
					>
					{#each safeTeamBPlayers as player, index (player.player_id)}
						<td class="border px-2 py-1 text-center"></td>
					{/each}
					<td class="border bg-green-200 px-2 py-1 text-center font-bold"
						>{getTeamTotal(safeTeamBPlayers)}</td
					>
				</tr>
			</tbody>
		</table>
	</div>
</div>
