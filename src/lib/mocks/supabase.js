// Mock Supabase implementation
import { vi } from 'vitest';

let _returnValue = Promise.resolve({ data: [], error: null });

function createChainableMock() {
  let shouldReturnValue = false;
  const chain = {
    from: vi.fn(() => chain),
    select: vi.fn(() => { shouldReturnValue = true; return chain; }),
    insert: vi.fn(() => { shouldReturnValue = true; return chain; }),
    update: vi.fn(() => { shouldReturnValue = true; return chain; }),
    eq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => { shouldReturnValue = true; return chain; }),
    delete: vi.fn(() => { shouldReturnValue = true; return chain; }),
    channel: vi.fn(() => ({
      on: vi.fn(() => chain),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
    })),
    /**
     * @param {...any} args
     */
    then: (...args) => {
      if (shouldReturnValue) {
        return Promise.resolve(_returnValue).then(...args);
      }
      // If not a terminal call, just return a pending promise
      return Promise.resolve().then(...args);
    },
    /**
     * @param {...any} args
     */
    catch: (...args) => {
      if (shouldReturnValue) {
        return Promise.resolve(_returnValue).catch(...args);
      }
      return Promise.resolve().catch(...args);
    }
  };
  return chain;
}

export let supabase = createChainableMock();

/**
 * @param {any} val
 */
export function setSupabaseReturnValue(val) {
  _returnValue = val;
  supabase = createChainableMock();
}
