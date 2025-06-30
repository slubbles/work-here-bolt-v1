'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function MinimalistWalletConnect() {
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
    } catch (err) {
      setError('Failed to open wallet connection dialog');
    } finally {
      // Reset connecting state after a delay to account for user interaction
      setTimeout(() => setConnecting(false), 500);
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

  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Don't render until mounted to prevent hydration errors
  if (!mounted) return null;

  return (
    <div className="w-full max-w-sm mx-auto text-center p-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">
          {connected ? 'Wallet Connected' : 'Connect Wallet'}
        </h2>
        
        <p className="text-muted-foreground text-center text-sm">
          {connected 
            ? `Connected as ${publicKey ? formatAddress(publicKey.toString()) : ''}`
            : 'Connect your Solana wallet to continue'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="pt-2">
          {connected ? (
            <Button 
              onClick={handleDisconnect}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              Disconnect
            </Button>
          ) : (
            <Button 
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}