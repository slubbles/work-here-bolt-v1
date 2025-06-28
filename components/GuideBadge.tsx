'use client';

import React from 'react';
import { HelpCircle, ExternalLink } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';

interface GuideBadgeProps {
  text: string;
  link?: string;
  side?: "top" | "bottom" | "left" | "right";
}

export function GuideBadge({ text, link, side = "top" }: GuideBadgeProps) {
  return (
    <Tooltip 
      content={
        <div className="max-w-xs">
          <p className="text-sm">{text}</p>
          {link && (
            <a 
              href={link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-1 text-xs text-blue-500 flex items-center hover:underline"
            >
              Learn more
              <ExternalLink className="ml-1 w-3 h-3" />
            </a>
          )}
        </div>
      }
      side={side}
    >
      <span className="ml-1.5 inline-flex items-center justify-center">
        <HelpCircle className="h-3.5 w-3.5 text-blue-500 hover:text-blue-600 transition-colors cursor-help" />
      </span>
    </Tooltip>
  );
}

export function NetworkBadge({ network, className }: { network: string, className?: string }) {
  // Get network colors based on name
  const getNetworkColors = () => {
    if (network.includes('algorand')) {
      if (network.includes('mainnet')) {
        return {
          bg: 'bg-[#00d4aa]/20',
          text: 'text-[#00d4aa]',
          border: 'border-[#00d4aa]/30'
        };
      } else {
        return {
          bg: 'bg-[#76f935]/20',
          text: 'text-[#76f935]',
          border: 'border-[#76f935]/30'
        };
      }
    } else if (network.includes('solana')) {
      return {
        bg: 'bg-blue-500/20',
        text: 'text-blue-500',
        border: 'border-blue-500/30'
      };
    }
    
    // Default
    return {
      bg: 'bg-muted/50',
      text: 'text-muted-foreground',
      border: 'border-border'
    };
  };
  
  const colors = getNetworkColors();
  const networkName = network
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  let tooltipText = '';
  if (network.includes('testnet')) {
    tooltipText = 'Testnet is for testing only. Tokens have no real value.';
  } else if (network.includes('mainnet')) {
    tooltipText = 'Mainnet is the production network where tokens have real value.';
  } else if (network.includes('devnet')) {
    tooltipText = 'Devnet is for development and testing. Tokens have no real value.';
  }
  
  return (
    <Tooltip content={tooltipText}>
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border ${className}`}>
        <span className="w-2 h-2 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: 'currentColor' }}></span>
        {networkName}
      </div>
    </Tooltip>
  );
}