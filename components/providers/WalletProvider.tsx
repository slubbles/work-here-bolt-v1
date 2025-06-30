'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { NETWORK_ENDPOINT } from '@/lib/solana';
import { AlgorandWalletProvider } from './AlgorandWalletProvider';


interface WalletContextProviderProps {
  children: React.ReactNode;
}

export default function WalletContextProvider({ children }: WalletContextProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  // Handle hydration issues
  useEffect(() => {
    setMounted(true);
    
    // Attempt to restore wallet connection
    const hasAttemptedConnect = localStorage.getItem('wallet-adapter-autoconnect');
    if (!hasAttemptedConnect) {
      localStorage.setItem('wallet-adapter-autoconnect', 'true');
    }
  }, []);
  
  // Use devnet for development, mainnet-beta for production
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => NETWORK_ENDPOINT, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
    ],
    [network]
  );

  // Don't render until client-side to prevent hydration issues
  if (!mounted) return null;

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <AlgorandWalletProvider>
            {children}
          </AlgorandWalletProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}