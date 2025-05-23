<!-- src/routes/matches/[matchId]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';
  import { supabase } from '$lib/supabase';
  import { offlineStore } from '$lib/stores/offline-store';

  export let data;
  
  // Reactive data
  $: match = data.match || {};
  $: teams = data.teams || [];
  $: matchType = data.matchType || {};
  $: matchPlayers = data.matchPlayers || [];
  $: scores = data.scores || [];

  // Local state
  let playerScores = {};
  let currentHole = 1;
  let matchStatus = 'ALL SQUARE';

  // Subscribe to auth store
  let authState;
  const unsubscribe = auth.subscribe((state) => {
    authState = state;
  });

  // Get team players
  const uniqueTeamIds = [...new Set(matchPlayers.map((mp) => mp.team_id))];
  $: teamAPlayers = matchPlayers.filter((mp) => mp.team_id === uniqueTeamIds[0]);
  $: teamBPlayers = matchPlayers.filter((mp) => mp.team_id === uniqueTeamIds[1]);

  // Helper to check if match is locked
  const isLocked = match?.is_locked;

  // Par values for holes (simplified - normally would come from course data)
  const parValues = {
    17: { par: 4, handicap: 14 },
    18: { par: 4, handicap: 4 }
  };

  onMount(() => {
    // Initialize player scores
    [...teamAPlayers, ...teamBPlayers].forEach(player => {
      playerScores[player.player_id] = {};
      for (let hole = 1; hole <= 18; hole++) {
        const existingScore = scores.find(s => 
          s.player_id === player.player_id && s.hole_number === hole
        );
        playerScores[player.player_id][hole] = existingScore?.gross_score || '';
      }
    });
  });

  // Save score function
  async function saveScore(playerId, hole, score) {
    if (!authState?.user || isLocked) return;

    playerScores[playerId][hole] = score;

    const playerEntry = matchPlayers.find((p) => p.player_id === playerId);
    if (!playerEntry) return;

    // Add to offline store first
    if (score !== null && score !== '') {
      offlineStore.addScore({
        player_id: playerId,
        hole_number: hole,
        score: Number(score),
        match_id: match.id
      });
    }

    // If online, save to Supabase
    if ($offlineStore.isOnline) {
      try {
        const { error } = await supabase.from('scores').upsert(
          [
            {
              match_id: match.id,
              player_id: playerId,
              team: playerEntry.team_id,
              hole_number: hole,
              gross_score: score ? Number(score) : null
            }
          ],
          { onConflict: 'match_id,player_id,hole_number' }
        );
        
        if (error) {
          console.error('Error saving score:', error.message);
        } else {
          offlineStore.markSynced(playerId, hole, match.id);
        }
      } catch (error) {
        console.error('Failed to save score:', error);
      }
    }
  }

  // Calculate totals
  function calculateTotal(holes) {
    return holes.reduce((sum, hole) => {
      const par = parValues[hole]?.par || 4;
      return sum + par;
    }, 0);
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-4xl mx-auto px-4 py-6">
    
    <!-- Back Navigation -->
    <div class="mb-6">
      <a 
        href="/rounds/{match.round_id}" 
        class="flex items-center text-blue-600 hover:text-blue-700 font-medium"
      >
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Round
      </a>
    </div>

    <!-- Match Header -->
    <div class="bg-gray-800 text-white rounded-lg p-6 mb-6">
      <h1 class="text-2xl font-bold mb-2">Match 1</h1>
      <div class="text-gray-300">
        <div>{matchType?.name || '2-man Team Scramble'} • Round 1</div>
      </div>
    </div>

    <!-- Team Display -->
    <div class="mb-6">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div class="grid grid-cols-2 gap-8">
          <!-- Aviators -->
          <div class="text-center">
            <div class="flex items-center justify-center mb-2">
              <div class="w-6 h-6 bg-blue-900 rounded-full mr-3"></div>
              <span class="font-bold text-gray-900">AVIATORS</span>
            </div>
            <div class="space-y-1 text-gray-700">
              {#each teamAPlayers as player}
                <div>{player.player?.username || player.username}</div>
              {/each}
            </div>
          </div>

          <!-- Producers -->
          <div class="text-center">
            <div class="flex items-center justify-center mb-2">
              <div class="w-6 h-6 bg-red-700 rounded-full mr-3"></div>
              <span class="font-bold text-gray-900">PRODUCERS</span>
            </div>
            <div class="space-y-1 text-gray-700">
              {#each teamBPlayers as player}
                <div>{player.player?.username || player.username}</div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Match Status -->
    <div class="mb-6 text-center">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div class="text-2xl font-bold text-gray-900">{matchStatus}</div>
        <div class="text-gray-500">Hole {currentHole}</div>
      </div>
    </div>

    <!-- Scorecard Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50">Hole</th>
              <th class="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50">17</th>
              <th class="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50">18</th>
              <th class="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50">IN</th>
              <th class="px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-50">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <!-- Par Row -->
            <tr class="border-b border-gray-100">
              <td class="px-4 py-3 text-sm font-medium text-gray-700">Par</td>
              <td class="px-4 py-3 text-center text-sm">
                4 <span class="text-blue-600">(14)</span>
              </td>
              <td class="px-4 py-3 text-center text-sm">
                4 <span class="text-blue-600">(4)</span>
              </td>
              <td class="px-4 py-3 text-center text-sm font-medium bg-gray-50">36</td>
              <td class="px-4 py-3 text-center text-sm font-medium bg-gray-50">71</td>
            </tr>

            <!-- Team A (Aviators) Row -->
            <tr class="bg-blue-50 border-b border-gray-100">
              <td class="px-4 py-3 text-sm font-bold text-white bg-blue-900">The Aviators</td>
              <td class="px-4 py-3 text-center">
                {#if !isLocked}
                  <input 
                    type="text" 
                    class="w-12 h-8 text-center border border-gray-300 rounded text-sm"
                    bind:value={playerScores[teamAPlayers[0]?.player_id]?.[17]}
                    on:change={() => saveScore(teamAPlayers[0]?.player_id, 17, playerScores[teamAPlayers[0]?.player_id]?.[17])}
                  />
                {:else}
                  <span class="text-sm">{playerScores[teamAPlayers[0]?.player_id]?.[17] || '-'}</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-center">
                {#if !isLocked}
                  <input 
                    type="text" 
                    class="w-12 h-8 text-center border border-gray-300 rounded text-sm"
                    bind:value={playerScores[teamAPlayers[0]?.player_id]?.[18]}
                    on:change={() => saveScore(teamAPlayers[0]?.player_id, 18, playerScores[teamAPlayers[0]?.player_id]?.[18])}
                  />
                {:else}
                  <span class="text-sm">{playerScores[teamAPlayers[0]?.player_id]?.[18] || '-'}</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-center text-sm font-medium bg-gray-50">-</td>
              <td class="px-4 py-3 text-center text-sm font-medium bg-gray-50">-</td>
            </tr>

            <!-- Match Status Row -->
            <tr class="border-b border-gray-100">
              <td class="px-4 py-3 text-sm font-medium text-gray-700">Match Status</td>
              <td class="px-4 py-3 text-center text-sm">-</td>
              <td class="px-4 py-3 text-center text-sm">-</td>
              <td class="px-4 py-3 text-center text-sm bg-gray-50"></td>
              <td class="px-4 py-3 text-center text-sm bg-gray-50"></td>
            </tr>

            <!-- Team B (Producers) Row -->
            <tr class="bg-red-50 border-b border-gray-100">
              <td class="px-4 py-3 text-sm font-bold text-white bg-red-700">The Producers</td>
              <td class="px-4 py-3 text-center">
                {#if !isLocked}
                  <input 
                    type="text" 
                    class="w-12 h-8 text-center border border-gray-300 rounded text-sm"
                    bind:value={playerScores[teamBPlayers[0]?.player_id]?.[17]}
                    on:change={() => saveScore(teamBPlayers[0]?.player_id, 17, playerScores[teamBPlayers[0]?.player_id]?.[17])}
                  />
                {:else}
                  <span class="text-sm">{playerScores[teamBPlayers[0]?.player_id]?.[17] || '-'}</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-center">
                {#if !isLocked}
                  <input 
                    type="text" 
                    class="w-12 h-8 text-center border border-gray-300 rounded text-sm"
                    bind:value={playerScores[teamBPlayers[0]?.player_id]?.[18]}
                    on:change={() => saveScore(teamBPlayers[0]?.player_id, 18, playerScores[teamBPlayers[0]?.player_id]?.[18])}
                  />
                {:else}
                  <span class="text-sm">{playerScores[teamBPlayers[0]?.player_id]?.[18] || '-'}</span>
                {/if}
              </td>
              <td class="px-4 py-3 text-center text-sm font-medium bg-gray-50">-</td>
              <td class="px-4 py-3 text-center text-sm font-medium bg-gray-50">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Admin Controls -->
    {#if authState?.user?.isAdmin}
      <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-yellow-800">Admin Controls</span>
          <button 
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
          >
            {isLocked ? 'Unlock Match' : 'Lock Match'}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>