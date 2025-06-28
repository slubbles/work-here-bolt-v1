'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
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
  Check,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  getAlgorandEnhancedTokenInfo,
  getAlgorandTransactionHistory,
  getAlgorandWalletSummary,
  AlgorandTokenInfo,
  AlgorandTransactionInfo,
  formatAlgorandTransactionForDisplay
} from '@/lib/algorand-data';

export default function AlgorandDashboard() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Real data states
  const [userTokens, setUserTokens] = useState<AlgorandTokenInfo[]>([]);
  const [transactionData, setTransactionData] = useState<AlgorandTransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Add mounted state for hydration
  const [mounted, setMounted] = useState(false);
  
  // Algorand wallet integration
  const { 
    connected: algorandConnected, 
    address: algorandAddress,
    selectedNetwork: algorandNetwork,
    networkConfig: algorandNetworkConfig
  } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real data when wallet connects
  useEffect(() => {
    if (algorandConnected && algorandAddress) {
      console.log('🔄 Algorand wallet connected, fetching real data...');
      fetchDashboardData();
    } else {
      console.log('❌ Algorand wallet disconnected, resetting dashboard...');
      setIsLoading(true);
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      setError(null);
      setSelectedToken(0);
    }
  }, [algorandConnected, algorandAddress, algorandNetwork]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!algorandAddress) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const walletAddress = algorandAddress;
      console.log(`📊 Fetching Algorand dashboard data for: ${walletAddress} on ${algorandNetwork}`);
      
      // Show immediate loading feedback
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      
      // Fetch Algorand data
      const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
        getAlgorandEnhancedTokenInfo(walletAddress, algorandNetwork),
        getAlgorandTransactionHistory(walletAddress, 10, algorandNetwork),
        getAlgorandWalletSummary(walletAddress, algorandNetwork)
      ]);
      
      // Handle tokens data
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
        setUserTokens(tokensResult.value.data);
        console.log(`✅ Loaded ${tokensResult.value.data.length} Algorand assets`);
      } else {
        console.warn('⚠️ Failed to load Algorand assets');
        setUserTokens([]);
      }
      
      // Handle transactions data
      if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success && transactionsResult.value.data) {
        setTransactionData(transactionsResult.value.data);
        console.log(`✅ Loaded ${transactionsResult.value.data.length} Algorand transactions`);
      } else {
        console.warn('⚠️ Failed to load Algorand transactions');
        setTransactionData([]);
      }
      
      // Handle summary data
      if (summaryResult.status === 'fulfilled' && summaryResult.value.success && summaryResult.value.data) {
        setWalletSummary(summaryResult.value.data);
        console.log('✅ Algorand wallet summary loaded');
      } else {
        console.warn('⚠️ Failed to load Algorand wallet summary');
        setWalletSummary({
          totalTokens: 0,
          totalValue: 0,
          algoBalance: 0,
          recentTransactions: 0
        });
      }
      
    } catch (err) {
      console.error('❌ Error fetching Algorand dashboard data:', err);
      setError('Failed to load some dashboard data. Some features may be limited.');
      
      // Set default values even on error
      setWalletSummary({
        totalTokens: 0,
        totalValue: 0,
        algoBalance: 0,
        recentTransactions: 0
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manual refresh function
  const handleRefresh = async () => {
    if (!algorandConnected || !algorandAddress || isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Generate chart data from transaction history
  const chartData = [
    { name: 'Week 1', value: transactionData.slice(0, 7).length },
    { name: 'Week 2', value: transactionData.slice(7, 14).length },
    { name: 'Week 3', value: transactionData.slice(14, 21).length },
    { name: 'Week 4', value: transactionData.slice(21, 28).length },
  ];

  // Format transaction data for display
  const formatTransactionForDisplay = (tx: AlgorandTransactionInfo) => {
    return formatAlgorandTransactionForDisplay(tx);
  };

  const handleTransfer = () => {
    if (!transferAmount || !transferAddress) {
      alert('Please fill in both amount and recipient address');
      return;
    }
    
    const selectedTokenData = userTokens[selectedToken];
    if (!selectedTokenData) return;

    const tokenSymbol = selectedTokenData.symbol || 'ASA';
    
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
        filename = `algorand-transactions-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'analytics':
        data = chartData;
        filename = `algorand-analytics-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'all':
        data = { tokens: userTokens, transactions: transactionData, summary: walletSummary, network: algorandNetwork };
        filename = `algorand-dashboard-data-${new Date().toISOString().split('T')[0]}.json`;
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

  const copyToClipboard = async (address: string, walletType: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      
      alert(`${walletType} address copied to clipboard`);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading Algorand dashboard...</p>
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
              Loading your Algorand assets and transaction data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to wallet connection if not connected
  if (!algorandConnected) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Card className="glass-card border-orange-500/30 bg-orange-500/5">
            <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-red-500" />
            </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Algorand Wallet Required</h2>
                <p className="text-muted-foreground">
                  Connect your Algorand wallet to access your asset dashboard
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-600">
                    <p className="font-semibold mb-1">To access your Algorand dashboard:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Click "Connect Wallet" in the top right</li>
                      <li>Select your Algorand wallet (Pera Wallet)</li>
                      <li>Choose Mainnet or Testnet network</li>
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

  // Get network display info
  const getNetworkInfo = () => {
    if (algorandNetworkConfig?.isMainnet) {
      return {
        name: 'Algorand Mainnet',
        color: 'text-[#00d4aa]',
        currency: 'ALGO'
      };
    } else {
      return {
        name: 'Algorand Testnet',
        color: 'text-[#76f935]',
        currency: 'ALGO'
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
              <h1 className="text-4xl font-bold text-foreground">Algorand Dashboard</h1>
              <Badge className={`${networkInfo.color} bg-current/20 border-current/30`}>
                {networkInfo.name}
              </Badge>
            </div>
            <p className="text-muted-foreground">Manage and monitor your Algorand Standard Assets</p>
            {algorandAddress && (
              <div className="flex items-center space-x-2 mt-2">
                <p className="text-sm text-muted-foreground">
                  Connected: {formatAddress(algorandAddress)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(algorandAddress, 'Algorand')}
                  className="p-1 h-auto"
                  title="Copy full address"
                >
                  {copiedAddress === algorandAddress ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3 text-[#76f935]" />
                  )}
                </Button>
              </div>
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
              disabled={isRefreshing || !algorandConnected}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Link href="/create">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Asset
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
                  {walletSummary?.algoBalance?.toFixed(4) || '0.0000'}
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
          {/* Asset List */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Your Assets</h2>
              {userTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No assets found in your Algorand wallet
                  </p>
                  <Link href="/create">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Asset
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
                      onClick={() => setSelectedToken(index)}
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
                          <div className={`w-10 h-10 rounded-full ${networkInfo.color} bg-current/20 flex items-center justify-center text-current font-bold ${token.image ? 'hidden' : ''}`}>
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
                          <p className="text-muted-foreground text-sm">{token.value || 'N/A'}</p>
                        </div>
                        {token.change && (
                          <Badge className={`${
                            token.change.startsWith('+') 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {token.change}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Asset Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Asset Management</h3>
                  <p className="text-sm text-muted-foreground">Manage and analyze your Algorand assets</p>
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
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Assets Found</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your Algorand wallet and create your first asset to get started.
                    </p>
                    <Link href="/create">
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Asset
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
                          onClick={() => {
                            const selectedTokenData = userTokens[selectedToken];
                            const identifier = selectedTokenData.assetId.toString();
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
                            window.open(selectedTokenData.explorerUrl, '_blank');
                          }}
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
                        <p className="text-muted-foreground text-sm">Asset ID</p>
                        <p className="text-foreground font-bold text-xs">{userTokens[selectedToken].assetId}</p>
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
                        const explorerUrl = `${algorandNetworkConfig?.explorer}/tx/${tx.id}`;
                        
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
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Assets to Manage</h3>
                    <p className="text-muted-foreground mb-6">Create an asset first to access management features.</p>
                    <Link href="/create">
                      <Button className="bg-red-500 hover:bg-red-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Asset
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Asset Transfer */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Transfer Assets</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="transferAddress" className="text-foreground font-medium">Recipient Address</Label>
                          <Input
                            id="transferAddress"
                            placeholder="Enter Algorand wallet address"
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
                            placeholder="Enter amount"
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
                          Transfer Asset
                        </Button>
                      </div>
                    </div>

                    {/* Other Management Actions */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Asset Management</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Plus className="w-4 h-4 mr-2" />
                          Mint Assets
                        </Button>
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Flame className="w-4 h-4 mr-2" />
                          Burn Assets
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
                            window.open(selectedTokenData.explorerUrl, '_blank');
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