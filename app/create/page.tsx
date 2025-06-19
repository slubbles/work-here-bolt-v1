'use client';

import { useState } from 'react';
import TokenForm from '@/components/TokenForm';
import TokenPreview from '@/components/TokenPreview';

export default function CreateTokenPage() {
  const [tokenData, setTokenData] = useState({
    name: 'My Awesome Token',
    symbol: 'MAT',
    description: '',
    totalSupply: '1000000',
    decimals: '9',
    logoUrl: '',
    website: '',
    github: '',
    twitter: '',
    mintable: true,
    burnable: false,
    pausable: false,
    network: 'algorand-testnet',
  });

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          <div className="order-2 xl:order-1">
            <TokenForm tokenData={tokenData} setTokenData={setTokenData} />
          </div>
          <div className="order-1 xl:order-2">
            <TokenPreview tokenData={tokenData} />
          </div>
        </div>
      </div>
    </div>
  );
}