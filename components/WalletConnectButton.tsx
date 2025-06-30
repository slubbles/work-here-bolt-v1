'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface WalletConnectButtonProps {
  onClick?: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
  walletAddress?: string;
  onDisconnect?: () => void;
  disabled?: boolean;
  className?: string;
}

export default function WalletConnectButton({
  onClick,
  isConnected = false,
  isConnecting = false,
  walletAddress,
  onDisconnect,
  disabled = false,
  className = '',
}: WalletConnectButtonProps) {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleClick = useCallback(() => {
    if (isConnected && onDisconnect) {
      onDisconnect();
    } else if (!isConnected && onClick) {
      onClick();
    }
  }, [isConnected, onClick, onDisconnect]);
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <button
      className={`
        min-h-[44px] min-w-[44px] px-6 py-3 
        font-sans text-base font-medium
        bg-[#EF4444] text-white
        rounded-md 
        transition-colors duration-200
        hover:bg-[#DC2626] 
        focus:outline-none focus:ring-2 focus:ring-[#EF4444] focus:ring-offset-2
        active:bg-[#B91C1C] 
        disabled:opacity-60 disabled:pointer-events-none
        ${className}
      `}
      onClick={handleClick}
      disabled={disabled || isConnecting}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      role="button"
      aria-label={isConnected ? 'Disconnect wallet' : 'Connect wallet'}
      tabIndex={0}
    >
      {isConnecting ? (
        <div className="flex items-center justify-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span>Connecting...</span>
        </div>
      ) : isConnected ? (
        <div className="flex items-center justify-center">
          {walletAddress ? formatAddress(walletAddress) : 'Disconnect'}
        </div>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}