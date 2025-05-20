<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  export let data;
  const { round, matches, matchTypes, tournament } = data;

  function getMatchTypeName(matchTypeId: string) {
    const type = matchTypes.find((t) => t.id === matchTypeId);
    return type ? type.name : matchTypeId;
  }
</script>

<section class="max-w-3xl mx-auto p-4">
  {#if round && tournament}
    <div class="mb-2 text-sm text-gray-500">
      <a href="/" class="hover:underline text-blue-600">{tournament.name}</a> &rarr; {round.name}
    </div>
    <h1 class="text-2xl font-bold mb-2">{round.name}</h1>
    <div class="mb-6 text-gray-600">
      <span>Round Date: {round.date || 'TBD'}</span>
    </div>
    <ul>
      {#each matches as match}
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
  {:else}
    <div class="text-center text-gray-500 py-12">
      <p>Round not found.</p>
    </div>
  {/if}
</section>
