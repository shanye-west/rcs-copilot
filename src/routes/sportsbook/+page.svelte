<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { betsStore, type Bet } from '$lib/stores/bets';
	
	// State
	$: allBets = $betsStore.bets;
	$: loading = $betsStore.loading;
	$: error = $betsStore.error;
	
	// Accepted and completed bets only
	$: acceptedBets = allBets.filter(bet => bet.status === 'accepted');
	$: completedBets = allBets.filter(bet => bet.status === 'completed');
	
	// Filters
	let showAccepted = true;
	let showCompleted = true;
	let tournamentFilter = 'all';
	let searchTerm = '';
	
	// Calculate leaderboard
	$: leaderboard = calculateLeaderboard(allBets);
	
	// Filter bets based on user selections
	$: filteredBets = allBets.filter(bet => {
		// Status filter
		if (bet.status === 'accepted' && !showAccepted) return false;
		if (bet.status === 'completed' && !showCompleted) return false;
		if (!['accepted', 'completed'].includes(bet.status)) return false;
		
		// Tournament filter
		if (tournamentFilter !== 'all' && bet.tournament_id !== tournamentFilter) return false;
		
		// Search term
		if (searchTerm && searchTerm.length > 0) {
			const searchLower = searchTerm.toLowerCase();
			const description = bet.description.toLowerCase();
			const creatorName = bet.creator_username?.toLowerCase() || '';
			const opponentName = bet.opponent_username?.toLowerCase() || '';
			
			return description.includes(searchLower) || 
				   creatorName.includes(searchLower) || 
				   opponentName.includes(searchLower);
		}
		
		return true;
	});
	
	// Calculate money leaderboard
	function calculateLeaderboard(bets: Bet[]) {
		const playerMap = new Map<string, { id: string, username: string, winnings: number }>();
		
		// Only consider completed bets
		const completedBets = bets.filter(bet => bet.status === 'completed' && bet.winner_id);
		
		completedBets.forEach(bet => {
			// Winner
			if (bet.winner_id) {
				const username = bet.winner_id === bet.creator_id ? 
					bet.creator_username || 'Unknown' : 
					bet.opponent_username || 'Unknown';
					
				if (!playerMap.has(bet.winner_id)) {
					playerMap.set(bet.winner_id, { id: bet.winner_id, username, winnings: 0 });
				}
				
				playerMap.get(bet.winner_id)!.winnings += bet.amount;
				
				// Loser (the one who's not the winner)
				const loserId = bet.winner_id === bet.creator_id ? bet.opponent_id : bet.creator_id;
				const loserUsername = bet.winner_id === bet.creator_id ? 
					bet.opponent_username || 'Unknown' : 
					bet.creator_username || 'Unknown';
					
				if (loserId) {
					if (!playerMap.has(loserId)) {
						playerMap.set(loserId, { id: loserId, username: loserUsername, winnings: 0 });
					}
					
					playerMap.get(loserId)!.winnings -= bet.amount;
				}
			}
		});
		
		// Convert to array and sort by winnings
		return Array.from(playerMap.values())
			.sort((a, b) => b.winnings - a.winnings);
	}
	
	// Load bets on mount
	onMount(() => {
		betsStore.fetchAllBets();
		const unsubscribe = betsStore.subscribeToUpdates();
		return unsubscribe;
	});
	
	onDestroy(() => {
		betsStore.cleanup();
	});
	
	// Format currency
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
	}
</script>

<section class="mx-auto max-w-4xl p-4">
	<h1 class="mb-4 text-2xl font-bold">Rowdy Cup Sportsbook</h1>
	
	<!-- Filters -->
	<div class="mb-6 rounded-lg bg-gray-100 p-4">
		<h2 class="mb-2 font-semibold">Filters</h2>
		<div class="flex flex-wrap gap-4">
			<div class="flex items-center">
				<input type="checkbox" id="show-accepted" class="mr-2" bind:checked={showAccepted} />
				<label for="show-accepted">Active Bets</label>
			</div>
			<div class="flex items-center">
				<input type="checkbox" id="show-completed" class="mr-2" bind:checked={showCompleted} />
				<label for="show-completed">Completed Bets</label>
			</div>
			<div class="flex-grow">
				<input 
					type="text" 
					placeholder="Search bets..." 
					class="w-full rounded border px-2 py-1" 
					bind:value={searchTerm}
				/>
			</div>
		</div>
	</div>
	
	<!-- Money Leaderboard -->
	<div class="mb-6 overflow-hidden rounded-lg border shadow">
		<h2 class="bg-gradient-to-r from-blue-500 to-green-500 p-3 text-lg font-bold text-white">
			💰 Money Leaderboard
		</h2>
		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="bg-gray-100">
						<th class="p-2 text-left">Rank</th>
						<th class="p-2 text-left">Player</th>
						<th class="p-2 text-right">Winnings</th>
					</tr>
				</thead>
				<tbody>
					{#if loading}
						<tr><td colspan="3" class="p-4 text-center">Loading leaderboard...</td></tr>
					{:else if leaderboard.length === 0}
						<tr><td colspan="3" class="p-4 text-center">No completed bets yet.</td></tr>
					{:else}
						{#each leaderboard as player, i (player.id)}
							<tr class="border-t hover:bg-gray-50">
								<td class="p-2">{i + 1}</td>
								<td class="p-2">{player.username}</td>
								<td class="p-2 text-right">
									<span class={player.winnings > 0 ? 'text-green-600 font-semibold' : 
										player.winnings < 0 ? 'text-red-600 font-semibold' : ''}>
										{formatCurrency(player.winnings)}
									</span>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
	
	<!-- Bet List -->
	<div class="rounded-lg border shadow">
		<h2 class="bg-gradient-to-r from-green-500 to-blue-500 p-3 text-lg font-bold text-white">
			🎲 Active & Completed Bets
		</h2>
		
		{#if loading}
			<div class="p-4 text-center">Loading bets...</div>
		{:else if error}
			<div class="p-4 text-center text-red-500">Error loading bets: {error}</div>
		{:else if filteredBets.length === 0}
			<div class="p-4 text-center">No bets match your filters.</div>
		{:else}
			<div class="divide-y">
				{#each filteredBets as bet (bet.id)}
					<div class="p-4">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div>
								<span class="font-semibold">{bet.creator_username}</span>
								vs
								<span class="font-semibold">{bet.opponent_username}</span>
							</div>
							<div>
								<span class={bet.status === 'completed' 
									? bet.is_paid 
										? 'rounded bg-gray-100 px-2 py-1 text-sm' 
										: 'rounded bg-amber-100 px-2 py-1 text-sm text-amber-800'
									: 'rounded bg-green-100 px-2 py-1 text-sm text-green-800'
								}>
									{bet.status === 'completed' 
										? bet.is_paid ? '✓ Paid' : 'Awaiting Payment' 
										: '🔥 Active'}
								</span>
							</div>
						</div>
						
						<p class="mt-1 text-sm">{bet.description}</p>
						
						<div class="mt-2 flex flex-wrap items-center gap-x-4 text-sm">
							<div class="font-semibold text-green-700">{formatCurrency(bet.amount)}</div>
							
							{#if bet.status === 'completed' && bet.winner_id}
								<div>
									Winner: <span class="font-semibold">
										{bet.winner_id === bet.creator_id 
											? bet.creator_username 
											: bet.opponent_username}
									</span>
								</div>
							{/if}
							
							{#if bet.match_name || bet.round_name || bet.tournament_name}
								<div class="text-gray-500">
									{#if bet.match_name}Match: {bet.match_name}{/if}
									{#if bet.round_name}Round: {bet.round_name}{/if}
									{#if bet.tournament_name}Tournament: {bet.tournament_name}{/if}
								</div>
							{/if}
							
							<div class="text-xs text-gray-400">
								{new Date(bet.created_at).toLocaleDateString()}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>
