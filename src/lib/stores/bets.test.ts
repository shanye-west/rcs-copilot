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

// No need to mock supabase here - it's already mocked in vitest.setup.js
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
  const subscribe = (callback) => {
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
  let mockResponse;
  
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
    const { supabase } = require('../supabase');
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
    expect(state.error).toBeNull();
  });
  
  test('should fetch all bets', async () => {
    const { supabase } = require('$lib/supabase');
    supabase.order.mockImplementation(() => mockResponse);
    
    await betsStore.fetchAllBets();
    const state = get(betsStore);
    
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.select).toHaveBeenCalled();
    expect(state.bets).toHaveLength(1);
    expect(state.bets[0].id).toBe('bet1');
  });
  
  test('should fetch user bets', async () => {
    const { supabase } = require('$lib/supabase');
    supabase.order.mockImplementation(() => mockResponse);
    
    await betsStore.fetchUserBets('user1');
    const state = get(betsStore);
    
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.select).toHaveBeenCalled();
    expect(supabase.or).toHaveBeenCalledWith('creator_id.eq.user1,opponent_id.eq.user1');
    expect(state.bets).toHaveLength(1);
  });
  
  test('should handle error when fetching bets', async () => {
    const { supabase } = require('$lib/supabase');
    const errorResponse = { data: null, error: { message: 'Error fetching bets' } };
    supabase.order.mockImplementation(() => errorResponse);
    
    // Suppress console.error during test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    await betsStore.fetchAllBets();
    const state = get(betsStore);
    
    expect(state.error).toBe('Error fetching bets');
    expect(state.loading).toBe(false);
    
    consoleErrorSpy.mockRestore();
  });
  
  test('should create a new bet', async () => {
    const { supabase } = require('$lib/supabase');
    mockResponse = { data: [{ id: 'newbet', ...mockResponse.data[0] }], error: null };
    supabase.select.mockImplementation(() => Promise.resolve(mockResponse));
    
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
    const { supabase } = require('$lib/supabase');
    mockResponse = { data: [{ ...mockResponse.data[0], status: BetStatus.ACCEPTED }], error: null };
    supabase.select.mockImplementation(() => Promise.resolve(mockResponse));
    
    // Setup initial state with a bet
    betsStore.fetchAllBets();
    
    // Update the bet status
    const result = await betsStore.updateBetStatus('bet1', BetStatus.ACCEPTED);
    const state = get(betsStore);
    
    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.update).toHaveBeenCalled();
    expect(supabase.eq).toHaveBeenCalledWith('id', 'bet1');
  });
  
  test('should mark bet as paid', async () => {
    const { supabase } = require('$lib/supabase');
    supabase.select.mockImplementation(() => Promise.resolve(mockResponse));
    
    // Setup initial state with a bet
    await betsStore.fetchAllBets();
    
    // Update to mark as paid
    const result = await betsStore.markAsPaid('bet1');
    
    expect(result.success).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('bets');
    expect(supabase.update).toHaveBeenCalledWith({ is_paid: true });
    expect(supabase.eq).toHaveBeenCalledWith('id', 'bet1');
  });
});
