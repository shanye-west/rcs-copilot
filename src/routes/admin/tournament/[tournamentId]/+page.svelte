<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

let tournament: { id: string; name: string } | null = null;
let rounds: { id: string; name: string }[] = [];
let players = [];
let teams = [];
let isLoading = true;
let isLoadingPlayers = false;
let isLoadingTeams = false;
let error: string | null = null;
let newRoundName = '';
let addError: string | null = null;
let editingRoundId: string | null = null;
let editRoundName = '';
let editError: string | null = null;
let addPlayerId = '';
let addPlayerError: string | null = null;
let newTeamName = '';
let addTeamError: string | null = null;
let assignPlayerTeamError: string | null = null;

// --- MATCH MANAGEMENT ---
let matchesByRound = {};
let isLoadingMatches = false;
let newMatchName = '';
let addMatchError: string | null = null;

// --- TEAM ASSIGNMENT TO MATCHES ---
let assignTeamError: string | null = null;

onMount(async () => {
  isLoading = true;
  const id = $page.params.tournamentId;
  const { data: t, error: err1 } = await supabase.from('tournaments').select('*').eq('id', id).single();
  const { data: r, error: err2 } = await supabase.from('rounds').select('*').eq('tournament_id', id);
  if (err1) error = err1.message;
  else tournament = t;
  if (err2) error = err2.message;
  else rounds = r || [];
  await loadPlayers();
  await loadTeams();
  await loadMatches();
  isLoading = false;
});

async function loadPlayers() {
  if (!tournament) return;
  isLoadingPlayers = true;
  // Get all players in this tournament and their team assignments
  const { data: tournamentPlayers, error: err1 } = await supabase
    .from('tournament_players')
    .select('player_id, players (id, username, full_name), team_members (team_id)')
    .eq('tournament_id', tournament.id);
  if (err1) {
    addPlayerError = err1.message;
    players = [];
  } else {
    // Map team_id from team_members (may be null)
    players = (tournamentPlayers || []).map(tp => {
      const player = tp.players;
      player.team_id = tp.team_members?.[0]?.team_id || '';
      return player;
    });
    addPlayerError = null;
  }
  isLoadingPlayers = false;
}

async function loadTeams() {
  if (!tournament) return;
  isLoadingTeams = true;
  const { data: tournamentTeams, error: err1 } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_id', tournament.id);
  if (err1) {
    addTeamError = err1.message;
    teams = [];
  } else {
    teams = tournamentTeams || [];
    addTeamError = null;
  }
  isLoadingTeams = false;
}

async function loadMatches() {
  if (!tournament) return;
  isLoadingMatches = true;
  // Get all matches for rounds in this tournament
  const roundIds = rounds.map(r => r.id);
  if (roundIds.length === 0) {
    matchesByRound = {};
    isLoadingMatches = false;
    return;
  }
  const { data: matches, error: err } = await supabase
    .from('matches')
    .select('*')
    .in('round_id', roundIds);
  if (err) {
    addMatchError = err.message;
    matchesByRound = {};
  } else {
    matchesByRound = {};
    for (const r of rounds) {
      matchesByRound[r.id] = (matches || []).filter(m => m.round_id === r.id);
    }
    addMatchError = null;
  }
  isLoadingMatches = false;
}

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

async function addPlayerToTournament() {
  addPlayerError = null;
  if (!addPlayerId) {
    addPlayerError = 'Select a player to add.';
    return;
  }
  if (!tournament) return;
  // Insert into tournament_players
  const { error: err } = await supabase.from('tournament_players').insert({
    tournament_id: tournament.id,
    player_id: addPlayerId
  });
  if (err) {
    addPlayerError = err.message;
  } else {
    addPlayerId = '';
    await loadPlayers();
  }
}

async function removePlayerFromTournament(playerId: string) {
  if (!tournament) return;
  const { error: err } = await supabase.from('tournament_players')
    .delete()
    .eq('tournament_id', tournament.id)
    .eq('player_id', playerId);
  if (err) {
    addPlayerError = err.message;
  } else {
    await loadPlayers();
  }
}

async function addTeamToTournament() {
  addTeamError = null;
  if (!newTeamName.trim()) {
    addTeamError = 'Team name required.';
    return;
  }
  if (!tournament) return;
  // Insert into teams
  const { error: err } = await supabase.from('teams').insert({
    tournament_id: tournament.id,
    name: newTeamName.trim()
  });
  if (err) {
    addTeamError = err.message;
  } else {
    newTeamName = '';
    await loadTeams();
  }
}

async function removeTeamFromTournament(teamId: string) {
  if (!tournament) return;
  const { error: err } = await supabase.from('teams')
    .delete()
    .eq('tournament_id', tournament.id)
    .eq('id', teamId);
  if (err) {
    addTeamError = err.message;
  } else {
    await loadTeams();
  }
}

async function assignPlayerToTeam(playerId: string, teamId: string) {
  assignPlayerTeamError = null;
  if (!tournament) return;
  // Remove from all teams in this tournament first
  await supabase.from('team_members')
    .delete()
    .eq('player_id', playerId)
    .eq('tournament_id', tournament.id);
  // If assigning to a team (not "none"), add to team
  if (teamId) {
    const { error: err } = await supabase.from('team_members').insert({
      tournament_id: tournament.id,
      team_id: teamId,
      player_id: playerId
    });
    if (err) assignPlayerTeamError = err.message;
  }
  // Reload for immediate feedback
  await loadPlayers();
  await loadTeams();
}

// --- MATCH MANAGEMENT ---
async function addMatch(roundId: string) {
  addMatchError = null;
  if (!newMatchName.trim()) {
    addMatchError = 'Match name required.';
    return;
  }
  if (!tournament) return;
  const { error: err } = await supabase.from('matches').insert({
    round_id: roundId,
    name: newMatchName.trim()
  });
  if (err) {
    addMatchError = err.message;
  } else {
    newMatchName = '';
    await loadMatches();
  }
}

async function deleteMatch(matchId: string, roundId: string) {
  if (!tournament) return;
  if (!confirm('Delete this match?')) return;
  await supabase.from('matches').delete().eq('id', matchId);
  await loadMatches();
}

async function assignTeamsToMatch(matchId: string, teamAId: string, teamBId: string) {
  assignTeamError = null;
  if (!tournament) return;
  // Update the match with selected teams
  const { error: err } = await supabase.from('matches').update({
    team_a_id: teamAId,
    team_b_id: teamBId
  }).eq('id', matchId);
  if (err) assignTeamError = err.message;
  await loadMatches();
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

  <hr class="my-8" />
  <h2 class="mb-2 text-xl font-bold">Players in Tournament</h2>
  {#if isLoadingPlayers}
    <div>Loading players...</div>
  {:else}
    <ul class="mb-4">
      {#each players as player}
        <li class="mb-2 flex items-center gap-2">
          <span>{player.full_name} ({player.username})</span>
          <button class="text-xs text-red-600" on:click={() => removePlayerFromTournament(player.id)}>Remove</button>
        </li>
      {/each}
    </ul>
    <form class="flex gap-2 items-center mb-2" on:submit|preventDefault={addPlayerToTournament}>
      <select class="border rounded px-2 py-1" bind:value={addPlayerId}>
        <option value="">Select player...</option>
        {#await supabase.from('players').select('id, full_name, username') then allPlayers}
          {#each allPlayers.data || [] as p}
            {#if !players.find(pl => pl.id === p.id)}
              <option value={p.id}>{p.full_name} ({p.username})</option>
            {/if}
          {/each}
        {/await}
      </select>
      <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs" type="submit">Add Player</button>
    </form>
    {#if addPlayerError}
      <div class="text-red-600 mb-2">{addPlayerError}</div>
    {/if}
  {/if}

  <hr class="my-8" />
  <h2 class="mb-2 text-xl font-bold">Teams in Tournament</h2>
  {#if isLoadingTeams}
    <div>Loading teams...</div>
  {:else}
    <ul class="mb-4">
      {#each teams as team}
        <li class="mb-2 flex items-center gap-2">
          <span>{team.name}</span>
          <button class="text-xs text-red-600" on:click={() => removeTeamFromTournament(team.id)}>Remove</button>
        </li>
      {/each}
    </ul>
    <form class="flex gap-2 items-center mb-2" on:submit|preventDefault={addTeamToTournament}>
      <input class="border rounded px-2 py-1" placeholder="New team name" bind:value={newTeamName} />
      <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs" type="submit">Add Team</button>
    </form>
    {#if addTeamError}
      <div class="text-red-600 mb-2">{addTeamError}</div>
    {/if}
  {/if}

  <hr class="my-8" />
  <h2 class="mb-2 text-xl font-bold">Assign Players to Teams</h2>
  <ul class="mb-4">
    {#each players as player}
      <li class="mb-2 flex items-center gap-2">
        <span>{player.full_name} ({player.username})</span>
        <select class="border rounded px-2 py-1" bind:value={player.team_id} on:change={e => assignPlayerToTeam(player.id, e.target.value)}>
          <option value="">No Team</option>
          {#each teams as team}
            <option value={team.id}>{team.name}</option>
          {/each}
        </select>
        {#if player.team_id}
          <span class="text-xs text-gray-500">Current: {teams.find(t => t.id === player.team_id)?.name}</span>
        {/if}
      </li>
    {/each}
  </ul>
  {#if assignPlayerTeamError}
    <div class="text-red-600 mb-2">{assignPlayerTeamError}</div>
  {/if}

  <hr class="my-8" />
  <h2 class="mb-2 text-xl font-bold">Matches by Round</h2>
  {#if isLoadingMatches}
    <div>Loading matches...</div>
  {:else}
    {#each rounds as round}
      <div class="mb-6">
        <h3 class="text-lg font-semibold">{round.name}</h3>
        <form class="mb-2 flex gap-2" on:submit|preventDefault={() => addMatch(round.id)}>
          <input class="border rounded px-2 py-1" placeholder="New match name" bind:value={newMatchName} />
          <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs" type="submit">Add Match</button>
        </form>
        {#if addMatchError}
          <div class="text-red-600 mb-2">{addMatchError}</div>
        {/if}
        <ul>
          {#each matchesByRound[round.id] || [] as match}
            <li class="mb-2 flex flex-col gap-2 border-b pb-2">
              <div class="flex items-center gap-2">
                <span>{match.name}</span>
                <button class="text-xs text-red-600" on:click={() => deleteMatch(match.id, round.id)}>Delete</button>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs">Team A:</label>
                <select class="border rounded px-2 py-1" bind:value={match.team_a_id} on:change={e => assignTeamsToMatch(match.id, e.target.value, match.team_b_id)}>
                  <option value="">Select Team</option>
                  {#each teams as team}
                    <option value={team.id}>{team.name}</option>
                  {/each}
                </select>
                <label class="text-xs">Team B:</label>
                <select class="border rounded px-2 py-1" bind:value={match.team_b_id} on:change={e => assignTeamsToMatch(match.id, match.team_a_id, e.target.value)}>
                  <option value="">Select Team</option>
                  {#each teams as team}
                    <option value={team.id}>{team.name}</option>
                  {/each}
                </select>
              </div>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  {/if}
  {#if assignTeamError}
    <div class="text-red-600 mb-2">{assignTeamError}</div>
  {/if}
</section>
