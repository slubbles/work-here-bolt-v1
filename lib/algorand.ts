import algosdk from 'algosdk';

// Algorand TestNet configuration
export const ALGORAND_TESTNET_CONFIG = {
  server: 'https://testnet-api.algonode.cloud',
  port: '',
  token: '',
  network: 'TestNet'
};

// Create Algorand client
export const algodClient = new algosdk.Algodv2(
  ALGORAND_TESTNET_CONFIG.token,
  ALGORAND_TESTNET_CONFIG.server,
  ALGORAND_TESTNET_CONFIG.port
);

// Algorand network info with new green color
export const ALGORAND_NETWORK_INFO = {
  name: 'Algorand TestNet',
  description: 'Algorand testing environment - Ultra low cost',
  cost: '~$0.001',
  recommended: false,
  color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
  explorer: 'https://testnet.explorer.perawallet.app'
};

// Token creation interface for Algorand
export interface AlgorandTokenData {
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
}

// ARC-3 Metadata interface for Algorand
export interface ARC3Metadata {
  name: string;
  description?: string;
  image?: string;
  image_integrity?: string;
  image_mimetype?: string;
  background_color?: string;
  external_url?: string;
  external_url_integrity?: string;
  external_url_mimetype?: string;
  animation_url?: string;
  animation_url_integrity?: string;
  animation_url_mimetype?: string;
  properties?: Record<string, any>;
  extra_metadata?: string;
  localization?: {
    uri: string;
    default: string;
    locales: string[];
    integrity?: Record<string, string>;
  };
}

// Enhanced error handling for Algorand operations
export class AlgorandError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AlgorandError';
  }
}

// Validate Algorand address format
export function isValidAlgorandAddress(address: string): boolean {
  try {
    algosdk.decodeAddress(address);
    return true;
  } catch {
    return false;
  }
}

// Get account information with enhanced error handling
export async function getAlgorandAccountInfo(address: string) {
  try {
    if (!isValidAlgorandAddress(address)) {
      throw new AlgorandError('Invalid Algorand address format');
    }

    const accountInfo = await algodClient.accountInformation(address).do();
    
    // Convert BigInt values to numbers for JavaScript compatibility
    const balance = typeof accountInfo.amount === 'bigint' 
      ? Number(accountInfo.amount) / 1000000 
      : accountInfo.amount / 1000000;
    
    const minBalance = typeof accountInfo.minBalance === 'bigint'
      ? Number(accountInfo.minBalance) / 1000000
      : (accountInfo.minBalance || 0) / 1000000;
    
    const totalAssets = typeof accountInfo.totalAssetsOptedIn === 'bigint'
      ? Number(accountInfo.totalAssetsOptedIn)
      : accountInfo.totalAssetsOptedIn || 0;
    
    return {
      success: true,
      balance: balance,
      assets: accountInfo.assets || [],
      minBalance: minBalance,
      totalAssets: totalAssets,
    };
  } catch (error) {
    console.error('Error getting Algorand account info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get account information',
    };
  }
}

// Check if account has sufficient balance for operations
export async function checkAccountBalance(address: string, requiredAmount: number = 0.101) {
  const accountInfo = await getAlgorandAccountInfo(address);
  
  if (!accountInfo.success) {
    return { sufficient: false, error: accountInfo.error };
  }

  // Calculate available balance more accurately
  // Account needs to maintain minimum balance + additional for new asset
  const currentMinBalance = accountInfo.minBalance;
  const newAssetMinBalance = 0.1; // Additional 0.1 ALGO for new asset
  const transactionFee = 0.001; // Transaction fee
  
  const totalRequired = currentMinBalance + newAssetMinBalance + transactionFee;
  const availableBalance = accountInfo.balance - totalRequired;
  
  // Enhanced debugging logs
  console.log('=== ALGORAND BALANCE CHECK DEBUG ===');
  console.log('Address:', address);
  console.log('Account Balance (ALGO):', accountInfo.balance);
  console.log('Current Min Balance (ALGO):', currentMinBalance);
  console.log('New Asset Min Balance (ALGO):', newAssetMinBalance);
  console.log('Transaction Fee (ALGO):', transactionFee);
  console.log('Total Required (ALGO):', totalRequired);
  console.log('Available Balance (ALGO):', Math.max(0, availableBalance));
  console.log('Sufficient Balance?:', accountInfo.balance >= totalRequired);
  console.log('Balance types:', {
    balanceType: typeof accountInfo.balance,
    minBalanceType: typeof currentMinBalance,
    totalRequiredType: typeof totalRequired
  });
  console.log('Balance Check Result:', {
    sufficient: accountInfo.balance >= totalRequired,
    balance: accountInfo.balance,
    available: Math.max(0, availableBalance),
    required: totalRequired
  });
  console.log('=== END BALANCE CHECK DEBUG ===');
  
  return {
    sufficient: accountInfo.balance >= totalRequired,
    balance: accountInfo.balance,
    available: Math.max(0, availableBalance),
    required: totalRequired,
    breakdown: {
      currentMinBalance,
      newAssetMinBalance,
      transactionFee,
      totalRequired
    }
  };
}

export function microAlgosToAlgos(microAlgos: number): number {
  return microAlgos / 1000000;
}

export function algosToMicroAlgos(algos: number): number {
  return Math.round(algos * 1000000);
}

// Create ARC-3 compliant metadata JSON and upload to Supabase Storage
export async function createARC3Metadata(
  tokenData: AlgorandTokenData,
  uploadImageToStorage: (metadata: ARC3Metadata) => Promise<{ success: boolean; url?: string; error?: string }>
): Promise<{ success: boolean; metadataUrl?: string; metadataHash?: string; error?: string }> {
  try {
    console.log('Creating ARC-3 metadata for token:', tokenData.name);
    
    // Construct ARC-3 compliant metadata
    const metadata: ARC3Metadata = {
      name: tokenData.name,
      description: tokenData.description || `${tokenData.name} (${tokenData.symbol}) - Created with Snarbles`,
      image: tokenData.logoUrl || undefined,
      external_url: tokenData.website || undefined,
      properties: {
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        total_supply: tokenData.totalSupply,
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable,
        website: tokenData.website || null,
        github: tokenData.github || null,
        twitter: tokenData.twitter || null,
        created_with: 'Snarbles Token Platform',
        creation_date: new Date().toISOString()
      }
    };

    console.log('ARC-3 metadata constructed:', metadata);

    // Upload metadata JSON to Supabase Storage
    const uploadResult = await uploadImageToStorage(metadata);
    
    if (!uploadResult.success) {
      throw new AlgorandError(`Failed to upload metadata: ${uploadResult.error}`);
    }

    // Calculate SHA-256 hash of metadata for integrity
    const metadataString = JSON.stringify(metadata);
    const metadataHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metadataString));
    const hashArray = Array.from(new Uint8Array(metadataHash));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));

    console.log('✓ ARC-3 metadata uploaded successfully');
    return { success: true, metadataUrl: uploadResult.url, metadataHash: hashBase64 };
  } catch (error) {
    console.error('Error creating ARC-3 metadata:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Metadata creation failed' };
  }
}

// Create ASA (Algorand Standard Asset) token with comprehensive error handling
export async function createAlgorandToken(
  walletAddress: string,
  tokenData: AlgorandTokenData,
  signTransaction: (txn: any) => Promise<any>,
  uploadMetadataToStorage?: (metadata: ARC3Metadata) => Promise<{ success: boolean; url?: string; error?: string }>
): Promise<{
  success: boolean;
  assetId?: number;
  txId?: string;
  error?: string;
  details?: any;
  metadataUrl?: string;
}> {
  try {
    console.log('=== ALGORAND TOKEN CREATION DEBUG START ===');
    console.log('Input walletAddress:', walletAddress);
    console.log('Input walletAddress type:', typeof walletAddress);
    console.log('Input walletAddress length:', walletAddress?.length);
    
    // Create a custom JSON replacer to handle BigInt values
    const jsonReplacer = (key: string, value: any) => {
      if (typeof value === 'bigint') {
        return value.toString() + 'n';
      }
      return value;
    };
    
    console.log('Input tokenData:', JSON.stringify(tokenData, jsonReplacer, 2));
    
    // Validate inputs
    if (!isValidAlgorandAddress(walletAddress)) {
      throw new AlgorandError('Invalid wallet address format');
    }
    
    console.log('✓ Wallet address validation passed');

    if (!tokenData.name || tokenData.name.length > 32) {
      throw new AlgorandError('Token name must be 1-32 characters');
    }

    if (!tokenData.symbol || tokenData.symbol.length > 8) {
      throw new AlgorandError('Token symbol must be 1-8 characters');
    }

    if (tokenData.totalSupply <= '0' || BigInt(tokenData.totalSupply) > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new AlgorandError('Invalid total supply amount');
    }

    if (tokenData.decimals < 0 || tokenData.decimals > 19) {
      throw new AlgorandError('Decimals must be between 0 and 19');
    }
    
    console.log('✓ All input validations passed');

    // Check account balance
    const balanceCheck = await checkAccountBalance(walletAddress, 0.101);
    if (!balanceCheck.sufficient) {
      throw new AlgorandError(
        `Insufficient ALGO balance for token creation. Required: ${(balanceCheck.required || 0.101).toFixed(3)} ALGO, Current: ${(balanceCheck.balance || 0).toFixed(4)} ALGO. You need ${((balanceCheck.required || 0.101) - (balanceCheck.balance || 0)).toFixed(4)} more ALGO.`
      );
    }
    
    console.log('✓ Balance check passed');

    // Handle ARC-3 metadata if upload function is provided
    let metadataUrl = tokenData.website;
    let metadataHash;
    
    if (uploadMetadataToStorage && (tokenData.logoUrl || tokenData.description)) {
      console.log('Creating ARC-3 metadata...');
      const metadataResult = await createARC3Metadata(tokenData, uploadMetadataToStorage);
      if (metadataResult.success) {
        metadataUrl = metadataResult.metadataUrl;
        metadataHash = metadataResult.metadataHash;
      }
    }

    // Convert BigInt values to regular numbers to avoid serialization issues
    const convertBigIntToNumber = (value: any): any => {
      if (typeof value === 'bigint') {
        return Number(value);
      }
      if (typeof value === 'object' && value !== null) {
        const converted: any = {};
        for (const key in value) {
          converted[key] = convertBigIntToNumber(value[key]);
        }
        return converted;
      }
      return value;
    };

    // Get suggested transaction parameters
    console.log('Getting transaction parameters...');
    const rawSuggestedParams = await algodClient.getTransactionParams().do();
    
    // Handle BigInt conversion while preserving Uint8Arrays and other important structures
    const suggestedParams = {
      ...rawSuggestedParams,
      fee: typeof rawSuggestedParams.fee === 'bigint' ? Number(rawSuggestedParams.fee) : rawSuggestedParams.fee,
      firstValid: typeof rawSuggestedParams.firstValid === 'bigint' ? Number(rawSuggestedParams.firstValid) : rawSuggestedParams.firstValid,
      lastValid: typeof rawSuggestedParams.lastValid === 'bigint' ? Number(rawSuggestedParams.lastValid) : rawSuggestedParams.lastValid,
      genesisHash: rawSuggestedParams.genesisHash,
      genesisID: rawSuggestedParams.genesisID,
      minFee: typeof rawSuggestedParams.minFee === 'bigint' ? Number(rawSuggestedParams.minFee) : rawSuggestedParams.minFee
    };
    
    console.log('✓ Got suggested params:', {
      fee: suggestedParams.fee,
      firstValid: suggestedParams.firstValid,
      lastValid: suggestedParams.lastValid,
      genesisHashType: typeof suggestedParams.genesisHash,
      genesisHashLength: suggestedParams.genesisHash?.length,
      genesisID: suggestedParams.genesisID
    });
    
    // Calculate total supply in base units using BigInt for large numbers
    const totalSupplyBigInt = BigInt(tokenData.totalSupply) * (10n ** BigInt(tokenData.decimals));
    
    console.log('Total supply calculation:', {
      originalSupply: tokenData.totalSupply,
      decimals: tokenData.decimals,
      baseUnits: totalSupplyBigInt.toString()
    });
    
    // Validate against Algorand's maximum asset total (2^64 - 1)
    const algorandMaxTotal = 0xFFFFFFFFFFFFFFFFn; // 18,446,744,073,709,551,615
    if (totalSupplyBigInt > algorandMaxTotal) {
      throw new AlgorandError('Total supply exceeds Algorand maximum (18,446,744,073,709,551,615)');
    }
    
    // CRITICAL FIX: Pass BigInt directly to algosdk for large values, Number for safe integers
    // algosdk v3+ accepts both number and bigint for the 'total' field
    const totalSupplyForAlgosdk = totalSupplyBigInt > BigInt(Number.MAX_SAFE_INTEGER) 
      ? totalSupplyBigInt 
      : Number(totalSupplyBigInt);
    
    console.log('Final total supply for algosdk:', {
      value: totalSupplyForAlgosdk,
      type: typeof totalSupplyForAlgosdk,
      isSafeInteger: typeof totalSupplyForAlgosdk === 'number' ? Number.isSafeInteger(totalSupplyForAlgosdk) : 'N/A (BigInt)'
    });

    // Prepare all addresses explicitly
    const fromAddress = walletAddress;
    const managerAddress = walletAddress;
    const reserveAddress = walletAddress;
    const freezeAddress = tokenData.pausable ? walletAddress : undefined;
    
    console.log('Address assignments:', {
      from: fromAddress,
      manager: managerAddress,
      reserve: reserveAddress,
      freeze: freezeAddress,
      clawback: undefined
    });
    
    // Validate all addresses one more time
    if (!fromAddress || typeof fromAddress !== 'string' || fromAddress.trim() === '') {
      throw new AlgorandError('From address is invalid');
    }
    if (!managerAddress || typeof managerAddress !== 'string' || managerAddress.trim() === '') {
      throw new AlgorandError('Manager address is invalid');
    }
    if (!reserveAddress || typeof reserveAddress !== 'string' || reserveAddress.trim() === '') {
      throw new AlgorandError('Reserve address is invalid');
    }
    
    if (freezeAddress && (typeof freezeAddress !== 'string' || freezeAddress.trim() === '')) {
      throw new AlgorandError('Freeze address is invalid');
    }
    
    console.log('✓ All address validations passed');

    // CRITICAL FIX: Build asset creation parameters dynamically
    // Only include fields that have valid values - never pass undefined/null to algosdk
    console.log('Creating asset creation transaction...');
    const assetCreateParams: any = {
      sender: fromAddress,  // Fix: use 'sender' not 'from'
      suggestedParams: suggestedParams,
      defaultFrozen: false,
      unitName: tokenData.symbol,
      assetName: tokenData.name,
      manager: managerAddress,
      reserve: reserveAddress,
      total: totalSupplyForAlgosdk,
      decimals: tokenData.decimals,
    };

    // Only add optional fields if they have valid values
    if (metadataUrl && metadataUrl.trim() !== '') {
      assetCreateParams.assetURL = metadataUrl;
    }

    // CRITICAL: Only add freeze address if token is pausable
    // algosdk v3.0.0 requires complete omission of undefined fields
    if (tokenData.pausable && freezeAddress) {
      assetCreateParams.freeze = freezeAddress;
    }

    // Add note field only if description exists
    if (tokenData.description && tokenData.description.trim() !== '') {
      assetCreateParams.note = new TextEncoder().encode(tokenData.description);
    }

    // Add metadata hash if available (for ARC-3 compliance)
    if (metadataHash) {
      assetCreateParams.metadataHash = new TextEncoder().encode(metadataHash);
    }
    // Note: Do not set freeze to undefined - completely omit it instead
    
    // CRITICAL FIX: Do not include clawback unless specifically needed
    // algosdk v3.0.0 doesn't allow undefined values - we must completely omit the field
    // if (tokenData.pausable && clawbackAddress) {
    //   assetCreateParams.clawback = clawbackAddress;
    // }
    // Note: Do not set clawback to undefined - completely omit it instead
    
    // CRITICAL DEBUG: Log final parameters before transaction creation
    console.log('=== FINAL ASSET CREATION PARAMETERS DEBUG ===');
    console.log('Final assetCreateParams:', JSON.stringify(assetCreateParams, jsonReplacer, 2));
    console.log('Parameters check:');
    Object.keys(assetCreateParams).forEach(key => {
      const value = assetCreateParams[key];
      console.log(`  ${key}:`, typeof value, value === null ? 'NULL' : value === undefined ? 'UNDEFINED' : 'OK', value);
    });
    console.log('=== END FINAL PARAMETERS DEBUG ===');
    
    console.log('Asset creation parameters:', JSON.stringify({
      ...assetCreateParams,
      suggestedParams: 'REDACTED_FOR_BREVITY',
      // note: `Buffer(${assetCreateParams.note?.length || 0} bytes)`
    }, jsonReplacer, 2));
    
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      ...assetCreateParams
    });
    
    console.log('✓ Asset creation transaction created successfully');
    
    // Enhanced transaction debugging
    console.log('=== TRANSACTION STRUCTURE DEBUG ===');
    console.log('Transaction type:', assetCreateTxn.type);
    console.log('Transaction sender:', assetCreateTxn.sender?.toString());
    console.log('Transaction fee:', assetCreateTxn.fee);
    console.log('Transaction firstValid:', assetCreateTxn.firstValid);
    console.log('Transaction lastValid:', assetCreateTxn.lastValid);
    
    // Check asset creation specific fields
    console.log('Asset params exist:', !!assetCreateTxn.assetParams);
    console.log('=== END TRANSACTION STRUCTURE DEBUG ===');
    
    console.log('Raw transaction details:', {
      type: assetCreateTxn.type,
      sender: assetCreateTxn.sender?.toString(),
      fee: assetCreateTxn.fee,
      firstValid: assetCreateTxn.firstValid,
      lastValid: assetCreateTxn.lastValid,
      constructor: assetCreateTxn.constructor.name
    });
    
    console.log('Transaction object properties:', Object.keys(assetCreateTxn));
    console.log('Transaction prototype:', Object.getPrototypeOf(assetCreateTxn));
    
    // SIMPLIFIED: Skip complex transaction serialization/deserialization for now
    // This was causing compatibility issues with Pera Wallet
    console.log('Using original transaction directly...');

    console.log('Signing Algorand asset creation transaction...');
    
    // Sign the transaction - Pera Wallet expects the raw transaction object
    const signedTxn = await signTransaction(assetCreateTxn);
    
    if (!signedTxn || signedTxn.length === 0) {
      throw new AlgorandError('Transaction signing failed or was cancelled');
    }

    console.log('✓ Transaction signed successfully, length:', signedTxn.length);
    console.log('Submitting transaction to Algorand network...');
    
    // Submit the transaction
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid || response.txId;
    
    console.log('Transaction submitted, waiting for confirmation...', txId);
    
    // Wait for confirmation with timeout
    const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 10);
    
    // Get the asset ID from the transaction
    const assetId = confirmedTxn.assetIndex || confirmedTxn['asset-index'];
    
    if (!assetId) {
      throw new AlgorandError('Asset creation succeeded but asset ID not found');
    }

    console.log('Algorand token created successfully:', { assetId, txId });
    console.log('=== ALGORAND TOKEN CREATION DEBUG END ===');

    return {
      success: true,
      txId: txId,
      assetId: assetId,
      details: {
        explorerUrl: `${ALGORAND_NETWORK_INFO.explorer}/asset/${assetId}`,
        transactionUrl: `${ALGORAND_NETWORK_INFO.explorer}/tx/${txId}`,
        metadataUrl: metadataUrl
      }
    };
  } catch (error) {
    console.error('Error creating Algorand token:', error);
    console.error('=== ALGORAND TOKEN CREATION ERROR DEBUG ===');
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error?.constructor?.name);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Error value:', error);
    }
    
    console.error('=== END ERROR DEBUG ===');
    
    let errorMessage = 'Failed to create token';
    
    if (error instanceof AlgorandError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        errorMessage = 'Token creation was cancelled. You can try again anytime.';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient ALGO balance. Please add more ALGO to your wallet and try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network connection issue. Please check your internet and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Transaction timed out. Please try again - your ALGO was not spent.';
      } else if (error.message.includes('rejected')) {
        errorMessage = 'Transaction was rejected. Please check your wallet and try again.';
      } else if (error.message.includes('Address must not be null or undefined')) {
        errorMessage = 'Internal address validation error. This appears to be a library issue. Please try again or contact support.';
      } else {
        errorMessage = `Token creation failed: ${error.message}`;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get asset information with enhanced details
export async function getAlgorandAssetInfo(assetId: number) {
  try {
    console.log('Fetching asset info for ID:', assetId);
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    
    // Fetch and parse ARC-3 metadata if URL is provided
    let metadata = {
      logoUri: undefined as string | undefined,
      website: undefined as string | undefined,
      github: undefined as string | undefined,
      twitter: undefined as string | undefined,
    };
    
    if (assetInfo.params.url) {
      try {
        console.log('Fetching ARC-3 metadata from:', assetInfo.params.url);
        // Add timeout and proper error handling for metadata fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const metadataResponse = await fetch(assetInfo.params.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (metadataResponse.ok) {
          const arc3Metadata = await metadataResponse.json();
          console.log('Retrieved ARC-3 metadata:', arc3Metadata);
          
          // Extract image URL with multiple fallback options
          if (arc3Metadata.image) {
            metadata.logoUri = arc3Metadata.image;
          } else if (arc3Metadata.image_url) {
            metadata.logoUri = arc3Metadata.image_url;
          } else if (arc3Metadata.logo) {
            metadata.logoUri = arc3Metadata.logo;
          } else if (arc3Metadata.icon) {
            metadata.logoUri = arc3Metadata.icon;
          }
          
          // Extract website from external_url with fallbacks
          if (arc3Metadata.external_url) {
            metadata.website = arc3Metadata.external_url;
          } else if (arc3Metadata.website) {
            metadata.website = arc3Metadata.website;
          }
          
          // Extract social links from properties with enhanced parsing
          if (arc3Metadata.properties) {
            if (arc3Metadata.properties.website) {
              metadata.website = arc3Metadata.properties.website;
            }
            if (arc3Metadata.properties.github) {
              metadata.github = arc3Metadata.properties.github;
            }
            if (arc3Metadata.properties.twitter) {
              metadata.twitter = arc3Metadata.properties.twitter;
            }
            // Additional fallback patterns
            if (arc3Metadata.properties.social) {
              const social = arc3Metadata.properties.social;
              if (social.github) metadata.github = social.github;
              if (social.twitter) metadata.twitter = social.twitter;
              if (social.website) metadata.website = metadata.website || social.website;
            }
          }
          
          // Extract from top-level properties as additional fallbacks
          if (!metadata.website && arc3Metadata.website) {
            metadata.website = arc3Metadata.website;
          }
          if (!metadata.github && arc3Metadata.github) {
            metadata.github = arc3Metadata.github;
          }
          if (!metadata.twitter && arc3Metadata.twitter) {
            metadata.twitter = arc3Metadata.twitter;
          }
          
          console.log('Extracted metadata:', metadata);
        } else {
          console.warn('Failed to fetch ARC-3 metadata, HTTP status:', metadataResponse.status);
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.warn('ARC-3 metadata fetch timed out for asset:', assetId);
        } else {
          console.warn('Failed to fetch ARC-3 metadata:', error.message || error);
        }
        // Continue without metadata if fetch fails
      }
    } else {
      console.log('No metadata URL found for asset:', assetId);
    }
    
    console.log('Final asset info for', assetId, ':', {
      name: assetInfo.params.name,
      unitName: assetInfo.params.unitName,
      total: assetInfo.params.total,
      decimals: assetInfo.params.decimals,
      creator: assetInfo.params.creator,
      manager: assetInfo.params.manager,
      metadataExtracted: Object.keys(metadata).filter(key => metadata[key as keyof typeof metadata])
    });
    
    return {
      success: true,
      data: {
        ...assetInfo,
        explorerUrl: `${ALGORAND_NETWORK_INFO.explorer}/asset/${assetId}`,
        totalSupply: assetInfo.params.total || 0,
        decimals: assetInfo.params.decimals || 0,
        unitName: assetInfo.params.unitName || '',
        assetName: assetInfo.params.name || 'Unknown Asset',
        creator: assetInfo.params.creator || '',
        manager: assetInfo.params.manager || '',
        reserve: assetInfo.params.reserve || '',
        freeze: assetInfo.params.freeze || '',
        clawback: assetInfo.params.clawback || '',
        url: assetInfo.params.url || '',
        metadata: metadata,
      }
    };
  } catch (error) {
    console.error('Error getting Algorand asset info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get asset information',
    };
  }
}

// Transfer Algorand assets with enhanced error handling
export async function transferAlgorandAsset(
  fromAddress: string,
  toAddress: string,
  assetId: number,
  amount: number,
  decimals: number,
  signTransaction: (txn: any) => Promise<any>
): Promise<{
  success: boolean;
  txId?: string;
  error?: string;
}> {
  try {
    // Validate addresses
    if (!isValidAlgorandAddress(fromAddress)) {
      throw new AlgorandError('Invalid sender address');
    }
    
    if (!isValidAlgorandAddress(toAddress)) {
      throw new AlgorandError('Invalid r
    }
  }
}
    }
  }
}ecipient address');
    }

    // Check sender balance
    const balanceCheck = await checkAccountBalance(fromAddress, 0.001);
    if (!balanceCheck.sufficient) {
      throw new AlgorandError('Insufficient ALGO balance for transaction fee');
    }

    const rawSuggestedParams = await algodClient.getTransactionParams().do();
    const suggestedParams = {
      ...rawSuggestedParams,
      fee: typeof rawSuggestedParams.fee === 'bigint' ? Number(rawSuggestedParams.fee) : rawSuggestedParams.fee,
      firstValid: typeof rawSuggestedParams.firstValid === 'bigint' ? Number(rawSuggestedParams.firstValid) : rawSuggestedParams.firstValid,
      lastValid: typeof rawSuggestedParams.lastValid === 'bigint' ? Number(rawSuggestedParams.lastValid) : rawSuggestedParams.lastValid,
      genesisHash: rawSuggestedParams.genesisHash,
      genesisID: rawSuggestedParams.genesisID,
      minFee: typeof rawSuggestedParams.minFee === 'bigint' ? Number(rawSuggestedParams.minFee) : rawSuggestedParams.minFee
    };
    
    const transferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: fromAddress,
      receiver: toAddress,
      assetIndex: assetId,
      amount: Math.floor(amount * Math.pow(10, decimals)),
      suggestedParams,
    });

    // Sign the transaction
    const signedTxn = await signTransaction(transferTxn);
    
    if (!signedTxn || signedTxn.length === 0) {
      throw new AlgorandError('Transaction signing failed or was cancelled');
    }
    
    // Submit the transaction
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid || response.txId;
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 10);

    return {
      success: true,
      txId: txId,
    };
  } catch (error) {
    console.error('Error transferring Algorand asset:', error);
    
    let errorMessage = 'Failed to transfer asset';
    
    if (error instanceof AlgorandError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient balance for transfer';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Opt-in to an asset (required before receiving Algorand assets)
export async function optInToAsset(
  walletAddress: string,
  assetId: number,
  signTransaction: (txn: any) => Promise<any>
): Promise<{
  success: boolean;
  txId?: string;
  error?: string;
}> {
  try {
    if (!isValidAlgorandAddress(walletAddress)) {
      throw new AlgorandError('Invalid wallet address');
    }

    // Check if already opted in
    const accountInfo = await getAlgorandAccountInfo(walletAddress);
    if (accountInfo.success && accountInfo.assets.some((asset: any) => asset['asset-id'] === assetId)) {
      return {
        success: true,
        error: 'Already opted in to this asset',
      };
    }

    const balanceCheck = await checkAccountBalance(walletAddress, 0.101);
    if (!balanceCheck.sufficient) {
      throw new AlgorandError('Insufficient ALGO balance for opt-in transaction and minimum balance requirements');
    }

    const rawSuggestedParams = await algodClient.getTransactionParams().do();
    const suggestedParams = {
      ...rawSuggestedParams,
      fee: typeof rawSuggestedParams.fee === 'bigint' ? Number(rawSuggestedParams.fee) : rawSuggestedParams.fee,
      firstValid: typeof rawSuggestedParams.firstValid === 'bigint' ? Number(rawSuggestedParams.firstValid) : rawSuggestedParams.firstValid,
      lastValid: typeof rawSuggestedParams.lastValid === 'bigint' ? Number(rawSuggestedParams.lastValid) : rawSuggestedParams.lastValid,
      genesisHash: rawSuggestedParams.genesisHash,
      genesisID: rawSuggestedParams.genesisID,
      minFee: typeof rawSuggestedParams.minFee === 'bigint' ? Number(rawSuggestedParams.minFee) : rawSuggestedParams.minFee
    };
    
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: walletAddress,
      receiver: walletAddress,
      assetIndex: assetId,
      amount: 0,
      suggestedParams,
    });

    // Sign the transaction
    const signedTxn = await signTransaction(optInTxn);
    
    // Verify we have a Uint8Array before submission
    if (!(signedTxn instanceof Uint8Array)) {
      throw new AlgorandError(`Invalid signed transaction format: expected Uint8Array, got ${typeof signedTxn}`);
    }
    
    // Submit the transaction
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid || response.txId;
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(algodClient, txId, 10);

    return {
      success: true,
      txId: txId,
    };
  } catch (error) {
    console.error('Error opting in to asset:', error);
    
    let errorMessage = 'Failed to opt in to asset';
    
    if (error instanceof AlgorandError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled by user';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Mint Algorand tokens (ASA)
export async function mintAlgorandTokens(
  assetId: number,
  amount: string,
  recipientAddress: string,
  managerAddress: string,
  decimals: number,
  signTransaction: (txn: any) => Promise<any>
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    console.log('=== MINTING ALGORAND TOKENS ===');
    console.log('Asset ID:', assetId);
    console.log('Amount:', amount);
    console.log('Recipient:', recipientAddress);
    console.log('Manager:', managerAddress);
    
    // Validate addresses
    if (!isValidAlgorandAddress(managerAddress)) {
      throw new AlgorandError('Invalid manager address');
    }
    if (!isValidAlgorandAddress(recipientAddress)) {
      throw new AlgorandError('Invalid recipient address');
    }

    // Check manager balance for transaction fee
    const balanceCheck = await checkAccountBalance(managerAddress, 0.001);
    if (!balanceCheck.sufficient) {
      throw new AlgorandError('Insufficient ALGO balance for transaction fee');
    }

    // Get transaction parameters
    const rawSuggestedParams = await algodClient.getTransactionParams().do();
    const suggestedParams = {
      ...rawSuggestedParams,
      fee: typeof rawSuggestedParams.fee === 'bigint' ? Number(rawSuggestedParams.fee) : rawSuggestedParams.fee,
      firstValid: typeof rawSuggestedParams.firstValid === 'bigint' ? Number(rawSuggestedParams.firstValid) : rawSuggestedParams.firstValid,
      lastValid: typeof rawSuggestedParams.lastValid === 'bigint' ? Number(rawSuggestedParams.lastValid) : rawSuggestedParams.lastValid,
      genesisHash: rawSuggestedParams.genesisHash,
      genesisID: rawSuggestedParams.genesisID,
      minFee: typeof rawSuggestedParams.minFee === 'bigint' ? Number(rawSuggestedParams.minFee) : rawSuggestedParams.minFee
    };

    // Calculate amount in base units using BigInt
    const mintAmountBigInt = BigInt(amount) * (10n ** BigInt(decimals));
    const mintAmount = Number(mintAmountBigInt);

    console.log('Mint amount calculation:', {
      originalAmount: amount,
      decimals: decimals,
      baseUnits: mintAmount
    });

    // Create asset transfer transaction from manager to recipient (this mints new tokens)
    const mintTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: managerAddress, // Manager sends (mints)
      receiver: recipientAddress, // Recipient receives the new tokens
      assetIndex: assetId,
      amount: mintAmount,
      suggestedParams,
    });

    console.log('Signing mint transaction...');
    const signedTxn = await signTransaction(mintTxn);
    
    if (!signedTxn || signedTxn.length === 0) {
      throw new AlgorandError('Transaction signing failed or was cancelled');
    }
    
    console.log('Submitting mint transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid || response.txId;
    
    console.log('Waiting for confirmation...', txId);
    await algosdk.waitForConfirmation(algodClient, txId, 10);

    console.log('✓ Mint transaction confirmed');
    return { success: true, txId };
  } catch (error) {
    console.error('Error minting Algorand tokens:', error);
    
    let errorMessage = 'Failed to mint tokens';
    if (error instanceof AlgorandError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient balance for transaction';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

// Burn Algorand tokens (ASA)
export async function burnAlgorandTokens(
  assetId: number,
  amount: string,
  senderAddress: string,
  decimals: number,
  signTransaction: (txn: any) => Promise<any>
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    console.log('=== BURNING ALGORAND TOKENS ===');
    console.log('Asset ID:', assetId);
    console.log('Amount:', amount);
    console.log('Sender:', senderAddress);
    
    // Validate address
    if (!isValidAlgorandAddress(senderAddress)) {
      throw new AlgorandError('Invalid sender address');
    }

    // Get asset info to find reserve address for burning
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    const reserveAddress = assetInfo.params.reserve;

    if (!reserveAddress) {
      throw new AlgorandError('Asset has no reserve address configured for burning');
    }

    // Check sender balance for transaction fee
    const balanceCheck = await checkAccountBalance(senderAddress, 0.001);
    if (!balanceCheck.sufficient) {
      throw new AlgorandError('Insufficient ALGO balance for transaction fee');
    }

    // Calculate burn amount in base units
    const burnAmountBigInt = BigInt(amount) * (10n ** BigInt(decimals));
    const burnAmount = Number(burnAmountBigInt);

    console.log('Burn amount calculation:', {
      originalAmount: amount,
      decimals: decimals,
      baseUnits: burnAmount,
      reserveAddress: reserveAddress
    });

    const rawSuggestedParams = await algodClient.getTransactionParams().do();
    const suggestedParams = {
      ...rawSuggestedParams,
      fee: typeof rawSuggestedParams.fee === 'bigint' ? Number(rawSuggestedParams.fee) : rawSuggestedParams.fee,
      firstValid: typeof rawSuggestedParams.firstValid === 'bigint' ? Number(rawSuggestedParams.firstValid) : rawSuggestedParams.firstValid,
      lastValid: typeof rawSuggestedParams.lastValid === 'bigint' ? Number(rawSuggestedParams.lastValid) : rawSuggestedParams.lastValid,
      genesisHash: rawSuggestedParams.genesisHash,
      genesisID: rawSuggestedParams.genesisID,
      minFee: typeof rawSuggestedParams.minFee === 'bigint' ? Number(rawSuggestedParams.minFee) : rawSuggestedParams.minFee
    };

    // Create burn transaction (transfer to reserve address)
    const burnTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      receiver: reserveAddress, // Send to reserve to effectively burn
      assetIndex: assetId,
      amount: burnAmount,
      suggestedParams,
    });

    console.log('Signing burn transaction...');
    const signedTxn = await signTransaction(burnTxn);
    
    if (!signedTxn || signedTxn.length === 0) {
      throw new AlgorandError('Transaction signing failed or was cancelled');
    }
    
    console.log('Submitting burn transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid || response.txId;
    
    console.log('Waiting for confirmation...', txId);
    await algosdk.waitForConfirmation(algodClient, txId, 10);

    console.log('✓ Burn transaction confirmed');
    return { success: true, txId };
  } catch (error) {
    console.error('Error burning Algorand tokens:', error);
    
    let errorMessage = 'Failed to burn tokens';
    if (error instanceof AlgorandError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled by user';
      } else if (error.message.includes('insufficient')) {
        errorMessage = 'Insufficient balance for burning';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

// Pause Algorand token (freeze all accounts by default)
export async function pauseAlgorandToken(
  assetId: number,
  managerAddress: string,
  signTransaction: (txn: any) => Promise<any>
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    console.log('=== PAUSING ALGORAND TOKEN ===');
    console.log('Asset ID:', assetId);
    console.log('Manager:', managerAddress);
    
    // Validate address
    if (!isValidAlgorandAddress(managerAddress)) {
      throw new AlgorandError('Invalid manager address');
    }

    // Get current asset info
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    const params = assetInfo.params;

    // Check if token has freeze capability
    if (!params.freeze) {
      throw new AlgorandError('Token does not have freeze/pause capability');
    }

    const rawSuggestedParams = await algodClient.getTransactionParams().do();
    const suggestedParams = {
      ...rawSuggestedParams,
      fee: typeof rawSuggestedParams.fee === 'bigint' ? Number(rawSuggestedParams.fee) : rawSuggestedParams.fee,
      firstValid: typeof rawSuggestedParams.firstValid === 'bigint' ? Number(rawSuggestedParams.firstValid) : rawSuggestedParams.firstValid,
      lastValid: typeof rawSuggestedParams.lastValid === 'bigint' ? Number(rawSuggestedParams.lastValid) : rawSuggestedParams.lastValid,
      genesisHash: rawSuggestedParams.genesisHash,
      genesisID: rawSuggestedParams.genesisID,
      minFee: typeof rawSuggestedParams.minFee === 'bigint' ? Number(rawSuggestedParams.minFee) : rawSuggestedParams.minFee
    };

    // Create asset config transaction to set default frozen to true
    const pauseTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
      sender: managerAddress,
      assetIndex: assetId,
      suggestedParams,
      strictEmptyAddressChecking: false,
      // Keep existing addresses but set default frozen to true
      manager: params.manager || managerAddress,
      reserve: params.reserve || managerAddress,
      freeze: params.freeze || managerAddress,
      clawback: params.clawback || undefined,
      defaultFrozen: true // This pauses the token
    });

    console.log('Signing pause transaction...');
    const signedTxn = await signTransaction(pauseTxn);
    
    if (!signedTxn || signedTxn.length === 0) {
      throw new AlgorandError('Transaction signing failed or was cancelled');
    }
    
    console.log('Submitting pause transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid || response.txId;
    
    console.log('Waiting for confirmation...', txId);
    await algosdk.waitForConfirmation(algodClient, txId, 10);

    console.log('✓ Pause transaction confirmed');
    return { success: true, txId };
  } catch (error) {
    console.error('Error pausing Algorand token:', error);
    
    let errorMessage = 'Failed to pause token';
    if (error instanceof AlgorandError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled by user';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

// Unpause Algorand token (unfreeze all accounts by default)
export async function unpauseAlgorandToken(
  assetId: number,
  managerAddress: string,
  signTransaction: (txn: any) => Promise<any>
): Promise<{ success: boolean; txId?: string; error?: string }> {
  try {
    console.log('=== UNPAUSING ALGORAND TOKEN ===');
    console.log('Asset ID:', assetId);
    console.log('Manager:', managerAddress);
    
    // Validate address
    if (!isValidAlgorandAddress(managerAddress)) {
      throw new AlgorandError('Invalid manager address');
    }

    // Get current asset info
    const assetInfo = await algodClient.getAssetByID(assetId).do();
    const params = assetInfo.params;

    // Check if token has freeze capability
    if (!params.freeze) {
      throw new AlgorandError('Token does not have freeze/pause capability');
    }

    const rawSuggestedParams = await algodClient.getTransactionParams().do();
    const suggestedParams = {
      ...rawSuggestedParams,
      fee: typeof rawSuggestedParams.fee === 'bigint' ? Number(rawSuggestedParams.fee) : rawSuggestedParams.fee,
      firstValid: typeof rawSuggestedParams.firstValid === 'bigint' ? Number(rawSuggestedParams.firstValid) : rawSuggestedParams.firstValid,
      lastValid: typeof rawSuggestedParams.lastValid === 'bigint' ? Number(rawSuggestedParams.lastValid) : rawSuggestedParams.lastValid,
      genesisHash: rawSuggestedParams.genesisHash,
      genesisID: rawSuggestedParams.genesisID,
      minFee: typeof rawSuggestedParams.minFee === 'bigint' ? Number(rawSuggestedParams.minFee) : rawSuggestedParams.minFee
    };

    // Create asset config transaction to set default frozen to false
    const unpauseTxn = algosdk.makeAssetConfigTxnWithSuggestedParamsFromObject({
      sender: managerAddress,
      assetIndex: assetId,
      suggestedParams,
      strictEmptyAddressChecking: false,
      // Keep existing addresses but set default frozen to false
      manager: params.manager || managerAddress,
      reserve: params.reserve || managerAddress,
      freeze: params.freeze || managerAddress,
      clawback: params.clawback || undefined,
      defaultFrozen: false // This unpauses the token
    });

    console.log('Signing unpause transaction...');
    const signedTxn = await signTransaction(unpauseTxn);
    
    if (!signedTxn || signedTxn.length === 0) {
      throw new AlgorandError('Transaction signing failed or was cancelled');
    }
    
    console.log('Submitting unpause transaction...');
    const response = await algodClient.sendRawTransaction(signedTxn).do();
    const txId = response.txid || response.txId;
    
    console.log('Waiting for confirmation...', txId);
    await algosdk.waitForConfirmation(algodClient, txId, 10);

    console.log('✓ Unpause transaction confirmed');
    return { success: true, txId };
  } catch (error) {
    console.error('Error unpausing Algorand token:', error);
    
    let errorMessage = 'Failed to unpause token';
    if (error instanceof AlgorandError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      if (error.message.includes('cancelled')) {
        errorMessage = 'Transaction was cancelled by user';
      } else {
        errorMessage = error.message;
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

// Utility functions
export function formatAlgorandAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

// Get platform statistics
export async function getAlgorandPlatformStats() {
  try {
    // This would typically fetch from a backend API or indexer
    // For now, return mock data that could be real
    return {
      success: true,
      data: {
        totalTokens: 1247,
        activeUsers: 892,
        totalValue: 1.2, // in millions
        successRate: 98.7,
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Enhanced wallet connection status check
export async function checkWalletConnection(address: string) {
  try {
    console.log('=== CHECKING WALLET CONNECTION ===');
    console.log('Checking wallet address:', address);
    
    const accountInfo = await getAlgorandAccountInfo(address);
    
    if (!accountInfo.success) {
      console.log('Account info failed:', accountInfo.error);
      return {
        connected: false,
        error: 'Unable to verify wallet connection',
        canCreateToken: false,
        recommendedBalance: 0.1
      };
    }

    console.log('Account info success:', {
      balance: accountInfo.balance,
      minBalance: accountInfo.minBalance,
      totalAssets: accountInfo.totalAssets
    });
    // More accurate balance check for token creation
    const balanceCheck = await checkAccountBalance(address, 0.101);
    
    console.log('Final wallet connection result:', {
      connected: true,
      balance: accountInfo.balance,
      canCreateToken: balanceCheck.sufficient,
      recommendedBalance: balanceCheck.required || 0.101
    });
    console.log('=== END WALLET CONNECTION CHECK ===');
    
    return {
      connected: true,
      balance: accountInfo.balance,
      minBalance: accountInfo.minBalance,
      canCreateToken: balanceCheck.sufficient,
      recommendedBalance: balanceCheck.required || 0.101,
      availableBalance: balanceCheck.available,
      breakdown: balanceCheck.breakdown
    };
  } catch (error) {
    console.error('Wallet connection check error:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection check failed',
      canCreateToken: false,
      recommendedBalance: 0.101
    };
  }
}