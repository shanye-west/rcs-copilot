<script lang="ts">
	// Define interfaces for type safety
	interface Player {
		player: {
			id: string;
			username: string;
			handicap?: number;
			handicap_strokes?: number[];
			hole_stroke_indexes?: number[];
		};
		player_id: string;
		team_id: string;
		scores?: Record<number, number | string>;
		username?: string;
	}

	interface Score {
		player_id: string;
		hole_number: number;
		net_score?: number;
		gross_score?: number;
	}

	export let teamAPlayers: Player[];
	export let teamBPlayers: Player[];
	export let scores: Score[];
	export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
	export let isLocked: boolean = false;
	export let saveScore: (playerId: string, hole: number, value: number) => void;

	// Helper to get score for a player/hole
	function getScore(playerId: string, hole: number): number | string {
		return scores.find((s) => s.player_id === playerId && s.hole_number === hole)?.net_score ?? '';
	}

	// Helper to get handicap dots for a player/hole
	function getDots(player: Player['player'], hole: number): string {
		// Assumptions:
		// - player.handicap: integer, total course handicap for 18 holes
		// - player.handicap_strokes: optional array of 18 numbers (1 if gets stroke on hole, 0 otherwise)
		// - holes: array of 1-18
		// - player.hole_stroke_indexes: optional array of 18 numbers (stroke index for each hole, 1=hardest)

		// If player.handicap_strokes exists, use it
		if (player.handicap_strokes && player.handicap_strokes.length === 18) {
			return player.handicap_strokes[hole - 1] > 0
				? '•'.repeat(player.handicap_strokes[hole - 1])
				: '';
		}

		// Otherwise, calculate dots based on handicap and stroke index
		const handicap = player.handicap || 0;
		if (handicap === 0) return '';

		// If player.hole_stroke_indexes exists, use it, else assume holes are ordered by difficulty
		let strokeIndexes =
			player.hole_stroke_indexes && player.hole_stroke_indexes.length === 18
				? player.hole_stroke_indexes
				: Array.from({ length: 18 }, (_, i) => i + 1); // 1-18

		// Find the stroke index for this hole
		const thisHoleStrokeIndex = strokeIndexes[hole - 1];

		// Calculate how many strokes (dots) this player gets on this hole
		let dots = 0;
		if (handicap >= 18) {
			dots = 1;
			if (handicap - 18 >= 18 - thisHoleStrokeIndex + 1) {
				dots = 2;
			} else if (handicap - 18 > 0 && thisHoleStrokeIndex <= handicap - 18) {
				dots = 2;
			}
		} else if (handicap > 0 && thisHoleStrokeIndex <= handicap) {
			dots = 1;
		}
		return dots > 0 ? '•'.repeat(dots) : '';
	}

	// For each hole, get the best net score for each team
	function getBestNetScore(players: Player[], hole: number): number | string {
		const netScores = players
			.filter((p) => p && p.player && p.player.id)
			.map((p) => getScore(p.player.id, hole))
			.filter(Boolean);
		if (netScores.length === 0) return '';

		// Filter out any string values and convert all to numbers
		const numericScores = netScores
			.filter((score) => typeof score === 'number')
			.map((score) => Number(score));

		if (numericScores.length === 0) return '';
		return Math.min(...numericScores);
	}

	// Calculate the total score for each team
	function getTeamTotal(players: Player[]): number {
		let total = 0;
		holes.forEach(hole => {
			const bestScore = getBestNetScore(players, hole);
			if (typeof bestScore === 'number') {
				total += bestScore;
			}
		});
		return total;
	}
	
	// Calculate match status for the 2v2 match
	function getMatchStatus(): string {
		let teamAUp = 0;
		let teamBUp = 0;
		
		for (let hole of holes) {
			const teamAScore = getBestNetScore(teamAPlayers, hole);
			const teamBScore = getBestNetScore(teamBPlayers, hole);
			
			if (teamAScore === '' || teamBScore === '') continue;
			
			if (teamAScore < teamBScore) teamAUp++;
			else if (teamBScore < teamAScore) teamBUp++;
		}
		
		if (teamAUp === teamBUp) return 'AS';
		if (teamAUp > teamBUp) return `${teamAUp - teamBUp}↑`;
		return `${teamBUp - teamAUp}↓`;
	}
	
	// Optional function for sync status (to match the 1v1 scorecard)
	export let getSyncStatus: ((playerId: string | undefined, hole: number) => 'pending' | 'synced' | 'failed' | undefined) | undefined = undefined;
</script>

<div class="mb-4">
	<h2 class="text-lg font-bold text-center mb-2">2v2 Team Best Ball Scorecard</h2>
	<div class="mb-2 text-center text-gray-600 text-lg font-semibold tracking-wide">
		Status: <span class="inline-block px-2 py-1 rounded bg-gray-100 text-blue-700">{getMatchStatus()}</span>
	</div>
	<div class="overflow-x-auto">
		<table class="min-w-full border text-base rounded-lg shadow bg-white">
			<thead class="bg-gray-50">
				<tr>
					<th class="border px-2 py-1 text-center text-xs font-bold bg-gray-100 sticky left-0 z-10">Hole</th>
					{#each teamAPlayers.slice(0, 2) as p (p.player_id)}
						<th class="border px-2 py-1 text-center text-blue-700 font-bold bg-blue-50">
							{#if p && p.player && p.player.username}
								{p.player.username}
							{:else if p && p.username}
								{p.username}
							{:else}
								Player {p ? p.player_id : 'Unknown'}
							{/if}
						</th>
					{/each}
					<th class="border px-2 py-1 text-center font-bold bg-blue-100">Team A Best Ball</th>
					{#each teamBPlayers.slice(0, 2) as p (p.player_id)}
						<th class="border px-2 py-1 text-center text-green-700 font-bold bg-green-50">
							{#if p && p.player && p.player.username}
								{p.player.username}
							{:else if p && p.username}
								{p.username}
							{:else}
								Player {p ? p.player_id : 'Unknown'}
							{/if}
						</th>
					{/each}
					<th class="border px-2 py-1 text-center font-bold bg-green-100">Team B Best Ball</th>
				</tr>
				<tr>
					<th class="border px-2 py-1 text-xs text-gray-400 bg-gray-100 sticky left-0 z-10">Handicap</th>
					{#each teamAPlayers.slice(0, 2) as p (p.player_id)}
						<th class="border px-2 py-1 text-xs text-blue-500 bg-blue-50">
							{#if p && p.player}
								{holes.map((h) => getDots(p.player, h)).join(' ')}
							{:else}
								-
							{/if}
						</th>
					{/each}
					<th class="border px-2 py-1 bg-blue-100"></th>
					{#each teamBPlayers.slice(0, 2) as p (p.player_id)}
						<th class="border px-2 py-1 text-xs text-green-600 bg-green-50">
							{holes.map((h) => getDots(p.player, h)).join(' ')}
						</th>
					{/each}
					<th class="border px-2 py-1 bg-green-100"></th>
				</tr>
			</thead>
			<tbody>
				{#each holes as hole (hole)}
					<tr>
						<td class="border px-2 py-1 font-bold text-center bg-gray-50 sticky left-0 z-10">{hole}</td>
						{#each teamAPlayers as p (p.player_id)}
							<td class="border px-2 py-1 text-center">
								{#if !isLocked}
									<input
										type="number"
										min="1"
										max="20"
										class="w-16 h-10 rounded border p-1 text-center text-lg font-semibold bg-blue-50 focus:bg-blue-100 focus:outline-none shadow-inner"
										value={p.scores && p.scores[hole] !== undefined ? p.scores[hole] : ''}
										on:input={e => {
											const target = e.target as HTMLInputElement;
											const val = target.value;
											if (p.scores) p.scores[hole] = val;
										}}
										on:change={() => {
											if (p.scores && p.scores[hole] !== '') {
												saveScore(p.player.id, hole, Number(p.scores[hole]));
											}
										}}
									/>
									<!-- Sync status indicator -->
									{#if typeof getSyncStatus === 'function'}
										{#if getSyncStatus(p.player.id, hole) === 'pending'}
											<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
										{:else if getSyncStatus(p.player.id, hole) === 'synced'}
											<span title="Synced" class="ml-1 text-green-600">✔️</span>
										{:else if getSyncStatus(p.player.id, hole) === 'failed'}
											<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
										{/if}
									{/if}
								{:else}
									{getScore(p.player.id, hole)}
								{/if}
								<div class="text-xs text-gray-400 mt-1">{getDots(p.player, hole)}</div>
							</td>
						{/each}
						<td class="border px-2 py-1 text-center font-bold bg-blue-100">
							{getBestNetScore(teamAPlayers, hole)}
						</td>
						{#each teamBPlayers as p (p.player_id)}
							<td class="border px-2 py-1 text-center">
								{#if !isLocked}
									<input
										type="number"
										min="1"
										max="20"
										class="w-16 h-10 rounded border p-1 text-center text-lg font-semibold bg-green-50 focus:bg-green-100 focus:outline-none shadow-inner"
										value={p.scores && p.scores[hole] !== undefined ? p.scores[hole] : ''}
										on:input={e => {
											const target = e.target as HTMLInputElement;
											const val = target.value;
											if (p.scores) p.scores[hole] = val;
										}}
										on:change={() => {
											if (p.scores && p.scores[hole] !== '') {
												saveScore(p.player.id, hole, Number(p.scores[hole]));
											}
										}}
									/>
									<!-- Sync status indicator -->
									{#if typeof getSyncStatus === 'function'}
										{#if getSyncStatus(p.player.id, hole) === 'pending'}
											<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
										{:else if getSyncStatus(p.player.id, hole) === 'synced'}
											<span title="Synced" class="ml-1 text-green-600">✔️</span>
										{:else if getSyncStatus(p.player.id, hole) === 'failed'}
											<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
										{/if}
									{/if}
								{:else}
									{getScore(p.player.id, hole)}
								{/if}
								<div class="text-xs text-gray-400 mt-1">{getDots(p.player, hole)}</div>
							</td>
						{/each}
						<td class="border px-2 py-1 text-center font-bold bg-green-100">
							{getBestNetScore(teamBPlayers, hole)}
						</td>
					</tr>
				{/each}
				<!-- Totals row -->
				<tr class="bg-gray-100">
					<td class="border px-2 py-1 font-bold text-center bg-gray-200 sticky left-0 z-10">Total</td>
					{#each teamAPlayers as p (p.player_id)}
						<td class="border px-2 py-1 text-center"></td>
					{/each}
					<td class="border px-2 py-1 text-center font-bold bg-blue-200">{getTeamTotal(teamAPlayers)}</td>
					{#each teamBPlayers as p (p.player_id)}
						<td class="border px-2 py-1 text-center"></td>
					{/each}
					<td class="border px-2 py-1 text-center font-bold bg-green-200">{getTeamTotal(teamBPlayers)}</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
