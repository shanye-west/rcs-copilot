<script lang="ts">
  export let data;
  const { tournament, rounds, matches, matchTypes } = data;

  function getMatchesForRound(roundId: string) {
    return matches.filter((m) => m.round_id === roundId);
  }

  function getMatchTypeName(matchTypeId: string) {
    const type = matchTypes.find((t) => t.id === matchTypeId);
    return type ? type.name : matchTypeId;
  }
</script>

<section class="max-w-3xl mx-auto p-4">
  <nav class="mb-4 text-sm text-gray-500" aria-label="Breadcrumb">
    <a href="/" class="hover:underline text-blue-600">Home</a>
    <span class="mx-1">/</span>
    <span class="text-gray-700 font-semibold">Tournament</span>
  </nav>
  {#if tournament}
    <h1 class="text-3xl font-bold mb-2">{tournament.name}</h1>
    <div class="mb-6 text-gray-600">
      <span>Dates: {tournament.start_date} - {tournament.end_date}</span>
    </div>
    {#each rounds as round}
      <div class="mb-6 border rounded-lg bg-white shadow p-4">
        <div class="flex items-center mb-2">
          <h2 class="text-xl font-semibold flex-1">{round.name}</h2>
          <a href={`/rounds/${round.id}`} class="ml-2 text-blue-600 hover:text-blue-800 flex items-center" title="View Round">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            <span class="hidden sm:inline">Go to Round</span>
          </a>
        </div>
        <ul>
          {#each getMatchesForRound(round.id) as match}
            <li class="mb-2 p-2 border-b last:border-b-0 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span class="font-semibold">{match.team_a_name}</span>
                <span class="mx-2 text-gray-400">vs</span>
                <span class="font-semibold">{match.team_b_name}</span>
                <span class="ml-4 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">{match.status}</span>
              </div>
              <div class="mt-2 sm:mt-0 flex items-center gap-2">
                <span class="text-sm text-gray-500">Match Type: {getMatchTypeName(match.match_type_id)}</span>
                <a href={`/matches/${match.id}`} class="ml-2 text-green-600 hover:text-green-800 flex items-center" title="View Match">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l7-7-7-7" /></svg>
                </a>
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
