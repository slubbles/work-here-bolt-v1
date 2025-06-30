'use client';

import { useState } from 'react';
import TokenForm from '@/components/TokenForm';
import TokenPreview from '@/components/TokenPreview';
import { CheckCircle, Zap, AlertTriangle } from 'lucide-react';
import { Callout } from '@/components/ui/callout';
import { NetworkBadge } from '@/components/GuideBadge';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

export default function CreateTokenPage() {
  const [tokenData, setTokenData] = useState({
    name: 'My Awesome Token',
    symbol: 'MAT',
    description: 'A versatile utility token for my community',
    totalSupply: '1000000',
    decimals: '9', // Smart default: 9 decimals (recommended)
    logoUrl: '',
    website: 'https://mytoken.xyz',
    github: 'https://github.com/mytoken',
    twitter: 'https://twitter.com/mytoken',
    mintable: true,
    burnable: false, 
    pausable: false,
    network: 'solana-devnet', 
  });
  
  const [showTips, setShowTips] = useState(false);
  const { connected: solanaConnected } = useWallet();
  const { connected: algorandConnected } = useAlgorandWallet();
  
  // Check if any wallet is connected
  const isAnyWalletConnected = solanaConnected || algorandConnected;
  // Check if a wallet is needed for the current network
  const needsWalletConnection = (tokenData.network.includes('algorand') && !algorandConnected) ||
                               (tokenData.network.includes('solana') && !solanaConnected);
  
  // Auto-show wallet requirement notice if no wallet is connected                           
  useEffect(() => {
    if (needsWalletConnection && !showTips) {
      setShowTips(true);
    }
  }, [needsWalletConnection]);
  
  return (
    <div className="min-h-screen app-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Create Your Token <span className="text-red-500">Instantly</span>
          </h1>
          <div className="space-y-2">
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Design and deploy your cryptocurrency token in just minutes - no coding required
            </p>
            <div className="flex justify-center gap-2 mt-2">
              <NetworkBadge network="algorand-testnet" />
              <NetworkBadge network="algorand-mainnet" />
              <NetworkBadge network="solana-devnet" />
            </div>
          </div>
        </div>
        
        {/* Subtle visual cue for new users */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-600">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span>First time? Fill in details below and connect wallet before creating</span>
          </div>
        </div>
        
        {/* Wallet Connection Notice */}
        {needsWalletConnection && (
          <div className="mb-8">
            <Callout 
              variant="warn" 
              title="Wallet Connection Required" 
              icon="warn"
            >
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                <p>Connect your {tokenData.network.includes('algorand') ? 'Algorand' : 'Solana'} wallet from the top navigation bar before deploying your token.</p>
              </div>
            </Callout>
          </div>
        )}
        
        {showTips && (
          <div className="mb-8 glass-card p-6 border-blue-500/30 hover:border-blue-500/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-14 h-14 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-7 h-7 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-xl mb-2">Quick Tips for Success</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-base text-muted-foreground">Complete each step in order</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-base text-muted-foreground">Preview updates in real-time</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-base text-muted-foreground">Connect wallet before deploying</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-16">
          <div className="order-2 xl:order-1 xl:col-span-7 xl:pr-4">
            <TokenForm tokenData={tokenData} setTokenData={setTokenData} />
          </div>
          <div className="order-1 xl:order-2 xl:col-span-5 xl:pl-4">
            <TokenPreview tokenData={tokenData} />
          </div>
        </div>
      </div>
    </div>
  );
}