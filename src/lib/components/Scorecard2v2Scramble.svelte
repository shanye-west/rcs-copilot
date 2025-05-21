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
	// Make sure players exist
	$: teamAPlayer1 = safeTeamAPlayers[0] || null;
	$: teamAPlayer2 = safeTeamAPlayers[1] || null;
	$: teamBPlayer1 = safeTeamBPlayers[0] || null;
	$: teamBPlayer2 = safeTeamBPlayers[1] || null;

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
</script>

<div class="scoreboard overflow-x-auto">
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
					{#if teamAPlayer1}
						<div class="text-xs">
							{teamAPlayer1.username || 'Player 1'}
							{#if teamAPlayer2}
								& {teamAPlayer2.username || 'Player 2'}
							{/if}
						</div>
					{/if}
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
					</td>
				{/each}
			</tr>

			<!-- Team B Row -->
			<tr class="bg-green-50">
				<td class="sticky left-0 border bg-green-50 px-2 py-1 font-semibold">
					Team B
					{#if teamBPlayer1}
						<div class="text-xs">
							{teamBPlayer1.username || 'Player 1'}
							{#if teamBPlayer2}
								& {teamBPlayer2.username || 'Player 2'}
							{/if}
						</div>
					{/if}
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
					</td>
				{/each}
			</tr>
		</tbody>
	</table>
</div>
