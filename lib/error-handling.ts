// Enhanced error handling and classification system
export interface BlockchainError {
  code: string;
  message: string;
  userMessage: string;
  action?: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TransactionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  txId?: string;
  explorerUrl?: string;
  timestamp?: number;
  details?: string;
}

// Solana-specific error patterns
const SOLANA_ERROR_PATTERNS = {
  INSUFFICIENT_FUNDS: {
    patterns: ['insufficient funds', 'insufficient lamports', 'account does not have enough sol'],
    code: 'INSUFFICIENT_FUNDS',
    userMessage: 'Insufficient SOL balance to complete this transaction',
    action: 'Add SOL to your wallet and try again',
    severity: 'high' as const
  },
  WALLET_DISCONNECTED: {
    patterns: ['wallet not connected', 'no wallet', 'wallet disconnected'],
    code: 'WALLET_DISCONNECTED',
    userMessage: 'Wallet connection lost',
    action: 'Please reconnect your wallet and try again',
    severity: 'high' as const
  },
  TRANSACTION_REJECTED: {
    patterns: ['user rejected', 'cancelled', 'denied by user', 'transaction rejected'],
    code: 'TRANSACTION_REJECTED',
    userMessage: 'Transaction was cancelled',
    action: 'Approve the transaction in your wallet to continue',
    severity: 'medium' as const
  },
  NETWORK_ERROR: {
    patterns: ['network error', 'rpc error', 'connection failed', 'timeout'],
    code: 'NETWORK_ERROR',
    userMessage: 'Network connection error',
    action: 'Check your internet connection and try again',
    severity: 'medium' as const
  },
  ACCOUNT_NOT_FOUND: {
    patterns: ['account not found', 'invalid account', 'account does not exist'],
    code: 'ACCOUNT_NOT_FOUND',
    userMessage: 'Account not found on the blockchain',
    action: 'Verify the account address and try again',
    severity: 'medium' as const
  },
  SIMULATION_FAILED: {
    patterns: ['simulation failed', 'transaction simulation failed'],
    code: 'SIMULATION_FAILED',
    userMessage: 'Transaction simulation failed',
    action: 'This indicates a problem with the transaction. Please try again or contact support',
    severity: 'high' as const
  },
  BLOCKHASH_NOT_FOUND: {
    patterns: ['blockhash not found', 'invalid blockhash'],
    code: 'BLOCKHASH_NOT_FOUND',
    userMessage: 'Transaction expired',
    action: 'Please try the transaction again',
    severity: 'medium' as const
  }
};

// Algorand-specific error patterns
const ALGORAND_ERROR_PATTERNS = {
  INSUFFICIENT_ALGO: {
    patterns: ['insufficient funds', 'below min balance', 'account balance too low'],
    code: 'INSUFFICIENT_ALGO',
    userMessage: 'Insufficient ALGO balance for this transaction',
    action: 'Add ALGO to your wallet and try again',
    severity: 'high' as const
  },
  ASSET_NOT_FOUND: {
    patterns: ['asset does not exist', 'asset not found', 'invalid asset'],
    code: 'ASSET_NOT_FOUND',
    userMessage: 'Asset not found on the Algorand network',
    action: 'Verify the asset ID and try again',
    severity: 'medium' as const
  },
  NOT_OPTED_IN: {
    patterns: ['not opted in', 'account not opted in to asset', 'must opt in'],
    code: 'NOT_OPTED_IN',
    userMessage: 'Account not opted into this asset',
    action: 'Opt into the asset first, then try again',
    severity: 'medium' as const
  },
  TRANSACTION_REJECTED: {
    patterns: ['user rejected', 'cancelled', 'denied', 'transaction rejected'],
    code: 'TRANSACTION_REJECTED',
    userMessage: 'Transaction was cancelled in your wallet',
    action: 'Approve the transaction to continue',
    severity: 'medium' as const
  },
  NETWORK_CONGESTION: {
    patterns: ['network congested', 'too many requests', 'rate limited'],
    code: 'NETWORK_CONGESTION',
    userMessage: 'Network is congested',
    action: 'Please wait a moment and try again',
    severity: 'low' as const
  }
};

// Classify error based on message content
export function classifyError(error: any, network: 'solana' | 'algorand'): BlockchainError {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const patterns = network === 'solana' ? SOLANA_ERROR_PATTERNS : ALGORAND_ERROR_PATTERNS;
  
  // Find matching error pattern
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.patterns.some(p => errorMessage.includes(p))) {
      return {
        code: pattern.code,
        message: error instanceof Error ? error.message : String(error),
        userMessage: pattern.userMessage,
        action: pattern.action,
        severity: pattern.severity,
        details: error
      };
    }
  }
  
  // Generic error fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    userMessage: 'An unexpected error occurred',
    action: 'Please try again or contact support if the problem persists',
    severity: 'medium',
    details: error
  };
}

// Enhanced transaction step management
export class TransactionTracker {
  private steps: TransactionStep[] = [];
  private onUpdateCallback?: (steps: TransactionStep[]) => void;

  constructor(onUpdate?: (steps: TransactionStep[]) => void) {
    this.onUpdateCallback = onUpdate;
  }

  addStep(step: Omit<TransactionStep, 'status' | 'timestamp'>): void {
    const newStep: TransactionStep = {
      ...step,
      status: 'pending',
      timestamp: Date.now()
    };
    
    this.steps.push(newStep);
    this.notifyUpdate();
  }

  updateStep(stepId: string, updates: Partial<TransactionStep>): void {
    const stepIndex = this.steps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      this.steps[stepIndex] = {
        ...this.steps[stepIndex],
        ...updates,
        timestamp: updates.status ? Date.now() : this.steps[stepIndex].timestamp
      };
      this.notifyUpdate();
    }
  }

  startStep(stepId: string): void {
    this.updateStep(stepId, { status: 'in-progress' });
  }

  completeStep(stepId: string, details?: string): void {
    this.updateStep(stepId, { status: 'completed', details });
  }

  failStep(stepId: string, error: string): void {
    this.updateStep(stepId, { status: 'failed', details: error });
  }

  addTransaction(stepId: string, txId: string, explorerUrl?: string): void {
    this.updateStep(stepId, { txId, explorerUrl });
  }

  getSteps(): TransactionStep[] {
    return [...this.steps];
  }

  getCurrentStep(): TransactionStep | null {
    return this.steps.find(s => s.status === 'in-progress') || null;
  }

  getFailedSteps(): TransactionStep[] {
    return this.steps.filter(s => s.status === 'failed');
  }

  hasFailures(): boolean {
    return this.getFailedSteps().length > 0;
  }

  isCompleted(): boolean {
    return this.steps.length > 0 && this.steps.every(s => s.status === 'completed');
  }

  reset(): void {
    this.steps = [];
    this.notifyUpdate();
  }

  private notifyUpdate(): void {
    if (this.onUpdateCallback) {
      this.onUpdateCallback([...this.steps]);
    }
  }
}

// Create predefined transaction steps for token creation
export function createTokenCreationSteps(network: 'solana' | 'algorand'): TransactionStep[] {
  const commonSteps = [
    {
      id: 'validation',
      title: 'Validating Input',
      description: 'Checking token parameters and wallet connection'
    },
    {
      id: 'metadata-upload',
      title: 'Uploading Metadata',
      description: 'Storing token metadata and images'
    }
  ];

  if (network === 'solana') {
    return [
      ...commonSteps,
      {
        id: 'platform-check',
        title: 'Platform Check',
        description: 'Verifying platform initialization'
      },
      {
        id: 'wallet-approval',
        title: 'Awaiting Wallet Confirmation',
        description: 'Please approve the transaction in your wallet'
      },
      {
        id: 'transaction-broadcast',
        title: 'Broadcasting Transaction',
        description: 'Sending transaction to Solana network'
      },
      {
        id: 'confirmation',
        title: 'Confirming on Blockchain',
        description: 'Waiting for network confirmation'
      },
      {
        id: 'finalization',
        title: 'Finalizing Token',
        description: 'Setting up token accounts and permissions'
      }
    ].map((step, index) => ({
      ...step,
      status: 'pending' as const,
      timestamp: Date.now() + index
    }));
  } else {
    return [
      ...commonSteps,
      {
        id: 'wallet-approval',
        title: 'Awaiting Wallet Confirmation',
        description: 'Please approve the transaction in Pera Wallet'
      },
      {
        id: 'transaction-broadcast',
        title: 'Broadcasting Transaction',
        description: 'Sending asset creation transaction to Algorand'
      },
      {
        id: 'confirmation',
        title: 'Confirming on Blockchain',
        description: 'Waiting for Algorand network confirmation'
      },
      {
        id: 'asset-verification',
        title: 'Verifying Asset Creation',
        description: 'Confirming asset was created successfully'
      }
    ].map((step, index) => ({
      ...step,
      status: 'pending' as const,
      timestamp: Date.now() + index
    }));
  }
}

// Retry mechanism for failed transactions
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  options?: { onRetry?: (attempt: number, error: any) => void }
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Call onRetry callback if provided
      if (options?.onRetry) {
        options.onRetry(attempt + 1, error);
      }
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Format error for user display
export function formatErrorForUser(error: BlockchainError): string {
  let message = error.userMessage;
  
  if (error.action) {
    message += `\n\n${error.action}`;
  }
  
  if (error.severity === 'critical') {
    message = `🚨 Critical Error: ${message}`;
  } else if (error.severity === 'high') {
    message = `❌ ${message}`;
  } else if (error.severity === 'medium') {
    message = `⚠️ ${message}`;
  } else {
    message = `ℹ️ ${message}`;
  }
  
  return message;
}

// Network status checker
export async function checkNetworkHealth(network: 'solana' | 'algorand'): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    if (network === 'solana') {
      const { connection } = await import('./solana');
      await connection.getLatestBlockhash();
    } else {
      const { getAlgorandClient } = await import('./algorand');
      const client = getAlgorandClient('algorand-testnet');
      await client.status().do();
    }
    
    return {
      healthy: true,
      latency: Date.now() - startTime
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Network check failed'
    };
  }
}