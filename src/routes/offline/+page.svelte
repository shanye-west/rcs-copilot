<script>
	import { base } from '$app/paths';
</script>

<div class="flex flex-col items-center justify-center min-h-screen p-4 text-center">
	<div class="max-w-lg">
		<h1 class="text-3xl font-bold mb-4">You're Offline</h1>
		
		<div class="mb-6 p-6 bg-amber-50 rounded-lg border border-amber-200">
			<p class="mb-2">
				It looks like you're not connected to the internet right now.
			</p>
			<p>
				Don't worry - any scores you enter will be saved locally and synced when you reconnect.
			</p>
		</div>
		
		<div class="space-y-4">
			<a
				href="{base}/"
				class="block w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
			>
				Go to Home
			</a>
			
			{#if 'serviceWorker' in navigator}
				<button
					class="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100"
					on:click={() => location.reload()}
				>
					Try Again
				</button>
			{/if}
		</div>
	</div>
</div>
