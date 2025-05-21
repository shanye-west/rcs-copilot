<script lang="ts">
  export let teamAPlayers: any[];
  export let teamBPlayers: any[];
  export let scores: any[];
  export let holes: number[] = Array.from({ length: 18 }, (_, i) => i + 1);
  export let isLocked: boolean = false;
  export let saveScore: (playerId: string, hole: number, value: number) => void;

  // Helper to get score for a player/hole
  function getScore(playerId: string, hole: number): number | string {
    return scores.find(s => s.player_id === playerId && s.hole_number === hole)?.net_score ?? '';
  }

  // Helper to get handicap dots for a player/hole
  function getDots(player: any, hole: number): string {
    // Assumptions:
    // - player.handicap: integer, total course handicap for 18 holes
    // - player.handicap_strokes: optional array of 18 numbers (1 if gets stroke on hole, 0 otherwise)
    // - holes: array of 1-18
    // - player.hole_stroke_indexes: optional array of 18 numbers (stroke index for each hole, 1=hardest)

    // If player.handicap_strokes exists, use it
    if (player.handicap_strokes && player.handicap_strokes.length === 18) {
      return player.handicap_strokes[hole - 1] > 0 ? '•'.repeat(player.handicap_strokes[hole - 1]) : '';
    }

    // Otherwise, calculate dots based on handicap and stroke index
    const handicap = player.handicap || 0;
    if (handicap === 0) return '';

    // If player.hole_stroke_indexes exists, use it, else assume holes are ordered by difficulty
    let strokeIndexes = player.hole_stroke_indexes && player.hole_stroke_indexes.length === 18
      ? player.hole_stroke_indexes
      : Array.from({ length: 18 }, (_, i) => i + 1); // 1-18

    // Find the stroke index for this hole
    const thisHoleStrokeIndex = strokeIndexes[hole - 1];

    // Calculate how many strokes (dots) this player gets on this hole
    let dots = 0;
    if (handicap >= 18) {
      dots = 1;
      if (handicap - 18 >= 18 - thisHoleStrokeIndex + 1) {
        dots = 2;
      } else if (handicap - 18 > 0 && thisHoleStrokeIndex <= (handicap - 18)) {
        dots = 2;
      }
    } else if (handicap > 0 && thisHoleStrokeIndex <= handicap) {
      dots = 1;
    }
    return dots > 0 ? '•'.repeat(dots) : '';
  }

  // For each hole, get the best net score for each team
  function getBestNetScore(players: any[], hole: number): number | string {
    const netScores = players
      .filter((p: any) => p && p.player && p.player.id)
      .map((p: any) => getScore(p.player.id, hole))
      .filter(Boolean);
    if (netScores.length === 0) return '';
    
    // Filter out any string values and convert all to numbers
    const numericScores = netScores
      .filter(score => typeof score === 'number')
      .map(score => Number(score));
    
    if (numericScores.length === 0) return '';
    return Math.min(...numericScores);
  }
</script>

<div class="mb-4">
  <h2 class="text-lg font-bold">2v2 Team Best Ball Scorecard</h2>
  <table class="min-w-full border text-sm">
    <thead>
      <tr>
        <th class="border px-2 py-1">Hole</th>
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
        <th class="border px-2 py-1 bg-blue-50">Best Ball (A)</th>
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
        <th class="border px-2 py-1 bg-red-50">Best Ball (B)</th>
      </tr>
      <tr>
        <th class="border px-2 py-1 text-xs text-gray-400">Dots</th>
        {#each teamAPlayers.slice(0,2) as p}
          {#each holes as hole}
            {#if hole === 1}
              <th class="border px-2 py-1 text-xs text-gray-400" colspan={holes.length}>
                {#if p && p.player}
                  {holes.map(h => getDots(p.player, h)).join(' ')}
                {:else}
                  -
                {/if}
              </th>
            {/if}
          {/each}
        {/each}
        <th class="border px-2 py-1"></th>
        {#each teamBPlayers as p}
          {#each holes as hole}
            {#if hole === 1}
              <th class="border px-2 py-1 text-xs text-gray-400" colspan={holes.length}>{holes.map(h => getDots(p.player, h)).join(' ')}</th>
            {/if}
          {/each}
        {/each}
        <th class="border px-2 py-1"></th>
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
              <div class="text-xs text-gray-400">{getDots(p.player, hole)}</div>
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
              <div class="text-xs text-gray-400">{getDots(p.player, hole)}</div>
            </td>
          {/each}
          <td class="border px-2 py-1 bg-red-50 font-bold">{getBestNetScore(teamBPlayers, hole)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
