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
          // Get asset details
          const assetResult = await getAlgorandAssetInfo(asset['asset-id'], network);

          console.log(`Asset info result for ${asset['asset-id']}:`, assetResult);

          console.log(`Asset info result for ${asset['asset-id']}:`, assetResult);
          
          if (assetResult && assetResult.success && assetResult.data) {
            const assetData = assetResult.data;
            const uiBalance = asset.amount / Math.pow(10, assetData.decimals || 0);
            
            const tokenInfo: AlgorandTokenInfo = {
              assetId: asset['asset-id'],
              name: assetData.assetName || `Asset ${asset['asset-id']}`,
              symbol: assetData.unitName || 'ASA',
              balance: asset.amount.toString(),
              uiBalance: uiBalance,
              decimals: assetData.decimals || 0,
              description: assetData.metadata?.description || '',
              image: assetData.metadata?.image || '',
              website: assetData.metadata?.external_url,
              creator: assetData.creator,
              manager: assetData.manager,
              verified: true, // All found assets are considered verified
              explorerUrl: `${networkConfig.explorer}/asset/${asset['asset-id']}`,
              // Mock some additional data for demo purposes
              value: `$${(Math.random() * 100).toFixed(2)}`,
              change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 10).toFixed(1)}%`,
              holders: Math.floor(Math.random() * 1000) + 50,
              marketCap: Math.floor(Math.random() * 100000) + 10000,
            };
            
            enhancedTokens.push(tokenInfo);
          }
        } catch (assetError) {
          console.warn(`Failed to get details for asset ${asset['asset-id']}:`, assetError);
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
    let totalValue = algoBalance * 0.5; // Mock ALGO price
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

// Get account assets by ID (for newly created assets)
export async function getAccountAssetById(
  walletAddress: string, 
  assetId: number, 
  network: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`🔍 Looking for asset ${assetId} in wallet ${walletAddress}`);
    
    // Get account information
    const accountResult = await getAlgorandAccountInfo(walletAddress, network);
    if (!accountResult.success || !accountResult.assets) {
      return { success: false, error: 'Unable to fetch account information' };
    }

    // Find the specific asset
    const asset = accountResult.assets.find(a => a['asset-id'] === assetId);
    if (!asset) {
      return { 
        success: false, 
        error: `Asset ${assetId} not found in account. You might need to opt-in first.` 
      };
    }
    
    // Get detailed asset info
    const assetResult = await getAlgorandAssetInfo(assetId, network);
    if (!assetResult.success || !assetResult.data) {
      return { 
        success: false, 
        error: `Asset found in account but unable to get details: ${assetResult.error || 'Unknown error'}` 
      };
    }
    
    const assetData = assetResult.data;
    const uiBalance = asset.amount / Math.pow(10, assetData.decimals || 0);
    
    const tokenInfo: AlgorandTokenInfo = {
      assetId: assetId,
      name: assetData.assetName || `Asset ${assetId}`,
      symbol: assetData.unitName || 'ASA',
      balance: asset.amount.toString(),
      uiBalance: uiBalance,
      decimals: assetData.decimals || 0,
      description: assetData.metadata?.description || '',
      image: assetData.metadata?.image || '',
      website: assetData.metadata?.external_url,
      creator: assetData.creator,
      manager: assetData.manager,
      verified: true,
      explorerUrl: `${getAlgorandNetwork(network).explorer}/asset/${assetId}`,
      value: `$${(Math.random() * 10).toFixed(2)}`, // Placeholder value
      change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(1)}%`, // Placeholder change
    };
    
    return { success: true, data: tokenInfo };

  } catch (error) {
    console.error('Error getting account asset by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get asset information'
    };
  }
}

// Get account assets by ID (for newly created assets)
export async function getAccountAssetById(
  walletAddress: string, 
  assetId: number, 
  network: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`🔍 Looking for asset ${assetId} in wallet ${walletAddress}`);
    
    // Get account information
    const accountResult = await getAlgorandAccountInfo(walletAddress, network);
    if (!accountResult.success || !accountResult.assets) {
      return { success: false, error: 'Unable to fetch account information' };
    }

    // Find the specific asset
    const asset = accountResult.assets.find(a => a['asset-id'] === assetId);
    if (!asset) {
      return { 
        success: false, 
        error: `Asset ${assetId} not found in account. You might need to opt-in first.` 
      };
    }
    
    // Get detailed asset info
    const assetResult = await getAlgorandAssetInfo(assetId, network);
    if (!assetResult.success || !assetResult.data) {
      return { 
        success: false, 
        error: `Asset found in account but unable to get details: ${assetResult.error || 'Unknown error'}` 
      };
    }
    
    const assetData = assetResult.data;
    const uiBalance = asset.amount / Math.pow(10, assetData.decimals || 0);
    
    const tokenInfo: AlgorandTokenInfo = {
      assetId: assetId,
      name: assetData.assetName || `Asset ${assetId}`,
      symbol: assetData.unitName || 'ASA',
      balance: asset.amount.toString(),
      uiBalance: uiBalance,
      decimals: assetData.decimals || 0,
      description: assetData.metadata?.description || '',
      image: assetData.metadata?.image || '',
      website: assetData.metadata?.external_url,
      creator: assetData.creator,
      manager: assetData.manager,
      verified: true,
      explorerUrl: `${getAlgorandNetwork(network).explorer}/asset/${assetId}`,
      value: `$${(Math.random() * 10).toFixed(2)}`, // Placeholder value
      change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 5).toFixed(1)}%`, // Placeholder change
    };
    
    return { success: true, data: tokenInfo };

  } catch (error) {
    console.error('Error getting account asset by ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get asset information'
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