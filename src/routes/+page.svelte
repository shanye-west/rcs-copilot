<script lang="ts">
	export let data;
	const { tournament, rounds, matches, matchTypes } = data;

	function getMatchesForRound(roundId: string) {
		return matches.filter((m) => m.round_id === roundId);
	}

	function getMatchTypeName(matchTypeId: string) {
		const type = matchTypes.find((t) => t.id === matchTypeId);
		return type ? type.name : matchTypeId;
	}
</script>

<section class="mx-auto max-w-3xl p-4">
	<nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
		<a href="/" class="text-blue-600 hover:underline">Home</a>
		<span class="mx-1">/</span>
		<span class="font-semibold text-gray-700">Tournament</span>
	</nav>
	{#if tournament}
		<h1 class="mb-2 text-3xl font-bold">{tournament.name}</h1>
		<div class="mb-6 text-gray-600">
			<span>Dates: {tournament.start_date} - {tournament.end_date}</span>
		</div>
		{#each rounds as round (round.id)}
			<div class="mb-6 rounded-lg border bg-white p-4 shadow">
				<div class="mb-2 flex items-center">
					<h2 class="flex-1 text-xl font-semibold">{round.name}</h2>
					<a
						href={`/rounds/${round.id}`}
						class="ml-2 flex items-center text-blue-600 hover:text-blue-800"
						title="View Round"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-1 h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/></svg
						>
						<span class="hidden sm:inline">Go to Round</span>
					</a>
				</div>
				<ul>
					{#each getMatchesForRound(round.id) as match}
						<li
							class="mb-2 flex flex-col border-b p-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
						>
							<div>
								<span class="font-semibold">{match.team_a_name}</span>
								<span class="mx-2 text-gray-400">vs</span>
								<span class="font-semibold">{match.team_b_name}</span>
								<span class="ml-4 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
									>{match.status}</span
								>
							</div>
							<div class="mt-2 flex items-center gap-2 sm:mt-0">
								<span class="text-sm text-gray-500"
									>Match Type: {getMatchTypeName(match.match_type_id)}</span
								>
								<a
									href={`/matches/${match.id}`}
									class="ml-2 flex items-center text-green-600 hover:text-green-800"
									title="View Match"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										><path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 19l7-7-7-7"
										/></svg
									>
								</a>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	{:else}
		<div class="py-12 text-center text-gray-500">
			<p>No active tournament found.</p>
		</div>
	{/if}
</section>
