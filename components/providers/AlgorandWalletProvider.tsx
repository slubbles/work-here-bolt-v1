'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for Pera Wallet
interface PeraWalletConnect {
  connect(): Promise<string[]>;
  disconnect(): Promise<void>;
  reconnectSession(): Promise<string[]>;
  signTransaction(txnGroup: any[]): Promise<Uint8Array[]>;
  connector?: {
    on(event: string, callback: () => void): void;
  };
}

interface AlgorandWalletContextType {
  connected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (txn: any) => Promise<any>;
  peraWallet: PeraWalletConnect | null;
  isConnecting: boolean;
  error: string | null;
  balance: number | null;
}

const AlgorandWalletContext = createContext<AlgorandWalletContextType | null>(null);

interface AlgorandWalletProviderProps {
  children: ReactNode;
}

export function AlgorandWalletProvider({ children }: AlgorandWalletProviderProps) {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [peraWallet, setPeraWallet] = useState<PeraWalletConnect | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    // Initialize Pera Wallet only on client side
    const initializeWallet = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { PeraWalletConnect } = await import('@perawallet/connect');
        
        const wallet = new PeraWalletConnect({
          chainId: 416002, // TestNet chain ID
        });
        
        setPeraWallet(wallet);

        // Check if already connected
        try {
          const accounts = await wallet.reconnectSession();
          if (accounts.length > 0) {
            setConnected(true);
            setAddress(accounts[0]);
            await updateBalance(accounts[0]);
          }
        } catch (error) {
          console.log('No existing Algorand session found');
        }

        // Listen for disconnect events
        wallet.connector?.on('disconnect', () => {
          setConnected(false);
          setAddress(null);
          setBalance(null);
          setError(null);
        });
      } catch (error) {
        console.error('Failed to initialize Pera Wallet:', error);
        setError('Failed to initialize Algorand wallet');
      }
    };

    initializeWallet();
  }, []);

  const updateBalance = async (walletAddress: string) => {
    try {
      const { getAlgorandAccountInfo } = await import('@/lib/algorand');
      const accountInfo = await getAlgorandAccountInfo(walletAddress);
      
      if (accountInfo.success) {
        setBalance(accountInfo.balance);
      }
    } catch (error) {
      console.error('Failed to update balance:', error);
    }
  };

  const connect = async () => {
    if (!peraWallet) {
      throw new Error('Pera Wallet not initialized');
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setConnected(true);
        setAddress(accounts[0]);
        await updateBalance(accounts[0]);
        
        // Show success message
        console.log('Algorand wallet connected successfully:', accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect to Pera Wallet:', error);
      
      let errorMessage = 'Failed to connect to Algorand wallet';
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Connection cancelled by user';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection';
        } else {
          errorMessage = error.message;
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
      await peraWallet.disconnect();
      setConnected(false);
      setAddress(null);
      setBalance(null);
      setError(null);
    } catch (error) {
      console.error('Failed to disconnect from Pera Wallet:', error);
      // Don't throw here, just log the error
    }
  };

  const signTransaction = async (txn: any) => {
    if (!peraWallet || !address) {
      throw new Error('Wallet not connected');
    }

    setError(null);

    try {
      console.log('Signing Algorand transaction with Pera Wallet...');
      
      // CRITICAL FIX: Pass the raw transaction object to Pera Wallet
      // Pera Wallet expects an array of raw transaction objects and handles encoding internally
      const signedTxn = await peraWallet.signTransaction([txn]);
      
      if (!signedTxn || signedTxn.length === 0) {
        throw new Error('Transaction signing failed');
      }
      
      console.log('✓ Transaction signed successfully');
      
      return signedTxn[0];
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      
      let errorMessage = 'Failed to sign transaction';
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (error.message.includes('getEncodingSchema') || error.message.includes('encode')) {
          errorMessage = 'Transaction format error. This may be due to a library compatibility issue. Please try refreshing the page and reconnecting your wallet.';
        } else if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for transaction';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const value: AlgorandWalletContextType = {
    connected,
    address,
    connect,
    disconnect,
    signTransaction,
    peraWallet,
    isConnecting,
    error,
    balance,
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