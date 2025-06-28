'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { 
  Coins, 
  Send, 
  Plus,
  RefreshCw,
  ArrowRight, 
  ExternalLink, 
  Download,
  Info,
  AlertTriangle,
  Check,
  TrendingUp,
  Clock,
  BarChart3,
  Activity,
  Copy,
  CheckCircle,
  Search,
  Wallet,
  Eye,
  Menu,
  Diamond,
  DollarSign,
  QrCode
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
import { getAlgorandNetwork } from '@/lib/algorand';
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
  
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [optInAssetId, setOptInAssetId] = useState('');
  const [optInStatus, setOptInStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [optInMessage, setOptInMessage] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');

  const { 
    connected,
    address,
    signTransaction,
    selectedNetwork,
    balance,
    networkConfig
  } = useAlgorandWallet();
  
  const { toast } = useToast();
  
  // For analytics
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

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
        getAlgorandTransactionHistory(address, 20, selectedNetwork),
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

  // Generate chart data
  const chartData = [
    { name: 'Mon', value: 3 + Math.floor(Math.random() * 5) },
    { name: 'Tue', value: 2 + Math.floor(Math.random() * 5) },
    { name: 'Wed', value: 5 + Math.floor(Math.random() * 5) },
    { name: 'Thu', value: 3 + Math.floor(Math.random() * 5) },
    { name: 'Fri', value: 4 + Math.floor(Math.random() * 5) },
    { name: 'Sat', value: 2 + Math.floor(Math.random() * 5) },
    { name: 'Sun', value: 6 + Math.floor(Math.random() * 5) },
  ];

  // Generate pie chart data
  const pieData = [
    { name: 'ALGO', value: 65 },
    { name: 'Tokens', value: 35 },
  ];
  
  const pieColors = ['#76f935', '#43A6F6'];
  
  // Balance history (simulated)
  const balanceHistory = [
    { date: 'Jun 1', balance: 10.2 },
    { date: 'Jun 8', balance: 11.5 },
    { date: 'Jun 15', balance: 10.8 },
    { date: 'Jun 22', balance: 12.4 },
    { date: 'Jun 29', balance: 12.45 },
  ];
  
  // Handle opt-in to an asset
  const handleOptIn = async () => {
    if (!connected || !address || !signTransaction || !optInAssetId) {
      toast({
        title: "Unable to opt-in",
        description: "Please connect your wallet and enter a valid Asset ID.",
        variant: "destructive"
      });
      return;
    }
    
    const assetId = parseInt(optInAssetId);
    if (isNaN(assetId)) {
      toast({
        title: "Invalid Asset ID",
        description: "Please enter a valid numeric Asset ID.",
        variant: "destructive"
      });
      return;
    }
    
    setIsOptingIn(true);
    setOptInStatus('loading');
    setOptInMessage('Processing your opt-in request...');
    
    try {
      toast({
        title: "Opt-in initiated",
        description: "Please confirm the transaction in your wallet.",
      });
      
      const result = await optInToAsset(address, assetId, signTransaction, selectedNetwork);
      
      if (result.success) {
        setOptInStatus('success');
        setOptInMessage('Successfully opted in! You can now receive this token.');
        
        toast({
          title: "Successfully opted in!",
          description: "You can now receive this token. Refreshing asset list...",
        });
        
        // Refresh the whole dashboard to get the updated asset list
        setTimeout(() => handleRefresh(), 2000);
      } else {
        setOptInStatus('error');
        setOptInMessage(result.error || "Unknown error occurred.");
        
        toast({
          title: "Opt-in failed",
          description: result.error || "Unknown error occurred.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Opt-in error:', error);
      setOptInStatus('error');
      setOptInMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
      
      toast({
        title: "Opt-in failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsOptingIn(false);
    }
  };

  // Handle send token
  const handleSendToken = () => {
    if (!selectedAsset) {
      toast({
        title: "No asset selected",
        description: "Please select an asset to send.",
        variant: "destructive"
      });
      return;
    }
    
    if (!sendAddress || !sendAmount) {
      toast({
        title: "Missing information",
        description: "Please enter both a recipient address and amount.",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Send feature coming soon",
      description: `This would send ${sendAmount} ${selectedAsset.symbol} to ${sendAddress.slice(0, 8)}...`,
    });
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description
        });
      },
      () => {
        toast({
          title: "Failed to copy",
          description: "Please try again or copy manually.",
          variant: "destructive"
        });
      }
    );
  };

  // Format ALGO balance for display
  const formatAlgoBalance = (balance: number | undefined) => {
    if (balance === undefined) return '0.0000';
    return balance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with breadcrumb */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#76f935] to-[#00d4aa] flex items-center justify-center text-white font-bold mr-3 shadow-lg">
                A
              </div>
              Algorand Dashboard
            </h1>
            <div className="flex items-center space-x-2 text-muted-foreground text-sm">
              <p>Manage your Algorand assets and monitor activity</p>
              {connected && (
                <Badge variant="outline" className="text-xs border-[#76f935]/40 bg-[#76f935]/5 text-[#76f935]">
                  {networkConfig?.isMainnet ? 'Mainnet' : 'Testnet'}
                </Badge>
              )}
            </div>
            {address && (
              <div className="flex items-center mt-2 space-x-2 text-sm text-muted-foreground">
                <p className="font-mono">{address.slice(0, 8)}...{address.slice(-8)}</p>
                <button 
                  onClick={() => copyToClipboard(address, "Address copied to clipboard")}
                  className="text-[#76f935] hover:text-[#5dd128] transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing || !connected}
              className="border-border text-muted-foreground hover:bg-muted h-10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Link href="/create">
              <Button className="bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white shadow-lg h-10">
                <Plus className="w-4 h-4 mr-2" />
                Create New Token
              </Button>
            </Link>
          </div>
        </div>

        {/* Error messages */}
        {error && (
          <Alert className="mb-6 border-red-500/30 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Stats Overview - Full Width */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
            <Card className="glass-card border-[#76f935]/20 hover:border-[#76f935]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Assets</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {walletSummary?.totalTokens || userTokens.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {userTokens.length > 0 ? 'Active in wallet' : 'No assets'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#76f935]/10 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-[#76f935]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-[#76f935]/20 hover:border-[#76f935]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Value</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      ${walletSummary?.totalValue?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Combined portfolio value
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#76f935]/10 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#76f935]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-[#76f935]/20 hover:border-[#76f935]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">ALGO Balance</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {formatAlgoBalance(walletSummary?.algoBalance || balance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Native ALGO tokens
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#76f935]/10 flex items-center justify-center">
                    <div className="text-[#76f935] font-bold text-lg">A</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="glass-card border-[#76f935]/20 hover:border-[#76f935]/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Transactions</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {walletSummary?.recentTransactions || transactionData.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recent activity
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#76f935]/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-[#76f935]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Left Column - Asset List */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Asset List */}
            <Card className="glass-card border-[#76f935]/20">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center space-x-2">
                    <Diamond className="w-5 h-5 text-[#76f935] mr-1" />
                    <span>Your Assets</span>
                    {userTokens.length > 0 && (
                      <Badge className="bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30 ml-2">
                        {userTokens.length}
                      </Badge>
                    )}
                  </CardTitle>
                  
                  {userTokens.length > 0 && (
                    <Button
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        // Toggle sort or filter menu
                        toast({
                          title: "Sort & Filter",
                          description: "This feature is coming soon!"
                        });
                      }}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <Menu className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/50 animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-muted"></div>
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-32 bg-muted rounded"></div>
                            <div className="h-3 w-16 bg-muted rounded"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userTokens.length > 0 ? (
                  <div>
                    {userTokens.map((token) => (
                      <div 
                        key={token.assetId}
                        className={`p-4 border-b border-border last:border-0 cursor-pointer transition-all hover:bg-muted/30 ${
                          selectedAsset?.assetId === token.assetId
                            ? 'bg-[#76f935]/10 border-l-4 border-l-[#76f935]' 
                            : 'border-l-4 border-l-transparent'
                        }`}
                        onClick={() => setSelectedAsset(token)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.symbol}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-[#76f935] to-[#5dd128] flex items-center justify-center text-white font-bold ${token.image ? 'hidden' : ''}`}>
                              {token.symbol.slice(0, 2)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-foreground font-medium truncate" title={token.name}>
                                  {token.name}
                                </p>
                                <p className="text-muted-foreground text-sm flex items-center">
                                  <span className="font-semibold">{token.symbol}</span>
                                  {token.verified && (
                                    <CheckCircle className="w-3 h-3 text-[#76f935] ml-1" />
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-foreground font-semibold">{token.uiBalance.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{token.value || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 px-6">
                    <div className="w-16 h-16 rounded-full bg-[#76f935]/10 flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-8 h-8 text-[#76f935]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Assets Found</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                      Create your first token or opt-in to existing assets to get started.
                    </p>
                    <div className="space-y-3">
                      <Link href="/create">
                        <Button className="bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white shadow-md w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Your First Token
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full" onClick={() => document.getElementById('opt-in-section')?.scrollIntoView({ behavior: 'smooth' })}>
                        <Eye className="w-4 h-4 mr-2" />
                        Opt-in to Existing Asset
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Opt-in Card */}
            <Card className="glass-card border-[#76f935]/20" id="opt-in-section">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center">
                  <QrCode className="w-5 h-5 text-[#76f935] mr-2" />
                  Asset Opt-in
                </CardTitle>
                <CardDescription>
                  You must opt-in to each Algorand asset before receiving it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Enter Asset ID (e.g., 3094943583)" 
                    value={optInAssetId}
                    onChange={(e) => setOptInAssetId(e.target.value)}
                    className="bg-muted/50"
                  />
                  <Button 
                    onClick={handleOptIn}
                    disabled={isOptingIn || !optInAssetId}
                    className="bg-[#76f935] hover:bg-[#5dd128] text-white shrink-0"
                  >
                    {isOptingIn ? (
                      <div className="flex items-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        <span>Opting In...</span>
                      </div>
                    ) : (
                      "Opt-in"
                    )}
                  </Button>
                </div>

                {optInStatus !== 'idle' && (
                  <Alert className={`
                    ${optInStatus === 'loading' ? 'border-blue-500/30 bg-blue-500/10' : ''}
                    ${optInStatus === 'success' ? 'border-green-500/30 bg-green-500/10' : ''}
                    ${optInStatus === 'error' ? 'border-red-500/30 bg-red-500/10' : ''}
                  `}>
                    {optInStatus === 'loading' && <Info className="h-4 w-4 text-blue-500" />}
                    {optInStatus === 'success' && <Check className="h-4 w-4 text-green-500" />}
                    {optInStatus === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <AlertDescription className={`
                      ${optInStatus === 'loading' ? 'text-blue-600' : ''}
                      ${optInStatus === 'success' ? 'text-green-600' : ''}
                      ${optInStatus === 'error' ? 'text-red-600' : ''}
                    `}>
                      {optInMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Portfolio Value Card */}
            <Card className="glass-card border-[#76f935]/20 hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center">
                  <Activity className="w-5 h-5 text-[#76f935] mr-2" />
                  Portfolio Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center space-x-6 mt-4">
                  {pieData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      <span className="text-sm text-muted-foreground">{entry.name} ({entry.value}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs and Details */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <Card className="glass-card border-[#76f935]/20">
                <CardContent className="pt-6">
                  <TabsList className="grid w-full grid-cols-4 bg-[#76f935]/10 border border-[#76f935]/20">
                    <TabsTrigger 
                      value="overview"
                      className="data-[state=active]:bg-[#76f935] data-[state=active]:text-black"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger 
                      value="transactions"
                      className="data-[state=active]:bg-[#76f935] data-[state=active]:text-black"
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Transactions
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics"
                      className="data-[state=active]:bg-[#76f935] data-[state=active]:text-black"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="manage"
                      className="data-[state=active]:bg-[#76f935] data-[state=active]:text-black"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      Manage
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                {selectedAsset ? (
                  <Card className="glass-card border-[#76f935]/20">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        {selectedAsset.image ? (
                          <img 
                            src={selectedAsset.image} 
                            alt={selectedAsset.symbol}
                            className="w-16 h-16 rounded-full object-cover border-2 border-[#76f935]/30"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#76f935] to-[#5dd128] flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-[#76f935]/30">
                            {selectedAsset.symbol.slice(0, 2)}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h2 className="text-2xl font-bold">{selectedAsset.name}</h2>
                            {selectedAsset.verified && (
                              <Badge className="bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30 ml-2">
                                <Check className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            <Badge variant="outline" className="mr-2 font-mono">
                              {selectedAsset.symbol}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Asset ID: {selectedAsset.assetId}
                            </span>
                            <button 
                              onClick={() => copyToClipboard(selectedAsset.assetId.toString(), "Asset ID copied!")}
                              className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <a 
                          href={selectedAsset.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="View on Explorer"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                          <p className="text-muted-foreground text-xs">Balance</p>
                          <p className="text-xl font-bold">{selectedAsset.uiBalance.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{selectedAsset.symbol}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                          <p className="text-muted-foreground text-xs">Value</p>
                          <p className="text-xl font-bold">{selectedAsset.value || 'N/A'}</p>
                          <p className="text-sm text-[#76f935]">{selectedAsset.change || '0.0%'}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                          <p className="text-muted-foreground text-xs">Decimals</p>
                          <p className="text-xl font-bold">{selectedAsset.decimals}</p>
                          <p className="text-sm text-muted-foreground">Precision</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg text-center">
                          <p className="text-muted-foreground text-xs">Network</p>
                          <p className="text-xl font-bold">{networkConfig?.isMainnet ? 'Mainnet' : 'Testnet'}</p>
                          <p className="text-sm text-muted-foreground">Algorand</p>
                        </div>
                      </div>
                      
                      {selectedAsset.description && (
                        <div className="p-4 bg-muted/20 rounded-lg border border-border">
                          <h4 className="text-sm font-medium mb-2">Description</h4>
                          <p className="text-muted-foreground text-sm">{selectedAsset.description}</p>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          variant="outline"
                          className="border-[#76f935]/30 text-[#76f935] hover:bg-[#76f935]/10"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                        <Button 
                          variant="outline"
                          className="border-border text-muted-foreground hover:bg-muted"
                          onClick={() => window.open(selectedAsset.explorerUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View on Explorer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="glass-card border-[#76f935]/20">
                    <CardContent className="p-8 text-center">
                      <div className="w-20 h-20 rounded-full bg-[#76f935]/10 flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-[#76f935]" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Select an Asset</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Choose an asset from the list on the left to view details, or create your first token to get started.
                      </p>
                      <Link href="/create">
                        <Button className="bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white shadow-md">
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Token
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
                
                {/* ALGO Balance Chart */}
                <Card className="glass-card border-[#76f935]/20">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-bold">ALGO Balance History</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={`h-7 px-2 text-xs ${timeRange === '7d' ? 'bg-[#76f935]/10 text-[#76f935]' : ''}`}
                          onClick={() => setTimeRange('7d')}
                        >
                          7D
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={`h-7 px-2 text-xs ${timeRange === '30d' ? 'bg-[#76f935]/10 text-[#76f935]' : ''}`}
                          onClick={() => setTimeRange('30d')}
                        >
                          30D
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={`h-7 px-2 text-xs ${timeRange === 'all' ? 'bg-[#76f935]/10 text-[#76f935]' : ''}`}
                          onClick={() => setTimeRange('all')}
                        >
                          ALL
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={balanceHistory}
                          margin={{
                            top: 5,
                            right: 20,
                            left: 0,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                          <XAxis 
                            dataKey="date" 
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
                          <Line
                            type="monotone"
                            dataKey="balance"
                            stroke="#76f935"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#76f935", stroke: "#76f935", strokeWidth: 1 }}
                            activeDot={{ r: 6, fill: "#5dd128", stroke: "white", strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-6 mt-0">
                <Card className="glass-card border-[#76f935]/20">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <Clock className="w-5 h-5 text-[#76f935] mr-2" />
                      Recent Transactions
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-[#76f935]/30 text-[#76f935] hover:bg-[#76f935]/10 text-xs"
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Export CSV
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="py-4 px-6 space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg animate-pulse">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-muted"></div>
                              <div className="space-y-2 flex-1">
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
                      <div className="divide-y divide-border">
                        {transactionData.map((tx, index) => {
                          const displayTx = formatAlgorandTransactionForDisplay(tx);
                          return (
                            <div key={tx.id || index} className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                                  ${displayTx.type.includes('Payment') ? 'bg-blue-500/20' : 'bg-[#76f935]/20'}`}>
                                  <Send className={`w-5 h-5 ${displayTx.type.includes('Payment') ? 'text-blue-500' : 'text-[#76f935]'}`} />
                                </div>
                                <div>
                                  <p className="text-foreground font-medium">{displayTx.type}</p>
                                  <div className="flex items-center">
                                    <p className="text-muted-foreground text-sm">{displayTx.amount}</p>
                                    <span className="mx-1 text-muted-foreground">•</span>
                                    <p className="text-muted-foreground text-sm">{displayTx.to}</p>
                                  </div>
                                  <a 
                                    href={`${networkConfig?.explorer}/tx/${tx.id}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-[#76f935] hover:text-[#5dd128] transition-colors flex items-center mt-1"
                                  >
                                    View on Explorer
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                  </a>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-muted-foreground text-sm">{displayTx.time}</p>
                                <Badge className={`mt-1 
                                  ${displayTx.status === 'Completed' 
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
                    ) : (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                          <Clock className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-foreground font-medium mb-2">No transactions yet</p>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          Your transaction history will appear here once you start using your wallet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Pending Transactions Info */}
                {transactionData.some(tx => tx.status === 'pending') && (
                  <Alert className="border-yellow-500/30 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-600 text-sm">
                      <div className="space-y-2">
                        <p className="font-medium">Pending Transactions</p>
                        <p>Transactions typically confirm in 3-5 seconds on Algorand. Click refresh to update status.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRefresh} 
                          className="text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/10 mt-1"
                        >
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Refresh Status
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-0">
                <Card className="glass-card border-[#76f935]/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center">
                      <TrendingUp className="w-5 h-5 text-[#76f935] mr-2" />
                      Transaction Activity
                    </CardTitle>
                    <CardDescription>Weekly transaction volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
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
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              border: '1px solid #76f935',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="#76f935"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="glass-card border-[#76f935]/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold">Balance Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={70}
                              paddingAngle={2}
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center space-x-6 mt-2">
                        {pieData.map((entry, index) => (
                          <div key={`legend-${index}`} className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: pieColors[index % pieColors.length] }}
                            />
                            <span className="text-sm text-muted-foreground">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass-card border-[#76f935]/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-bold">Monthly Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Transaction Count</span>
                          <span className="font-bold">{transactionData.length}</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full">
                          <div 
                            className="h-full bg-[#76f935] rounded-full" 
                            style={{ width: `${Math.min(100, transactionData.length * 5)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-muted-foreground">Asset Growth</span>
                          <span className="font-bold">{userTokens.length} / 10</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full">
                          <div 
                            className="h-full bg-[#76f935] rounded-full" 
                            style={{ width: `${Math.min(100, userTokens.length * 10)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-muted-foreground">ALGO Price Change</span>
                          <span className="font-bold text-green-500">+5.2%</span>
                        </div>
                        <div className="h-2 bg-muted/30 rounded-full">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: '65%' }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Manage Tab */}
              <TabsContent value="manage" className="space-y-6 mt-0">
                {selectedAsset ? (
                  <>
                    <Card className="glass-card border-[#76f935]/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center">
                          <Send className="w-5 h-5 text-[#76f935] mr-2" />
                          Send {selectedAsset.symbol}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Recipient Address</label>
                            <Input 
                              placeholder="Enter Algorand address"
                              value={sendAddress}
                              onChange={(e) => setSendAddress(e.target.value)}
                              className="bg-muted/30"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Amount</label>
                            <div className="relative">
                              <Input 
                                type="number"
                                placeholder="0.0"
                                value={sendAmount}
                                onChange={(e) => setSendAmount(e.target.value)}
                                className="bg-muted/30 pr-16"
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-muted-foreground">{selectedAsset.symbol}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            Balance: {selectedAsset.uiBalance.toLocaleString()} {selectedAsset.symbol}
                          </p>
                          <Button 
                            variant="link" 
                            size="sm"
                            className="text-xs text-[#76f935] h-auto p-0"
                            onClick={() => setSendAmount(selectedAsset.uiBalance.toString())}
                          >
                            Max
                          </Button>
                        </div>
                        <Button 
                          onClick={handleSendToken}
                          className="w-full bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send {selectedAsset.symbol}
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="glass-card border-[#76f935]/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-bold flex items-center">
                          <Info className="w-5 h-5 text-[#76f935] mr-2" />
                          Asset Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-muted-foreground">Asset ID</span>
                            <div className="flex items-center">
                              <span className="font-mono">{selectedAsset.assetId}</span>
                              <button 
                                onClick={() => copyToClipboard(selectedAsset.assetId.toString(), "Asset ID copied!")}
                                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-muted-foreground">Creator</span>
                            <div className="flex items-center">
                              <span className="font-mono">{selectedAsset.creator ? `${selectedAsset.creator.slice(0, 6)}...${selectedAsset.creator.slice(-4)}` : 'Unknown'}</span>
                              {selectedAsset.creator && (
                                <button 
                                  onClick={() => copyToClipboard(selectedAsset.creator!, "Creator address copied!")}
                                  className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-muted-foreground">Decimals</span>
                            <span>{selectedAsset.decimals}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-muted-foreground">Network</span>
                            <Badge className={networkConfig?.isMainnet 
                              ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
                              : 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30'
                            }>
                              {networkConfig?.isMainnet ? 'Mainnet' : 'Testnet'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          onClick={() => window.open(selectedAsset.explorerUrl, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Complete Details on Explorer
                        </Button>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="glass-card border-[#76f935]/20">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#76f935]/10 flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-8 h-8 text-[#76f935]" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Select an Asset to Manage</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Choose an asset from the list on the left to access management options.
                      </p>
                      
                      <Alert className="bg-blue-500/10 border-blue-500/30 text-left mt-8">
                        <Info className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-blue-600 text-sm">
                          <p className="font-medium mb-1">About Algorand Asset Management</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Use the opt-in feature to add new assets to your wallet</li>
                            <li>Send tokens to other Algorand addresses</li>
                            <li>Freeze or revoke tokens if you have the appropriate permissions</li>
                            <li>View detailed asset information on the blockchain explorer</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
                
                {/* Advanced Asset Options */}
                <Card className="glass-card border-[#76f935]/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold">Advanced Options</CardTitle>
                    <CardDescription>
                      Management features for token creators and managers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
                        <Plus className="w-4 h-4 mr-2" />
                        Mint Additional
                      </Button>
                      <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
                        <Info className="w-4 h-4 mr-2" />
                        Update Metadata
                      </Button>
                      <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Create Swap
                      </Button>
                    </div>
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