import { Connection, PublicKey, ParsedAccountData, TokenAmount } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { connection } from './solana';

// Token account info interface
export interface TokenAccountInfo {
  address: string;
  mint: string;
  owner: string;
  amount: string;
  decimals: number;
  uiAmount: number | null;
}

// Token metadata interface
export interface TokenMetadata {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  verified: boolean;
}

// Enhanced token info combining account and metadata
export interface EnhancedTokenInfo {
  mint: string;
  name: string;
  symbol: string;
  balance: string;
  uiBalance: number;
  decimals: number;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
  value?: string;
  change?: string;
  holders?: number;
  marketCap?: number;
  verified: boolean;
}

// Transaction info interface
export interface TransactionInfo {
  signature: string;
  type: string;
  amount: string;
  token: string;
  timestamp: number;
  status: 'confirmed' | 'finalized' | 'failed';
  from?: string;
  to?: string;
}

// Get all token accounts for a wallet
export async function getUserTokenAccounts(walletAddress: string): Promise<{ success: boolean; data?: TokenAccountInfo[]; error?: string }> {
  try {
    console.log(`🔍 Fetching token accounts for wallet: ${walletAddress}`);
    
    const walletPubkey = new PublicKey(walletAddress);
    
    // Add timeout for the request
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    // Get all token accounts owned by the wallet
    const tokenAccounts = await Promise.race([
      connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      ),
      timeoutPromise
    ]) as any;

    const tokenAccountInfos: TokenAccountInfo[] = tokenAccounts.value
      .filter(account => {
        const parsedInfo = account.account.data as ParsedAccountData;
        const tokenAmount = parsedInfo.parsed.info.tokenAmount as TokenAmount;
        // Only include accounts with non-zero balance
        return tokenAmount.uiAmount && tokenAmount.uiAmount > 0;
      })
      .map(account => {
        const parsedInfo = account.account.data as ParsedAccountData;
        const info = parsedInfo.parsed.info;
        const tokenAmount = info.tokenAmount as TokenAmount;
        
        return {
          address: account.pubkey.toString(),
          mint: info.mint,
          owner: info.owner,
          amount: tokenAmount.amount,
          decimals: tokenAmount.decimals,
          uiAmount: tokenAmount.uiAmount,
        };
      });

    console.log(`✅ Found ${tokenAccountInfos.length} token accounts with balances`);
    
    return {
      success: true,
      data: tokenAccountInfos
    };
  } catch (error) {
    console.error('❌ Error fetching token accounts:', error);
    let errorMessage = 'Failed to fetch token accounts';
    if (error instanceof Error && error.message.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    }
    return {
      success: false,
      error: errorMessage
    };
  }
}

// Get token metadata from various sources
export async function getTokenMetadata(mintAddress: string): Promise<{ success: boolean; data?: TokenMetadata; error?: string }> {
  try {
    console.log(`🔍 Fetching metadata for token: ${mintAddress}`);
    
    // Try multiple metadata sources in order of preference
    
    // 1. Try Jupiter Token List (most reliable for established tokens)
    try {
      const jupiterResponse = await fetch(`https://token.jup.ag/tokens/${mintAddress}`);
      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json();
        
        const metadata: TokenMetadata = {
          mint: mintAddress,
          name: jupiterData.name || 'Unknown Token',
          symbol: jupiterData.symbol || 'UNK',
          description: jupiterData.description || '',
          image: jupiterData.logoURI || '',
          website: jupiterData.extensions?.website,
          twitter: jupiterData.extensions?.twitter,
          verified: jupiterData.verified || false
        };
        
        console.log(`✅ Found metadata via Jupiter: ${metadata.name} (${metadata.symbol})`);
        return { success: true, data: metadata };
      }
    } catch (jupiterError) {
      console.log('Jupiter API not available, trying alternative sources...');
    }
    
    // 2. Try Solana Labs Token List
    try {
      const solanaResponse = await fetch('https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json');
      if (solanaResponse.ok) {
        const solanaTokenList = await solanaResponse.json();
        const tokenInfo = solanaTokenList.tokens.find((token: any) => token.address === mintAddress);
        
        if (tokenInfo) {
          const metadata: TokenMetadata = {
            mint: mintAddress,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            description: tokenInfo.description || '',
            image: tokenInfo.logoURI || '',
            website: tokenInfo.extensions?.website,
            twitter: tokenInfo.extensions?.twitter,
            verified: true // Solana Labs list is considered verified
          };
          
          console.log(`✅ Found metadata via Solana Labs: ${metadata.name} (${metadata.symbol})`);
          return { success: true, data: metadata };
        }
      }
    } catch (solanaError) {
      console.log('Solana Labs token list not available, trying on-chain metadata...');
    }
    
    // 3. Try to get on-chain metadata
    try {
      const mintPubkey = new PublicKey(mintAddress);
      const accountInfo = await connection.getAccountInfo(mintPubkey);
      
      if (accountInfo) {
        // For now, create a basic metadata structure for tokens without external metadata
        const metadata: TokenMetadata = {
          mint: mintAddress,
          name: `Token ${mintAddress.slice(0, 8)}...`,
          symbol: `TKN${mintAddress.slice(-4)}`,
          description: 'Custom token without metadata',
          image: '',
          verified: false
        };
        
        console.log(`✅ Created basic metadata for token: ${metadata.name}`);
        return { success: true, data: metadata };
      }
    } catch (onChainError) {
      console.error('Failed to get on-chain data:', onChainError);
    }
    
    // 4. Fallback: Create minimal metadata
    const fallbackMetadata: TokenMetadata = {
      mint: mintAddress,
      name: `Unknown Token`,
      symbol: 'UNK',
      description: 'Token metadata not available',
      image: '',
      verified: false
    };
    
    console.log(`⚠️ Using fallback metadata for token: ${mintAddress}`);
    return { success: true, data: fallbackMetadata };
    
  } catch (error) {
    console.error('❌ Error fetching token metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch token metadata'
    };
  }
}

// Get enhanced token information (combines account info and metadata)
export async function getEnhancedTokenInfo(walletAddress: string): Promise<{ success: boolean; data?: EnhancedTokenInfo[]; error?: string }> {
  try {
    console.log(`🔍 Getting enhanced token info for wallet: ${walletAddress}`);
    
    // First get all token accounts
    const accountsResult = await getUserTokenAccounts(walletAddress);
    if (!accountsResult.success || !accountsResult.data) {
      return accountsResult;
    }
    
    // Then get metadata for each token
    const enhancedTokens: EnhancedTokenInfo[] = [];
    
    for (const account of accountsResult.data) {
      const metadataResult = await getTokenMetadata(account.mint);
      const metadata = metadataResult.data;
      
      if (metadata) {
        const enhancedToken: EnhancedTokenInfo = {
          mint: account.mint,
          name: metadata.name,
          symbol: metadata.symbol,
          balance: account.amount,
          uiBalance: account.uiAmount || 0,
          decimals: account.decimals,
          description: metadata.description,
          image: metadata.image,
          website: metadata.website,
          twitter: metadata.twitter,
          verified: metadata.verified,
          // Mock some additional data that would come from price APIs
          value: `$${(Math.random() * 1000).toFixed(2)}`,
          change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 20).toFixed(1)}%`,
          holders: Math.floor(Math.random() * 10000) + 100,
        };
        
        enhancedTokens.push(enhancedToken);
      }
    }
    
    console.log(`✅ Enhanced info for ${enhancedTokens.length} tokens`);
    
    return {
      success: true,
      data: enhancedTokens
    };
  } catch (error) {
    console.error('❌ Error getting enhanced token info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get enhanced token info'
    };
  }
}

// Get wallet transaction history
export async function getWalletTransactionHistory(walletAddress: string, limit: number = 50): Promise<{ success: boolean; data?: TransactionInfo[]; error?: string }> {
  try {
    console.log(`🔍 Fetching transaction history for wallet: ${walletAddress}`);
    
    const walletPubkey = new PublicKey(walletAddress);
    
    // Get transaction signatures
    const signatures = await connection.getSignaturesForAddress(walletPubkey, { limit });
    
    // Get transaction details for a subset (to avoid rate limits)
    const transactionInfos: TransactionInfo[] = [];
    const maxTransactionsToProcess = Math.min(signatures.length, 10); // Process max 10 for performance
    
    for (let i = 0; i < maxTransactionsToProcess; i++) {
      const sig = signatures[i];
      
      try {
        const transaction = await connection.getParsedTransaction(sig.signature, 'confirmed');
        
        if (transaction && transaction.meta) {
          // Parse transaction to extract relevant info
          const transactionInfo: TransactionInfo = {
            signature: sig.signature,
            type: 'Transfer', // Simplified - would need more parsing for actual type
            amount: '0', // Would need to parse from transaction details
            token: 'SOL', // Default to SOL, would need parsing for token transfers
            timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
            status: transaction.meta.err ? 'failed' : 'confirmed',
            from: transaction.transaction.message.accountKeys[0]?.pubkey.toString(),
            to: transaction.transaction.message.accountKeys[1]?.pubkey.toString(),
          };
          
          // Try to extract more specific info from token transfers
          if (transaction.meta.preTokenBalances && transaction.meta.postTokenBalances) {
            // This is a token transfer
            const preBalance = transaction.meta.preTokenBalances[0];
            const postBalance = transaction.meta.postTokenBalances[0];
            
            if (preBalance && postBalance) {
              const amountDiff = Math.abs(
                (postBalance.uiTokenAmount.uiAmount || 0) - (preBalance.uiTokenAmount.uiAmount || 0)
              );
              transactionInfo.amount = amountDiff.toString();
              transactionInfo.type = amountDiff > 0 ? 'Receive' : 'Send';
            }
          }
          
          transactionInfos.push(transactionInfo);
        }
      } catch (txError) {
        console.warn(`Failed to parse transaction ${sig.signature}:`, txError);
        // Add basic info even if parsing fails
        transactionInfos.push({
          signature: sig.signature,
          type: 'Transaction',
          amount: '0',
          token: 'SOL',
          timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
          status: sig.err ? 'failed' : 'confirmed',
        });
      }
    }
    
    console.log(`✅ Processed ${transactionInfos.length} transactions`);
    
    return {
      success: true,
      data: transactionInfos
    };
  } catch (error) {
    console.error('❌ Error fetching transaction history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transaction history'
    };
  }
}

// Get SOL balance for wallet
export async function getSOLBalance(walletAddress: string): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const walletPubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(walletPubkey);
    const solBalance = balance / 1000000000; // Convert lamports to SOL
    
    return {
      success: true,
      balance: solBalance
    };
  } catch (error) {
    console.error('❌ Error fetching SOL balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch SOL balance'
    };
  }
}

// Get wallet summary statistics
export async function getWalletSummary(walletAddress: string): Promise<{ 
  success: boolean; 
  data?: {
    totalTokens: number;
    totalValue: number;
    solBalance: number;
    recentTransactions: number;
  }; 
  error?: string;
}> {
  try {
    console.log(`🔍 Getting wallet summary for: ${walletAddress}`);
    
    // Get all data in parallel
    const [tokensResult, solResult, transactionsResult] = await Promise.all([
      getEnhancedTokenInfo(walletAddress),
      getSOLBalance(walletAddress),
      getWalletTransactionHistory(walletAddress, 10)
    ]);
    
    const totalTokens = tokensResult.success && tokensResult.data ? tokensResult.data.length : 0;
    const solBalance = solResult.success && solResult.balance ? solResult.balance : 0;
    const recentTransactions = transactionsResult.success && transactionsResult.data ? transactionsResult.data.length : 0;
    
    // Calculate total value (mock calculation for now)
    let totalValue = solBalance * 100; // Assume SOL = $100 for mock
    if (tokensResult.success && tokensResult.data) {
      totalValue += tokensResult.data.reduce((sum, token) => {
        const value = parseFloat(token.value?.replace('$', '') || '0');
        return sum + value;
      }, 0);
    }
    
    console.log(`✅ Wallet summary: ${totalTokens} tokens, $${totalValue.toFixed(2)} total value`);
    
    return {
      success: true,
      data: {
        totalTokens,
        totalValue,
        solBalance,
        recentTransactions
      }
    };
  } catch (error) {
    console.error('❌ Error getting wallet summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet summary'
    };
  }
}