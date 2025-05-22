<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Card from '$lib/components/Card.svelte';

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

<div class="flex min-h-screen items-center justify-center bg-slate-50">
	<Card class="w-full max-w-md p-8">
		<div class="text-center mb-8">
			<h1 class="heading-lg mb-2">Rowdy Cup</h1>
			<p class="text-blue-600">Tournament Management</p>
		</div>

		{#if error}
			<div class="mb-6 rounded-md bg-red-50 p-4 text-red-700 border-l-4 border-red-500">
				{error}
			</div>
		{/if}

		<form on:submit|preventDefault={handleLogin} class="space-y-6">
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700 mb-1">Username</label>
				<Input
					id="username"
					bind:value={username}
					placeholder="Enter your username"
					autocomplete="username"
				/>
			</div>

			<div>
				<label for="pin" class="block text-sm font-medium text-gray-700 mb-1">PIN</label>
				<Input
					type="password"
					id="pin"
					inputmode="numeric"
					bind:value={pin}
					maxlength="4"
					placeholder="Enter your 4-digit PIN"
					autocomplete="current-password"
				/>
			</div>

			<Button
				type="submit"
				variant="primary"
				fullWidth={true}
				disabled={loading}
			>
				{loading ? 'Logging in...' : 'Login'}
			</Button>
		</form>
	</Card>
</div>
