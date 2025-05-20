<script lang="ts">
  export let data;
  const { tournament, rounds, matches } = data;

  function getMatchesForRound(roundId: string) {
    return matches.filter((m) => m.round_id === roundId);
  }
</script>

<section class="max-w-3xl mx-auto p-4">
  {#if tournament}
    <h1 class="text-3xl font-bold mb-2">{tournament.name}</h1>
    <div class="mb-6 text-gray-600">
      <span>Dates: {tournament.start_date} - {tournament.end_date}</span>
    </div>
    {#each rounds as round}
      <div class="mb-6 border rounded-lg bg-white shadow p-4">
        <h2 class="text-xl font-semibold mb-2">{round.name}</h2>
        <ul>
          {#each getMatchesForRound(round.id) as match}
            <li class="mb-2 p-2 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span class="font-semibold">{match.team_a_name}</span>
                <span class="mx-2 text-gray-400">vs</span>
                <span class="font-semibold">{match.team_b_name}</span>
                <span class="ml-4 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{match.status}</span>
              </div>
              <div class="mt-2 sm:mt-0">
                <span class="text-sm text-gray-500">Match Type: {match.match_type_id}</span>
                <!-- TODO: Replace match_type_id with match type name via join/lookup -->
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  {:else}
    <div class="text-center text-gray-500 py-12">
      <p>No active tournament found.</p>
    </div>
  {/if}
</section>
