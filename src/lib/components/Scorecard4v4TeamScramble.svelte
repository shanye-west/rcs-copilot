<script lang="ts">
	import {
		calculateGrossScore,
		getWinningTeam as determineWinningTeam,
		type Player,
		type Score
	} from '$lib/utils/scoring';

	export let teamAPlayers: Player[] = [];
	export let teamBPlayers: Player[] = [];
	export let scores: Score[] = [];
	export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
	export let isLocked: boolean = false;
	export let saveScore: (playerId: string, hole: number, value: number | null) => void;
	export let getSyncStatus: (playerId: string, hole: number) => 'pending' | 'synced' | 'failed' | undefined;

	// Team scores are represented by the first player of each team
	$: teamALeader = teamAPlayers[0]?.player || null;
	$: teamBLeader = teamBPlayers[0]?.player || null;
	
	// Ensure we have valid holes and players arrays
	$: safeHoles = holes || Array.from({ length: 18 }, (_, i) => i + 1);
	$: safeTeamAPlayers = teamAPlayers || [];
	$: safeTeamBPlayers = teamBPlayers || [];
	
	// References to first players in each team (for scoring)
	$: teamAPlayer1 = safeTeamAPlayers[0];
	$: teamBPlayer1 = safeTeamBPlayers[0];

	// Helper to get score for a team's hole
	function getTeamScore(players: Player[], hole: number): number | string {
		// In 4v4 Team Scramble, we use the first player's score as the team score
		const leaderId = players[0]?.player?.id;
		if (!leaderId) return '';
		
		const score = calculateGrossScore(scores, leaderId, hole);
		return score !== undefined ? score : '';
	}

	// Safe score getters for direct score access
	function getTeamAScore(hole: number): string | number {
		if (!teamAPlayer1 || !teamAPlayer1.scores) return '';
		return teamAPlayer1.scores[hole] || '';
	}
	
	function getTeamBScore(hole: number): string | number {
		if (!teamBPlayer1 || !teamBPlayer1.scores) return '';
		return teamBPlayer1.scores[hole] || '';
	}

	// Determine which team is winning on a hole
	function getWinningTeam(hole: number): 'A' | 'B' | 'tie' | null {
		const teamAScore = calculateGrossScore(scores, teamAPlayers[0]?.player?.id, hole);
		const teamBScore = calculateGrossScore(scores, teamBPlayers[0]?.player?.id, hole);
		return determineWinningTeam(teamAScore, teamBScore);
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

<div class="mb-4">
	<h2 class="text-lg font-bold">4v4 Team Scramble Scorecard</h2>
	<p class="text-sm text-gray-600">
		Each team has four players who select the best shot on each stroke, then all players play from that position.
	</p>
	<table class="min-w-full border-collapse text-sm">
		<thead>
			<tr>
				<th class="sticky left-0 border bg-white px-2 py-1">Hole</th>
				<th class="border bg-blue-50 px-2 py-1">
					Team A
					<div class="text-xs text-gray-500">
						{safeTeamAPlayers.map(p => p.player?.username || 'Player').join(', ')}
					</div>
				</th>
				<th class="border bg-red-50 px-2 py-1">
					Team B
					<div class="text-xs text-gray-500">
						{safeTeamBPlayers.map(p => p.player?.username || 'Player').join(', ')}
					</div>
				</th>
			</tr>
		</thead>
		<tbody>
			{#each safeHoles as hole (hole)}
				<tr class={getWinningTeam(hole) ? 'bg-gray-50' : ''}>
					<td class="border px-2 py-1 font-bold">{hole}</td>
					
					<!-- Team A Score Cell -->
					<td class="border px-2 py-1 text-center" class:bg-blue-100={getWinningTeam(hole) === 'A'}>
						{#if !isLocked && teamALeader}
							<input
								type="number"
								min="1"
								max="20"
								class="w-12 rounded border p-1 text-center"
								value={getTeamScore(teamAPlayers, hole) || ''}
								on:change={(e) => {
									const val = parseInt(e.target.value, 10);
									if (!isNaN(val) && teamALeader?.id) {
										saveScore(teamALeader.id, hole, val);
									} else if (teamALeader?.id) {
										saveScore(teamALeader.id, hole, null);
									}
								}}
							/>
							<!-- Sync status indicator -->
							{#if teamALeader?.id && typeof getSyncStatus === 'function'}
								{#if getSyncStatus(teamALeader.id, hole) === 'pending'}
									<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
								{:else if getSyncStatus(teamALeader.id, hole) === 'synced'}
									<span title="Synced" class="ml-1 text-green-600">✔️</span>
								{:else if getSyncStatus(teamALeader.id, hole) === 'failed'}
									<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
								{/if}
							{/if}
						{:else}
							{getTeamScore(teamAPlayers, hole)}
						{/if}
					</td>
					
					<!-- Team B Score Cell -->
					<td class="border px-2 py-1 text-center" class:bg-red-100={getWinningTeam(hole) === 'B'}>
						{#if !isLocked && teamBLeader}
							<input
								type="number"
								min="1"
								max="20"
								class="w-12 rounded border p-1 text-center"
								value={getTeamScore(teamBPlayers, hole) || ''}
								on:change={(e) => {
									const val = parseInt(e.target.value, 10);
									if (!isNaN(val) && teamBLeader?.id) {
										saveScore(teamBLeader.id, hole, val);
									} else if (teamBLeader?.id) {
										saveScore(teamBLeader.id, hole, null);
									}
								}}
							/>
							<!-- Sync status indicator -->
							{#if teamBLeader?.id && typeof getSyncStatus === 'function'}
								{#if getSyncStatus(teamBLeader.id, hole) === 'pending'}
									<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
								{:else if getSyncStatus(teamBLeader.id, hole) === 'synced'}
									<span title="Synced" class="ml-1 text-green-600">✔️</span>
								{:else if getSyncStatus(teamBLeader.id, hole) === 'failed'}
									<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
								{/if}
							{/if}
						{:else}
							{getTeamScore(teamBPlayers, hole)}
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
