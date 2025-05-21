// @ts-nocheck
// Mock implementation of auth store
import { vi } from 'vitest';

export const auth = {
	subscribe: (cb) => {
		cb({ user: { id: 'user1', username: 'testuser' }, loading: false, error: null });
		return () => {};
	}
};

export default auth;
