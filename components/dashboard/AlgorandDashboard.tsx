'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Coins, 
  TrendingUp, 
  Users, 
  Plus, 
  Settings, 
  ExternalLink, 
  Copy, 
  Send, 
  Flame, 
  RefreshCw,
  Loader2,
  AlertTriangle,
  Wallet,
  Network
} from 'lucide-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { useToast } from '@/hooks/use-toast';
import { 
  getAlgorandEnhancedTokenInfo,
  getAlgorandTransactionHistory,
  getAlgorandWalletSummary,
  formatAlgorandTransactionForDisplay
} from '@/lib/algorand-data';
import { optInToAsset, transferAlgorandAssets } from '@/lib/algorand';
import { DashboardSkeleton, TokenCardSkeleton } from '@/components/skeletons/DashboardSkeletons';

interface TokenData {
  assetId: number;
  name?: string;
  symbol?: string;
  balance?: string;
  uiBalance?: number;
  decimals?: number;
  value?: string;
  change?: string;
  holders?: number;
  verified?: boolean;
  image?: string;
  description?: string;
  explorerUrl?: string;
}

export default function AlgorandDashboard() {
  const { connected, address, selectedNetwork, signTransaction, balance: walletBalance } = useAlgorandWallet();
  const { toast } = useToast();
  
  const [tokens, setTokens] = useState<TokenData[]>([]); 
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [walletSummary, setWalletSummary] = useState({
    totalValue: 0,
    tokenCount: 0,
    algoBalance: 0,
    recentTransactions: 0
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showOptInDialog, setShowOptInDialog] = useState(false);
  const [assetIdToOptIn, setAssetIdToOptIn] = useState('');
  const [optInInProgress, setOptInInProgress] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferInProgress, setTransferInProgress] = useState(false);

  useEffect(() => {
    if (connected && address) {
      loadDashboardData();
    }
  }, [connected, address, selectedNetwork]);

  const loadDashboardData = async (showLoadingState = true) => {
    if (!connected || !address) return;
    
    if (showLoadingState) {
      setLoading(true);
      setTokenLoading(true);
    }
    
    try {
      // Get wallet summary
      const summaryResult = await getAlgorandWalletSummary(address, selectedNetwork);
      
      if (summaryResult.success && summaryResult.data) {
        setWalletSummary({
          totalValue: summaryResult.data.totalValue || 0,
          tokenCount: summaryResult.data.totalTokens || 0,
          algoBalance: summaryResult.data.algoBalance || 0,
          recentTransactions: summaryResult.data.recentTransactions || 0
        });
      }
      
      // Get tokens
      const tokenResult = await getAlgorandEnhancedTokenInfo(address, selectedNetwork);
      
      if (tokenResult.success && tokenResult.data) {
        setTokens(tokenResult.data);
      }
      
      // Get transactions
      const txResult = await getAlgorandTransactionHistory(address, 10, selectedNetwork);
      
      if (txResult.success && txResult.data) {
        setTransactions(txResult.data);
      }
      
    } catch (error) {
      console.error('Error loading Algorand dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setTokenLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
    setRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "Latest data loaded from the blockchain",
    });
  };

  const handleOptIn = async () => {
    if (!assetIdToOptIn) {
      toast({
        title: "Asset ID Required",
        description: "Please enter a valid Asset ID",
        variant: "destructive"
      });
      return;
    }
    
    setOptInInProgress(true);
    
    try {
      const assetId = parseInt(assetIdToOptIn);
      
      const optInResult = await optInToAsset(
        address!,
        assetId,
        signTransaction!,
        selectedNetwork
      );
      
      if (optInResult.success) {
        toast({
          title: "Success",
          description: `Successfully opted in to asset ${assetId}`,
        });
        
        // Reload tokens after a small delay
        setTimeout(() => {
          loadDashboardData();
          setShowOptInDialog(false);
          setAssetIdToOptIn('');
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: optInResult.error || "Failed to opt in",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Opt-in error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setOptInInProgress(false);
    }
  };
  
  const handleTransfer = async () => {
    if (!selectedToken) return;
    if (!transferRecipient || !transferAmount) {
      toast({
        title: "Missing Information",
        description: "Please enter recipient address and amount",
        variant: "destructive"
      });
      return;
    }
    
    setTransferInProgress(true);
    
    try {
      const amount = parseFloat(transferAmount);
      
      const transferResult = await transferAlgorandAssets(
        address!,
        selectedToken.assetId,
        transferRecipient,
        amount,
        signTransaction!,
        selectedNetwork
      );
      
      if (transferResult.success) {
        toast({
          title: "Success",
          description: `Successfully transferred ${transferAmount} ${selectedToken.symbol || 'tokens'} to ${transferRecipient.slice(0, 6)}...${transferRecipient.slice(-4)}`,
        });
        
        // Reload tokens after a small delay
        setTimeout(() => {
          loadDashboardData();
          setShowTransferDialog(false);
          setTransferRecipient('');
          setTransferAmount('');
          setSelectedToken(null);
        }, 2000);
      } else {
        toast({
          title: "Error",
          description: transferResult.error || "Failed to transfer tokens",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setTransferInProgress(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
  };
  
  // Format token value for display
  const formatTokenValue = (token: TokenData) => {
    if (!token.value || token.value === 'N/A') return 'N/A';

    // If value is already a formatted string like "$250.50"
    if (typeof token.value === 'string' && token.value.startsWith('$')) {
      return token.value;
    }
    
    // If it's a number or numeric string
    const value = typeof token.value === 'string' ? parseFloat(token.value) : token.value;
    return isNaN(value) ? 'N/A' : `$${value.toFixed(2)}`;
  };

  if (!connected || !address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#76f935]/5 via-[#76f935]/2 to-[#76f935]/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4 border-red-500/30 bg-gradient-to-br from-black to-gray-900 shadow-2xl font-inter">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#A9DFBF] to-[#22C55E] p-5 shadow-lg shadow-[#A9DFBF]/20">
              <Wallet className="w-full h-full text-white" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold">Connect Your Algorand Wallet</CardTitle>
            <p className="text-muted-foreground mt-4 mb-2">
              Access your Algorand assets and transaction history
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex items-center justify-center space-x-2 p-3 bg-[#A9DFBF]/15 rounded-lg border border-[#A9DFBF]/20">
              <Network className="w-5 h-5 text-[#22C55E]" aria-hidden="true" />
              <p className="font-medium text-[#22C55E]">
                {selectedNetwork.includes('testnet') ? 'Algorand Testnet Network' : 'Algorand Mainnet Network'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-[#22C55E]/10 to-[#A9DFBF]/5 rounded-xl p-6 text-center border border-[#A9DFBF]/20">
              <h3 className="font-semibold text-lg mb-3 text-[#22C55E]">Wallet Features</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                  <Coins className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
                  <span className="text-sm">View Assets</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                  <Send className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
                  <span className="text-sm">Transfer Tokens</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
                  <span className="text-sm">Track Values</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-white/5 rounded-lg">
                  <Plus className="w-4 h-4 text-[#22C55E]" aria-hidden="true" />
                  <span className="text-sm">Opt-in to ASAs</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Connect to access all these features
              </p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Button 
                onClick={() => window.location.reload()}
                className="w-full bg-gradient-to-r from-red-500 to-black hover:from-red-600 hover:to-gray-900 text-white hover:from-[#1EA750] hover:to-[#97CEAC] shadow-md shadow-[#A9DFBF]/20 py-6 font-medium text-base"
              >
                <RefreshCw className="w-4 h-4 mr-2.5" />
                Connect Wallet
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.history.back()}
                className="border-[#A9DFBF]/30 text-[#22C55E] hover:bg-[#A9DFBF]/10"
              >
                Back to Platform
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Display loading state while data is being fetched
  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#76f935]/5 via-[#76f935]/2 to-[#76f935]/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Algorand Dashboard</h1>
            <p className="text-muted-foreground flex items-center">
              <span className="font-mono">{address.slice(0, 8)}...{address.slice(-8)}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(address)}
                className="ml-2 h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy address</span>
              </Button>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowOptInDialog(true)}
              className="bg-[#76f935] text-black hover:bg-[#76f935]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Opt-In to Asset
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/90 dark:bg-black/80 shadow-md font-inter">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">ALGO Balance</p>
                  <p className="text-2xl font-bold">{walletSummary.algoBalance.toFixed(4)} ALGO</p>
                  <p className="text-xs text-muted-foreground">Native currency</p>
                </div>
                <div className="bg-[#76f935]/20 p-2 rounded-full">
                  <Coins className="h-5 w-5 text-[#76f935]" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 dark:bg-black/80 shadow-md">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Assets</p>
                  <p className="text-2xl font-bold">{walletSummary.tokenCount}</p>
                  <p className="text-xs text-muted-foreground">Total tokens</p>
                </div>
                <div className="bg-purple-500/20 p-2 rounded-full">
                  <Wallet className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 dark:bg-black/80 shadow-md">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Estimated Value</p>
                  <p className="text-2xl font-bold">${walletSummary.totalValue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">All assets</p>
                </div>
                <div className="bg-blue-500/20 p-2 rounded-full">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/90 dark:bg-black/80 shadow-md">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Network</p>
                  <p className="text-2xl font-bold">
                    {selectedNetwork.includes('testnet') ? 'Testnet' : 'Mainnet'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-600">●</span> Connected
                  </p>
                </div>
                <div className="bg-[#76f935]/20 p-2 rounded-full">
                  <Network className="h-5 w-5 text-[#76f935]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token List */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 dark:bg-black/80 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Your Assets</CardTitle>
                <Badge variant="outline" className="ml-2">
                  {tokens.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {tokenLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <TokenCardSkeleton key={i} />
                    ))}
                  </div>
                ) : tokens.length > 0 ? (
                  <div className="space-y-3">
                    {tokens.map((token) => (
                      <div 
                        key={token.assetId} 
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center mb-3 md:mb-0">
                          <div className="w-10 h-10 bg-[#76f935]/10 rounded-full flex items-center justify-center text-[#76f935] font-bold mr-3">
                            {token.symbol?.[0] || 'A'}
                          </div>
                          <div>
                            <h3 className="font-semibold">{token.name || `Asset #${token.assetId}`}</h3>
                            <div className="flex items-center">
                              <p className="text-sm text-muted-foreground">{token.symbol || 'ASA'}</p>
                              {token.verified && (
                                <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-500 border-green-500/30">
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:items-end">
                          <p className="font-semibold">{token.uiBalance?.toLocaleString() || '0'}</p>
                          <p className="text-sm text-muted-foreground">{formatTokenValue(token)}</p>
                        </div>
                        
                        <div className="flex space-x-2 mt-3 md:mt-0 md:ml-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedToken(token);
                              setShowTransferDialog(true);
                            }}
                          >
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Transfer</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => window.open(token.explorerUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="sr-only">View on explorer</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <Coins className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Assets Found</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't opted into any Algorand Standard Assets yet
                    </p>
                    <Button 
                      onClick={() => setShowOptInDialog(true)}
                      className="bg-[#76f935] text-black hover:bg-[#76f935]/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Opt-In to Asset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 dark:bg-black/80 shadow-md">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx, idx) => (
                      <div key={tx.id || idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-500">
                            <Send className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">{tx.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {tx.timestamp ? formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true }) : 'Unknown time'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-right font-medium">{tx.amount} {tx.token}</p>
                          <Badge variant="outline" className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-3">
                      <Settings className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No recent transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Opt-In Dialog */}
        {showOptInDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Opt-In to Algorand Asset</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  Enter the Asset ID to opt-in and receive this asset
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="assetId" className="block text-sm font-medium mb-1">Asset ID</label>
                    <input
                      id="assetId"
                      type="text"
                      value={assetIdToOptIn}
                      onChange={(e) => setAssetIdToOptIn(e.target.value)}
                      placeholder="Enter Asset ID"
                      className="w-full p-2 rounded-md border border-border bg-background"
                    />
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-yellow-700 dark:text-yellow-400">
                        <p className="font-medium">Important:</p>
                        <p>Opting in requires a minimum balance of 0.1 ALGO per asset. Your current balance: {walletSummary.algoBalance.toFixed(4)} ALGO</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowOptInDialog(false);
                        setAssetIdToOptIn('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleOptIn}
                      disabled={optInInProgress || !assetIdToOptIn}
                      className="bg-[#76f935] text-black hover:bg-[#76f935]/90"
                    >
                      {optInInProgress ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Opt-In
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Transfer Dialog */}
        {showTransferDialog && selectedToken && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Transfer {selectedToken.name || `Asset #${selectedToken.assetId}`}</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  Send {selectedToken.symbol || 'ASA'} tokens to another address
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium mb-1">Recipient Address</label>
                    <input
                      id="recipient"
                      type="text"
                      value={transferRecipient}
                      onChange={(e) => setTransferRecipient(e.target.value)}
                      placeholder="Enter Algorand address"
                      className="w-full p-2 rounded-md border border-border bg-background"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      id="amount"
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="0"
                      step="0.000001"
                      className="w-full p-2 rounded-md border border-border bg-background"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {selectedToken.uiBalance?.toLocaleString() || '0'} {selectedToken.symbol || 'tokens'}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm">
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-yellow-700 dark:text-yellow-400">
                        <p className="font-medium">Important:</p>
                        <p>The recipient must have already opted-in to this asset ({selectedToken.assetId}).</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowTransferDialog(false);
                        setTransferRecipient('');
                        setTransferAmount('');
                        setSelectedToken(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleTransfer}
                      disabled={transferInProgress || !transferRecipient || !transferAmount}
                      className="bg-[#76f935] text-black hover:bg-[#76f935]/90"
                    >
                      {transferInProgress ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Transfer
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}