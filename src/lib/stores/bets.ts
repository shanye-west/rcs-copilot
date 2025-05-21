import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { auth } from './auth';
import type { Database } from '$lib/database.types';

// Type definitions
export type Bet = Database['public']['Tables']['bets']['Row'] & {
	creator_username?: string;
	opponent_username?: string;
	match_name?: string;
	round_name?: string;
	tournament_name?: string;
};

// Bet status types
export const BetStatus = {
	PENDING: 'pending',
	ACCEPTED: 'accepted',
	DECLINED: 'declined',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled'
};

// Resolution types
export const ResolutionType = {
	MATCH: 'match',
	ROUND: 'round',
	TOURNAMENT: 'tournament',
	CUSTOM: 'custom'
};

// Initial state
type BetsState = {
	bets: Bet[];
	loading: boolean;
	error: string | null;
};

const initialState: BetsState = {
	bets: [],
	loading: false,
	error: null
};

function createBetsStore() {
	const { subscribe, set, update } = writable<BetsState>(initialState);
	let subscription: ReturnType<typeof supabase.channel> | null = null;

	return {
		subscribe,

		// Load all bets
		fetchAllBets: async () => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				// Get all bets with creator and opponent usernames
				const { data, error } = await supabase
					.from('bets')
					.select(
						`
            *,
            creator:creator_id(username),
            opponent:opponent_id(username),
            match:match_id(id, status),
            round:round_id(name),
            tournament:tournament_id(name)
          `
					)
					.order('created_at', { ascending: false });

				if (error) throw new Error(error.message);

				// Transform data to include usernames directly
				const transformedData: Bet[] = data.map((bet) => ({
					...bet,
					creator_username: bet.creator?.username,
					opponent_username: bet.opponent?.username,
					match_name: bet.match?.id,
					round_name: bet.round?.name,
					tournament_name: bet.tournament?.name
				}));

				update((state) => ({ ...state, bets: transformedData, loading: false }));
			} catch (err) {
				console.error('Error fetching bets:', err);
				update((state) => ({ ...state, error: err.message, loading: false }));
			}
		},

		// Load user's bets
		fetchUserBets: async (userId: string) => {
			if (!userId) return;

			update((state) => ({ ...state, loading: true, error: null }));
			try {
				// Get all bets where user is creator or opponent
				const { data, error } = await supabase
					.from('bets')
					.select(
						`
            *,
            creator:creator_id(username),
            opponent:opponent_id(username),
            match:match_id(id, status),
            round:round_id(name),
            tournament:tournament_id(name)
          `
					)
					.or(`creator_id.eq.${userId},opponent_id.eq.${userId}`)
					.order('created_at', { ascending: false });

				if (error) throw new Error(error.message);

				// Transform data to include usernames directly
				const transformedData: Bet[] = data.map((bet) => ({
					...bet,
					creator_username: bet.creator?.username,
					opponent_username: bet.opponent?.username,
					match_name: bet.match?.id,
					round_name: bet.round?.name,
					tournament_name: bet.tournament?.name
				}));

				update((state) => ({ ...state, bets: transformedData, loading: false }));
			} catch (err) {
				console.error('Error fetching user bets:', err);
				update((state) => ({ ...state, error: err.message, loading: false }));
			}
		},

		// Create a new bet
		createBet: async (
			betData: Omit<
				Database['public']['Tables']['bets']['Insert'],
				'id' | 'created_at' | 'updated_at'
			>
		) => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const { data, error } = await supabase
					.from('bets')
					.insert({
						...betData,
						status: BetStatus.PENDING,
						is_paid: false
					})
					.select();

				if (error) throw new Error(error.message);

				// Update store with the new bet
				update((state) => ({
					...state,
					bets: [data[0], ...state.bets],
					loading: false
				}));

				return { success: true, data: data[0] };
			} catch (err) {
				console.error('Error creating bet:', err);
				update((state) => ({ ...state, error: err.message, loading: false }));
				return { success: false, error: err.message };
			}
		},

		// Update a bet
		updateBetStatus: async (betId: string, status: string, winnerId?: string) => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const updateData: any = { status };

				// If winner is being set, also add that
				if (winnerId && status === BetStatus.COMPLETED) {
					updateData.winner_id = winnerId;
				}

				const { data, error } = await supabase
					.from('bets')
					.update(updateData)
					.eq('id', betId)
					.select();

				if (error) throw new Error(error.message);

				// Update store with the modified bet
				update((state) => ({
					...state,
					bets: state.bets.map((bet) => (bet.id === betId ? { ...bet, ...updateData } : bet)),
					loading: false
				}));

				return { success: true };
			} catch (err) {
				console.error('Error updating bet:', err);
				update((state) => ({ ...state, error: err.message, loading: false }));
				return { success: false, error: err.message };
			}
		},

		// Mark a bet as paid
		markAsPaid: async (betId: string) => {
			update((state) => ({ ...state, loading: true, error: null }));
			try {
				const { error } = await supabase.from('bets').update({ is_paid: true }).eq('id', betId);

				if (error) throw new Error(error.message);

				// Update store with the modified bet
				update((state) => ({
					...state,
					bets: state.bets.map((bet) => (bet.id === betId ? { ...bet, is_paid: true } : bet)),
					loading: false
				}));

				return { success: true };
			} catch (err) {
				console.error('Error marking bet as paid:', err);
				update((state) => ({ ...state, error: err.message, loading: false }));
				return { success: false, error: err.message };
			}
		},

		// Set up real-time subscription for bets
		subscribeToUpdates: () => {
			// First check for existing subscription
			if (subscription) {
				subscription.unsubscribe();
			}

			subscription = supabase
				.channel('public:bets')
				.on(
					'postgres_changes',
					{
						event: '*',
						schema: 'public',
						table: 'bets'
					},
					(payload) => {
						update((state) => {
							// Handle different events
							switch (payload.eventType) {
								case 'INSERT':
									return {
										...state,
										bets: [payload.new as Bet, ...state.bets]
									};
								case 'UPDATE': {
									const updatedBets = state.bets.map((bet) =>
										bet.id === payload.new.id ? { ...bet, ...payload.new } : bet
									);
									return { ...state, bets: updatedBets };
								}
								case 'DELETE': {
									const filteredBets = state.bets.filter((bet) => bet.id !== payload.old.id);
									return { ...state, bets: filteredBets };
								}
								default:
									return state;
							}
						});
					}
				)
				.subscribe();

			return () => {
				if (subscription) {
					subscription.unsubscribe();
					subscription = null;
				}
			};
		},

		// Clean up subscription
		cleanup: () => {
			if (subscription) {
				subscription.unsubscribe();
				subscription = null;
			}
		}
	};
}

// Create the store
export const betsStore = createBetsStore();

// Derived stores for specific bet views
export const pendingIncomingBets = derived([betsStore, auth], ([$betsStore, $auth]) => {
	if (!$auth.user) return [];
	return $betsStore.bets.filter(
		(bet) => bet.opponent_id === $auth.user.id && bet.status === BetStatus.PENDING
	);
});

export const pendingOutgoingBets = derived([betsStore, auth], ([$betsStore, $auth]) => {
	if (!$auth.user) return [];
	return $betsStore.bets.filter(
		(bet) => bet.creator_id === $auth.user.id && bet.status === BetStatus.PENDING
	);
});

export const activeBets = derived([betsStore, auth], ([$betsStore, $auth]) => {
	if (!$auth.user) return [];
	return $betsStore.bets.filter(
		(bet) =>
			(bet.creator_id === $auth.user.id || bet.opponent_id === $auth.user.id) &&
			bet.status === BetStatus.ACCEPTED
	);
});

export const completedBets = derived([betsStore, auth], ([$betsStore, $auth]) => {
	if (!$auth.user) return [];
	return $betsStore.bets.filter(
		(bet) =>
			(bet.creator_id === $auth.user.id || bet.opponent_id === $auth.user.id) &&
			bet.status === BetStatus.COMPLETED
	);
});

// Calculate win/loss totals
export const betStats = derived([betsStore, auth], ([$betsStore, $auth]) => {
	if (!$auth.user) return { winnings: 0, pendingAmount: 0 };

	let winnings = 0;
	let pendingAmount = 0;

	$betsStore.bets.forEach((bet) => {
		if (bet.status === BetStatus.COMPLETED) {
			// If user won
			if (bet.winner_id === $auth.user.id) {
				winnings += bet.amount;
			}
			// If user lost
			else if (
				bet.winner_id &&
				bet.winner_id !== $auth.user.id &&
				(bet.creator_id === $auth.user.id || bet.opponent_id === $auth.user.id)
			) {
				winnings -= bet.amount;
			}
		} else if (bet.status === BetStatus.ACCEPTED) {
			// Track amount at risk in active bets
			if (bet.creator_id === $auth.user.id || bet.opponent_id === $auth.user.id) {
				pendingAmount += bet.amount;
			}
		}
	});

	return { winnings, pendingAmount };
});
