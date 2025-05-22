<script lang="ts">
  export let variant = 'primary'; // primary, secondary, outline, danger
  export let size = 'md'; // sm, md, lg
  export let type = 'button';
  export let disabled = false;
  export let fullWidth = false;
  export let href = '';
  
  // Compute classes based on props
  $: classes = [
    // Base styles
    'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    
    // Size variants
    size === 'sm' ? 'text-sm px-3 py-1.5' : 
    size === 'lg' ? 'text-lg px-6 py-3' : 
    'px-4 py-2', // Default (md)
    
    // Color variants
    variant === 'primary' ? 'bg-blue-800 hover:bg-blue-900 text-white focus:ring-blue-500' :
    variant === 'secondary' ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500' :
    variant === 'outline' ? 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500' :
    variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' :
    'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500', // Default/text
    
    // Width
    fullWidth ? 'w-full' : '',
    
    // Disabled
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ].filter(Boolean).join(' ');
</script>

{#if href}
  <a {href} class={classes} class:disabled on:click>
    <slot />
  </a>
{:else}
  <button {type} class={classes} {disabled} on:click>
    <slot />
  </button>
{/if}
