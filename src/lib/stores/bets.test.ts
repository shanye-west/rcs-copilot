import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { betsStore, BetStatus, ResolutionType } from './bets';
import { get } from 'svelte/store';
import { mockBet } from '$lib/mocks/bet-mocks';

// Define mock types
interface MockBet {
  id: string;
  creator_id: string;
  opponent_id: string;
  amount: number;
  description: string;
  status: string;
  is_paid: boolean;
  resolution_type: string;
  match_id: string | null;
  round_id: string | null;
  tournament_id: string | null;
  winner_id: string | null;
  created_at: string;
  updated_at: string;
  creator?: {
    username: string;
  };
  opponent?: {
    username: string;
  };
  match?: {
    id: string;
    status: string;
  };
  round?: {
    name: string;
  };
  tournament?: {
    name: string;
  };
}

interface MockResponse {
  data: MockBet[];
  error: null | { message: string };
}

// Mock supabase client
vi.mock('$lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })
    }
  };
});

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

describe('Bets Store', () => {
  let mockResponse: MockResponse;
  
  beforeEach(() => {
    // Reset mock response for each test
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
    
    // Setup mock response
    const supabase = require('../mocks/__mocks__/supabase').supabase;
    supabase.from.mockImplementation(() => supabase);
    supabase.select.mockImplementation(() => supabase);
    supabase.insert.mockImplementation(() => supabase);
    supabase.update.mockImplementation(() => supabase);
    supabase.eq.mockImplementation(() => supabase);
    supabase.or.mockImplementation(() => supabase);
    supabase.order.mockImplementation(() => Promise.resolve(mockResponse));
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  test('should initialize with empty bets array', () => {
    const state = get(betsStore);
    expect(state.bets).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  test('should fetch all bets', async () => {
    await betsStore.fetchAllBets();
    const state = get(betsStore);
    expect(state.bets.length).toBe(1);
    expect(state.bets[0].id).toBe('bet1');
    expect(state.loading).toBe(false);
  });

  test('should transform bets data with usernames', async () => {
    await betsStore.fetchAllBets();
    const state = get(betsStore);
    expect(state.bets[0].creator_username).toBe('testuser');
    expect(state.bets[0].opponent_username).toBe('opponent');
  });

  test('should handle errors when fetching bets', async () => {
    const errorMessage = 'Failed to fetch bets';
    const { supabase } = require('$lib/supabase');
    supabase.order.mockImplementation(() => Promise.resolve({ data: null, error: { message: errorMessage } }));
    
    await betsStore.fetchAllBets();
    const state = get(betsStore);
    expect(state.error).toBe(errorMessage);
    expect(state.loading).toBe(false);
  });

  test('should fetch user bets', async () => {
    await betsStore.fetchUserBets('user1');
    const state = get(betsStore);
    expect(state.bets.length).toBe(1);
  });

  // Additional tests for bet creation and updates
  test('should create a new bet', async () => {
    const newBet = {
      creator_id: 'user1',
      opponent_id: 'user2',
      amount: 20,
      description: 'New test bet',
      status: BetStatus.PENDING,
      resolution_type: ResolutionType.CUSTOM
    };
    
    const { supabase } = require('$lib/supabase');
    supabase.insert.mockImplementation(() => Promise.resolve({ 
      data: [{ ...newBet, id: 'new-bet-1' }], 
      error: null 
    }));
    
    await betsStore.createBet(newBet);
    // Verify that the insert method was called with the new bet
    expect(supabase.insert).toHaveBeenCalled();
  });

  test('should update a bet status', async () => {
    const betId = 'bet1';
    const status = BetStatus.ACCEPTED;
    
    const { supabase } = require('$lib/supabase');
    supabase.eq.mockImplementation(() => Promise.resolve({ 
      data: [{ id: betId, status }], 
      error: null 
    }));
    
    await betsStore.updateBetStatus(betId, status);
    // Verify that the update method was called
    expect(supabase.update).toHaveBeenCalled();
    expect(supabase.eq).toHaveBeenCalled();
  });
});
