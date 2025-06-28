import UnifiedDashboard from './UnifiedDashboard';
import SolanaDashboard from './SolanaDashboard';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Wallet, Network, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  
  // Wallet connections
  const { connected: solanaConnected } = useWallet();
  const { connected: algorandConnected } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
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
                <Wallet className="w-8 h-8 text-red-500" />
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
                  <Network className="w-5 h-5 text-blue-500 mt-0.5" />
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
                <Link href="/" className="text-red-500 hover:text-red-600 text-sm inline-flex items-center">
                  Back to Home
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Determine which dashboard to render based on wallet connection
  // If both are connected, prioritize Solana (this can be changed as needed)
  if (solanaConnected) {
    return <SolanaDashboard />;
  } else if (algorandConnected) {
    return <AlgorandDashboard />;
  } else {
    return <UnifiedDashboard />; // Fallback, but should not reach here
  }
}