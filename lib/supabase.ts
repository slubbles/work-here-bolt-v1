import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check for placeholder values and provide a more helpful error message
const isPlaceholderUrl = supabaseUrl?.includes('placeholder') || !supabaseUrl;
const isPlaceholderKey = supabaseAnonKey?.includes('placeholder') || !supabaseAnonKey;

if (isPlaceholderUrl || isPlaceholderKey) {
  console.warn('⚠️ Supabase is not configured with real credentials. Some features may not work.');
  console.warn('To enable Supabase features, update your .env.local file with real Supabase credentials.');
}

// Create Supabase client with fallback values for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

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
  // File Upload Operations
  async checkSupabaseConnection(): Promise<boolean> {
    const isPlaceholderUrl = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');
    const isPlaceholderKey = !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder');
    return !(isPlaceholderUrl || isPlaceholderKey);
  },
  
  async uploadFileToStorage(file: File, bucket: string = 'token-assets', path?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!(await supabaseHelpers.checkSupabaseConnection())) {
        return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
      }
      
      // Generate unique filename if path not provided
      const fileName = path || `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;
      
      // Check if bucket exists and create if needed
      const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
      if (!bucketListError && !buckets.find(b => b.name === bucket)) {
        console.log(`Creating storage bucket: ${bucket}`);
        const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: ['image/*', 'application/json'],
          fileSizeLimit: 5 * 1024 * 1024 // 5MB
        });
        if (createBucketError) {
          console.warn(`Could not create bucket ${bucket}:`, createBucketError.message);
        }
      }
      
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return { 
        success: true, 
        url: urlData.publicUrl 
      };
    } catch (error) {
      console.error('Error in uploadFileToStorage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      };
    }
  },

  async deleteFileFromStorage(fileName: string, bucket: string = 'token-assets'): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(await supabaseHelpers.checkSupabaseConnection())) {
        return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
      }
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('Error deleting file:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteFileFromStorage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Delete failed' 
      };
    }
  },

  // Enhanced upload function for metadata JSON files (ARC-3 compliance)
  async uploadMetadataToStorage(metadata: any, bucket: string = 'token-metadata', fileName?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (!(await supabaseHelpers.checkSupabaseConnection())) {
        return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
      }
      
      // Generate unique filename if not provided
      const finalFileName = fileName || `metadata-${Date.now()}-${Math.random().toString(36).substring(2)}.json`;
      
      // Convert metadata to JSON string
      const metadataJson = JSON.stringify(metadata, null, 2);
      
      // Create blob from JSON string
      const blob = new Blob([metadataJson], { type: 'application/json' });
      
      // Check if bucket exists and create if needed
      const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
      if (!bucketListError && !buckets.find(b => b.name === bucket)) {
        console.log(`Creating storage bucket: ${bucket}`);
        const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
          public: true,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 1024 * 1024 // 1MB
        });
        if (createBucketError) {
          console.warn(`Could not create bucket ${bucket}:`, createBucketError.message);
        }
      }
      
      // Upload blob to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(finalFileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/json'
        });

      if (error) {
        console.error('Error uploading metadata to Supabase:', error);
        
        // Fallback: Use JSONBin.io for metadata hosting
        console.log('Attempting fallback metadata upload to JSONBin.io...');
        try {
          const response = await fetch('https://api.jsonbin.io/v3/b', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bin-Private': 'false'
            },
            body: metadataJson
          });
          
          if (response.ok) {
            const result = await response.json();
            const fallbackUrl = `https://api.jsonbin.io/v3/b/${result.metadata.id}/latest`;
            console.log('✅ Fallback metadata upload successful:', fallbackUrl);
            return { success: true, url: fallbackUrl };
          }
        } catch (fallbackError) {
          console.error('Fallback upload also failed:', fallbackError);
        }
        
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(finalFileName);

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error in uploadMetadataToStorage:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Metadata upload failed' };
    }
  },

  // User Profile Operations
  async createUserProfile(userId: string, email?: string) {
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
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
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
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
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
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
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
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
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
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
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
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
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
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
    const profileResult = await supabaseHelpers.getUserProfile(userId);
    
    if (!profileResult.success) {
      return false;
    }

    const profile = profileResult.data as UserProfile;
    
    // User has advanced features if:
    // 1. They have a pro/premium subscription, OR
    // 2. They have credits remaining (pay-per-use model)
    return profile.subscription_tier !== 'free' || Boolean(profile.credits_balance && profile.credits_balance > 0);
  },

  // Deduct credits for feature usage
  async useCredits(userId: string, amount: number, description: string) {
    // First get current balance
    if (!(await supabaseHelpers.checkSupabaseConnection())) {
      return { success: false, error: 'Supabase not configured. Please set up your .env.local file with real Supabase credentials.' };
    }
    
    const profileResult = await supabaseHelpers.getUserProfile(userId);
    if (!profileResult.success) {
      return { success: false, error: 'Could not fetch user profile' };
    }

    const currentBalance = profileResult.data.credits_balance || 0;
    
    if (currentBalance < amount) {
      return { success: false, error: 'Insufficient credits' };
    }

    const newBalance = currentBalance - amount;

    // Update balance
    const updateResult = await supabaseHelpers.updateUserCredits(userId, newBalance);
    if (!updateResult.success) {
      return updateResult;
    }

    // Record transaction
    const transactionResult = await supabaseHelpers.addCreditTransaction({
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