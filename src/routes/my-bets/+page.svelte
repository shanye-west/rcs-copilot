<script lang="ts">
	// This page is protected by the load function in +page.ts
	import { auth } from '$lib/stores/auth';
</script>

<section>
	<h1 class="mb-4 text-2xl font-bold">My Bets</h1>
	{#if $auth.user}
		<p>Welcome, {$auth.user.username}! Here you'll see your personal betting interface.</p>
		<!-- TODO: Add bet sections: Pending Incoming, Pending Outgoing, Active, Completed -->
	{/if}
</section>
