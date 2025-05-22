<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { error } from '@sveltejs/kit';
	import { page } from '$app/stores';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';

	export let data;

	let tournaments = data.tournaments || [];
	let isLoading = false;
	let newTournamentName = '';
	let addError: string | null = null;

	let username = '';
	let fullName = '';
	let pin = '';
	let isAdmin = false;
	let success = '';
	let loading = false;

	async function addTournament() {
		addError = null;
		if (!newTournamentName.trim()) {
			addError = 'Tournament name required.';
			return;
		}

		loading = true;
		const { error: err } = await supabase.from('tournaments').insert({
			name: newTournamentName.trim()
		});
		loading = false;

		if (err) {
			addError = err.message;
		} else {
			newTournamentName = '';
			success = 'Tournament added successfully!';
			setTimeout(() => success = '', 3000);
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

	async function createUser() {
		loading = true;
		success = '';
		// Implement user creation logic here or leave as a stub
		// ...
		loading = false;
	}
</script>

<div class="container mx-auto px-4 py-8">
	<Card>
		<div class="flex items-center justify-between mb-6">
			<h1 class="heading-lg">Admin Dashboard</h1>
			<Badge variant="primary">Administrator</Badge>
		</div>

		<div class="mb-8">
			<h2 class="heading-md mb-4">Create New User</h2>

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
					<Input id="username" bind:value={username} placeholder="Enter username" />
				</div>

				<div>
					<label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
					<Input id="fullName" bind:value={fullName} placeholder="Enter full name" />
				</div>

				<div>
					<label for="pin" class="block text-sm font-medium text-gray-700">4-Digit PIN</label>
					<Input 
						id="pin" 
						type="password" 
						inputmode="numeric" 
						bind:value={pin} 
						maxlength="4" 
						placeholder="Enter 4-digit PIN" 
					/>
				</div>

				<div class="flex items-center mt-4">
					<input
						type="checkbox"
						id="isAdmin"
						bind:checked={isAdmin}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<label for="isAdmin" class="ml-2 block text-sm text-gray-900"> Is Administrator </label>
				</div>

				<Button type="submit" disabled={loading}>
					{loading ? 'Creating...' : 'Create User'}
				</Button>
			</form>
		</div>

		<div class="pt-6 border-t border-gray-200">
			<h2 class="heading-md mb-4">Tournament Management</h2>

			<div class="mb-6">
				<form class="flex gap-2" on:submit|preventDefault={addTournament}>
					<Input 
						placeholder="New tournament name" 
						bind:value={newTournamentName} 
						class="flex-grow" 
					/>
					<Button type="submit" disabled={loading}>
						{loading ? 'Adding...' : 'Add Tournament'}
					</Button>
				</form>

				{#if addError}
					<div class="text-red-600 mt-2 text-sm">{addError}</div>
				{/if}
				
				{#if success}
					<div class="text-green-600 mt-2 text-sm">{success}</div>
				{/if}
			</div>

			{#if data.error}
				<div class="p-4 bg-red-50 rounded-md text-red-600">{data.error}</div>
			{:else if tournaments.length === 0}
				<div class="p-4 bg-blue-50 rounded-md text-blue-600">No tournaments found. Create your first tournament above.</div>
			{:else}
				<div class="bg-white shadow overflow-hidden rounded-md">
					<ul class="divide-y divide-gray-200">
						{#each tournaments as t}
							<li class="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
								<a class="text-blue-800 hover:text-blue-900 font-medium" href={`/admin/tournament/${t.id}`}>
									{t.name}
								</a>
								<div class="flex items-center gap-2">
									<Button href={`/admin/tournament/${t.id}`} variant="secondary" size="sm">
										Manage
									</Button>
									<Button 
										variant="danger" 
										size="sm" 
										on:click={() => deleteTournament(t.id)}>
										Delete
									</Button>
								</div>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</Card>
</div>
					{/each}
				</div>
			{/if}
		</div>
	</Card>
</div>
