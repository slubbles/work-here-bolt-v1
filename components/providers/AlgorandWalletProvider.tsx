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
      console.log('=== PERA WALLET SIGN TRANSACTION DEBUG START ===');
      console.log('Input txn parameter:', txn);
      console.log('Input txn type:', typeof txn);
      console.log('Input txn constructor:', txn?.constructor?.name);
      console.log('Input txn is array:', Array.isArray(txn));
      
      if (Array.isArray(txn)) {
        console.log('Transaction array length:', txn.length);
        txn.forEach((tx, index) => {
          console.log(`Transaction ${index}:`, {
            type: typeof tx,
            constructor: tx?.constructor?.name,
            hasGetObjForEncoding: typeof tx?.get_obj_for_encoding === 'function',
            getObjForEncodingType: typeof tx?.get_obj_for_encoding,
            txType: tx?.type,
            from: tx?.from?.toString?.(),
            fee: tx?.fee
          });
          
          // Check if it's a valid algosdk Transaction
          if (tx && typeof tx === 'object') {
            console.log(`Transaction ${index} properties:`, Object.keys(tx));
            console.log(`Transaction ${index} prototype:`, Object.getPrototypeOf(tx));
            console.log(`Transaction ${index} has get_obj_for_encoding:`, 'get_obj_for_encoding' in tx);
          }
        });
      } else {
        console.log('Single transaction:', {
          type: typeof txn,
          constructor: txn?.constructor?.name,
          hasGetObjForEncoding: typeof txn?.get_obj_for_encoding === 'function',
          getObjForEncodingType: typeof txn?.get_obj_for_encoding,
          txType: txn?.type,
          from: txn?.from?.toString?.(),
          fee: txn?.fee
        });
        
        if (txn && typeof txn === 'object') {
          console.log('Transaction properties:', Object.keys(txn));
          console.log('Transaction prototype:', Object.getPrototypeOf(txn));
          console.log('Transaction has get_obj_for_encoding:', 'get_obj_for_encoding' in txn);
        }
      }
      
      console.log('Signing Algorand transaction...');
      const signedTxn = await peraWallet.signTransaction([txn]);
      
      if (!signedTxn || signedTxn.length === 0) {
        throw new Error('Transaction signing failed');
      }
      
      console.log('✓ Transaction signed successfully');
      console.log('Signed transaction type:', typeof signedTxn[0]);
      console.log('Signed transaction length:', signedTxn[0]?.length);
      console.log('=== PERA WALLET SIGN TRANSACTION DEBUG END ===');
      
      return signedTxn[0];
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      console.error('=== PERA WALLET SIGNING ERROR DEBUG ===');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('=== END PERA WALLET ERROR DEBUG ===');
      
      let errorMessage = 'Failed to sign transaction';
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
          errorMessage = 'Transaction cancelled by user';
        } else if (error.message.includes('get_obj_for_encoding')) {
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