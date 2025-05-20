<script lang="ts">
  import { supabase } from '$lib/supabase';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { auth } from '$lib/stores/auth';
  import Scorecard1v1 from '$lib/components/Scorecard1v1.svelte';
  import Scorecard2v2Scramble from '$lib/components/Scorecard2v2Scramble.svelte';
  import Scorecard2v2BestBall from '$lib/components/Scorecard2v2BestBall.svelte';
  import DebugPanel from './DebugPanel.svelte';

  export let data;
  const { match, teams, matchType, matchPlayers, scores } = data;

  // Defensive: handle null/undefined data
  const safeMatchPlayers = matchPlayers || [];
  const safeTeams = teams || [];
  const safeScores = scores || [];

  // Group players by team for display (using team UUIDs)
  const teamAPlayers = safeMatchPlayers.filter(mp => mp.team_id === match?.team_a_id);
  const teamBPlayers = safeMatchPlayers.filter(mp => mp.team_id === match?.team_b_id);

  // Get team objects for color/name
  const teamA = safeTeams.find(t => t.id === match?.team_a_id);
  const teamB = safeTeams.find(t => t.id === match?.team_b_id);

  // For now, just show 18 holes
  const holes = Array.from({ length: 18 }, (_, i) => i + 1);

  // Helper to get score for a player/team/hole
  function getScore(playerId: string, hole: number) {
    return safeScores.find(s => s.player_id === playerId && s.hole_number === hole)?.gross_score ?? '';
  }

  // Helper to check if match is locked
  const isLocked = match?.is_locked;

  // Initialize local score state for each player
  onMount(() => {
    for (const p of safeMatchPlayers) {
      p.scores = {};
      for (const hole of holes) {
        p.scores[hole] = getScore(p.player_id, hole);
      }
    }
  });

  // Save score to Supabase
  async function saveScore(playerId: string, hole: number, value: number) {
    if (!auth.user) return;
    // Upsert score for this player/hole/match
    const { error } = await supabase.from('scores').upsert([
      {
        match_id: match.id,
        player_id: playerId,
        team: teamAPlayers.find(p => p.player_id === playerId) ? 'A' : 'B',
        hole_number: hole,
        gross_score: value ? parseInt(value as any) : null
      }
    ], { onConflict: 'match_id,player_id,hole_number' });
    if (error) {
      alert('Error saving score: ' + error.message);
    }
  }

  // Helper to determine if this is a 1v1 match
  const is1v1 = matchType?.name === '1v1 Individual Match' && teamAPlayers.length === 1 && teamBPlayers.length === 1;

  // Helper to determine if this is a 2v2 Team Scramble match
  const is2v2Scramble = matchType?.name === '2v2 Team Scramble' && teamAPlayers.length === 2 && teamBPlayers.length === 2;

  // Helper to determine if this is a 2v2 Team Best Ball match
  const is2v2BestBall = matchType?.name === '2v2 Team Best Ball' && teamAPlayers.length === 2 && teamBPlayers.length === 2;
</script>

<section class="max-w-3xl mx-auto p-4">
  <DebugPanel {matchType} {teamAPlayers} {teamBPlayers} />
  <h1 class="text-2xl font-bold mb-2">{teamA?.name} vs {teamB?.name}</h1>
  <div class="mb-2 text-gray-600">Match Type: {matchType?.name}</div>
  <div class="mb-6 text-gray-500">Status: {match.status}</div>

  {#if is1v1}
    <Scorecard1v1
      players={[teamAPlayers[0], teamBPlayers[0]]}
      scores={scores}
      holes={Array.from({ length: 18 }, (_, i) => i + 1)}
      isLocked={isLocked}
      saveScore={saveScore}
    />
  {:else if is2v2Scramble}
    <Scorecard2v2Scramble
      teamAPlayers={teamAPlayers}
      teamBPlayers={teamBPlayers}
      scores={scores}
      holes={Array.from({ length: 18 }, (_, i) => i + 1)}
      isLocked={isLocked}
      saveScore={saveScore}
    />
  {:else if is2v2BestBall}
    <Scorecard2v2BestBall
      teamAPlayers={teamAPlayers}
      teamBPlayers={teamBPlayers}
      scores={scores}
      holes={Array.from({ length: 18 }, (_, i) => i + 1)}
      isLocked={isLocked}
      saveScore={saveScore}
    />
  {:else}
    <div class="text-gray-500">This match type is not yet implemented.</div>
  {/if}
</section>
