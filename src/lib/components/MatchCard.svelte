<script lang="ts">
  import Badge from './Badge.svelte';
  import Button from './Button.svelte';
  
  export let match;
  export let matchTypeName = '';
  export let teamAName = '';
  export let teamBName = '';
  export let status = 'scheduled';
  export let leadingTeam = null;
  export let leadAmount = null;

  function getStatusVariant(status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'complete':
        return 'success';
      case 'in_progress':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  $: formattedStatus = status === 'complete' ? 'Completed' : 
                       status === 'in_progress' ? 'In Progress' : 
                       'Scheduled';

  $: statusVariant = getStatusVariant(status);
</script>

<div class="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div>
      <div class="flex items-center mb-2">
        <span class="font-semibold text-lg">{teamAName}</span>
        <span class="mx-2 text-gray-400">vs</span>
        <span class="font-semibold text-lg">{teamBName}</span>
      </div>
      <div class="flex flex-wrap gap-2 items-center">
        <Badge variant={statusVariant}>
          {formattedStatus}
        </Badge>
        {#if matchTypeName}
          <Badge variant="primary">
            {matchTypeName}
          </Badge>
        {/if}
      </div>
      
      {#if leadingTeam && leadAmount && status === 'in_progress'}
        <div class="mt-2 text-sm text-blue-700">
          <span class="font-medium">{leadingTeam}</span> leads by <span class="font-medium">{leadAmount}</span>
        </div>
      {/if}
    </div>
    
    <Button 
      variant="secondary" 
      size="sm" 
      href={`/matches/${match.id}`}
    >
      View Match
    </Button>
  </div>
</div>
