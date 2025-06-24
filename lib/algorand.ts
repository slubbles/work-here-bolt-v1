import algosdk from 'algosdk';

// Algorand network configurations
export const ALGORAND_NETWORKS = {
  mainnet: {
    name: 'Algorand Mainnet',
    algodUrl: 'https://mainnet-api.algonode.cloud',
    indexerUrl: 'https://mainnet-idx.algonode.cloud',
    token: '',
    port: '',
    color: 'bg-green-500'
  },
  testnet: {
    name: 'Algorand Testnet',
    algodUrl: 'https://testnet-api.algonode.cloud',
    indexerUrl: 'https://testnet-idx.algonode.cloud',
    token: '',
    port: '',
    color: 'bg-yellow-500'
  }
} as const;

export type AlgorandNetwork = keyof typeof ALGORAND_NETWORKS;

// Get Algorand client for a specific network
export function getAlgorandClient(network: AlgorandNetwork) {
  const config = ALGORAND_NETWORKS[network];
  return new algosdk.Algodv2(config.token, config.algodUrl, config.port);
}

// Wait for transaction confirmation with retry logic
export async function waitForConfirmationWithRetry(
  algodClient: algosdk.Algodv2,
  txId: string,
  maxRounds: number,
  network: string
): Promise<any> {
  const status = await algodClient.status().do();
  let lastRound = status['last-round'];
  
  while (lastRound < status['last-round'] + maxRounds) {
    try {
      const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
      
      if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
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

// Create Algorand Standard Asset (ASA)
export async function createAlgorandToken(params: {
  name: string;
  symbol: string;
  totalSupply: number;
  decimals: number;
  network: AlgorandNetwork;
  creatorAddress: string;
}) {
  const { name, symbol, totalSupply, decimals, network, creatorAddress } = params;
  
  const algodClient = getAlgorandClient(network);
  
  // Get suggested transaction parameters
  const suggestedParams = await algodClient.getTransactionParams().do();
  
  // Create asset creation transaction
  const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
    from: creatorAddress,
    suggestedParams,
    defaultFrozen: false,
    unitName: symbol,
    assetName: name,
    manager: creatorAddress,
    reserve: creatorAddress,
    freeze: creatorAddress,
    clawback: creatorAddress,
    total: totalSupply * Math.pow(10, decimals),
    decimals: decimals,
    assetURL: '',
    assetMetadataHash: undefined,
  });
  
  return assetCreateTxn;
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