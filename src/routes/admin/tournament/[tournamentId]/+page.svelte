<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

let tournament: { id: string; name: string } | null = null;
let rounds: { id: string; name: string }[] = [];
let isLoading = true;
let error: string | null = null;
let newRoundName = '';
let addError: string | null = null;
let editingRoundId: string | null = null;
let editRoundName = '';
let editError: string | null = null;

onMount(async () => {
  isLoading = true;
  const id = $page.params.tournamentId;
  const { data: t, error: err1 } = await supabase.from('tournaments').select('*').eq('id', id).single();
  const { data: r, error: err2 } = await supabase.from('rounds').select('*').eq('tournament_id', id);
  if (err1) error = err1.message;
  else tournament = t;
  if (err2) error = err2.message;
  else rounds = r || [];
  isLoading = false;
});

async function addRound() {
  addError = null;
  if (!newRoundName.trim()) {
    addError = 'Round name required.';
    return;
  }
  if (!tournament) {
    addError = 'Tournament not loaded.';
    return;
  }
  const { error: err } = await supabase.from('rounds').insert({
    tournament_id: tournament.id,
    name: newRoundName.trim()
  });
  if (err) {
    addError = err.message;
  } else {
    newRoundName = '';
    // Reload rounds
    const { data: r, error: err2 } = await supabase.from('rounds').select('*').eq('tournament_id', tournament.id);
    if (!err2) rounds = r || [];
  }
}

async function deleteRound(roundId: string) {
  if (!tournament) return;
  if (!confirm('Delete this round?')) return;
  await supabase.from('rounds').delete().eq('id', roundId);
  rounds = rounds.filter(r => r.id !== roundId);
}

async function startEditRound(round) {
  editingRoundId = round.id;
  editRoundName = round.name;
  editError = null;
}

async function cancelEditRound() {
  editingRoundId = null;
  editRoundName = '';
  editError = null;
}

async function saveEditRound() {
  if (!editRoundName.trim()) {
    editError = 'Round name required.';
    return;
  }
  if (!tournament || !editingRoundId) return;
  const { error: err } = await supabase.from('rounds').update({ name: editRoundName.trim() }).eq('id', editingRoundId);
  if (err) {
    editError = err.message;
  } else {
    // Reload rounds
    const { data: r, error: err2 } = await supabase.from('rounds').select('*').eq('tournament_id', tournament.id);
    if (!err2) rounds = r || [];
    editingRoundId = null;
    editRoundName = '';
    editError = null;
  }
}
</script>

<section class="mx-auto max-w-3xl p-4">
  <h1 class="mb-4 text-2xl font-bold">Admin: {tournament?.name || 'Tournament'} Rounds</h1>
  {#if isLoading}
    <div>Loading...</div>
  {:else if error}
    <div class="text-red-600">{error}</div>
  {:else}
    <form class="mb-4 flex gap-2" on:submit|preventDefault={addRound}>
      <input class="border rounded px-2 py-1" placeholder="New round name" bind:value={newRoundName} />
      <button class="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Add Round</button>
    </form>
    {#if addError}
      <div class="text-red-600 mb-2">{addError}</div>
    {/if}
    <ul>
      {#each rounds as round}
        <li class="mb-2 flex items-center gap-2">
          {#if editingRoundId === round.id}
            <input class="border rounded px-2 py-1" bind:value={editRoundName} />
            <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs" on:click={saveEditRound}>Save</button>
            <button class="text-xs text-gray-600" on:click={cancelEditRound}>Cancel</button>
            {#if editError}
              <span class="text-red-600 text-xs">{editError}</span>
            {/if}
          {:else}
            <a class="text-blue-700 underline" href={`/admin/round/${round.id}`}>{round.name || `Round ${round.id}`}</a>
            <button class="text-xs text-blue-600" on:click={() => startEditRound(round)}>Edit</button>
            <button class="text-xs text-red-600" on:click={() => deleteRound(round.id)}>Delete</button>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</section>
