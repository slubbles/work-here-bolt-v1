'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, Flame, BarChart3, Network, Sparkles, TrendingUp, Pause } from 'lucide-react';

interface TokenPreviewProps {
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    totalSupply: string;
    decimals: string;
    logoUrl: string;
    website: string;
    github: string;
    twitter: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
    network: string;
  };
}

export default function TokenPreview({ tokenData }: TokenPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [tokenGlowClass, setTokenGlowClass] = useState('');

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Handle image loading state
  useEffect(() => {
    if (tokenData.logoUrl) {
      setIsImageLoading(true);
      const img = new Image();
      img.onload = () => setIsImageLoading(false);
      img.onerror = () => setIsImageLoading(false);
      img.src = tokenData.logoUrl;
    } else {
      setIsImageLoading(false);
    }
  }, [tokenData.logoUrl]);

  // Generate personalized glow effect based on token symbol
  useEffect(() => {
    if (tokenData.symbol) {
      const symbolHash = tokenData.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const glowOptions = ['token-glow-red', 'token-glow-blue', 'token-glow-green', 'token-glow-purple', 'token-glow-yellow'];
      const selectedGlow = glowOptions[symbolHash % glowOptions.length];
      setTokenGlowClass(selectedGlow);
    }
  }, [tokenData.symbol]);

  const {
    name,
    symbol,
    description,
    totalSupply,
    decimals,
    logoUrl,
    mintable,
    burnable,
    pausable,
    network,
  } = tokenData;

  const formatSupply = (supply: string) => {
    const num = parseFloat(supply) || 0;
    return num.toLocaleString();
  };

  const getNetworkInfo = (networkValue: string) => {
    const networks = {
      'solana-devnet': {
        name: 'Solana Devnet',
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        description: 'Testing Environment - Free'
      },
      'solana-mainnet': {
        name: 'Solana Mainnet',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        description: 'Production Network - ~$2-5'
      },
      'algorand-testnet': { 
        name: 'Algorand TestNet',
        color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
        description: 'Ultra Low Cost - ~$0.001'
      },
      'algorand-mainnet': {
        name: 'Algorand MainNet',
        color: 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30', 
        description: 'Production Network - ~$0.002'
      },
      'soon-network': {
        name: 'Soon Network',
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        description: 'Next-gen Blockchain - Coming Soon'
      }
    };
    return networks[networkValue as keyof typeof networks] || networks['solana-devnet'];
  };

  const networkInfo = getNetworkInfo(network);

  // Simple loading state without skeleton complexity
  if (isLoading) {
    return (
      <div className="xl:sticky xl:top-24 space-y-6">
        <div className="text-center">
          <div className="animate-pulse bg-muted h-10 w-48 rounded mx-auto mb-4"></div>
          <div className="animate-pulse bg-muted h-6 w-64 rounded mx-auto"></div>
        </div>
        <div className="glass-card p-10">
          <div className="text-center">
            <div className="animate-pulse bg-muted w-40 h-40 rounded-full mx-auto mb-8"></div>
            <div className="animate-pulse bg-muted h-8 w-48 rounded mx-auto mb-4"></div>
            <div className="animate-pulse bg-muted h-6 w-16 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="xl:sticky xl:top-24 space-y-6">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <h2 className="text-4xl font-bold text-foreground">Live Preview</h2>
          <Sparkles className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-muted-foreground text-xl">
          This is how your token will appear after creation
        </p>
      </div>

      <div className="text-center">
        <Badge className={`${networkInfo.color} text-base px-6 py-3 rounded-xl font-bold shadow-md`}>
          <Network className="w-4 h-4 mr-2" />
          {networkInfo.name}
        </Badge>
        <p className="text-sm text-muted-foreground mt-3">{networkInfo.description}</p>
      </div>

      <div className="glass-card p-10 space-y-8 relative overflow-hidden">
        <div className="text-center space-y-8 relative z-10">
          <div className="text-base text-muted-foreground uppercase tracking-wide font-bold">Token Details</div>
          
          <div className="flex justify-center relative">
            {logoUrl && !isImageLoading ? (
              <div className={`relative ${tokenGlowClass}`}>
                <img
                  src={logoUrl}
                  alt={name}
                  className="w-40 h-40 rounded-full object-cover border-4 border-red-500/50 shadow-2xl transition-all duration-500"
                />
                <div className="absolute -inset-3 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full blur-lg animate-pulse"></div>
              </div>
            ) : isImageLoading ? (
              <div className="w-40 h-40 rounded-full bg-muted animate-pulse flex items-center justify-center border-4 border-muted">
                <div className="text-muted-foreground text-xs">Loading...</div>
              </div>
            ) : (
              <div className={`token-preview-circle w-40 h-40 text-3xl relative ${tokenGlowClass} transition-all duration-500`}>
                {symbol.slice(0, 3).toUpperCase() || 'TKN'}
                <div className="absolute inset-0 rounded-full border-2 border-current opacity-30 animate-ping"></div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {name ? (
              <h3 className="text-4xl font-bold text-foreground">{name}</h3>
            ) : (
              <div className="w-48 h-10 bg-muted animate-pulse rounded mx-auto"></div>
            )}
            {symbol ? (
              <p className="text-muted-foreground text-2xl font-bold">{symbol.toUpperCase()}</p>
            ) : (
              <div className="w-16 h-6 bg-muted animate-pulse rounded mx-auto"></div>
            )}
          </div>

          {description && (
            <div className="glass-card p-6 bg-muted/20 rounded-xl">
              <p className="text-muted-foreground leading-relaxed text-lg">
                {description}
              </p>
            </div>
          )}
        </div>

        <div className="text-base text-muted-foreground uppercase tracking-wide text-center font-bold">
          Available Actions
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-14 rounded-xl text-base font-semibold"
          >
            <Send className="w-4 h-4 mr-2" />
            Transfer
          </Button>
          
          {mintable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-14 rounded-xl text-base font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Mint
            </Button>
          )}
          
          {burnable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-14 rounded-xl text-base font-semibold"
            >
              <Flame className="w-4 h-4 mr-2" />
              Burn
            </Button>
          )}
          
          {pausable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-14 rounded-xl text-base font-semibold"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-14 rounded-xl text-base font-semibold col-span-2"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>

        <div className="pt-8 border-t border-border text-center">
          <div className="flex items-center justify-center space-x-2 text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-base font-bold">
              Ready for deployment to {networkInfo.name}
              {network.includes('algorand') && (
                <span className="ml-2 text-sm opacity-75">
                  ({network === 'algorand-mainnet' ? 'Production' : 'Testing'})
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <h4 className="text-foreground font-bold text-2xl">Deployment Details</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
            <span className="text-muted-foreground font-semibold text-base">Network:</span>
            <div className="flex items-center space-x-2">
              <Badge className={`${networkInfo.color} text-xs px-3 py-1 rounded-lg font-semibold`}>
                {networkInfo.name}
              </Badge>
              {network.includes('algorand') && (
                <span className="text-xs text-muted-foreground">
                  ({network === 'algorand-mainnet' ? 'Production' : 'Testing'})
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
            <span className="text-muted-foreground font-semibold text-base">Symbol:</span>
            <span className="text-foreground font-bold text-lg">{symbol.toUpperCase() || 'TKN'}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
            <span className="text-muted-foreground font-semibold text-base">Supply:</span>
            <span className="text-foreground font-bold text-lg">{formatSupply(totalSupply) || '0'}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/30 rounded-xl">
            <span className="text-muted-foreground font-semibold text-base">Decimals:</span>
            <span className="text-foreground font-bold text-lg">{decimals || '9'}</span>
          </div>
        </div>

        {(mintable || burnable || pausable) && (
          <div className="pt-6 border-t border-border">
            <p className="text-muted-foreground font-bold mb-4 text-lg">Smart Contract Features</p>
            <div className="flex flex-wrap gap-3">
              {mintable && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-base px-4 py-2 rounded-xl font-bold">
                  <Plus className="w-3 h-3 mr-1" />
                  Mintable
                </Badge>
              )}
              {burnable && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-base px-4 py-2 rounded-xl font-bold">
                  <Flame className="w-3 h-3 mr-1" />
                  Burnable
                </Badge>
              )}
              {pausable && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-base px-4 py-2 rounded-xl font-bold">
                  <Pause className="w-3 h-3 mr-1" />
                  Pausable
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}