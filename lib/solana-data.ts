import { Connection, PublicKey, ParsedAccountData, TokenAmount } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { connection } from './solana';
import { getTokenMarketData, getTokenMetrics, TokenMarketData, TokenMetrics } from './market-data';

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
  marketData?: TokenMarketData;
  metrics?: TokenMetrics;
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
  txFee?: number;
  usdValue?: number;
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
        };
        
        // Get real market data
        try {
          const marketResult = await getTokenMarketData(account.mint);
          if (marketResult.success && marketResult.data) {
            enhancedToken.marketData = marketResult.data;
            enhancedToken.value = marketResult.data.price > 0 
              ? `$${(marketResult.data.price * enhancedToken.uiBalance).toFixed(2)}`
              : 'N/A';
            enhancedToken.change = `${marketResult.data.priceChange24h >= 0 ? '+' : ''}${marketResult.data.priceChange24h.toFixed(1)}%`;
            enhancedToken.holders = marketResult.data.holders;
          } else {
            // Fallback to placeholder data
            enhancedToken.value = 'N/A';
            enhancedToken.change = '0.0%';
            enhancedToken.holders = 0;
          }
          
          // Get token metrics
          const metricsResult = await getTokenMetrics(account.mint);
          if (metricsResult.success && metricsResult.data) {
            enhancedToken.metrics = metricsResult.data;
          }
        } catch (marketError) {
          console.warn(`Failed to get market data for ${account.mint}:`, marketError);
          // Use fallback data
          enhancedToken.value = 'N/A';
          enhancedToken.change = '0.0%';
          enhancedToken.holders = 0;
        }
        
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
    
    // Process transactions with proper rate limiting
    const transactionInfos: TransactionInfo[] = [];
    const maxTransactionsToProcess = Math.min(signatures.length, 15); // Limit to 15 for production performance
    
    for (let i = 0; i < maxTransactionsToProcess; i++) {
      const sig = signatures[i];
      
      try {
        const transaction = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (transaction && transaction.meta) {
          // Create transaction info object with careful error handling
          let transactionInfo: TransactionInfo = {
            signature: sig.signature,
            type: determineTransactionType(transaction),
            amount: '0', // Would need to parse from transaction details
            token: 'SOL', // Default to SOL, would need parsing for token transfers
            timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
            status: transaction.meta.err ? 'failed' : 'confirmed',
            from: transaction.transaction.message.accountKeys[0]?.pubkey.toString(),
            to: transaction.transaction.message.accountKeys[1]?.pubkey.toString(),
            txFee: transaction.meta.fee / 1000000000, // Convert lamports to SOL
          };
          
          // Try to extract more specific info from token transfers
          if (transaction.meta.preTokenBalances && transaction.meta.postTokenBalances) {
            const preBalance = transaction.meta.preTokenBalances[0];
            const postBalance = transaction.meta.postTokenBalances[0];
            
            if (preBalance && postBalance) {
              const amountDiff = Math.abs(
                (postBalance.uiTokenAmount.uiAmount || 0) - (preBalance.uiTokenAmount.uiAmount || 0)
              );
              transactionInfo.amount = amountDiff.toString();
              transactionInfo.type = getTransactionDirection(transaction, walletAddress);
              transactionInfo.token = `Token`;
            }
          }
          
          // Extract SOL transfer amount
          if (transaction.meta.preBalances && transaction.meta.postBalances) {
            try {
              const preBalance = transaction.meta.preBalances[0] || 0;
              const postBalance = transaction.meta.postBalances[0] || 0;
              const solDiff = Math.abs(postBalance - preBalance) / 1000000000; // Convert to SOL
            
              if (solDiff > 0.001) { // Only count significant SOL transfers
                transactionInfo.amount = solDiff.toFixed(4);
                transactionInfo.token = 'SOL';
              }
            } catch (balanceError) {
              console.warn('Error extracting balance change:', balanceError);
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

// Helper function to determine transaction type
function determineTransactionType(transaction: any): string {
  const instructions = transaction.transaction.message.instructions;
  
  for (const instruction of instructions) {
    if (instruction.programId) {
      const programId = instruction.programId.toString();
      
      // Token program transactions
      if (programId === TOKEN_PROGRAM_ID.toString()) {
        return 'Token Transfer';
      }
      
      // System program transactions (SOL transfers)
      if (programId === '11111111111111111111111111111112') {
        return 'SOL Transfer';
      }
      
      // Common DEX programs
      if (programId.includes('Jupiter') || programId.includes('Raydium')) {
        return 'Swap';
      }
    }
  }
  
  return 'Transaction';
}

// Helper function to determine transaction direction
function getTransactionDirection(transaction: any, walletAddress: string): string {
  const accountKeys = transaction.transaction.message.accountKeys;
  const walletPubkey = new PublicKey(walletAddress);
  
  if (accountKeys.length > 0) {
    return accountKeys[0].pubkey.equals(walletPubkey) ? 'Send' : 'Receive';
  }
  
  return 'Transfer';
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
    
    // Calculate total value using real market data
    let totalValue = solBalance * 100; // Default SOL price estimation
    if (tokensResult.success && tokensResult.data) {
      totalValue += tokensResult.data.reduce((sum, token) => {
        if (token.marketData && token.marketData.price > 0) {
          return sum + (token.marketData.price * token.uiBalance);
        }
        return sum;
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

// Get real-time token holder information
export async function getTokenHolders(mintAddress: string): Promise<{ 
  success: boolean; 
  data?: {
    totalHolders: number;
    topHolders: Array<{
      address: string;
      balance: number;
      percentage: number;
    }>;
  }; 
  error?: string;
}> {
  try {
    console.log(`👥 Fetching token holders for: ${mintAddress}`);
    
    const mintPubkey = new PublicKey(mintAddress);
    
    // Get all token accounts for this mint
    const tokenAccounts = await connection.getProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          { dataSize: 165 }, // Token account size
          { memcmp: { offset: 0, bytes: mintAddress } } // Filter by mint
        ]
      }
    );
    
    // Parse account data to get balances
    const holders = tokenAccounts
      .map(account => {
        const data = account.account.data;
        if (data.length >= 72) {
          const balance = Number(data.readBigUInt64LE(64));
          const owner = new PublicKey(data.slice(32, 64));
          
          return {
            address: owner.toString(),
            balance: balance,
            account: account.pubkey.toString()
          };
        }
        return null;
      })
      .filter(holder => holder && holder.balance > 0) // Filter out zero balances
      .sort((a, b) => (b?.balance || 0) - (a?.balance || 0)); // Sort by balance desc
    
    // Calculate percentages
    const totalSupply = holders.reduce((sum, holder) => sum + (holder?.balance || 0), 0);
    
    const topHolders = holders.slice(0, 10).map(holder => ({
      address: holder?.address || '',
      balance: holder?.balance || 0,
      percentage: totalSupply > 0 ? ((holder?.balance || 0) / totalSupply) * 100 : 0
    }));
    
    console.log(`✅ Found ${holders.length} token holders`);
    
    return {
      success: true,
      data: {
        totalHolders: holders.length,
        topHolders
      }
    };
    
  } catch (error) {
    console.error('❌ Error fetching token holders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch token holders'
    };
  }
}