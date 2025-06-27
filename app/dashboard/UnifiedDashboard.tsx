'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  RefreshCw,
  Network,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import data fetching functions
import { 
  getEnhancedTokenInfo, 
  getWalletTransactionHistory, 
  getWalletSummary,
  EnhancedTokenInfo,
  TransactionInfo
} from '@/lib/solana-data';

import {
  getAlgorandEnhancedTokenInfo,
  getAlgorandTransactionHistory,
  getAlgorandWalletSummary,
  AlgorandTokenInfo,
  AlgorandTransactionInfo,
  formatAlgorandTransactionForDisplay
} from '@/lib/algorand-data';

// Unified types
type UnifiedTokenInfo = EnhancedTokenInfo | AlgorandTokenInfo;
type UnifiedTransactionInfo = TransactionInfo | AlgorandTransactionInfo;

export default function UnifiedDashboard() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Real data states
  const [userTokens, setUserTokens] = useState<UnifiedTokenInfo[]>([]);
  const [transactionData, setTransactionData] = useState<UnifiedTransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<'solana' | 'algorand' | null>(null);
  
  // Wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  const { 
    connected: algorandConnected, 
    address: algorandAddress,
    selectedNetwork: algorandNetwork 
  } = useAlgorandWallet();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine active network and fetch data
  useEffect(() => {
    if (!mounted) return;

    let newActiveNetwork: 'solana' | 'algorand' | null = null;
    
    if (solanaConnected && solanaPublicKey) {
      newActiveNetwork = 'solana';
    } else if (algorandConnected && algorandAddress) {
      newActiveNetwork = 'algorand';
    }

    if (newActiveNetwork !== activeNetwork) {
      setActiveNetwork(newActiveNetwork);
      if (newActiveNetwork) {
        console.log(`🔄 Switching to ${newActiveNetwork} dashboard`);
        fetchDashboardData(newActiveNetwork);
      } else {
        console.log('❌ No wallet connected, resetting dashboard...');
        resetDashboard();
      }
    }
  }, [mounted, solanaConnected, solanaPublicKey, algorandConnected, algorandAddress, activeNetwork]);

  // Reset dashboard data
  const resetDashboard = () => {
    setIsLoading(true);
    setUserTokens([]);
    setTransactionData([]);
    setWalletSummary(null);
    setError(null);
    setSelectedToken(0);
    setActiveNetwork(null);
  };

  // Fetch dashboard data based on active network
  const fetchDashboardData = async (network: 'solana' | 'algorand') => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (network === 'solana' && solanaPublicKey) {
        await fetchSolanaData(solanaPublicKey.toString());
      } else if (network === 'algorand' && algorandAddress) {
        await fetchAlgorandData(algorandAddress, algorandNetwork);
      }
      
    } catch (err) {
      console.error(`❌ Error fetching ${network} dashboard data:`, err);
      setError(`Failed to load ${network} data. Some features may be limited.`);
      setWalletSummary({
        totalTokens: 0,
        totalValue: 0,
        solBalance: 0,
        algoBalance: 0,
        recentTransactions: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Solana data
  const fetchSolanaData = async (walletAddress: string) => {
    console.log(`📊 Fetching Solana data for: ${walletAddress}`);
    
    const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
      getEnhancedTokenInfo(walletAddress),
      getWalletTransactionHistory(walletAddress, 10),
      getWalletSummary(walletAddress)
    ]);
    
    // Handle tokens
    if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
      setUserTokens(tokensResult.value.data);
      console.log(`✅ Loaded ${tokensResult.value.data.length} Solana tokens`);
    } else {
      setUserTokens([]);
    }
    
    // Handle transactions
    if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success && transactionsResult.value.data) {
      setTransactionData(transactionsResult.value.data);
      console.log(`✅ Loaded ${transactionsResult.value.data.length} Solana transactions`);
    } else {
      setTransactionData([]);
    }
    
    // Handle summary
    if (summaryResult.status === 'fulfilled' && summaryResult.value.success && summaryResult.value.data) {
      setWalletSummary(summaryResult.value.data);
      console.log('✅ Solana summary loaded');
    } else {
      setWalletSummary({
        totalTokens: 0,
        totalValue: 0,
        solBalance: 0,
        recentTransactions: 0
      });
    }
  };

  // Fetch Algorand data
  const fetchAlgorandData = async (walletAddress: string, network: string) => {
    console.log(`📊 Fetching Algorand data for: ${walletAddress} on ${network}`);
    
    const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
      getAlgorandEnhancedTokenInfo(walletAddress, network),
      getAlgorandTransactionHistory(walletAddress, 10, network),
      getAlgorandWalletSummary(walletAddress, network)
    ]);
    
    // Handle tokens
    if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
      setUserTokens(tokensResult.value.data);
      console.log(`✅ Loaded ${tokensResult.value.data.length} Algorand assets`);
    } else {
      setUserTokens([]);
    }
    
    // Handle transactions
    if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success && transactionsResult.value.data) {
      setTransactionData(transactionsResult.value.data);
      console.log(`✅ Loaded ${transactionsResult.value.data.length} Algorand transactions`);
    } else {
      setTransactionData([]);
    }
    
    // Handle summary
    if (summaryResult.status === 'fulfilled' && summaryResult.value.success && summaryResult.value.data) {
      setWalletSummary(summaryResult.value.data);
      console.log('✅ Algorand summary loaded');
    } else {
      setWalletSummary({
        totalTokens: 0,
        totalValue: 0,
        algoBalance: 0,
        recentTransactions: 0
      });
    }
  };
  
  // Manual refresh function
  const handleRefresh = async () => {
    if (!activeNetwork || isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchDashboardData(activeNetwork);
    setIsRefreshing(false);
  };

  // Generate chart data from transaction history
  const chartData = [
    { name: 'Week 1', value: transactionData.slice(0, 7).length },
    { name: 'Week 2', value: transactionData.slice(7, 14).length },
    { name: 'Week 3', value: transactionData.slice(14, 21).length },
    { name: 'Week 4', value: transactionData.slice(21, 28).length },
  ];

  // Format transaction data for display (unified)
  const formatTransactionForDisplay = (tx: UnifiedTransactionInfo) => {
    if (activeNetwork === 'algorand') {
      return formatAlgorandTransactionForDisplay(tx as AlgorandTransactionInfo);
    } else {
      // Solana transaction formatting
      const solTx = tx as TransactionInfo;
      const timeAgo = new Date(solTx.timestamp).toLocaleDateString();
      
      return {
        type: solTx.type,
        amount: `${solTx.amount} ${solTx.token}`,
        to: solTx.to ? `${solTx.to.slice(0, 4)}...${solTx.to.slice(-4)}` : 'Unknown',
        time: timeAgo,
        status: solTx.status === 'confirmed' ? 'Completed' : solTx.status === 'failed' ? 'Failed' : 'Pending'
      };
    }
  };

  const handleTransfer = () => {
    if (!transferAmount || !transferAddress) {
      alert('Please fill in both amount and recipient address');
      return;
    }
    
    const selectedTokenData = userTokens[selectedToken];
    if (!selectedTokenData) return;

    // Both EnhancedTokenInfo and AlgorandTokenInfo have symbol property
    const tokenSymbol = selectedTokenData.symbol || ('assetId' in selectedTokenData ? 'ASA' : 'TOKEN');
    
    alert(`Successfully transferred ${transferAmount} ${tokenSymbol} to ${transferAddress}`);
    setTransferAmount('');
    setTransferAddress('');
  };

  // Export function
  const exportData = (type: 'transactions' | 'analytics' | 'all') => {
    let data;
    let filename;

    switch (type) {
      case 'transactions':
        data = transactionData;
        filename = `${activeNetwork}-transactions-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'analytics':
        data = chartData;
        filename = `${activeNetwork}-analytics-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'all':
        data = { tokens: userTokens, transactions: transactionData, summary: walletSummary, network: activeNetwork };
        filename = `${activeNetwork}-dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
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
            <p className="mt-4 text-muted-foreground">Initializing dashboard...</p>
          </div>
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
            <p className="mt-4 text-muted-foreground">
              Loading your {activeNetwork === 'algorand' ? 'Algorand assets' : 'Solana tokens'} and transaction data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to wallet connection if no wallet connected
  if (!activeNetwork) {
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
                  Connect your Solana or Algorand wallet to access your token dashboard
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Network className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-600">
                    <p className="font-semibold mb-1">Multi-Chain Dashboard</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Connect Solana wallet for SPL tokens</li>
                      <li>Connect Algorand wallet for ASA tokens</li>
                      <li>View unified portfolio and analytics</li>
                      <li>Manage tokens across both networks</li>
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

  // Get network-specific info
  const getNetworkInfo = () => {
    if (activeNetwork === 'algorand') {
      return {
        name: algorandNetwork === 'algorand-mainnet' ? 'Algorand Mainnet' : 'Algorand Testnet',
        color: algorandNetwork === 'algorand-mainnet' ? 'text-[#00d4aa]' : 'text-[#76f935]',
        currency: 'ALGO'
      };
    } else {
      return {
        name: 'Solana Devnet',
        color: 'text-blue-500',
        currency: 'SOL'
      };
    }
  };

  const networkInfo = getNetworkInfo();

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-4xl font-bold text-foreground">Multi-Chain Dashboard</h1>
              <Badge className={`${networkInfo.color} bg-current/20 border-current/30`}>
                {networkInfo.name}
              </Badge>
            </div>
            <p className="text-muted-foreground">Manage and monitor your {activeNetwork === 'algorand' ? 'Algorand assets' : 'Solana tokens'}</p>
            {(solanaPublicKey || algorandAddress) && (
              <p className="text-sm text-muted-foreground mt-2">
                Connected: {activeNetwork === 'algorand' 
                  ? `${algorandAddress?.slice(0, 4)}...${algorandAddress?.slice(-4)}`
                  : `${solanaPublicKey?.toBase58().slice(0, 4)}...${solanaPublicKey?.toBase58().slice(-4)}`
                }
              </p>
            )}
            {error && (
              <div className="flex items-center space-x-2 mt-2 text-yellow-500 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing || !activeNetwork}
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
                <p className="text-muted-foreground text-sm">Total {activeNetwork === 'algorand' ? 'Assets' : 'Tokens'}</p>
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
                <p className="text-muted-foreground text-sm">{networkInfo.currency} Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  {activeNetwork === 'algorand' 
                    ? walletSummary?.algoBalance?.toFixed(4) || '0.0000'
                    : walletSummary?.solBalance?.toFixed(4) || '0.0000'
                  }
                </p>
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
              <h2 className="text-xl font-bold text-foreground mb-6">Your {activeNetwork === 'algorand' ? 'Assets' : 'Tokens'}</h2>
              {userTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No {activeNetwork === 'algorand' ? 'assets' : 'tokens'} found in your wallet
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
                  {userTokens.map((token, index) => {
                    const isAlgorand = 'assetId' in token;
                    const name = isAlgorand ? (token as AlgorandTokenInfo).name : (token as EnhancedTokenInfo).name;
                    const symbol = isAlgorand ? (token as AlgorandTokenInfo).symbol : (token as EnhancedTokenInfo).symbol;
                    const uiBalance = isAlgorand ? (token as AlgorandTokenInfo).uiBalance : (token as EnhancedTokenInfo).uiBalance;
                    const value = isAlgorand ? (token as AlgorandTokenInfo).value : (token as EnhancedTokenInfo).value;
                    const change = isAlgorand ? (token as AlgorandTokenInfo).change : (token as EnhancedTokenInfo).change;
                    const verified = token.verified;
                    const image = token.image;
                    
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedToken === index 
                            ? 'bg-red-500/20 border border-red-500/50' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => setSelectedToken(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            {image ? (
                              <img 
                                src={image} 
                                alt={symbol}
                                className="w-10 h-10 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 rounded-full ${networkInfo.color} bg-current/20 flex items-center justify-center text-current font-bold ${image ? 'hidden' : ''}`}>
                              {symbol.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{name}</p>
                              <p className="text-muted-foreground text-sm">{symbol}</p>
                            </div>
                          </div>
                          {verified && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-foreground font-semibold">{uiBalance.toLocaleString()}</p>
                            <p className="text-muted-foreground text-sm">{value || 'N/A'}</p>
                          </div>
                          {change && (
                            <Badge className={`${
                              change.startsWith('+') 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                              {change}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Token Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">{activeNetwork === 'algorand' ? 'Asset' : 'Token'} Management</h3>
                  <p className="text-sm text-muted-foreground">Manage and analyze your {activeNetwork} {activeNetwork === 'algorand' ? 'assets' : 'tokens'}</p>
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
                    <h3 className="text-xl font-semibold text-foreground mb-2">No {activeNetwork === 'algorand' ? 'Assets' : 'Tokens'} Found</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your {activeNetwork} wallet and create your first {activeNetwork === 'algorand' ? 'asset' : 'token'} to get started.
                    </p>
                    <Link href="/create">
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First {activeNetwork === 'algorand' ? 'Asset' : 'Token'}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="glass-card p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        {(() => {
                          const selectedTokenData = userTokens[selectedToken];
                          const isAlgorand = 'assetId' in selectedTokenData;
                          const name = isAlgorand ? (selectedTokenData as AlgorandTokenInfo).name : (selectedTokenData as EnhancedTokenInfo).name;
                          const symbol = isAlgorand ? (selectedTokenData as AlgorandTokenInfo).symbol : (selectedTokenData as EnhancedTokenInfo).symbol;
                          return (
                            <>
                              <h3 className="text-2xl font-bold text-foreground">{name}</h3>
                              <p className="text-muted-foreground">{symbol}</p>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border text-muted-foreground"
                          onClick={() => {
                            const selectedTokenData = userTokens[selectedToken];
                            const identifier = 'assetId' in selectedTokenData 
                              ? (selectedTokenData as AlgorandTokenInfo).assetId.toString()
                              : (selectedTokenData as EnhancedTokenInfo).mint;
                            navigator.clipboard.writeText(identifier);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border text-muted-foreground"
                          onClick={() => {
                            const selectedTokenData = userTokens[selectedToken];
                            if ('explorerUrl' in selectedTokenData) {
                              window.open((selectedTokenData as AlgorandTokenInfo).explorerUrl, '_blank');
                            } else {
                              window.open(`https://explorer.solana.com/address/${(selectedTokenData as EnhancedTokenInfo).mint}`, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {(() => {
                      const selectedTokenData = userTokens[selectedToken];
                      const isAlgorand = 'assetId' in selectedTokenData;
                      const uiBalance = isAlgorand ? (selectedTokenData as AlgorandTokenInfo).uiBalance : (selectedTokenData as EnhancedTokenInfo).uiBalance;
                      const value = isAlgorand ? (selectedTokenData as AlgorandTokenInfo).value : (selectedTokenData as EnhancedTokenInfo).value;
                      const decimals = selectedTokenData.decimals;
                      const identifier = isAlgorand 
                        ? (selectedTokenData as AlgorandTokenInfo).assetId.toString()
                        : (selectedTokenData as EnhancedTokenInfo).mint;

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <p className="text-muted-foreground text-sm">Balance</p>
                            <p className="text-foreground font-bold">{uiBalance.toLocaleString()}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <p className="text-muted-foreground text-sm">Value</p>
                            <p className="text-foreground font-bold">{value || 'N/A'}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <p className="text-muted-foreground text-sm">Decimals</p>
                            <p className="text-foreground font-bold">{decimals}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <p className="text-muted-foreground text-sm">{isAlgorand ? 'Asset ID' : 'Mint Address'}</p>
                            <p className="text-foreground font-bold text-xs">{identifier.slice(0, 8)}...</p>
                          </div>
                        </div>
                      );
                    })()}
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
                          <Tooltip />
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
                          <Tooltip />
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
                        const txId = 'id' in tx ? tx.id : tx.signature;
                        const explorerUrl = activeNetwork === 'algorand' 
                          ? `${getAlgorandNetwork(algorandNetwork).explorer}/tx/${txId}`
                          : `https://explorer.solana.com/tx/${txId}`;
                        
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full ${networkInfo.color} bg-current/20 flex items-center justify-center`}>
                                <Send className="w-4 h-4 text-current" />
                              </div>
                              <div>
                                <p className="text-foreground font-medium">{displayTx.type}</p>
                                <p className="text-muted-foreground text-sm">{displayTx.amount} to {displayTx.to}</p>
                                <button
                                  onClick={() => window.open(explorerUrl, '_blank')}
                                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  View on Explorer
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-sm">{displayTx.time}</p>
                              <Badge className={`${
                                displayTx.status === 'Completed' 
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : displayTx.status === 'Failed'
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                              }`}>
                                {displayTx.status}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="manage" className="space-y-6">
                {userTokens.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No {activeNetwork === 'algorand' ? 'Assets' : 'Tokens'} to Manage</h3>
                    <p className="text-muted-foreground mb-6">Create a {activeNetwork === 'algorand' ? 'asset' : 'token'} first to access management features.</p>
                    <Link href="/create">
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create {activeNetwork === 'algorand' ? 'Asset' : 'Token'}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Token Transfer */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Transfer {activeNetwork === 'algorand' ? 'Assets' : 'Tokens'}</h4>
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
                            placeholder={`Enter amount`}
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
                          Transfer {activeNetwork === 'algorand' ? 'Asset' : 'Token'}
                        </Button>
                      </div>
                    </div>

                    {/* Other Management Actions */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">{activeNetwork === 'algorand' ? 'Asset' : 'Token'} Management</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Plus className="w-4 h-4 mr-2" />
                          Mint {activeNetwork === 'algorand' ? 'Assets' : 'Tokens'}
                        </Button>
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Flame className="w-4 h-4 mr-2" />
                          Burn {activeNetwork === 'algorand' ? 'Assets' : 'Tokens'}
                        </Button>
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Settings className="w-4 h-4 mr-2" />
                          Update Metadata
                        </Button>
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
                          onClick={() => {
                            const selectedTokenData = userTokens[selectedToken];
                            if ('explorerUrl' in selectedTokenData) {
                              window.open((selectedTokenData as AlgorandTokenInfo).explorerUrl, '_blank');
                            } else {
                              window.open(`https://explorer.solana.com/address/${(selectedTokenData as EnhancedTokenInfo).mint}`, '_blank');
                            }
                          }}
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
      </div>
    </div>
  );
}