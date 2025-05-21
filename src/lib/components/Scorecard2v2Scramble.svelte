<script lang="ts">
  import { onMount } from 'svelte';
  
  // Your props
  export let teamAPlayers = [];
  export let teamBPlayers = [];
  export let scores = [];
  export let holes = [];
  export let isLocked = false;
  export let saveScore = (playerId: string, hole: number, value: number) => {};

  // Defensive: make sure arrays are never undefined and players have scores
  $: safeTeamAPlayers = teamAPlayers || [];
  $: safeTeamBPlayers = teamBPlayers || [];
  $: safeHoles = holes || [];

  // Ensure each player has a scores object
  onMount(() => {
    // Initialize scores object for each player if it doesn't exist
    safeTeamAPlayers.forEach(player => {
      if (!player.scores) {
        player.scores = {};
        safeHoles.forEach(hole => {
          player.scores[hole] = '';
        });
      }
    });
    
    safeTeamBPlayers.forEach(player => {
      if (!player.scores) {
        player.scores = {};
        safeHoles.forEach(hole => {
          player.scores[hole] = '';
        });
      }
    });
  });

  // Make sure players exist
  $: teamAPlayer1 = safeTeamAPlayers[0] || null;
  $: teamAPlayer2 = safeTeamAPlayers[1] || null;
  $: teamBPlayer1 = safeTeamBPlayers[0] || null;
  $: teamBPlayer2 = safeTeamBPlayers[1] || null;

  // Safe score getters
  $: getTeamAScore = (hole) => {
    if (!teamAPlayer1 || !teamAPlayer1.scores) return '';
    return teamAPlayer1.scores[hole] || '';
  };
  
  $: getTeamBScore = (hole) => {
    if (!teamBPlayer1 || !teamBPlayer1.scores) return '';
    return teamBPlayer1.scores[hole] || '';
  };

  // Helper to determine which team is winning on a hole
  $: getWinningTeam = (hole) => {
    const scoreA = getTeamAScore(hole);
    const scoreB = getTeamBScore(hole);
    
    if (!scoreA || !scoreB) return null;
    
    const numA = Number(scoreA);
    const numB = Number(scoreB);
    
    if (isNaN(numA) || isNaN(numB)) return null;
    if (numA < numB) return 'A';
    if (numB < numA) return 'B';
    return 'tie';
  };

  // Handle score change
  function handleScoreChange(team, hole, e) {
    if (isLocked) return;
    
    const value = e.target.value;
    // Allow empty string or a number between 1-12
    if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 12)) {
      if (team === 'A' && teamAPlayer1) {
        // Ensure scores object exists
        if (!teamAPlayer1.scores) teamAPlayer1.scores = {};
        
        // Update the score
        teamAPlayer1.scores[hole] = value;
        
        // Save it
        if (teamAPlayer1.player_id) {
          saveScore(teamAPlayer1.player_id, hole, value === '' ? null : parseInt(value));
        }
      } else if (team === 'B' && teamBPlayer1) {
        // Ensure scores object exists
        if (!teamBPlayer1.scores) teamBPlayer1.scores = {};
        
        // Update the score
        teamBPlayer1.scores[hole] = value;
        
        // Save it  
        if (teamBPlayer1.player_id) {
          saveScore(teamBPlayer1.player_id, hole, value === '' ? null : parseInt(value));
        }
      }
    }
  }
</script>

<div class="scoreboard overflow-x-auto">
  <table class="min-w-full border-collapse">
    <thead>
      <tr>
        <th class="px-2 py-1 border sticky left-0 bg-white">Team</th>
        {#each safeHoles as hole}
          <th class="px-2 py-1 border w-12">{hole}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      <!-- Team A Row -->
      <tr class="bg-blue-50">
        <td class="px-2 py-1 border sticky left-0 bg-blue-50 font-semibold">
          Team A
          {#if teamAPlayer1}
            <div class="text-xs">
              {teamAPlayer1.username || 'Player 1'}
              {#if teamAPlayer2}
                & {teamAPlayer2.username || 'Player 2'}
              {/if}
            </div>
          {/if}
        </td>
        {#each safeHoles as hole}
          <td 
            class="px-1 py-1 border text-center"
            class:bg-green-100={getWinningTeam(hole) === 'A'}
            class:bg-yellow-100={getWinningTeam(hole) === 'tie'}
          >
            <input
              type="text"
              class="w-full text-center bg-transparent"
              value={getTeamAScore(hole)}
              disabled={isLocked}
              on:input={(e) => handleScoreChange('A', hole, e)}
            />
          </td>
        {/each}
      </tr>
      
      <!-- Team B Row -->
      <tr class="bg-green-50">
        <td class="px-2 py-1 border sticky left-0 bg-green-50 font-semibold">
          Team B
          {#if teamBPlayer1}
            <div class="text-xs">
              {teamBPlayer1.username || 'Player 1'}
              {#if teamBPlayer2}
                & {teamBPlayer2.username || 'Player 2'}
              {/if}
            </div>
          {/if}
        </td>
        {#each safeHoles as hole}
          <td 
            class="px-1 py-1 border text-center" 
            class:bg-green-100={getWinningTeam(hole) === 'B'}
            class:bg-yellow-100={getWinningTeam(hole) === 'tie'}
          >
            <input
              type="text"
              class="w-full text-center bg-transparent"
              value={getTeamBScore(hole)}
              disabled={isLocked}
              on:input={(e) => handleScoreChange('B', hole, e)}
            />
          </td>
        {/each}
      </tr>
    </tbody>
  </table>
</div>
