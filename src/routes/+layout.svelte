<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import '../app.postcss';
  
  let menuOpen = false;
  
  function toggleMenu() {
    menuOpen = !menuOpen;
  }
  
  function closeMenu() {
    menuOpen = false;
  }
  
  onMount(() => {
    // Check session on mount
    auth.checkSession();
  });
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex-shrink-0 flex items-center">
          <a href="/" class="text-xl font-bold text-blue-600">Rowdy Cup</a>
        </div>
        
        <div class="flex items-center">
          <button 
            on:click={toggleMenu} 
            class="p-2 rounded-md text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>
  
  {#if menuOpen}
    <div class="fixed inset-0 z-40 bg-black bg-opacity-50" on:click={closeMenu}></div>
    <div class="fixed top-0 right-0 z-50 w-64 h-full bg-white shadow-lg transform transition-transform duration-300">
      <div class="p-4 border-b">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Menu</h2>
          <button on:click={closeMenu} class="p-2 rounded-md text-gray-500 hover:text-gray-700">
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <nav class="mt-4">
        <ul class="space-y-2 px-4">
          <li>
            <a 
              href="/" 
              class="block px-4 py-2 rounded-md hover:bg-gray-100" 
              on:click={closeMenu}
            >
              Tournament Home
            </a>
          </li>
          
          <li>
            <a 
              href="/teams" 
              class="block px-4 py-2 rounded-md hover:bg-gray-100" 
              on:click={closeMenu}
            >
              Team Rosters
            </a>
          </li>
          
          <li>
            <a 
              href="/sportsbook" 
              class="block px-4 py-2 rounded-md hover:bg-gray-100" 
              on:click={closeMenu}
            >
              Sportsbook
            </a>
          </li>
          
          {#if $auth.user}
            <li>
              <a 
                href="/my-bets" 
                class="block px-4 py-2 rounded-md hover:bg-gray-100" 
                on:click={closeMenu}
              >
                My Bets
              </a>
            </li>
            
            <li>
              <a 
                href="/history" 
                class="block px-4 py-2 rounded-md hover:bg-gray-100" 
                on:click={closeMenu}
              >
                History
              </a>
            </li>
            
            {#if $auth.user?.isAdmin}
              <li>
                <a 
                  href="/admin" 
                  class="block px-4 py-2 rounded-md hover:bg-gray-100 text-blue-600" 
                  on:click={closeMenu}
                >
                  Admin
                </a>
              </li>
            {/if}
            
            <li class="border-t mt-4 pt-4">
              <button 
                on:click={() => { closeMenu(); auth.logout(); }}
                class="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-100 text-red-600"
              >
                Logout ({$auth.user.username})
              </button>
            </li>
          {:else}
            <li class="border-t mt-4 pt-4">
              <a 
                href="/login" 
                class="block px-4 py-2 rounded-md hover:bg-gray-100" 
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
  
  <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    {#if $auth.loading}
      <div class="flex justify-center p-12">
        <div class="spinner border-t-4 border-blue-500 border-solid rounded-full w-12 h-12 animate-spin"></div>
      </div>
    {:else}
      <slot />
    {/if}
  </main>
</div>

<style>
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .spinner {
    animation: spin 1s linear infinite;
  }
</style>