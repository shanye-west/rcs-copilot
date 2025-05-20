<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  
  let connectionStatus = 'Testing connection...';
  
  onMount(async () => {
    try {
      const { error } = await supabase.from('_test').select('*').limit(1);
      if (error && error.message.includes('relation "_test" does not exist')) {
        connectionStatus = '✅ Supabase connected successfully!';
      } else {
        connectionStatus = '✅ Supabase connected successfully!';
      }
    } catch (err) {
      connectionStatus = '❌ Connection failed';
      console.error('Supabase connection error:', err);
    }
  });
</script>

<h1>Golf Tournament App</h1>
<p>{connectionStatus}</p>

<style>
  h1 {
    color: green;
    font-size: 2rem;
    margin-bottom: 1rem;
  }
</style>