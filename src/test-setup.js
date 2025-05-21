import { vi } from 'vitest';

// Set up mocks before import
vi.mock('$lib/supabase', async () => {
  const supabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [],
      error: null
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn()
      })
    })
  };
  return { supabase };
});

vi.mock('$lib/stores/auth', async () => {
  const auth = {
    subscribe: (cb) => {
      cb({ user: { id: 'user1', username: 'testuser' }, loading: false, error: null });
      return () => {};
    }
  };
  return { auth };
});
