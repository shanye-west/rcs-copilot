<script>
	import { base } from '$app/paths';
</script>

<div class="flex min-h-screen flex-col items-center justify-center p-4 text-center">
	<div class="max-w-lg">
		<h1 class="mb-4 text-3xl font-bold">You're Offline</h1>

		<div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-6">
			<p class="mb-2">It looks like you're not connected to the internet right now.</p>
			<p>Don't worry - any scores you enter will be saved locally and synced when you reconnect.</p>
		</div>

		<div class="space-y-4">
			<a
				href="{base}/"
				class="block w-full rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
			>
				Go to Home
			</a>

			{#if 'serviceWorker' in navigator}
				<button
					class="w-full rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100"
					on:click={() => location.reload()}
				>
					Try Again
				</button>
			{/if}
		</div>
	</div>
</div>
