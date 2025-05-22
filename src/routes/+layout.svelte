<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import '../app.postcss';
	import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';
	import { offlineStore } from '$lib/stores/offline-store';

	let menuOpen = false;

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function closeMenu() {
		menuOpen = false;
	}

	onMount(() => {
		auth.checkSession();
	});

	// DEBUG: Log auth state changes
	$:
		console.log('LAYOUT: $auth.user =', $auth.user);
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Global offline indicator -->
	<OfflineIndicator />

	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex flex-shrink-0 items-center">
					<a href="/" class="text-xl font-bold text-blue-600">Rowdy Cup</a>
				</div>

				<div class="flex items-center">
					<!-- Offline indicator badge -->
					{#if !$offlineStore.isOnline}
						<div class="mr-2 rounded-full bg-red-500 px-2 py-1 text-xs text-white">Offline</div>
					{/if}

					<button
						on:click={toggleMenu}
						class="rounded-md p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
					>
						<svg
							class="h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>
	</header>

	{#if menuOpen}
		<div
			class="bg-opacity-50 fixed inset-0 z-40 bg-black"
			on:click={closeMenu}
			on:keydown={(e) => e.key === 'Escape' && closeMenu()}
			role="button"
			tabindex="0"
			aria-label="Close menu"
		></div>
		<div
			class="fixed top-0 right-0 z-50 h-full w-64 transform bg-white shadow-lg transition-transform duration-300"
		>
			<div class="border-b p-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">Menu</h2>
					<button on:click={closeMenu} class="rounded-md p-2 text-gray-500 hover:text-gray-700">
						<svg
							class="h-6 w-6"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>

			<nav class="mt-4">
				<ul class="space-y-2 px-4">
					<li>
						<a href="/" class="block rounded-md px-4 py-2 hover:bg-gray-100" on:click={closeMenu}>
							Tournament Home
						</a>
					</li>

					<li>
						<a
							href="/teams"
							class="block rounded-md px-4 py-2 hover:bg-gray-100"
							on:click={closeMenu}
						>
							Team Rosters
						</a>
					</li>

					<li>
						<a
							href="/sportsbook"
							class="block rounded-md px-4 py-2 hover:bg-gray-100"
							on:click={closeMenu}
						>
							Sportsbook
						</a>
					</li>

					{#if $auth.user}
						<li>
							<a
								href="/my-bets"
								class="block rounded-md px-4 py-2 hover:bg-gray-100"
								on:click={closeMenu}
							>
								My Bets
							</a>
						</li>

						<li>
							<a
								href="/history"
								class="block rounded-md px-4 py-2 hover:bg-gray-100"
								on:click={closeMenu}
							>
								History
							</a>
						</li>

						{#if $auth.user?.isAdmin}
							<li>
								<a
									href="/admin"
									class="block rounded-md px-4 py-2 text-blue-600 hover:bg-gray-100"
									on:click={closeMenu}
								>
									Admin
								</a>
							</li>
						{/if}

						<li class="mt-4 border-t pt-4">
							<button
								on:click={() => {
									closeMenu();
									auth.logout();
								}}
								class="block w-full rounded-md px-4 py-2 text-left text-red-600 hover:bg-gray-100"
							>
								Logout ({$auth.user.username})
							</button>
						</li>
					{:else}
						<li class="mt-4 border-t pt-4">
							<a
								href="/login"
								class="block rounded-md px-4 py-2 hover:bg-gray-100"
								on:click={closeMenu}
							>
								Login
							</a>
						</li>
					{/if}
				</ul>
			</nav>
		</div>
	{/if}

	<main class="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
		{#if $auth.loading}
			<div class="flex justify-center p-12">
				<div
					class="spinner h-12 w-12 animate-spin rounded-full border-t-4 border-solid border-blue-500"
				></div>
			</div>
		{:else}
			<slot />
		{/if}
	</main>
</div>

<style>
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	.spinner {
		animation: spin 1s linear infinite;
	}
</style>
