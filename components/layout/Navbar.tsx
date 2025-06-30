'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Sun, Moon, Wallet, ChevronDown, Copy, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { ADMIN_WALLET } from '@/lib/solana';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const pathname = usePathname();
  
  // Solana wallet
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  
  // Algorand wallet
  const { 
    connected: algorandConnected, 
    address: algorandAddress, 
    connect: connectAlgorand, 
    disconnect: disconnectAlgorand,
    selectedNetwork: algorandSelectedNetwork,
    setSelectedNetwork: setAlgorandSelectedNetwork,
    networkConfig: algorandNetworkConfig,
    isPeraWalletReady,
    isConnecting: algorandIsConnecting
  } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const navLinks = [
    { name: 'Create Token', href: '/create' },
    { name: 'Tokenomics Simulator', href: '/tokenomics' },
    { name: 'Token Verification', href: '/verify' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  // Check if user is admin
  const isAdmin = solanaConnected && solanaPublicKey && solanaPublicKey.toString() === ADMIN_WALLET.toString();

  // Handle navigation with loading state
  const handleNavigation = (href: string) => {
    // Show loading indicator for dashboard
    if (href === '/dashboard') {
      setIsMenuOpen(false); // Close mobile menu immediately
      // Add loading class to show immediate feedback
      document.body.classList.add('dashboard-loading');
      setTimeout(() => {
        document.body.classList.remove('dashboard-loading');
      }, 3000);
    }
  };
  
  const handleAlgorandConnect = async () => {
    try {
      await connectAlgorand();
      setShowWalletOptions(false);
    } catch (error) {
      console.error('Failed to connect Algorand wallet:', error);
    }
  };

  const handleAlgorandDisconnect = async () => {
    try {
      await disconnectAlgorand();
    } catch (error) {
      console.error('Failed to disconnect Algorand wallet:', error);
    }
  };

  const copyToClipboard = async (address: string, walletType: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
        </div>
      </div>
    );
  }

  const isAnyWalletConnected = solanaConnected || algorandConnected;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'backdrop-blur-xl border-b shadow-lg' 
        : 'backdrop-blur-sm border-b'
    }`} 
         style={{
           backgroundColor: isScrolled 
             ? (theme === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(254, 253, 224, 0.95)')
             : (theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(254, 253, 224, 0.8)'),
           borderColor: theme === 'dark' ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)'
         }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <img src="/Untitled design.png" alt="Snarbles Logo" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-2xl font-bold text-foreground group-hover:text-red-500 transition-colors">
                Snarbles
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => handleNavigation(link.href)}
                className={`text-muted-foreground hover:text-foreground transition-all duration-200 font-medium relative group ${
                  pathname === link.href ? 'text-red-500' : ''
                }`}
              >
                {link.name}
                <div className={`absolute -bottom-1 left-0 h-0.5 bg-red-500 transition-all duration-300 ${
                  pathname === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></div>
              </Link>
            ))}
            
            {/* Admin Link */}
            {isAdmin && (
              <Link
                href="/admin"
                className={`text-muted-foreground hover:text-foreground transition-all duration-200 font-medium relative group ${
                  pathname === '/admin' ? 'text-red-500' : ''
                }`}
              >
                Admin
                <div className={`absolute -bottom-1 left-0 h-0.5 bg-red-500 transition-all duration-300 ${
                  pathname === '/admin' ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></div>
              </Link>
            )}
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl p-2"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            {/* Enhanced Multi-Wallet Connection */}
            <div className="relative">
              {isAnyWalletConnected ? (
                <div className="flex items-center space-x-2">
                  {/* Wallet Connection Indicator Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowWalletOptions(!showWalletOptions)}
                    className="bg-background/80 border-border px-3 py-1.5 h-auto rounded-full hover:bg-muted/80 backdrop-blur-sm shadow-sm"
                  >
                    <div className="flex items-center space-x-2">
                      {solanaConnected && (
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#AB9FF2]">
                            <span className="text-white font-bold text-xs">S</span>
                          </div>
                        </div>
                      )}
                      
                      {algorandConnected && (
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#22C55E]">
                            <span className="text-white font-bold text-xs">A</span>
                          </div>
                        </div>
                      )}
                      
                      <span className="text-foreground font-medium text-sm">
                        {solanaConnected && algorandConnected
                          ? "2 Wallets"
                          : solanaConnected
                            ? formatAddress(solanaPublicKey!.toString())
                            : formatAddress(algorandAddress!)}
                      </span>
                      
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  </Button>
                  
                  {/* Wallet Options Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWalletOptions(!showWalletOptions)}
                    className="border-border text-muted-foreground hover:bg-muted rounded-lg p-1.5"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowWalletOptions(!showWalletOptions)}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl px-4 py-2 h-9 shadow-lg hover:shadow-xl transition-all"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}

              {/* Enhanced Wallet Options Dropdown */}
              {showWalletOptions && (
                <div className="absolute right-0 top-full mt-2 w-96 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="p-6">
                    <div className="mb-6 text-center">
                      <h3 className="text-foreground font-bold text-2xl mb-1">Wallet Management</h3>
                      <p className="text-muted-foreground text-sm">Connect or manage your wallets</p>
                    </div>
                    
                    {/* Wallet Cards Container */}
                    <div className="grid grid-cols-1 gap-6">
                      {/* Solana Wallet Card */}
                      <div className="rounded-xl overflow-hidden border border-[#AB9FF2]/20 shadow-md">
                        <div className="bg-[#AB9FF2]/10 p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-[#AB9FF2] flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Solana Wallet</p>
                              <p className="text-muted-foreground text-sm">For Solana Network tokens</p>
                            </div>
                            
                            {solanaConnected && (
                              <div className="ml-auto flex items-center space-x-2">
                                <span className="flex items-center text-green-500 text-xs font-medium">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                  Connected
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {solanaConnected && solanaPublicKey && (
                            <div className="space-y-2">
                              {/* Wallet Address Display */}
                              <div className="flex items-center justify-between p-2 pl-3 bg-[#AB9FF2]/5 border border-[#AB9FF2]/20 rounded-lg">
                                <p className="text-[#AB9FF2] text-sm font-mono">{formatAddress(solanaPublicKey.toString())}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(solanaPublicKey.toString(), 'Solana')}
                                  className="h-7 w-7 p-0"
                                  title="Copy full address"
                                >
                                  {copiedAddress === solanaPublicKey.toString() ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-[#AB9FF2]" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                          {(!solanaConnected || !solanaPublicKey) && (
                            <div>
                              <WalletMultiButton className="w-full bg-[#AB9FF2] hover:bg-[#AB9FF2]/90 text-white font-medium rounded-lg py-2 px-4 transition-colors" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Algorand Wallet Card */}
                      <div className="rounded-xl overflow-hidden border border-[#22C55E]/20 shadow-md">
                        <div className="bg-[#22C55E]/10 p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-[#22C55E] flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-sm">A</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium">Algorand Wallet</p>
                              <p className="text-muted-foreground text-sm">For Algorand Network tokens</p>
                            </div>
                            
                            {algorandConnected && (
                              <div className="ml-auto flex items-center space-x-2">
                                <span className="flex items-center text-green-500 text-xs font-medium">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                  Connected
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {algorandConnected && algorandAddress && (
                            <div className="space-y-2">
                              {/* Wallet Address Display */}
                              <div className="flex items-center justify-between p-2 pl-3 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg">
                                <p className="text-[#22C55E] text-sm font-mono">{formatAddress(algorandAddress)}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(algorandAddress, 'Algorand')}
                                  className="h-7 w-7 p-0"
                                  title="Copy full address"
                                >
                                  {copiedAddress === algorandAddress ? (
                                    <Check className="w-3.5 h-3.5 text-green-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-[#22C55E]" />
                                  )}
                                </Button>
                              </div>
                              
                              {/* Network Display */}
                              <div className="flex items-center justify-between p-2 pl-3 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-lg">
                                <p className="text-[#22C55E] text-sm">Network: {algorandSelectedNetwork}</p>
                              </div>
                              
                              {/* Disconnect Button */}
                              <Button
                                onClick={handleAlgorandDisconnect}
                                variant="outline"
                                size="sm"
                                className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40"
                              >
                                Disconnect
                              </Button>
                            </div>
                          )}
                          
                          {!algorandConnected && (
                            <div className="space-y-3">
                              {!isPeraWalletReady && (
                                <div className="flex items-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    Pera Wallet not detected. Please install Pera Wallet extension.
                                  </p>
                                </div>
                              )}
                              
                              <Button
                                onClick={handleAlgorandConnect}
                                disabled={!isPeraWalletReady || algorandIsConnecting}
                                className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-medium rounded-lg py-2 px-4 transition-colors disabled:opacity-50"
                              >
                                {algorandIsConnecting ? 'Connecting...' : 'Connect Pera Wallet'}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <div className="mt-6 pt-4 border-t border-border">
                      <Button
                        onClick={() => setShowWalletOptions(false)}
                        variant="outline"
                        className="w-full"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl p-2"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl p-2"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-border mt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    handleNavigation(link.href);
                    setIsMenuOpen(false);
                  }}
                  className={`block px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                    pathname === link.href
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Admin Link - Mobile */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                    pathname === '/admin'
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  Admin
                </Link>
              )}
              
              {/* Mobile Wallet Connection */}
              <div className="px-3 py-2 space-y-3">
                {!isAnyWalletConnected ? (
                  <Button
                    onClick={() => {
                      setShowWalletOptions(!showWalletOptions);
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                ) : (
                  <div className="space-y-2">
                    {solanaConnected && (
                      <div className="flex items-center justify-between p-3 bg-[#AB9FF2]/10 border border-[#AB9FF2]/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-[#AB9FF2] flex items-center justify-center">
                            <span className="text-white font-bold text-xs">S</span>
                          </div>
                          <span className="text-sm font-medium">{formatAddress(solanaPublicKey!.toString())}</span>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                    
                    {algorandConnected && (
                      <div className="flex items-center justify-between p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center">
                            <span className="text-white font-bold text-xs">A</span>
                          </div>
                          <span className="text-sm font-medium">{formatAddress(algorandAddress!)}</span>
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}