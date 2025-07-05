'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

export default function NetworkStatusBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  
  const { 
    selectedNetwork, 
    setSelectedNetwork, 
    connected, 
    networkConfig 
  } = useAlgorandWallet();

  // Check if user has dismissed this banner before
  useEffect(() => {
    const dismissedKey = `network-banner-dismissed-${selectedNetwork}`;
    const wasDismissed = localStorage.getItem(dismissedKey) === 'true';
    setDismissed(wasDismissed);
  }, [selectedNetwork]);

  const handleDismiss = () => {
    const dismissedKey = `network-banner-dismissed-${selectedNetwork}`;
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
    setIsVisible(false);
  };

  const handleSwitchToMainnet = () => {
    setSelectedNetwork('algorand-mainnet');
    handleDismiss();
  };

  const handleSwitchToTestnet = () => {
    setSelectedNetwork('algorand-testnet');
    handleDismiss();
  };

  // Don't show if dismissed or if already on desired network
  if (dismissed || !isVisible) {
    return null;
  }

  // Show mainnet reminder for testnet users
  if (selectedNetwork === 'algorand-testnet') {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Info className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-yellow-500 font-medium">Using Algorand Testnet</span>
                <span className="text-muted-foreground ml-2">
                  For production tokens, switch to Mainnet
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSwitchToMainnet}
                className="text-xs border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
              >
                Switch to Mainnet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success message for mainnet users
  if (selectedNetwork === 'algorand-mainnet') {
    return (
      <div className="fixed top-16 left-0 right-0 z-40 bg-green-500/10 border-b border-green-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-green-500 font-medium">Connected to Algorand Mainnet</span>
                <span className="text-muted-foreground ml-2">
                  Ready for production token deployment
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSwitchToTestnet}
                className="text-xs border-green-500/30 text-green-500 hover:bg-green-500/10"
              >
                Switch to Testnet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
