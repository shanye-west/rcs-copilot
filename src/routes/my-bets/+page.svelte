<script lang="ts">
  // This page is protected by the load function in +page.ts
  import { auth } from '$lib/stores/auth';
</script>

<section>
  <h1 class="text-2xl font-bold mb-4">My Bets</h1>
  {#if $auth.user}
    <p>Welcome, {$auth.user.username}! Here you'll see your personal betting interface.</p>
    <!-- TODO: Add bet sections: Pending Incoming, Pending Outgoing, Active, Completed -->
  {/if}
</section>
