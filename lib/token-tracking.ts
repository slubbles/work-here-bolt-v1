import { supabase, isSupabaseAvailable } from './supabase-client';
import { getCurrentUser } from './supabase-client';

/**
 * Save token creation details to Supabase
 */
export async function trackTokenCreation({
  tokenName,
  tokenSymbol,
  network,
  contractAddress,
  description = '',
  totalSupply,
  decimals,
  logoUrl = '',
  website = '',
  github = '',
  twitter = '',
  mintable = false,
  burnable = false,
  pausable = false,
  transactionHash,
  walletAddress,
}: {
  tokenName: string;
  tokenSymbol: string;
  network: string;
  contractAddress: string;
  description?: string;
  totalSupply?: number | string;
  decimals?: number;
  logoUrl?: string;
  website?: string;
  github?: string;
  twitter?: string;
  mintable?: boolean;
  burnable?: boolean;
  pausable?: boolean;
  transactionHash?: string;
  walletAddress: string;
}) {
  if (!isSupabaseAvailable()) {
    console.log('Supabase not available, skipping token tracking');
    return { success: true, message: 'Skipped tracking - Supabase not configured' };
  }
  
  try {
    // Get current user if any
    const { user } = await getCurrentUser();
    
    // Create or get user profile first
    let userId = user?.id;
    
    if (!userId) {
      // If no user is logged in, try to find a profile based on wallet address
      const { data: existingProfiles } = await supabase
        .from('user_profiles')
        .select('user_id')
        .or(`solana_wallet.eq.${walletAddress},algorand_wallet.eq.${walletAddress}`)
        .limit(1);
      
      // If no profile exists with this wallet, create an anonymous profile
      if (!existingProfiles || existingProfiles.length === 0) {
        // Create anonymous profile linked to wallet address
        const networkType = network.includes('solana') ? 'solana' : 'algorand';
        const { data: newProfile, error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            email: null,
            created_at: new Date().toISOString(),
            credits_balance: 10,
            subscription_tier: 'free',
            [`${networkType}_wallet`]: walletAddress
          }])
          .select('user_id');
        
        if (profileError) {
          console.error('Error creating anonymous profile:', profileError);
          // Continue without user_id
        } else if (newProfile && newProfile.length > 0) {
          userId = newProfile[0].user_id;
        }
      } else {
        userId = existingProfiles[0].user_id;
      }
    }
    
    // Insert token creation record
    const { data, error } = await supabase
      .from('token_creation_history')
      .insert([{
        user_id: userId,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        network,
        contract_address: contractAddress,
        description,
        total_supply: totalSupply,
        decimals,
        logo_url: logoUrl,
        website,
        github,
        twitter,
        mintable,
        burnable,
        pausable,
        transaction_hash: transactionHash
      }]);
    
    if (error) throw error;
    
    console.log('Token creation tracked successfully');
    return { success: true, data };
    
  } catch (error) {
    console.error('Error tracking token creation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error tracking token' };
  }
}

/**
 * Get token creation history for current user
 */
export async function getUserTokenHistory(options?: { limit?: number, offset?: number }) {
  if (!isSupabaseAvailable()) {
    return { success: false, message: 'Supabase not configured', data: [] };
  }
  
  try {
    const { user } = await getCurrentUser();
    
    if (!user) {
      return { success: false, message: 'User not authenticated', data: [] };
    }
    
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50)
      .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
    
  } catch (error) {
    console.error('Error getting user token history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting history',
      data: []
    };
  }
}

/**
 * Get token creation history for a wallet address
 */
export async function getWalletTokenHistory(walletAddress: string, options?: { limit?: number, offset?: number }) {
  if (!isSupabaseAvailable() || !walletAddress) {
    return { success: false, message: 'Supabase not configured or invalid wallet', data: [] };
  }
  
  try {
    // First try to find a user profile with this wallet address
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id')
      .or(`solana_wallet.eq.${walletAddress},algorand_wallet.eq.${walletAddress}`)
      .limit(1);
    
    if (!profiles || profiles.length === 0) {
      return { success: false, message: 'No profile found for wallet', data: [] };
    }
    
    const userId = profiles[0].user_id;
    
    // Get token history for this user
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50)
      .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 50) - 1);
    
    if (error) throw error;
    
    return { success: true, data: data || [] };
    
  } catch (error) {
    console.error('Error getting wallet token history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting history',
      data: []
    };
  }
}

/**
 * Get a specific token by contract address
 */
export async function getTokenByAddress(contractAddress: string) {
  if (!isSupabaseAvailable() || !contractAddress) {
    return { success: false, message: 'Supabase not configured or invalid address' };
  }
  
  try {
    const { data, error } = await supabase
      .from('token_creation_history')
      .select('*')
      .eq('contract_address', contractAddress)
      .limit(1)
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
    
  } catch (error) {
    console.error('Error getting token details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error getting token'
    };
  }
}