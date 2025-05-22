<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';
import { page } from '$app/stores';

let round = null;
let matches = [];
let isLoading = true;
let error: string | null = null;
let newMatchName = '';
let addMatchError: string | null = null;
let editingMatchId: string | null = null;
let editMatchName = '';
let editMatchError: string | null = null;

onMount(async () => {
  isLoading = true;
  const id = $page.params.roundId;
  const { data: r, error: err1 } = await supabase.from('rounds').select('*').eq('id', id).single();
  const { data: m, error: err2 } = await supabase.from('matches').select('*').eq('round_id', id);
  if (err1) error = err1.message;
  else round = r;
  if (err2) error = err2.message;
  else matches = m || [];
  isLoading = false;
});

async function addMatch() {
  addMatchError = null;
  if (!newMatchName.trim()) {
    addMatchError = 'Match name required.';
    return;
  }
  if (!round) {
    addMatchError = 'Round not loaded.';
    return;
  }
  const { error: err } = await supabase.from('matches').insert({
    round_id: round.id,
    name: newMatchName.trim()
  });
  if (err) {
    addMatchError = err.message;
  } else {
    newMatchName = '';
    // Reload matches
    const { data: m, error: err2 } = await supabase.from('matches').select('*').eq('round_id', round.id);
    if (!err2) matches = m || [];
  }
}

async function deleteMatch(matchId: string) {
  if (!confirm('Delete this match?')) return;
  if (!round) return;
  await supabase.from('matches').delete().eq('id', matchId);
  matches = matches.filter(m => m.id !== matchId);
}

function startEditMatch(match) {
  editingMatchId = match.id;
  editMatchName = match.name;
  editMatchError = null;
}

function cancelEditMatch() {
  editingMatchId = null;
  editMatchName = '';
  editMatchError = null;
}

async function saveEditMatch() {
  if (!editMatchName.trim()) {
    editMatchError = 'Match name required.';
    return;
  }
  if (!round || !editingMatchId) return;
  const { error: err } = await supabase.from('matches').update({ name: editMatchName.trim() }).eq('id', editingMatchId);
  if (err) {
    editMatchError = err.message;
  } else {
    // Reload matches
    const { data: m, error: err2 } = await supabase.from('matches').select('*').eq('round_id', round.id);
    if (!err2) matches = m || [];
    editingMatchId = null;
    editMatchName = '';
    editMatchError = null;
  }
}
</script>

<section class="mx-auto max-w-3xl p-4">
  <h1 class="mb-4 text-2xl font-bold">Admin: {round?.name || 'Round'} Matches</h1>
  {#if isLoading}
    <div>Loading...</div>
  {:else if error}
    <div class="text-red-600">{error}</div>
  {:else}
    <form class="mb-4 flex gap-2" on:submit|preventDefault={addMatch}>
      <input class="border rounded px-2 py-1" placeholder="New match name" bind:value={newMatchName} />
      <button class="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Add Match</button>
    </form>
    {#if addMatchError}
      <div class="text-red-600 mb-2">{addMatchError}</div>
    {/if}
    <ul>
      {#each matches as match}
        <li class="mb-2 flex items-center gap-2">
          {#if editingMatchId === match.id}
            <input class="border rounded px-2 py-1" bind:value={editMatchName} />
            <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs" on:click={saveEditMatch}>Save</button>
            <button class="text-xs text-gray-600" on:click={cancelEditMatch}>Cancel</button>
            {#if editMatchError}
              <span class="text-red-600 text-xs">{editMatchError}</span>
            {/if}
          {:else}
            <a class="text-blue-700 underline" href={`/admin/match/${match.id}`}>{match.name || `Match ${match.id}`}</a>
            <button class="text-xs text-blue-600" on:click={() => startEditMatch(match)}>Edit</button>
            <button class="text-xs text-red-600" on:click={() => deleteMatch(match.id)}>Delete</button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
