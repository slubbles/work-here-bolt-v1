'use client';

import { useState, useEffect } from 'react';
import TokenForm from '@/components/TokenForm';
import TokenPreview from '@/components/TokenPreview';
import { CheckCircle, Zap } from 'lucide-react';

export default function CreateTokenPage() {
  const [tokenData, setTokenData] = useState({
    name: 'My Awesome Token',
    symbol: 'MAT',
    description: '',
    totalSupply: '1000000',
    decimals: '9', // Smart default: 9 decimals (recommended)
    logoUrl: '',
    website: '',
    github: '',
    twitter: '',
    mintable: true,
    burnable: false,
    pausable: false,
    network: 'algorand-testnet',
  });
  
  const [showTips, setShowTips] = useState(true);
  
  // Hide tips after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTips(false);
    }, 15000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen app-background pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Create Your Token</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Design and deploy your cryptocurrency token in minutes
          </p>
        </div>
        
        {showTips && (
          <div className="mb-8 glass-card p-4 border-blue-500/30">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Quick Tips</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Complete each step in order</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Preview updates in real-time</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span className="text-sm text-muted-foreground">Connect wallet before deploying</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
          <div className="order-2 xl:order-1">
            <div className="xl:col-span-7">
              <TokenForm tokenData={tokenData} setTokenData={setTokenData} />
            </div>
          </div>
          <div className="order-1 xl:order-2">
            <div className="xl:col-span-5">
              <TokenPreview tokenData={tokenData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}