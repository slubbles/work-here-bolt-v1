import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface UserProfile {
  user_id: string;
  email?: string;
  created_at: string;
  credits_balance?: number;
  subscription_tier?: 'free' | 'pro' | 'premium';
}

export interface TokenCreationHistory {
  id: string;
  user_id: string;
  token_name: string;
  token_symbol: string;
  network: string;
  contract_address: string;
  created_at: string;
  description?: string;
  total_supply?: number;
  decimals?: number;
  logo_url?: string;
  website?: string;
  github?: string;
  twitter?: string;
  mintable?: boolean;
  burnable?: boolean;
  pausable?: boolean;
  transaction_hash?: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  type: 'top_up' | 'usage' | 'refund' | 'bonus';
  amount: number;
  timestamp: string;
  description?: string;
  transaction_reference?: string;
}

// Helper functions for database operations
export const supabaseHelpers = {
  // User Profile Operations
  async createUserProfile(userId: string, email?: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        email: email,
        credits_balance: 10, // Give new users 10 free credits
        subscription_tier: 'free'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  async updateUserCredits(userId: string, newBalance: number) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ credits_balance: newBalance })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user credits:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  // Token Creation History Operations
  async saveTokenCreation(tokenData: Omit<TokenCreationHistory, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('token_creation_history')
      .insert(tokenData)
      .select()
      .single();

    if (error) {
      console.error('Error saving token creation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  async getUserTokenHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching token history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  // Credit Transaction Operations
  async addCreditTransaction(transaction: Omit<CreditTransaction, 'id' | 'timestamp'>) {
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Error adding credit transaction:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  async getUserCreditHistory(userId: string, limit = 100) {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching credit history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  // Advanced Features Check
  async hasAdvancedFeatures(userId: string): Promise<boolean> {
    const profileResult = await this.getUserProfile(userId);
    
    if (!profileResult.success) {
      return false;
    }

    const profile = profileResult.data as UserProfile;
    
    // User has advanced features if:
    // 1. They have a pro/premium subscription, OR
    // 2. They have credits remaining (pay-per-use model)
    return profile.subscription_tier !== 'free' || (profile.credits_balance && profile.credits_balance > 0);
  },

  // Deduct credits for feature usage
  async useCredits(userId: string, amount: number, description: string) {
    // First get current balance
    const profileResult = await this.getUserProfile(userId);
    if (!profileResult.success) {
      return { success: false, error: 'Could not fetch user profile' };
    }

    const currentBalance = profileResult.data.credits_balance || 0;
    
    if (currentBalance < amount) {
      return { success: false, error: 'Insufficient credits' };
    }

    const newBalance = currentBalance - amount;

    // Update balance
    const updateResult = await this.updateUserCredits(userId, newBalance);
    if (!updateResult.success) {
      return updateResult;
    }

    // Record transaction
    const transactionResult = await this.addCreditTransaction({
      user_id: userId,
      type: 'usage',
      amount: -amount, // Negative for usage
      description: description
    });

    return { 
      success: true, 
      newBalance,
      transaction: transactionResult.data 
    };
  }
};

// Authentication helpers
export const authHelpers = {
  // Get current user from Supabase auth
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user };
  },

  // Sign in with email/password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Error signing in:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  },

  // Sign up with email/password
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('Error signing up:', error);
      return { success: false, error: error.message };
    }

    // Create user profile after successful signup
    if (data.user) {
      await supabaseHelpers.createUserProfile(data.user.id, email);
    }

    return { success: true, data };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }
};