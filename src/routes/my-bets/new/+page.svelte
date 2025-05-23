<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';
  import { betsStore, ResolutionType } from '$lib/stores/bets';
  import { supabase } from '$lib/supabase';

  // State for new bet form
  let amount = 10;
  let description = '';
  let opponentId = '';
  let resolutionType = ResolutionType.CUSTOM;
  let matchId = '';
  let roundId = '';
  let tournamentId = '';

  // Available options from database
  let availablePlayers = [];
  let availableMatches = [];
  let availableRounds = [];
  let availableTournaments = [];

  // Form state
  let isSubmitting = false;
  let error = '';
  let success = false;

  // Fetch available players for opponent selection
  async function fetchPlayers() {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, username, full_name')
        .neq('id', $auth.user?.id || '');

      if (error) throw error;
      availablePlayers = data || [];
    } catch (err) {
      console.error('Error fetching players:', err);
      error = 'Failed to load players. Please try again.';
    }
  }

  // Fetch matches, rounds, and tournaments
  async function fetchReferenceData() {
    try {
      // Fetch matches
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('id, name, match_type_id, status')
        .eq('status', 'active');
      
      if (matchError) throw matchError;
      availableMatches = matchData || [];

      // Fetch rounds
      const { data: roundData, error: roundError } = await supabase
        .from('rounds')
        .select('id, name, status')
        .eq('status', 'active');
      
      if (roundError) throw roundError;
      availableRounds = roundData || [];

      // Fetch tournaments
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name, status')
        .eq('status', 'active');
      
      if (tournamentError) throw tournamentError;
      availableTournaments = tournamentData || [];
    } catch (err) {
      console.error('Error fetching reference data:', err);
      error = 'Failed to load match, round, or tournament data.';
    }
  }

  // Handle form submission
  async function handleSubmit() {
    if (!$auth.user) {
      goto('/login');
      return;
    }

    error = '';
    isSubmitting = true;

    try {
      // Validate form
      if (amount <= 0) {
        throw new Error('Bet amount must be greater than 0');
      }

      if (!description.trim()) {
        throw new Error('Please provide a description for your bet');
      }

      if (!opponentId) {
        throw new Error('Please select an opponent');
      }

      // Create bet data based on resolution type
      const betData = {
        creator_id: $auth.user.id,
        opponent_id: opponentId,
        amount: amount,
        description: description,
        resolution_type: resolutionType,
        match_id: resolutionType === ResolutionType.MATCH ? matchId : null,
        round_id: resolutionType === ResolutionType.ROUND ? roundId : null,
        tournament_id: resolutionType === ResolutionType.TOURNAMENT ? tournamentId : null
      };

      // Submit the bet
      const result = await betsStore.createBet(betData);

      if (result.success) {
        success = true;
        // Reset form after successful submission
        setTimeout(() => {
          goto('/my-bets');
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to create bet');
      }
    } catch (err) {
      console.error('Error creating bet:', err);
      error = err.message || 'An error occurred while creating the bet';
    } finally {
      isSubmitting = false;
    }
  }

  // Initialize data on mount
  onMount(() => {
    if (!$auth.user) {
      goto('/login');
      return;
    }
    
    fetchPlayers();
    fetchReferenceData();
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20">
  <!-- Hero Section -->
  <div class="golf-gradient text-white p-6 mb-6">
    <div class="max-w-3xl mx-auto">
      <div class="flex items-center mb-4">
        <a href="/my-bets" class="text-white mr-4">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </a>
        <h1 class="text-2xl font-bold">Create New Bet</h1>
      </div>
      <p class="text-blue-100">Challenge other players and place bets</p>
    </div>
  </div>
  
  <div class="max-w-3xl mx-auto px-4">
    <!-- Form Card -->
    <div class="golf-card mb-6">
      {#if success}
        <div class="bg-green-500 text-white p-4 rounded-t-lg">
          <h2 class="text-xl font-bold">Bet Created Successfully!</h2>
        </div>
        <div class="p-6 text-center">
          <div class="text-5xl mb-4">🎉</div>
          <p class="mb-4">Your bet has been created and is waiting for your opponent to accept.</p>
          <p class="text-sm text-gray-500">Redirecting you to your bets...</p>
        </div>
      {:else}
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <h2 class="text-xl font-bold">Place Your Bet</h2>
        </div>
        
        <form on:submit|preventDefault={handleSubmit} class="p-6 space-y-6">
          {#if error}
            <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          {/if}
          
          <!-- Amount Field -->
          <div>
            <label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
              Bet Amount
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                bind:value={amount}
                min="1"
                step="5"
                required
                class="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
            <p class="mt-1 text-xs text-gray-500">The amount you want to bet</p>
          </div>
          
          <!-- Opponent Field -->
          <div>
            <label for="opponent" class="block text-sm font-medium text-gray-700 mb-1">
              Opponent
            </label>
            <select 
              id="opponent"
              name="opponent"
              bind:value={opponentId}
              required
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            >
              <option value="">Select an opponent</option>
              {#each availablePlayers as player}
                <option value={player.id}>{player.username}</option>
              {/each}
            </select>
            <p class="mt-1 text-xs text-gray-500">Who do you want to bet against?</p>
          </div>
          
          <!-- Description Field -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Bet Description
            </label>
            <textarea
              id="description"
              name="description"
              bind:value={description}
              rows="3"
              required
              placeholder="Describe what you're betting on"
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">Be specific about the conditions of the bet</p>
          </div>
          
          <!-- Resolution Type -->
          <div>
            <span class="block text-sm font-medium text-gray-700 mb-2">Resolution Type</span>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label class="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="resolutionType" 
                  value={ResolutionType.CUSTOM}
                  bind:group={resolutionType}
                  class="mr-2"
                />
                <span>Custom</span>
              </label>
              <label class="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="resolutionType" 
                  value={ResolutionType.MATCH}
                  bind:group={resolutionType}
                  class="mr-2"
                />
                <span>Match</span>
              </label>
              <label class="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="resolutionType" 
                  value={ResolutionType.ROUND}
                  bind:group={resolutionType}
                  class="mr-2"
                />
                <span>Round</span>
              </label>
              <label class="flex items-center p-2 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <input 
                  type="radio" 
                  name="resolutionType" 
                  value={ResolutionType.TOURNAMENT}
                  bind:group={resolutionType}
                  class="mr-2"
                />
                <span>Tournament</span>
              </label>
            </div>
            <p class="mt-1 text-xs text-gray-500">Select how this bet will be resolved</p>
          </div>
          
          <!-- Conditional fields based on resolution type -->
          {#if resolutionType === ResolutionType.MATCH}
            <div>
              <label for="matchId" class="block text-sm font-medium text-gray-700 mb-1">
                Select Match
              </label>
              <select 
                id="matchId"
                name="matchId"
                bind:value={matchId}
                required={resolutionType === ResolutionType.MATCH}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              >
                <option value="">Select a match</option>
                {#each availableMatches as match}
                  <option value={match.id}>
                    {match.name || `Match #${match.id}`}
                  </option>
                {/each}
              </select>
            </div>
          {:else if resolutionType === ResolutionType.ROUND}
            <div>
              <label for="roundId" class="block text-sm font-medium text-gray-700 mb-1">
                Select Round
              </label>
              <select 
                id="roundId"
                name="roundId"
                bind:value={roundId}
                required={resolutionType === ResolutionType.ROUND}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              >
                <option value="">Select a round</option>
                {#each availableRounds as round}
                  <option value={round.id}>{round.name}</option>
                {/each}
              </select>
            </div>
          {:else if resolutionType === ResolutionType.TOURNAMENT}
            <div>
              <label for="tournamentId" class="block text-sm font-medium text-gray-700 mb-1">
                Select Tournament
              </label>
              <select 
                id="tournamentId"
                name="tournamentId"
                bind:value={tournamentId}
                required={resolutionType === ResolutionType.TOURNAMENT}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              >
                <option value="">Select a tournament</option>
                {#each availableTournaments as tournament}
                  <option value={tournament.id}>{tournament.name}</option>
                {/each}
              </select>
            </div>
          {/if}
          
          <!-- Submit Button -->
          <div class="pt-4">
            <button
              type="submit"
              class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              disabled={isSubmitting}
            >
              {#if isSubmitting}
                <span>Creating Bet...</span>
              {:else}
                <span>Create Bet</span>
              {/if}
            </button>
          </div>
        </form>
      {/if}
    </div>
    
    <!-- Info Cards -->
    <div class="grid gap-6 md:grid-cols-2">
      <div class="golf-card p-4">
        <div class="text-center p-4">
          <div class="text-3xl mb-2">💸</div>
          <h3 class="text-lg font-bold mb-2">How Bets Work</h3>
          <p class="text-sm text-gray-600">
            Bets require both parties to accept. Once accepted, payment is handled
            person-to-person between players.
          </p>
        </div>
      </div>
      
      <div class="golf-card p-4">
        <div class="text-center p-4">
          <div class="text-3xl mb-2">🤝</div>
          <h3 class="text-lg font-bold mb-2">Fair Play Policy</h3>
          <p class="text-sm text-gray-600">
            All bets are made in good faith and should be paid promptly upon completion.
            The app simply tracks bets and doesn't handle money.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
