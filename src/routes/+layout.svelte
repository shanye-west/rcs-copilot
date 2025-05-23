<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import '../app.postcss';
  import OfflineIndicator from '$lib/components/OfflineIndicator.svelte';

  let activeTab = 'tournament';
  let menuOpen = false;
  let currentTournament = "Rowdy Cup 2025";
  let currentRound = "Round 2";
  let userTeam = "The Aviators";
  let userStats = {
    status: "2↑",
    hole: 12,
    winnings: 250,
    activeBets: 3
  };

  // Determine active tab based on current route
  $: {
    const path = $page.url.pathname;
    if (path.includes('/matches/')) activeTab = 'scorecard';
    else if (path.includes('/sportsbook') || path.includes('/my-bets')) activeTab = 'betting';
    else if (path.includes('/teams')) activeTab = 'teams';
    else if (path === '/' || path.includes('/rounds/')) activeTab = 'tournament';
    else activeTab = 'tournament';
  }

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  function closeMenu() {
    menuOpen = false;
  }

  function navigateToTab(tab: string) {
    switch(tab) {
      case 'scorecard':
        // Navigate to current match or match selection
        goto('/');
        break;
      case 'tournament':
        goto('/');
        break;
      case 'betting':
        goto('/sportsbook');
        break;
      case 'teams':
        goto('/teams');
        break;
    }
    activeTab = tab;
  }

  onMount(() => {
    auth.checkSession();
  });

  // DEBUG: Log auth state changes
  $: console.log('LAYOUT: $auth.user =', $auth.user);
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
  <!-- Global offline indicator -->
  <OfflineIndicator />

  <!-- Tournament Header (only show on main pages) -->
  {#if !$page.url.pathname.includes('/login') && !$page.url.pathname.includes('/admin')}
    <div class="bg-gradient-to-r from-green-700 via-blue-600 to-purple-700 text-white shadow-lg">
      <div class="px-4 py-6">
        <div class="text-center">
          <h1 class="text-2xl font-bold tracking-wide">{currentTournament}</h1>
          <div class="flex justify-center items-center mt-2 space-x-4">
            <span class="bg-white/20 px-3 py-1 rounded-full text-sm">
              {currentRound}
            </span>
            {#if $auth.user}
              <span class="bg-white/20 px-3 py-1 rounded-full text-sm">
                Team: {userTeam}
              </span>
            {/if}
          </div>
        </div>
      </div>

      <!-- Quick Stats Bar -->
      {#if $auth.user && !$auth.user.isAdmin}
        <div class="bg-black/20 px-4 py-3">
          <div class="flex justify-between text-center">
            <div>
              <div class="text-lg font-bold">{userStats.status}</div>
              <div class="text-xs opacity-80">Status</div>
            </div>
            <div>
              <div class="text-lg font-bold">{userStats.hole}</div>
              <div class="text-xs opacity-80">Hole</div>
            </div>
            <div>
              <div class="text-lg font-bold">${userStats.winnings}</div>
              <div class="text-xs opacity-80">Winnings</div>
            </div>
            <div>
              <div class="text-lg font-bold">{userStats.activeBets}</div>
              <div class="text-xs opacity-80">Active Bets</div>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Main Navigation Tabs -->
    <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="flex">
        {#each [
          { id: 'tournament', label: 'Tournament', icon: '🏆' },
          { id: 'scorecard', label: 'Scorecard', icon: '⛳' },
          { id: 'betting', label: 'Betting', icon: '💰' },
          { id: 'teams', label: 'Teams', icon: '👥' }
        ] as tab}
          <button
            on:click={() => navigateToTab(tab.id)}
            class="flex-1 py-4 px-2 text-center transition-all {
              activeTab === tab.id
                ? 'border-b-3 border-green-600 text-green-600 bg-green-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }"
          >
            <div class="text-lg mb-1">{tab.icon}</div>
            <div class="text-xs font-semibold">{tab.label}</div>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto {$page.url.pathname.includes('/matches/') ? '' : 'pb-20'}">
    {#if $auth.loading}
      <div class="flex justify-center items-center min-h-[50vh]">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-gray-600">Loading...</p>
        </div>
      </div>
    {:else}
      <slot />
    {/if}
  </main>

  <!-- Floating Action Menu (only on non-match pages) -->
  {#if !$page.url.pathname.includes('/matches/') && !$page.url.pathname.includes('/login') && !$page.url.pathname.includes('/admin')}
    <div class="fixed bottom-6 right-6 z-50">
      <button 
        on:click={toggleMenu}
        class="bg-gradient-to-r from-green-500 to-blue-500 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform"
      >
        {menuOpen ? '✕' : '⚡'}
      </button>
      
      {#if menuOpen}
        <div class="absolute bottom-20 right-0 bg-white rounded-2xl shadow-2xl p-4 w-48">
          <div class="space-y-3">
            {#if $auth.user}
              <button 
                on:click={() => { closeMenu(); goto('/my-bets'); }}
                class="w-full text-left p-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                💰 My Bets
              </button>
              <button 
                on:click={() => { closeMenu(); goto('/stats'); }}
                class="w-full text-left p-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                📊 My Stats
              </button>
              {#if $auth.user.isAdmin}
                <button 
                  on:click={() => { closeMenu(); goto('/admin'); }}
                  class="w-full text-left p-3 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  ⚙️ Admin
                </button>
              {/if}
              <button 
                on:click={() => { closeMenu(); auth.logout(); }}
                class="w-full text-left p-3 rounded-xl hover:bg-gray-100 transition-colors text-red-600"
              >
                🚪 Logout
              </button>
            {:else}
              <button 
                on:click={() => { closeMenu(); goto('/login'); }}
                class="w-full text-left p-3 rounded-xl hover:bg-gray-100 transition-colors"
              >
                🔑 Login
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Overlay for menu -->
  {#if menuOpen}
    <div
      class="fixed inset-0 bg-black/20 z-40"
      on:click={closeMenu}
      on:keydown={(e) => e.key === 'Escape' && closeMenu()}
      role="button"
      tabindex="0"
    ></div>
  {/if}
</div>

<style>
  .border-b-3 {
    border-bottom-width: 3px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>