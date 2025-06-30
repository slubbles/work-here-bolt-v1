'use client';

import React, { useMemo, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter, 
  SolflareWalletAdapter,
  BackpackWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { NETWORK_ENDPOINT } from '@/lib/solana';
import { AlgorandWalletProvider } from './AlgorandWalletProvider';


interface WalletContextProviderProps {
  children: React.ReactNode;
}

export default function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Use devnet for development, mainnet-beta for production
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => NETWORK_ENDPOINT, []);
  
  // Log wallet connection attempts for debugging
  useEffect(() => {
    console.log('Wallet provider initialized with endpoint:', endpoint);
    return () => {
      console.log('Wallet provider unmounted');
    };
  }, [endpoint]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AlgorandWalletProvider>
            {children}
          </AlgorandWalletProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}