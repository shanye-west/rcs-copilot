<!-- src/lib/components/EnhancedScorecard.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  
  // Props
  export let match: any;
  export let teamAPlayers: any[] = [];
  export let teamBPlayers: any[] = [];
  export let scores: any[] = [];
  export let isLocked: boolean = false;
  export let matchType: any = {};
  
  // Events
  const dispatch = createEventDispatcher();
  
  // State
  let currentHole = 1;
  let touchStartX = 0;
  let playerScores: Record<string, Record<number, number | string>> = {};
  
  // Initialize player scores
  onMount(() => {
    // Initialize scores for all players
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
  
  // Handle touch swipe navigation
  function handleTouchStart(event: TouchEvent) {
    touchStartX = event.touches[0].clientX;
  }
  
  function handleTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0 && currentHole < 18) {
        currentHole++; // Swipe left = next hole
      } else if (diff < 0 && currentHole > 1) {
        currentHole--; // Swipe right = previous hole
      }
    }
  }
  
  // Update score
  function updateScore(playerId: string, score: number | string) {
    if (isLocked) return;
    
    playerScores[playerId][currentHole] = score;
    
    // Emit score change event
    dispatch('scoreChange', {
      playerId,
      hole: currentHole,
      score: score === '' ? null : Number(score)
    });
  }
  
  // Get score color based on par
  function getScoreColor(score: number | string, par: number = 4): string {
    if (!score || score === '') return 'bg-gray-100 text-gray-700';
    
    const numScore = Number(score);
    if (numScore <= par - 2) return 'bg-yellow-400 text-yellow-900 ring-2 ring-yellow-500'; // Eagle+
    if (numScore === par - 1) return 'bg-red-500 text-white ring-2 ring-red-600'; // Birdie
    if (numScore === par) return 'bg-green-100 text-green-900 ring-2 ring-green-300'; // Par
    if (numScore === par + 1) return 'bg-blue-100 text-blue-900 ring-2 ring-blue-300'; // Bogey
    return 'bg-red-100 text-red-900 ring-2 ring-red-300'; // Double+
  }
  
  // Calculate match status
  function getMatchStatus(): string {
    if (matchType.name === '1v1 Individual Match') {
      // Calculate holes won by each player
      let teamAUp = 0, teamBUp = 0;
      
      for (let hole = 1; hole <= currentHole; hole++) {
        const teamAScore = playerScores[teamAPlayers[0]?.player_id]?.[hole];
        const teamBScore = playerScores[teamBPlayers[0]?.player_id]?.[hole];
        
        if (teamAScore && teamBScore && teamAScore !== '' && teamBScore !== '') {
          if (Number(teamAScore) < Number(teamBScore)) teamAUp++;
          else if (Number(teamBScore) < Number(teamAScore)) teamBUp++;
        }
      }
      
      if (teamAUp === teamBUp) return 'AS';
      if (teamAUp > teamBUp) return `${teamAUp - teamBUp}↑`;
      return `${teamBUp - teamAUp}↓`;
    }
    
    return 'AS'; // Default for other match types
  }
  
  // Get team colors
  const teamAColor = 'bg-blue-600';
  const teamBColor = 'bg-red-600';
  
  // Holes array
  const holes = Array.from({length: 18}, (_, i) => i + 1);
</script>

<!-- Status Bar -->
<div class="bg-white shadow-sm px-4 py-2 flex justify-between items-center text-sm sticky top-0 z-20">
  <div class="flex items-center space-x-2">
    <div class="w-2 h-2 rounded-full bg-green-500"></div>
    <span class="text-gray-600">Synced</span>
  </div>
  <div class="text-gray-600">{match?.tournament_name || 'Tournament'}</div>
  <div class="font-semibold text-blue-600">{getMatchStatus()}</div>
</div>

<!-- Hole Header -->
<div 
  class="bg-white mx-4 mt-4 rounded-2xl shadow-lg overflow-hidden"
  on:touchstart={handleTouchStart}
  on:touchend={handleTouchEnd}
  role="button"
  tabindex="0"
>
  <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 text-center">
    <div class="text-4xl font-bold mb-2">HOLE {currentHole}</div>
    <div class="flex justify-center space-x-6 text-sm">
      <div>Par 4</div>
      <div>425 yards</div>
      <div>HCP {currentHole}</div>
    </div>
    
    <!-- Progress Bar -->
    <div class="mt-4 bg-white/20 rounded-full h-2">
      <div 
        class="bg-white rounded-full h-2 transition-all duration-300" 
        style="width: {(currentHole / 18) * 100}%"
      ></div>
    </div>
  </div>
  
  <!-- Hole Navigation Dots -->
  <div class="p-4 flex justify-center space-x-1 overflow-x-auto">
    {#each holes as hole}
      <button
        on:click={() => currentHole = hole}
        class="w-8 h-8 rounded-full text-xs font-bold transition-all flex-shrink-0 {
          hole === currentHole 
            ? 'bg-green-600 text-white scale-125' 
            : (playerScores[teamAPlayers[0]?.player_id]?.[hole] || playerScores[teamBPlayers[0]?.player_id]?.[hole])
              ? 'bg-blue-200 text-blue-800'
              : 'bg-gray-200 text-gray-600'
        }"
      >
        {hole}
      </button>
    {/each}
  </div>
</div>

<!-- Score Entry Cards -->
<div class="px-4 mt-6 space-y-4 pb-32">
  <!-- Team A -->
  <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div class="{teamAColor} text-white p-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-lg">{match?.team_a_name || 'Team A'}</h3>
          <div class="text-blue-100 text-sm">
            {teamAPlayers.map(p => p.player?.username || p.username).join(' & ')}
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold">
            {#if matchType.name?.includes('Scramble')}
              {playerScores[teamAPlayers[0]?.player_id]?.[currentHole] || '-'}
            {:else}
              -
            {/if}
          </div>
          <div class="text-blue-100 text-xs">Team Score</div>
        </div>
      </div>
    </div>
    
    <div class="p-4 space-y-4">
      {#each teamAPlayers as player (player.player_id)}
        <div>
          <div class="text-sm text-gray-600 mb-2 flex justify-between">
            <span>{player.player?.username || player.username}</span>
            {#if player.player?.handicap}
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">HCP {player.player.handicap}</span>
            {/if}
          </div>
          <div class="grid grid-cols-4 gap-2">
            {#each [1,2,3,4,5,6,7,8] as score}
              <button
                on:click={() => updateScore(player.player_id, score)}
                disabled={isLocked}
                class="h-12 rounded-xl font-bold text-lg transition-all {
                  playerScores[player.player_id]?.[currentHole] === score
                    ? getScoreColor(score) + ' shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {score}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Team B -->
  <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div class="{teamBColor} text-white p-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold text-lg">{match?.team_b_name || 'Team B'}</h3>
          <div class="text-red-100 text-sm">
            {teamBPlayers.map(p => p.player?.username || p.username).join(' & ')}
          </div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold">
            {#if matchType.name?.includes('Scramble')}
              {playerScores[teamBPlayers[0]?.player_id]?.[currentHole] || '-'}
            {:else}
              -
            {/if}
          </div>
          <div class="text-red-100 text-xs">Team Score</div>
        </div>
      </div>
    </div>
    
    <div class="p-4 space-y-4">
      {#each teamBPlayers as player (player.player_id)}
        <div>
          <div class="text-sm text-gray-600 mb-2 flex justify-between">
            <span>{player.player?.username || player.username}</span>
            {#if player.player?.handicap}
              <span class="text-xs bg-gray-100 px-2 py-1 rounded">HCP {player.player.handicap}</span>
            {/if}
          </div>
          <div class="grid grid-cols-4 gap-2">
            {#each [1,2,3,4,5,6,7,8] as score}
              <button
                on:click={() => updateScore(player.player_id, score)}
                disabled={isLocked}
                class="h-12 rounded-xl font-bold text-lg transition-all {
                  playerScores[player.player_id]?.[currentHole] === score
                    ? getScoreColor(score) + ' shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {score}
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Navigation Controls -->
<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
  <div class="flex space-x-3">
    <button 
      on:click={() => currentHole = Math.max(1, currentHole - 1)}
      disabled={currentHole === 1}
      class="flex-1 bg-gray-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      ← Previous
    </button>
    <button 
      on:click={() => currentHole = Math.min(18, currentHole + 1)}
      disabled={currentHole === 18}
      class="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
    >
      Next →
    </button>
  </div>
  
  <!-- Swipe Hint -->
  <div class="text-center mt-2 text-xs text-gray-500">
    Swipe left/right to navigate holes
  </div>
</div>