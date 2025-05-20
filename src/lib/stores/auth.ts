import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import { goto } from '$app/navigation';

// Define types
type User = {
  id: string;
  username: string;
  fullName: string;
  isAdmin: boolean;
};

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

// Create the store with initial state
const createAuthStore = () => {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  return {
    subscribe,
    login: async (username: string, pin: string) => {
      // Reset error state
      update(state => ({ ...state, error: null, loading: true }));
      
      try {
        // Convert username to email format for Supabase auth
        const email = `${username}@rowdycup.app`;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pin
        });
        
        if (error) throw error;
        
        if (data?.user) {
          // Fetch player details from our players table
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
          if (playerError) throw playerError;
          
          set({
            user: {
              id: playerData.id,
              username: playerData.username,
              fullName: playerData.full_name,
              isAdmin: playerData.is_admin
            },
            loading: false,
            error: null
          });
          
          return { success: true };
        }
      } catch (err: any) {
        update(state => ({ 
          ...state, 
          error: err.message || 'Login failed',
          loading: false
        }));
        return { success: false, message: err.message };
      }
    },
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error logging out:', error);
      set({ user: null, loading: false, error: null });
      goto('/');
    },
    checkSession: async () => {
      update(state => ({ ...state, loading: true }));
      
      const { data } = await supabase.auth.getSession();
      
      if (data?.session?.user) {
        // Fetch player details
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
          
        if (!playerError && playerData) {
          set({
            user: {
              id: playerData.id,
              username: playerData.username,
              fullName: playerData.full_name,
              isAdmin: playerData.is_admin
            },
            loading: false,
            error: null
          });
          return;
        }
      }
      
      set({ user: null, loading: false, error: null });
    }
  };
};

export const auth = createAuthStore();

// Initialize session check
auth.checkSession();