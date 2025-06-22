import algosdk from 'algosdk';

// Network Configuration
export interface AlgorandNetworkConfig {
  name: string;
  chainId: number;
  nodeUrl: string;
  indexerUrl: string;
  explorer: string;
  isMainnet: boolean;
}

export const ALGORAND_NETWORKS: Record<string, AlgorandNetworkConfig> = {
  'algorand-testnet': {
    name: 'Algorand TestNet',
    chainId: 416002,
    nodeUrl: 'https://testnet-api.algonode.cloud',
    indexerUrl: 'https://testnet-idx.algonode.cloud',
    explorer: 'https://testnet.explorer.perawallet.app',
    isMainnet: false
  },
  'algorand-mainnet': {
    name: 'Algorand MainNet',
    chainId: 416001,
    nodeUrl: 'https://mainnet-api.algonode.cloud',
    indexerUrl: 'https://mainnet-idx.algonode.cloud', 
    explorer: 'https://explorer.perawallet.app',
    isMainnet: true
  }
};

// Default to testnet for backward compatibility
export const ALGORAND_NETWORK_INFO = ALGORAND_NETWORKS['algorand-testnet'];

// Get network configuration
export function getAlgorandNetwork(network: string = 'algorand-testnet'): AlgorandNetworkConfig {
  return ALGORAND_NETWORKS[network] || ALGORAND_NETWORKS['algorand-testnet'];
}

// Create algod client for specific network
export function createAlgodClient(network: string = 'algorand-testnet') {
  const config = getAlgorandNetwork(network);
  return new algosdk.Algodv2('', config.nodeUrl, '');
}

// Create indexer client for specific network
export function createIndexerClient(network: string = 'algorand-testnet') {
  const config = getAlgorandNetwork(network);
  return new algosdk.Indexer('', config.indexerUrl, '');
}

// Network-aware function to get account information
export async function getAlgorandAccountInfo(
  walletAddress: string, 
  network: string = 'algorand-testnet'
): Promise<{ success: boolean; balance?: number; assets?: any[]; error?: string }> {
  try {
    console.log(`Getting account info for ${walletAddress} on ${network}`);
    
    const algodClient = createAlgodClient(network);
    const accountInfo = await algodClient.accountInformation(walletAddress).do();
    
    const balance = accountInfo.amount / 1000000; // Convert microAlgos to Algos
    const assets = accountInfo.assets || [];
    
    console.log(`Account balance: ${balance} ALGO, Assets: ${assets.length}`);
    
    return {
      success: true,
      balance,
      assets
    };
  } catch (error) {
    console.error(`Error getting account info on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get account information'
    };
  }
}

// Network-aware function to get asset information
export async function getAlgorandAssetInfo(
  assetId: number,
  network: string = 'algorand-testnet'
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log(`Getting asset info for asset ${assetId} on ${network}`);
    
    const algodClient = createAlgodClient(network);
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    
    const processedData = {
      assetId: assetInfo.index,
      assetName: assetInfo.params.name || '',
      unitName: assetInfo.params['unit-name'] || '',
      totalSupply: assetInfo.params.total,
      decimals: assetInfo.params.decimals || 0,
      creator: assetInfo.params.creator,
      manager: assetInfo.params.manager,
      reserve: assetInfo.params.reserve,
      freeze: assetInfo.params.freeze,
      clawback: assetInfo.params.clawback,
      defaultFrozen: assetInfo.params['default-frozen'] || false,
      url: assetInfo.params.url || '',
      metadata: null // Will be populated if URL points to metadata
    };

    // Try to fetch metadata if URL exists
    if (processedData.url) {
      try {
        const response = await fetch(processedData.url);
        if (response.ok) {
          const metadata = await response.json();
          processedData.metadata = metadata;
        }
      } catch (metadataError) {
        console.warn('Could not fetch asset metadata:', metadataError);
      }
    }
    
    return {
      success: true,
      data: processedData
    };
  } catch (error) {
    console.error(`Error getting asset info on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get asset information'
    };
  }
}

// Network-aware function to check wallet connection status
export async function checkWalletConnection(
  walletAddress: string,
  network: string = 'algorand-testnet'
): Promise<{ 
  balance: number; 
  canCreateToken: boolean; 
  recommendedBalance: number;
  error?: string;
}> {
  try {
    const accountInfo = await getAlgorandAccountInfo(walletAddress, network);
    
    if (!accountInfo.success) {
      throw new Error(accountInfo.error);
    }
    
    const balance = accountInfo.balance || 0;
    const networkConfig = getAlgorandNetwork(network);
    
    // Different minimum balance requirements for mainnet vs testnet
    const recommendedBalance = networkConfig.isMainnet ? 0.5 : 0.1; // ALGO
    const canCreateToken = balance >= recommendedBalance;
    
    return {
      balance,
      canCreateToken,
      recommendedBalance
    };
  } catch (error) {
    console.error(`Error checking wallet connection on ${network}:`, error);
    return {
      balance: 0,
      canCreateToken: false,
      recommendedBalance: 0.1,
      error: error instanceof Error ? error.message : 'Failed to check wallet connection'
    };
  }
}

// Network-aware token creation function
export async function createAlgorandToken(
  walletAddress: string,
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    totalSupply: string;
    logoUrl?: string;
    website?: string;
    github?: string;
    twitter?: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
  },
  signTransaction: (txn: any) => Promise<any>,
  uploadMetadata: (metadata: any) => Promise<{ success: boolean; url?: string; error?: string }>,
  network: string = 'algorand-testnet'
): Promise<{ 
  success: boolean; 
  assetId?: number; 
  transactionId?: string; 
  error?: string; 
  details?: any;
}> {
  try {
    console.log(`Creating token on ${network}`);
    const networkConfig = getAlgorandNetwork(network);
    const algodClient = createAlgodClient(network);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate total supply with decimals
    const totalSupplyWithDecimals = BigInt(
      Math.floor(parseFloat(tokenData.totalSupply) * Math.pow(10, tokenData.decimals))
    );
    
    // Create ARC-3 compliant metadata
    const metadata = {
      name: tokenData.name,
      description: tokenData.description,
      image: tokenData.logoUrl || '',
      decimals: tokenData.decimals,
      symbol: tokenData.symbol,
      properties: {
        website: tokenData.website || '',
        github: tokenData.github || '',
        twitter: tokenData.twitter || '',
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable,
        network: network,
        created_with: 'Snarbles Token Platform'
      }
    };
    
    // Upload metadata and get URL
    let metadataUrl = '';
    if (uploadMetadata) {
      const uploadResult = await uploadMetadata(metadata);
      if (uploadResult.success && uploadResult.url) {
        metadataUrl = uploadResult.url;
      }
    }
    
    // Prepare asset creation parameters
    const assetParams: any = {
      sender: walletAddress,
      suggestedParams: suggestedParams,
      assetName: tokenData.name,
      unitName: tokenData.symbol,
      total: Number(totalSupplyWithDecimals),
      decimals: tokenData.decimals,
      defaultFrozen: false,
      url: metadataUrl
    };
    
    // Set management addresses based on features
    if (tokenData.mintable || tokenData.burnable) {
      assetParams.manager = walletAddress;
      assetParams.reserve = walletAddress;
    }
    
    if (tokenData.pausable) {
      assetParams.freeze = walletAddress;
    }
    
    // Create the transaction
    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject(assetParams);
    
    // Sign the transaction
    const signedTxn = await signTransaction(txn);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    // Get the asset ID
    const assetId = confirmedTxn['asset-index'];
    
    if (!assetId) {
      throw new Error('Asset creation failed - no asset ID returned');
    }
    
    console.log(`✓ Token created successfully on ${network}:`, {
      assetId,
      transactionId: txId,
      explorerUrl: `${networkConfig.explorer}/asset/${assetId}`
    });
    
    return {
      success: true,
      assetId: assetId,
      transactionId: txId,
      details: {
        explorerUrl: `${networkConfig.explorer}/asset/${assetId}`,
        metadataUrl: metadataUrl,
        network: network
      }
    };
  } catch (error) {
    console.error(`Error creating token on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token creation failed'
    };
  }
}

// Network-aware opt-in function
export async function optInToAsset(
  walletAddress: string,
  assetId: number,
  signTransaction: (txn: any) => Promise<any>,
  network: string = 'algorand-testnet'
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    console.log(`Opting in to asset ${assetId} on ${network}`);
    const algodClient = createAlgodClient(network);
    
    // Get suggested parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create opt-in transaction
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      receiver: walletAddress,
      assetIndex: assetId,
      amount: 0,
      suggestedParams: suggestedParams
    });
    
    // Sign the transaction
    const signedTxn = await signTransaction(txn);
    
    // Submit the transaction
    const { txId } = await algodClient.sendRawTransaction(signedTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    console.log(`✓ Successfully opted in to asset ${assetId} on ${network}`);
    
    return {
      success: true,
      transactionId: txId
    };
  } catch (error) {
    console.error(`Error opting in to asset on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Opt-in failed'
    };
  }
}

// Get platform statistics (network-aware)
export async function getAlgorandPlatformStats(network: string = 'algorand-testnet') {
  try {
    // This would typically query your backend or indexer for platform-specific stats
    // For now, returning mock data that varies by network
    const networkConfig = getAlgorandNetwork(network);
    
    const mockStats = {
      totalTokens: networkConfig.isMainnet ? 1247 : 892,
      totalVolume: networkConfig.isMainnet ? '$125,000' : '$45,000',
      activeUsers: networkConfig.isMainnet ? 2156 : 1024,
      network: network
    };
    
    return {
      success: true,
      data: mockStats
    };
  } catch (error) {
    console.error(`Error getting platform stats for ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get platform stats'
    };
  }
}

// Export network info for backward compatibility
export { ALGORAND_NETWORK_INFO };