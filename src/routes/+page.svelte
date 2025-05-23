<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  export let data;
  const { tournament, rounds, matches, matchTypes } = data;

  let isAdmin = false;
  let showEditTournament = false;
  let showAddRound = false;

  onMount(() => {
    const unsubscribe = auth.subscribe((state) => {
      isAdmin = !!state.user?.isAdmin;
    });
    return unsubscribe;
  });

  function getMatchesForRound(roundId: string) {
    return matches.filter((m) => m.round_id === roundId);
  }

  function getMatchTypeName(matchTypeId: string) {
    const type = matchTypes.find((t) => t.id === matchTypeId);
    return type ? type.name : matchTypeId;
  }

  // Calculate team scores
  function calculateTeamScores() {
    // This would calculate from actual match results
    return { aviators: 0, producers: 0 };
  }

  $: teamScores = calculateTeamScores();
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 py-6">
    
    <!-- Admin Controls (if admin) -->
    {#if isAdmin}
      <div class="mb-6 flex flex-col sm:flex-row gap-3">
        <button 
          on:click={() => showEditTournament = true}
          class="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Edit Tournament
        </button>
        
        <button 
          on:click={() => showAddRound = true}
          class="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Add New Round
        </button>
      </div>
    {/if}

    <!-- Team Score Display -->
    <div class="mb-8">
      <div class="flex items-center justify-center space-x-8">
        <!-- Aviators -->
        <div class="text-center">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-w-[140px]">
            <!-- Team Logo Placeholder -->
            <div class="w-16 h-16 mx-auto mb-4 bg-blue-900 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-sm">AVIATORS</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-2">{teamScores.aviators}</div>
          </div>
        </div>

        <!-- VS -->
        <div class="text-2xl font-bold text-gray-600">VS</div>

        <!-- Producers -->
        <div class="text-center">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-w-[140px]">
            <!-- Team Logo Placeholder -->
            <div class="w-16 h-16 mx-auto mb-4 bg-red-700 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-sm">PRODUCERS</span>
            </div>
            <div class="text-4xl font-bold text-gray-900 mb-2">{teamScores.producers}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tournament Rounds Section -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Tournament Rounds</h2>
      
      {#if rounds.length === 0}
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p class="text-gray-500 mb-4">No rounds have been created yet.</p>
          {#if isAdmin}
            <button 
              on:click={() => showAddRound = true}
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create First Round
            </button>
          {/if}
        </div>
      {:else}
        <div class="space-y-4">
          {#each rounds as round (round.id)}
            {@const roundMatches = getMatchesForRound(round.id)}
            
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <!-- Round Header -->
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">{round.name}</h3>
                    <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>{round.location || 'The Coeur d\'Alene Golf Resort'}</span>
                      <span>{round.match_type || '2-man Team Scramble'}</span>
                    </div>
                  </div>
                  {#if isAdmin}
                    <button class="p-2 text-gray-400 hover:text-gray-600">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  {/if}
                </div>
              </div>

              <!-- Round Score Display -->
              <div class="px-6 py-4">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center space-x-4">
                    <div class="w-3 h-3 bg-blue-900 rounded-full"></div>
                    <span class="font-medium">0</span>
                  </div>
                  
                  <div class="flex items-center space-x-4">
                    <span class="font-medium">0</span>
                    <div class="w-3 h-3 bg-red-700 rounded-full"></div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-sm text-gray-500">
                  <span>{round.date || '2025-05-17'}</span>
                  <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    In Progress
                  </span>
                  <span>{round.tee_time || '08:00'}</span>
                </div>
              </div>

              <!-- Round Matches -->
              {#if roundMatches.length > 0}
                <div class="border-t border-gray-200">
                  {#each roundMatches as match, index (match.id)}
                    <div class="px-6 py-4 {index > 0 ? 'border-t border-gray-100' : ''}">
                      <div class="flex items-center justify-between">
                        <div>
                          <h4 class="font-medium text-gray-900">Match {index + 1}</h4>
                          <div class="mt-2 grid grid-cols-2 gap-8">
                            <!-- Team A Players -->
                            <div>
                              <div class="flex items-center mb-1">
                                <div class="w-2 h-2 bg-blue-900 rounded-full mr-2"></div>
                                <span class="text-sm font-medium">AVIATORS</span>
                              </div>
                              <div class="text-sm text-gray-600 space-y-1">
                                <div>Jake Kushner</div>
                                <div>Garrick Oliver</div>
                              </div>
                            </div>
                            
                            <!-- Team B Players -->
                            <div>
                              <div class="flex items-center mb-1">
                                <div class="w-2 h-2 bg-red-700 rounded-full mr-2"></div>
                                <span class="text-sm font-medium">PRODUCERS</span>
                              </div>
                              <div class="text-sm text-gray-600 space-y-1">
                                <div>PJ Connell</div>
                                <div>James Braswell</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="text-right">
                          <span class="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium mb-2">
                            Upcoming
                          </span>
                          <div>
                            <a 
                              href="/rounds/{round.id}/matches/{match.id}" 
                              class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Match →
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Edit Tournament Modal -->
{#if showEditTournament}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Edit Tournament</h2>
        <button 
          class="text-gray-400 hover:text-gray-600"
          on:click={() => showEditTournament = false}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Tournament edit form would go here -->
      <div class="space-y-4 mb-6">
        <div>
          <label for="tournamentName" class="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
          <input 
            id="tournamentName" 
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={tournament?.name || ''}
          />
        </div>
      </div>
      
      <div class="flex justify-end gap-3">
        <button 
          on:click={() => showEditTournament = false}
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Round Modal -->
{#if showAddRound}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Add New Round</h2>
        <button 
          class="text-gray-400 hover:text-gray-600"
          on:click={() => showAddRound = false}
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Round add form would go here -->
      <div class="space-y-4 mb-6">
        <div>
          <label for="roundName" class="block text-sm font-medium text-gray-700 mb-1">Round Name</label>
          <input 
            id="roundName" 
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. Round 1"
          />
        </div>
      </div>
      
      <div class="flex justify-end gap-3">
        <button 
          on:click={() => showAddRound = false}
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Add Round
        </button>
      </div>
    </div>
  </div>
{/if}