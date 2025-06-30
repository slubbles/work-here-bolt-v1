'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import algosdk from 'algosdk';
import { getAlgorandNetwork, ALGORAND_NETWORKS } from '@/lib/algorand';
import { useToast } from '@/hooks/use-toast';

// Import the actual PeraWalletConnect type
import type { PeraWalletConnect } from '@perawallet/connect';

interface AlgorandWalletContextType {
  connected: boolean;
  address: string | null;
  selectedNetwork: string;
  setSelectedNetwork: (network: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (txn: any) => Promise<any>;
  peraWallet: PeraWalletConnect | null;
  isConnecting: boolean;
  isPeraWalletReady: boolean;
  error: string | null;
  balance: number | null;
  networkConfig: any;
}

const AlgorandWalletContext = createContext<AlgorandWalletContextType | null>(null);

interface AlgorandWalletProviderProps {
  children: ReactNode;
}

export function AlgorandWalletProvider({ children }: AlgorandWalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>(
    typeof localStorage !== 'undefined' && localStorage.getItem('algorand-network') 
      ? localStorage.getItem('algorand-network')! 
      : 'algorand-testnet'
  );
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPeraWalletReady, setIsPeraWalletReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [networkConfig, setNetworkConfig] = useState(getAlgorandNetwork('algorand-testnet'));
  const [reconnectAttempted, setReconnectAttempted] = useState<boolean>(false);
  
  const { toast } = useToast();

  // Update network configuration when selected network changes
  useEffect(() => {
    console.log(`🔄 Algorand network changed to: ${selectedNetwork}`);
    const config = getAlgorandNetwork(selectedNetwork);
    setNetworkConfig(config);
    
    // Save to localStorage for persistence
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('algorand-network', selectedNetwork);
    }
  }, [selectedNetwork]);

  // Initialize/reinitialize Pera Wallet when network changes
  useEffect(() => {
    async function initializeWallet() {
      try {
        setIsPeraWalletReady(true); 
        setError(null);
        
        console.log(`🔧 Initializing Pera Wallet for ${selectedNetwork}`);
        
        // If there's an existing connection, disconnect first
        if (peraWallet && connected) {
          console.log('📤 Disconnecting from previous network...');
          try {
            await peraWallet.disconnect();
          } catch (disconnectError) {
            console.warn('Warning during disconnect:', disconnectError);
          }
          setConnected(false);
          setAddress(null);
          setBalance(null);
        }

        // Dynamic import to avoid SSR issues
        const { PeraWalletConnect } = await import('@perawallet/connect');
        
        // Get the chain ID for the selected network
        const config = getAlgorandNetwork(selectedNetwork);
        console.log(`🌐 Creating Pera Wallet instance for chainId: ${config.chainId}`);
        
        const wallet = new PeraWalletConnect({
          chainId: config.chainId,
          shouldShowSignTxnToast: true,
          compactMode: false
        });
        
        setPeraWallet(wallet);

        // Listen for disconnect events - safely check if connector exists and has the 'on' method
        if (wallet.connector && typeof wallet.connector.on === 'function') {
          wallet.connector.on('disconnect', () => {
            console.log('📱 Pera Wallet disconnected');
            setConnected(false);
            setAddress(null);
            setBalance(null);
            setError(null);
          });
        }

        // Add a small delay to ensure wallet is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log(`✅ Pera Wallet ready for ${selectedNetwork}`);
        setIsPeraWalletReady(true);
        
        // Try to reconnect to existing session on the new network
        try {
          const accounts = await wallet.reconnectSession();
          if (accounts.length > 0) {
            console.log(`✅ Reconnected to existing session on ${selectedNetwork}:`, accounts[0]);
            setConnected(true);
            setAddress(accounts[0]);
            await updateBalance(accounts[0]);
          }
        } catch (reconnectError) {
          console.log(`ℹ️ No existing session found for ${selectedNetwork}`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize Pera Wallet for ${selectedNetwork}:`, error);
        setError(`Failed to initialize wallet for ${selectedNetwork}`);
      }
    }

    initializeWallet();
  }, [selectedNetwork]); // React to network changes

  const updateBalance = async (walletAddress: string) => {
    try {
      const { getAlgorandAccountInfo } = await import('@/lib/algorand');
      const accountInfo = await getAlgorandAccountInfo(walletAddress, selectedNetwork);
      
      if (accountInfo.success) {
        setBalance(accountInfo.balance || 0);
        console.log(`💰 Balance updated: ${accountInfo.balance} ALGO on ${selectedNetwork}`);
      }
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const connect = async () => {
    if (!peraWallet || !isPeraWalletReady) {
      const errorMsg = !peraWallet 
        ? `Pera Wallet not initialized for ${selectedNetwork}`
        : `Pera Wallet not ready for ${selectedNetwork}. Please refresh the page and try again.`;
      
      toast({
        title: "Wallet Connection Error",
        description: errorMsg,
        variant: "destructive",
        duration: 5000
      });
      
      throw new Error(errorMsg);
    }

    setIsConnecting(true);
    setError(null);

    try {
      console.log(`🔗 Connecting to Pera Wallet on ${selectedNetwork}...`);
      const accounts = await peraWallet.connect();
      
      if (accounts.length > 0) {
        setConnected(true);
        setAddress(accounts[0]);
        await updateBalance(accounts[0]);
        
        console.log(`✅ Successfully connected to ${selectedNetwork}:`, accounts[0]);
      }
      
      // Show success toast
      toast({
        title: "Wallet Connected",
        description: `Connected to Algorand ${selectedNetwork.includes("mainnet") ? "Mainnet" : "Testnet"}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error(`❌ Failed to connect to Pera Wallet on ${selectedNetwork}:`, error);
      
      let errorMessage = `Failed to connect to Algorand ${networkConfig.name}`;
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Connection cancelled by user';
        } else if (error.message.includes('network')) {
          errorMessage = `Network error connecting to ${networkConfig.name}. Please check your connection.`;
        } else if (error.message.includes('mismatch')) {
          errorMessage = `Network mismatch error. Please ensure you're connecting to ${networkConfig.name}.`;
        } else {
          errorMessage = `${networkConfig.name}: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!peraWallet) return;

    try {
      console.log(`📤 Disconnecting from ${selectedNetwork}...`);
      await peraWallet.disconnect();
      setConnected(false);
      setAddress(null);
      setBalance(null); 
      setError(null);
      console.log(`✅ Successfully disconnected from ${selectedNetwork}`);
      
      toast({
        title: "Wallet Disconnected",
        description: "You've been disconnected from your Algorand wallet",
        variant: "default",
      });
      
    } catch (error) {
      console.error(`❌ Failed to disconnect from ${selectedNetwork}:`, error);
      // Don't throw here, just log the error
    } finally {
      // Reset wallet ready state when disconnecting
      setIsPeraWalletReady(false);
      // Reinitialize wallet for current network
      setTimeout(() => {
        const config = getAlgorandNetwork(selectedNetwork);
        setNetworkConfig(config);
      }, 100);
    }
  };

  const signTransaction = async (txn: any) => {
    if (!peraWallet || !address) {
      throw new Error(`Wallet not connected to ${selectedNetwork}`);
    }

    setError(null);

    try {
      console.log(`📝 Signing transaction on ${selectedNetwork}...`);
      console.log('Transaction details:', {
        type: typeof txn,
        constructor: txn?.constructor?.name,
        isTransaction: txn instanceof algosdk.Transaction,
        network: selectedNetwork,
        chainId: networkConfig.chainId
      });
      
      // Validate that we have a proper algosdk.Transaction object
      if (!(txn instanceof algosdk.Transaction)) {
        throw new Error('Invalid transaction object - must be algosdk.Transaction instance');
      }
      
      console.log('✓ Transaction validation passed');
      console.log(`📱 Sending to Pera Wallet for signing on ${selectedNetwork}...`);

      // Format transaction for Pera Wallet - it expects SignerTransaction[][]
      const signerTransaction = {
        txn: txn,
        signers: [address]
      };

      console.log('Formatted SignerTransaction for', selectedNetwork);

      // CRITICAL: Pera Wallet expects SignerTransaction[][]
      const signedTxns = await peraWallet.signTransaction([[signerTransaction]]);
      
      if (!signedTxns || signedTxns.length === 0) {
        throw new Error('Transaction signing failed - no signed transaction returned');
      }
      
      console.log(`✅ Transaction signed successfully on ${selectedNetwork}`);
      
      // Extract the first signed transaction
      const firstSignedTxn = signedTxns[0];

      if (!reconnectAttempted) {
        try {
          const accounts = await peraWallet.reconnectSession();
          if (accounts.length > 0) {
            console.log(`✅ Reconnected to existing session on ${selectedNetwork}:`, accounts[0]);
            setConnected(true);
            setAddress(accounts[0]);
            await updateBalance(accounts[0]);
            
            // Show success toast for better UX
            toast({
              title: "Wallet Connected",
              description: `Connected to Algorand ${selectedNetwork.includes("mainnet") ? "Mainnet" : "Testnet"}`,
              variant: "default",
            });
          }
        } catch (reconnectError) {
          console.log(`ℹ️ No existing session found for ${selectedNetwork}`);
        }
        
        setReconnectAttempted(true);
      }

      console.log(`✅ Transaction ready for submission to ${selectedNetwork}`);
      
      return firstSignedTxn;
    } catch (error) {
      console.error(`❌ Transaction signing failed on ${selectedNetwork}:`, error);
      
      let errorMessage = `Failed to sign transaction on ${networkConfig.name}`;
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (error.message.includes('insufficient')) {
          errorMessage = `Insufficient balance for transaction on ${networkConfig.name}`;
        } else {
          errorMessage = `${networkConfig.name}: ${error.message}`;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Network switching helper
  const switchNetwork = async (newNetwork: string) => {
    console.log(`🔄 Switching from ${selectedNetwork} to ${newNetwork}`);
    
    if (newNetwork === selectedNetwork) {
      console.log('ℹ️ Already on the requested network');
      return;
    }

    // Validate network
    if (!ALGORAND_NETWORKS[newNetwork as keyof typeof ALGORAND_NETWORKS]) {
      throw new Error(`Unsupported network: ${newNetwork}`);
    }
    
    // Show network switch notification
    if (newNetwork !== selectedNetwork) {
      toast({
        title: "Network Changed",
        description: `Switched to ${newNetwork.includes('mainnet') ? 'Algorand Mainnet' : 'Algorand Testnet'}`,
        variant: "default",
      });
    }

    // Set wallet as not ready during network switch
    setIsPeraWalletReady(false);
    setSelectedNetwork(newNetwork);
    setReconnectAttempted(false);
    // The useEffect will handle the wallet reinitialization
  };

  const value: AlgorandWalletContextType = {
    connected,
    address,
    selectedNetwork,
    setSelectedNetwork: switchNetwork,
    connect,
    disconnect,
    signTransaction,
    peraWallet,
    isConnecting,
    isPeraWalletReady,
    error,
    balance,
    networkConfig,
  };

  return (
    <AlgorandWalletContext.Provider value={value}>
      {children}
    </AlgorandWalletContext.Provider>
  );
}

export function useAlgorandWallet() {
  const context = useContext(AlgorandWalletContext);
  if (!context) {
    throw new Error('useAlgorandWallet must be used within AlgorandWalletProvider');
  }
  return context;
}