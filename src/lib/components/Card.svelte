<script lang="ts">
	export let title = '';
	export let subtitle = '';
	export let padding = 'p-4';
	export let shadow = 'shadow-md';
	export let border = 'border border-gray-100';
	export let rounded = 'rounded-lg';
</script>

<div class="bg-white {padding} {shadow} {border} {rounded}">
	{#if title}
		<div class="mb-4">
			<h2 class="text-xl font-semibold text-blue-900">{title}</h2>
			{#if subtitle}
				<p class="text-sm text-gray-600">{subtitle}</p>
			{/if}
		</div>
	{/if}
	<slot />
</div>
