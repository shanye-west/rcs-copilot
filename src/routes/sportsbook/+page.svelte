<!-- src/routes/sportsbook/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { betsStore, type Bet } from '$lib/stores/bets';
  import { auth } from '$lib/stores/auth';

  // State
  $: allBets = $betsStore.bets;
  $: loading = $betsStore.loading;
  $: error = $betsStore.error;

  // Filter bets
  $: acceptedBets = allBets.filter((bet) => bet.status === 'accepted');
  $: completedBets = allBets.filter((bet) => bet.status === 'completed');
  $: activeBets = [...acceptedBets, ...completedBets];

  // Calculate leaderboard
  $: leaderboard = calculateLeaderboard(allBets);

  // Hot bets (recent or high value)
  $: hotBets = activeBets
    .filter(bet => bet.amount >= 25)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

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
    return unsubscribe;
  });

  onDestroy(() => {
    betsStore.cleanup();
  });

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
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
  <!-- Hero Section -->
  <div class="golf-gradient text-white p-6 mb-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-2">🎲 Rowdy Cup Sportsbook</h1>
      <p class="text-blue-100">Live betting action from the course</p>
      
      <!-- Quick Stats -->
      <div class="flex justify-center space-x-6 mt-4 text-sm">
        <div class="text-center">
          <div class="text-xl font-bold">{activeBets.length}</div>
          <div class="text-blue-100">Active Bets</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold">${activeBets.reduce((sum, bet) => sum + bet.amount, 0)}</div>
          <div class="text-blue-100">Total Action</div>
        </div>
        <div class="text-center">
          <div class="text-xl font-bold">{leaderboard.length}</div>
          <div class="text-blue-100">Players</div>
        </div>
      </div>
    </div>
  </div>

  <div class="px-4 space-y-6">
    <!-- Hot Bets Section -->
    {#if hotBets.length > 0}
      <div class="golf-card">
        <div class="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4">
          <h2 class="text-xl font-bold flex items-center">
            🔥 Hot Bets
            <span class="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">LIVE</span>
          </h2>
        </div>
        <div class="p-4 space-y-4">
          {#each hotBets as bet (bet.id)}
            <div class="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="font-bold text-lg">
                    {bet.creator_username} vs {bet.opponent_username}
                  </div>
                  <div class="text-sm text-gray-600">{bet.description}</div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-bold text-red-600">{formatCurrency(bet.amount)}</div>
                  <div class="text-xs {getBetStatusColor(bet)} px-2 py-1 rounded-full">
                    {getBetStatusText(bet)}
                  </div>
                </div>
              </div>
              
              {#if bet.status === 'completed' && bet.winner_id}
                <div class="mt-2 p-2 bg-yellow-100 rounded-lg">
                  <span class="text-sm font-semibold">Winner:</span>
                  <span class="text-sm">
                    {bet.winner_id === bet.creator_id ? bet.creator_username : bet.opponent_username}
                  </span>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Money Leaderboard -->
    <div class="golf-card">
      <div class="bg-gradient-to-r from-yellow-500 to-green-500 text-white p-4">
        <h2 class="text-xl font-bold flex items-center">
          💰 Money Leaderboard
          <span class="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">Live</span>
        </h2>
      </div>
      <div class="p-4">
        {#if loading}
          <div class="space-y-3">
            {#each [1,2,3] as _}
              <div class="loading-shimmer h-16 rounded-xl"></div>
            {/each}
          </div>
        {:else if leaderboard.length === 0}
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🎯</div>
            <p>No completed bets yet!</p>
            <p class="text-sm">Be the first to win some money</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each leaderboard.slice(0, 5) as player, i (player.id)}
              <div class="flex items-center justify-between p-3 rounded-xl {
                i === 0 ? 'bg-yellow-100 border border-yellow-300' :
                i === 1 ? 'bg-gray-100 border border-gray-300' :
                i === 2 ? 'bg-orange-100 border border-orange-300' :
                'bg-white border border-gray-200'
              }">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded-full {
                    i === 0 ? 'bg-yellow-500' :
                    i === 1 ? 'bg-gray-400' :
                    i === 2 ? 'bg-orange-500' :
                    'bg-blue-500'
                  } text-white flex items-center justify-center font-bold text-sm">
                    {i + 1}
                  </div>
                  <div>
                    <div class="font-semibold">{player.username}</div>
                    {#if i === 0}<div class="text-xs text-yellow-600">👑 Champion</div>{/if}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold {
                    player.winnings > 0 ? 'text-green-600' :
                    player.winnings < 0 ? 'text-red-600' : 'text-gray-600'
                  }">
                    {formatCurrency(player.winnings)}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- All Bets Section -->
    <div class="golf-card">
      <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
        <h2 class="text-xl font-bold">🎲 All Betting Action</h2>
      </div>
      
      {#if loading}
        <div class="p-4 space-y-4">
          {#each [1,2,3,4] as _}
            <div class="loading-shimmer h-20 rounded-xl"></div>
          {/each}
        </div>
      {:else if error}
        <div class="p-4 text-center text-red-500">
          <div class="text-4xl mb-2">⚠️</div>
          <p>Error loading bets: {error}</p>
        </div>
      {:else if activeBets.length === 0}
        <div class="p-8 text-center text-gray-500">
          <div class="text-6xl mb-4">🎯</div>
          <h3 class="text-lg font-semibold mb-2">No active bets</h3>
          <p class="mb-4">The action is waiting for you!</p>
          {#if $auth.user}
            <a href="/my-bets" class="golf-button-primary inline-block">
              Create Your First Bet
            </a>
          {:else}
            <a href="/login" class="golf-button-primary inline-block">
              Login to Start Betting
            </a>
          {/if}
        </div>
      {:else}
        <div class="divide-y divide-gray-100">
          {#each activeBets as bet (bet.id)}
            <div class="p-4 hover:bg-gray-50 transition-colors">
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <span class="font-semibold">{bet.creator_username}</span>
                    <span class="text-gray-400">vs</span>
                    <span class="font-semibold">{bet.opponent_username}</span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{bet.description}</p>
                  
                  <!-- Bet details -->
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <div>{new Date(bet.created_at).toLocaleDateString()}</div>
                    {#if bet.match_name || bet.round_name || bet.tournament_name}
                      <div>
                        {#if bet.match_name}Match: {bet.match_name}{/if}
                        {#if bet.round_name}Round: {bet.round_name}{/if}
                        {#if bet.tournament_name}Tournament: {bet.tournament_name}{/if}
                      </div>
                    {/if}
                  </div>
                </div>
                
                <div class="text-right ml-4">
                  <div class="text-xl font-bold text-green-600 mb-1">
                    {formatCurrency(bet.amount)}
                  </div>
                  <span class="text-xs {getBetStatusColor(bet)} px-2 py-1 rounded-full">
                    {getBetStatusText(bet)}
                  </span>
                </div>
              </div>

              {#if bet.status === 'completed' && bet.winner_id}
                <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-sm text-gray-600">Winner:</span>
                      <span class="font-semibold ml-1">
                        {bet.winner_id === bet.creator_id ? bet.creator_username : bet.opponent_username}
                      </span>
                    </div>
                    {#if !bet.is_paid}
                      <span class="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
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

    <!-- Create Bet CTA -->
    {#if $auth.user}
      <div class="golf-card">
        <div class="p-6 text-center">
          <div class="text-4xl mb-3">💰</div>
          <h3 class="text-lg font-bold mb-2">Ready to Make a Bet?</h3>
          <p class="text-gray-600 mb-4">Challenge other players and win some money!</p>
          <a href="/my-bets" class="golf-button-primary">
            Create New Bet
          </a>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Bottom spacing for navigation -->
  <div class="h-20"></div>
</div>