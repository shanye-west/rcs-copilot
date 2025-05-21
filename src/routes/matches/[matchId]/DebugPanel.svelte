<script lang="ts">
	import { auth } from '$lib/stores/auth';

	// Define interfaces for type safety
	interface Player {
		player_id: string;
		team_id: string;
		player?: {
			id: string;
			username: string;
			full_name: string;
		};
		username?: string;
		full_name?: string;
		scores?: Record<number, string | number>;
	}

	interface Match {
		id: string;
		round_id: string;
		match_type_id: string;
		status: string;
		is_locked: boolean;
	}

	interface MatchType {
		id: string;
		name: string;
		description?: string;
	}

	interface DebugInfo {
		matchId?: string;
		matchPlayersReceived?: number;
		hasMatchPlayersError?: boolean;
		matchPlayersErrorMessage?: string;
		matchPlayersErrorCode?: string;
		matchPlayersErrorDetails?: string;
	}

	export let matchType: MatchType;
	export let teamAPlayers: Player[];
	export let teamBPlayers: Player[];
	export let matchPlayers: Player[];
	export let match: Match;
	export let debugInfo: DebugInfo = {};

	// Subscribe to auth store
	interface User {
		id: string;
		username: string;
		fullName: string;
		isAdmin: boolean;
	}
	
	let authState: { user: User | null; loading: boolean; error: string | null };
	auth.subscribe((state) => {
		authState = state;
	});
</script>

<section class="mb-4 rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
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

	<div>
		Current user: {authState?.user ? authState.user.id : 'not available (SSR or public view)'}
	</div>

	<div style="margin-top:0.5em;"><b>Team A Players:</b></div>
	<pre style="white-space:pre-wrap;max-width:100%;overflow-x:auto;">{JSON.stringify(
			teamAPlayers,
			null,
			2
		)}</pre>

	<div style="margin-top:0.5em;"><b>Team B Players:</b></div>
	<pre style="white-space:pre-wrap;max-width:100%;overflow-x:auto;">{JSON.stringify(
			teamBPlayers,
			null,
			2
		)}</pre>

	<div style="margin-top:0.5em;"><b>Raw matchPlayers:</b></div>
	<pre style="white-space:pre-wrap;max-width:100%;overflow-x:auto;">{JSON.stringify(
			matchPlayers,
			null,
			2
		)}</pre>
</section>
