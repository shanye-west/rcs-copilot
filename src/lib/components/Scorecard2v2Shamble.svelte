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
		const teamAScores = safeTeamAPlayers.map(p => getPlayerScore(p, hole));
		const teamBScores = safeTeamBPlayers.map(p => getPlayerScore(p, hole));

		// Need all scores to determine a winner
		if (teamAScores.some(score => !score) || teamBScores.some(score => !score)) {
			return null;
		}

		// Convert to numbers and find the best (lowest) score for each team
		const teamABest = Math.min(...teamAScores.map(s => Number(s)).filter(n => !isNaN(n)));
		const teamBBest = Math.min(...teamBScores.map(s => Number(s)).filter(n => !isNaN(n)));

		if (isNaN(teamABest) || isNaN(teamBBest)) return null;
		if (teamABest < teamBBest) return 'A';
		if (teamBBest < teamABest) return 'B';
		return 'tie';
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

<div class="scoreboard overflow-x-auto">
	<div class="mb-4">
		<h2 class="text-lg font-bold">2v2 Team Shamble Scorecard</h2>
		<p class="text-sm text-gray-500">
			Players select the best drive, then play their own ball for the remainder of the hole.
		</p>
	</div>
	
	<table class="min-w-full border-collapse">
		<thead>
			<tr>
				<th class="sticky left-0 border bg-white px-2 py-1">Player</th>
				{#each safeHoles as hole (hole)}
					<th class="w-12 border px-2 py-1">{hole}</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			<!-- Team A Players -->
			{#each safeTeamAPlayers as player, index (player.player_id)}
				<tr class="bg-blue-50">
					<td class="sticky left-0 border bg-blue-50 px-2 py-1 font-semibold">
						<span class="text-blue-800">A{index + 1}:</span> {player.username || 'Player'}
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
								value={getPlayerScore(player, hole)}
								disabled={isLocked}
								on:input={(e) => handleScoreChange('A', index, hole, e)}
							/>
						</td>
					{/each}
				</tr>
			{/each}

			<!-- Team B Players -->
			{#each safeTeamBPlayers as player, index (player.player_id)}
				<tr class="bg-green-50">
					<td class="sticky left-0 border bg-green-50 px-2 py-1 font-semibold">
						<span class="text-green-800">B{index + 1}:</span> {player.username || 'Player'}
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
								value={getPlayerScore(player, hole)}
								disabled={isLocked}
								on:input={(e) => handleScoreChange('B', index, hole, e)}
							/>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
