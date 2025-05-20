<script lang="ts">
  import { supabase } from '$lib/supabase';
  
  let username = '';
  let fullName = '';
  let pin = '';
  let isAdmin = false;
  let loading = false;
  let error = '';
  let success = '';
  
  async function createUser() {
    if (!username || !fullName || !pin) {
      error = 'All fields are required';
      return;
    }
    
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      error = 'PIN must be 4 digits';
      return;
    }
    
    loading = true;
    error = '';
    success = '';
    
    try {
      // Convert username to email format for Supabase auth
      const email = `${username}@rowdycup.app`;
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: pin,
        email_confirm: true
      });
      
      if (authError) throw authError;
      
      // Create player record
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: authData.user.id,
          username,
          full_name: fullName,
          is_admin: isAdmin
        });
      
      if (playerError) throw playerError;
      
      success = `User ${username} created successfully`;
      username = '';
      fullName = '';
      pin = '';
      isAdmin = false;
    } catch (err: any) {
      error = err.message || 'Failed to create user';
    } finally {
      loading = false;
    }
  }
</script>

<div class="bg-white shadow overflow-hidden sm:rounded-lg">
  <div class="px-4 py-5 sm:px-6">
    <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
    <p class="mt-1 max-w-2xl text-sm text-gray-500">
      Manage users and settings
    </p>
  </div>
  
  <div class="border-t border-gray-200">
    <div class="px-4 py-5 sm:p-6">
      <h2 class="text-lg font-medium text-gray-900">Create New User</h2>
      
      {#if error}
        <div class="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      {/if}
      
      {#if success}
        <div class="mt-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      {/if}
      
      <form on:submit|preventDefault={createUser} class="mt-5 space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            id="username"
            bind:value={username}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter username"
          />
        </div>
        
        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="fullName"
            bind:value={fullName}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter full name"
          />
        </div>
        
        <div>
          <label for="pin" class="block text-sm font-medium text-gray-700">4-Digit PIN</label>
          <input
            type="password"
            id="pin"
            inputmode="numeric"
            bind:value={pin}
            maxlength="4"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter 4-digit PIN"
          />
        </div>
        
        <div class="flex items-center">
          <input
            type="checkbox"
            id="isAdmin"
            bind:checked={isAdmin}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="isAdmin" class="ml-2 block text-sm text-gray-900">
            Is Administrator
          </label>
        </div>
        
        <button
          type="submit"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </div>
  </div>
</div>