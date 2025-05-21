<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let username = '';
	let pin = '';
	let loading = false;
	let error = '';
	let redirectTo = '/';

	onMount(() => {
		// Get redirect parameter from URL
		const urlParams = new URLSearchParams($page.url.search);
		if (urlParams.has('redirect')) {
			redirectTo = urlParams.get('redirect') || '/';
		}

		// If already logged in, redirect
		if ($auth.user) {
			goto(redirectTo);
		}
	});

	async function handleLogin() {
		if (!username || !pin) {
			error = 'Username and PIN are required';
			return;
		}

		if (pin.length !== 4 || !/^\d+$/.test(pin)) {
			error = 'PIN must be 4 digits';
			return;
		}

		loading = true;
		error = '';

		console.log(`Attempting login with username: ${username}, PIN: ${pin}`);

		const result = await auth.login(username, pin);

		console.log('Login result:', result);

		if (result.success) {
			goto(redirectTo);
		} else {
			error = result.message || 'Login failed';
			console.error('Login error details:', error);
		}

		loading = false;
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
		<h1 class="mb-6 text-center text-2xl font-bold">Rowdy Cup Login</h1>

		{#if error}
			<div class="mb-4 rounded bg-red-100 p-3 text-red-700">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-4">
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700">Username</label>
				<input
					type="text"
					id="username"
					bind:value={username}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
					placeholder="Enter your username"
					autocomplete="username"
				/>
			</div>

			<div>
				<label for="pin" class="block text-sm font-medium text-gray-700">PIN</label>
				<input
					type="password"
					id="pin"
					inputmode="numeric"
					bind:value={pin}
					maxlength="4"
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
					placeholder="Enter your 4-digit PIN"
					autocomplete="current-password"
				/>
			</div>

			<button
				type="submit"
				class="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				disabled={loading}
			>
				{loading ? 'Logging in...' : 'Login'}
			</button>
		</form>
	</div>
</div>
