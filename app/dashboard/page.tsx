'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Network, ArrowRight, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import SolanaDashboard from './SolanaDashboard';
import { TokenHistory } from '@/components/dashboard/TokenHistory'; 
import { SupabaseStatus } from '@/components/SupabaseStatus';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import dynamic from 'next/dynamic';

// Dynamically import AlgorandDashboard to fix hydration issues
const AlgorandDashboard = dynamic(
  () => import('@/components/dashboard/AlgorandDashboard'), 
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-foreground text-lg font-semibold">Loading Algorand Dashboard...</p>
          <p className="text-muted-foreground mt-2">Please wait while we fetch your assets</p>
          <p className="text-muted-foreground mt-2">Please wait while we fetch your assets</p>
        </div>
      </div>
    )
  }
);

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  
  // Wallet connections
  const { connected: solanaConnected } = useWallet();
  const { connected: algorandConnected, selectedNetwork } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
    setSupabaseConfigured(isSupabaseAvailable());
  }, []);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Initializing dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // No wallet connected
  if (!solanaConnected && !algorandConnected) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Card className="glass-card border-orange-500/30 bg-orange-500/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-red-500" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Wallet Required</h2>
                <p className="text-muted-foreground">
                  Connect a wallet to access your token dashboard
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Network className="w-5 h-5 text-blue-500 mt-0.5" aria-hidden="true" />
                  <div className="text-sm text-blue-600">
                    <p className="font-semibold mb-1">Connect a blockchain wallet:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Connect Solana wallet for SPL tokens</li>
                      <li>Connect Algorand wallet for ASA tokens</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="mb-4">
                  <WalletMultiButton className="!bg-gradient-to-r !from-red-500 !to-red-600 hover:!from-red-600 hover:!to-red-700 !rounded-xl !shadow-lg !min-h-[48px] !px-6 !text-base !font-semibold" />
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline" 
                    size="sm"
                    className="text-sm"
                  >
                    Refresh Connection Status
                  </Button>
                </div>
              </div>
              <div className="text-center">
                <Link href="/" className="text-red-500 hover:text-red-600 text-sm inline-flex items-center">
                  Back to Home
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Help prompt for new users */}
          <div className="max-w-md mx-auto text-center mt-4">
            <Callout variant="beginner" className="text-center">
              <p>
                First time using a blockchain wallet? <Link href="/support" className="text-blue-600 underline">Click here</Link> for our beginners guide to wallets.
              </p>
            </Callout>
          </div>
          {/* Info about opting-in */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">New tokens need to be opted-in before they appear on your dashboard.</p>
            <p className="text-xs text-muted-foreground mt-1">After creating a token, check the transaction in the explorer and opt-in.</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine which dashboard to render based on wallet connection
  // If both are connected, prioritize Solana (this can be changed as needed)
  if (solanaConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {process.env.NODE_ENV === 'development' && (
          <div className="max-w-md mx-auto pt-6">
            <SupabaseStatus showDetailedInfo={true} />
          </div>
        )}
        <SolanaDashboard />
      </div>
    );
  } else if (algorandConnected) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Subtle visual cue for dashboard */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center space-x-2 text-sm bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span>View and manage your tokens below</span>
            </div>
          </div>
          
          {selectedNetwork === 'algorand-mainnet' ? (
            <div className="flex items-center justify-center mb-4 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg">
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mr-2">
                Mainnet
              </Badge>
              <span className="text-sm text-yellow-600">⚠️ You are using Algorand Mainnet - real tokens with real value</span>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-4 bg-[#76f935]/10 border border-[#76f935]/20 p-2 rounded-lg">
              <Badge className="bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30 mr-2">
                Testnet
              </Badge>
              <span className="text-sm text-[#76f935]">You're on Algorand Testnet - perfect for testing</span>
            </div>
          )}
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="max-w-md mx-auto pt-6">
            <SupabaseStatus showDetailedInfo={true} />
          </div>
        )}
        <AlgorandDashboard />
      </div>
    );
  }

  // This should not be reached, but provide a fallback
  return (
    <div className="min-h-screen app-background flex items-center justify-center">
      <div className="glass-card p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-red-500 mx-auto mb-4" />
        <CardTitle className="mb-4">Loading Dashboard...</CardTitle>
        <p className="text-muted-foreground mb-4">Connecting to blockchain</p>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          size="sm"
          className="text-sm"
        >
          Refresh Page
        </Button>
      </div>
      <div className="max-w-md mx-auto text-center mt-4">
        <Callout variant="info" className="inline-block text-center px-6">
          <p className="flex items-center justify-center">
            <HelpCircle className="w-4 h-4 mr-2" />
            Loading wallet data...
          </p>
        </Callout>
      </div>
    </div>
  );
}