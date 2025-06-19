'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { initializePlatform, getPlatformState, ADMIN_WALLET } from '@/lib/solana';
import { AlertTriangle, CheckCircle, Settings, Loader2, Shield, Wallet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [creationFee, setCreationFee] = useState('0');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isCheckingState, setIsCheckingState] = useState(false);
  const [initResult, setInitResult] = useState<any>(null);
  const [stateInfo, setStateInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  const { connected, publicKey, wallet } = useWallet();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const checkPlatformState = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsCheckingState(true);
    setError('');

    try {
      const result = await getPlatformState();
      if (result.success) {
        setStateInfo(result.data);
        setError('');
      } else {
        setStateInfo(null);
        setError(result.error || 'Platform state not found - needs initialization');
      }
    } catch (err) {
      setStateInfo(null);
      setError('Platform state not found - needs initialization');
    } finally {
      setIsCheckingState(false);
    }
  };

  const handleInitialize = async () => {
    if (!connected || !publicKey || !wallet) {
      setError('Please connect your wallet first');
      return;
    }

    // Check if user is admin
    if (publicKey.toString() !== ADMIN_WALLET.toString()) {
      setError(`Only the admin wallet (${ADMIN_WALLET.toString()}) can initialize the platform`);
      return;
    }

    setIsInitializing(true);
    setError('');
    setInitResult(null);

    try {
      const feeInLamports = parseFloat(creationFee) * 1000000000; // Convert SOL to lamports
      const result = await initializePlatform(wallet.adapter, feeInLamports);
      
      if (result.success) {
        setInitResult(result);
        setError('');
        // Check state after successful initialization
        setTimeout(() => {
          checkPlatformState();
        }, 2000);
      } else {
        setError(result.error || 'Failed to initialize platform');
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize platform');
    } finally {
      setIsInitializing(false);
    }
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Show access denied if not admin wallet
  if (connected && publicKey && publicKey.toString() !== ADMIN_WALLET.toString()) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>

          <Card className="border-red-500/50 bg-red-500/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Access Denied</CardTitle>
              <CardDescription className="text-lg">
                This admin panel is restricted to authorized personnel only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-red-600">Unauthorized Wallet Connected</p>
                    <p className="text-sm">
                      Your wallet: <code className="bg-muted px-2 py-1 rounded text-xs">{publicKey.toString()}</code>
                    </p>
                    <p className="text-sm">
                      Required: <code className="bg-muted px-2 py-1 rounded text-xs">{ADMIN_WALLET.toString()}</code>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  If you are an administrator, please connect the correct wallet address.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Return to Platform
                    </Button>
                  </Link>
                  <Link href="/create">
                    <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white">
                      Create Token
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt if not connected
  if (!connected) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Admin Panel Access</CardTitle>
              <CardDescription className="text-lg">
                Connect your admin wallet to access platform management tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <WalletMultiButton className="!bg-red-500 hover:!bg-red-600 !rounded-xl" />
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Admin Wallet Required</p>
                    <p className="text-sm">
                      Only the designated admin wallet can access this panel:
                    </p>
                    <code className="block bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                      {ADMIN_WALLET.toString()}
                    </code>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Don't have admin access? You can still use the platform:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/create">
                    <Button className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white">
                      Create Token
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full sm:w-auto">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin panel content (only shown when admin wallet is connected)
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Platform
          </Link>
          <div className="text-sm text-muted-foreground">
            Admin Panel
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 text-red-500">
            <Shield className="w-6 h-6" />
            <span className="font-semibold text-lg">ADMIN PANEL</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground">Platform Administration</h1>
          <p className="text-muted-foreground text-lg">
            Initialize and manage the Snarbles token creation platform
          </p>
        </div>

        {/* Wallet Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Admin Wallet Status</span>
            </CardTitle>
            <CardDescription>
              Connected admin wallet information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-600">✅ Admin wallet connected</p>
                    <p className="text-sm text-muted-foreground">Full administrative access granted</p>
                  </div>
                </div>
                <WalletMultiButton className="!bg-green-500 hover:!bg-green-600 !rounded-xl" />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2 font-medium">Connected Wallet:</p>
                <p className="font-mono text-sm bg-muted p-3 rounded-lg break-all">
                  {publicKey?.toString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform State Check */}
        <Card>
          <CardHeader>
            <CardTitle>Platform State</CardTitle>
            <CardDescription>
              Check if the platform has been initialized
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={checkPlatformState}
              disabled={isCheckingState}
              variant="outline"
              className="w-full sm:w-auto"
            >
              {isCheckingState ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Platform State'
              )}
            </Button>

            {stateInfo && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-600">✅ Platform is initialized!</p>
                    <div className="text-sm space-y-1">
                      <p><strong>Admin:</strong> {stateInfo.admin.toString()}</p>
                      <p><strong>Creation Fee:</strong> {stateInfo.creationFee.toString()} lamports</p>
                      <p><strong>Total Tokens Created:</strong> {stateInfo.totalTokens.toString()}</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Platform Initialization */}
        <Card>
          <CardHeader>
            <CardTitle>Initialize Platform</CardTitle>
            <CardDescription>
              Set up the platform state for token creation (Admin only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="creationFee">Creation Fee (SOL)</Label>
              <Input
                id="creationFee"
                type="number"
                step="0.001"
                placeholder="0.000"
                value={creationFee}
                onChange={(e) => setCreationFee(e.target.value)}
                disabled={isInitializing}
              />
              <p className="text-sm text-muted-foreground">
                Fee charged for creating new tokens (0 for free)
              </p>
            </div>

            <Button 
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initializing Platform...
                </>
              ) : (
                'Initialize Platform'
              )}
            </Button>

            {error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {initResult && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-600">✅ Platform initialized successfully!</p>
                    <div className="text-sm space-y-1">
                      <p><strong>Transaction:</strong> {initResult.signature}</p>
                      <p><strong>State Address:</strong> {initResult.stateAddress}</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Navigate to other platform features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/create">
                <Button variant="outline" className="w-full h-12">
                  Create Token
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full h-12">
                  Dashboard
                </Button>
              </Link>
              <Link href="/verify">
                <Button variant="outline" className="w-full h-12">
                  Verify Tokens
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">1. Check Platform State</h4>
                <p className="text-muted-foreground">
                  Verify if the platform has already been initialized.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Initialize Platform (if needed)</h4>
                <p className="text-muted-foreground">
                  If not initialized, set the creation fee and initialize the platform state.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Verify Success</h4>
                <p className="text-muted-foreground">
                  After initialization, check the platform state again to confirm success.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Start Creating Tokens</h4>
                <p className="text-muted-foreground">
                  Once initialized, users can create tokens through the platform.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}