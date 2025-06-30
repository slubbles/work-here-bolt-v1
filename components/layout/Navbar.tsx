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
  const { connected: solanaConnected, publicKey: solanaPublicKey, wallet: solanaWallet } = useWallet();
  
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
    const savedTheme = typeof localStorage !== 'undefined' ? (localStorage.getItem('theme') || 'dark') : 'dark';
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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const navLinks = [
    { name: 'Create Token', href: '/create' },
    { name: 'Tokenomics Simulator', href: '/tokenomics' },
    { name: 'Token Verification', href: '/verify' },
    { name: 'Dashboard', href: '/dashboard' }
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
              <img src="/Untitled design (2).png" alt="Snarbles Logo" className="w-8 h-8 rounded-lg object-contain" />
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
                aria-current={pathname === link.href ? 'page' : undefined}
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
                  <div 
                    onClick={() => setShowWalletOptions(!showWalletOptions)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-red-600/90 to-black/90 rounded-full hover:from-red-700/90 hover:to-black/90 cursor-pointer shadow-lg transition-all duration-300 wallet-status-enhanced"
                  >
                    <div className="flex items-center space-x-1.5">
                      {solanaConnected && solanaPublicKey && (
                        <div className="wallet-pulse-indicator">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-black ring-1 ring-white/20 shadow-md">
                            <span className="text-white font-bold text-xs">S</span>
                          </div>
                        </div>
                      )}
                      
                      {algorandConnected && algorandAddress && (
                        <div className="wallet-pulse-indicator">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-black ring-1 ring-white/20 shadow-md">
                            <span className="text-white font-bold text-xs">A</span>
                            <span className="sr-only">Algorand wallet connected</span>
                          </div>
                        </div>
                      )}
                      
                      <span className="text-white font-medium text-sm">
                        {solanaConnected && algorandConnected
                          ? "2 Wallets"
                          : solanaConnected
                            ? formatAddress(solanaPublicKey!.toString())
                            : formatAddress(algorandAddress!)}
                      </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-white/80" />
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowWalletOptions(!showWalletOptions)}
                  className="bg-gradient-to-r from-red-600 to-black hover:from-red-700 hover:to-black text-white font-semibold rounded-xl px-5 py-2 h-9 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Wallet className="w-4 h-4 mr-2.5" />
                  <span className="font-medium tracking-wide">Connect Wallet</span>
                </Button>
              )}

              {/* Enhanced Wallet Options Dropdown */}
              {showWalletOptions && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-xl border border-red-500/30 rounded-xl shadow-[0_10px_40px_rgba(239,68,68,0.3)] z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="p-6">
                    <div className="mb-8 text-center">
                      <h3 className="text-white font-bold text-xl mb-2 tracking-tight">Select Your Wallet</h3>
                      <div className="h-1 w-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-3"></div>
                      <p className="text-indigo-200 text-sm">Connect or manage blockchain wallets</p>
                    </div>
                    
                    {/* Wallet Cards Container */}
                    <div className="grid grid-cols-1 gap-8">
                      {/* Solana Wallet Card */}
                      <div className="rounded-xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-black to-gray-900 shadow-lg transform transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <div className="bg-black p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-black flex items-center justify-center shadow-lg ring-1 ring-white/10">
                              <img src="/solana-logo.png" alt="Phantom" className="w-5 h-5" onError={(e) => (e.currentTarget.src = '')} />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold">Solana Wallet</p>
                              <p className="text-gray-300 text-xs">Phantom, Solflare, Backpack</p>
                            </div>
                            
                            {solanaConnected && (
                              <span className="ml-auto flex items-center text-emerald-400 text-xs font-medium bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {solanaConnected && solanaPublicKey && (
                            <div className="space-y-2">
                              {/* Wallet Address Display */}
                              <div className="flex items-center justify-between p-2 pl-3 bg-black border border-red-500/20 rounded-lg">
                                <p className="text-white text-sm font-mono">{formatAddress(solanaPublicKey.toString())}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(solanaPublicKey.toString(), 'Solana')}
                                  className="h-6 w-6 p-0 border-red-500/20 bg-black hover:bg-gray-900"
                                  title="Copy full address"
                                >
                                  {copiedAddress === solanaPublicKey.toString() ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-[#4A90E2]" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                          {(!solanaConnected || !solanaPublicKey) && (
                            <div className="flex flex-col items-center py-2">
                              <WalletMultiButton className="w-full !bg-gradient-to-r !from-red-500 !to-black hover:!from-red-600 hover:!to-gray-900 !text-white !font-medium !rounded-lg !py-2 !px-4 !transition-colors" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Algorand Wallet Card */}
                      <div className="rounded-xl overflow-hidden border border-red-500/30 bg-gradient-to-br from-black to-gray-900 shadow-lg transform transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        <div className="bg-black p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-black flex items-center justify-center shadow-lg ring-1 ring-white/10">
                              <img src="/pera.png" alt="Pera Wallet" className="w-5 h-5" onError={(e) => (e.currentTarget.src = '')} />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold">Algorand Wallet</p>
                              <p className="text-gray-300 text-xs">Pera Wallet, MyAlgo</p>
                            </div>
                            
                            {algorandConnected && (
                              <span className="ml-auto flex items-center text-emerald-400 text-xs font-medium bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5 animate-pulse"></span>
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          {algorandConnected && algorandAddress && (
                            <div className="space-y-2">
                              {/* Wallet Address Display */}
                              <div className="flex items-center justify-between p-2 pl-3 bg-black border border-red-500/20 rounded-lg">
                                <p className="text-white text-sm font-mono">{formatAddress(algorandAddress)}</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyToClipboard(algorandAddress, 'Algorand')}
                                  className="h-6 w-6 p-0 border-red-500/20 bg-black hover:bg-gray-900"
                                  title="Copy full address"
                                >
                                  {copiedAddress === algorandAddress ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-[#22C55E]" />
                                  )}
                                </Button>
                              </div>
                              
                              {/* Network Display */}
                              <div className="flex items-center justify-between p-2 pl-3 bg-black border border-red-500/20 rounded-lg">
                                <p className="text-white text-sm">
                                  {algorandSelectedNetwork === 'algorand-testnet' ? 'Testnet' : 'Mainnet'}
                                </p>
                                <Badge className="bg-[#A9DFBF]/20 text-[#22C55E] border-[#A9DFBF]/30">
                                  {algorandSelectedNetwork.replace('algorand-', '')}
                                </Badge>
                              </div>
                              
                              {/* Disconnect Button */}
                              <Button
                                onClick={handleAlgorandDisconnect}
                                variant="outline"
                                className="w-full mt-2 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 font-medium"
                              >
                                <Wallet className="w-4 h-4 mr-2" />
                                Disconnect
                              </Button>
                            </div>
                          )}
                          
                          {!algorandConnected && (
                            <div className="space-y-3">
                              {!isPeraWalletReady && (
                                <div className="flex items-center p-4 bg-gradient-to-r from-yellow-500/15 to-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                  <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 flex-shrink-0" />
                                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                                    Pera Wallet not detected. Please install Pera Wallet extension.
                                  </p>
                                </div>
                              )}
                              
                              <Button
                                onClick={handleAlgorandConnect}
                                disabled={!isPeraWalletReady || algorandIsConnecting || algorandConnected}
                                className="w-full bg-gradient-to-r from-red-500 to-black hover:from-red-600 hover:to-gray-900 text-white font-medium rounded-lg py-2 px-4 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                              >
                                <div className="flex items-center justify-center">
                                  {algorandIsConnecting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Wallet className="w-4 h-4 mr-2" />
                                  )}
                                  <span>{algorandIsConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                                </div>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Close Button */}
                    <div className="mt-6 pt-3 border-t border-red-500/20">
                      <Button
                        onClick={() => setShowWalletOptions(false)}
                        variant="outline"
                        className="w-full bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
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
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
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
          <div id="mobile-menu" className="md:hidden">
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
                        <span className="sr-only">Solana wallet connected</span>
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