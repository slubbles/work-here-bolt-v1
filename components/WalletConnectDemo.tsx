'use client';

import { useState, useEffect } from 'react';
import WalletConnectButton from './WalletConnectButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function WalletConnectDemo() {
  const [mounted, setMounted] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = () => {
    try {
      setError(null);
      setConnecting(true);
      setVisible(true);
      
      // Reset connecting state after a delay to account for user interaction
      setTimeout(() => setConnecting(false), 1000);
    } catch (err) {
      setError('Failed to open wallet connection dialog');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await disconnect();
    } catch (err) {
      setError('Failed to disconnect wallet');
    }
  };

  // Don't render until mounted to prevent hydration errors
  if (!mounted) return null;

  return (
    <div className="w-full max-w-md mx-auto text-center p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">
          {connected ? 'Wallet Connected' : 'Connect Wallet'}
        </h2>
        
        <p className="text-muted-foreground text-center">
          {connected 
            ? `Connected to Solana network`
            : 'Connect your Solana wallet to continue'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="pt-2">
          <WalletConnectButton 
            isConnected={connected}
            isConnecting={connecting}
            walletAddress={publicKey?.toString()}
            onClick={handleConnect}
            onDisconnect={handleDisconnect}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}