<script lang="ts">
  export let players: any[]; // [playerA, playerB]
  export let scores: any[]; // all scores for this match
  export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
  export let isLocked: boolean = false;
  export let saveScore: (playerId: string, hole: number, value: number) => void;

  // Helper to get score for a player/hole
  function getScore(playerId, hole) {
    return scores.find(s => s.player_id === playerId && s.hole_number === hole)?.net_score ?? '';
  }

  // Calculate match-play status (AS, 1up, etc.)
  function getMatchStatus() {
    let aUp = 0, bUp = 0;
    for (let hole of holes) {
      const a = getScore(players[0].player.id, hole);
      const b = getScore(players[1].player.id, hole);
      if (!a || !b) continue;
      if (a < b) aUp++;
      else if (b < a) bUp++;
    }
    if (aUp === bUp) return 'AS';
    if (aUp > bUp) return `${aUp - bUp}↑`;
    return `${bUp - aUp}↓`;
  }
</script>

<div class="mb-4">
  <h2 class="text-lg font-bold">1v1 Individual Match Scorecard</h2>
  <div class="mb-2 text-gray-600">Status: {getMatchStatus()}</div>
  <table class="min-w-full border text-sm">
    <thead>
      <tr>
        <th class="border px-2 py-1">Hole</th>
        <th class="border px-2 py-1">{players[0].player.username}</th>
        <th class="border px-2 py-1">{players[1].player.username}</th>
      </tr>
    </thead>
    <tbody>
      {#each holes as hole}
        <tr>
          <td class="border px-2 py-1 font-bold">{hole}</td>
          {#each players as p}
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
