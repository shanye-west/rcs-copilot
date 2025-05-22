<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { error } from '@sveltejs/kit';
	import { page } from '$app/stores';

	export let data;

	let tournaments = data.tournaments || [];
	let isLoading = false;
	let newTournamentName = '';
	let addError: string | null = null;

	async function addTournament() {
		addError = null;
		if (!newTournamentName.trim()) {
			addError = 'Tournament name required.';
			return;
		}

		const { error: err } = await supabase.from('tournaments').insert({
			name: newTournamentName.trim()
		});

		if (err) {
			addError = err.message;
		} else {
			newTournamentName = '';
			// Reload tournaments
			const { data: t, error: err2 } = await supabase.from('tournaments').select('*');
			if (!err2) tournaments = t || [];
		}
	}

	async function deleteTournament(tournamentId: string) {
		if (!confirm('Delete this tournament? This will also delete all associated rounds and matches.')) return;
		await supabase.from('tournaments').delete().eq('id', tournamentId);
		tournaments = tournaments.filter(t => t.id !== tournamentId);
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

	<div class="border-t border-gray-200">
		<div class="px-4 py-5 sm:p-6">
			<h2 class="text-lg font-medium text-gray-900">Tournament Management</h2>

			<form class="mb-4 flex gap-2" on:submit|preventDefault={addTournament}>
				<input class="border rounded px-2 py-1 flex-grow" placeholder="New tournament name" bind:value={newTournamentName} />
				<button class="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Add Tournament</button>
			</form>

			{#if addError}
				<div class="text-red-600 mb-2">{addError}</div>
			{/if}

			{#if data.error}
				<div class="text-red-600">{data.error}</div>
			{:else}
				<ul>
					{#each tournaments as t}
						<li class="mb-2 flex items-center gap-2">
							<a class="text-blue-700 underline" href={`/admin/tournament/${t.id}`}>{t.name}</a>
							<button class="text-xs text-red-600" on:click={() => deleteTournament(t.id)}>Delete</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
