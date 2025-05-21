<script lang="ts">
  export let matchType: any;
  export let teamAPlayers: any[];
  export let teamBPlayers: any[];
  export let matchPlayers: any[];
  export let match: any;
  export let debugInfo: any = {}; // Add debugInfo prop
  import { auth } from '$lib/stores/auth';
</script>

<section class="mb-4 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
  <div><b>Debug info:</b></div>
  <div>matchType?.name: {matchType?.name}</div>
  <div>match.id: {match?.id}</div>
  <div>teamAPlayers.length: {teamAPlayers.length}</div>
  <div>teamBPlayers.length: {teamBPlayers.length}</div>
  
  <!-- Database error info -->
  <div style="margin-top:0.5em;"><b>DB Query Info:</b></div>
  <div>Query match ID: {debugInfo?.matchId}</div>
  <div>matchPlayers received: {debugInfo?.matchPlayersReceived}</div>
  <div>Has error: {debugInfo?.hasMatchPlayersError}</div>
  {#if debugInfo?.hasMatchPlayersError}
    <div>Error message: {debugInfo?.matchPlayersErrorMessage}</div>
    <div>Error code: {debugInfo?.matchPlayersErrorCode}</div>
    <div>Error details: {debugInfo?.matchPlayersErrorDetails}</div>
  {/if}
  
  <div>Current user: {auth.user ? auth.user.id : 'not available (SSR or public view)'}</div>
  
  <div style="margin-top:0.5em;"><b>Team A Players:</b></div>
  <pre style="white-space:pre-wrap;max-width:100%;overflow-x:auto;">{JSON.stringify(teamAPlayers, null, 2)}</pre>
  
  <div style="margin-top:0.5em;"><b>Team B Players:</b></div>
  <pre style="white-space:pre-wrap;max-width:100%;overflow-x:auto;">{JSON.stringify(teamBPlayers, null, 2)}</pre>
  
  <div style="margin-top:0.5em;"><b>Raw matchPlayers:</b></div>
  <pre style="white-space:pre-wrap;max-width:100%;overflow-x:auto;">{JSON.stringify(matchPlayers, null, 2)}</pre>
</section>