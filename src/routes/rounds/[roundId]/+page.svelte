<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	
	export let data;
	const { round, matches, matchTypes, tournament } = data;

	function getMatchTypeName(matchTypeId: string) {
		const type = matchTypes.find((t) => t.id === matchTypeId);
		return type ? type.name : matchTypeId;
	}
	
	function getStatusVariant(status) {
		switch (status.toLowerCase()) {
			case 'completed':
			case 'complete':
				return 'success';
			case 'in_progress':
				return 'warning';
			default:
				return 'secondary';
		}
	}
</script>

<section class="container mx-auto max-w-3xl px-4 py-6">
	<Card>
		{#if round && tournament}
			<div class="mb-6">
				<div class="mb-2 text-sm text-blue-600">
					<a href="/" class="hover:underline">{tournament.name}</a> &rarr; {round.name}
				</div>
				<h1 class="heading-lg mb-2">{round.name}</h1>
				<div class="text-gray-600">
					<span>Round Date: {round.date || 'TBD'}</span>
				</div>
			</div>
			
			<div class="space-y-4">
				{#each matches as match (match.id)}
					<div class="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
						<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
							<div>
								<div class="flex items-center mb-2">
									<span class="font-semibold text-lg">{match.team_a_name}</span>
									<span class="mx-2 text-gray-400">vs</span>
									<span class="font-semibold text-lg">{match.team_b_name}</span>
								</div>
								<div class="flex flex-wrap gap-2 items-center">
									<Badge variant={getStatusVariant(match.status)}>
										{match.status === 'complete' ? 'Completed' : match.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
									</Badge>
									<Badge variant="primary">
										{getMatchTypeName(match.match_type_id)}
									</Badge>
								</div>
							</div>
							<Button 
								variant="secondary" 
								size="sm" 
								href={`/matches/${match.id}`}
							>
								View Match
							</Button>
						</div>
					</div>
				{:else}
					<div class="p-4 bg-blue-50 rounded-md text-blue-800">
						No matches have been scheduled for this round yet.
					</div>
				{/each}
			</div>
		{:else}
			<div class="p-4 bg-red-50 rounded-md text-red-800">
				Round information not found.
			</div>
		{/if}
	</Card>
</section>
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
	{:else}
		<div class="py-12 text-center text-gray-500">
			<p>Round not found.</p>
		</div>
	{/if}
</section>
