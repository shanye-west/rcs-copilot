<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  let username = '';
  let pin = '';
  let loading = false;
  let error = '';
  let redirectTo = '/';
  
  onMount(() => {
    // Get redirect parameter from URL
    const urlParams = new URLSearchParams($page.url.search);
    if (urlParams.has('redirect')) {
      redirectTo = urlParams.get('redirect') || '/';
    }
    
    // If already logged in, redirect
    if ($auth.user) {
      goto(redirectTo);
    }
  });
  
  async function handleLogin() {
    if (!username || !pin) {
      error = 'Username and PIN are required';
      return;
    }
    
    loading = true;
    error = '';
    
    const result = await auth.login(username, pin);
    
    if (result.success) {
      goto(redirectTo);
    } else {
      error = result.message || 'Login failed';
    }
    
    loading = false;
  }
</script>

<div class="flex items-center justify-center min-h-screen bg-gray-100">
  <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold text-center mb-6">Rowdy Cup Login</h1>
    
    {#if error}
      <div class="mb-4 p-3 bg-red-100 text-red-700 rounded">
        {error}
      </div>
    {/if}
    
    <form on:submit|preventDefault={handleLogin} class="space-y-4">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
        <input
          type="text"
          id="username"
          bind:value={username}
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter your username"
          autocomplete="username"
        />
      </div>
      
      <div>
        <label for="pin" class="block text-sm font-medium text-gray-700">PIN</label>
        <input
          type="password"
          id="pin"
          inputmode="numeric"
          bind:value={pin}
          maxlength="4"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          placeholder="Enter your 4-digit PIN"
          autocomplete="current-password"
        />
      </div>
      
      <button
        type="submit"
        class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  </div>
</div>