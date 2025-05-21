<script lang="ts">
	import { onMount } from 'svelte';
	import {
		calculateNetScore,
		calculateHandicapDots,
		calculateBestNetScore,
		getWinningTeam as determineWinningTeam,
		type Player,
		type Score
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
		// ensure each player has a scores object and populate from incoming scores
		teamAPlayers.forEach((p) => {
			if (!p.scores) p.scores = {};
			holes.forEach((h) => {
				if (p.scores[h] === undefined) p.scores[h] = '';
			});
		});
		teamBPlayers.forEach((p) => {
			if (!p.scores) p.scores = {};
			holes.forEach((h) => {
				if (p.scores[h] === undefined) p.scores[h] = '';
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
					<th class="border px-2 py-1">
						{#if p && p.player && p.player.username}
							{p.player.username}
						{:else if p && p.username}
							{p.username}
						{:else}
							Player {p ? p.player_id : 'Unknown'}
						{/if}
					</th>
				{/each}
				<th class="border bg-blue-50 px-2 py-1">Best Ball (A)</th>
				{#each teamBPlayers.slice(0, 2) as p (p.player_id)}
					<th class="border px-2 py-1">
						{#if p && p.player && p.player.username}
							{p.player.username}
						{:else if p && p.username}
							{p.username}
						{:else}
							Player {p ? p.player_id : 'Unknown'}
						{/if}
					</th>
				{/each}
				<th class="border bg-red-50 px-2 py-1">Best Ball (B)</th>
			</tr>
			<tr>
				<th class="border px-2 py-1 text-xs text-gray-400">Dots</th>
				{#each teamAPlayers.slice(0, 2) as p (p.player_id)}
					{#each holes as hole (hole)}
						{#if hole === 1}
							<th class="border px-2 py-1 text-xs text-gray-400" colspan={holes.length}>
								{#if p && p.player}
									{holes.map((h) => getDots(p.player, h)).join(' ')}
								{:else}
									-
								{/if}
							</th>
						{/if}
					{/each}
				{/each}
				<th class="border px-2 py-1"></th>
				{#each teamBPlayers as p (p.player_id)}
					{#each holes as hole (hole)}
						{#if hole === 1}
							<th class="border px-2 py-1 text-xs text-gray-400" colspan={holes.length}
								>{holes.map((h) => getDots(p.player, h)).join(' ')}</th
							>
						{/if}
					{/each}
				{/each}
				<th class="border px-2 py-1"></th>
			</tr>
		</thead>
		<tbody>
			{#each holes as hole (hole)}
				<tr>
					<td class="border px-2 py-1 font-bold">{hole}</td>
					{#each teamAPlayers as p (p.player_id)}
						<td class="border px-2 py-1">
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="w-12 rounded border p-1 text-center"
									bind:value={p.scores[hole]}
									on:change={() => saveScore(p.player_id, hole, p.scores[hole])}
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
					<td class="border bg-blue-50 px-2 py-1 font-bold"
						>{getBestNetScore(teamAPlayers, hole)}</td
					>
					{#each teamBPlayers as p (p.player_id)}
						<td class="border px-2 py-1">
							{#if !isLocked}
								<input
									type="number"
									min="1"
									max="20"
									class="w-12 rounded border p-1 text-center"
									bind:value={p.scores[hole]}
									on:change={() => saveScore(p.player.id, hole, p.scores[hole])}
								/>
							{:else}
								{getScore(p.player.id, hole)}
							{/if}
							<div class="text-xs text-gray-400">{getDots(p.player, hole)}</div>
						</td>
					{/each}
					<td class="border bg-red-50 px-2 py-1 font-bold">{getBestNetScore(teamBPlayers, hole)}</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
