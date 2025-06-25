import algosdk from 'algosdk';

// Algorand network configurations
export const ALGORAND_NETWORKS = {
  'algorand-mainnet': {
    name: 'Algorand Mainnet',
    algodUrl: 'https://mainnet-api.algonode.cloud',
    indexerUrl: 'https://mainnet-idx.algonode.cloud',
    token: '',
    port: '',
    chainId: 416001,
    explorer: 'https://explorer.perawallet.app',
    isMainnet: true,
    color: 'bg-[#00d4aa]'
  },
  'algorand-testnet': {
    name: 'Algorand Testnet',
    algodUrl: 'https://testnet-api.algonode.cloud',
    indexerUrl: 'https://testnet-idx.algonode.cloud',
    token: '',
    port: '',
    chainId: 416002,
    explorer: 'https://testnet.algoexplorer.io',
    isMainnet: false,
    color: 'bg-[#76f935]'
  }
} as const;

export type AlgorandNetworkKey = keyof typeof ALGORAND_NETWORKS;

// Backward compatibility - export as ALGORAND_NETWORK_INFO
export const ALGORAND_NETWORK_INFO = ALGORAND_NETWORKS;

// Get network configuration
export function getAlgorandNetwork(networkKey: string) {
  return ALGORAND_NETWORKS[networkKey as AlgorandNetworkKey] || ALGORAND_NETWORKS['algorand-testnet'];
}

// Get Algorand client for a specific network
export function getAlgorandClient(network: string) {
  const config = getAlgorandNetwork(network);
  return new algosdk.Algodv2(config.token, config.algodUrl, config.port);
}

// Get Algorand Indexer client for a specific network
export function getAlgorandIndexerClient(network: string) {
  const config = getAlgorandNetwork(network);
  return new algosdk.Indexer(config.token, config.indexerUrl, config.port);
}

// Wait for transaction confirmation with retry logic
export async function waitForConfirmationWithRetry(
  algodClient: algosdk.Algodv2,
  txId: string,
  maxRounds: number,
  network: string
): Promise<any> {
  const status = await algodClient.status().do();
  let lastRound = status.lastRound;
  
  while (lastRound < Number(status.lastRound) + maxRounds) {
    try {
      const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo.confirmedRound && pendingInfo.confirmedRound > 0) {
        return pendingInfo;
      }
      
      lastRound++;
      await algodClient.statusAfterBlock(lastRound).do();
    } catch (error) {
      console.error(`Error checking transaction status on ${network}:`, error);
      throw error;
    }
  }
  
  throw new Error(`Transaction not confirmed after ${maxRounds} rounds on ${network}`);
}

// Get account information from Algorand Indexer
export async function getAlgorandAccountInfo(address: string, network: string) {
  try {
    console.log(`📡 Fetching Algorand account info for ${address} on ${network}`);
    
    const indexerClient = getAlgorandIndexerClient(network);
    const accountInfo = await indexerClient.lookupAccountByID(address).do();
    
    if (!accountInfo.account) {
      return {
        success: false,
        error: 'Account not found'
      };
    }

    const account = accountInfo.account;
    const balance = account.amount ? Number(account.amount) / 1000000 : 0; // Convert microAlgos to Algos
    const assets = account.assets || [];
    
    console.log(`✅ Account info loaded: ${balance} ALGO, ${assets.length} assets`);
    
    return {
      success: true,
      balance,
      assets,
      account
    };
  } catch (error) {
    console.error(`❌ Error fetching Algorand account info on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch account info'
    };
  }
}

// Get asset information from Algorand Indexer
export async function getAlgorandAssetInfo(assetId: number, network: string) {
  try {
    console.log(`📡 Fetching Algorand asset info for ${assetId} on ${network}`);
    
    const indexerClient = getAlgorandIndexerClient(network);
    const assetInfo = await indexerClient.lookupAssetByID(assetId).do();
    
    if (!assetInfo.asset) {
      return {
        success: false,
        error: 'Asset not found'
      };
    }

    const asset = assetInfo.asset;
    const params = asset.params;
    
    // Parse metadata if available
    let metadata = {};
    if (params.url) {
      try {
        // Try to fetch metadata from URL (ARC-3 standard)
        const response = await fetch(params.url);
        if (response.ok) {
          metadata = await response.json();
        }
      } catch (err) {
        console.warn('Could not fetch asset metadata:', err);
      }
    }
    
    const assetData = {
      assetId,
      assetName: params.name || 'Unknown Asset',
      unitName: params.unitName || 'UNK',
      totalSupply: params.total || 0,
      decimals: params.decimals || 0,
      creator: params.creator,
      manager: params.manager,
      reserve: params.reserve,
      freeze: params.freeze,
      clawback: params.clawback,
      defaultFrozen: params.defaultFrozen || false,
      url: params.url,
      metadataHash: params.metadataHash,
      metadata
    };
    
    console.log(`✅ Asset info loaded: ${assetData.assetName} (${assetData.unitName})`);
    
    return {
      success: true,
      data: assetData
    };
  } catch (error) {
    console.error(`❌ Error fetching Algorand asset info on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch asset info'
    };
  }
}

// Create Algorand Standard Asset (ASA)
export async function createAlgorandToken(
  creatorAddress: string,
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    decimals: number;
    totalSupply: string;
    logoUrl: string;
    website?: string;
    github?: string;
    twitter?: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
  },
  signTransaction: (txn: any) => Promise<Uint8Array>,
  uploadMetadataToStorage: (metadata: any, bucket?: string, fileName?: string) => Promise<{ success: boolean; url?: string; error?: string }>,
  network: string
) {
  try {
    console.log(`🚀 Creating Algorand token on ${network}`);
    console.log('Token data:', tokenData);
    
    const algodClient = getAlgorandClient(network);
    const networkConfig = getAlgorandNetwork(network);
    
    // Prepare ARC-3 compliant metadata
    const arc3Metadata = {
      name: tokenData.name,
      description: tokenData.description,
      image: tokenData.logoUrl,
      image_integrity: '',
      image_mimetype: 'image/png',
      external_url: tokenData.website || '',
      external_url_integrity: '',
      external_url_mimetype: 'text/html',
      animation_url: '',
      animation_url_integrity: '',
      animation_url_mimetype: '',
      properties: {
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        total_supply: tokenData.totalSupply,
        creator: creatorAddress,
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable,
        website: tokenData.website || '',
        github: tokenData.github || '',
        twitter: tokenData.twitter || '',
        network: network
      }
    };
    
    // Upload metadata to storage
    console.log('📤 Uploading metadata to storage...');
    const metadataUploadResult = await uploadMetadataToStorage(
      arc3Metadata, 
      'algorand-metadata', 
      `${tokenData.symbol.toLowerCase()}-${Date.now()}.json`
    );
    
    if (!metadataUploadResult.success) {
      throw new Error(`Metadata upload failed: ${metadataUploadResult.error}`);
    }
    
    let metadataUrl = metadataUploadResult.url!;
    console.log('✅ Metadata uploaded:', metadataUrl);
    
    // Validate URL length for Algorand compatibility (96 character limit)
    if (metadataUrl.length > 96) {
      console.warn(`⚠️ Metadata URL is ${metadataUrl.length} characters, but Algorand limit is 96. Using truncated URL.`);
      // Use a shorter fallback URL for Algorand compatibility
      const shortUrl = 'https://token.info';
      console.log(`🔧 Using fallback URL: ${shortUrl}`);
      metadataUrl = shortUrl;
    }
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Calculate total supply with decimals using BigInt for safety
    const baseSupply = BigInt(tokenData.totalSupply);
    const decimalsMultiplier = BigInt(Math.pow(10, tokenData.decimals));
    const totalSupplyBigInt = baseSupply * decimalsMultiplier;
    
    // Convert to number and ensure it's within safe limits
    const totalSupplyWithDecimals = Number(totalSupplyBigInt);
    
    // Validate that the number is safe for JavaScript
    if (!Number.isSafeInteger(totalSupplyWithDecimals)) {
      throw new Error(`Total supply ${totalSupplyWithDecimals} exceeds JavaScript's safe integer limit. Please reduce the total supply or decimals.`);
    }
    
    // Set manager addresses based on features
    const managerAddress = tokenData.mintable ? creatorAddress : undefined;
    const reserveAddress = creatorAddress; // Always set reserve to creator
    const freezeAddress = tokenData.pausable ? creatorAddress : undefined;
    const clawbackAddress = tokenData.burnable ? creatorAddress : undefined;
    
    console.log('🔧 Creating asset with parameters:');
    console.log('- Manager (mintable):', managerAddress);
    console.log('- Reserve:', reserveAddress);
    console.log('- Freeze (pausable):', freezeAddress);
    console.log('- Clawback (burnable):', clawbackAddress);
    console.log('- Total supply:', totalSupplyWithDecimals);
    
    // Create asset creation transaction
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      sender: creatorAddress,
      suggestedParams,
      defaultFrozen: false,
      unitName: tokenData.symbol,
      assetName: tokenData.name,
      manager: managerAddress,
      reserve: reserveAddress,
      freeze: freezeAddress,
      clawback: clawbackAddress,
      total: totalSupplyWithDecimals,
      decimals: tokenData.decimals,
      assetURL: metadataUrl,
      assetMetadataHash: undefined, // We could add hash validation here
    });
    
    console.log('📝 Signing transaction...');
    const signedTxn = await signTransaction(assetCreateTxn);
    
    console.log('📡 Sending transaction to network...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for confirmation...');
    let confirmedTxn;
    
    try {
      confirmedTxn = await waitForConfirmationWithRetry(algodClient, txId, 20, network);
    } catch (confirmError) {
      console.error(`❌ Transaction confirmation failed on ${network}:`, confirmError);
      throw new Error(`Transaction submitted but not confirmed on ${network}. Please check the explorer for transaction status. TX ID: ${txId}`);
    }
    
    // Extract asset ID from transaction confirmation with robust fallback logic
    console.log('🔍 Examining confirmed transaction for asset ID...');
    console.log('Confirmed transaction keys:', Object.keys(confirmedTxn));

    // Try multiple ways to extract asset ID from confirmation
    let assetId = confirmedTxn['asset-index'] || 
                  confirmedTxn.assetIndex || 
                  confirmedTxn['created-asset-index'] ||
                  confirmedTxn.createdAssetIndex ||
                  confirmedTxn['inner-txns']?.[0]?.['asset-index'];

    // For asset creation transactions, the asset ID might be in different locations
    if (!assetId && confirmedTxn.txn) {
      assetId = confirmedTxn.txn['asset-index'] || 
                confirmedTxn.txn.assetIndex ||
                confirmedTxn.txn['created-asset-index'];
    }

    // Check in global-state-delta or logs
    if (!assetId && confirmedTxn['global-state-delta']) {
      const deltaEntries = confirmedTxn['global-state-delta'];
      for (const entry of deltaEntries) {
        if (entry.key === 'asset-id' || entry.key === 'assetId') {
          assetId = entry.value?.uint || entry.value?.bytes;
          break;
        }
      }
    }

    // If still not found, try to get it by looking at the transaction result
    if (!assetId && confirmedTxn.confirmedRound) {
      console.log('🔍 Attempting to retrieve asset ID from account assets...');
      
      try {
        // First try the indexer for more recent data
        const indexerClient = getAlgorandIndexerClient(network);
        
        // Look up the transaction to get asset ID
        try {
          const txnInfo = await indexerClient.lookupTransactionByID(txId).do();
          if (txnInfo.transaction && txnInfo.transaction['created-asset-index']) {
            assetId = txnInfo.transaction['created-asset-index'];
            console.log('✅ Found asset ID from indexer transaction lookup:', assetId);
          }
        } catch (indexerError) {
          console.log('Indexer lookup failed, trying account info...');
          
          // Fallback to account info
          const accountInfo = await algodClient.accountInformation(creatorAddress).do();
          const assets = accountInfo.createdAssets || [];
          
          if (assets.length > 0) {
            // Get the asset with the highest ID (most recently created)
            const latestAsset = assets.reduce((prev: any, current: any) => 
              (current.index > prev.index) ? current : prev
            );
            assetId = latestAsset.index;
            console.log('✅ Found asset ID from account assets:', assetId);
          }
        }
      } catch (accountError) {
        console.warn('Could not retrieve account info for asset ID lookup:', accountError);
      }
    }

    if (!assetId) {
      console.error('❌ Asset ID not found in confirmed transaction');
      console.error('Full transaction details:', JSON.stringify(confirmedTxn, null, 2));
      throw new Error(`Asset creation transaction confirmed (TX: ${txId}) but asset ID could not be extracted. Please check the ${networkConfig.explorer}/tx/${txId} for the asset details.`);
    }
    
    console.log(`✅ Token created successfully on ${network}!`);
    console.log('- Transaction ID:', txId);
    console.log('- Asset ID:', assetId);
    
    const explorerUrl = `${networkConfig.explorer}/asset/${assetId}`;
    
    return {
      success: true,
      transactionId: txId,
      assetId: assetId,
      details: {
        network: network,
        explorerUrl: explorerUrl,
        metadataUrl: metadataUrl,
        createdAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error(`❌ Error creating Algorand token on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create token'
    };
  }
}

// Opt-in to an Algorand asset
export async function optInToAsset(
  address: string,
  assetId: number,
  signTransaction: (txn: any) => Promise<Uint8Array>,
  network: string
) {
  try {
    console.log(`🔗 Opting in to asset ${assetId} on ${network}`);
    
    const algodClient = getAlgorandClient(network);
    
    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create opt-in transaction (asset transfer of 0 to self)
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: address,
      receiver: address,
      assetIndex: assetId,
      amount: 0,
      suggestedParams
    });
    
    console.log('📝 Signing opt-in transaction...');
    const signedTxn = await signTransaction(optInTxn);
    
    console.log('📡 Sending opt-in transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid;
    
    console.log('⏳ Waiting for opt-in confirmation...');
    await waitForConfirmationWithRetry(algodClient, txId, 10, network);
    
    console.log(`✅ Successfully opted in to asset ${assetId}`);
    
    return {
      success: true,
      transactionId: txId
    };
    
  } catch (error) {
    console.error(`❌ Error opting in to asset on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to opt-in to asset'
    };
  }
}

// Check wallet connection and balance
export async function checkWalletConnection(address: string, network: string) {
  try {
    const accountInfo = await getAlgorandAccountInfo(address, network);
    
    if (!accountInfo.success) {
      return {
        success: false,
        error: accountInfo.error
      };
    }
    
    const balance = accountInfo.balance || 0;
    const networkConfig = getAlgorandNetwork(network);
    
    // Minimum balance required for token creation (account minimum + transaction fees)
    const minimumRequired = networkConfig.isMainnet ? 0.202 : 0.101; // MainNet requires more ALGO
    const canCreateToken = balance >= minimumRequired;
    
    return {
      success: true,
      balance,
      canCreateToken,
      recommendedBalance: minimumRequired,
      network: networkConfig.name
    };
    
  } catch (error) {
    console.error(`❌ Error checking wallet connection on ${network}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check wallet connection'
    };
  }
}

// Get platform stats (mock data for now)
export async function getAlgorandPlatformStats() {
  // In a real implementation, this would query the Algorand blockchain
  // or a backend service for actual platform statistics
  return {
    success: true,
    data: {
      totalTokens: 1247,
      totalUsers: 423,
      totalValueLocked: 15000,
      successRate: 98.5
    }
  };
}

// Format Algorand address for display
export function formatAlgorandAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Validate Algorand address
export function isValidAlgorandAddress(address: string): boolean {
  try {
    return algosdk.isValidAddress(address);
  } catch {
    return false;
  }
}

// Convert microAlgos to Algos
export function microAlgosToAlgos(microAlgos: number): number {
  return microAlgos / 1000000;
}

// Convert Algos to microAlgos
export function algosToMicroAlgos(algos: number): number {
  return algos * 1000000;
}