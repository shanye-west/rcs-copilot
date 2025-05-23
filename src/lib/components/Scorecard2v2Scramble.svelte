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
	export let getSyncStatus: (playerId: string | undefined, hole: number) => 'pending' | 'synced' | 'failed' | undefined;

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

	// Calculate match status for the match
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
	
	// Calculate team totals
	function getTeamTotal(team: 'A' | 'B'): number {
		let total = 0;
		for (let hole of safeHoles) {
			const score = team === 'A' ? getTeamAScore(hole) : getTeamBScore(hole);
			if (typeof score === 'number' || (typeof score === 'string' && !isNaN(Number(score)) && score !== '')) {
				total += Number(score);
			}
		}
		return total;
	}
</script>

<div class="mb-4">
	<h2 class="text-lg font-bold text-center mb-2">2v2 Team Scramble Scorecard</h2>
	<div class="mb-2 text-center text-gray-600 text-lg font-semibold tracking-wide">
		Status: <span class="inline-block px-2 py-1 rounded bg-gray-100 text-blue-700">{getMatchStatus()}</span>
	</div>
	<div class="overflow-x-auto">
		<table class="min-w-full border text-base rounded-lg shadow bg-white">
			<thead class="bg-gray-50">
				<tr>
					<th class="border px-2 py-1 text-center text-xs font-bold bg-gray-100 sticky left-0 z-10">Hole</th>
					<!-- Team A Header -->
					<th class="border px-2 py-1 text-center text-blue-700 font-bold bg-blue-50" colspan="1">
						Team A
						{#if teamAPlayer1 || teamAPlayer2}
							<div class="text-xs mt-1">
								{teamAPlayer1?.username || ''} {teamAPlayer2 ? `& ${teamAPlayer2.username || ''}` : ''}
							</div>
						{/if}
					</th>
					<!-- Team B Header -->
					<th class="border px-2 py-1 text-center text-green-700 font-bold bg-green-50" colspan="1">
						Team B
						{#if teamBPlayer1 || teamBPlayer2}
							<div class="text-xs mt-1">
								{teamBPlayer1?.username || ''} {teamBPlayer2 ? `& ${teamBPlayer2.username || ''}` : ''}
							</div>
						{/if}
					</th>
				</tr>
			</thead>
			<tbody>
				{#each safeHoles as hole (hole)}
					<tr>
						<td class="border px-2 py-1 font-bold text-center bg-gray-50 sticky left-0 z-10">{hole}</td>
						
						<!-- Team A Score -->
						<td 
							class="border px-2 py-1 text-center" 
							class:bg-blue-100={getWinningTeam(hole) === 'A'}
							class:bg-yellow-100={getWinningTeam(hole) === 'tie'}
						>
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="w-16 h-10 rounded border p-1 text-center text-lg font-semibold bg-blue-50 focus:bg-blue-100 focus:outline-none shadow-inner"
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
									class="w-16 h-10 rounded border p-1 text-center text-lg font-semibold bg-green-50 focus:bg-green-100 focus:outline-none shadow-inner"
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
					</tr>
				{/each}
				
				<!-- Totals row -->
				<tr class="bg-gray-100">
					<td class="border px-2 py-1 font-bold text-center bg-gray-200 sticky left-0 z-10">Total</td>
					<td class="border px-2 py-1 text-center font-bold bg-blue-200">{getTeamTotal('A')}</td>
					<td class="border px-2 py-1 text-center font-bold bg-green-200">{getTeamTotal('B')}</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
