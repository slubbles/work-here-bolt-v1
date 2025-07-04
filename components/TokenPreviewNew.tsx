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

  useEffect(() => {
    setIsLoading(false);
    setMounted(true);
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
    <div className={`sticky top-8 space-y-6 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
      {/* Live Preview Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
        <h2 className="text-lg font-semibold text-foreground">Live Preview</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent" />
      </div>

      {/* Main Token Card */}
      <div className="relative overflow-hidden rounded-2xl glass-card hover:border-red-500/50 transition-all duration-500 group">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-red-600/5 to-red-700/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Content */}
        <div className="relative z-10 p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-start space-x-4">
            {/* Token Logo */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-sm border border-border flex items-center justify-center overflow-hidden">
                {logoUrl && !isImageLoading ? (
                  <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="w-full h-full object-cover rounded-2xl"
                    onError={() => setIsImageLoading(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Coins className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Token Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-xl font-bold text-foreground truncate">
                  {name || 'Token Name'}
                </h3>
                {symbol && (
                  <Badge className="bg-red-500/20 text-red-500 border-red-500/30 text-xs font-mono">
                    ${symbol}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {description || 'Token description will appear here...'}
              </p>
            </div>
          </div>

          {/* Network Badge */}
          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${networkInfo.color} text-xs font-medium`}>
              <Network className="w-4 h-4" />
              <span>{networkInfo.name}</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Deployment Cost</div>
              <div className="text-sm font-medium text-green-500">{networkInfo.cost}</div>
            </div>
          </div>

          {/* Token Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium text-muted-foreground">Total Supply</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {formatSupply(totalSupply)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {totalSupply ? parseInt(totalSupply).toLocaleString() : '0'} tokens
              </div>
            </div>

            <div className="bg-card/50 rounded-xl p-4 border border-border">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-muted-foreground">Decimals</span>
              </div>
              <div className="text-lg font-bold text-foreground">
                {decimals || '9'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Precision level
              </div>
            </div>
          </div>

          {/* Token Features */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-500" />
              <span>Token Features</span>
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                    feature.active 
                      ? 'bg-green-500/10 border border-green-500/30' 
                      : 'bg-card/30 border border-border'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        feature.active 
                          ? 'bg-green-500/20' 
                          : 'bg-muted/50'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          feature.active ? feature.color : 'text-muted-foreground'
                        }`} />
                      </div>
                      <span className={`text-sm font-medium ${
                        feature.active ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {feature.label}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      feature.active ? 'bg-green-500' : 'bg-muted'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Social Links */}
          {hasAnyLinks && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Links</span>
              </h4>
              <div className="space-y-2">
                {website && (
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-card/30 border border-border">
                    <Globe className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-foreground">Website</span>
                    <div className="flex-1" />
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                {github && (
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-card/30 border border-border">
                    <Github className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-foreground">GitHub</span>
                    <div className="flex-1" />
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
                {twitter && (
                  <div className="flex items-center space-x-3 p-2 rounded-lg bg-card/30 border border-border">
                    <Twitter className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-foreground">Twitter</span>
                    <div className="flex-1" />
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pro Tips Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 p-4">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-red-500 mb-2">Pro Tips</h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                <span>Start with testnet for your first token</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                <span>Add a logo URL for better recognition</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-red-500 rounded-full" />
                <span>Consider decimal places carefully</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Deployment Readiness */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-green-500 mb-1">Ready to Launch</h4>
            <p className="text-xs text-muted-foreground">
              Your token will be deployed to <span className="font-medium text-green-500">{networkInfo.name}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
