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
  $: myBets = allBets.filter((bet) => 
    ($auth.user && (bet.creator_id === $auth.user.id || bet.opponent_id === $auth.user.id))
  );

  // Calculate leaderboard
  $: leaderboard = calculateLeaderboard(allBets);

  // Hot bets (recent or high value)
  $: hotBets = activeBets
    .filter(bet => bet.amount >= 25)
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
  <div class="golf-gradient text-white p-6 mb-6 rounded-b-lg shadow-md">
    <div class="max-w-6xl mx-auto">
      <div class="text-center">
        <h1 class="text-3xl font-bold mb-2">🎲 Rowdy Cup Sportsbook</h1>
        <p class="text-blue-100">Place bets, follow the action, win big!</p>
        
        <!-- Quick Stats -->
        <div class="flex justify-center space-x-8 mt-4 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div class="text-center">
            <div class="text-2xl font-bold">{activeBets.length}</div>
            <div class="text-blue-100">Active Bets</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold">{formatCurrency(activeBets.reduce((sum, bet) => sum + bet.amount, 0))}</div>
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

  <div class="max-w-6xl mx-auto px-4">
    <!-- Tabs -->
    <div class="bg-white rounded-lg mb-6 p-1 shadow-md">
      <div class="flex border-b">
        <button 
          class="flex-1 py-4 px-4 text-center font-medium transition-colors border-b-2 {activeTab === 'all' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}"
          on:click={() => handleTabChange('all')}
        >
          All Bets
        </button>
        <button 
          class="flex-1 py-4 px-4 text-center font-medium transition-colors border-b-2 {activeTab === 'hot' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}"
          on:click={() => handleTabChange('hot')}
        >
          Hot Bets 🔥
        </button>
        <button 
          class="flex-1 py-4 px-4 text-center font-medium transition-colors border-b-2 {activeTab === 'my-bets' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-600 hover:text-gray-900'}"
          on:click={() => handleTabChange('my-bets')}
        >
          My Bets
        </button>
      </div>
    </div>
    
    <!-- Content Area -->
    <div class="grid gap-6 grid-cols-1 lg:grid-cols-3">
      <!-- Main Content Area -->
      <div class="lg:col-span-2 space-y-6">
        <!-- All Bets Tab -->
        {#if activeTab === 'all'}
          <div class="golf-card">
            <div class="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-t-lg">
              <h2 class="text-xl font-bold">All Betting Action</h2>
            </div>
            
            {#if loading}
              <div class="p-4 space-y-4">
                {#each Array(4) as _}
                  <div class="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
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
                  <a href="/my-bets" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Create Your First Bet
                  </a>
                {:else}
                  <a href="/login" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                          <div>{formatDate(bet.created_at)}</div>
                          {#if bet.match_name || bet.round_name || bet.tournament_name}
                            <div class="flex items-center space-x-1">
                              {#if bet.match_name}<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">Match: {bet.match_name}</span>{/if}
                              {#if bet.round_name}<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Round: {bet.round_name}</span>{/if}
                              {#if bet.tournament_name}<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded">Tournament: {bet.tournament_name}</span>{/if}
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
        {/if}
        
        <!-- Hot Bets Tab -->
        {#if activeTab === 'hot'}
          <div class="golf-card">
            <div class="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-t-lg">
              <h2 class="text-xl font-bold flex items-center">
                🔥 Hot Bets
                <span class="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">HIGH VALUE</span>
              </h2>
            </div>
            <div class="p-4 space-y-4">
              {#if loading}
                {#each Array(3) as _}
                  <div class="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                {/each}
              {:else if hotBets.length === 0}
                <div class="text-center py-8 text-gray-500">
                  <div class="text-4xl mb-2">🎯</div>
                  <p>No hot bets at the moment</p>
                  <p class="text-sm">Check back soon for high-stakes action!</p>
                </div>
              {:else}
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
              {/if}
            </div>
          </div>
        {/if}
        
        <!-- My Bets Tab -->
        {#if activeTab === 'my-bets'}
          <div class="golf-card">
            <div class="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg">
              <h2 class="text-xl font-bold">My Bets</h2>
            </div>
            
            {#if !$auth.user}
              <div class="p-8 text-center">
                <div class="text-5xl mb-3">🔒</div>
                <h3 class="text-xl font-bold mb-2">Login Required</h3>
                <p class="text-gray-600 mb-4">You need to log in to view your bets</p>
                <a href="/login" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Login Now
                </a>
              </div>
            {:else if loading}
              <div class="p-4 space-y-4">
                {#each Array(4) as _}
                  <div class="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                {/each}
              </div>
            {:else if myBets.length === 0}
              <div class="p-8 text-center text-gray-500">
                <div class="text-6xl mb-4">🎮</div>
                <h3 class="text-lg font-semibold mb-2">No bets yet</h3>
                <p class="mb-4">Create your first bet to get started!</p>
                <a href="/my-bets/new" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create New Bet
                </a>
              </div>
            {:else}
              <div class="divide-y divide-gray-100">
                {#each myBets as bet (bet.id)}
                  <div class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-1">
                          {#if bet.creator_id === $auth.user.id}
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                          {/if}
                          <span class="font-semibold">{bet.creator_username}</span>
                          <span class="text-gray-400">vs</span>
                          <span class="font-semibold">{bet.opponent_username}</span>
                          {#if bet.opponent_id === $auth.user.id}
                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                          {/if}
                        </div>
                        <p class="text-sm text-gray-600 mb-2">{bet.description}</p>
                        
                        <!-- Bet details -->
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <div>{formatDate(bet.created_at)}</div>
                          {#if bet.match_name || bet.round_name || bet.tournament_name}
                            <div class="flex items-center space-x-1">
                              {#if bet.match_name}<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">Match: {bet.match_name}</span>{/if}
                              {#if bet.round_name}<span class="px-2 py-1 bg-green-100 text-green-800 rounded">Round: {bet.round_name}</span>{/if}
                              {#if bet.tournament_name}<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded">Tournament: {bet.tournament_name}</span>{/if}
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
                      <div class="mt-3 p-3 {bet.winner_id === $auth.user.id ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} rounded-lg border">
                        <div class="flex items-center justify-between">
                          <div>
                            <span class="text-sm text-gray-600">
                              {bet.winner_id === $auth.user.id ? 'You won!' : 'You lost'}
                            </span>
                            <span class="font-semibold ml-1">
                              {bet.winner_id === bet.creator_id ? bet.creator_username : bet.opponent_username} 
                              won {formatCurrency(bet.amount)}
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
                    
                    {#if bet.status === 'pending' && bet.opponent_id === $auth.user.id}
                      <div class="mt-3 flex gap-2">
                        <button 
                          class="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          on:click={() => betsStore.updateBetStatus(bet.id, 'accepted')}
                        >
                          Accept Bet
                        </button>
                        <button 
                          class="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          on:click={() => betsStore.updateBetStatus(bet.id, 'declined')}
                        >
                          Decline
                        </button>
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
              
              <div class="p-4 border-t">
                <a 
                  href="/my-bets/new" 
                  class="w-full py-2 bg-blue-600 text-white rounded-lg text-center block hover:bg-blue-700 transition-colors"
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
          <div class="bg-gradient-to-r from-yellow-500 to-green-500 text-white p-4 rounded-t-lg">
            <h2 class="text-xl font-bold flex items-center">
              💰 Money Leaderboard
              <span class="ml-2 text-sm bg-white/20 px-2 py-1 rounded-full">Live</span>
            </h2>
          </div>
          <div class="p-4">
            {#if loading}
              <div class="space-y-3">
                {#each Array(5) as _}
                  <div class="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
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
        
        <!-- Create Bet CTA -->
        {#if $auth.user}
          <div class="golf-card">
            <div class="p-6 text-center">
              <div class="text-4xl mb-3">💰</div>
              <h3 class="text-lg font-bold mb-2">Ready to Make a Bet?</h3>
              <p class="text-gray-600 mb-4">Challenge other players and win some money!</p>
              <a 
                href="/my-bets/new" 
                class="w-full py-2 bg-blue-600 text-white rounded-lg text-center block hover:bg-blue-700 transition-colors"
              >
                Create New Bet
              </a>
            </div>
          </div>
        {:else}
          <div class="golf-card">
            <div class="p-6 text-center">
              <div class="text-4xl mb-3">🔐</div>
              <h3 class="text-lg font-bold mb-2">Login to Place Bets</h3>
              <p class="text-gray-600 mb-4">Join the action and challenge your friends!</p>
              <a 
                href="/login" 
                class="w-full py-2 bg-blue-600 text-white rounded-lg text-center block hover:bg-blue-700 transition-colors"
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
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }
  
  .loading-shimmer {
    animation: shimmer 2s infinite linear;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
</style>