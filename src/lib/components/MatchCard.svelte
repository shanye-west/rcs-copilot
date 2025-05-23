<script lang="ts">
	import Badge from './Badge.svelte';
	import Button from './Button.svelte';

	export let match;
	export let matchTypeName = '';
	export let teamAName = '';
	export let teamBName = '';
	export let status = 'scheduled';
	export let leadingTeam = null;
	export let leadAmount = null;

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

	$: formattedStatus =
		status === 'complete' ? 'Completed' : status === 'in_progress' ? 'In Progress' : 'Scheduled';

	$: statusVariant = getStatusVariant(status);
</script>

<div class="rounded-lg border border-gray-100 p-4 transition-colors duration-200 hover:bg-gray-50">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<div class="mb-2 flex items-center">
				<span class="text-lg font-semibold">{teamAName}</span>
				<span class="mx-2 text-gray-400">vs</span>
				<span class="text-lg font-semibold">{teamBName}</span>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant={statusVariant}>
					{formattedStatus}
				</Badge>
				{#if matchTypeName}
					<Badge variant="primary">
						{matchTypeName}
					</Badge>
				{/if}
			</div>

			{#if leadingTeam && leadAmount && status === 'in_progress'}
				<div class="mt-2 text-sm text-blue-700">
					<span class="font-medium">{leadingTeam}</span> leads by
					<span class="font-medium">{leadAmount}</span>
				</div>
			{/if}
		</div>

		<Button variant="secondary" size="sm" href={`/matches/${match.id}`}>View Match</Button>
	</div>
</div>
