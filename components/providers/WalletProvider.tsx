'use client';

import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { NETWORK_ENDPOINT } from '@/lib/solana';
import { AlgorandWalletProvider } from './AlgorandWalletProvider';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export default function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => NETWORK_ENDPOINT, []);

  // Fresh wallet adapter configuration - only stable, well-tested adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
  ], [network]);

  return (
    <ConnectionProvider 
      endpoint={endpoint}
      config={{
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: undefined // Disable websocket for stability
      }}
    >
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true} // Enable autoConnect for better UX
        onError={(error, adapter) => {
          console.warn('Solana wallet error:', error?.message || error);
          console.warn('Adapter:', adapter?.name);
          // Graceful error handling - don't throw
        }}
        localStorageKey="walletName" // Persist wallet selection
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