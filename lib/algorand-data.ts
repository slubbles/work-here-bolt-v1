import { getAlgorandAccountInfo, getAlgorandAssetInfo, getAlgorandIndexerClient, getAlgorandNetwork } from './algorand';

// Enhanced token info interface for Algorand
export interface AlgorandTokenInfo {
  assetId: number;
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
  creator?: string;
  manager?: string;
  freeze?: string;
  clawback?: string;
  reserve?: string;
  defaultFrozen?: boolean;
  isFrozen?: boolean;
  explorerUrl: string;
}

// Transaction info interface for Algorand
export interface AlgorandTransactionInfo {
  id: string;
  type: string;
  amount: string;
  token: string;
  timestamp: number;
  status: 'confirmed' | 'pending' | 'failed';
  from?: string;
  to?: string;
  note?: string;
  fee?: number;
}

// Get enhanced token information for Algorand wallet
export async function getAlgorandEnhancedTokenInfo(walletAddress: string, network: string): Promise<{ success: boolean; data?: AlgorandTokenInfo[]; error?: string }> {
  try {
    console.log(`🔍 Fetching Algorand token info for wallet: ${walletAddress} on ${network}`);
    
    // Get account information
    const accountResult = await getAlgorandAccountInfo(walletAddress, network);
    if (!accountResult.success || !accountResult.assets) {
      console.log('No assets found in wallet');
      return { success: true, data: [] };
    }

    const networkConfig = getAlgorandNetwork(network);
    const enhancedTokens: AlgorandTokenInfo[] = [];

    // Process each asset
    for (const asset of accountResult.assets) {
      if (asset.amount && asset.amount > 0) {
        try {
          // Handle BigInt asset IDs properly
          const rawAssetId = (asset as any)['asset-id'];
          const assetId = typeof rawAssetId === 'bigint' ? Number(rawAssetId) : rawAssetId;
          
          // Skip if asset ID is too large for safe conversion
          if (typeof rawAssetId === 'bigint' && rawAssetId > Number.MAX_SAFE_INTEGER) {
            console.warn(`Asset ID ${rawAssetId} is too large to process safely`);
            continue;
          }
          
          // Get asset details
          const assetResult = await getAlgorandAssetInfo(assetId, network);

          console.log(`Asset info result for ${assetId}:`, assetResult);
          
          if (assetResult && assetResult.success && assetResult.data) {
            const assetData = assetResult.data;
            const uiBalance = Number(asset.amount) / Math.pow(10, assetData.decimals || 0);
            
            const tokenInfo: AlgorandTokenInfo = {
              assetId: assetId,
              name: assetData.assetName || `Asset ${(asset as any)['asset-id']}`,
              symbol: assetData.unitName || 'ASA',
              balance: asset.amount.toString(),
              uiBalance: uiBalance,
              decimals: assetData.decimals || 0,
              description: (assetData.metadata as any)?.description || '',
              image: (assetData.metadata as any)?.image || '',
              website: (assetData.metadata as any)?.external_url,
              creator: assetData.creator,
              manager: assetData.manager,
              freeze: assetData.freeze,
              clawback: assetData.clawback,
              reserve: assetData.reserve,
              defaultFrozen: assetData.defaultFrozen || false,
              isFrozen: false, // This would need an account-specific check
              verified: true, // All found assets are considered verified
              explorerUrl: `${networkConfig.explorer}/asset/${assetId}`,
              // Mock some additional data for demo purposes
              value: `$${(Math.random() * 100).toFixed(2)}`,
              change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%`,
              holders: Math.floor(Math.random() * 1000) + 50,
              marketCap: Math.floor(Math.random() * 100000) + 10000,
            };
            
            enhancedTokens.push(tokenInfo);
          }
        } catch (assetError) {
          console.warn(`Failed to get details for asset ${(asset as any)['asset-id']}:`, assetError);
          // Continue with next asset
        }
      }
    }

    console.log(`✅ Processed ${enhancedTokens.length} Algorand assets`);
    return { success: true, data: enhancedTokens };

  } catch (error) {
    console.error('❌ Error fetching Algorand token info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Algorand token info'
    };
  }
}

// Get Algorand transaction history
export async function getAlgorandTransactionHistory(walletAddress: string, limit: number = 20, network: string): Promise<{ success: boolean; data?: AlgorandTransactionInfo[]; error?: string }> {
  try {
    console.log(`🔍 Fetching Algorand transaction history for: ${walletAddress}`);
    
    const indexerClient = getAlgorandIndexerClient(network);
    
    // Get recent transactions
    const transactionResponse = await indexerClient
      .lookupAccountTransactions(walletAddress)
      .limit(limit)
      .do();

    const transactions: AlgorandTransactionInfo[] = [];

    if (transactionResponse.transactions) {
      transactionResponse.transactions.forEach((tx: any) => {
        try {
          const txInfo: AlgorandTransactionInfo = {
            id: tx.id,
            type: getTransactionType(tx),
            amount: getTransactionAmount(tx),
            token: getTransactionToken(tx),
            timestamp: tx['round-time'] ? tx['round-time'] * 1000 : Date.now(),
            status: tx['confirmed-round'] ? 'confirmed' : 'pending',
            from: tx.sender,
            to: getTransactionReceiver(tx),
            note: tx.note ? Buffer.from(tx.note, 'base64').toString() : undefined,
            fee: tx.fee || 0,
          };
          
          transactions.push(txInfo);
        } catch (txError) {
          console.warn('Failed to parse transaction:', txError);
        }
      });
    }

    console.log(`✅ Fetched ${transactions.length} Algorand transactions`);
    return { success: true, data: transactions };

  } catch (error) {
    console.error('❌ Error fetching Algorand transaction history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transaction history'
    };
  }
}

// Get Algorand wallet summary
export async function getAlgorandWalletSummary(walletAddress: string, network: string): Promise<{ 
  success: boolean; 
  data?: {
    totalTokens: number;
    totalValue: number;
    algoBalance: number;
    recentTransactions: number;
  }; 
  error?: string;
}> {
  try {
    console.log(`🔍 Getting Algorand wallet summary for: ${walletAddress}`);
    
    // Get account info and transaction data in parallel
    const [accountResult, tokensResult, transactionsResult] = await Promise.allSettled([
      getAlgorandAccountInfo(walletAddress, network),
      getAlgorandEnhancedTokenInfo(walletAddress, network),
      getAlgorandTransactionHistory(walletAddress, 10, network)
    ]);
    
    let algoBalance = 0;
    if (accountResult.status === 'fulfilled' && accountResult.value.success) {
      algoBalance = accountResult.value.balance || 0;
    }
    
    let totalTokens = 0;
    let totalValue = algoBalance * 0.175; // More accurate ALGO price (~$0.175)
    if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
      totalTokens = tokensResult.value.data.length;
      // Add mock value for tokens
      totalValue += tokensResult.value.data.reduce((sum, token) => {
        const value = parseFloat(token.value?.replace('$', '') || '0');
        return sum + value;
      }, 0);
    }
    
    let recentTransactions = 0;
    if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success && transactionsResult.value.data) {
      recentTransactions = transactionsResult.value.data.length;
    }
    
    const summary = {
      totalTokens,
      totalValue,
      algoBalance,
      recentTransactions
    };
    
    console.log(`✅ Algorand wallet summary:`, summary);
    
    return { success: true, data: summary };

  } catch (error) {
    console.error('❌ Error getting Algorand wallet summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet summary'
    };
  }
}

// Real market data integration
export async function getAlgorandMarketData(): Promise<{
  success: boolean;
  data?: {
    algoPrice: number;
    priceChange24h: number;
    marketCap: number;
    volume24h: number;
  };
  error?: string;
}> {
  try {
    // Use CoinGecko API for real market data
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=algorand&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
    
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }
    
    const data = await response.json();
    const algorandData = data.algorand;
    
    if (!algorandData) {
      throw new Error('Algorand data not available');
    }
    
    return {
      success: true,
      data: {
        algoPrice: algorandData.usd || 0,
        priceChange24h: algorandData.usd_24h_change || 0,
        marketCap: algorandData.usd_market_cap || 0,
        volume24h: algorandData.usd_24h_vol || 0
      }
    };
  } catch (error) {
    console.error('❌ Error fetching Algorand market data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch market data'
    };
  }
}

// Enhanced wallet summary with real portfolio values
export async function getAlgorandWalletSummaryWithMarketData(walletAddress: string, network: string): Promise<{ 
  success: boolean; 
  data?: {
    totalTokens: number;
    totalValue: number;
    algoBalance: number;
    algoValueUSD: number;
    recentTransactions: number;
    portfolioChange24h: number;
  }; 
  error?: string;
}> {
  try {
    console.log(`🔍 Getting enhanced Algorand wallet summary for: ${walletAddress}`);
    
    // Get basic wallet summary and market data in parallel
    const [summaryResult, marketResult] = await Promise.allSettled([
      getAlgorandWalletSummary(walletAddress, network),
      getAlgorandMarketData()
    ]);
    
    let basicSummary = {
      totalTokens: 0,
      totalValue: 0,
      algoBalance: 0,
      recentTransactions: 0
    };
    
    if (summaryResult.status === 'fulfilled' && summaryResult.value.success) {
      basicSummary = summaryResult.value.data!;
    }
    
    let marketData = {
      algoPrice: 0.175, // Fallback price
      priceChange24h: 0
    };
    
    if (marketResult.status === 'fulfilled' && marketResult.value.success) {
      marketData = {
        algoPrice: marketResult.value.data!.algoPrice,
        priceChange24h: marketResult.value.data!.priceChange24h
      };
    }
    
    const algoValueUSD = basicSummary.algoBalance * marketData.algoPrice;
    const portfolioChange24h = (algoValueUSD * marketData.priceChange24h) / 100;
    
    return {
      success: true,
      data: {
        ...basicSummary,
        algoValueUSD,
        portfolioChange24h,
        totalValue: algoValueUSD + basicSummary.totalValue // Add token values
      }
    };
  } catch (error) {
    console.error('❌ Error getting enhanced wallet summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get enhanced wallet summary'
    };
  }
}

// Get asset creation history for a wallet
export async function getAlgorandAssetCreationHistory(walletAddress: string, network: string): Promise<{
  success: boolean;
  data?: Array<{
    assetId: number;
    name: string;
    symbol: string;
    totalSupply: number;
    decimals: number;
    createdAt: string;
    transactionId: string;
    explorerUrl: string;
  }>;
  error?: string;
}> {
  try {
    console.log(`🔍 Fetching asset creation history for: ${walletAddress} on ${network}`);
    
    const indexerClient = getAlgorandIndexerClient(network);
    const networkConfig = getAlgorandNetwork(network);
    
    // Get all transactions for the account where they created assets
    const transactions = await indexerClient
      .lookupAccountTransactions(walletAddress)
      .txType('acfg') // Asset configuration transactions (includes creation)
      .do();
    
    const createdAssets: Array<{
      assetId: number;
      name: string;
      symbol: string;
      totalSupply: number;
      decimals: number;
      createdAt: string;
      transactionId: string;
      explorerUrl: string;
    }> = [];
    
    for (const tx of transactions.transactions || []) {
      // Check if this is an asset creation transaction (not modification)
      const assetConfigTx = (tx as any)['asset-config-transaction'];
      if (assetConfigTx && assetConfigTx['asset-id'] === 0) { // 0 means creation
        
        const params = assetConfigTx.params;
        
        if (params && tx.id) {
          const createdAsset = {
            assetId: (tx as any)['created-asset-index'] || 0,
            name: params['name'] || 'Unknown Asset',
            symbol: params['unit-name'] || 'UNK',
            totalSupply: params['total'] || 0,
            decimals: params['decimals'] || 0,
            createdAt: new Date(((tx as any)['round-time'] || 0) * 1000).toISOString(),
            transactionId: tx.id,
            explorerUrl: `${networkConfig.explorer}/asset/${(tx as any)['created-asset-index'] || 0}`
          };
          
          createdAssets.push(createdAsset);
        }
      }
    }
    
    // Sort by creation date (newest first)
    createdAssets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`✅ Found ${createdAssets.length} created assets`);
    
    return {
      success: true,
      data: createdAssets
    };
  } catch (error) {
    console.error('❌ Error fetching asset creation history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch asset creation history'
    };
  }
}

// Helper functions for transaction parsing
function getTransactionType(tx: any): string {
  if (tx['tx-type'] === 'pay') return 'Payment';
  if (tx['tx-type'] === 'axfer') return 'Asset Transfer';
  if (tx['tx-type'] === 'acfg') return 'Asset Config';
  if (tx['tx-type'] === 'afrz') return 'Asset Freeze';
  if (tx['tx-type'] === 'appl') return 'Application Call';
  return 'Transaction';
}

function getTransactionAmount(tx: any): string {
  if (tx['payment-transaction']) {
    return (tx['payment-transaction'].amount / 1000000).toString(); // Convert microAlgos to Algos
  }
  if (tx['asset-transfer-transaction']) {
    return tx['asset-transfer-transaction'].amount?.toString() || '0';
  }
  return '0';
}

function getTransactionToken(tx: any): string {
  if (tx['payment-transaction']) {
    return 'ALGO';
  }
  if (tx['asset-transfer-transaction']) {
    return `Asset ${tx['asset-transfer-transaction']['asset-id']}`;
  }
  return 'ALGO';
}

function getTransactionReceiver(tx: any): string | undefined {
  if (tx['payment-transaction']) {
    return tx['payment-transaction'].receiver;
  }
  if (tx['asset-transfer-transaction']) {
    return tx['asset-transfer-transaction'].receiver;
  }
  return undefined;
}

// Helper to format transaction for display
export function formatAlgorandTransactionForDisplay(tx: AlgorandTransactionInfo) {
  const timeAgo = new Date(tx.timestamp).toLocaleDateString();
  
  return {
    type: tx.type,
    amount: `${tx.amount} ${tx.token}`,
    to: tx.to ? `${tx.to.slice(0, 4)}...${tx.to.slice(-4)}` : 'Unknown',
    time: timeAgo,
    status: tx.status === 'confirmed' ? 'Completed' : tx.status === 'failed' ? 'Failed' : 'Pending'
  };
}