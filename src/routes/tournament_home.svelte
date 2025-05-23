<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let isAdmin = false;
	onMount(() => {
		const unsubscribe = auth.subscribe((state) => {
			isAdmin = !!state.user?.isAdmin;
		});
		return unsubscribe;
	});

	export let data;
	const { tournament, rounds, matches, matchTypes } = data;

	function getMatchesForRound(roundId: string) {
		return matches.filter((m) => m.round_id === roundId);
	}

	function getMatchTypeName(matchTypeId: string) {
		const type = matchTypes.find((t) => t.id === matchTypeId);
		return type ? type.name : matchTypeId;
	}

	let showEditTournament = false;
	let showAddRound = false;
</script>

<section class="container mx-auto px-4 py-6">
	<div class="mb-6 flex flex-col items-center justify-center">
		{#if tournament}
			<h1 class="mb-2 text-center text-3xl font-extrabold tracking-tight text-blue-900">
				{tournament.name}
			</h1>
			<div class="mb-4 text-center text-gray-600">
				<span>Dates: {tournament.start_date} - {tournament.end_date}</span>
			</div>

			{#if isAdmin}
				<div class="mb-5 flex items-center justify-center gap-4">
					<Button variant="outline" on:click={() => (showEditTournament = true)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-1 inline h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							/>
						</svg>
						Edit Tournament
					</Button>
					<Button on:click={() => (showAddRound = true)}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-1 inline h-4 w-4"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						Add New Round
					</Button>
				</div>
			{/if}
		{:else}
			<Card title="No Tournament" padding="p-8">
				<p class="text-center text-gray-600">No active tournament found.</p>
				{#if isAdmin}
					<div class="mt-4 flex justify-center">
						<Button>Create Tournament</Button>
					</div>
				{/if}
			</Card>
		{/if}
	</div>

	{#if tournament}
		<div class="mt-6 grid gap-6 md:grid-cols-1 lg:grid-cols-2">
			{#each rounds as round (round.id)}
				<Card title={round.name}>
					<div class="mb-3 flex items-center justify-between">
						<Badge variant="primary">Round {round.sequence}</Badge>
						<a
							href={`/rounds/${round.id}`}
							class="flex items-center font-medium text-blue-700 hover:text-blue-900"
						>
							View Details
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

					<ul class="divide-y divide-gray-100">
						{#each getMatchesForRound(round.id) as match (match.id)}
							<li class="py-3">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="flex items-center space-x-3">
											<span class="font-medium text-blue-800">{match.team_a_name}</span>
											<span class="text-gray-400">vs</span>
											<span class="font-medium text-blue-800">{match.team_b_name}</span>
										</div>
										<div class="mt-1 flex items-center">
											<Badge
												variant={match.status === 'completed'
													? 'success'
													: match.status === 'in_progress'
														? 'warning'
														: 'primary'}
												size="sm"
											>
												{match.status}
											</Badge>
											<span class="ml-2 text-xs text-gray-500"
												>{getMatchTypeName(match.match_type_id)}</span
											>
										</div>
									</div>

									<a href={`/matches/${match.id}`} class="text-blue-700 hover:text-blue-900">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
											/>
										</svg>
									</a>
								</div>
							</li>
						{:else}
							<li class="py-3 text-center text-gray-500">No matches in this round</li>
						{/each}
					</ul>
				</Card>
			{/each}
		</div>
	{/if}

	{#if showEditTournament}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
				<h2 class="mb-4 text-xl font-bold text-blue-900">Edit Tournament</h2>
				<!-- Tournament edit form goes here -->
				<div class="mt-4 flex justify-end">
					<Button variant="outline" on:click={() => (showEditTournament = false)}>Cancel</Button>
					<Button class="ml-2">Save Changes</Button>
				</div>
			</div>
		</div>
	{/if}

	{#if showAddRound}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
				<h2 class="mb-4 text-xl font-bold text-blue-900">Add New Round</h2>
				<!-- Add round form goes here -->
				<div class="mt-4 flex justify-end">
					<Button variant="outline" on:click={() => (showAddRound = false)}>Cancel</Button>
					<Button class="ml-2">Add Round</Button>
				</div>
			</div>
		</div>
	{/if}
</section>
