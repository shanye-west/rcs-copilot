<script lang="ts">
  import Card from './Card.svelte';
  
  export let stats = {
    totalMatches: 0,
    completedMatches: 0, 
    inProgressMatches: 0,
    scheduledMatches: 0,
    leadingTeam: '',
    leadingTeamScore: 0,
    trailingTeamScore: 0
  };
</script>

<Card class="bg-gradient-to-br from-blue-900 to-blue-800 text-white">
  <div class="p-1">
    <h2 class="text-xl font-bold mb-4">Tournament Statistics</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 class="text-lg font-semibold mb-2">Match Status</h3>
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span>Total Matches:</span>
            <span class="font-bold">{stats.totalMatches}</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Completed:</span>
            <span class="font-bold">{stats.completedMatches}</span>
          </div>
          <div class="flex justify-between items-center">
            <span>In Progress:</span>
            <span class="font-bold">{stats.inProgressMatches}</span>
          </div>
          <div class="flex justify-between items-center">
            <span>Scheduled:</span>
            <span class="font-bold">{stats.scheduledMatches}</span>
          </div>
        </div>
      </div>
      
      {#if stats.leadingTeam}
        <div>
          <h3 class="text-lg font-semibold mb-2">Leaderboard</h3>
          <div class="bg-blue-950 bg-opacity-40 p-3 rounded-md">
            <div class="mb-2">
              <span class="text-xs uppercase tracking-wide opacity-75">Leading Team</span>
              <div class="text-lg font-bold">{stats.leadingTeam}</div>
            </div>
            <div class="flex justify-between items-center">
              <div class="text-3xl font-bold">{stats.leadingTeamScore}</div>
              <div class="text-xl">-</div>
              <div class="text-3xl font-bold">{stats.trailingTeamScore}</div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</Card>
