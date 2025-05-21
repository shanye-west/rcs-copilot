<script lang="ts">
	import { onMount } from 'svelte';
	import { getWinningTeam as determineWinningTeam } from '$lib/utils/scoring';

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
	export let getSyncStatus: (playerId: string | undefined, hole: number) => 'pending' | 'synced' | 'failed' | undefined;

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

	// Reference to the first player in each team (captain/representative)
	$: teamAPlayer1 = safeTeamAPlayers[0] || null;
	$: teamBPlayer1 = safeTeamBPlayers[0] || null;

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

		if (scoreA === '' || scoreB === '') return null;

		const numA = Number(scoreA);
		const numB = Number(scoreB);

		if (isNaN(numA) || isNaN(numB)) return null;
		
		const result = determineWinningTeam(numA, numB);
		if (result === null) return null;
		return result;
	}

	// Handle score change
	function handleScoreChange(team: string, hole: number, e: Event) {
		if (isLocked) return;

		const value = (e.target as HTMLInputElement).value;
		// Allow empty string or a number between 1-12
		if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
			const playerToUpdate = team === 'A' ? teamAPlayer1 : teamBPlayer1;
			if (!playerToUpdate) return;
			
			// Update the player's score
			if (playerToUpdate.scores) {
				playerToUpdate.scores[hole] = value;
			}
			
			// Save to the backend/store
			if (value === '') {
				saveScore(playerToUpdate.player_id, hole, null);
			} else {
				saveScore(playerToUpdate.player_id, hole, parseInt(value));
			}
		}
	}
</script>

<div class="scoreboard overflow-x-auto">
	<h2 class="mb-2 text-lg font-bold">2v2 Team Shamble Scorecard</h2>
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
							{teamAPlayer1.username || teamAPlayer1.player?.username || 'Player 1'}
							{#if safeTeamAPlayers[1]}
								& {safeTeamAPlayers[1].username || safeTeamAPlayers[1].player?.username || 'Player 2'}
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
			<tr class="bg-red-50">
				<td class="sticky left-0 border bg-red-50 px-2 py-1 font-semibold">
					Team B
					{#if teamBPlayer1}
						<div class="text-xs">
							{teamBPlayer1.username || teamBPlayer1.player?.username || 'Player 1'}
							{#if safeTeamBPlayers[1]}
								& {safeTeamBPlayers[1].username || safeTeamBPlayers[1].player?.username || 'Player 2'}
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
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
