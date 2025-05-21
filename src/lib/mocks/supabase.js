// Mock Supabase implementation
import { vi } from 'vitest';

export const supabase = {
	from: vi.fn().mockReturnThis(),
	select: vi.fn().mockReturnThis(),
	insert: vi.fn().mockReturnThis(),
	update: vi.fn().mockReturnThis(),
	eq: vi.fn().mockReturnThis(),
	or: vi.fn().mockReturnThis(),
	order: vi.fn().mockReturnThis(),
	delete: vi.fn().mockReturnThis(),
	channel: vi.fn().mockReturnValue({
		on: vi.fn().mockReturnThis(),
		subscribe: vi.fn().mockReturnValue({
			unsubscribe: vi.fn()
		})
	})
};
