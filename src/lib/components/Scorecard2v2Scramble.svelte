<script lang="ts">
  export let teamAPlayers: any[]; // array of matchPlayers for team A
  export let teamBPlayers: any[]; // array of matchPlayers for team B
  export let scores: any[]; // all scores for this match
  export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
  export let isLocked: boolean = false;
  export let saveScore: (playerId: string, hole: number, value: number) => void;

  // Helper to get score for a player/hole
  function getScore(playerId, hole) {
    return scores.find(s => s.player_id === playerId && s.hole_number === hole)?.gross_score ?? '';
  }
</script>

<div class="mb-4">
  <h2 class="text-lg font-bold">2v2 Team Scramble Scorecard</h2>
  <table class="min-w-full border text-sm">
    <thead>
      <tr>
        <th class="border px-2 py-1">Hole</th>
        <th class="border px-2 py-1" colspan={teamAPlayers.length}>Team A</th>
        <th class="border px-2 py-1" colspan={teamBPlayers.length}>Team B</th>
      </tr>
      <tr>
        <th class="border px-2 py-1"></th>
        {#each teamAPlayers.slice(0,2) as p}
          <th class="border px-2 py-1">
            {#if p && p.player && p.player.username}
              {p.player.username}
            {:else if p && p.username}
              {p.username}
            {:else}
              Player {p ? p.player_id : 'Unknown'}
            {/if}
          </th>
        {/each}
        {#each teamBPlayers.slice(0,2) as p}
          <th class="border px-2 py-1">
            {#if p && p.player && p.player.username}
              {p.player.username}
            {:else if p && p.username}
              {p.username}
            {:else}
              Player {p ? p.player_id : 'Unknown'}
            {/if}
          </th>
        {/each}
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
        </tr>
      {/each}
    </tbody>
  </table>
</div>
