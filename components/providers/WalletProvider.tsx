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
import { NETWORK_ENDPOINT } from '@/lib/solana';
import { AlgorandWalletProvider } from './AlgorandWalletProvider';


interface WalletContextProviderProps {
  children: React.ReactNode;
}

export default function WalletContextProvider({ children }: WalletContextProviderProps) {
  // Use devnet for development, mainnet-beta for production
  const solanaNetwork = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => NETWORK_ENDPOINT, []); // Use the endpoint from solana.ts

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      {/* Use ConnectionProvider with explicit commitment level */}
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