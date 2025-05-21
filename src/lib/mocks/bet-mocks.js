// Mock for bets test
import { vi } from 'vitest';
import { BetStatus, ResolutionType } from '../stores/bets';

export const mockBet = {
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
};

export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({
    data: [mockBet],
    error: null
  }),
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnValue({
      unsubscribe: vi.fn()
    })
  })
};

export const mockAuthStore = {
  subscribe: (cb) => {
    cb({ user: { id: 'user1', username: 'testuser' }, loading: false, error: null });
    return () => {};
  }
};
