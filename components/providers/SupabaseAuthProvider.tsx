'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  supabase, 
  getCurrentUser, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  isSupabaseAvailable 
} from '@/lib/supabase-client';

type SupabaseAuthContextType = {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false);

  useEffect(() => {
    // Check if Supabase is configured
    setIsSupabaseConfigured(isSupabaseAvailable());

    // Only set up auth state if Supabase is configured
    if (!isSupabaseAvailable()) {
      setIsLoading(false);
      return;
    }

    // Initial session check
    const initializeAuth = async () => {
      try {
        const { user: currentUser, session: currentSession } = await getCurrentUser();
        setUser(currentUser);
        setSession(currentSession);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    if (isSupabaseAvailable()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session);
          setUser(session?.user || null);
        }
      );

      // Cleanup subscription
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseAvailable()) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'An error occurred during sign in' 
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseAvailable()) {
      return { success: false, error: 'Supabase is not configured' };
    }

    try {
      const { data, error } = await signUpWithEmail(email, password);
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'An error occurred during sign up' 
      };
    }
  };

  const logout = async () => {
    if (!isSupabaseAvailable()) return;
    
    try {
      await signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshSession = async () => {
    if (!isSupabaseAvailable()) return;
    
    try {
      const { user: currentUser, session: currentSession } = await getCurrentUser();
      setUser(currentUser);
      setSession(currentSession);
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isSupabaseConfigured,
    signIn,
    signUp,
    logout,
    refreshSession,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};