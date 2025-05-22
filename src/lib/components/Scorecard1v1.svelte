<script lang="ts">
	// Define interfaces for type safety
	interface Player {
		player: {
			id: string;
			username: string;
			handicap?: number;
			handicap_strokes?: number[];
		};
		player_id: string;
		team_id: string;
		scores?: Record<number, number | string>;
	}

	interface Score {
		player_id: string;
		hole_number: number;
		net_score?: number;
		gross_score?: number;
	}

	export let players: Player[]; // [playerA, playerB]
	export let scores: Score[]; // all scores for this match
	export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
	export let isLocked: boolean = false;
	export let saveScore: (playerId: string, hole: number, value: number) => void;

	// Helper to get score for a player/hole
	function getScore(playerId: string, hole: number): number | string {
		return scores.find((s) => s.player_id === playerId && s.hole_number === hole)?.net_score ?? '';
	}

	// Calculate match-play status (AS, 1up, etc.)
	function getMatchStatus() {
		let aUp = 0,
			bUp = 0;
		for (let hole of holes) {
			const a = getScore(players[0].player.id, hole);
			const b = getScore(players[1].player.id, hole);
			if (!a || !b) continue;
			if (a < b) aUp++;
			else if (b < a) bUp++;
		}
		if (aUp === bUp) return 'AS';
		if (aUp > bUp) return `${aUp - bUp}↑`;
		return `${bUp - aUp}↓`;
	}

	// Handicap dots logic for 1v1 match
	function getDots(player: Player['player'], hole: number): string {
		// If player.handicap_strokes exists, use it
		if (player.handicap_strokes && player.handicap_strokes.length === 18) {
			return player.handicap_strokes[hole - 1] > 0
				? '•'.repeat(player.handicap_strokes[hole - 1])
				: '';
		}
		const handicap = player.handicap || 0;
		if (handicap === 0) return '';
		// Assume holes are ordered by difficulty (1=hardest)
		const strokeIndex = hole;
		let dots = 0;
		if (handicap >= 18) {
			dots = 1;
			if (handicap - 18 >= 18 - strokeIndex + 1) {
				dots = 2;
			} else if (handicap - 18 > 0 && strokeIndex <= handicap - 18) {
				dots = 2;
			}
		} else if (handicap > 0 && strokeIndex <= handicap) {
			dots = 1;
		}
		return dots > 0 ? '•'.repeat(dots) : '';
	}
</script>

<div class="mb-4">
	<h2 class="text-lg font-bold">1v1 Individual Match Scorecard</h2>
	<div class="mb-2 text-gray-600">Status: {getMatchStatus()}</div>
	<table class="min-w-full border text-sm">
		<thead>
			<tr>
				<th class="border px-2 py-1">Hole</th>
				<th class="border px-2 py-1">{players[0].player.username}</th>
				<th class="border px-2 py-1">{players[1].player.username}</th>
			</tr>
			<tr>
				<th class="border px-2 py-1 text-xs text-gray-400">Dots</th>
				<th class="border px-2 py-1 text-xs text-gray-400"
					>{holes.map((h) => getDots(players[0].player, h)).join(' ')}</th
				>
				<th class="border px-2 py-1 text-xs text-gray-400"
					>{holes.map((h) => getDots(players[1].player, h)).join(' ')}</th
				>
			</tr>
		</thead>
		<tbody>
			{#each holes as hole (hole)}
				<tr>
					<td class="border px-2 py-1 font-bold">{hole}</td>
					{#each players as p (p.player.id)}
						<td class="border px-2 py-1">
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="w-12 rounded border p-1 text-center"
									value={p.scores && p.scores[hole] !== undefined ? p.scores[hole] : ''}
									on:input={e => {
										const val = e.target.value;
										if (p.scores) p.scores[hole] = val;
									}}
									on:change={() => saveScore(p.player.id, hole, p.scores && p.scores[hole] !== '' ? Number(p.scores[hole]) : null)}
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
							<div class="text-xs text-gray-400">{getDots(p.player, hole)}</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
