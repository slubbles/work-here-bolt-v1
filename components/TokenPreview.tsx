'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, Plus, Flame, BarChart3, Network, Sparkles, TrendingUp, Pause, Wallet, Check, HelpCircle, ExternalLink, Shield } from 'lucide-react';
import { Callout } from '@/components/ui/callout';

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
    }, 400);
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
    if (!supply) return '0';
    const num = parseFloat(supply) || 0;
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1) + 'B';
    } else if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num >= 1_000) {
      return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const getNetworkInfo = (networkValue: string) => {
    if (networkValue === 'algorand') {
      // Use the current Algorand network from the provider
      return {
        name: 'Algorand Network',
        color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
        description: 'Ultra Low Cost - ~$0.001'
      };
    } else if (networkValue === 'solana') {
      return {
        name: 'Solana Devnet',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        description: 'Testing Environment - Free'
      };
    }
    
    // Legacy fallback
    const networks = {
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
    return networks[networkValue as keyof typeof networks] || {
      name: 'Solana Devnet',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: 'Testing Environment - Free'
    };
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

  // Enhanced header text based on network
  const getHeaderText = () => {
    if (network === 'algorand') {
      return 'Algorand Network Preview';
    } else if (network === 'solana') {
      return 'Solana Network Preview';
    }
    return 'Live Preview';
  };

  return (
    <div className="xl:sticky xl:top-24 space-y-6 pb-4">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center pulse-ring">
            <Sparkles className="w-5 h-5 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{getHeaderText()}</h2>
        </div>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Live preview of how your token will appear on the blockchain
        </p>
      </div>

      <div className="text-center">
        <Badge className={`${networkInfo.color} text-base px-6 py-3 rounded-xl font-bold shadow-md`}>
          <Network className="w-4 h-4 mr-2" />
          {networkInfo.name}
          {network.includes('testnet') && ( 
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3 h-3 ml-2 text-white/80" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Testnet tokens are for testing and have no real value</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Badge>
        <p className="text-sm text-muted-foreground mt-3">{networkInfo.description}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Badge 
            variant="outline"
            className="text-xs px-2 py-1 bg-green-500/10 text-green-500 border-green-500/30"
          >
            {decimals} Decimals
          </Badge>
          <Badge 
            variant="outline"
            className="text-xs px-2 py-1 bg-blue-500/10 text-blue-500 border-blue-500/30"
          >
            {tokenData.mintable ? 'Mintable' : 'Fixed Supply'}
          </Badge>
        </div>
      </div>

      <div className="glass-card p-10 space-y-8 relative overflow-hidden border-2 border-red-500/30 shadow-xl">
        {/* "Looking good" floating banner */}
        <div className="absolute top-4 right-4 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
          <Check className="w-4 h-4 mr-2" /> 
          Ready to Deploy!
        </div>
        
        {/* First-time creator help */}
        <div className="absolute top-4 left-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-blue-500/20 text-blue-500 border border-blue-500/20 rounded-full p-1 cursor-help">
                  <HelpCircle className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium mb-1">Live Preview</p>
                  <p className="text-xs">This is how your token will look when deployed to the blockchain. All changes update in real-time.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      
        <div className="text-center space-y-6 relative z-10">
          <div className="text-base text-foreground uppercase tracking-wide font-bold border-b border-border pb-2">TOKEN DETAILS</div>
          
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
                <div className="absolute inset-0 rounded-full border-4 border-red-500/20 opacity-70 animate-pulse"></div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {name ? (
              <h3 className="text-3xl font-bold text-foreground">{name}</h3>
            ) : (
              <div className="w-48 h-10 bg-muted animate-pulse rounded mx-auto"></div>
            )}
            {symbol ? (
              <p className="text-muted-foreground text-2xl font-bold">{symbol.toUpperCase()}</p>
            ) : (
              <>
                <div className="w-16 h-6 bg-muted animate-pulse rounded mx-auto"></div>
                <div>
                  <p className="text-base font-medium text-green-600">
                    Ready to deploy on {networkInfo.name}
                  </p>
                  <Link href="/support" className="text-xs text-blue-500 hover:underline flex items-center mt-0.5">
                    Need help? <ExternalLink className="w-3 h-3 ml-0.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="text-base text-muted-foreground uppercase tracking-wide text-center font-bold">
          TOKEN ACTIONS
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm font-semibold hover:border-red-500/30 hover:shadow-md transition-all"
          >
            <Send className="w-4 h-4 mr-2" />
            Transfer
          </Button>
          
          {mintable && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm font-semibold hover:border-green-500/30 hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Mint
            </Button>
          )}
          
          {burnable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm font-semibold hover:border-red-500/30 hover:shadow-md transition-all"
            >
              <Flame className="w-4 h-4 mr-2" />
              Burn
            </Button>
          )}
          
          {pausable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm font-semibold hover:border-yellow-500/30 hover:shadow-md transition-all"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm font-semibold hover:border-yellow-500/30 hover:shadow-md transition-all"
          >
            <Shield className="w-4 h-4 mr-2" />
            Verify
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm font-semibold col-span-2 hover:border-blue-500/30 hover:shadow-md transition-all"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>

        <div className="pt-8 border-t border-border text-center relative">
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg inline-flex items-center space-x-3 hover:bg-green-500/20 hover:border-green-500/50 transition-all shadow-sm pulse-ring">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
              <Check className="w-3 h-3 text-white animate-pulse" />
            </div>
            <p className="text-base font-medium text-green-600">
              Ready to deploy on {networkInfo.name}
              {network.includes('algorand') && (
                <span className="ml-1 text-xs opacity-85">
                  (Network Ready)
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-8 space-y-6 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-500/10 rounded-full flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-red-500" />
          </div>
          <h4 className="text-foreground font-bold text-xl">Token Summary</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all">
            <span className="text-muted-foreground font-semibold text-base">Network:</span>
            <div className="flex items-center space-x-2">
              <Badge className={`${networkInfo.color} text-xs px-3 py-1 rounded-lg font-semibold`}>
                {networkInfo.name}
              </Badge>
              {network.includes('algorand') && (
                <span className="text-xs text-muted-foreground">
                  (Ready for Deployment)
                </span>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all">
            <span className="text-muted-foreground font-semibold text-base">Symbol:</span>
            <span className="text-foreground font-bold text-lg">{symbol.toUpperCase() || 'TKN'}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all">
            <span className="text-muted-foreground font-semibold text-base">Supply:</span>
            <span className="text-foreground font-bold text-lg">{formatSupply(totalSupply) || '0'}</span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all">
            <span className="text-muted-foreground font-semibold text-base">Decimals:</span>
            <span className="text-foreground font-bold text-lg">{decimals || '9'}</span>
          </div>
        </div>

        {(mintable || burnable || pausable) && (
          <div className="pt-6 border-t border-border">
            <p className="text-muted-foreground font-bold mb-4 text-lg">Smart Contract Features</p>
            <div className="flex flex-wrap gap-3">
              <Badge className={`text-base px-4 py-2 rounded-lg font-bold transition-all ${mintable 
                ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' 
                : 'bg-muted/50 text-muted-foreground border-muted/80'}`}>
                <Plus className="w-3 h-3 mr-1" />
                Mintable {mintable ? '✓' : '✗'}
              </Badge>
              
              <Badge className={`text-base px-4 py-2 rounded-lg font-bold transition-all ${burnable 
                ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
                : 'bg-muted/50 text-muted-foreground border-muted/80'}`}>
                <Flame className="w-3 h-3 mr-1" />
                Burnable {burnable ? '✓' : '✗'}
              </Badge>
              
              <Badge className={`text-base px-4 py-2 rounded-lg font-bold transition-all ${pausable 
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30' 
                : 'bg-muted/50 text-muted-foreground border-muted/80'}`}>
                <Pause className="w-3 h-3 mr-1" />
                Pausable {pausable ? '✓' : '✗'}
              </Badge>
            </div>
          </div>
        )}
        
        <div className="pt-4 flex justify-center">
          <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground border border-muted">
            <Wallet className="w-4 h-4" />
            <span>Fully decentralized - managed with your blockchain wallet</span>
          </div>
        </div>
      </div>
    </div>
  );
}