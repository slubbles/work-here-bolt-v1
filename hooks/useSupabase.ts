import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, supabaseHelpers, authHelpers, UserProfile } from '@/lib/supabase';

// Custom hook for Supabase authentication
export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          const profileResult = await supabaseHelpers.getUserProfile(session.user.id);
          if (profileResult.success) {
            setUserProfile(profileResult.data);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile when user signs in
        const profileResult = await supabaseHelpers.getUserProfile(session.user.id);
        if (profileResult.success) {
          setUserProfile(profileResult.data);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authHelpers.signIn(email, password);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authHelpers.signUp(email, password);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authHelpers.signOut();
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const profileResult = await supabaseHelpers.getUserProfile(user.id);
      if (profileResult.success) {
        setUserProfile(profileResult.data);
      }
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAuthenticated: !!user,
    hasAdvancedFeatures: userProfile?.subscription_tier !== 'free' || (userProfile?.credits_balance && userProfile.credits_balance > 0)
  };
}

// Custom hook for token creation history
export function useTokenHistory() {
  const { user } = useSupabaseAuth();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await supabaseHelpers.getUserTokenHistory(user.id);
      if (result.success) {
        setTokens(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token history');
    } finally {
      setLoading(false);
    }
  };

  const saveToken = async (tokenData: any) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await supabaseHelpers.saveTokenCreation({
        user_id: user.id,
        ...tokenData
      });
      
      if (result.success) {
        // Refresh the token list
        await fetchTokenHistory();
      }
      
      return result;
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to save token' 
      };
    }
  };

  useEffect(() => {
    if (user) {
      fetchTokenHistory();
    }
  }, [user]);

  return {
    tokens,
    loading,
    error,
    fetchTokenHistory,
    saveToken
  };
}

// Custom hook for credit management
export function useCredits() {
  const { user, userProfile, refreshProfile } = useSupabaseAuth();
  const [creditHistory, setCreditHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await supabaseHelpers.getUserCreditHistory(user.id);
      if (result.success) {
        setCreditHistory(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credit history');
    } finally {
      setLoading(false);
    }
  };

  const useCredits = async (amount: number, description: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const result = await supabaseHelpers.useCredits(user.id, amount, description);
      
      if (result.success) {
        // Refresh profile and credit history
        await refreshProfile();
        await fetchCreditHistory();
      }
      
      return result;
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to use credits' 
      };
    }
  };

  const addCredits = async (amount: number, description: string, reference?: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      // Add transaction record
      const transactionResult = await supabaseHelpers.addCreditTransaction({
        user_id: user.id,
        type: 'top_up',
        amount: amount,
        description: description,
        transaction_reference: reference
      });

      if (transactionResult.success) {
        // Update user balance
        const currentBalance = userProfile?.credits_balance || 0;
        const newBalance = currentBalance + amount;
        
        const updateResult = await supabaseHelpers.updateUserCredits(user.id, newBalance);
        
        if (updateResult.success) {
          await refreshProfile();
          await fetchCreditHistory();
          return { success: true, newBalance };
        }
      }
      
      return { success: false, error: 'Failed to add credits' };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add credits' 
      };
    }
  };

  useEffect(() => {
    if (user) {
      fetchCreditHistory();
    }
  }, [user]);

  return {
    creditBalance: userProfile?.credits_balance || 0,
    creditHistory,
    loading,
    error,
    fetchCreditHistory,
    useCredits,
    addCredits,
    hasCredits: (userProfile?.credits_balance || 0) > 0
  };
}