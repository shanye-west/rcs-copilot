<script lang="ts">
  export let type = 'text';
  export let label = '';
  export let value = '';
  export let placeholder = '';
  export let name = '';
  export let id = '';
  export let disabled = false;
  export let required = false;
  export let error = '';
  export let min = '';
  export let max = '';
  export let pattern = '';
</script>

<div class="mb-4">
  {#if label}
    <label for={id || name} class="mb-1 block text-sm font-medium text-blue-900">{label}</label>
  {/if}
  
  <input
    {type}
    {name}
    {id}
    {placeholder}
    {disabled}
    {required}
    {pattern}
    {min}
    {max}
    bind:value
    class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 {error ? 'border-red-500' : ''}"
  />
  
  {#if error}
    <p class="mt-1 text-sm text-red-600">{error}</p>
  {/if}
</div>
