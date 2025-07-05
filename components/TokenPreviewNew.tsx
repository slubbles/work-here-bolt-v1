'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, Plus, Flame, BarChart3, Network, Sparkles, TrendingUp, Pause, Wallet, Check, HelpCircle, ExternalLink, Shield, Eye, Globe, Github, Twitter, Coins, Zap } from 'lucide-react';

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

export default function TokenPreviewNew({ tokenData }: TokenPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    setMounted(true);
  }, []);

  // Real-time update animation trigger
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => {
      setIsUpdating(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [tokenData]);

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

  const {
    name,
    symbol,
    description,
    totalSupply,
    decimals,
    logoUrl,
    website,
    github,
    twitter,
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
    if (networkValue.includes('algorand')) {
      const isMainnet = networkValue.includes('mainnet');
      return {
        name: isMainnet ? 'Algorand Mainnet' : 'Algorand Testnet',
        color: isMainnet ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30' : 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
        description: isMainnet ? 'Ultra Low Cost - ~$0.001' : 'Testing Environment - Free',
        cost: isMainnet ? '~$0.001' : 'Free'
      };
    } else if (networkValue.includes('solana')) {
      const isMainnet = networkValue.includes('mainnet');
      return {
        name: isMainnet ? 'Solana Mainnet' : 'Solana Devnet',
        color: isMainnet ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        description: isMainnet ? 'Fast & Efficient - ~$0.01' : 'Testing Environment - Free',
        cost: isMainnet ? '~$0.01' : 'Free'
      };
    }
    return {
      name: 'Unknown Network',
      color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      description: 'Unknown',
      cost: 'Unknown'
    };
  };

  const networkInfo = getNetworkInfo(network);

  const features = [
    { key: 'mintable', label: 'Mintable', icon: Plus, active: mintable, color: 'text-green-400' },
    { key: 'burnable', label: 'Burnable', icon: Flame, active: burnable, color: 'text-red-400' },
    { key: 'pausable', label: 'Pausable', icon: Pause, active: pausable, color: 'text-yellow-400' },
  ];

  const hasAnyLinks = website || github || twitter;

  return (
    <div className={`sticky top-8 space-y-8 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      {/* Enhanced Live Preview Header with Real-time Animation */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 rounded-full shadow-lg transition-all duration-300 ${isUpdating ? 'bg-red-500 animate-pulse shadow-red-500/50 scale-125' : 'bg-green-500 animate-pulse shadow-green-500/50'}`} />
          <h2 className="text-2xl font-bold text-foreground">Live Preview</h2>
          {isUpdating && (
            <div className="px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-medium animate-bounce">
              Updating...
            </div>
          )}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent" />
        <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-sm font-medium">
          Real-time
        </div>
      </div>

      {/* Enhanced Main Token Card with Better Design */}
      <div className={`relative overflow-hidden rounded-3xl glass-card hover:border-red-500/50 transition-all duration-500 group shadow-2xl border-2 border-red-500/20 ${isUpdating ? 'scale-[1.02] shadow-red-500/20' : 'scale-100'}`}>
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/3 to-blue-500/3 opacity-50" />
        
        {/* Content */}
        <div className="relative z-10 p-8 space-y-8">
          {/* Enhanced Header Section */}
          <div className="flex items-start space-x-6">
            {/* Enhanced Token Logo */}
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border-2 border-border flex items-center justify-center overflow-hidden shadow-lg">
                {logoUrl && !isImageLoading ? (
                  <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="w-full h-full object-cover rounded-3xl"
                    onError={() => setIsImageLoading(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Coins className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Enhanced Glow Effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-red-500/30 to-red-600/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Enhanced Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col space-y-3 mb-3">
                <h3 className="text-2xl font-bold text-foreground truncate">
                  {name || 'Token Name'}
                </h3>
                {symbol && (
                  <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-sm font-mono px-3 py-1 w-fit">
                    ${symbol.toUpperCase()}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                {description || 'Token description will appear here...'}
              </p>
            </div>
          </div>

          {/* Enhanced Network Badge */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border">
            <div className={`inline-flex items-center space-x-3 px-4 py-2 rounded-xl border ${networkInfo.color} text-sm font-semibold`}>
              <Network className="w-5 h-5" />
              <span>{networkInfo.name}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Deployment Cost</div>
              <div className="text-lg font-bold text-green-500">{networkInfo.cost}</div>
            </div>
          </div>

          {/* Enhanced Token Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-card/50 to-card/30 rounded-2xl p-6 border border-border hover:border-red-500/30 transition-all duration-300 group">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Total Supply</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">
                  {formatSupply(totalSupply)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {totalSupply ? parseInt(totalSupply).toLocaleString() : '0'} tokens
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-card/50 to-card/30 rounded-2xl p-6 border border-border hover:border-blue-500/30 transition-all duration-300 group">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground">Decimals</span>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-foreground">
                  {decimals || '9'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Precision level
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Token Features */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-foreground flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>Token Features</span>
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                    feature.active 
                      ? 'bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30 shadow-lg shadow-green-500/10' 
                      : 'bg-card/30 border border-border hover:border-muted-foreground/30'
                  }`}>
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        feature.active 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'bg-muted/50'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          feature.active ? feature.color : 'text-muted-foreground'
                        }`} />
                      </div>
                      <span className={`font-semibold ${
                        feature.active ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {feature.label}
                      </span>
                    </div>
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      feature.active ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-muted border-2 border-muted-foreground'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced Social Links */}
          {hasAnyLinks && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-foreground flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <span>Social Links</span>
              </h4>
              <div className="space-y-3">
                {website && (
                  <div className="flex items-center space-x-4 p-3 rounded-xl bg-card/30 border border-border hover:border-blue-500/30 transition-all duration-300 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors duration-300">
                      <Globe className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Website</span>
                    <div className="flex-1" />
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors duration-300" />
                  </div>
                )}
                {github && (
                  <div className="flex items-center space-x-4 p-3 rounded-xl bg-card/30 border border-border hover:border-purple-500/30 transition-all duration-300 group">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors duration-300">
                      <Github className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground">GitHub</span>
                    <div className="flex-1" />
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-purple-500 transition-colors duration-300" />
                  </div>
                )}
                {twitter && (
                  <div className="flex items-center space-x-4 p-3 rounded-xl bg-card/30 border border-border hover:border-blue-400/30 transition-all duration-300 group">
                    <div className="w-8 h-8 rounded-lg bg-blue-400/20 flex items-center justify-center group-hover:bg-blue-400/30 transition-colors duration-300">
                      <Twitter className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Twitter</span>
                    <div className="flex-1" />
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors duration-300" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Pro Tips Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-lg font-bold text-red-500 mb-3">Pro Tips</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Start with testnet for your first token</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Add a logo URL for better recognition</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Consider decimal places carefully</span>
              </li>
              <li className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Enable features based on your needs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enhanced Deployment Readiness */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-green-500 mb-2">Ready to Launch</h4>
            <p className="text-sm text-muted-foreground">
              Your professional token will be deployed to{' '}
              <span className="font-semibold text-green-500">{networkInfo.name}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated cost: {networkInfo.cost}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
