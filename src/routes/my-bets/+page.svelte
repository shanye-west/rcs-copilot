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
	import { goto } from '$app/navigation';
	import '../app.css';
	import '$lib/styles/my-bets.css';
	import '$lib/styles/my-bets-additions.css';

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
	let showNotification = false;
	let notificationMessage = '';
	let notificationType = 'success';

	// Format currency
	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
	}
	
	// Format date
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}
	
	// Show notification helper
	function showToast(message: string, type: 'success' | 'error' = 'success') {
		notificationMessage = message;
		notificationType = type;
		showNotification = true;
		setTimeout(() => {
			showNotification = false;
		}, 3000);
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
			tournament_id: newBetResolutionType === ResolutionType.TOURNAMENT ? newBetTournamentId : null
		};

		// Submit the bet
		const result = await betsStore.createBet(betData);

		if (result.success) {
			// Reset form
			newBetAmount = 0;
			newBetDescription = '';
			newBetResolutionType = ResolutionType.CUSTOM;
			isCreatingBet = false;
			
			// Show success message
			showToast('Bet created successfully');
		} else {
			formError = result.error || 'Error creating bet';
			showToast('Failed to create bet', 'error');
		}
	}

	// Handle accepting a bet
	async function acceptBet(betId: string) {
		try {
			await betsStore.updateBetStatus(betId, BetStatus.ACCEPTED);
			showToast('Bet accepted');
		} catch (error) {
			console.error('Error accepting bet:', error);
			showToast('Failed to accept bet', 'error');
		}
	}

	// Handle declining a bet
	async function declineBet(betId: string) {
		try {
			await betsStore.updateBetStatus(betId, BetStatus.DECLINED);
			showToast('Bet declined');
		} catch (error) {
			console.error('Error declining bet:', error);
			showToast('Failed to decline bet', 'error');
		}
	}

	// Handle marking a bet as completed (with winner)
	async function completeBet(betId: string, winnerId: string) {
		try {
			await betsStore.updateBetStatus(betId, BetStatus.COMPLETED, winnerId);
			showToast('Bet marked as completed');
		} catch (error) {
			console.error('Error completing bet:', error);
			showToast('Failed to complete bet', 'error');
		}
	}

	// Handle marking a bet as paid
	async function markAsPaid(betId: string) {
		try {
			await betsStore.markAsPaid(betId);
			showToast('Bet marked as paid');
		} catch (error) {
			console.error('Error marking bet as paid:', error);
			showToast('Failed to mark bet as paid', 'error');
		}
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
			showToast('Failed to load players', 'error');
		}
	}

	// Fetch matches, rounds, and tournaments
	async function fetchReferenceData() {
		try {
			// Fetch matches
			const { data: matchData, error: matchError } = await supabase
				.from('matches')
				.select('id, name, match_type_id, status')
				.eq('status', 'active');
				
			if (matchError) throw matchError;
			availableMatches = matchData || [];

			// Fetch rounds
			const { data: roundData, error: roundError } = await supabase
				.from('rounds')
				.select('id, name, status')
				.eq('status', 'active');
				
			if (roundError) throw roundError;
			availableRounds = roundData || [];

			// Fetch tournaments
			const { data: tournamentData, error: tournamentError } = await supabase
				.from('tournaments')
				.select('id, name, status')
				.eq('status', 'active');
				
			if (tournamentError) throw tournamentError;
			availableTournaments = tournamentData || [];
		} catch (error) {
			console.error('Error fetching reference data:', error);
			showToast('Failed to load reference data', 'error');
		}
	}
	
	// Navigate to create new bet page
	function navigateToNewBet() {
		goto('/my-bets/new');
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

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-20">
  <!-- Notification toast -->
  {#if showNotification}
    <div class="fixed top-4 right-4 z-50 max-w-xs fade-in">
      <div class="{notificationType === 'success' ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'} border-l-4 p-4 rounded shadow-lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            {#if notificationType === 'success'}
              <svg class="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            {:else}
              <svg class="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            {/if}
          </div>
          <div class="ml-3">
            <p class="{notificationType === 'success' ? 'text-green-800' : 'text-red-800'} text-sm font-medium">
              {notificationMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Hero Section -->
  <div class="golf-gradient text-white p-6 mb-6">
    <div class="max-w-4xl mx-auto">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold mb-2">My Bets</h1>
          {#if $auth.user}
            <p class="text-blue-100">Welcome, {$auth.user.username}!</p>
          {/if}
        </div>
        <div>
          <button
            on:click={navigateToNewBet}
            class="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg shadow-sm font-medium transition-colors"
          >
            + Create New Bet
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-4">
    <!-- Betting stats summary -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
      <div class="stats-card">
        <h3 class="text-sm font-medium text-gray-500">Net Winnings</h3>
        <p class="{$betStats.winnings >= 0 ? 'amount-display amount-display-positive' : 'amount-display amount-display-negative'}">
          {formatCurrency($betStats.winnings)}
        </p>
      </div>

      <div class="stats-card">
        <h3 class="text-sm font-medium text-gray-500">Active Bets</h3>
        <p class="amount-display amount-display-neutral">
          {$activeBets.length} <span class="text-sm font-normal text-gray-500">bets</span>
        </p>
      </div>

      <div class="stats-card">
        <h3 class="text-sm font-medium text-gray-500">At Stake</h3>
        <p class="amount-display text-amber-600">{formatCurrency($betStats.pendingAmount)}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="bg-white rounded-lg shadow-md mb-6">
      <div class="flex border-b overflow-x-auto hide-scrollbar">
        <button
          class="tab-button {activeTab === 'pending-incoming' ? 'tab-button-active' : 'tab-button-inactive'}"
          on:click={() => (activeTab = 'pending-incoming')}
        >
          Incoming ({$pendingIncomingBets.length})
        </button>
        <button
          class="tab-button {activeTab === 'pending-outgoing' ? 'tab-button-active' : 'tab-button-inactive'}"
          on:click={() => (activeTab = 'pending-outgoing')}
        >
          Outgoing ({$pendingOutgoingBets.length})
        </button>
        <button
          class="tab-button {activeTab === 'active' ? 'tab-button-active' : 'tab-button-inactive'}"
          on:click={() => (activeTab = 'active')}
        >
          Active ({$activeBets.length})
        </button>
        <button
          class="tab-button {activeTab === 'completed' ? 'tab-button-active' : 'tab-button-inactive'}"
          on:click={() => (activeTab = 'completed')}
        >
          Completed ({$completedBets.length})
        </button>
      </div>

      <!-- Tab content area -->
      <div class="p-6 space-y-4">
        <!-- Pending Incoming -->
        {#if activeTab === 'pending-incoming'}
          {#if $pendingIncomingBets.length === 0}
            <div class="text-center py-12 text-gray-500 fade-in">
              <div class="text-6xl mb-4">📭</div>
              <h3 class="text-xl font-semibold mb-2">No pending bets from others</h3>
              <p class="text-gray-600 mb-4">When someone sends you a bet, it will appear here</p>
            </div>
          {:else}
            <div class="space-y-4 fade-in">
              {#each $pendingIncomingBets as bet (bet.id)}
                <div class="bet-card slide-in">
                  <div class="bet-card-header flex justify-between items-center">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-semibold text-lg">{bet.creator_username}</span>
                        <span class="status-badge status-badge-pending">Incoming</span>
                      </div>
                      <p class="text-sm text-gray-500">wants to bet with you</p>
                    </div>
                    <div class="text-xl font-bold text-green-600">
                      {formatCurrency(bet.amount)}
                    </div>
                  </div>
                  
                  <div class="bet-card-body">
                    <p class="p-3 bg-gray-50 rounded-lg">{bet.description}</p>
                    
                    <!-- Resolution type badge -->
                    {#if bet.resolution_type !== 'custom'}
                      <div class="mt-3 flex items-center">
                        <span class="text-sm text-gray-600 mr-2">Resolves with:</span>
                        {#if bet.resolution_type === 'match' && bet.match_name}
                          <span class="resolution-badge resolution-badge-match">Match #{bet.match_name}</span>
                        {:else if bet.resolution_type === 'round' && bet.round_name}
                          <span class="resolution-badge resolution-badge-round">{bet.round_name}</span>
                        {:else if bet.resolution_type === 'tournament' && bet.tournament_name}
                          <span class="resolution-badge resolution-badge-tournament">{bet.tournament_name}</span>
                        {/if}
                      </div>
                    {/if}
                    
                    <div class="text-xs text-gray-500 mt-3">
                      Created {formatDate(bet.created_at)}
                    </div>
                  </div>
                  
                  <div class="bet-card-footer flex justify-end space-x-3">
                    <button
                      on:click={() => declineBet(bet.id)}
                      class="action-button-danger"
                    >
                      Decline
                    </button>
                    <button
                      on:click={() => acceptBet(bet.id)}
                      class="action-button-success"
                    >
                      Accept Bet
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
            <div class="text-center py-12 text-gray-500 fade-in">
              <div class="text-6xl mb-4">📤</div>
              <h3 class="text-xl font-semibold mb-2">No pending bets you've created</h3>
              <p class="text-gray-600 mb-4">Create a new bet to challenge someone!</p>
              <button
                on:click={navigateToNewBet}
                class="action-button-primary"
              >
                Create New Bet
              </button>
            </div>
          {:else}
            <div class="space-y-4 fade-in">
              {#each $pendingOutgoingBets as bet (bet.id)}
                <div class="bet-card slide-in">
                  <div class="bet-card-header flex justify-between items-center">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
                        <span class="text-gray-600">challenged</span>
                        <span class="font-semibold">{bet.opponent_username}</span>
                      </div>
                      <div class="mt-1 flex items-center">
                        <span class="status-badge status-badge-pending">Awaiting Response</span>
                      </div>
                    </div>
                    <div class="text-xl font-bold text-green-600">
                      {formatCurrency(bet.amount)}
                    </div>
                  </div>
                  
                  <div class="bet-card-body">
                    <p class="p-3 bg-gray-50 rounded-lg">{bet.description}</p>
                    
                    <!-- Resolution type badge -->
                    {#if bet.resolution_type !== 'custom'}
                      <div class="mt-3 flex items-center">
                        <span class="text-sm text-gray-600 mr-2">Resolves with:</span>
                        {#if bet.resolution_type === 'match' && bet.match_name}
                          <span class="resolution-badge resolution-badge-match">Match #{bet.match_name}</span>
                        {:else if bet.resolution_type === 'round' && bet.round_name}
                          <span class="resolution-badge resolution-badge-round">{bet.round_name}</span>
                        {:else if bet.resolution_type === 'tournament' && bet.tournament_name}
                          <span class="resolution-badge resolution-badge-tournament">{bet.tournament_name}</span>
                        {/if}
                      </div>
                    {/if}
                    
                    <div class="text-xs text-gray-500 mt-3">
                      Created {formatDate(bet.created_at)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        {/if}

		<!-- Active Bets -->
		{#if activeTab === 'active'}
			{#if $activeBets.length === 0}
				<div class="text-center py-12 text-gray-500 fade-in">
					<div class="text-6xl mb-4">🏌️‍♂️</div>
					<h3 class="text-xl font-semibold mb-2">No active bets</h3>
					<p class="text-gray-600 mb-4">Bets that have been accepted will appear here</p>
					<button
						on:click={navigateToNewBet}
						class="action-button-primary"
					>
						Create New Bet
					</button>
				</div>
			{:else}
				<div class="space-y-4 fade-in">
					{#each $activeBets as bet (bet.id)}
						<div class="bet-card slide-in">
							<div class="bet-card-header flex justify-between items-center">
								<div>
									<div class="flex items-center gap-2">
										{#if $auth.user && bet.creator_id === $auth.user.id}
											<span class="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
											<span class="text-gray-600">vs</span>
											<span class="font-semibold">{bet.opponent_username}</span>
										{:else}
											<span class="font-semibold">{bet.creator_username}</span>
											<span class="text-gray-600">vs</span>
											<span class="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
										{/if}
										<span class="status-badge status-badge-accepted pulse-badge">Active</span>
									</div>
								</div>
								<div class="text-xl font-bold text-green-600">
									{formatCurrency(bet.amount)}
								</div>
							</div>
							
							<div class="bet-card-body">
								<p class="p-3 bg-gray-50 rounded-lg">{bet.description}</p>
								
								<!-- Potential win display -->
								<div class="mt-3 flex justify-between items-center">
									<div class="flex items-center">
										<svg class="w-4 h-4 text-amber-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
										<span class="text-sm text-amber-700">Potential win: <span class="font-semibold">{formatCurrency(bet.amount)}</span></span>
									</div>
								
									<!-- Resolution type badge -->
									{#if bet.resolution_type !== 'custom'}
										<div class="flex items-center">
											{#if bet.resolution_type === 'match' && bet.match_name}
												<span class="resolution-badge resolution-badge-match">Match #{bet.match_name}</span>
											{:else if bet.resolution_type === 'round' && bet.round_name}
												<span class="resolution-badge resolution-badge-round">{bet.round_name}</span>
											{:else if bet.resolution_type === 'tournament' && bet.tournament_name}
												<span class="resolution-badge resolution-badge-tournament">{bet.tournament_name}</span>
											{/if}
										</div>
									{/if}
								</div>
								
								<div class="text-xs text-gray-500 mt-3">
									Accepted {formatDate(bet.updated_at)}
								</div>
							</div>
							
							{#if bet.resolution_type !== 'custom' && $auth.user}
								<div class="bet-card-footer bg-blue-50 border-t border-blue-100">
									<div class="flex items-center">
										<svg class="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
										</svg>
										<span class="text-sm text-blue-700">
											This bet will be resolved automatically when the
											{bet.resolution_type === 'match'
												? 'match'
												: bet.resolution_type === 'round'
													? 'round'
													: 'tournament'} is completed.
										</span>
									</div>
								</div>
							{:else if $auth.user}
								<div class="bet-card-footer flex justify-end space-x-3">
									<button
										on:click={() => completeBet(bet.id, bet.opponent_id || '')}
										class="action-button-secondary"
									>
										{bet.opponent_username} won
									</button>
									<button
										on:click={() => completeBet(bet.id, bet.creator_id)}
										class="action-button-secondary"
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
				<div class="text-center py-12 text-gray-500 fade-in">
					<div class="text-6xl mb-4">🏆</div>
					<h3 class="text-xl font-semibold mb-2">No completed bets yet</h3>
					<p class="text-gray-600 mb-4">Settled bets will appear here</p>
				</div>
			{:else}
				<div class="space-y-4 fade-in">
					{#each $completedBets as bet (bet.id)}
						<div class="bet-card slide-in">
							<div class="bet-card-header flex justify-between items-center">
								<div>
									<div class="flex items-center gap-2">
										{#if $auth.user && bet.creator_id === $auth.user.id}
											<span class="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
											<span class="text-gray-600">vs</span>
											<span class="font-semibold">{bet.opponent_username}</span>
										{:else}
											<span class="font-semibold">{bet.creator_username}</span>
											<span class="text-gray-600">vs</span>
											<span class="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">You</span>
										{/if}
										
										{#if bet.is_paid}
											<span class="status-badge status-badge-paid">Paid</span>
										{:else}
											<span class="status-badge status-badge-unpaid">Unpaid</span>
										{/if}
									</div>
								</div>
								<div class="text-xl font-bold text-green-600">
									{formatCurrency(bet.amount)}
								</div>
							</div>
							
							<div class="bet-card-body">
								<p class="p-3 bg-gray-50 rounded-lg">{bet.description}</p>
								
								<div class="flex items-center mt-4">
									<span class="text-gray-600 text-sm mr-2">Winner:</span>
									<div class="flex items-center">
										{#if bet.winner_id === ($auth.user?.id || '')}
											<div class="flex items-center winner-badge winner-badge-user pop-in">
												<span class="mr-1">You</span>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
												</svg>
											</div>
										{:else}
											<span class="winner-badge winner-badge-opponent">
												{bet.winner_id === bet.creator_id
													? bet.creator_username
													: bet.opponent_username}
											</span>
										{/if}
									</div>
								</div>
								
								<!-- Resolution type badge -->
								{#if bet.resolution_type !== 'custom'}
									<div class="mt-3 flex items-center">
										<span class="text-sm text-gray-600 mr-2">Resolved with:</span>
										{#if bet.resolution_type === 'match' && bet.match_name}
											<span class="resolution-badge resolution-badge-match">Match #{bet.match_name}</span>
										{:else if bet.resolution_type === 'round' && bet.round_name}
											<span class="resolution-badge resolution-badge-round">{bet.round_name}</span>
										{:else if bet.resolution_type === 'tournament' && bet.tournament_name}
											<span class="resolution-badge resolution-badge-tournament">{bet.tournament_name}</span>
										{/if}
									</div>
								{/if}
								
								<div class="text-xs text-gray-500 mt-3">
									Completed {formatDate(bet.updated_at)}
								</div>
							</div>
							
							{#if !bet.is_paid && $auth.user}
								<div class="bet-card-footer flex justify-end">
									<button
										on:click={() => markAsPaid(bet.id)}
										class="action-button-primary"
									>
										<svg class="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
										</svg>
										Mark as Paid
									</button>
								</div>
							{:else}
								<div class="bet-card-footer flex justify-start">
									<div class="flex items-center text-green-700">
										<svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
										</svg>
										<span>Paid on {formatDate(bet.updated_at)}</span>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}
      </div>
    </div>
  </div>
</div>
