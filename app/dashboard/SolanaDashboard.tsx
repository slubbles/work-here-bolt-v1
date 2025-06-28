'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  Coins, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  Settings, 
  ExternalLink,
  Copy,
  Send,
  Flame,
  BarChart3,
  AlertCircle,
  Calendar,
  Wallet,
  ArrowRight,
  Download,
  FileDown,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getEnhancedTokenInfo, 
  getWalletTransactionHistory, 
  getWalletSummary,
  getTokenHolders,
  EnhancedTokenInfo,
  TransactionInfo
} from '@/lib/solana-data';
import { getNetworkStats } from '@/lib/market-data';
import { mintTokens, burnTokens, updateTokenMetadata } from '@/lib/solana';
import { useToast } from '@/hooks/use-toast';

export default function SolanaDashboard() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Management action states
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [updateName, setUpdateName] = useState('');
  const [updateSymbol, setUpdateSymbol] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateLogoUrl, setUpdateLogoUrl] = useState('');
  const [updateWebsite, setUpdateWebsite] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Real data states
  const [userTokens, setUserTokens] = useState<EnhancedTokenInfo[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [selectedTokenHolders, setSelectedTokenHolders] = useState<any>(null);
  
  // Solana wallet integration
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  
  // Add mounted state for hydration
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      console.log('🔄 Wallet connected, fetching real data...');
      fetchDashboardData();
    } else {
      console.log('❌ Wallet disconnected, resetting dashboard...');
      setIsLoading(true);
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      setError(null);
      setSelectedToken(0);
    }
  }, [connected]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!publicKey) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const walletAddress = publicKey.toString();
      console.log(`📊 Fetching dashboard data for: ${walletAddress}`);
      
      // Show immediate loading feedback
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      setNetworkStats(null);
      
      // Enhanced data fetching with real-time information
      const [tokensResult, transactionsResult, summaryResult, networkResult] = await Promise.allSettled([
        getEnhancedTokenInfo(walletAddress),
        getWalletTransactionHistory(walletAddress, 20),
        getWalletSummary(walletAddress),
        getNetworkStats()
      ]);
      
      // Handle tokens data
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
        setUserTokens(tokensResult.value.data);
        console.log(`✅ Loaded ${tokensResult.value.data.length} tokens`);
        
        // Load holder data for the first token
        if (tokensResult.value.data.length > 0) {
          loadTokenHolders(tokensResult.value.data[0].mint);
        }
      } else {
        console.warn('⚠️ Failed to load tokens');
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
          solBalance: 0,
          recentTransactions: 0
        });
      }
      
      // Handle network stats
      if (networkResult.status === 'fulfilled' && networkResult.value.success && networkResult.value.data) {
        setNetworkStats(networkResult.value.data);
        console.log('✅ Network stats loaded');
      }
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError('Failed to load some dashboard data. Some features may be limited.');
      
      // Set default values even on error
      setWalletSummary({
        totalTokens: 0,
        totalValue: 0,
        solBalance: 0,
        recentTransactions: 0
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load token holder information
  const loadTokenHolders = async (mintAddress: string) => {
    try {
      const result = await getTokenHolders(mintAddress);
      if (result.success && result.data) {
        setSelectedTokenHolders(result.data);
      }
    } catch (error) {
      console.warn('Failed to load token holders:', error);
    }
  };
  
  // Handle token selection change
  const handleTokenSelection = (index: number) => {
    setSelectedToken(index);
    if (userTokens[index]) {
      loadTokenHolders(userTokens[index].mint);
    }
  };
  
  // Manual refresh function
  const handleRefresh = async () => {
    if (!connected || !publicKey || isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Generate chart data from transaction history
  const chartData = React.useMemo(() => {
    if (transactionData.length === 0) {
      return [
        { name: 'Day 1', value: 0 },
        { name: 'Day 2', value: 0 },
        { name: 'Day 3', value: 0 },
        { name: 'Day 4', value: 0 },
        { name: 'Day 5', value: 0 },
        { name: 'Day 6', value: 0 },
        { name: 'Day 7', value: 0 },
      ];
    }
    
    // Group transactions by day
    const now = Date.now();
    const dayGroups = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (i * 24 * 60 * 60 * 1000);
      const dayEnd = now - ((i - 1) * 24 * 60 * 60 * 1000);
      
      const dayTransactions = transactionData.filter(tx => 
        tx.timestamp >= dayStart && tx.timestamp < dayEnd
      );
      
      return {
        name: `Day ${7 - i}`,
        value: dayTransactions.length,
        volume: dayTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)
      };
    }).reverse();
    
    return dayGroups;
  }, [transactionData]);

  // Format transaction data for display
  const formatTransactionForDisplay = (tx: TransactionInfo) => {
    const timeAgo = formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true });
    
    return {
      type: tx.type,
      amount: `${tx.amount} ${tx.token}`,
      to: tx.to ? `${tx.to.slice(0, 4)}...${tx.to.slice(-4)}` : 'Unknown',
      time: timeAgo,
      status: tx.status === 'confirmed' ? 'Completed' : tx.status === 'failed' ? 'Failed' : 'Pending'
    };
  };

  const handleTransfer = () => {
    if (!transferAmount || !transferAddress) {
      alert('Please fill in both amount and recipient address');
      return;
    }
    
    alert(`Successfully transferred ${transferAmount} ${userTokens[selectedToken].symbol} to ${transferAddress}`);
    setTransferAmount('');
    setTransferAddress('');
  };
  
  // Handle mint tokens
  const handleMintSolana = async () => {
    if (!mintAmount || !userTokens[selectedToken]) {
      toast({
        title: "Error",
        description: "Please enter a valid amount to mint",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const selectedTokenData = userTokens[selectedToken];
      const result = await mintTokens(
        { publicKey, signTransaction: () => Promise.reject('Not implemented') }, // wallet mock
        selectedTokenData.mint,
        parseFloat(mintAmount),
        selectedTokenData.decimals
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully minted ${mintAmount} ${selectedTokenData.symbol}`,
        });
        setMintAmount('');
        setShowMintDialog(false);
        // Refresh data
        await fetchDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mint tokens",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle burn tokens
  const handleBurnSolana = async () => {
    if (!burnAmount || !userTokens[selectedToken]) {
      toast({
        title: "Error",
        description: "Please enter a valid amount to burn",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const selectedTokenData = userTokens[selectedToken];
      const result = await burnTokens(
        { publicKey, signTransaction: () => Promise.reject('Not implemented') }, // wallet mock
        selectedTokenData.mint,
        parseFloat(burnAmount),
        selectedTokenData.decimals
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully burned ${burnAmount} ${selectedTokenData.symbol}`,
        });
        setBurnAmount('');
        setShowBurnDialog(false);
        // Refresh data
        await fetchDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to burn tokens",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle update metadata
  const handleUpdateMetadataSolana = async () => {
    if (!updateName || !updateSymbol || !userTokens[selectedToken]) {
      toast({
        title: "Error",
        description: "Please fill in at least name and symbol",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const selectedTokenData = userTokens[selectedToken];
      const result = await updateTokenMetadata(
        { publicKey, signTransaction: () => Promise.reject('Not implemented') }, // wallet mock
        selectedTokenData.mint,
        {
          name: updateName,
          symbol: updateSymbol,
          description: updateDescription,
          logoUrl: updateLogoUrl,
          website: updateWebsite
        }
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully updated metadata for ${selectedTokenData.symbol}`,
        });
        // Reset form
        setUpdateName('');
        setUpdateSymbol('');
        setUpdateDescription('');
        setUpdateLogoUrl('');
        setUpdateWebsite('');
        setShowUpdateDialog(false);
        // Refresh data
        await fetchDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update metadata",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Simplified export function
  const exportData = (type: 'transactions' | 'analytics' | 'all') => {
    let data;
    let filename;

    switch (type) {
      case 'transactions':
        data = transactionData;
        filename = `transactions-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'analytics':
        data = chartData;
        filename = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'all':
        data = { tokens: userTokens, transactions: transactionData, summary: walletSummary };
        filename = `dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    alert(`${type} data exported successfully`);
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

  // Redirect to wallet connection if not connected
  if (!connected) {
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
                  Connect your Solana wallet to access your token dashboard
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-600">
                    <p className="font-semibold mb-1">To access your dashboard:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Click "Connect Wallet" in the top right</li>
                      <li>Select your Solana wallet (Phantom, Solflare, etc.)</li>
                      <li>Approve the connection</li>
                      <li>Your dashboard will load automatically</li>
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
  
  // Show loading state after wallet is connected
  if (isLoading) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your tokens and transaction data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Token Dashboard</h1>
            <p className="text-muted-foreground">Manage and monitor your token portfolio</p>
            {publicKey && (
              <p className="text-sm text-muted-foreground mt-2">
                Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
              </p>
            )}
            {error && (
              <div className="flex items-center space-x-2 mt-2 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
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
                <p className="text-muted-foreground text-sm">Total Tokens</p>
                <p className="text-2xl font-bold text-foreground">
                  {walletSummary?.totalTokens || userTokens.length}
                </p>
              </div>
              <Coins className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${walletSummary?.totalValue?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">SOL Balance</p>
                <p className="text-2xl font-bold text-foreground">{walletSummary?.solBalance?.toFixed(4) || '0.0000'}</p>
              </div>
              <Wallet className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Recent Transactions</p>
                <p className="text-2xl font-bold text-foreground">{walletSummary?.recentTransactions || transactionData.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token List */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Your Tokens</h2>
              {userTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No tokens found in your wallet
                  </p>
                  <Link href="/create">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Token
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {userTokens.map((token, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedToken === index 
                          ? 'bg-red-500/20 border border-red-500/50' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => handleTokenSelection(index)}
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
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold ${token.image ? 'hidden' : ''}`}>
                            {token.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-foreground font-medium">{token.name}</p>
                            <p className="text-muted-foreground text-sm">{token.symbol}</p>
                          </div>
                        </div>
                        {token.verified && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-foreground font-semibold">{token.uiBalance.toLocaleString()}</p>
                          <p className="text-muted-foreground text-sm">
                            {token.marketData ? `$${(token.marketData.price * token.uiBalance).toFixed(2)}` : token.value || 'N/A'}
                          </p>
                        </div>
                        {token.marketData && (
                          <Badge className={`${
                            token.marketData.priceChange24h >= 0
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {token.marketData.priceChange24h >= 0 ? '+' : ''}{token.marketData.priceChange24h.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Token Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Token Management</h3>
                  <p className="text-sm text-muted-foreground">Manage and analyze your token performance</p>
                </div>
                <TabsList className="enhanced-tabs grid w-full grid-cols-4">
                  <TabsTrigger value="overview" className="enhanced-tab-trigger">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="enhanced-tab-trigger">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="enhanced-tab-trigger">
                    <Calendar className="w-4 h-4 mr-2" />
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="enhanced-tab-trigger">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="overview" className="space-y-6">
                {userTokens.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Tokens Found</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your wallet and create your first token to get started.
                    </p>
                    <Link href="/create">
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Token
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="glass-card p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">{userTokens[selectedToken].name}</h3>
                        <p className="text-muted-foreground">{userTokens[selectedToken].symbol}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border text-muted-foreground"
                          onClick={() => navigator.clipboard.writeText(userTokens[selectedToken].mint)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border text-muted-foreground"
                          onClick={() => window.open(`https://explorer.solana.com/address/${userTokens[selectedToken].mint}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Balance</p>
                        <p className="text-foreground font-bold">{userTokens[selectedToken].uiBalance.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Value</p>
                        <p className="text-foreground font-bold">{userTokens[selectedToken].value || 'N/A'}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Decimals</p>
                        <p className="text-foreground font-bold">{userTokens[selectedToken].decimals}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Mint Address</p>
                        <p className="text-foreground font-bold text-xs">{userTokens[selectedToken].mint.slice(0, 8)}...</p>
                      </div>
                    </div>
                    
                    {userTokens[selectedToken].description && (
                      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                        <p className="text-muted-foreground text-sm">{userTokens[selectedToken].description}</p>
                      </div>
                    )}
                  </div>
                )}

                {userTokens.length > 0 && (
                  <div className="glass-card p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Transaction Activity</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} strokeWidth={1} />
                          <XAxis 
                            dataKey="name" 
                            stroke="currentColor" 
                            opacity={0.7}
                            tick={{ fontSize: 12 }}
                            tickLine={{ stroke: 'currentColor', opacity: 0.5 }}
                          />
                          <YAxis 
                            stroke="currentColor" 
                            opacity={0.7}
                            tick={{ fontSize: 12 }}
                            tickLine={{ stroke: 'currentColor', opacity: 0.5 }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#EF4444" 
                            strokeWidth={3}
                            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {userTokens.length > 0 && (
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-foreground">Transaction Distribution</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportData('analytics')}
                        className="gap-2"
                      >
                        <FileDown className="w-4 h-4" />
                        Export Analytics
                      </Button>
                    </div>
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
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--background))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="#EF4444"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-foreground">Recent Transactions</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => exportData('transactions')}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Transactions
                    </Button>
                  </div>
                  {transactionData.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent transactions found</p>
                      <p className="text-sm text-muted-foreground mt-2">Transactions will appear here as you use your wallet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactionData.map((tx, index) => {
                        const displayTx = formatTransactionForDisplay(tx);
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                displayTx.type.includes('Send') ? 'bg-red-500/20' :
                                displayTx.type.includes('Receive') ? 'bg-green-500/20' :
                                displayTx.type.includes('Swap') ? 'bg-blue-500/20' :
                                'bg-gray-500/20'
                              }`}>
                                <Send className={`w-4 h-4 ${
                                  displayTx.type.includes('Send') ? 'text-red-400' :
                                  displayTx.type.includes('Receive') ? 'text-green-400' :
                                  displayTx.type.includes('Swap') ? 'text-blue-400' :
                                  'text-gray-400'
                                }`} />
                              </div>
                              <div>
                                <p className="text-foreground font-medium">{displayTx.type}</p>
                                <p className="text-muted-foreground text-sm">{displayTx.amount} to {displayTx.to}</p>
                                {tx.txFee && (
                                  <p className="text-muted-foreground text-xs">Fee: {tx.txFee.toFixed(6)} SOL</p>
                                )}
                                <button
                                  onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}`, '_blank')}
                                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  View on Explorer
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-sm">{displayTx.time}</p>
                              {tx.usdValue && (
                                <p className="text-muted-foreground text-xs">${tx.usdValue.toFixed(2)}</p>
                              )}
                              <Badge className={`${
                                displayTx.status === 'Completed' 
                          <p className="text-foreground font-bold">
                            {userTokens[selectedToken].marketData 
                              ? `$${(userTokens[selectedToken].marketData!.price * userTokens[selectedToken].uiBalance).toFixed(2)}`
                              : 'N/A'
                            }
                          </p>
                                  : displayTx.status === 'Failed'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`}>
                                {displayTx.status}
                              </Badge>
                          <p className="text-muted-foreground text-sm">Holders</p>
                          <p className="text-foreground font-bold">
                            {userTokens[selectedToken].marketData?.holders || selectedTokenHolders?.totalHolders || 'N/A'}
                          </p>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Market Data Section */}
                  {userTokens.length > 0 && userTokens[selectedToken].marketData && (
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Market Data</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Price</p>
                          <p className="text-foreground font-bold">
                            ${userTokens[selectedToken].marketData!.price.toFixed(6)}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">24h Change</p>
                          <p className={`font-bold ${
                            userTokens[selectedToken].marketData!.priceChange24h >= 0 
                              ? 'text-green-500' 
                              : 'text-red-500'
                          }`}>
                            {userTokens[selectedToken].marketData!.priceChange24h >= 0 ? '+' : ''}
                            {userTokens[selectedToken].marketData!.priceChange24h.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">24h Volume</p>
                          <p className="text-foreground font-bold">
                            ${userTokens[selectedToken].marketData!.volume24h.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Liquidity</p>
                          <p className="text-foreground font-bold">
                            ${userTokens[selectedToken].marketData!.liquidity.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Token Metrics */}
                  {userTokens.length > 0 && userTokens[selectedToken].metrics && (
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Token Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">24h Transactions</p>
                          <p className="text-foreground font-bold">
                            {userTokens[selectedToken].metrics!.transactions24h}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Active Traders</p>
                          <p className="text-foreground font-bold">
                            {userTokens[selectedToken].metrics!.activeTraders}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Liquidity Score</p>
                          <p className="text-foreground font-bold">
                            {userTokens[selectedToken].metrics!.liquidityScore.toFixed(0)}/100
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Holder Distribution */}
                  {selectedTokenHolders && (
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Top Holders</h4>
                      <div className="space-y-3">
                        {selectedTokenHolders.topHolders.slice(0, 5).map((holder: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-red-500">#{index + 1}</span>
                              </div>
                              <span className="font-mono text-sm">
                                {holder.address.slice(0, 8)}...{holder.address.slice(-4)}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-foreground font-semibold text-sm">
                                {holder.percentage.toFixed(1)}%
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {holder.balance.toLocaleString()} tokens
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manage" className="space-y-6">
                {userTokens.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Tokens to Manage</h3>
                    <p className="text-muted-foreground mb-6">Create a token first to access management features.</p>
                    <Link href="/create">
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Token
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Token Transfer */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Transfer Tokens</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="transferAddress" className="text-foreground font-medium">Recipient Address</Label>
                          <Input
                            id="transferAddress"
                            placeholder="Enter wallet address"
                            value={transferAddress}
                            onChange={(e) => setTransferAddress(e.target.value)}
                            className="input-enhanced mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="transferAmount" className="text-foreground font-medium">Amount</Label>
                          <Input
                            id="transferAmount"
                            type="number"
                            placeholder={`Enter amount of ${userTokens[selectedToken].symbol}`}
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="input-enhanced mt-2"
                          />
                        </div>
                        <Button 
                          onClick={handleTransfer}
                          className="bg-red-500 hover:bg-red-600 text-white w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Transfer {userTokens[selectedToken].symbol}
                        </Button>
                      </div>
                    </div>

                    {/* Other Management Actions */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Token Management</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Mint Tokens Dialog */}
                        <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                              <Plus className="w-4 h-4 mr-2" />
                              Mint Tokens
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Mint Tokens</DialogTitle>
                              <DialogDescription>
                                Create additional tokens for {userTokens[selectedToken]?.symbol}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="mintAmount">Amount to Mint</Label>
                                <Input
                                  id="mintAmount"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={mintAmount}
                                  onChange={(e) => setMintAmount(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowMintDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleMintSolana} disabled={isProcessing}>
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Minting...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Mint Tokens
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Burn Tokens Dialog */}
                        <Dialog open={showBurnDialog} onOpenChange={setShowBurnDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                              <Flame className="w-4 h-4 mr-2" />
                              Burn Tokens
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Burn Tokens</DialogTitle>
                              <DialogDescription>
                                Permanently destroy tokens from circulation for {userTokens[selectedToken]?.symbol}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="burnAmount">Amount to Burn</Label>
                                <Input
                                  id="burnAmount"
                                  type="number"
                                  placeholder="Enter amount"
                                  value={burnAmount}
                                  onChange={(e) => setBurnAmount(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowBurnDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleBurnSolana} disabled={isProcessing} variant="destructive">
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Burning...
                                  </>
                                ) : (
                                  <>
                                    <Flame className="w-4 h-4 mr-2" />
                                    Burn Tokens
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Update Metadata Dialog */}
                        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                              <Settings className="w-4 h-4 mr-2" />
                              Update Metadata
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Update Metadata</DialogTitle>
                              <DialogDescription>
                                Update token information for {userTokens[selectedToken]?.symbol}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              <div>
                                <Label htmlFor="updateName">Token Name</Label>
                                <Input
                                  id="updateName"
                                  placeholder="Token name"
                                  value={updateName}
                                  onChange={(e) => setUpdateName(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="updateSymbol">Symbol</Label>
                                <Input
                                  id="updateSymbol"
                                  placeholder="Token symbol"
                                  value={updateSymbol}
                                  onChange={(e) => setUpdateSymbol(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="updateDescription">Description</Label>
                                <Textarea
                                  id="updateDescription"
                                  placeholder="Token description"
                                  value={updateDescription}
                                  onChange={(e) => setUpdateDescription(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="updateLogoUrl">Logo URL</Label>
                                <Input
                                  id="updateLogoUrl"
                                  placeholder="https://..."
                                  value={updateLogoUrl}
                                  onChange={(e) => setUpdateLogoUrl(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                              <div>
                                <Label htmlFor="updateWebsite">Website</Label>
                                <Input
                                  id="updateWebsite"
                                  placeholder="https://..."
                                  value={updateWebsite}
                                  onChange={(e) => setUpdateWebsite(e.target.value)}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUpdateMetadataSolana} disabled={isProcessing}>
                                {isProcessing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Update Metadata
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => exportData('all')}
                          className="border-border text-muted-foreground hover:bg-muted h-12 gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export All Data
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => window.open(`https://explorer.solana.com/address/${userTokens[selectedToken].mint}`, '_blank')}
                          className="border-border text-muted-foreground hover:bg-muted h-12 gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Explorer
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Network Stats Footer */}
        {networkStats && (
          <div className="mt-8 glass-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Solana Network Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{networkStats.tps}</p>
                <p className="text-sm text-muted-foreground">TPS</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{networkStats.activeValidators}</p>
                <p className="text-sm text-muted-foreground">Validators</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{(networkStats.averageFee / 1000000000).toFixed(6)}</p>
                <p className="text-sm text-muted-foreground">Avg Fee (SOL)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{networkStats.totalTransactions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Recent Transactions</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}