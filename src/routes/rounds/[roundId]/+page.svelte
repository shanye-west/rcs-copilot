<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import MatchCard from '$lib/components/MatchCard.svelte';
	
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

	function formatDate(dateString) {
		if (!dateString) return 'TBD';
		const date = new Date(dateString);
		if (isNaN(date.getTime())) return dateString;
		
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short', 
			day: 'numeric'
		});
	}

	// Function to get player names for a match
	function getMatchPlayers(match) {
		const teamAPlayers = match.team_a_players || [];
		const teamBPlayers = match.team_b_players || [];
		return {
			teamAPlayers,
			teamBPlayers
		};
	}
</script>

<section class="container mx-auto max-w-3xl px-4 py-6">
	{#if round && tournament}
		<!-- Round Header Card -->
		<Card padding="p-0">
			<!-- Navigation breadcrumb -->
			<div class="p-4 border-b border-gray-100">
				<div class="text-sm text-blue-600">
					<a href="/" class="hover:underline">{tournament.name}</a> &rarr; {round.name}
				</div>
			</div>

			<!-- Round Info Header -->
			<div class="bg-gray-800 text-white px-4 py-5">
				<h1 class="text-xl font-bold">{round.name}</h1>
				<p class="text-sm text-gray-300 mt-1">{round.course || 'TBD'}</p>
				<p class="text-sm text-gray-300">{getMatchTypeName(round.match_type_id) || 'Match'}</p>
			</div>

			<!-- Score Display -->
			<div class="p-4">
				<div class="flex items-center justify-between mb-4">
					<!-- Team A -->
					<div class="flex items-center">
						<div class="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
							AVIATORS
						</div>
					</div>

					<!-- Score Display -->
					<div class="text-2xl font-mono font-bold">
						{round.team_a_score || '0'} - {round.team_b_score || '0'}
					</div>

					<!-- Team B -->
					<div class="flex items-center">
						<div class="w-16 h-16 bg-red-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
							PRODUCERS
						</div>
					</div>
				</div>

				<!-- Date Information -->
				<div class="text-center text-gray-500 text-sm">
					{formatDate(round.date)} • {round.start_time || 'TBD'}
				</div>
			</div>
		</Card>

		<!-- Matches List -->
		<div class="mt-6">
			<h2 class="text-lg font-semibold text-gray-700 mb-4 px-1">Matches</h2>
			
			{#if matches && matches.length > 0}
				<div class="space-y-4">
					{#each matches as match (match.id)}
						<!-- Match Card -->
						<div class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
							<a href={`/matches/${match.id}`} class="block">
								<!-- Match Header -->
								<div class="p-4 border-b border-gray-100">
									<div class="flex items-center justify-between">
										<Badge variant={getStatusVariant(match.status)} size="sm">
											{match.status === 'complete' ? 'Completed' : match.status === 'in_progress' ? 'In Progress' : 'Upcoming'}
										</Badge>
										<Badge variant="primary" size="sm">
											{getMatchTypeName(match.match_type_id)}
										</Badge>
									</div>
								</div>

								<!-- Match Teams -->
								<div class="p-4">
									<div class="flex justify-between">
										<!-- Team A -->
										<div class="w-5/12">
											<div class="flex items-center mb-2">
												<div class="w-3 h-3 bg-blue-900 rounded-full mr-2"></div>
												<span class="font-medium text-blue-800">Aviators</span>
											</div>
											<div class="text-sm text-gray-600">
												{match.team_a_players ? match.team_a_players.join(', ') : ''}
											</div>
										</div>

										<!-- vs indicator -->
										<div class="flex flex-col items-center justify-center">
											<span class="text-xs text-gray-400">vs</span>
										</div>

										<!-- Team B -->
										<div class="w-5/12 text-right">
											<div class="flex items-center justify-end mb-2">
												<span class="font-medium text-red-800">Producers</span>
												<div class="w-3 h-3 bg-red-700 rounded-full ml-2"></div>
											</div>
											<div class="text-sm text-gray-600">
												{match.team_b_players ? match.team_b_players.join(', ') : ''}
											</div>
										</div>
									</div>

									<!-- Match Result/Score -->
									{#if match.status === 'complete' && match.result}
										<div class="mt-4 text-center">
											<div class="inline-block bg-gray-100 px-3 py-1 rounded-lg font-medium">
												{match.leading_team === 'aviators' 
													? 'Aviators win ' 
													: 'Producers win '}
												{match.result}
											</div>
										</div>
									{:else if match.status === 'in_progress' && match.leading_team}
										<div class="mt-4 text-center">
											<div class="inline-block bg-gray-100 px-3 py-1 rounded-lg font-medium">
												{match.leading_team === 'aviators' 
													? 'Aviators lead ' 
													: 'Producers lead '}
												{match.lead_amount} UP
											</div>
										</div>
									{:else if match.status === 'in_progress'}
										<div class="mt-4 text-center">
											<div class="inline-block bg-gray-100 px-3 py-1 rounded-lg font-medium">
												ALL SQUARE
											</div>
										</div>
									{/if}
								</div>
							</a>
						</div>
					{/each}
				</div>
			{:else}
				<div class="p-4 bg-blue-50 rounded-lg text-blue-800">
					No matches have been scheduled for this round yet.
				</div>
			{/if}
		</div>
	{:else}
		<div class="p-4 bg-red-50 rounded-lg text-red-800">
			Round information not found.
		</div>
	{/if}
</section>
		</div>
	{/if}
</section>
