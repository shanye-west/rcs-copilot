<script lang="ts">
	import { supabase } from '$lib/supabase';

	let username = '';
	let fullName = '';
	let pin = '';
	let isAdmin = false;
	let loading = false;
	let error = '';
	let success = '';

	async function createUser() {
		if (!username || !fullName || !pin) {
			error = 'All fields are required';
			return;
		}

		if (pin.length !== 4 || !/^\d+$/.test(pin)) {
			error = 'PIN must be 4 digits';
			return;
		}

		loading = true;
		error = '';
		success = '';

		try {
			// Convert username to email format for Supabase auth
			const email = `${username}@rowdycup.app`;

			// Pad the PIN to meet the 6-character minimum requirement
			// Supabase requires minimum 6-character passwords, but our app uses 4-digit PINs
			const paddedPin = pin.padEnd(6, '0');

			// Create auth user
			const { data: authData, error: authError } = await supabase.auth.admin.createUser({
				email,
				password: paddedPin,
				email_confirm: true
			});

			if (authError) throw authError;

			// Create player record
			const { error: playerError } = await supabase.from('players').insert({
				id: authData.user.id,
				username,
				full_name: fullName,
				is_admin: isAdmin
			});

			if (playerError) throw playerError;

			success = `User ${username} created successfully`;
			username = '';
			fullName = '';
			pin = '';
			isAdmin = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create user';
		} finally {
			loading = false;
		}
	}
</script>

<div class="overflow-hidden bg-white shadow sm:rounded-lg">
	<div class="px-4 py-5 sm:px-6">
		<h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
		<p class="mt-1 max-w-2xl text-sm text-gray-500">Manage users and settings</p>
	</div>

	<div class="border-t border-gray-200">
		<div class="px-4 py-5 sm:p-6">
			<h2 class="text-lg font-medium text-gray-900">Create New User</h2>

			{#if error}
				<div class="mt-4 rounded bg-red-100 p-3 text-red-700">
					{error}
				</div>
			{/if}

			{#if success}
				<div class="mt-4 rounded bg-green-100 p-3 text-green-700">
					{success}
				</div>
			{/if}

			<form on:submit|preventDefault={createUser} class="mt-5 space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700">Username</label>
					<input
						type="text"
						id="username"
						bind:value={username}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
						placeholder="Enter username"
					/>
				</div>

				<div>
					<label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
					<input
						type="text"
						id="fullName"
						bind:value={fullName}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
						placeholder="Enter full name"
					/>
				</div>

				<div>
					<label for="pin" class="block text-sm font-medium text-gray-700">4-Digit PIN</label>
					<input
						type="password"
						id="pin"
						inputmode="numeric"
						bind:value={pin}
						maxlength="4"
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
						placeholder="Enter 4-digit PIN"
					/>
				</div>

				<div class="flex items-center">
					<input
						type="checkbox"
						id="isAdmin"
						bind:checked={isAdmin}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="isAdmin" class="ml-2 block text-sm text-gray-900"> Is Administrator </label>
				</div>

				<button
					type="submit"
					class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
					disabled={loading}
				>
					{loading ? 'Creating...' : 'Create User'}
				</button>
			</form>
		</div>
	</div>
</div>
