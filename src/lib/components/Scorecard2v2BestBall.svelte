<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { offlineStore } from '$lib/stores/offline-store';

	// Type definitions
	interface Player {
		player_id: string;
		team_id: string;
		player: {
			id: string;
			username: string;
			handicap_index?: number;
		};
		playing_course_handicap?: number;
		course_strokes?: number;
		scores?: Record<number, number | string>;
	}

	interface Course {
		id: string;
		name: string;
		course_rating: number;
		course_slope: number;
	}

	interface Hole {
		hole_number: number;
		par: number;
		hole_handicap_rank: number;
	}

	interface TeamScore {
		hole_number: number;
		team_a_net: number | null;
		team_b_net: number | null;
		winning_team: 'A' | 'B' | 'tie' | null;
	}

	// Props
	export let teamAPlayers: Player[] = [];
	export let teamBPlayers: Player[] = [];
	export let scores: any[] = [];
	export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
	export let isLocked: boolean = false;
	export let saveScore: (playerId: string, hole: number, value: number | null) => void;
	export let getSyncStatus:
		| ((playerId: string, hole: number) => 'pending' | 'synced' | 'failed' | undefined)
		| undefined;
	export let matchId: string;
	export let courseId: string;

	// Local state
	let course: Course | null = null;
	let courseHoles: Hole[] = [];
	let teamScores: Record<number, TeamScore> = {};
	let matchStatus = 'AS';
	let isCalculating = false;
	let errorMessage = '';
	let isOffline = false;

	// Subscribe to offline store
	$: isOffline = !$offlineStore.isOnline;

	// Reactive calculations
	$: safeTeamAPlayers = teamAPlayers || [];
	$: safeTeamBPlayers = teamAPlayers || [];
	$: safeHoles = holes || [];

	onMount(async () => {
		await loadCourseData();
		await calculatePlayingHandicaps();
		initializePlayerScores();
		calculateAllTeamScores();
	});

	// Load course and hole data
	async function loadCourseData() {
		if (!courseId) return;

		try {
			// Load course data
			const { data: courseData, error: courseError } = await supabase
				.from('courses')
				.select('*')
				.eq('id', courseId)
				.single();

			if (courseError) throw courseError;
			course = courseData;

			// Load hole data
			const { data: holesData, error: holesError } = await supabase
				.from('holes')
				.select('*')
				.eq('course_id', courseId)
				.order('hole_number');

			if (holesError) throw holesError;
			courseHoles = holesData || [];
		} catch (error) {
			console.error('Error loading course data:', error);
			errorMessage = 'Failed to load course data';
		}
	}

	// Calculate playing course handicaps using GHIN formula
	async function calculatePlayingHandicaps() {
		if (!course) return;

		const allPlayers = [...safeTeamAPlayers, ...safeTeamBPlayers];

		// Calculate course handicap for each player
		for (const player of allPlayers) {
			if (player.player.handicap_index && course.course_slope && course.course_rating) {
				// GHIN formula: (Handicap Index × Slope Rating ÷ 113) + (Course Rating - Par)
				const par = courseHoles.reduce((sum, hole) => sum + hole.par, 0);
				const courseHandicap = Math.round(
					(player.player.handicap_index * course.course_slope) / 113 + (course.course_rating - par)
				);

				player.playing_course_handicap = Math.max(0, courseHandicap);
			}
		}

		// Find lowest handicap for stroke allocation
		const lowestHandicap = Math.min(
			...allPlayers.map((p) => p.playing_course_handicap || 0).filter((h) => h !== undefined)
		);

		// Calculate strokes relative to lowest handicap
		for (const player of allPlayers) {
			if (player.playing_course_handicap !== undefined) {
				player.course_strokes = Math.max(0, player.playing_course_handicap - lowestHandicap);
			}
		}

		// Store playing handicaps in database
		try {
			for (const player of allPlayers) {
				if (player.playing_course_handicap !== undefined) {
					await supabase
						.from('match_players')
						.update({ playing_course_handicap: player.playing_course_handicap })
						.eq('match_id', matchId)
						.eq('player_id', player.player_id);
				}
			}
		} catch (error) {
			console.error('Error saving handicaps:', error);
		}
	}

	// Initialize player scores from existing data
	function initializePlayerScores() {
		const allPlayers = [...safeTeamAPlayers, ...safeTeamBPlayers];

		allPlayers.forEach((player) => {
			if (!player.scores) {
				player.scores = {};
			}

			// Load existing scores
			safeHoles.forEach((hole) => {
				const existingScore = scores.find(
					(s) => s.player_id === player.player_id && s.hole_number === hole
				);
				if (existingScore && existingScore.gross_score) {
					player.scores[hole] = existingScore.gross_score;
				}
			});
		});
	}

	// Calculate if player gets stroke on this hole
	function getStrokeForHole(player: Player, holeNumber: number): boolean {
		if (!player.course_strokes || !courseHoles.length) return false;

		const hole = courseHoles.find((h) => h.hole_number === holeNumber);
		if (!hole) return false;

		return hole.hole_handicap_rank <= player.course_strokes;
	}

	// Calculate net score for a player on a hole
	function calculateNetScore(player: Player, holeNumber: number): number | null {
		const grossScore = player.scores?.[holeNumber];
		if (!grossScore || grossScore === '') return null;

		const numGross = Number(grossScore);
		const strokesReceived = getStrokeForHole(player, holeNumber) ? 1 : 0;

		return numGross - strokesReceived;
	}

	// Calculate team scores for all holes
	function calculateAllTeamScores() {
		safeHoles.forEach((hole) => {
			calculateTeamScoreForHole(hole);
		});
		updateMatchStatus();
	}

	// Calculate team score for specific hole
	function calculateTeamScoreForHole(holeNumber: number) {
		// Team A best net score
		const teamANetScores = safeTeamAPlayers
			.map((player) => calculateNetScore(player, holeNumber))
			.filter((score) => score !== null) as number[];

		const teamABest = teamANetScores.length > 0 ? Math.min(...teamANetScores) : null;

		// Team B best net score
		const teamBNetScores = safeTeamBPlayers
			.map((player) => calculateNetScore(player, holeNumber))
			.filter((score) => score !== null) as number[];

		const teamBBest = teamBNetScores.length > 0 ? Math.min(...teamBNetScores) : null;

		// Determine winning team
		let winningTeam: 'A' | 'B' | 'tie' | null = null;
		if (teamABest !== null && teamBBest !== null) {
			if (teamABest < teamBBest) winningTeam = 'A';
			else if (teamBBest < teamABest) winningTeam = 'B';
			else winningTeam = 'tie';
		}

		teamScores[holeNumber] = {
			hole_number: holeNumber,
			team_a_net: teamABest,
			team_b_net: teamBBest,
			winning_team: winningTeam
		};
	}

	// Update overall match status
	function updateMatchStatus() {
		let teamAHoles = 0;
		let teamBHoles = 0;

		Object.values(teamScores).forEach((score) => {
			if (score.winning_team === 'A') teamAHoles++;
			else if (score.winning_team === 'B') teamBHoles++;
		});

		const difference = teamAHoles - teamBHoles;

		if (difference === 0) {
			matchStatus = 'AS';
		} else if (difference > 0) {
			matchStatus = `${difference}↑A`;
		} else {
			matchStatus = `${Math.abs(difference)}↑B`;
		}
	}

	// Handle score input
	async function handleScoreChange(player: Player, holeNumber: number, event: Event) {
		if (isLocked) return;

		const target = event.target as HTMLInputElement;
		const value = target.value;

		// Validate input
		if (value !== '' && (isNaN(Number(value)) || Number(value) < 1 || Number(value) > 15)) {
			return;
		}

		// Update player score
		if (!player.scores) player.scores = {};
		player.scores[holeNumber] = value;

		// Save to database/offline store
		try {
			const numericValue = value === '' ? null : Number(value);
			await saveScore(player.player_id, holeNumber, numericValue);

			// Recalculate team scores
			calculateTeamScoreForHole(holeNumber);
			updateMatchStatus();
		} catch (error) {
			console.error('Error saving score:', error);
			errorMessage = 'Failed to save score. Please try again.';

			// Show error notification
			setTimeout(() => {
				errorMessage = '';
			}, 3000);
		}
	}

	// Check if player's score is being used as team score
	function isPlayerScoreUsed(player: Player, holeNumber: number): boolean {
		const playerNet = calculateNetScore(player, holeNumber);
		if (playerNet === null) return false;

		const teamScore = teamScores[holeNumber];
		if (!teamScore) return false;

		const teamNet =
			player.team_id === safeTeamAPlayers[0]?.team_id ? teamScore.team_a_net : teamScore.team_b_net;

		return playerNet === teamNet;
	}

	// Get total scores
	function getPlayerTotal(player: Player, holes: number[]): number {
		return holes.reduce((total, hole) => {
			const score = player.scores?.[hole];
			return total + (score && score !== '' ? Number(score) : 0);
		}, 0);
	}

	function getTeamTotal(players: Player[], holes: number[]): number {
		return holes.reduce((total, hole) => {
			const teamScore = teamScores[hole];
			const teamNet = players === safeTeamAPlayers ? teamScore?.team_a_net : teamScore?.team_b_net;
			return total + (teamNet || 0);
		}, 0);
	}

	// Define hole ranges
	$: frontNine = safeHoles.slice(0, 9);
	$: backNine = safeHoles.slice(9, 18);
</script>

<!-- Error notification -->
{#if errorMessage}
	<div class="fixed top-4 right-4 z-50 rounded-lg bg-red-500 px-4 py-2 text-white shadow-lg">
		{errorMessage}
	</div>
{/if}

<!-- Offline indicator -->
{#if isOffline}
	<div class="fixed top-4 left-4 z-50 rounded-lg bg-yellow-500 px-3 py-1 text-sm text-white">
		📱 Offline
	</div>
{/if}

<div class="mb-4">
	<h2 class="mb-2 text-center text-lg font-bold">2v2 Team Best Ball Scorecard</h2>
	<div class="mb-2 text-center text-sm text-gray-600 italic">
		Each player plays their own ball. Best net score counts for the team.
	</div>
	<div class="mb-4 text-center text-lg font-semibold tracking-wide text-gray-600">
		Match Status: <span
			class="inline-block rounded px-3 py-1 {matchStatus === 'AS'
				? 'bg-gray-100 text-gray-700'
				: matchStatus.includes('A')
					? 'bg-blue-100 text-blue-700'
					: 'bg-red-100 text-red-700'}">{matchStatus}</span
		>
	</div>

	<div class="overflow-x-auto">
		<table class="min-w-full rounded-lg border bg-white text-sm shadow">
			<thead class="bg-gray-50">
				<tr>
					<th class="sticky left-0 z-10 border bg-gray-100 px-2 py-1 text-center text-xs font-bold"
						>Hole</th
					>
					<!-- Team A Players -->
					{#each safeTeamAPlayers as player (player.player_id)}
						<th
							class="min-w-[80px] border bg-blue-50 px-1 py-1 text-center font-bold text-blue-700"
						>
							<div class="text-xs">{player.player.username}</div>
							<div class="text-xs text-blue-500">HC: {player.playing_course_handicap || 0}</div>
						</th>
					{/each}
					<th class="min-w-[60px] border bg-blue-100 px-2 py-1 text-center font-bold">Team A</th>

					<!-- Team B Players -->
					{#each safeTeamBPlayers as player (player.player_id)}
						<th class="min-w-[80px] border bg-red-50 px-1 py-1 text-center font-bold text-red-700">
							<div class="text-xs">{player.player.username}</div>
							<div class="text-xs text-red-500">HC: {player.playing_course_handicap || 0}</div>
						</th>
					{/each}
					<th class="min-w-[60px] border bg-red-100 px-2 py-1 text-center font-bold">Team B</th>
				</tr>
			</thead>
			<tbody>
				{#each safeHoles as hole (hole)}
					{@const teamScore = teamScores[hole]}
					<tr>
						<td class="sticky left-0 z-10 border bg-gray-50 px-2 py-1 text-center font-bold"
							>{hole}</td
						>

						<!-- Team A Players -->
						{#each safeTeamAPlayers as player (player.player_id)}
							{@const netScore = calculateNetScore(player, hole)}
							{@const isUsed = isPlayerScoreUsed(player, hole)}
							<td
								class="border px-1 py-1 text-center {isUsed
									? 'bg-green-100 ring-2 ring-green-300'
									: ''}"
							>
								{#if !isLocked}
									<div class="relative">
										<input
											type="number"
											min="1"
											max="15"
											class="h-8 w-14 rounded border bg-blue-50 p-1 text-center text-sm font-semibold focus:bg-blue-100 focus:outline-none"
											value={player.scores?.[hole] || ''}
											on:input={(e) => handleScoreChange(player, hole, e)}
										/>
										{#if getStrokeForHole(player, hole)}
											<span class="absolute -top-1 -right-1 text-xs text-blue-600">•</span>
										{/if}
									</div>
									<div class="mt-1 text-xs text-gray-500">
										{netScore !== null ? `Net: ${netScore}` : ''}
									</div>
									<!-- Sync status -->
									{#if getSyncStatus}
										{@const status = getSyncStatus(player.player_id, hole)}
										{#if status === 'pending'}
											<span title="Pending sync" class="text-xs text-yellow-500">⏳</span>
										{:else if status === 'synced'}
											<span title="Synced" class="text-xs text-green-600">✔️</span>
										{:else if status === 'failed'}
											<span title="Sync failed" class="text-xs text-red-600">⚠️</span>
										{/if}
									{/if}
								{:else}
									<div>{player.scores?.[hole] || ''}</div>
									<div class="text-xs text-gray-500">
										{netScore !== null ? `Net: ${netScore}` : ''}
									</div>
								{/if}
							</td>
						{/each}

						<!-- Team A Best Score -->
						<td
							class="border bg-blue-100 px-2 py-1 text-center font-bold {teamScore?.winning_team ===
							'A'
								? 'bg-green-200 text-green-800'
								: teamScore?.winning_team === 'tie'
									? 'bg-yellow-200 text-yellow-800'
									: ''}"
						>
							{teamScore?.team_a_net || ''}
						</td>

						<!-- Team B Players -->
						{#each safeTeamBPlayers as player (player.player_id)}
							{@const netScore = calculateNetScore(player, hole)}
							{@const isUsed = isPlayerScoreUsed(player, hole)}
							<td
								class="border px-1 py-1 text-center {isUsed
									? 'bg-green-100 ring-2 ring-green-300'
									: ''}"
							>
								{#if !isLocked}
									<div class="relative">
										<input
											type="number"
											min="1"
											max="15"
											class="h-8 w-14 rounded border bg-red-50 p-1 text-center text-sm font-semibold focus:bg-red-100 focus:outline-none"
											value={player.scores?.[hole] || ''}
											on:input={(e) => handleScoreChange(player, hole, e)}
										/>
										{#if getStrokeForHole(player, hole)}
											<span class="absolute -top-1 -right-1 text-xs text-red-600">•</span>
										{/if}
									</div>
									<div class="mt-1 text-xs text-gray-500">
										{netScore !== null ? `Net: ${netScore}` : ''}
									</div>
									<!-- Sync status -->
									{#if getSyncStatus}
										{@const status = getSyncStatus(player.player_id, hole)}
										{#if status === 'pending'}
											<span title="Pending sync" class="text-xs text-yellow-500">⏳</span>
										{:else if status === 'synced'}
											<span title="Synced" class="text-xs text-green-600">✔️</span>
										{:else if status === 'failed'}
											<span title="Sync failed" class="text-xs text-red-600">⚠️</span>
										{/if}
									{/if}
								{:else}
									<div>{player.scores?.[hole] || ''}</div>
									<div class="text-xs text-gray-500">
										{netScore !== null ? `Net: ${netScore}` : ''}
									</div>
								{/if}
							</td>
						{/each}

						<!-- Team B Best Score -->
						<td
							class="border bg-red-100 px-2 py-1 text-center font-bold {teamScore?.winning_team ===
							'B'
								? 'bg-green-200 text-green-800'
								: teamScore?.winning_team === 'tie'
									? 'bg-yellow-200 text-yellow-800'
									: ''}"
						>
							{teamScore?.team_b_net || ''}
						</td>
					</tr>
				{/each}

				<!-- Front 9 Total -->
				<tr class="bg-gray-100 font-semibold">
					<td class="sticky left-0 z-10 border bg-gray-200 px-2 py-1 text-center">OUT</td>
					{#each safeTeamAPlayers as player}
						<td class="border px-1 py-1 text-center">{getPlayerTotal(player, frontNine)}</td>
					{/each}
					<td class="border bg-blue-200 px-2 py-1 text-center"
						>{getTeamTotal(safeTeamAPlayers, frontNine)}</td
					>
					{#each safeTeamBPlayers as player}
						<td class="border px-1 py-1 text-center">{getPlayerTotal(player, frontNine)}</td>
					{/each}
					<td class="border bg-red-200 px-2 py-1 text-center"
						>{getTeamTotal(safeTeamBPlayers, frontNine)}</td
					>
				</tr>

				<!-- Back 9 Total -->
				<tr class="bg-gray-100 font-semibold">
					<td class="sticky left-0 z-10 border bg-gray-200 px-2 py-1 text-center">IN</td>
					{#each safeTeamAPlayers as player}
						<td class="border px-1 py-1 text-center">{getPlayerTotal(player, backNine)}</td>
					{/each}
					<td class="border bg-blue-200 px-2 py-1 text-center"
						>{getTeamTotal(safeTeamAPlayers, backNine)}</td
					>
					{#each safeTeamBPlayers as player}
						<td class="border px-1 py-1 text-center">{getPlayerTotal(player, backNine)}</td>
					{/each}
					<td class="border bg-red-200 px-2 py-1 text-center"
						>{getTeamTotal(safeTeamBPlayers, backNine)}</td
					>
				</tr>

				<!-- Total -->
				<tr class="bg-gray-200 font-bold">
					<td class="sticky left-0 z-10 border bg-gray-300 px-2 py-1 text-center">TOTAL</td>
					{#each safeTeamAPlayers as player}
						<td class="border px-1 py-1 text-center">{getPlayerTotal(player, safeHoles)}</td>
					{/each}
					<td class="border bg-blue-300 px-2 py-1 text-center"
						>{getTeamTotal(safeTeamAPlayers, safeHoles)}</td
					>
					{#each safeTeamBPlayers as player}
						<td class="border px-1 py-1 text-center">{getPlayerTotal(player, safeHoles)}</td>
					{/each}
					<td class="border bg-red-300 px-2 py-1 text-center"
						>{getTeamTotal(safeTeamBPlayers, safeHoles)}</td
					>
				</tr>
			</tbody>
		</table>
	</div>
</div>
