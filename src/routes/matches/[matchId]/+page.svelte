<script lang="ts">
  export let data;
  const { match, teams, matchType, matchPlayers, scores } = data;

  // Group players by team
  const teamAPlayers = matchPlayers.filter(mp => mp.team === 'A');
  const teamBPlayers = matchPlayers.filter(mp => mp.team === 'B');

  // Get team names/colors
  const teamA = teams.find(t => t.id === match.team_a_id);
  const teamB = teams.find(t => t.id === match.team_b_id);

  // For now, just show 18 holes
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  // Helper to get score for a player/team/hole
  function getScore(playerId, hole) {
    return scores.find(s => s.player_id === playerId && s.hole_number === hole)?.gross_score ?? '';
  }
</script>

<section class="max-w-3xl mx-auto p-4">
  <h1 class="text-2xl font-bold mb-2">{teamA?.name} vs {teamB?.name}</h1>
  <div class="mb-2 text-gray-600">Match Type: {matchType?.name}</div>
  <div class="mb-6 text-gray-500">Status: {match.status}</div>

  <div class="overflow-x-auto">
    <table class="min-w-full border text-sm">
      <thead>
        <tr>
          <th class="border px-2 py-1">Hole</th>
          {#each teamAPlayers as p}
            <th class="border px-2 py-1" style="color:{teamA?.color}">{p.player.username}</th>
          {/each}
          {#each teamBPlayers as p}
            <th class="border px-2 py-1" style="color:{teamB?.color}">{p.player.username}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each holes as hole}
          <tr>
            <td class="border px-2 py-1 font-bold">{hole}</td>
            {#each teamAPlayers as p}
              <td class="border px-2 py-1">{getScore(p.player_id, hole)}</td>
            {/each}
            {#each teamBPlayers as p}
              <td class="border px-2 py-1">{getScore(p.player_id, hole)}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
