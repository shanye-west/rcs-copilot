<!-- src/routes/sportsbook/+page.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { betsStore, type Bet } from '$lib/stores/bets';
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';

	// State
	$: allBets = $betsStore.bets;
	$: loading = $betsStore.loading;
	$: error = $betsStore.error;
	let activeTab = 'all'; // 'all', 'hot', 'my-bets'

	// Filter bets
	$: acceptedBets = allBets.filter((bet) => bet.status === 'accepted');
	$: completedBets = allBets.filter((bet) => bet.status === 'completed');
	$: activeBets = [...acceptedBets, ...completedBets];

	// My bets (both created and accepted by the current user)
	$: myBets = allBets.filter(
		(bet) => $auth.user && (bet.creator_id === $auth.user.id || bet.opponent_id === $auth.user.id)
	);

	// Calculate leaderboard
	$: leaderboard = calculateLeaderboard(allBets);

	// Hot bets (recent or high value)
	$: hotBets = activeBets
		.filter((bet) => bet.amount >= 25)
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 5);

	// Calculate money leaderboard
	function calculateLeaderboard(bets: Bet[]) {
		const playerMap = new Map<string, { id: string; username: string; winnings: number }>();

		const completedBets = bets.filter((bet) => bet.status === 'completed' && bet.winner_id);

		completedBets.forEach((bet) => {
			if (bet.winner_id) {
				const username =
					bet.winner_id === bet.creator_id
						? bet.creator_username || 'Unknown'
						: bet.opponent_username || 'Unknown';

				if (!playerMap.has(bet.winner_id)) {
					playerMap.set(bet.winner_id, { id: bet.winner_id, username, winnings: 0 });
				}

				playerMap.get(bet.winner_id)!.winnings += bet.amount;

				const loserId = bet.winner_id === bet.creator_id ? bet.opponent_id : bet.creator_id;
				const loserUsername =
					bet.winner_id === bet.creator_id
						? bet.opponent_username || 'Unknown'
						: bet.creator_username || 'Unknown';

				if (loserId) {
					if (!playerMap.has(loserId)) {
						playerMap.set(loserId, { id: loserId, username: loserUsername, winnings: 0 });
					}

					playerMap.get(loserId)!.winnings -= bet.amount;
				}
			}
		});

		return Array.from(playerMap.values()).sort((a, b) => b.winnings - a.winnings);
	}

	// Load bets on mount
	onMount(() => {
		betsStore.fetchAllBets();
		const unsubscribe = betsStore.subscribeToUpdates();

		// Initialize active tab from URL hash if present
		if (typeof window !== 'undefined') {
			const hash = window.location.hash;
			if (hash === '#hot') activeTab = 'hot';
			else if (hash === '#my-bets') activeTab = 'my-bets';
		}

		return unsubscribe;
	});

	onDestroy(() => {
		betsStore.cleanup();
	});

	// Tab change handler
	function handleTabChange(tab: string) {
		activeTab = tab;
		if (typeof window !== 'undefined') {
			window.location.hash = tab === 'all' ? '' : `#${tab}`;
		}
	}

	// Format currency
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
	}

	// Get bet status color
	function getBetStatusColor(bet: Bet): string {
		if (bet.status === 'completed') {
			return bet.is_paid ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-800';
		}
		return 'bg-green-100 text-green-800';
	}

	// Get bet status text
	function getBetStatusText(bet: Bet): string {
		if (bet.status === 'completed') {
			return bet.is_paid ? '✓ Paid' : '💰 Awaiting Payment';
		}
		return '🔥 Active';
	}

	// Format date
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20">
	<!-- Hero Section -->
	<div class="golf-gradient mb-6 rounded-b-lg p-6 text-white shadow-md">
		<div class="mx-auto max-w-6xl">
			<div class="text-center">
				<h1 class="mb-2 text-3xl font-bold">🎲 Rowdy Cup Sportsbook</h1>
				<p class="text-blue-100">Place bets, follow the action, win big!</p>

				<!-- Quick Stats -->
				<div class="mt-4 flex justify-center space-x-8 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
					<div class="text-center">
						<div class="text-2xl font-bold">{activeBets.length}</div>
						<div class="text-blue-100">Active Bets</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold">
							{formatCurrency(activeBets.reduce((sum, bet) => sum + bet.amount, 0))}
						</div>
						<div class="text-blue-100">Total Action</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold">{leaderboard.length}</div>
						<div class="text-blue-100">Players</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="mx-auto max-w-6xl px-4">
		<!-- Tabs -->
		<div class="mb-6 rounded-lg bg-white p-1 shadow-md">
			<div class="flex border-b">
				<button
					class="flex-1 border-b-2 px-4 py-4 text-center font-medium transition-colors {activeTab ===
					'all'
						? 'border-blue-600 text-blue-700'
						: 'border-transparent text-gray-600 hover:text-gray-900'}"
					on:click={() => handleTabChange('all')}
				>
					All Bets
				</button>
				<button
					class="flex-1 border-b-2 px-4 py-4 text-center font-medium transition-colors {activeTab ===
					'hot'
						? 'border-blue-600 text-blue-700'
						: 'border-transparent text-gray-600 hover:text-gray-900'}"
					on:click={() => handleTabChange('hot')}
				>
					Hot Bets 🔥
				</button>
				<button
					class="flex-1 border-b-2 px-4 py-4 text-center font-medium transition-colors {activeTab ===
					'my-bets'
						? 'border-blue-600 text-blue-700'
						: 'border-transparent text-gray-600 hover:text-gray-900'}"
					on:click={() => handleTabChange('my-bets')}
				>
					My Bets
				</button>
			</div>
		</div>

		<!-- Content Area -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<!-- Main Content Area -->
			<div class="space-y-6 lg:col-span-2">
				<!-- All Bets Tab -->
				{#if activeTab === 'all'}
					<div class="golf-card">
						<div class="rounded-t-lg bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
							<h2 class="text-xl font-bold">All Betting Action</h2>
						</div>

						{#if loading}
							<div class="space-y-4 p-4">
								{#each Array(4) as _}
									<div class="h-24 animate-pulse rounded-lg bg-gray-200"></div>
								{/each}
							</div>
						{:else if error}
							<div class="p-4 text-center text-red-500">
								<div class="mb-2 text-4xl">⚠️</div>
								<p>Error loading bets: {error}</p>
							</div>
						{:else if activeBets.length === 0}
							<div class="p-8 text-center text-gray-500">
								<div class="mb-4 text-6xl">🎯</div>
								<h3 class="mb-2 text-lg font-semibold">No active bets</h3>
								<p class="mb-4">The action is waiting for you!</p>
								{#if $auth.user}
									<a
										href="/my-bets"
										class="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
									>
										Create Your First Bet
									</a>
								{:else}
									<a
										href="/login"
										class="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
									>
										Login to Start Betting
									</a>
								{/if}
							</div>
						{:else}
							<div class="divide-y divide-gray-100">
								{#each activeBets as bet (bet.id)}
									<div class="p-4 transition-colors hover:bg-gray-50">
										<div class="mb-2 flex items-start justify-between">
											<div class="flex-1">
												<div class="mb-1 flex items-center space-x-2">
													<span class="font-semibold">{bet.creator_username}</span>
													<span class="text-gray-400">vs</span>
													<span class="font-semibold">{bet.opponent_username}</span>
												</div>
												<p class="mb-2 text-sm text-gray-600">{bet.description}</p>

												<!-- Bet details -->
												<div
													class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500"
												>
													<div>{formatDate(bet.created_at)}</div>
													{#if bet.match_name || bet.round_name || bet.tournament_name}
														<div class="flex items-center space-x-1">
															{#if bet.match_name}<span
																	class="rounded bg-blue-100 px-2 py-1 text-blue-800"
																	>Match: {bet.match_name}</span
																>{/if}
															{#if bet.round_name}<span
																	class="rounded bg-green-100 px-2 py-1 text-green-800"
																	>Round: {bet.round_name}</span
																>{/if}
															{#if bet.tournament_name}<span
																	class="rounded bg-purple-100 px-2 py-1 text-purple-800"
																	>Tournament: {bet.tournament_name}</span
																>{/if}
														</div>
													{/if}
												</div>
											</div>

											<div class="ml-4 text-right">
												<div class="mb-1 text-xl font-bold text-green-600">
													{formatCurrency(bet.amount)}
												</div>
												<span class="text-xs {getBetStatusColor(bet)} rounded-full px-2 py-1">
													{getBetStatusText(bet)}
												</span>
											</div>
										</div>

										{#if bet.status === 'completed' && bet.winner_id}
											<div class="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
												<div class="flex items-center justify-between">
													<div>
														<span class="text-sm text-gray-600">Winner:</span>
														<span class="ml-1 font-semibold">
															{bet.winner_id === bet.creator_id
																? bet.creator_username
																: bet.opponent_username}
														</span>
													</div>
													{#if !bet.is_paid}
														<span
															class="rounded-full bg-yellow-200 px-2 py-1 text-xs text-yellow-800"
														>
															Payment Pending
														</span>
													{/if}
												</div>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Hot Bets Tab -->
				{#if activeTab === 'hot'}
					<div class="golf-card">
						<div class="rounded-t-lg bg-gradient-to-r from-red-500 to-orange-500 p-4 text-white">
							<h2 class="flex items-center text-xl font-bold">
								🔥 Hot Bets
								<span class="ml-2 rounded-full bg-white/20 px-2 py-1 text-xs">HIGH VALUE</span>
							</h2>
						</div>
						<div class="space-y-4 p-4">
							{#if loading}
								{#each Array(3) as _}
									<div class="h-24 animate-pulse rounded-lg bg-gray-200"></div>
								{/each}
							{:else if hotBets.length === 0}
								<div class="py-8 text-center text-gray-500">
									<div class="mb-2 text-4xl">🎯</div>
									<p>No hot bets at the moment</p>
									<p class="text-sm">Check back soon for high-stakes action!</p>
								</div>
							{:else}
								{#each hotBets as bet (bet.id)}
									<div
										class="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4"
									>
										<div class="mb-2 flex items-start justify-between">
											<div>
												<div class="text-lg font-bold">
													{bet.creator_username} vs {bet.opponent_username}
												</div>
												<div class="text-sm text-gray-600">{bet.description}</div>
											</div>
											<div class="text-right">
												<div class="text-2xl font-bold text-red-600">
													{formatCurrency(bet.amount)}
												</div>
												<div class="text-xs {getBetStatusColor(bet)} rounded-full px-2 py-1">
													{getBetStatusText(bet)}
												</div>
											</div>
										</div>

										{#if bet.status === 'completed' && bet.winner_id}
											<div class="mt-2 rounded-lg bg-yellow-100 p-2">
												<span class="text-sm font-semibold">Winner:</span>
												<span class="text-sm">
													{bet.winner_id === bet.creator_id
														? bet.creator_username
														: bet.opponent_username}
												</span>
											</div>
										{/if}
									</div>
								{/each}
							{/if}
						</div>
					</div>
				{/if}

				<!-- My Bets Tab -->
				{#if activeTab === 'my-bets'}
					<div class="golf-card">
						<div class="rounded-t-lg bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
							<h2 class="text-xl font-bold">My Bets</h2>
						</div>

						{#if !$auth.user}
							<div class="p-8 text-center">
								<div class="mb-3 text-5xl">🔒</div>
								<h3 class="mb-2 text-xl font-bold">Login Required</h3>
								<p class="mb-4 text-gray-600">You need to log in to view your bets</p>
								<a
									href="/login"
									class="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
								>
									Login Now
								</a>
							</div>
						{:else if loading}
							<div class="space-y-4 p-4">
								{#each Array(4) as _}
									<div class="h-24 animate-pulse rounded-lg bg-gray-200"></div>
								{/each}
							</div>
						{:else if myBets.length === 0}
							<div class="p-8 text-center text-gray-500">
								<div class="mb-4 text-6xl">🎮</div>
								<h3 class="mb-2 text-lg font-semibold">No bets yet</h3>
								<p class="mb-4">Create your first bet to get started!</p>
								<a
									href="/my-bets/new"
									class="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
								>
									Create New Bet
								</a>
							</div>
						{:else}
							<div class="divide-y divide-gray-100">
								{#each myBets as bet (bet.id)}
									<div class="p-4 transition-colors hover:bg-gray-50">
										<div class="mb-2 flex items-start justify-between">
											<div class="flex-1">
												<div class="mb-1 flex items-center space-x-2">
													{#if bet.creator_id === $auth.user.id}
														<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
															>You</span
														>
													{/if}
													<span class="font-semibold">{bet.creator_username}</span>
													<span class="text-gray-400">vs</span>
													<span class="font-semibold">{bet.opponent_username}</span>
													{#if bet.opponent_id === $auth.user.id}
														<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800"
															>You</span
														>
													{/if}
												</div>
												<p class="mb-2 text-sm text-gray-600">{bet.description}</p>

												<!-- Bet details -->
												<div
													class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500"
												>
													<div>{formatDate(bet.created_at)}</div>
													{#if bet.match_name || bet.round_name || bet.tournament_name}
														<div class="flex items-center space-x-1">
															{#if bet.match_name}<span
																	class="rounded bg-blue-100 px-2 py-1 text-blue-800"
																	>Match: {bet.match_name}</span
																>{/if}
															{#if bet.round_name}<span
																	class="rounded bg-green-100 px-2 py-1 text-green-800"
																	>Round: {bet.round_name}</span
																>{/if}
															{#if bet.tournament_name}<span
																	class="rounded bg-purple-100 px-2 py-1 text-purple-800"
																	>Tournament: {bet.tournament_name}</span
																>{/if}
														</div>
													{/if}
												</div>
											</div>

											<div class="ml-4 text-right">
												<div class="mb-1 text-xl font-bold text-green-600">
													{formatCurrency(bet.amount)}
												</div>
												<span class="text-xs {getBetStatusColor(bet)} rounded-full px-2 py-1">
													{getBetStatusText(bet)}
												</span>
											</div>
										</div>

										{#if bet.status === 'completed' && bet.winner_id}
											<div
												class="mt-3 p-3 {bet.winner_id === $auth.user.id
													? 'border-green-200 bg-green-50'
													: 'border-red-200 bg-red-50'} rounded-lg border"
											>
												<div class="flex items-center justify-between">
													<div>
														<span class="text-sm text-gray-600">
															{bet.winner_id === $auth.user.id ? 'You won!' : 'You lost'}
														</span>
														<span class="ml-1 font-semibold">
															{bet.winner_id === bet.creator_id
																? bet.creator_username
																: bet.opponent_username}
															won {formatCurrency(bet.amount)}
														</span>
													</div>
													{#if !bet.is_paid}
														<span
															class="rounded-full bg-yellow-200 px-2 py-1 text-xs text-yellow-800"
														>
															Payment Pending
														</span>
													{/if}
												</div>
											</div>
										{/if}

										{#if bet.status === 'pending' && bet.opponent_id === $auth.user.id}
											<div class="mt-3 flex gap-2">
												<button
													class="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700"
													on:click={() => betsStore.updateBetStatus(bet.id, 'accepted')}
												>
													Accept Bet
												</button>
												<button
													class="flex-1 rounded bg-red-600 py-2 text-white hover:bg-red-700"
													on:click={() => betsStore.updateBetStatus(bet.id, 'declined')}
												>
													Decline
												</button>
											</div>
										{/if}
									</div>
								{/each}
							</div>

							<div class="border-t p-4">
								<a
									href="/my-bets/new"
									class="block w-full rounded-lg bg-blue-600 py-2 text-center text-white transition-colors hover:bg-blue-700"
								>
									Create New Bet
								</a>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Money Leaderboard -->
				<div class="golf-card">
					<div class="rounded-t-lg bg-gradient-to-r from-yellow-500 to-green-500 p-4 text-white">
						<h2 class="flex items-center text-xl font-bold">
							💰 Money Leaderboard
							<span class="ml-2 rounded-full bg-white/20 px-2 py-1 text-sm">Live</span>
						</h2>
					</div>
					<div class="p-4">
						{#if loading}
							<div class="space-y-3">
								{#each Array(5) as _}
									<div class="h-16 animate-pulse rounded-lg bg-gray-200"></div>
								{/each}
							</div>
						{:else if leaderboard.length === 0}
							<div class="py-8 text-center text-gray-500">
								<div class="mb-2 text-4xl">🎯</div>
								<p>No completed bets yet!</p>
								<p class="text-sm">Be the first to win some money</p>
							</div>
						{:else}
							<div class="space-y-3">
								{#each leaderboard.slice(0, 5) as player, i (player.id)}
									<div
										class="flex items-center justify-between rounded-xl p-3 {i === 0
											? 'border border-yellow-300 bg-yellow-100'
											: i === 1
												? 'border border-gray-300 bg-gray-100'
												: i === 2
													? 'border border-orange-300 bg-orange-100'
													: 'border border-gray-200 bg-white'}"
									>
										<div class="flex items-center space-x-3">
											<div
												class="h-8 w-8 rounded-full {i === 0
													? 'bg-yellow-500'
													: i === 1
														? 'bg-gray-400'
														: i === 2
															? 'bg-orange-500'
															: 'bg-blue-500'} flex items-center justify-center text-sm font-bold text-white"
											>
												{i + 1}
											</div>
											<div>
												<div class="font-semibold">{player.username}</div>
												{#if i === 0}<div class="text-xs text-yellow-600">👑 Champion</div>{/if}
											</div>
										</div>
										<div class="text-right">
											<div
												class="text-lg font-bold {player.winnings > 0
													? 'text-green-600'
													: player.winnings < 0
														? 'text-red-600'
														: 'text-gray-600'}"
											>
												{formatCurrency(player.winnings)}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Create Bet CTA -->
				{#if $auth.user}
					<div class="golf-card">
						<div class="p-6 text-center">
							<div class="mb-3 text-4xl">💰</div>
							<h3 class="mb-2 text-lg font-bold">Ready to Make a Bet?</h3>
							<p class="mb-4 text-gray-600">Challenge other players and win some money!</p>
							<a
								href="/my-bets/new"
								class="block w-full rounded-lg bg-blue-600 py-2 text-center text-white transition-colors hover:bg-blue-700"
							>
								Create New Bet
							</a>
						</div>
					</div>
				{:else}
					<div class="golf-card">
						<div class="p-6 text-center">
							<div class="mb-3 text-4xl">🔐</div>
							<h3 class="mb-2 text-lg font-bold">Login to Place Bets</h3>
							<p class="mb-4 text-gray-600">Join the action and challenge your friends!</p>
							<a
								href="/login"
								class="block w-full rounded-lg bg-blue-600 py-2 text-center text-white transition-colors hover:bg-blue-700"
							>
								Login Now
							</a>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.golf-gradient {
		background: linear-gradient(to right, #1e40af, #3b82f6);
	}

	.golf-card {
		@apply overflow-hidden rounded-lg bg-white shadow-md;
	}

	.loading-shimmer {
		animation: shimmer 2s infinite linear;
		background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
		background-size: 200% 100%;
	}

	@keyframes shimmer {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}
</style>
