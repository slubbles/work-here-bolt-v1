'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { NETWORK_ENDPOINT, dispatchWalletEvent } from '@/lib/solana';
import { AlgorandWalletProvider } from './AlgorandWalletProvider';

// Add wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export default function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => NETWORK_ENDPOINT, []);

  // Define wallet adapters - only using stable ones
  const wallets = useMemo(() => {
    return [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
    ];      
  }, [network]);

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      }}
    >
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={(error, adapter) => {
          console.error('Wallet connection error:', error);
          console.error('Adapter:', adapter?.name);
          // Don't throw the error, just log it
        }}
      >
        <WalletModalProvider>
          <AlgorandWalletProvider>
            {children}
          </AlgorandWalletProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}