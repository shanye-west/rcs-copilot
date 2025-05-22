<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import TournamentStats from '$lib/components/TournamentStats.svelte';
	import MatchCard from '$lib/components/MatchCard.svelte';

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
	
	// Calculate statistics for the tournament dashboard
	$: tournamentStats = {
		totalMatches: matches.length,
		completedMatches: matches.filter(m => m.status === 'complete' || m.status === 'completed').length,
		inProgressMatches: matches.filter(m => m.status === 'in_progress').length,
		scheduledMatches: matches.filter(m => m.status !== 'complete' && m.status !== 'completed' && m.status !== 'in_progress').length,
		leadingTeam: 'Team A', // This would need to be calculated based on actual match results
		leadingTeamScore: 5,    // Placeholder values
		trailingTeamScore: 3    // Placeholder values
	};
</script>

<section class="container mx-auto px-4 py-8">
	<div class="mb-8">
		{#if tournament}
			<div class="text-center mb-6">
				<h1 class="heading-lg mb-2">{tournament.name}</h1>
				<div class="text-blue-600">
					<span>Dates: {tournament.start_date || 'TBD'} - {tournament.end_date || 'TBD'}</span>
				</div>
			</div>
			
			{#if isAdmin}
				<div class="flex justify-center items-center gap-4 mb-8">
					<Button variant="outline" on:click={() => showEditTournament = true}>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						Edit Tournament
					</Button>
					<Button on:click={() => showAddRound = true}>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Add New Round
					</Button>
				</div>
			{/if}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Add New Round
					</Button>
				</div>
			{/if}
			
			<!-- Tournament Stats Dashboard -->
			<div class="mb-8">
				<TournamentStats stats={tournamentStats} />
			</div>
			
		{:else}
			<Card class="p-8 text-center">
				<h2 class="heading-md mb-4">No Tournament Active</h2>
				<p class="text-gray-600 mb-6">There is no active tournament at this time.</p>
				{#if isAdmin}
					<div class="flex justify-center">
						<Button>Create Tournament</Button>
					</div>
				{/if}
			</Card>
		{/if}
	</div>

	{#if tournament && rounds.length > 0}
		<div class="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
			{#each rounds as round (round.id)}
				<Card>
					<div class="mb-4 flex justify-between items-center">
						<div>
							<h2 class="heading-md">{round.name}</h2>
							<Badge variant="primary" class="mt-1">Round {round.sequence || ''}</Badge>
						</div>
						<Button 
							variant="outline" 
							size="sm" 
							href={`/rounds/${round.id}`}
						>
							View Details
						</Button>
					</div>
					
					<div class="space-y-4">
						{#each getMatchesForRound(round.id) as match (match.id)}
							<MatchCard 
								{match}
								teamAName={match.team_a_name} 
								teamBName={match.team_b_name}
								status={match.status}
								matchTypeName={getMatchTypeName(match.match_type_id)}
							/>
						{:else}
							<div class="p-4 bg-blue-50 rounded-md text-blue-800 text-center">
								No matches scheduled for this round yet.
							</div>
						{/each}
					</div>
				</Card>
			{/each}
		</div>
	{:else if tournament}
		<Card class="p-6 text-center">
			<p class="text-gray-600">No rounds have been added to this tournament yet.</p>
			{#if isAdmin}
				<div class="mt-4">
					<Button on:click={() => showAddRound = true}>Add First Round</Button>
				</div>
			{/if}
		</Card>
	{/if}

	<!-- Edit Tournament Modal -->
	{#if showEditTournament}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card class="max-w-md w-full">
				<div class="flex justify-between items-center mb-4">
					<h2 class="heading-md">Edit Tournament</h2>
					<button 
						class="text-gray-500 hover:text-gray-700"
						on:click={() => showEditTournament = false}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<!-- Tournament edit form would go here -->
				<!-- Placeholder for tournament edit form fields -->
				<div class="space-y-4 mb-6">
					<div>
						<label for="tournamentName" class="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
						<input 
							type="text" 
							id="tournamentName" 
							class="input w-full"
							value={tournament?.name || ''}
						/>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
							<input 
								type="date" 
								id="startDate" 
								class="input w-full"
								value={tournament?.start_date || ''}
							/>
						</div>
						<div>
							<label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
							<input 
								type="date" 
								id="endDate" 
								class="input w-full"
								value={tournament?.end_date || ''}
							/>
						</div>
					</div>
				</div>
				
				<div class="flex justify-end gap-3">
					<Button variant="outline" on:click={() => showEditTournament = false}>
						Cancel
					</Button>
					<Button>
						Save Changes
					</Button>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Add Round Modal -->
	{#if showAddRound}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card class="max-w-md w-full">
				<div class="flex justify-between items-center mb-4">
					<h2 class="heading-md">Add New Round</h2>
					<button 
						class="text-gray-500 hover:text-gray-700"
						on:click={() => showAddRound = false}
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<!-- Round add form would go here -->
				<!-- Placeholder for round add form fields -->
				<div class="space-y-4 mb-6">
					<div>
						<label for="roundName" class="block text-sm font-medium text-gray-700 mb-1">Round Name</label>
						<input 
							type="text" 
							id="roundName" 
							class="input w-full"
							placeholder="e.g. Round 1"
						/>
					</div>
					<div>
						<label for="roundDate" class="block text-sm font-medium text-gray-700 mb-1">Round Date</label>
						<input 
							type="date" 
							id="roundDate" 
							class="input w-full"
						/>
					</div>
					<div>
						<label for="roundSequence" class="block text-sm font-medium text-gray-700 mb-1">Sequence Number</label>
						<input 
							type="number" 
							id="roundSequence" 
							class="input w-full"
							min="1"
							placeholder="e.g. 1"
						/>
					</div>
				</div>
				
				<div class="flex justify-end gap-3">
					<Button variant="outline" on:click={() => showAddRound = false}>
						Cancel
					</Button>
					<Button>
						Add Round
					</Button>
				</div>
			</Card>
		</div>
	{/if}
</section>
