'use client';

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
      'soon-network': {
        name: 'Soon Network',
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        description: 'Next-gen Blockchain - Coming Soon'
      }
    };
    return networks[networkValue as keyof typeof networks] || networks['solana-devnet'];
  };

  const networkInfo = getNetworkInfo(network);

  return (
    <div className="xl:sticky xl:top-24 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-5 h-5 text-red-500" />
          <h2 className="text-3xl font-bold text-foreground">Token Preview</h2>
          <Sparkles className="w-5 h-5 text-red-500" />
        </div>
        <p className="text-muted-foreground text-lg">
          This is how your token will appear after creation
        </p>
      </div>

      <div className="text-center">
        <Badge className={`${networkInfo.color} text-sm px-4 py-2 rounded-xl font-semibold`}>
          <Network className="w-4 h-4 mr-2" />
          {networkInfo.name}
        </Badge>
        <p className="text-xs text-muted-foreground mt-2">{networkInfo.description}</p>
      </div>

      <div className="glass-card p-8 space-y-8 relative overflow-hidden">
        <div className="text-center space-y-6 relative z-10">
          <div className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Token Details</div>
          
          <div className="flex justify-center relative">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt={name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-red-500/50 shadow-2xl"
                />
                <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full blur-lg"></div>
              </div>
            ) : (
              <div className="token-preview-circle w-32 h-32 text-2xl relative">
                {symbol.slice(0, 3).toUpperCase() || 'TKN'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-foreground">
              {name || 'My Token'}
            </h3>
            <p className="text-muted-foreground text-xl font-semibold">
              {symbol.toUpperCase() || 'TKN'}
            </p>
          </div>

          {description && (
            <div className="glass-card p-4 bg-muted/20">
              <p className="text-muted-foreground leading-relaxed text-base">
                {description}
              </p>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground uppercase tracking-wide text-center font-semibold">
          Available Actions
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Transfer
          </Button>
          
          {mintable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Mint
            </Button>
          )}
          
          {burnable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm"
            >
              <Flame className="w-4 h-4 mr-2" />
              Burn
            </Button>
          )}
          
          {pausable && (
            <Button 
              variant="outline" 
              size="sm" 
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground h-12 rounded-xl text-sm col-span-2"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>

        <div className="pt-6 border-t border-border text-center">
          <div className="flex items-center justify-center space-x-2 text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-semibold">Ready for deployment to {networkInfo.name}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-red-500" />
          <h4 className="text-foreground font-bold text-xl">Deployment Details</h4>
        </div>
        
        <div className="space-y-4 text-base">
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground font-medium">Network:</span>
            <Badge className={`${networkInfo.color} text-xs px-3 py-1 rounded-lg font-semibold`}>
              {networkInfo.name}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground font-medium">Symbol:</span>
            <span className="text-foreground font-bold">{symbol.toUpperCase() || 'TKN'}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground font-medium">Supply:</span>
            <span className="text-foreground font-bold">{formatSupply(totalSupply) || '1,000,000'}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
            <span className="text-muted-foreground font-medium">Decimals:</span>
            <span className="text-foreground font-bold">{decimals || '9'}</span>
          </div>
        </div>

        {(mintable || burnable || pausable) && (
          <div className="pt-4 border-t border-border">
            <p className="text-muted-foreground font-semibold mb-4 text-base">Smart Contract Features</p>
            <div className="flex flex-wrap gap-2">
              {mintable && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-3 py-2 rounded-lg font-semibold">
                  <Plus className="w-3 h-3 mr-1" />
                  Mintable
                </Badge>
              )}
              {burnable && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-sm px-3 py-2 rounded-lg font-semibold">
                  <Flame className="w-3 h-3 mr-1" />
                  Burnable
                </Badge>
              )}
              {pausable && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-sm px-3 py-2 rounded-lg font-semibold">
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