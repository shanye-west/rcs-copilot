<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import '../app.postcss';
	import '$lib/styles/sportsbook.css';
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let menuOpen = false;

	function navigateTo(path: string) {
		goto(path);
	}

	onMount(() => {
		auth.checkSession();
	});

	// Determine active page for navigation
	$: currentPath = $page.url.pathname;
	$: isHome = currentPath === '/' || currentPath.includes('/rounds/');
	$: isTeams = currentPath.includes('/teams');
	$: isHistory = currentPath.includes('/history');
	$: isLogin = currentPath.includes('/login');
	$: isSportsbook = currentPath.includes('/sportsbook') || currentPath.includes('/my-bets');
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Top Navigation Header -->
	<header class="border-b border-gray-200 bg-white shadow-sm">
		<div class="px-4 py-4">
			<div class="flex items-center justify-between">
				<!-- Logo -->
				<div class="flex items-center">
					<img src="/rowdy-cup-logo.png" alt="Rowdy Cup" class="h-8 w-auto" />
				</div>

				<!-- Desktop Navigation -->
				<nav class="hidden items-center space-x-8 md:flex">
					<button
						on:click={() => navigateTo('/')}
						class="rounded-lg px-4 py-2 font-medium transition-colors {isHome
							? 'border border-blue-300 bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Home
					</button>
					<button
						on:click={() => navigateTo('/teams')}
						class="rounded-lg px-4 py-2 font-medium transition-colors {isTeams
							? 'border border-blue-300 bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Teams
					</button>
					<button
						on:click={() => navigateTo('/sportsbook')}
						class="rounded-lg px-4 py-2 font-medium transition-colors {isSportsbook
							? 'border border-blue-300 bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						Sportsbook
					</button>
					<button
						on:click={() => navigateTo('/history')}
						class="rounded-lg px-4 py-2 font-medium transition-colors {isHistory
							? 'border border-blue-300 bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:text-gray-900'}"
					>
						History
					</button>

					{#if $auth.user}
						<button
							on:click={() => auth.logout()}
							class="px-4 py-2 font-medium text-red-600 hover:text-red-700"
						>
							Logout
						</button>
					{:else}
						<button
							on:click={() => navigateTo('/login')}
							class="rounded-lg px-4 py-2 font-medium transition-colors {isLogin
								? 'border border-blue-300 bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:text-gray-900'}"
						>
							Login
						</button>
					{/if}
				</nav>

				<!-- Mobile menu button -->
				<button
					on:click={() => (menuOpen = !menuOpen)}
					class="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

		<!-- Mobile Navigation Menu -->
		{#if menuOpen}
			<div class="border-t border-gray-200 bg-white md:hidden">
				<div class="space-y-1 px-4 py-2">
					<button
						on:click={() => {
							navigateTo('/');
							menuOpen = false;
						}}
						class="block w-full rounded-lg px-3 py-2 text-left font-medium {isHome
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
					>
						Home
					</button>
					<button
						on:click={() => {
							navigateTo('/teams');
							menuOpen = false;
						}}
						class="block w-full rounded-lg px-3 py-2 text-left font-medium {isTeams
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
					>
						Teams
					</button>
					<button
						on:click={() => {
							navigateTo('/history');
							menuOpen = false;
						}}
						class="block w-full rounded-lg px-3 py-2 text-left font-medium {isHistory
							? 'bg-blue-100 text-blue-700'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
					>
						History
					</button>

					{#if $auth.user}
						<button
							on:click={() => {
								auth.logout();
								menuOpen = false;
							}}
							class="block w-full px-3 py-2 text-left font-medium text-red-600 hover:text-red-700"
						>
							Logout
						</button>
					{:else}
						<button
							on:click={() => {
								navigateTo('/login');
								menuOpen = false;
							}}
							class="block w-full rounded-lg px-3 py-2 text-left font-medium {isLogin
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}"
						>
							Login
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</header>

	<!-- Main Content -->
	<main class="flex-1 pb-20 md:pb-4">
		{#if $auth.loading}
			<div class="flex min-h-[50vh] items-center justify-center">
				<div class="text-center">
					<div
						class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
					></div>
					<p class="text-gray-600">Loading...</p>
				</div>
			</div>
		{:else}
			<slot />
		{/if}
	</main>

	<!-- Bottom Navigation (Mobile) -->
	<nav class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white shadow-lg md:hidden">
		<div class="flex">
			<button
				on:click={() => navigateTo('/')}
				class="flex-1 px-2 py-3 text-center {isHome ? 'text-blue-600' : 'text-gray-400'}"
			>
				<div class="flex flex-col items-center">
					<svg class="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					<span class="text-xs font-medium">Home</span>
				</div>
			</button>

			<button
				on:click={() => navigateTo('/teams')}
				class="flex-1 px-2 py-3 text-center {isTeams ? 'text-blue-600' : 'text-gray-400'}"
			>
				<div class="flex flex-col items-center">
					<svg class="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
						/>
					</svg>
					<span class="text-xs font-medium">Teams</span>
				</div>
			</button>

			<button
				on:click={() => navigateTo('/sportsbook')}
				class="flex-1 px-2 py-3 text-center {isSportsbook ? 'text-blue-600' : 'text-gray-400'}"
			>
				<div class="flex flex-col items-center">
					<svg class="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-xs font-medium">Bets</span>
				</div>
			</button>

			<button
				on:click={() => navigateTo('/history')}
				class="flex-1 px-2 py-3 text-center {isHistory ? 'text-blue-600' : 'text-gray-400'}"
			>
				<div class="flex flex-col items-center">
					<svg class="mb-1 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<span class="text-xs font-medium">History</span>
				</div>
			</button>
		</div>
	</nav>
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

	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>
