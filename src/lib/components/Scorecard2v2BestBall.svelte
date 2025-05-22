<script lang="ts">
	import { onMount } from 'svelte';
	import {
		calculateNetScore,
		calculateHandicapDots,
		calculateBestNetScore,
		getWinningTeam
	} from '$lib/utils/scoring';

	export let teamAPlayers: Player[];
	export let teamBPlayers: Player[];
	export let scores: Score[] = [];
	export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
	export let isLocked: boolean = false;
	export let saveScore: (playerId: string, hole: number, value: number | null) => void;
	export let getSyncStatus: (
		playerId: string,
		hole: number
	) => 'pending' | 'synced' | 'failed' | undefined;

	// local state init
	$: safeTeamAPlayers = teamAPlayers || [];
	$: safeTeamBPlayers = teamBPlayers || [];
	$: safeHoles = holes || [];

	onMount(() => {
		teamAPlayers.forEach((p) => {
			if (!p.scores) p.scores = {};
			holes.forEach((h) => {
				if (p.scores && p.scores[h] === undefined) p.scores[h] = '';
			});
		});
		teamBPlayers.forEach((p) => {
			if (!p.scores) p.scores = {};
			holes.forEach((h) => {
				if (p.scores && p.scores[h] === undefined) p.scores[h] = '';
			});
		});
		scores.forEach((s) => {
			const p = teamAPlayers.concat(teamBPlayers).find(
				(x) => x.player_id === s.player_id
			);
			if (p?.scores) p.scores[s.hole_number] = s.gross_score ?? '';
		});
	});

	// Helper to get score for a player/hole
	function getScore(playerId: string, hole: number): number | string {
		const score = calculateNetScore(scores, playerId, hole);
		return score !== undefined ? score : '';
	}

	// Helper to get handicap dots for a player/hole
	function getDots(player: Player['player'], hole: number): string {
		return calculateHandicapDots(player, hole);
	}

	// For each hole, get the best net score for each team
	function getBestNetScore(players: Player[], hole: number): number | string {
		const bestScore = calculateBestNetScore(players, scores, hole);
		return bestScore !== undefined ? bestScore : '';
	}

	// Determine which team is winning on a hole
	function getWinningTeam(hole: number): 'A' | 'B' | 'tie' | null {
		const teamAScore = calculateBestNetScore(teamAPlayers, scores, hole);
		const teamBScore = calculateBestNetScore(teamBPlayers, scores, hole);
		return determineWinningTeam(teamAScore, teamBScore);
	}
</script>

<div class="mb-4">
	<h2 class="text-lg font-bold">2v2 Team Best Ball Scorecard</h2>
	<table class="min-w-full border text-sm">
		<thead>
			<tr>
				<th class="border px-2 py-1">Hole</th>
				{#each teamAPlayers.slice(0, 2) as p (p.player_id)}
					<th class="border px-2 py-1">{p.player?.username || `Player ${p.player_id}`}</th>
				{/each}
				<th class="border bg-blue-50 px-2 py-1">Best Ball (A)</th>
				{#each teamBPlayers.slice(0, 2) as p (p.player_id)}
					<th class="border px-2 py-1">{p.player?.username || `Player ${p.player_id}`}</th>
				{/each}
				<th class="border bg-red-50 px-2 py-1">Best Ball (B)</th>
			</tr>
			<tr>
				<th class="border px-2 py-1 text-xs text-gray-400">Dots</th>
				{#each teamAPlayers.slice(0, 2) as p (p.player_id)}
					<th class="border px-2 py-1 text-xs text-gray-400">{holes.map((h) => calculateHandicapDots(p.player, h)).join(' ')}</th>
				{/each}
				<th class="border px-2 py-1"></th>
				{#each teamBPlayers.slice(0, 2) as p (p.player_id)}
					<th class="border px-2 py-1 text-xs text-gray-400">{holes.map((h) => calculateHandicapDots(p.player, h)).join(' ')}</th>
				{/each}
				<th class="border px-2 py-1"></th>
			</tr>
		</thead>
		<tbody>
			{#each holes as hole (hole)}
				<tr class={getWinningTeam(
					calculateBestNetScore(teamAPlayers, scores, hole),
					calculateBestNetScore(teamBPlayers, scores, hole)
				) === 'A' ? 'bg-green-50' : getWinningTeam(
					calculateBestNetScore(teamAPlayers, scores, hole),
					calculateBestNetScore(teamBPlayers, scores, hole)
				) === 'B' ? 'bg-red-50' : ''}>
					<td class="border px-2 py-1 font-bold">{hole}</td>
					{#each teamAPlayers.slice(0, 2) as p (p.player_id)}
						<td class="border px-2 py-1">
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="w-12 rounded border p-1 text-center"
									value={p.scores && p.scores[hole] !== undefined ? p.scores[hole] : ''}
									on:input={(e) => {
										if (p.scores) p.scores[hole] = e.target.value;
									}}
									on:change={() => saveScore(p.player_id, hole, p.scores && p.scores[hole] !== '' ? Number(p.scores[hole]) : null)}
								/>
								<!-- Sync status indicator -->
								{#if typeof getSyncStatus === 'function'}
									{#if getSyncStatus(p.player_id, hole) === 'pending'}
										<span title="Pending sync" class="ml-1 text-yellow-500">⏳</span>
									{:else if getSyncStatus(p.player_id, hole) === 'synced'}
										<span title="Synced" class="ml-1 text-green-600">✔️</span>
									{:else if getSyncStatus(p.player_id, hole) === 'failed'}
										<span title="Sync failed" class="ml-1 text-red-600">⚠️</span>
									{/if}
								{/if}
							{:else}
								<div>
									<span class="font-bold">Gross:</span> {p.scores && p.scores[hole]}
									<span class="ml-2 font-bold">Net:</span> {calculateNetScore(scores, p.player_id, hole)}
								</div>
							{/if}
							<div class="text-xs text-gray-400">{calculateHandicapDots(p.player, hole)}</div>
						</td>
					{/each}
					<td class="border bg-blue-50 px-2 py-1 font-bold">{calculateBestNetScore(teamAPlayers, scores, hole)}</td>
					{#each teamBPlayers.slice(0, 2) as p (p.player_id)}
						<td class="border px-2 py-1">
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="w-12 rounded border p-1 text-center"
									value={p.scores && p.scores[hole] !== undefined ? p.scores[hole] : ''}
									on:input={(e) => {
										if (p.scores) p.scores[hole] = e.target.value;
									}}
									on:change={() => saveScore(p.player_id, hole, p.scores && p.scores[hole] !== '' ? Number(p.scores[hole]) : null)}
								/>
							{:else}
								<div>
									<span class="font-bold">Gross:</span> {p.scores && p.scores[hole]}
									<span class="ml-2 font-bold">Net:</span> {calculateNetScore(scores, p.player_id, hole)}
								</div>
							{/if}
							<div class="text-xs text-gray-400">{calculateHandicapDots(p.player, hole)}</div>
						</td>
					{/each}
					<td class="border bg-red-50 px-2 py-1 font-bold">{calculateBestNetScore(teamBPlayers, scores, hole)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
