import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { betsStore, BetStatus, ResolutionType } from './bets';
import { get } from 'svelte/store';
import { mockBet } from '$lib/mocks/bet-mocks';

// Mock auth store
vi.mock('./auth', () => {
  const get = vi.fn();
  const subscribe = (callback: (value: any) => void) => {
    callback({ user: { id: 'user1', username: 'testuser' }, loading: false, error: null });
    return () => {};
  };
  
  return { 
    auth: {
      subscribe,
      get
    }
  };
});

// Mock supabase
vi.mock('$lib/supabase', () => import('../mocks/supabase.js'));
// @ts-ignore
import { supabase, setSupabaseReturnValue } from '../mocks/supabase.js';

// Define MockResponse interface if missing
interface MockResponse {
  data: any[];
  error: null | { message: string };
}

describe('Bets Store', () => {
  let mockResponse: MockResponse;
  
  beforeEach(() => {
    // Set the default mock response for each test
    mockResponse = {
      data: [
        {
          id: 'bet1',
          creator_id: 'user1',
          opponent_id: 'user2',
          amount: 10,
          description: 'Test bet',
          status: BetStatus.PENDING,
          is_paid: false,
          resolution_type: ResolutionType.CUSTOM,
          match_id: null,
          round_id: null,
          tournament_id: null,
          winner_id: null,
          created_at: '2025-05-21T12:00:00Z',
          updated_at: '2025-05-21T12:00:00Z',
          creator: { username: 'testuser' },
          opponent: { username: 'opponent' }
        }
      ],
      error: null
    };
    setSupabaseReturnValue(Promise.resolve(mockResponse));
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  test('should initialize with empty bets array', () => {
    const state = get(betsStore);
    expect(state.bets).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
  
  test('should fetch all bets', async () => {
    setSupabaseReturnValue(Promise.resolve(mockResponse));
    await betsStore.fetchAllBets();
    const state = get(betsStore);
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.select).toHaveBeenCalled();
    expect(state.bets).toHaveLength(1);
    expect(state.bets[0].id).toBe('bet1');
  });
  
  test('should fetch user bets', async () => {
    setSupabaseReturnValue(Promise.resolve(mockResponse));
    await betsStore.fetchUserBets('user1');
    const state = get(betsStore);
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.select).toHaveBeenCalled();
    expect(supabase.or).toHaveBeenCalledWith('creator_id.eq.user1,opponent_id.eq.user1');
    expect(state.bets).toHaveLength(1);
  });
  
  test('should handle error when fetching bets', async () => {
    const errorResponse = { data: null, error: { message: 'Error fetching bets' } };
    setSupabaseReturnValue(Promise.resolve(errorResponse));
    // Suppress console.error during test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await betsStore.fetchAllBets();
    const state = get(betsStore);
    expect(state.error).toBe('Error fetching bets');
    expect(state.loading).toBe(false);
    consoleErrorSpy.mockRestore();
  });
  
  test('should create a new bet', async () => {
    mockResponse = { data: [{ ...mockResponse.data[0], id: 'newbet' }], error: null };
    setSupabaseReturnValue(Promise.resolve(mockResponse));
    const betData = {
      creator_id: 'user1',
      opponent_id: 'user2',
      amount: 20,
      description: 'New test bet',
      resolution_type: ResolutionType.MATCH,
      match_id: 'match1'
    };
    const result = await betsStore.createBet(betData);
    const state = get(betsStore);
    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.insert).toHaveBeenCalled();
    expect(state.bets).toHaveLength(1);
  });
  
  test('should update bet status', async () => {
    mockResponse = { data: [{ ...mockResponse.data[0], status: BetStatus.ACCEPTED }], error: null };
    setSupabaseReturnValue(Promise.resolve(mockResponse));
    await betsStore.fetchAllBets();
    const result = await betsStore.updateBetStatus('bet1', BetStatus.ACCEPTED);
    const state = get(betsStore);
    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.update).toHaveBeenCalled();
    expect(supabase.eq).toHaveBeenCalledWith('id', 'bet1');
  });
  
  test('should mark bet as paid', async () => {
    setSupabaseReturnValue(Promise.resolve(mockResponse));
    await betsStore.fetchAllBets();
    const result = await betsStore.markAsPaid('bet1');
    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.update).toHaveBeenCalledWith({ is_paid: true });
    expect(supabase.eq).toHaveBeenCalledWith('id', 'bet1');
  });
});
