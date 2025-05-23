<script lang="ts">
	import Card from './Card.svelte';

	export let stats = {
		totalMatches: 0,
		completedMatches: 0,
		inProgressMatches: 0,
		scheduledMatches: 0,
		leadingTeam: '',
		leadingTeamScore: 0,
		trailingTeamScore: 0
	};
</script>

<Card class="bg-gradient-to-br from-blue-900 to-blue-800 text-white">
	<div class="p-1">
		<h2 class="mb-4 text-xl font-bold">Tournament Statistics</h2>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<h3 class="mb-2 text-lg font-semibold">Match Status</h3>
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span>Total Matches:</span>
						<span class="font-bold">{stats.totalMatches}</span>
					</div>
					<div class="flex items-center justify-between">
						<span>Completed:</span>
						<span class="font-bold">{stats.completedMatches}</span>
					</div>
					<div class="flex items-center justify-between">
						<span>In Progress:</span>
						<span class="font-bold">{stats.inProgressMatches}</span>
					</div>
					<div class="flex items-center justify-between">
						<span>Scheduled:</span>
						<span class="font-bold">{stats.scheduledMatches}</span>
					</div>
				</div>
			</div>

			{#if stats.leadingTeam}
				<div>
					<h3 class="mb-2 text-lg font-semibold">Leaderboard</h3>
					<div class="bg-opacity-40 rounded-md bg-blue-950 p-3">
						<div class="mb-2">
							<span class="text-xs tracking-wide uppercase opacity-75">Leading Team</span>
							<div class="text-lg font-bold">{stats.leadingTeam}</div>
						</div>
						<div class="flex items-center justify-between">
							<div class="text-3xl font-bold">{stats.leadingTeamScore}</div>
							<div class="text-xl">-</div>
							<div class="text-3xl font-bold">{stats.trailingTeamScore}</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</Card>
