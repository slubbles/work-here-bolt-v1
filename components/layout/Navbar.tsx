'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Mock wallet connection states - replace with actual wallet context
  const [solanaConnected, setSolanaConnected] = useState(false);
  const [algorandConnected, setAlgorandConnected] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAnyWalletConnected = solanaConnected || algorandConnected;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/create', label: 'Create Token' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/tokenomics', label: 'Tokenomics' },
  ];

  const handleWalletConnect = () => {
    // Implement wallet connection logic
    console.log('Connect wallet');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'backdrop-blur-xl border-b shadow-lg'
        : 'backdrop-blur-sm border-b'
    } bg-background/80`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <div className="flex items-center space-x-2">
              <img 
                src="/image copy.png" 
                alt="Snarbles Logo" 
                className="w-8 h-8 rounded-lg"
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
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet Connection & Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Desktop Wallet Button */}
            <div className="hidden md:block">
              <Button
                onClick={handleWalletConnect}
                variant={isAnyWalletConnected ? "default" : "outline"}
                className="flex items-center space-x-2"
              >
                <Wallet className="w-4 h-4" />
                <span>
                  {isAnyWalletConnected ? 'Connected' : 'Connect Wallet'}
                </span>
              </Button>
            </div>

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-6 mt-8">
                  {/* Mobile Logo */}
                  <Link 
                    href="/" 
                    className="flex items-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <img 
                      src="/image copy.png" 
                      alt="Snarbles Logo" 
                      className="w-8 h-8 rounded-lg"
                    />
                    <span className="text-2xl font-bold text-foreground">
                      Snarbles
                    </span>
                  </Link>

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  {/* Mobile Wallet Button */}
                  <Button
                    onClick={() => {
                      handleWalletConnect();
                      setIsMobileMenuOpen(false);
                    }}
                    variant={isAnyWalletConnected ? "default" : "outline"}
                    className="flex items-center space-x-2 w-full"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>
                      {isAnyWalletConnected ? 'Connected' : 'Connect Wallet'}
                    </span>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}