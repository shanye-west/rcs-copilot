<script lang="ts">
import { onMount } from 'svelte';
import { supabase } from '$lib/supabase';
import Scorecard2v2BestBall from '$lib/components/Scorecard2v2BestBall.svelte';
import type { Player, Score, Course } from '$lib/utils/scoring';

let match = null;
let players: Player[] = [];
let scores: Score[] = [];
let course: Course | undefined = undefined;
let holes = Array.from({ length: 18 }, (_, i) => i + 1);
let isLoading = true;
let error: string | null = null;

onMount(async () => {
  isLoading = true;
  const id = $page.params.matchId;
  const { data: m, error: err1 } = await supabase.from('matches').select('*').eq('id', id).single();
  if (err1) error = err1.message;
  else match = m;
  // Fetch players, scores, and course as needed
  // ...
  isLoading = false;
});
</script>

<section class="mx-auto max-w-3xl p-4">
  <h1 class="mb-4 text-2xl font-bold">Admin: Match Scorecard</h1>
  {#if isLoading}
    <div>Loading...</div>
  {:else if error}
    <div class="text-red-600">{error}</div>
  {:else}
    <!-- Example: Render a scorecard for 2v2 Best Ball. Swap for other types as needed. -->
    <Scorecard2v2BestBall
      teamAPlayers={players.filter(p => p.team_id === match.team_a_id)}
      teamBPlayers={players.filter(p => p.team_id === match.team_b_id)}
      {scores}
      {holes}
      isLocked={false}
      saveScore={() => {}}
      getSyncStatus={() => 'synced'}
      {course}
    />
  {/if}
</section>
