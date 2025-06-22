import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

const AlgorandWalletContext = createContext<AlgorandWalletContextType | null>(null);

export function useAlgorandWallet() {
  const context = useContext(AlgorandWalletContext);
  if (!context) {
    // Return a default implementation when hook is used outside provider
    return {
      connected: false,
      address: null,
      selectedNetwork: 'algorand-testnet',
      setSelectedNetwork: () => {},
      connect: async () => {},
      disconnect: async () => {},
      signTransaction: async () => { throw new Error('Not connected'); },
      peraWallet: null,
      isConnecting: false,
      isPeraWalletReady: false,
      error: null,
      balance: null,
    };
  }
  return context;
}