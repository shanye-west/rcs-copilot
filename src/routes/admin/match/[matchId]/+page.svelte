<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { page } from '$app/stores';
  import Scorecard1v1 from '$lib/components/Scorecard1v1.svelte';
  import Scorecard2v2BestBall from '$lib/components/Scorecard2v2BestBall.svelte';
  import Scorecard2v2Scramble from '$lib/components/Scorecard2v2Scramble.svelte';
  import Scorecard2v2Shamble from '$lib/components/Scorecard2v2Shamble.svelte';
  import Scorecard4v4TeamScramble from '$lib/components/Scorecard4v4TeamScramble.svelte';
  import type { Player, Score, Course } from '$lib/utils/scoring';
  
  export let data;
  
  let match = data?.match || null;
  let matchType = data?.matchType || { name: 'Unknown' };
  let matchPlayers = data?.matchPlayers || [];
  let scores = data?.scores || [];
  let course = data?.course;
  let error = data?.error;
  let holes = Array.from({ length: 18 }, (_, i) => i + 1);
  
  // Save score for admin (simplified version)
  async function saveScore(playerId: string, hole: number, value: number | null) {
    // If the value is null, there's nothing to save
    if (value === null || !match) return;
    
    try {
      const upsertPayload = {
        match_id: match.id,
        player_id: playerId,
        hole_number: hole,
        gross_score: value,
        updated_by: 'admin',
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('match_scores').upsert(upsertPayload);
      if (error) throw error;
      
      // Update the local scores
      const existingScoreIndex = scores.findIndex(
        s => s.player_id === playerId && s.hole_number === hole
      );
      
      if (existingScoreIndex >= 0) {
        scores[existingScoreIndex].gross_score = value;
      } else {
        scores = [
          ...scores,
          {
            player_id: playerId,
            hole_number: hole,
            gross_score: value
          }
        ];
      }
    } catch (err) {
      console.error('Error saving score:', err);
      alert('Failed to save score: ' + (err.message || 'Unknown error'));
    }
  }
  
  // No need for sync status in admin view
  function getSyncStatus() {
    return 'synced';
  }
  
  // Helpers to determine match types
  $: is1v1 = matchType?.name === '1v1 Individual Match';
  $: is2v2Scramble = matchType?.name === '2v2 Team Scramble';
  $: is2v2BestBall = matchType?.name === '2v2 Team Best Ball';
  $: is2v2Shamble = matchType?.name === '2v2 Team Shamble';
  $: is4v4TeamScramble = matchType?.name === '4v4 Team Scramble';
  
  // Get players for each team
  $: uniqueTeamIds = [...new Set(matchPlayers.map(mp => mp.team_id))];
  $: teamAId = uniqueTeamIds[0];
  $: teamBId = uniqueTeamIds[1];
  $: teamAPlayers = matchPlayers.filter(mp => mp.team_id === teamAId);
  $: teamBPlayers = matchPlayers.filter(mp => mp.team_id === teamBId);
</script>

<section class="mx-auto max-w-3xl p-4">
  <h1 class="mb-4 text-2xl font-bold">Admin: Match Scorecard</h1>
  
  {#if error}
    <div class="text-red-600 mb-4">{error}</div>
  {:else if !match}
    <div>Loading match data...</div>
  {:else}
    <div class="mb-4">
      <h2 class="text-xl">Match: {match.name || `Match ${match.id}`}</h2>
      <p class="text-gray-600">Type: {matchType.name}</p>
      <p class="text-gray-500 text-sm">Course: {course?.name || 'Not specified'}</p>
    </div>
    
    {#if is1v1}
      <Scorecard1v1
        players={[teamAPlayers[0], teamBPlayers[0]]}
        {scores}
        {holes}
        isLocked={false}
        {saveScore}
        {getSyncStatus}
        {course}
      />
    {:else if is2v2Scramble}
      <Scorecard2v2Scramble
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        scores={scores}
        holes={holes}
        isLocked={false}
        saveScore={saveScore}
        getSyncStatus={getSyncStatus}
        course={course}
      />
    {:else if is2v2BestBall}
      <Scorecard2v2BestBall
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        scores={scores}
        holes={holes}
        isLocked={false}
        saveScore={saveScore}
        getSyncStatus={getSyncStatus}
        course={course}
      />
    {:else if is2v2Shamble}
      <Scorecard2v2Shamble
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        scores={scores}
        holes={holes}
        isLocked={false}
        saveScore={saveScore}
        getSyncStatus={getSyncStatus}
        course={course}
      />
    {:else if is4v4TeamScramble}
      <Scorecard4v4TeamScramble
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        scores={scores}
        holes={holes}
        isLocked={false}
        saveScore={saveScore}
        getSyncStatus={getSyncStatus}
        course={course}
      />
    {:else}
      <div class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <h3 class="font-bold">Match Type Not Implemented</h3>
        <p>This match type ({matchType?.name || 'Unknown'}) is not yet fully implemented.</p>
      </div>
    {/if}
    
    <div class="mt-4">
      <a href={`/admin/round/${match.round_id}`} class="text-blue-600 hover:underline">
        &larr; Back to Round
      </a>
    </div>
  {/if}
</section>
