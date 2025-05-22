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
	$: console.log('LAYOUT: $auth.user =', $auth.user);
</script>

<div class="min-h-screen bg-slate-50">
	<!-- Global offline indicator -->
	<OfflineIndicator />

	<header class="bg-blue-900 text-white shadow">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 justify-between">
				<div class="flex flex-shrink-0 items-center">
					<a href="/" class="text-xl font-bold text-white">Rowdy Cup</a>
				</div>

				<div class="flex items-center gap-2">
					<button
						on:click={toggleMenu}
						class="rounded-md p-2 text-white hover:bg-blue-800 focus:outline-none"
						aria-label="Menu"
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
			<div class="bg-blue-900 p-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold text-white">Menu</h2>
					<button 
            on:click={closeMenu} 
            class="rounded-md p-2 text-white hover:bg-blue-800"
            aria-label="Close menu"
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
			</div>
			
			<div class="px-4 py-3">
				{#if $auth.user}
					<div class="mb-2 flex items-center space-x-2">
						<div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-white">
							{$auth.user.username?.[0]?.toUpperCase() || '?'}
						</div>
						<div>
							<p class="font-medium">{$auth.user.fullName || $auth.user.username}</p>
							<p class="text-xs text-gray-500">
								{$auth.user.isAdmin ? 'Administrator' : 'Player'}
							</p>
						</div>
					</div>
				{/if}
			</div>

			<nav class="mt-2">
				<ul class="space-y-1 px-2">
					<li>
						<a 
							href="/" 
							class="flex items-center rounded-md px-4 py-2 text-gray-700 hover:bg-blue-50" 
							on:click={closeMenu}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-blue-800" viewBox="0 0 20 20" fill="currentColor">
								<path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
							</svg>
							Tournament Home
						</a>
					</li>

					<li>
						<a
							href="/teams"
							class="flex items-center rounded-md px-4 py-2 text-gray-700 hover:bg-blue-50"
							on:click={closeMenu}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-blue-800" viewBox="0 0 20 20" fill="currentColor">
								<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
							</svg>
							Team Rosters
						</a>
					</li>

					<li>
						<a
							href="/sportsbook"
							class="flex items-center rounded-md px-4 py-2 text-gray-700 hover:bg-blue-50"
							on:click={closeMenu}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-blue-800" viewBox="0 0 20 20" fill="currentColor">
								<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd" />
							</svg>
							Sportsbook
						</a>
					</li>

					{#if $auth.user}
						<li>
							<a
								href="/my-bets"
								class="flex items-center rounded-md px-4 py-2 text-gray-700 hover:bg-blue-50"
								on:click={closeMenu}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-blue-800" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
								</svg>
								My Bets
							</a>
						</li>

						<li>
							<a
								href="/history"
								class="flex items-center rounded-md px-4 py-2 text-gray-700 hover:bg-blue-50"
								on:click={closeMenu}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-blue-800" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
								</svg>
								History
							</a>
						</li>

						{#if $auth.user?.isAdmin}
							<li class="mt-4 pt-4 border-t border-gray-100">
								<div class="px-4 mb-2 text-xs font-semibold uppercase text-gray-500">
									Admin
								</div>
								<a
									href="/admin"
									class="flex items-center rounded-md px-4 py-2 text-blue-800 font-medium hover:bg-blue-50"
									on:click={closeMenu}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-blue-800" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
									</svg>
									Admin Dashboard
								</a>
							</li>
						{/if}

						<li class="mt-4 pt-4 border-t border-gray-100">
							<button
								on:click={() => {
									closeMenu();
									auth.logout();
								}}
								class="flex w-full items-center rounded-md px-4 py-2 text-red-600 hover:bg-red-50"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V9a1 1 0 00-1-1h-3a1 1 0 010-2h3a3 3 0 013 3v8a3 3 0 01-3 3H3a3 3 0 01-3-3V4a3 3 0 013-3h8a3 3 0 013 3v1a1 1 0 01-2 0V4a1 1 0 00-1-1H3z" clip-rule="evenodd" />
									<path fill-rule="evenodd" d="M19 10a1 1 0 00-1-1h-8a1 1 0 000 2h7.414l-4.707 4.707a1 1 0 001.414 1.414L19 11.414V10z" clip-rule="evenodd" />
								</svg>
								Logout ({$auth.user.username})
							</button>
						</li>
					{:else}
						<li class="mt-4 pt-4 border-t border-gray-100">
							<a
								href="/login"
								class="flex items-center rounded-md px-4 py-2 text-gray-700 hover:bg-blue-50"
								on:click={closeMenu}
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="mr-3 h-5 w-5 text-blue-800" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd" />
								</svg>
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
