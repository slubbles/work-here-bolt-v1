import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase credentials are placeholders or missing
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder');

// Create Supabase client with proper error handling
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient('https://placeholder.supabase.co', 'placeholder-anon-key');

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseAvailable(): boolean {
  return isSupabaseConfigured;
}

/**
 * Check current authentication status
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return { user: null, session: null };
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: { session } } = await supabase.auth.getSession();
    return { user, session };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, session: null };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not configured' };
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { data: null, error: error.message || 'An error occurred while signing in' };
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase is not configured' };
  }
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { data: null, error: error.message || 'An error occurred while signing up' };
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  if (!isSupabaseConfigured) return { error: null };
  
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error: error.message || 'An error occurred while signing out' };
  }
}

/**
 * Link a wallet address to the current user
 */
export async function linkWalletToUser(walletAddress: string, walletType: 'solana' | 'algorand') {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured' };
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        [`${walletType}_wallet`]: walletAddress,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error linking wallet:', error);
    return { error: error.message || 'An error occurred while linking wallet' };
  }
}

/**
 * Initialize storage buckets if they don't exist
 */
export async function initializeStorageBuckets() {
  if (!isSupabaseConfigured) return { success: false };
  
  const buckets = ['token-logos', 'token-metadata'];
  let success = true;
  
  for (const bucket of buckets) {
    try {
      // Check if bucket exists by trying to get its public URL
      const { data } = await supabase.storage.getBucket(bucket);
      
      if (!data) {
        // Create bucket if it doesn't exist
        await supabase.storage.createBucket(bucket, {
          public: true, // Make bucket public
          fileSizeLimit: 1024 * 1024 * 5, // 5MB limit
        });
        console.log(`Created bucket: ${bucket}`);
      }
    } catch (error) {
      console.error(`Error initializing bucket ${bucket}:`, error);
      success = false;
    }
  }
  
  return { success };
}

/**
 * Get Supabase status and configuration info
 */
export async function getSupabaseStatus() {
  if (!isSupabaseConfigured) {
    return {
      isConfigured: false,
      buckets: [],
      auth: { enabled: false },
      message: 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
    };
  }
  
  try {
    // Check auth status
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check storage buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    
    return {
      isConfigured: true,
      url: supabaseUrl,
      buckets: buckets || [],
      auth: {
        enabled: true,
        currentUser: user
      },
      message: 'Supabase is configured correctly.'
    };
  } catch (error) {
    console.error('Error checking Supabase status:', error);
    return {
      isConfigured: true,
      url: supabaseUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Supabase is configured but encountered an error.'
    };
  }
}