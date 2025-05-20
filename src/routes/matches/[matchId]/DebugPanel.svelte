<script lang="ts">
  export let matchType: any;
  export let teamAPlayers: any[];
  export let teamBPlayers: any[];
</script>

<section class="mb-4 p-2 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-800">
  <div><b>Debug info:</b></div>
  <div>matchType?.name: {matchType?.name}</div>
  <div>teamAPlayers.length: {teamAPlayers.length}</div>
  <div>teamBPlayers.length: {teamBPlayers.length}</div>
  <div>teamAPlayers: {JSON.stringify(teamAPlayers)}</div>
  <div>teamBPlayers: {JSON.stringify(teamBPlayers)}</div>
</section>
