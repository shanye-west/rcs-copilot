<script lang="ts">
  export let teamAPlayers: any[];
  export let teamBPlayers: any[];
  export let scores: any[];
  export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
  export let isLocked: boolean = false;
  export let saveScore: (playerId: string, hole: number, value: number) => void;

  // Helper to get score for a player/hole
  function getScore(playerId, hole) {
    return scores.find(s => s.player_id === playerId && s.hole_number === hole)?.net_score ?? '';
  }

  // Helper to get handicap dots for a player/hole (stub, to be implemented)
  function getDots(player) {
    // TODO: Implement real handicap dot logic
    return '';
  }

  // For each hole, get the best net score for each team
  function getBestNetScore(players, hole) {
    const netScores = players.map(p => getScore(p.player.id, hole)).filter(Boolean);
    if (netScores.length === 0) return '';
    return Math.min(...netScores);
  }
</script>

<div class="mb-4">
  <h2 class="text-lg font-bold">2v2 Team Best Ball Scorecard</h2>
  <table class="min-w-full border text-sm">
    <thead>
      <tr>
        <th class="border px-2 py-1">Hole</th>
        {#each teamAPlayers as p}
          <th class="border px-2 py-1">{p.player.username} <span class="text-xs text-gray-400">{getDots(p.player)}</span></th>
        {/each}
        <th class="border px-2 py-1 bg-blue-50">Best Ball (A)</th>
        {#each teamBPlayers as p}
          <th class="border px-2 py-1">{p.player.username} <span class="text-xs text-gray-400">{getDots(p.player)}</span></th>
        {/each}
        <th class="border px-2 py-1 bg-red-50">Best Ball (B)</th>
      </tr>
    </thead>
    <tbody>
      {#each holes as hole}
        <tr>
          <td class="border px-2 py-1 font-bold">{hole}</td>
          {#each teamAPlayers as p}
            <td class="border px-2 py-1">
              {#if !isLocked}
                <input type="number" min="1" max="20" class="w-12 p-1 border rounded text-center" bind:value={p.scores[hole]}
                  on:change={() => saveScore(p.player.id, hole, p.scores[hole])} />
              {:else}
                {getScore(p.player.id, hole)}
              {/if}
            </td>
          {/each}
          <td class="border px-2 py-1 bg-blue-50 font-bold">{getBestNetScore(teamAPlayers, hole)}</td>
          {#each teamBPlayers as p}
            <td class="border px-2 py-1">
              {#if !isLocked}
                <input type="number" min="1" max="20" class="w-12 p-1 border rounded text-center" bind:value={p.scores[hole]}
                  on:change={() => saveScore(p.player.id, hole, p.scores[hole])} />
              {:else}
                {getScore(p.player.id, hole)}
              {/if}
            </td>
          {/each}
          <td class="border px-2 py-1 bg-red-50 font-bold">{getBestNetScore(teamBPlayers, hole)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
