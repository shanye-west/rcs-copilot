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
      update(state => ({ ...state, error: null, loading: true }));
      
      try {
        console.log(`Attempting login for: ${username}`);
        const email = `${username}@rowdycup.app`;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pin
        });
        
        if (error) {
          console.error("Sign in error:", error);
          throw error;
        }
        
        console.log("Sign in success:", data);
        
        if (data.user) {
          // Fetch player profile
          const { data: player, error: profileError } = await supabase
            .from('players')
            .select('*')
            .eq('id', data.user.id)
            .single();
          
          if (profileError) {
            console.error("Profile fetch error:", profileError);
            throw profileError;
          }
          
          // Set user state
          set({
            user: {
              id: player.id,
              username: player.username,
              fullName: player.full_name,
              isAdmin: player.is_admin
            },
            loading: false,
            error: null
          });
          
          return { success: true };
        } else {
          throw new Error("User data not returned from authentication");
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
      
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data?.session?.user) {
          console.log("Found session for user:", data.session.user.id);
          
          // Fetch player details
          const { data: playerData, error: playerError } = await supabase
            .from('players')
            .select('*')
            .eq('id', data.session.user.id)
            .single();
            
          if (playerError) {
            console.error("Error fetching player:", playerError);
            throw playerError;
          }
          
          if (playerData) {
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
        
        // If we get here, no valid session or player data
        set({ user: null, loading: false, error: null });
      } catch (err) {
        console.error("Session check error:", err);
        set({ user: null, loading: false, error: null });
      }
    }
  };
};

export const auth = createAuthStore();

// Initialize session check
auth.checkSession();