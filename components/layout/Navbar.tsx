'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Sun, Moon, Wallet, ChevronDown, Copy, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { ADMIN_WALLET } from '@/lib/solana';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import MainnetConnectionModal from '@/components/MainnetConnectionModal';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showWalletOptions, setShowWalletOptions] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showMainnetModal, setShowMainnetModal] = useState<boolean>(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  
  // Solana wallet
  const { connected: solanaConnected, publicKey: solanaPublicKey, disconnect: disconnectSolana } = useWallet();
  
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
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
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
    { name: 'Tokenomics', href: '/tokenomics' },
    { name: 'Verify Token', href: '/verify' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  // Check if user is admin
  const isAdmin = solanaConnected && solanaPublicKey && solanaPublicKey.toString() === ADMIN_WALLET.toString();

  // Enhanced navigation with loading state
  const handleNavigation = (href: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    // Show loading indicator for dashboard
    if (href === '/dashboard') {
      setIsMenuOpen(false); // Close mobile menu immediately
      // Add loading class to show immediate feedback
      document.body.classList.add('dashboard-loading');
      setTimeout(() => {
        document.body.classList.remove('dashboard-loading');
      }, 3000);
    }
    
    router.push(href);
  };
  
  const handleAlgorandConnect = async () => {
    try {
      await connectAlgorand();
      setShowWalletOptions(false);
    } catch (error) {
      console.error('Failed to connect Algorand wallet:', error);
      
      // Show the modal for mainnet connection issues
      if (algorandSelectedNetwork === 'algorand-mainnet') {
        setShowMainnetModal(true);
      } else {
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect to Algorand wallet. Please try again.",
          variant: "destructive",
        });
      }
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
              <img 
                src="/logo.png" 
                alt="Snarbles Logo" 
                className="w-8 h-8 rounded-lg object-contain"
              />
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
                onClick={(e) => {
                  handleNavigation(link.href, e);
                }}
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
                  <div className="wallet-status-connected rounded-full px-3 py-1.5">
                    <div 
                      className="flex items-center space-x-2 px-3 cursor-pointer"
                      onClick={() => setShowWalletOptions(!showWalletOptions)}
                    >
                      <div className="flex items-center space-x-2">
                        {solanaConnected && (
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#AB9FF2] wallet-pulse-indicator">
                              <span className="text-white font-bold text-xs">S</span>
                            </div>
                          </div>
                        )}
                        
                        {algorandConnected && (
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#22C55E] wallet-pulse-indicator">
                              <span className="text-white font-bold text-xs">A</span>
                            </div>
                          </div>
                        )}
                        
                        <span className="text-foreground font-medium text-sm wallet-status-enhanced">
                          {solanaConnected && algorandConnected
                            ? "2 Wallets"
                            : solanaConnected
                              ? formatAddress(solanaPublicKey!.toString())
                              : formatAddress(algorandAddress!)}
                        </span>
                        
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Wallet Options Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowWalletOptions(!showWalletOptions);
                      // Play subtle wallet animation for feedback
                      const walletBtns = document.querySelectorAll('.wallet-pulse-indicator');
                      walletBtns.forEach(btn => {
                        btn.classList.add('animate-pulse');
                        setTimeout(() => btn.classList.remove('animate-pulse'), 800);
                      });
                    }}
                    className="border-border/70 text-muted-foreground hover:bg-muted/70 rounded-lg p-1.5"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowWalletOptions(!showWalletOptions)}
                  className="wallet-connect-button bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl px-4 py-2 h-9 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  <span className="relative z-10">Connect Wallet</span>
                </Button>
              )}

              {/* Enhanced Wallet Options Dropdown */}
              {showWalletOptions && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-background/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                  <div className="p-4 relative overflow-visible">
                    {/* Background decoration */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>

                    <div className="mb-4 text-center">
                      <h3 className="text-foreground font-bold text-lg mb-1 gradient-text">Wallet Management</h3>
                      <p className="text-muted-foreground text-xs">Connect or manage your wallets</p>
                    </div>
                    
                    {/* Wallet Cards Container */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Solana Wallet Card */}
                      <div className="rounded-lg overflow-hidden border border-[#9945FF]/20 shadow-sm">
                        <div className="bg-[#9945FF]/10 p-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#9945FF] flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-xs">S</span>
                            </div>
                            <div>
                              <p className="text-foreground font-medium text-sm">Solana Wallet</p>
                              <p className="text-muted-foreground text-xs">For Solana Network tokens</p>
                            </div>
                            
                            {solanaConnected && (
                              <div className="ml-auto flex items-center space-x-1">
                                <span className="flex items-center text-green-500 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                  Connected
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {solanaConnected && solanaPublicKey && (
                            <div className="space-y-2">
                              {/* Wallet Address Display */}
                              <div className="flex items-center justify-between p-2 bg-[#9945FF]/5 border border-[#9945FF]/20 rounded-md">
                                <p className="text-[#9945FF] text-xs font-mono">{formatAddress(solanaPublicKey.toString())}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(solanaPublicKey.toString(), 'Solana')}
                                  className="h-6 w-6 p-0"
                                  title="Copy full address"
                                >
                                  {copiedAddress === solanaPublicKey.toString() ? (
                                    <Check className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-[#9945FF]" />
                                  )}
                                </Button>
                              </div>
                              
                              {/* Network Status */}
                              <div className="p-2 bg-[#9945FF]/5 border border-[#9945FF]/20 rounded-md">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-[#9945FF]">Network Status:</span>
                                  <div className="flex items-center">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                    <span className="text-xs text-green-500">Connected</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Disconnect Button */}
                              <Button
                                onClick={async () => {
                                  try {
                                    // Show loading state
                                    toast({
                                      title: "Disconnecting Solana wallet...",
                                      duration: 1500
                                    });
                                    
                                    // Perform disconnect
                                    await disconnectSolana();
                                    setShowWalletOptions(false);
                                    
                                    // Success feedback
                                    toast({
                                      title: "Solana wallet disconnected",
                                      description: "Successfully disconnected from Solana wallet",
                                      duration: 2000
                                    });
                                  } catch (err) {
                                    console.error("Solana disconnect error:", err);
                                    toast({
                                      title: "Disconnect failed",
                                      description: "Failed to disconnect Solana wallet",
                                      variant: "destructive",
                                      duration: 3000
                                    });
                                  }
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 text-xs h-8"
                              >
                                Disconnect Solana
                              </Button>
                            </div>
                          )}
                          {(!solanaConnected || !solanaPublicKey) && (
                            <div>
                              <WalletMultiButton className="!w-full !bg-[#9945FF] !hover:bg-[#9945FF]/90 !text-white !font-medium !rounded-md !py-2 !px-3 !transition-colors !cursor-pointer !pointer-events-auto !z-[100001] !text-sm !h-9 !relative" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Algorand Wallet Card */}
                      <div className="rounded-lg overflow-hidden border border-[#ffee55]/20 shadow-sm">
                        <div className="bg-[#ffee55]/10 p-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 rounded-full bg-[#ffee55] flex items-center justify-center shadow-md relative">
                              <span className="text-black font-bold text-xs">A</span>
                              <div className="absolute -inset-1 bg-[#ffee55]/30 rounded-full animate-pulse opacity-75"></div>
                            </div>
                            <div>
                              <p className="text-foreground font-medium text-sm">Algorand Wallet</p>
                              <p className="text-muted-foreground text-xs">For Algorand Network tokens</p>
                            </div>
                            
                            {algorandConnected && (
                              <div className="ml-auto flex items-center space-x-1">
                                <span className="flex items-center text-green-500 text-xs font-medium">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                  Connected
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="p-3 space-y-2">
                          {algorandConnected && algorandAddress && (
                            <>
                              <div className="space-y-2">
                                {/* Wallet Address Display */}
                                <div className="flex items-center justify-between p-2 bg-[#ffee55]/5 border border-[#ffee55]/20 rounded-md overflow-hidden">
                                  <p className="text-[#ffee55] text-xs font-mono break-all">{formatAddress(algorandAddress)}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(algorandAddress, 'Algorand')}
                                    className="h-6 w-6 p-0"
                                    title="Copy full address"
                                  >
                                    {copiedAddress === algorandAddress ? (
                                      <Check className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-[#ffee55]" />
                                    )}
                                  </Button>
                                </div>
                                
                                <div className="p-2 bg-[#ffee55]/5 border border-[#ffee55]/20 rounded-md">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#ffee55]">Network Status:</span>
                                    <div className="flex items-center">
                                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                      <span className="text-xs text-green-500">Connected</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Disconnect Button */}
                                <Button
                                  onClick={async () => {
                                    try {
                                      // Show loading state
                                      toast({
                                        title: "Disconnecting wallet...",
                                        duration: 1500
                                      });
                                      
                                      // Perform disconnect
                                      await handleAlgorandDisconnect();
                                      setShowWalletOptions(false);
                                    } catch (err) {
                                      console.error("Disconnect error:", err);
                                    }
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 text-xs h-8"
                                >
                                  Disconnect
                                </Button>
                              </div>
                            </>
                          )}
                          
                          {!algorandConnected && (
                            <div className="space-y-2">
                              {!isPeraWalletReady && (
                                <div className="flex items-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                  <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0" />
                                  <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                                    Pera Wallet extension not detected. Please install to connect.
                                  </p>
                                </div>
                              )}
                              
                              <Button
                                onClick={handleAlgorandConnect}
                                disabled={!isPeraWalletReady || algorandIsConnecting}
                              >
                                {algorandIsConnecting ? (
                                  <div className="flex items-center justify-center">
                                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-1"></div>
                                    <span>Connecting...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center">
                                    <Wallet className="w-3 h-3 mr-1" />
                                    <span>Connect Pera Wallet</span>
                                  </div>
                                )}
                              </Button>
                              
                              {/* Help link */}
                              <a 
                                href="https://perawallet.app/download/" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-xs text-center block text-[#22C55E] hover:underline"
                              >
                                Need to install Pera Wallet?
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Close button */}
                    <div className="flex justify-end mt-3">
                      <Button
                        onClick={() => setShowWalletOptions(false)}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground text-xs"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Click outside to close - but don't interfere with wallet modal */}
              {showWalletOptions && (
                <div 
                  className="fixed inset-0 z-40"
                  onClick={(e) => {
                    // Don't close if clicking on wallet adapter modal elements
                    if (e.target instanceof HTMLElement && 
                        (e.target.closest('.wallet-adapter-modal') || 
                         e.target.closest('.wallet-adapter-dropdown'))) {
                      return;
                    }
                    setShowWalletOptions(false);
                  }}
                />
              )}

              {/* Hidden WalletMultiButton for fallback - ensure it doesn't interfere */}
              <div className="hidden opacity-0 pointer-events-none">
                <WalletMultiButton />
              </div>
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
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
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
      
      {/* Mainnet Connection Modal */}
      <MainnetConnectionModal 
        isOpen={showMainnetModal} 
        onClose={() => setShowMainnetModal(false)} 
      />
    </nav>
  );
}