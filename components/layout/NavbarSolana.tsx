'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Sun, Moon, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function NavbarSolana() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const router = useRouter();
  
  // Solana wallet hooks
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const navLinks = [
    { name: 'Create Token', href: '/create' },
    { name: 'Tokenomics', href: '/tokenomics' },
    { name: 'Verify', href: '/verify' },
    { name: 'Dashboard', href: '/dashboard' },
  ];

  const connectWallet = () => {
    setVisible(true);
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Redirect to dashboard when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      router.push('/dashboard');
    }
  }, [connected, publicKey, router]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b transition-all duration-300" 
         style={{
           backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(254, 253, 224, 0.95)',
           borderColor: theme === 'dark' ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)'
         }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Text Only */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-foreground">Snarbles</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Controls */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            
            {connected && publicKey ? (
              <div className="flex items-center space-x-3">
                <span className="text-muted-foreground text-sm">{formatAddress(publicKey.toBase58())}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={disconnectWallet}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button 
                onClick={connectWallet}
                className="bg-red-500 hover:bg-red-600 text-[#fefde0]"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden backdrop-blur-sm border-t transition-all duration-300"
             style={{
               backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.95)' : 'rgba(254, 253, 224, 0.95)',
               borderColor: theme === 'dark' ? 'rgb(31, 41, 55)' : 'rgb(229, 231, 235)'
             }}>
          <div className="px-4 py-4 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-muted-foreground hover:text-foreground transition-colors duration-200 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Theme</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleTheme}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>
              
              {connected && publicKey ? (
                <div className="space-y-3">
                  <span className="text-muted-foreground text-sm block">{formatAddress(publicKey.toBase58())}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={disconnectWallet}
                    className="border-border text-muted-foreground hover:bg-muted w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={connectWallet}
                  className="bg-red-500 hover:bg-red-600 text-[#fefde0] w-full"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}