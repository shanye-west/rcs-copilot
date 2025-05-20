<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  let activeTournament: any = null;
  let loading = true;
  
  onMount(async () => {
    // Fetch active tournament
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (!error && data) {
      activeTournament = data;
    }
    
    loading = false;
  });
</script>

<div class="bg-white shadow overflow-hidden sm:rounded-lg">
  <div class="px-4 py-5 sm:px-6">
    <h1 class="text-2xl font-bold text-gray-900">Rowdy Cup Tournament</h1>
    {#if $auth.user}
      <p class="mt-1 max-w-2xl text-sm text-gray-500">
        Welcome back, {$auth.user.fullName}!
      </p>
    {:else}
      <p class="mt-1 max-w-2xl text-sm text-gray-500">
        Welcome to the Rowdy Cup Golf Tournament app.
      </p>
    {/if}
  </div>
  
  <div class="border-t border-gray-200 px-4 py-5 sm:p-6">
    {#if loading}
      <p>Loading tournament data...</p>
    {:else if activeTournament}
      <div class="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900">
          {activeTournament.name}
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          {new Date(activeTournament.start_date).toLocaleDateString()} 
          to 
          {new Date(activeTournament.end_date).toLocaleDateString()}
        </p>
      </div>
      
      <div class="px-4 py-5 sm:p-6">
        <div class="text-center">
          <p class="text-sm text-gray-500">Tournament is active</p>
          <div class="mt-3">
            <a
              href="/rounds"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              View Rounds
            </a>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No Active Tournament</h3>
        <p class="mt-1 text-sm text-gray-500">
          There are no active tournaments at the moment.
        </p>
        
        {#if $auth.user?.isAdmin}
          <div class="mt-6">
            <a
              href="/admin/tournaments/new"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Tournament
            </a>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>