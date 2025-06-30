'use client';

import React, { useMemo, useState, useEffect } from 'react';
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

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export default function WalletContextProvider({ children }: WalletContextProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Ensure wallet adapter autoconnect is enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallet-adapter-autoconnect', 'true');
      
      // Add a window-level event listener for wallet connection changes
      const handleWalletConnect = () => dispatchWalletEvent();
      
      window.addEventListener('wallet-connect', handleWalletConnect);
      return () => window.removeEventListener('wallet-connect', handleWalletConnect);
    }
  }, []);
  
  // Handle hydration issues and enable autoconnect
  useEffect(() => {
    setMounted(true);
    
    // Attempt to restore wallet connection
    const hasAttemptedConnect = localStorage.getItem('wallet-adapter-autoconnect');
    if (!hasAttemptedConnect) {
      localStorage.setItem('wallet-adapter-autoconnect', 'true');
    }
    
    // Set up wallet change listener
    const handleWalletChange = () => {
      // Flash a subtle indication that wallet state has changed
      const walletButton = document.querySelector('.wallet-adapter-button-trigger');
      if (walletButton) {
        walletButton.classList.add('wallet-status-enhanced');
        setTimeout(() => {
          walletButton.classList.remove('wallet-status-enhanced');
        }, 1000);
      }
    };
    
    window.addEventListener('walletChange', handleWalletChange);
    
    return () => {
      window.removeEventListener('walletChange', handleWalletChange);
    };
  }, []);
  
  // Use devnet for development, mainnet-beta for production
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => NETWORK_ENDPOINT, []);

  // Enhanced wallet adapters with more wallet options
  // Define wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter({ network })
    ],
    [network]
  );

  // Don't render until client-side to prevent hydration issues
  if (!mounted) return null;

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={true}
        onError={(error) => {
          console.error('Wallet error:', error);
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