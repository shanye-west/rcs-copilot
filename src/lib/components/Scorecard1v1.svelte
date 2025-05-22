<script lang="ts">
	import {
		calculateNetScore,
		calculateHandicapDots,
		calculateMatchStatus,
		type Player,
		type Score
	} from '$lib/utils/scoring';

	export let players: Player[]; // [playerA, playerB]
	export let scores: Score[]; // all scores for this match
	export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
	export let isLocked: boolean = false;
	export let saveScore: (playerId: string, hole: number, value: number | null) => void;
	export let getSyncStatus: (
		playerId: string,
		hole: number
	) => 'pending' | 'synced' | 'failed' | undefined;

	// Helper to get score for a player/hole
	function getScore(playerId: string, hole: number): number | string {
		const score = calculateNetScore(scores, playerId, hole);
		return score !== undefined ? score : '';
	}

	// Calculate match-play status for 1v1 match
	function getMatchStatus() {
		if (players.length < 2) return 'AS';
		return calculateMatchStatus(players[0], players[1], scores, holes);
	}

	// Get handicap dots for visual display
	function getDots(player: Player['player'], hole: number): string {
		return calculateHandicapDots(player, hole);
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
									on:input={(e) => {
										const target = e.target as HTMLInputElement | null;
										if (target && p.scores) p.scores[hole] = target.value;
									}}
									on:change={() =>
										saveScore(
											p.player.id,
											hole,
											p.scores && p.scores[hole] !== '' ? Number(p.scores[hole]) : null
										)}
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
