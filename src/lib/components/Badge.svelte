<script lang="ts">
	export let variant = 'primary'; // primary, success, warning, danger
	export let size = 'md'; // sm, md, lg

	$: classes = [
		// Base
		'inline-flex items-center justify-center font-medium rounded-full',

		// Size
		size === 'sm'
			? 'text-xs px-2 py-0.5'
			: size === 'lg'
				? 'text-sm px-3 py-1'
				: 'text-xs px-2.5 py-0.5', // Default (md)

		// Variants
		variant === 'primary'
			? 'bg-blue-100 text-blue-800'
			: variant === 'success'
				? 'bg-green-100 text-green-800'
				: variant === 'warning'
					? 'bg-amber-100 text-amber-800'
					: variant === 'danger'
						? 'bg-red-100 text-red-800'
						: 'bg-gray-100 text-gray-800' // Default
	].join(' ');
</script>

<span class={classes}>
	<slot />
</span>
