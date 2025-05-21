<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { 
		betsStore, 
		pendingIncomingBets, 
		pendingOutgoingBets, 
		activeBets, 
		completedBets,
		betStats,
		BetStatus,
		ResolutionType
	} from '$lib/stores/bets';
	import { supabase } from '$lib/supabase';
	
	// State for new bet form
	let newBetAmount = 0;
	let newBetDescription = '';
	let newBetOpponentId = '';
	let newBetResolutionType = ResolutionType.CUSTOM;
	let newBetMatchId = '';
	let newBetRoundId = '';
	let newBetTournamentId = '';
	
	// Available players for opponent selection
	let availablePlayers = [];
	let availableMatches = [];
	let availableRounds = [];
	let availableTournaments = [];
	
	// UI states
	let isCreatingBet = false;
	let formError = '';
	let activeTab = 'pending-incoming';
	
	// Format currency
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
	}
	
	// Handle creating a new bet
	async function handleSubmitNewBet() {
		if (!$auth.user) return;
		
		formError = '';
		
		// Validate form
		if (newBetAmount <= 0) {
			formError = 'Bet amount must be greater than 0';
			return;
		}
		
		if (!newBetDescription) {
			formError = 'Please provide a description for your bet';
			return;
		}
		
		if (!newBetOpponentId) {
			formError = 'Please select an opponent';
			return;
		}
		
		// Create bet object based on resolution type
		const betData = {
			creator_id: $auth.user.id,
			opponent_id: newBetOpponentId,
			amount: newBetAmount,
			description: newBetDescription,
			resolution_type: newBetResolutionType,
			match_id: newBetResolutionType === ResolutionType.MATCH ? newBetMatchId : null,
			round_id: newBetResolutionType === ResolutionType.ROUND ? newBetRoundId : null,
			tournament_id: newBetResolutionType === ResolutionType.TOURNAMENT ? newBetTournamentId : null,
		};
		
		// Submit the bet
		const result = await betsStore.createBet(betData);
		
		if (result.success) {
			// Reset form
			newBetAmount = 0;
			newBetDescription = '';
			newBetResolutionType = ResolutionType.CUSTOM;
			isCreatingBet = false;
		} else {
			formError = result.error || 'Error creating bet';
		}
	}
	
	// Handle accepting a bet
	async function acceptBet(betId: string) {
		await betsStore.updateBetStatus(betId, BetStatus.ACCEPTED);
	}
	
	// Handle declining a bet
	async function declineBet(betId: string) {
		await betsStore.updateBetStatus(betId, BetStatus.DECLINED);
	}
	
	// Handle marking a bet as completed (with winner)
	async function completeBet(betId: string, winnerId: string) {
		await betsStore.updateBetStatus(betId, BetStatus.COMPLETED, winnerId);
	}
	
	// Handle marking a bet as paid
	async function markAsPaid(betId: string) {
		await betsStore.markAsPaid(betId);
	}
	
	// Fetch players for opponent selection
	async function fetchPlayers() {
		try {
			const { data, error } = await supabase
				.from('players')
				.select('id, username, full_name')
				.neq('id', $auth.user?.id || '');
				
			if (error) throw error;
			availablePlayers = data;
		} catch (error) {
			console.error('Error fetching players:', error);
		}
	}
	
	// Fetch matches, rounds, and tournaments
	async function fetchReferenceData() {
		try {
			// Fetch matches
			const { data: matchData } = await supabase
				.from('matches')
				.select('id, match_type_id, status')
				.eq('status', 'active');
			availableMatches = matchData || [];
			
			// Fetch rounds
			const { data: roundData } = await supabase
				.from('rounds')
				.select('id, name, status')
				.eq('status', 'active');
			availableRounds = roundData || [];
			
			// Fetch tournaments
			const { data: tournamentData } = await supabase
				.from('tournaments')
				.select('id, name, status')
				.eq('status', 'active');
			availableTournaments = tournamentData || [];
		} catch (error) {
			console.error('Error fetching reference data:', error);
		}
	}
	
	// Load data on mount
	onMount(() => {
		if ($auth.user) {
			betsStore.fetchUserBets($auth.user.id);
			fetchPlayers();
			fetchReferenceData();
			const unsubscribe = betsStore.subscribeToUpdates();
			return unsubscribe;
		}
	});
	
	// Cleanup on destroy
	onDestroy(() => {
		betsStore.cleanup();
	});
</script>

<section class="mx-auto max-w-4xl p-4">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">My Bets</h1>
			{#if $auth.user}
				<p class="text-gray-600">Welcome, {$auth.user.username}!</p>
			{/if}
		</div>
		
		<div>
			<button 
				class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
				on:click={() => isCreatingBet = !isCreatingBet}
			>
				{isCreatingBet ? 'Cancel' : '+ Create New Bet'}
			</button>
		</div>
	</div>
	
	<!-- Betting stats summary -->
	<div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-lg border bg-white p-4 shadow">
			<h3 class="text-sm font-medium text-gray-500">Net Winnings</h3>
			<p class={`text-2xl font-bold ${$betStats.winnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
				{formatCurrency($betStats.winnings)}
			</p>
		</div>
		
		<div class="rounded-lg border bg-white p-4 shadow">
			<h3 class="text-sm font-medium text-gray-500">Active Bets</h3>
			<p class="text-2xl font-bold">{$activeBets.length} <span class="text-sm font-normal text-gray-500">bets</span></p>
		</div>
		
		<div class="rounded-lg border bg-white p-4 shadow">
			<h3 class="text-sm font-medium text-gray-500">At Stake</h3>
			<p class="text-2xl font-bold text-amber-600">{formatCurrency($betStats.pendingAmount)}</p>
		</div>
	</div>
	
	<!-- New bet form -->
	{#if isCreatingBet}
		<div class="mb-6 rounded-lg border bg-white p-4 shadow">
			<h2 class="mb-4 text-lg font-semibold">Create New Bet</h2>
			
			{#if formError}
				<div class="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
					{formError}
				</div>
			{/if}
			
			<form on:submit|preventDefault={handleSubmitNewBet}>
				<div class="mb-4 grid gap-4 sm:grid-cols-2">
					<div>
						<label for="bet-amount" class="mb-1 block text-sm font-medium">Amount</label>
						<div class="relative">
							<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
							<input 
								id="bet-amount"
								type="number" 
								min="1"
								step="1"
								bind:value={newBetAmount}
								class="w-full rounded-md border pl-7 py-2"
								placeholder="Amount"
								required
							/>
						</div>
					</div>
					
					<div>
						<label for="bet-opponent" class="mb-1 block text-sm font-medium">Opponent</label>
						<select 
							id="bet-opponent"
							bind:value={newBetOpponentId}
							class="w-full rounded-md border py-2"
							required
						>
							<option value="">Select an opponent</option>
							{#each availablePlayers as player}
								<option value={player.id}>{player.username}</option>
							{/each}
						</select>
					</div>
				</div>
				
				<div class="mb-4">
					<label for="bet-description" class="mb-1 block text-sm font-medium">Description</label>
					<textarea 
						id="bet-description"
						bind:value={newBetDescription}
						class="w-full rounded-md border py-2"
						rows="2"
						placeholder="Describe your bet..."
						required
					></textarea>
				</div>
				
				<div class="mb-4">
					<label class="mb-1 block text-sm font-medium">Resolution Type</label>
					<div class="grid gap-2 sm:grid-cols-4">
						<label class="flex items-center">
							<input 
								type="radio" 
								value={ResolutionType.CUSTOM} 
								bind:group={newBetResolutionType} 
								class="mr-2"
							/>
							Custom
						</label>
						<label class="flex items-center">
							<input 
								type="radio" 
								value={ResolutionType.MATCH} 
								bind:group={newBetResolutionType} 
								class="mr-2"
							/>
							Match Result
						</label>
						<label class="flex items-center">
							<input 
								type="radio" 
								value={ResolutionType.ROUND} 
								bind:group={newBetResolutionType} 
								class="mr-2"
							/>
							Round Result
						</label>
						<label class="flex items-center">
							<input 
								type="radio" 
								value={ResolutionType.TOURNAMENT} 
								bind:group={newBetResolutionType} 
								class="mr-2"
							/>
							Tournament
						</label>
					</div>
				</div>
				
				<!-- Conditional fields based on resolution type -->
				{#if newBetResolutionType === ResolutionType.MATCH && availableMatches.length > 0}
					<div class="mb-4">
						<label for="bet-match" class="mb-1 block text-sm font-medium">Select Match</label>
						<select 
							id="bet-match"
							bind:value={newBetMatchId}
							class="w-full rounded-md border py-2"
							required
						>
							<option value="">Select a match</option>
							{#each availableMatches as match}
								<option value={match.id}>Match #{match.id}</option>
							{/each}
						</select>
					</div>
				{:else if newBetResolutionType === ResolutionType.ROUND && availableRounds.length > 0}
					<div class="mb-4">
						<label for="bet-round" class="mb-1 block text-sm font-medium">Select Round</label>
						<select 
							id="bet-round"
							bind:value={newBetRoundId}
							class="w-full rounded-md border py-2"
							required
						>
							<option value="">Select a round</option>
							{#each availableRounds as round}
								<option value={round.id}>{round.name}</option>
							{/each}
						</select>
					</div>
				{:else if newBetResolutionType === ResolutionType.TOURNAMENT && availableTournaments.length > 0}
					<div class="mb-4">
						<label for="bet-tournament" class="mb-1 block text-sm font-medium">Select Tournament</label>
						<select 
							id="bet-tournament"
							bind:value={newBetTournamentId}
							class="w-full rounded-md border py-2"
							required
						>
							<option value="">Select a tournament</option>
							{#each availableTournaments as tournament}
								<option value={tournament.id}>{tournament.name}</option>
							{/each}
						</select>
					</div>
				{/if}
				
				<div class="mt-6 flex justify-end">
					<button 
						type="button" 
						class="mr-2 rounded-md border px-4 py-2 text-gray-600 hover:bg-gray-50"
						on:click={() => isCreatingBet = false}
					>
						Cancel
					</button>
					<button 
						type="submit" 
						class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						Create Bet
					</button>
				</div>
			</form>
		</div>
	{/if}
	
	<!-- Tabs -->
	<div class="mb-1 border-b">
		<div class="flex flex-wrap -mb-px">
			<button 
				class={`mr-2 inline-block rounded-t-lg border-transparent px-4 py-2 hover:border-gray-300 hover:text-gray-600 
					${activeTab === 'pending-incoming' ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-500'}`}
				on:click={() => activeTab = 'pending-incoming'}
			>
				Incoming ({$pendingIncomingBets.length})
			</button>
			<button 
				class={`mr-2 inline-block rounded-t-lg border-transparent px-4 py-2 hover:border-gray-300 hover:text-gray-600 
					${activeTab === 'pending-outgoing' ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-500'}`}
				on:click={() => activeTab = 'pending-outgoing'}
			>
				Outgoing ({$pendingOutgoingBets.length})
			</button>
			<button 
				class={`mr-2 inline-block rounded-t-lg border-transparent px-4 py-2 hover:border-gray-300 hover:text-gray-600 
					${activeTab === 'active' ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-500'}`}
				on:click={() => activeTab = 'active'}
			>
				Active ({$activeBets.length})
			</button>
			<button 
				class={`mr-2 inline-block rounded-t-lg border-transparent px-4 py-2 hover:border-gray-300 hover:text-gray-600 
					${activeTab === 'completed' ? 'border-b-2 border-blue-500 text-blue-600' : 'border-b-2 border-transparent text-gray-500'}`}
				on:click={() => activeTab = 'completed'}
			>
				Completed ({$completedBets.length})
			</button>
		</div>
	</div>
	
	<!-- Tab content -->
	<div class="mt-4">
		<!-- Pending Incoming -->
		{#if activeTab === 'pending-incoming'}
			{#if $pendingIncomingBets.length === 0}
				<div class="rounded-lg border bg-white p-6 text-center text-gray-500">
					No pending bets from others.
				</div>
			{:else}
				<div class="space-y-4">
					{#each $pendingIncomingBets as bet (bet.id)}
						<div class="rounded-lg border bg-white p-4 shadow">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div>
									<span class="font-medium">{bet.creator_username}</span>
									<span class="text-gray-500">wants to bet with you</span>
								</div>
								<div class="font-bold text-green-600">
									{formatCurrency(bet.amount)}
								</div>
							</div>
							
							<p class="mt-2 rounded bg-gray-50 p-2">{bet.description}</p>
							
							<div class="mt-4 flex justify-end space-x-2">
								<button 
									on:click={() => declineBet(bet.id)}
									class="rounded border border-red-300 bg-white px-4 py-1 text-red-600 hover:bg-red-50"
								>
									Decline
								</button>
								<button 
									on:click={() => acceptBet(bet.id)}
									class="rounded bg-green-500 px-4 py-1 text-white hover:bg-green-600"
								>
									Accept
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
		
		<!-- Pending Outgoing -->
		{#if activeTab === 'pending-outgoing'}
			{#if $pendingOutgoingBets.length === 0}
				<div class="rounded-lg border bg-white p-6 text-center text-gray-500">
					No pending bets you've created.
				</div>
			{:else}
				<div class="space-y-4">
					{#each $pendingOutgoingBets as bet (bet.id)}
						<div class="rounded-lg border bg-white p-4 shadow">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div>
									<span class="text-gray-500">Waiting for</span>
									<span class="font-medium">{bet.opponent_username}</span>
									<span class="text-gray-500">to respond</span>
								</div>
								<div class="font-bold text-green-600">
									{formatCurrency(bet.amount)}
								</div>
							</div>
							
							<p class="mt-2 rounded bg-gray-50 p-2">{bet.description}</p>
							
							<div class="mt-2 text-sm text-gray-500">
								Created on {new Date(bet.created_at).toLocaleDateString()}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
		
		<!-- Active Bets -->
		{#if activeTab === 'active'}
			{#if $activeBets.length === 0}
				<div class="rounded-lg border bg-white p-6 text-center text-gray-500">
					No active bets.
				</div>
			{:else}
				<div class="space-y-4">
					{#each $activeBets as bet (bet.id)}
						<div class="rounded-lg border bg-white p-4 shadow">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div>
									<span class="font-medium">{bet.creator_username}</span>
									<span class="text-gray-500">vs</span>
									<span class="font-medium">{bet.opponent_username}</span>
								</div>
								<div class="font-bold text-green-600">
									{formatCurrency(bet.amount)}
								</div>
							</div>
							
							<p class="mt-2 rounded bg-gray-50 p-2">{bet.description}</p>
							
							{#if bet.resolution_type !== 'custom' && $auth.user}
								<!-- Only show complete buttons for custom bets -->
								<div class="mt-4 text-sm text-gray-500">
									This bet will be resolved automatically when the 
									{bet.resolution_type === 'match' ? 'match' : 
									 bet.resolution_type === 'round' ? 'round' : 'tournament'} is completed.
								</div>
							{:else if $auth.user}
								<div class="mt-4 flex justify-end space-x-2">
									<button 
										on:click={() => completeBet(bet.id, bet.opponent_id || '')}
										class="rounded border px-4 py-1 text-gray-600 hover:bg-gray-50"
									>
										{bet.opponent_username} won
									</button>
									<button 
										on:click={() => completeBet(bet.id, bet.creator_id)}
										class="rounded border px-4 py-1 text-gray-600 hover:bg-gray-50"
									>
										{bet.creator_username} won
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
		
		<!-- Completed Bets -->
		{#if activeTab === 'completed'}
			{#if $completedBets.length === 0}
				<div class="rounded-lg border bg-white p-6 text-center text-gray-500">
					No completed bets.
				</div>
			{:else}
				<div class="space-y-4">
					{#each $completedBets as bet (bet.id)}
						<div class="rounded-lg border bg-white p-4 shadow">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div>
									<span class="font-medium">{bet.creator_username}</span>
									<span class="text-gray-500">vs</span>
									<span class="font-medium">{bet.opponent_username}</span>
								</div>
								<div class="font-bold text-green-600">
									{formatCurrency(bet.amount)}
								</div>
							</div>
							
							<p class="mt-2 text-sm">{bet.description}</p>
							
							<div class="mt-2 flex flex-wrap items-center justify-between">
								<div>
									<span class="text-gray-500">Winner:</span>
									<span class="font-semibold">
										{bet.winner_id === bet.creator_id ? bet.creator_username : bet.opponent_username}
									</span>
								</div>
								
								{#if !bet.is_paid && $auth.user}
									<button
										on:click={() => markAsPaid(bet.id)}
										class="rounded bg-amber-500 px-4 py-1 text-white hover:bg-amber-600"
									>
										Mark as Paid
									</button>
								{:else}
									<span class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
										✓ Paid
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</section>
