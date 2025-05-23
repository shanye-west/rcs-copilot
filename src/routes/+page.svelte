<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	export let data;
	const { tournament, rounds, matches, matchTypes } = data;

	let error = null;
  let isAdmin = false;
	let showEditTournament = false;
	let showAddRound = false;

	onMount(() => {
		const unsubscribe = auth.subscribe((state) => {
			isAdmin = !!state.user?.isAdmin;
		});
		return unsubscribe;
	});

	function getMatchesForRound(roundId: string) {
		return matches.filter((m) => m.round_id === roundId);
	}

	function getMatchTypeName(matchTypeId: string) {
		const type = matchTypes.find((t) => t.id === matchTypeId);
		return type ? type.name : matchTypeId;
	}

	// Calculate team scores
	function calculateTeamScores() {
		// This would calculate from actual match results
		return { aviators: 0, producers: 0 };
	}

	$: teamScores = calculateTeamScores();
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-6">
		<!-- Error Display -->
		{#if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium">Error Loading Tournament Data</h3>
						<p class="mt-1 text-sm">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Admin Controls (if admin) -->
		{#if isAdmin}
			<div class="mb-6 flex flex-col gap-3 sm:flex-row">
				<button
					on:click={() => (showEditTournament = true)}
					class="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					{tournament ? 'Edit Tournament' : 'Create Tournament'}
				</button>

				{#if tournament}
					<button
						on:click={() => (showAddRound = true)}
						class="flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Add New Round
					</button>
				{/if}

				<a
					href="/admin"
					class="flex items-center justify-center rounded-lg bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700"
				>
					Admin Panel
				</a>
			</div>
		{/if}

		{#if tournament}
			<!-- Tournament Header -->
			<div class="mb-8 text-center">
				<h1 class="mb-2 text-3xl font-bold text-gray-900">{tournament.name}</h1>
				<p class="text-gray-600">2025 Golf Tournament</p>
			</div>

			<!-- Team Score Display -->
			<div class="mb-8">
				<div class="flex items-center justify-center space-x-8">
					<!-- Aviators -->
					<div class="text-center">
						<div class="min-w-[140px] rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<!-- Team Logo Placeholder -->
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-900"
							>
								<span class="text-sm font-bold text-white">AVIATORS</span>
							</div>
							<div class="mb-2 text-4xl font-bold text-gray-900">{teamScores.aviators}</div>
						</div>
					</div>

					<!-- VS -->
					<div class="text-2xl font-bold text-gray-600">VS</div>

					<!-- Producers -->
					<div class="text-center">
						<div class="min-w-[140px] rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<!-- Team Logo Placeholder -->
							<div
								class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-700"
							>
								<span class="text-sm font-bold text-white">PRODUCERS</span>
							</div>
							<div class="mb-2 text-4xl font-bold text-gray-900">{teamScores.producers}</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Tournament Rounds Section -->
			<div class="mb-6">
				<h2 class="mb-4 text-xl font-semibold text-gray-900">Tournament Rounds</h2>

				{#if rounds.length === 0}
					<div class="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
						<p class="mb-4 text-gray-500">No rounds have been created yet.</p>
						{#if isAdmin}
							<button
								on:click={() => (showAddRound = true)}
								class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
							>
								Create First Round
							</button>
						{/if}
					</div>
				{:else}
					<div class="space-y-4">
						{#each rounds as round (round.id)}
							{@const roundMatches = getMatchesForRound(round.id)}

							<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
								<!-- Round Header -->
								<div class="border-b border-gray-200 px-6 py-4">
									<div class="flex items-center justify-between">
										<div>
											<h3 class="text-lg font-semibold text-gray-900">{round.name}</h3>
											<div class="mt-1 flex items-center space-x-4 text-sm text-gray-500">
												<span>Round {round.sequence}</span>
												<span>{roundMatches.length} matches</span>
											</div>
										</div>
										<a
											href={`/rounds/${round.id}`}
											class="flex items-center font-medium text-blue-600 hover:text-blue-700"
										>
											View Round
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="ml-1 h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 5l7 7-7 7"
												/>
											</svg>
										</a>
									</div>
								</div>

								<!-- Round Matches Preview -->
								{#if roundMatches.length > 0}
									<div class="px-6 py-4">
										<div class="text-sm text-gray-600">
											{roundMatches.length} match{roundMatches.length === 1 ? '' : 'es'} scheduled
										</div>
									</div>
								{:else}
									<div class="px-6 py-4 text-sm text-gray-500">No matches scheduled yet</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{:else}
			<!-- No Tournament State -->
			<div class="py-12 text-center">
				<div class="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
					<div class="mb-4 text-6xl">🏆</div>
					<h2 class="mb-2 text-2xl font-bold text-gray-900">No Active Tournament</h2>
					<p class="mb-6 text-gray-600">Create a tournament to get started with the Rowdy Cup!</p>

					{#if isAdmin}
						<button
							on:click={() => (showEditTournament = true)}
							class="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
						>
							Create Tournament
						</button>
					{:else}
						<p class="text-sm text-gray-500">Contact an admin to set up the tournament.</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Tournament Modal -->
{#if showEditTournament}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">
					{tournament ? 'Edit Tournament' : 'Create Tournament'}
				</h2>
				<button
					class="text-gray-400 hover:text-gray-600"
					on:click={() => (showEditTournament = false)}
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="mb-6 space-y-4">
				<div>
					<label for="tournamentName" class="mb-1 block text-sm font-medium text-gray-700"
						>Tournament Name</label
					>
					<input
						id="tournamentName"
						type="text"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						value={tournament?.name || 'Rowdy Cup 2025'}
						placeholder="Enter tournament name"
					/>
				</div>
			</div>

			<div class="flex justify-end gap-3">
				<button
					on:click={() => (showEditTournament = false)}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
					{tournament ? 'Save Changes' : 'Create Tournament'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Add Round Modal -->
{#if showAddRound}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold">Add New Round</h2>
				<button class="text-gray-400 hover:text-gray-600" on:click={() => (showAddRound = false)}>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="mb-6 space-y-4">
				<div>
					<label for="roundName" class="mb-1 block text-sm font-medium text-gray-700"
						>Round Name</label
					>
					<input
						id="roundName"
						type="text"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						placeholder="e.g. Round 1"
					/>
				</div>
			</div>

			<div class="flex justify-end gap-3">
				<button
					on:click={() => (showAddRound = false)}
					class="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
					Add Round
				</button>
			</div>
		</div>
	</div>
{/if}
