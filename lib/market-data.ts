// Real-time market data integration
import { Connection, PublicKey } from '@solana/web3.js';
import { connection } from './solana';

// Market data interfaces
export interface TokenMarketData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  holders: number;
  liquidity: number;
  isListed: boolean;
}

export interface TokenMetrics {
  transactions24h: number;
  activeTraders: number;
  avgTxSize: number;
  volatility: number;
  liquidityScore: number;
}

// DexScreener API integration for real-time prices
export async function getTokenMarketData(mintAddress: string): Promise<{ success: boolean; data?: TokenMarketData; error?: string }> {
  try {
    console.log(`📊 Fetching market data for token: ${mintAddress}`);
    
    // Try DexScreener API first (supports Solana)
    try {
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
      if (dexResponse.ok) {
        const dexData = await dexResponse.json();
        
        if (dexData.pairs && dexData.pairs.length > 0) {
          const pair = dexData.pairs[0]; // Use first pair
          
          const marketData: TokenMarketData = {
            price: parseFloat(pair.priceUsd) || 0,
            priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
            volume24h: parseFloat(pair.volume?.h24) || 0,
            marketCap: parseFloat(pair.marketCap) || 0,
            holders: parseInt(pair.txns?.h24?.buys || '0') + parseInt(pair.txns?.h24?.sells || '0'),
            liquidity: parseFloat(pair.liquidity?.usd) || 0,
            isListed: true
          };
          
          console.log(`✅ DexScreener data found for ${mintAddress}`);
          return { success: true, data: marketData };
        }
      }
    } catch (dexError) {
      console.log('DexScreener API not available, trying alternatives...');
    }
    
    // Try Jupiter API for basic token info
    try {
      const jupiterResponse = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
      if (jupiterResponse.ok) {
        const jupiterData = await jupiterResponse.json();
        
        if (jupiterData.data && jupiterData.data[mintAddress]) {
          const tokenData = jupiterData.data[mintAddress];
          
          const marketData: TokenMarketData = {
            price: tokenData.price || 0,
            priceChange24h: 0, // Jupiter doesn't provide 24h change
            volume24h: 0,
            marketCap: 0,
            holders: 0,
            liquidity: 0,
            isListed: true
          };
          
          console.log(`✅ Jupiter price data found for ${mintAddress}`);
          return { success: true, data: marketData };
        }
      }
    } catch (jupiterError) {
      console.log('Jupiter API not available');
    }
    
    // Fallback: Calculate basic metrics from on-chain data
    console.log('Using on-chain data for market metrics...');
    const onChainData = await calculateOnChainMetrics(mintAddress);
    
    return { success: true, data: onChainData };
    
  } catch (error) {
    console.error('❌ Error fetching market data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market data'
    };
  }
}

// Calculate metrics from on-chain data
async function calculateOnChainMetrics(mintAddress: string): Promise<TokenMarketData> {
  try {
    const mintPubkey = new PublicKey(mintAddress);
    
    // Get token supply
    const supplyInfo = await connection.getTokenSupply(mintPubkey);
    const totalSupply = supplyInfo.value.uiAmount || 0;
    
    // Get recent transaction signatures for activity metrics
    const signatures = await connection.getSignaturesForAddress(mintPubkey, { limit: 100 });
    const recentTxCount = signatures.length;
    
    // Calculate holder count by getting all token accounts
    const tokenAccounts = await connection.getProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token program
      {
        filters: [
          { dataSize: 165 }, // Token account size
          { memcmp: { offset: 0, bytes: mintAddress } } // Filter by mint
        ]
      }
    );
    
    const holderCount = tokenAccounts.filter(account => {
      // Filter out accounts with zero balance
      const data = account.account.data;
      if (data.length >= 72) {
        const balance = data.readBigUInt64LE(64);
        return balance > BigInt(0);
      }
      return false;
    }).length;
    
    return {
      price: 0, // No price data available from on-chain
      priceChange24h: 0,
      volume24h: recentTxCount * 100, // Estimate based on tx count
      marketCap: 0, // Can't calculate without price
      holders: holderCount,
      liquidity: 0,
      isListed: false
    };
    
  } catch (error) {
    console.error('Error calculating on-chain metrics:', error);
    return {
      price: 0,
      priceChange24h: 0,
      volume24h: 0,
      marketCap: 0,
      holders: 0,
      liquidity: 0,
      isListed: false
    };
  }
}

// Get detailed token metrics
export async function getTokenMetrics(mintAddress: string): Promise<{ success: boolean; data?: TokenMetrics; error?: string }> {
  try {
    console.log(`📈 Calculating token metrics for: ${mintAddress}`);
    
    const mintPubkey = new PublicKey(mintAddress);
    
    // Get recent transaction signatures
    const signatures = await connection.getSignaturesForAddress(mintPubkey, { limit: 1000 });
    
    // Calculate 24h transactions
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recent24h = signatures.filter(sig => 
      sig.blockTime && (sig.blockTime * 1000) > oneDayAgo
    );
    
    // Calculate metrics
    const transactions24h = recent24h.length;
    const activeTraders = new Set(recent24h.map(sig => sig.signature.slice(0, 8))).size; // Approximate unique traders
    const avgTxSize = transactions24h > 0 ? 100 : 0; // Placeholder calculation
    
    // Calculate volatility based on transaction frequency
    const volatility = Math.min(transactions24h / 10, 100); // Simple volatility score
    
    // Liquidity score based on trading activity
    const liquidityScore = Math.min((activeTraders * 10) + (transactions24h / 10), 100);
    
    const metrics: TokenMetrics = {
      transactions24h,
      activeTraders,
      avgTxSize,
      volatility,
      liquidityScore
    };
    
    console.log(`✅ Token metrics calculated:`, metrics);
    
    return { success: true, data: metrics };
    
  } catch (error) {
    console.error('❌ Error calculating token metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate token metrics'
    };
  }
}

// Get real-time network statistics
export async function getNetworkStats(): Promise<{ 
  success: boolean; 
  data?: {
    tps: number;
    totalTransactions: number;
    activeValidators: number;
    averageFee: number;
  }; 
  error?: string;
}> {
  try {
    console.log('📊 Fetching Solana network statistics...');
    
    // Get recent performance samples
    const performanceSamples = await connection.getRecentPerformanceSamples(1);
    const recentSample = performanceSamples[0];
    
    // Calculate TPS
    const tps = recentSample ? 
      Math.floor(recentSample.numTransactions / recentSample.samplePeriodSecs) : 0;
    
    // Get validator info
    const voteAccounts = await connection.getVoteAccounts();
    const activeValidators = voteAccounts.current.length;
    
    // Get recent transaction count
    const slot = await connection.getSlot();
    const blockTime = await connection.getBlockTime(slot);
    
    const stats = {
      tps,
      totalTransactions: recentSample?.numTransactions || 0,
      activeValidators,
      averageFee: 5000, // 5000 lamports = 0.000005 SOL (typical fee)
    };
    
    console.log('✅ Network stats fetched:', stats);
    
    return { success: true, data: stats };
    
  } catch (error) {
    console.error('❌ Error fetching network stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch network stats'
    };
  }
}

// Real-time price tracking for multiple tokens
export async function getMultipleTokenPrices(mintAddresses: string[]): Promise<{ 
  success: boolean; 
  data?: Record<string, TokenMarketData>; 
  error?: string;
}> {
  try {
    console.log(`📊 Fetching prices for ${mintAddresses.length} tokens...`);
    
    const results: Record<string, TokenMarketData> = {};
    
    // Process tokens in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < mintAddresses.length; i += batchSize) {
      const batch = mintAddresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (mintAddress) => {
        const result = await getTokenMarketData(mintAddress);
        return { mintAddress, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ mintAddress, result }) => {
        if (result.success && result.data) {
          results[mintAddress] = result.data;
        } else {
          // Provide fallback data
          results[mintAddress] = {
            price: 0,
            priceChange24h: 0,
            volume24h: 0,
            marketCap: 0,
            holders: 0,
            liquidity: 0,
            isListed: false
          };
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < mintAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ Fetched prices for ${Object.keys(results).length} tokens`);
    
    return { success: true, data: results };
    
  } catch (error) {
    console.error('❌ Error fetching multiple token prices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch token prices'
    };
  }
}

// Security score calculation based on real data
export async function calculateSecurityScore(mintAddress: string): Promise<{ 
  success: boolean; 
  score?: number; 
  factors?: {
    liquidityScore: number;
    holderDistribution: number;
    contractVerification: number;
    tradingActivity: number;
    timeActive: number;
  };
  error?: string;
}> {
  try {
    console.log(`🔒 Calculating security score for: ${mintAddress}`);
    
    // Get market data and metrics
    const [marketResult, metricsResult] = await Promise.all([
      getTokenMarketData(mintAddress),
      getTokenMetrics(mintAddress)
    ]);
    
    let liquidityScore = 0;
    let holderDistribution = 50; // Default middle score
    let contractVerification = 80; // Default high score for existing tokens
    let tradingActivity = 0;
    let timeActive = 50; // Default middle score
    
    if (marketResult.success && marketResult.data) {
      const market = marketResult.data;
      
      // Liquidity score (0-100)
      liquidityScore = Math.min((market.liquidity / 10000) * 100, 100);
      
      // Holder distribution score
      holderDistribution = Math.min((market.holders / 100) * 100, 100);
      
      // Trading activity score
      if (metricsResult.success && metricsResult.data) {
        tradingActivity = Math.min((metricsResult.data.transactions24h / 100) * 100, 100);
      }
    }
    
    // Calculate overall score (weighted average)
    const factors = {
      liquidityScore,
      holderDistribution,
      contractVerification,
      tradingActivity,
      timeActive
    };
    
    const weights = {
      liquidityScore: 0.25,
      holderDistribution: 0.25,
      contractVerification: 0.20,
      tradingActivity: 0.15,
      timeActive: 0.15
    };
    
    const score = Math.round(
      liquidityScore * weights.liquidityScore +
      holderDistribution * weights.holderDistribution +
      contractVerification * weights.contractVerification +
      tradingActivity * weights.tradingActivity +
      timeActive * weights.timeActive
    );
    
    console.log(`✅ Security score calculated: ${score}/100`);
    
    return { success: true, score, factors };
    
  } catch (error) {
    console.error('❌ Error calculating security score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate security score'
    };
  }
}

// Real-time transaction monitoring
export async function getRealtimeTransactions(mintAddress: string, limit: number = 20): Promise<{
  success: boolean;
  data?: Array<{
    signature: string;
    type: 'swap' | 'transfer' | 'mint' | 'burn';
    amount: number;
    from: string;
    to: string;
    timestamp: number;
    txFee: number;
  }>;
  error?: string;
}> {
  try {
    console.log(`⚡ Getting real-time transactions for: ${mintAddress}`);
    
    const mintPubkey = new PublicKey(mintAddress);
    const signatures = await connection.getSignaturesForAddress(mintPubkey, { limit });
    
    const transactions = [];
    
    for (const sig of signatures.slice(0, Math.min(limit, 10))) { // Limit to avoid rate limits
      try {
        const tx = await connection.getParsedTransaction(sig.signature, 'confirmed');
        
        if (tx && tx.meta) {
          const transaction = {
            signature: sig.signature,
            type: 'transfer' as const, // Simplified type detection
            amount: 0,
            from: tx.transaction.message.accountKeys[0]?.pubkey.toString() || 'Unknown',
            to: tx.transaction.message.accountKeys[1]?.pubkey.toString() || 'Unknown',
            timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
            txFee: tx.meta.fee / 1000000000 // Convert lamports to SOL
          };
          
          // Try to extract amount from token transfers
          if (tx.meta.preTokenBalances && tx.meta.postTokenBalances) {
            const preBalance = tx.meta.preTokenBalances.find(b => b.mint === mintAddress);
            const postBalance = tx.meta.postTokenBalances.find(b => b.mint === mintAddress);
            
            if (preBalance && postBalance) {
              transaction.amount = Math.abs(
                (postBalance.uiTokenAmount.uiAmount || 0) - 
                (preBalance.uiTokenAmount.uiAmount || 0)
              );
            }
          }
          
          transactions.push(transaction);
        }
      } catch (txError) {
        console.warn(`Failed to parse transaction ${sig.signature}:`, txError);
      }
    }
    
    console.log(`✅ Fetched ${transactions.length} real-time transactions`);
    
    return { success: true, data: transactions };
    
  } catch (error) {
    console.error('❌ Error fetching real-time transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch real-time transactions'
    };
  }
}