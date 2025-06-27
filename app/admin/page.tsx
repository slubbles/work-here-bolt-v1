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
import { AlertTriangle, CheckCircle, Settings, Loader2, Shield, Wallet, ArrowLeft, Rocket, BarChart3 } from 'lucide-react';
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
        alert("Platform is properly initialized and ready for token creation.");
      } else {
        setStateInfo(null);
        setError(result.error || 'Platform not yet initialized');
        toast({
          title: "⚠️ Platform Not Initialized", 
          description: "The platform needs to be initialized before tokens can be created. Use the form below to initialize it.",
          variant: "destructive",
          duration: 6000,
        });
      }
    } catch (err) {
      setStateInfo(null);
      setError('Platform not yet initialized - this is normal for a new deployment');
    } finally {
      setIsCheckingState(false);
    }
  };

  const handleInitialize = async () => {
    if (!connected || !publicKey || !wallet) {
      setError('Please connect your wallet first');
      return;
      
      // Additional validation
      if (feeInLamports < 0 || feeInLamports > 1000000000000) { // Max 1000 SOL
        setError('Creation fee must be between 0 and 1000 SOL');
        return;
      }
    }

    // Check if user is admin
    if (publicKey.toString() !== ADMIN_WALLET.toString()) {
      setError(`❌ Admin access required. Only the designated admin wallet can initialize the platform.`);
      alert("Platform initialization requires the admin wallet. Please connect the correct wallet.");
        console.log(`🚀 Initializing platform with fee: ${creationFee} SOL (${feeInLamports} lamports)`);
        
    }

    setIsInitializing(true);
    setError('');
    setInitResult(null);
          console.log('✅ Platform initialization successful:', result);
          
          // Enhanced success feedback
          setTimeout(() => {
            alert(`🎉 Platform initialized successfully!\n\nCreation fee: ${creationFee} SOL\nState address: ${result.stateAddress}\nTransaction: ${result.signature}`);
          }, 1000);
          
    try {
      const feeInLamports = parseFloat(creationFee) * 1000000000; // Convert SOL to lamports
      const result = await initializePlatform(wallet.adapter, feeInLamports);
      
      if (result.success) {
        setInitResult(result);
        setError('');
          
          // Enhanced error feedback
          let userMessage = errorMsg;
          if (errorMsg.includes('insufficient')) {
            userMessage = "❌ Insufficient SOL balance. Please add SOL to your wallet and try again.";
          } else if (errorMsg.includes('already initialized')) {
            userMessage = "ℹ️ Platform is already initialized. No action needed.";
          } else if (errorMsg.includes('access violation')) {
            userMessage = "❌ Smart contract error. Please contact support or try again later.";
          }
          
          setTimeout(() => {
            alert(userMessage);
          }, 500);
          checkPlatformState();
        }, 2000);
      } else {
        const errorMsg = result.error || 'Failed to initialize platform';
        setError(errorMsg);
        
        setTimeout(() => {
          alert(errorMsg.includes('insufficient') 
            ? "❌ Insufficient SOL balance. Please add SOL to your wallet and try again."
            : `❌ Unexpected error: ${errorMsg}. Please try again or contact support.`);
        }, 500);
      }
    } catch (err) {
      console.error('Initialization error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize platform';
      setError(errorMsg);
      alert(errorMsg.includes('insufficient') 
        ? "Insufficient SOL balance. Please add SOL to your wallet and try again."
        : `Unexpected error: ${errorMsg}. Please try again or contact support.`);
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

          <Card className="border-red-500/50 bg-red-500/5 shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-3xl font-bold text-red-600">🚫 Admin Access Required</CardTitle>
              <CardDescription className="text-lg">
                This admin panel requires the designated admin wallet to access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-500/30 bg-red-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-red-700">❌ Unauthorized Wallet</p>
                    <p className="text-sm">
                      <strong>Connected:</strong> <code className="bg-red-100 px-2 py-1 rounded text-xs font-mono">{publicKey.toString()}</code>
                    </p>
                    <p className="text-sm">
                      <strong>Required:</strong> <code className="bg-green-100 px-2 py-1 rounded text-xs font-mono">{ADMIN_WALLET.toString()}</code>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 mb-2">🔧 How to Get Admin Access:</h4>
                <ol className="text-sm text-blue-600 space-y-1 list-decimal list-inside">
                  <li>Disconnect your current wallet</li>
                  <li>Connect the admin wallet address shown above</li>
                  <li>Refresh this page after connecting</li>
                  <li>You'll then have full admin access</li>
                </ol>
              </div>

              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  If you are the platform administrator, please connect the correct admin wallet.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/">
                    <Button variant="outline" className="w-full sm:w-auto hover:bg-muted">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Return to Platform
                    </Button>
                  </Link>
                  <Link href="/create">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                      <Rocket className="w-4 h-4 mr-2" />
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

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-red-500" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">🔐 Admin Panel Access</CardTitle>
              <CardDescription className="text-lg">
                Connect the designated admin wallet to access platform management tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <WalletMultiButton className="!bg-gradient-to-r !from-red-500 !to-red-600 hover:!from-red-600 hover:!to-red-700 !rounded-xl !shadow-lg !min-h-[48px] !px-6 !text-base !font-semibold" />
              </div>

              <Alert className="border-orange-500/30 bg-orange-500/10">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-orange-700">🔑 Admin Wallet Required</p>
                    <p className="text-sm">
                      <strong>Only this specific wallet can access admin functions:</strong>
                    </p>
                    <code className="block bg-orange-100 px-3 py-2 rounded text-xs font-mono break-all border border-orange-200">
                      {ADMIN_WALLET.toString()}
                    </code>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <h4 className="font-semibold text-green-700 mb-2">✅ What You Can Do With Admin Access:</h4>
                <ul className="text-sm text-green-600 space-y-1 list-disc list-inside">
                  <li>Initialize the token creation platform</li>
                  <li>Set token creation fees</li>
                  <li>Monitor platform statistics</li>
                  <li>Manage platform configuration</li>
                </ul>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Don't have admin access? The platform is still fully functional:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/create">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg">
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Token
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full sm:w-auto hover:bg-muted">
                      <BarChart3 className="w-4 h-4 mr-2" />
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
              <Settings className="w-6 h-6 md:w-5 md:h-5" />
              <span>Admin Wallet Status</span>
            </CardTitle>
            <CardDescription>
              Connected admin wallet information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 md:space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 md:p-4 bg-green-500/10 border border-green-500/30 rounded-lg min-h-[80px] md:min-h-[60px]">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-6 h-6 md:w-5 md:h-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-600 text-lg md:text-base">✅ Admin wallet connected</p>
                    <p className="text-base md:text-sm text-muted-foreground">Full administrative access granted</p>
                  </div>
                </div>
                <WalletMultiButton className="!bg-green-500 hover:!bg-green-600 !rounded-xl !min-h-[48px] !px-4 !text-base md:!text-sm" />
              </div>
              
              <div className="space-y-2">
                <p className="text-base md:text-sm text-muted-foreground mb-2 font-medium">Connected Wallet:</p>
                <p className="font-mono text-base md:text-sm bg-muted p-4 md:p-3 rounded-lg break-all">
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
          <CardContent className="space-y-6 md:space-y-4">
            <Button 
              onClick={checkPlatformState}
              disabled={isCheckingState}
              variant="outline"
              className="w-full sm:w-auto min-h-[56px] md:min-h-[44px] text-lg md:text-base py-4 md:py-2"
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

            {error && !stateInfo && (
              <Alert className="border-yellow-500/30 bg-yellow-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-600">
                  <div className="space-y-2">
                    <p className="font-semibold">⚠️ Platform Status:</p>
                    <p>{error}</p>
                    {error.includes('not yet initialized') && (
                      <div className="mt-3 text-sm text-yellow-700">
                        <p><strong>Next steps:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Set your desired creation fee below (0 for free)</li>
                          <li>Click "Initialize Platform" to set up the platform</li>
                          <li>Once initialized, users can create tokens</li>
                        </ul>
                      </div>
                    )}
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
          <CardContent className="space-y-6 md:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="creationFee">Creation Fee (SOL)</Label>
              <Input
                className="touch-target h-14 md:h-12 text-lg md:text-base"
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
              className="w-full bg-red-500 hover:bg-red-600 min-h-[56px] md:min-h-[44px] text-lg md:text-base py-4 md:py-2"
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
              <Alert className="border-red-500/30 bg-red-500/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-600">
                  <div className="space-y-2">
                    <p className="font-semibold">❌ Error Details:</p>
                    <p>{error}</p>
                    {error.includes('insufficient') && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <p className="text-blue-700 font-semibold">💡 How to fix:</p>
                        <ul className="text-blue-600 text-sm mt-1 space-y-1 list-disc list-inside">
                          <li>Add SOL to your admin wallet</li>
                          <li>Platform initialization requires ~0.01 SOL for fees</li>
                          <li>Try again once you have sufficient balance</li>
                        </ul>
                      </div>
                    )}
                  </div>
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-4">
              <Link href="/create">
                <Button variant="outline" className="w-full min-h-[60px] md:min-h-[48px] text-lg md:text-base">
                  Create Token
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full min-h-[60px] md:min-h-[48px] text-lg md:text-base">
                  Dashboard
                </Button>
              </Link>
              <Link href="/verify">
                <Button variant="outline" className="w-full min-h-[60px] md:min-h-[48px] text-lg md:text-base">
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
                  If the platform shows as "not initialized", set the creation fee and initialize it. This is required only once.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Verify Success</h4>
                <p className="text-muted-foreground">
                  After successful initialization, the platform status should show "initialized" with your admin address and creation fee.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">4. Start Creating Tokens</h4>
                <p className="text-muted-foreground">
                  Once initialized, any user can create tokens through the Create Token page. They'll pay the fee you set (if any).
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <h4 className="font-semibold text-green-700 mb-2">💡 Pro Tips:</h4>
              <ul className="text-sm text-green-600 space-y-1 list-disc list-inside">
                <li>Set creation fee to 0 to allow free token creation</li>
                <li>Higher fees can help prevent spam token creation</li>
                <li>You can always check platform stats after initialization</li>
                <li>Platform initialization is a one-time setup process</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}