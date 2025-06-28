'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Coins, 
  Send, 
  Plus,
  RefreshCw,
  ArrowRight, 
  ExternalLink, 
  Download,
  Info,
  AlertTriangle
} from 'lucide-react';

import Link from 'next/link';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  getAlgorandEnhancedTokenInfo, 
  getAlgorandTransactionHistory, 
  getAlgorandWalletSummary,
  formatAlgorandTransactionForDisplay,
  AlgorandTokenInfo,
  AlgorandTransactionInfo 
} from '@/lib/algorand-data';
import { optInToAsset } from '@/lib/algorand';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function AlgorandDashboard() {
  const [userTokens, setUserTokens] = useState<AlgorandTokenInfo[]>([]);
  const [transactionData, setTransactionData] = useState<AlgorandTransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AlgorandTokenInfo | null>(null);
  const [isOpingIn, setIsOptingIn] = useState(false);
  
  const { 
    connected,
    address,
    signTransaction,
    selectedNetwork,
    balance,
    networkConfig
  } = useAlgorandWallet();
  
  const { toast } = useToast();
  
  // Add mounted state for hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data when wallet connects
  useEffect(() => {
    if (connected && address) {
      console.log('🔄 Wallet connected, fetching data...');
      fetchDashboardData();
    } else {
      console.log('❌ Wallet disconnected, resetting dashboard...');
      setIsLoading(true);
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      setError(null);
    }
  }, [connected, address, selectedNetwork]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`📊 Fetching dashboard data for: ${address}`);
      
      // Show immediate loading feedback
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      
      // Fetch data with better error handling
      const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
        getAlgorandEnhancedTokenInfo(address, selectedNetwork),
        getAlgorandTransactionHistory(address, 10, selectedNetwork),
        getAlgorandWalletSummary(address, selectedNetwork)
      ]);
      
      // Handle tokens data
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
        setUserTokens(tokensResult.value.data);
        console.log(`✅ Loaded ${tokensResult.value.data.length} tokens`);
      } else {
        console.warn('⚠️ Failed to load tokens');
        if (tokensResult.status === 'fulfilled' && tokensResult.value.error) {
          console.error('Error:', tokensResult.value.error);
        }
        setUserTokens([]);
      }
      
      // Handle transactions data
      if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success && transactionsResult.value.data) {
        setTransactionData(transactionsResult.value.data);
        console.log(`✅ Loaded ${transactionsResult.value.data.length} transactions`);
      } else {
        console.warn('⚠️ Failed to load transactions');
        setTransactionData([]);
      }
      
      // Handle summary data
      if (summaryResult.status === 'fulfilled' && summaryResult.value.success && summaryResult.value.data) {
        setWalletSummary(summaryResult.value.data);
        console.log('✅ Wallet summary loaded');
      } else {
        console.warn('⚠️ Failed to load wallet summary');
        setWalletSummary({
          totalTokens: 0,
          totalValue: 0,
          algoBalance: balance || 0,
          recentTransactions: 0
        });
      }
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError('Failed to load some dashboard data. Some features may be limited.');
      
      // Set default values even on error
      setWalletSummary({
        totalTokens: 0,
        totalValue: 0,
        algoBalance: balance || 0,
        recentTransactions: 0
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manual refresh function
  const handleRefresh = async () => {
    if (!connected || !address || isRefreshing) return;
    
    setIsRefreshing(true);
    
    toast({
      title: "Refreshing data...",
      description: "Fetching the latest information from the blockchain.",
    });
    
    await fetchDashboardData();
    setIsRefreshing(false);
    
    toast({
      title: "Data refreshed",
      description: "Your dashboard has been updated with the latest information.",
    });
  };
  
  // Chart data
  const chartData = [
    { name: 'Week 1', value: transactionData.slice(0, 2).length },
    { name: 'Week 2', value: transactionData.slice(2, 4).length },
    { name: 'Week 3', value: transactionData.slice(4, 6).length },
    { name: 'Week 4', value: transactionData.slice(6, 8).length },
  ];
  
  // Handle opt-in to an asset
  const handleOptIn = async (assetId: number) => {
    if (!connected || !address || !signTransaction) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsOptingIn(true);
    
    try {
      toast({
        title: "Opt-in initiated",
        description: "Please confirm the transaction in your wallet.",
      });
      
      const result = await optInToAsset(address, assetId, signTransaction, selectedNetwork);
      
      if (result.success) {
        toast({
          title: "Successfully opted in!",
          description: "You can now receive this token.",
        });
        
        // Refresh data to show the new asset
        setTimeout(() => handleRefresh(), 2000);
      } else {
        toast({
          title: "Opt-in failed",
          description: result.error || "Unknown error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Opt-in error:', error);
      toast({
        title: "Opt-in failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsOptingIn(false);
    }
  };

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Algorand Dashboard</h1>
          <p className="text-muted-foreground">Manage and monitor your Algorand assets</p>
          {address && (
            <p className="text-sm text-muted-foreground mt-2">
              Connected: {networkConfig?.name || selectedNetwork} • {address.slice(0, 8)}...{address.slice(-8)}
            </p>
          )}
          {error && (
            <Alert className="mt-4 border-red-500/30 bg-red-500/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <Badge className={`${
              networkConfig?.isMainnet 
                ? 'algorand-mainnet-badge' 
                : 'algorand-badge'
            }`}>
              {networkConfig?.name || selectedNetwork}
            </Badge>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing || !connected}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Link href="/create">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Token
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Assets</p>
                <p className="text-2xl font-bold text-foreground">
                  {walletSummary?.totalTokens || userTokens.length || 0}
                </p>
              </div>
              <Coins className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${walletSummary?.totalValue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-8 h-8 text-green-500">$</div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">ALGO Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  {walletSummary?.algoBalance?.toFixed(4) || balance?.toFixed(4) || '0.0000'}
                </p>
              </div>
              <div className="w-8 h-8 text-green-500 font-bold">A</div>
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Recent Transactions</p>
                <p className="text-2xl font-bold text-foreground">
                  {walletSummary?.recentTransactions || transactionData.length || 0}
                </p>
              </div>
              <div className="w-8 h-8 text-blue-500">
                <BarChart className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Token List */}
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center justify-between">
                  <span>Your Algorand Assets</span>
                  {userTokens.length > 0 && (
                    <Badge className="algorand-badge">
                      {userTokens.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/50 animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-muted"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted rounded"></div>
                            <div className="h-3 w-16 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userTokens.length > 0 ? (
                  <div className="space-y-4">
                    {userTokens.map((token, index) => (
                      <div 
                        key={token.assetId}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedAsset?.assetId === token.assetId
                            ? 'bg-red-500/20 border border-red-500/50' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => setSelectedAsset(token)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.symbol}
                                className="w-10 h-10 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#76f935] flex items-center justify-center text-white font-bold">
                                {token.symbol.slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p className="text-foreground font-medium">{token.name}</p>
                              <p className="text-muted-foreground text-sm">{token.symbol}</p>
                            </div>
                          </div>
                          {token.verified && (
                            <Badge className="algorand-badge text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-foreground font-semibold">{token.uiBalance.toLocaleString()}</p>
                            <p className="text-muted-foreground text-sm">{token.value || 'N/A'}</p>
                          </div>
                          {token.change && (
                            <Badge className={token.change.startsWith('+') 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }>
                              {token.change}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No assets found in your wallet
                    </p>
                    <div className="space-y-4">
                      <Link href="/create">
                        <Button className="bg-red-500 hover:bg-red-600 text-white w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Token
                        </Button>
                      </Link>
                      
                      <Alert className="bg-blue-500/10 border-blue-500/30">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-600 text-sm">
                          <p className="font-semibold mb-1">Why don't I see my token?</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>You need to opt-in to assets before they appear</li>
                            <li>Transactions may take a few minutes to confirm</li>
                            <li>Try clicking the refresh button above</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="transactions" className="space-y-6">
              <Card className="glass-card">
                <CardContent className="pt-6">
                  <TabsList className="enhanced-tabs grid w-full grid-cols-3">
                    <TabsTrigger value="transactions" className="enhanced-tab-trigger">
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="enhanced-tab-trigger">
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="enhanced-tab-trigger">
                      Manage
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>
              
              <TabsContent value="transactions">
                <Card className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Transactions</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      <span>Export Transactions</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg animate-pulse">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-muted"></div>
                              <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted rounded"></div>
                                <div className="h-3 w-32 bg-muted rounded"></div>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="h-3 w-16 bg-muted rounded ml-auto"></div>
                              <div className="h-4 w-12 bg-muted rounded ml-auto"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : transactionData.length > 0 ? (
                      <div className="space-y-4">
                        {transactionData.map((tx, index) => {
                          const displayTx = formatAlgorandTransactionForDisplay(tx);
                          return (
                            <div key={tx.id || index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-[#76f935]/20 flex items-center justify-center">
                                  <Send className="w-4 h-4 text-[#76f935]" />
                                </div>
                                <div>
                                  <p className="text-foreground font-medium">{displayTx.type}</p>
                                  <p className="text-muted-foreground text-sm">{displayTx.amount} to {displayTx.to}</p>
                                  <a 
                                    href={`${networkConfig?.explorer}/tx/${tx.id}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center"
                                  >
                                    View on Explorer
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-muted-foreground text-sm">{displayTx.time}</p>
                                <Badge className={displayTx.status === 'Completed' 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : displayTx.status === 'Failed'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                }>
                                  {displayTx.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-6">
                          <div className="flex items-start space-x-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1 flex-shrink-0" />
                            <div>
                              <h4 className="text-yellow-600 font-medium">Pending Transactions</h4>
                              <p className="text-yellow-600 text-sm mt-1">
                                Transactions show as pending until confirmed on the blockchain. This usually takes 3-5 seconds, but might take longer during network congestion.
                              </p>
                              <div className="mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={handleRefresh} 
                                  className="text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10"
                                >
                                  <RefreshCw className="w-3 h-3 mr-2" />
                                  Refresh Status
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Send className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground mb-2">No transactions found</p>
                        <p className="text-sm text-muted-foreground">
                          Transactions will appear here once you start using your wallet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Transaction Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-64 animate-pulse bg-muted/20 rounded-lg"></div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} strokeWidth={1} />
                            <XAxis 
                              dataKey="name" 
                              stroke="currentColor" 
                              opacity={0.7}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis 
                              stroke="currentColor" 
                              opacity={0.7}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip />
                            <Bar 
                              dataKey="value" 
                              fill="#76f935"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {!isLoading && transactionData.length === 0 && (
                      <div className="text-center mt-4">
                        <p className="text-muted-foreground">No transaction data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="manage">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Asset Management</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedAsset ? (
                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          {selectedAsset.image ? (
                            <img 
                              src={selectedAsset.image} 
                              alt={selectedAsset.symbol}
                              className="w-16 h-16 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#76f935] flex items-center justify-center text-white font-bold text-xl">
                              {selectedAsset.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <h3 className="text-xl font-bold">{selectedAsset.name}</h3>
                            <p className="text-muted-foreground">{selectedAsset.symbol}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground text-sm">Balance</p>
                            <p className="text-xl font-bold">{selectedAsset.uiBalance.toLocaleString()} {selectedAsset.symbol}</p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground text-sm">Asset ID</p>
                            <p className="text-sm font-mono break-all">{selectedAsset.assetId}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-semibold">Asset Actions</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Button 
                              variant="outline"
                              className="border-border text-muted-foreground hover:bg-muted h-12"
                              onClick={() => window.open(selectedAsset.explorerUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View on Explorer
                            </Button>
                            <Button 
                              variant="outline"
                              className="border-border text-muted-foreground hover:bg-muted h-12"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Asset
                            </Button>
                          </div>
                        </div>
                        
                        {selectedAsset.description && (
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-muted-foreground text-sm">{selectedAsset.description}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Coins className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">No Asset Selected</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Select an asset from your list or create your first token to get started.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Link href="/create">
                            <Button className="bg-red-500 hover:bg-red-600 text-white">
                              <Plus className="w-4 h-4 mr-2" />
                              Create New Token
                            </Button>
                          </Link>
                          <Button 
                            variant="outline"
                            className="border-[#76f935]/30 text-[#76f935] hover:bg-[#76f935]/10"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Add Existing Asset
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <Alert className="mt-4 border-blue-500/30 bg-blue-500/10">
                      <Info className="h-4 w-4 text-blue-500" />
                      <AlertDescription className="text-blue-600">
                        <p className="font-medium">Important: Opt-in Required for Algorand Assets</p>
                        <p className="text-sm mt-1">
                          You must opt-in to each Algorand Standard Asset (ASA) before you can receive it in your wallet. Click the button below to opt-in to your newly created token.
                        </p>
                        
                        <div className="mt-3">
                          <Input 
                            placeholder="Enter Asset ID to Opt-in (e.g., 3094943583)" 
                            className="mb-3 bg-blue-500/5 border-blue-500/20"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                          >
                            Opt-in to Asset
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}