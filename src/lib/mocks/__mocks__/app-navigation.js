// src/lib/mocks/__mocks__/app-navigation.js
import { vi } from 'vitest';

export const goto = vi.fn();
export const beforeNavigate = vi.fn();
export const afterNavigate = vi.fn();
