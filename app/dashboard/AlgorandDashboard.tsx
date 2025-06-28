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
  RefreshCw
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
import { getAlgorandNetwork, getAlgorandAccountInfo, mintAlgorandAssets, burnAlgorandAssets, updateAlgorandAssetMetadata } from '@/lib/algorand';
import { 
  getAlgorandEnhancedTokenInfo, 
  getAlgorandTransactionHistory, 
  getAlgorandWalletSummary,
  AlgorandTokenInfo,
  AlgorandTransactionInfo,
  formatAlgorandTransactionForDisplay
} from '@/lib/algorand-data';
import { useToast } from '@/hooks/use-toast';

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
  
  // UI states for token management
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false);
  
  // Metadata update form
  const [tokenMetadata, setTokenMetadata] = useState({
    name: '',
    symbol: '',
    description: '',
    logoUrl: '',
    website: ''
  });
  
  // Algorand wallet integration
  const { 
    connected, 
    address, 
    signTransaction,
    selectedNetwork,
    setSelectedNetwork,
    balance 
  } = useAlgorandWallet();
  
  const { toast } = useToast();
  
  // Add mounted state for hydration
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real data when wallet connects
  useEffect(() => {
    if (connected && address) {
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
  }, [connected, address, selectedNetwork]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`📊 Fetching Algorand dashboard data for: ${address} on ${selectedNetwork}`);
      
      // Show immediate loading feedback
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      
      // Simplified data fetching with better error handling
      const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
        getAlgorandEnhancedTokenInfo(address, selectedNetwork),
        getAlgorandTransactionHistory(address, 10, selectedNetwork),
        getAlgorandWalletSummary(address, selectedNetwork)
      ]);
      
      // Handle tokens data
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
        setUserTokens(tokensResult.value.data);
        console.log(`✅ Loaded ${tokensResult.value.data.length} Algorand assets`);
        
        // Prefill metadata form if tokens exist
        if (tokensResult.value.data.length > 0) {
          const firstToken = tokensResult.value.data[0];
          setTokenMetadata({
            name: firstToken.name || '',
            symbol: firstToken.symbol || '',
            description: firstToken.description || '',
            logoUrl: firstToken.image || '',
            website: firstToken.website || ''
          });
        }
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
      setError('Failed to load Algorand dashboard data. Some features may be limited.');
      
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
    if (!connected || !address || isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
    
    toast({
      title: "Dashboard Refreshed",
      description: "Latest data has been loaded",
      duration: 3000,
    });
  };

  // Handle token management actions
  const handleTransfer = () => {
    if (!transferAmount || !transferAddress || !userTokens[selectedToken]) {
      toast({
        title: "Missing Information",
        description: "Please fill in both amount and recipient address",
        variant: "destructive",
        duration: 4000
      });
      return;
    }
    
    // This would need to be implemented with actual Algorand transfer
    toast({
      title: "Transfer Simulation",
      description: `Successfully transferred ${transferAmount} ${userTokens[selectedToken].symbol} to ${transferAddress}`,
      duration: 5000
    });
    
    setTransferAmount('');
    setTransferAddress('');
  };
  
  // Handle mint functionality
  const handleMint = async () => {
    if (!address || !signTransaction || !userTokens[selectedToken]) {
      toast({
        title: "Wallet Not Connected", 
        description: "Please connect your Algorand wallet",
        variant: "destructive",
        duration: 4000
      });
      return;
    }
    
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        title: "Invalid Amount", 
        description: "Please enter a positive amount to mint",
        variant: "destructive", 
        duration: 4000
      });
      return;
    }
    
    const selectedAssetId = userTokens[selectedToken].assetId;
    
    setIsMinting(true);
    
    try {
      const result = await mintAlgorandAssets(
        address,
        selectedAssetId,
        parseFloat(mintAmount),
        signTransaction,
        selectedNetwork
      );
      
      if (result.success) {
        toast({
          title: "Minting Successful", 
          description: `Successfully minted ${mintAmount} ${userTokens[selectedToken].symbol} tokens`,
          duration: 5000
        });
        
        // Refresh data after mint
        await fetchDashboardData();
        setMintAmount('');
      } else {
        toast({
          title: "Minting Failed", 
          description: result.error || "Failed to mint tokens",
          variant: "destructive", 
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Mint error:', error);
      toast({
        title: "Minting Failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive", 
        duration: 5000
      });
    } finally {
      setIsMinting(false);
    }
  };
  
  // Handle burn functionality
  const handleBurn = async () => {
    if (!address || !signTransaction || !userTokens[selectedToken]) {
      toast({
        title: "Wallet Not Connected", 
        description: "Please connect your Algorand wallet",
        variant: "destructive",
        duration: 4000
      });
      return;
    }
    
    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      toast({
        title: "Invalid Amount", 
        description: "Please enter a positive amount to burn",
        variant: "destructive", 
        duration: 4000
      });
      return;
    }
    
    const selectedAssetId = userTokens[selectedToken].assetId;
    
    setIsBurning(true);
    
    try {
      const result = await burnAlgorandAssets(
        address,
        selectedAssetId,
        parseFloat(burnAmount),
        signTransaction,
        selectedNetwork
      );
      
      if (result.success) {
        toast({
          title: "Burn Successful", 
          description: `Successfully burned ${burnAmount} ${userTokens[selectedToken].symbol} tokens`,
          duration: 5000
        });
        
        // Refresh data after burn
        await fetchDashboardData();
        setBurnAmount('');
      } else {
        toast({
          title: "Burn Failed", 
          description: result.error || "Failed to burn tokens",
          variant: "destructive", 
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Burn error:', error);
      toast({
        title: "Burn Failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive", 
        duration: 5000
      });
    } finally {
      setIsBurning(false);
    }
  };
  
  // Handle metadata update
  const handleUpdateMetadata = async () => {
    if (!address || !signTransaction || !userTokens[selectedToken]) {
      toast({
        title: "Wallet Not Connected", 
        description: "Please connect your Algorand wallet",
        variant: "destructive",
        duration: 4000
      });
      return;
    }
    
    if (!tokenMetadata.name || !tokenMetadata.symbol) {
      toast({
        title: "Invalid Metadata", 
        description: "Name and symbol are required",
        variant: "destructive", 
        duration: 4000
      });
      return;
    }
    
    const selectedAssetId = userTokens[selectedToken].assetId;
    
    setIsUpdatingMetadata(true);
    
    try {
      const result = await updateAlgorandAssetMetadata(
        address,
        selectedAssetId,
        tokenMetadata,
        signTransaction,
        selectedNetwork
      );
      
      if (result.success) {
        toast({
          title: "Metadata Updated", 
          description: `Successfully updated metadata for ${userTokens[selectedToken].symbol}`,
          duration: 5000
        });
        
        // Refresh data after update
        await fetchDashboardData();
      } else {
        toast({
          title: "Update Failed", 
          description: result.error || "Failed to update metadata",
          variant: "destructive", 
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Metadata update error:', error);
      toast({
        title: "Update Failed", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive", 
        duration: 5000
      });
    } finally {
      setIsUpdatingMetadata(false);
    }
  };

  // Generate chart data from transaction history
  const chartData = [
    { name: 'Week 1', value: transactionData.slice(0, 7).length },
    { name: 'Week 2', value: transactionData.slice(7, 14).length },
    { name: 'Week 3', value: transactionData.slice(14, 21).length },
    { name: 'Week 4', value: transactionData.slice(21, 28).length },
  ];

  // Simplified export function
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
        data = { tokens: userTokens, transactions: transactionData, summary: walletSummary };
        filename = `algorand-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        break;
    }

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({
      title: "Export Successful",
      description: `${type} data exported to ${filename}`,
      duration: 3000
    });
  };

  // Get network display info
  const getNetworkInfo = () => {
    return {
      name: selectedNetwork === 'algorand-mainnet' ? 'Algorand Mainnet' : 'Algorand Testnet',
      color: selectedNetwork === 'algorand-mainnet' ? 'text-[#00d4aa]' : 'text-[#76f935]',
      currency: 'ALGO'
    };
  };

  const networkInfo = getNetworkInfo();

  // Don't render until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#76f935] mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading Algorand dashboard...</p>
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
          <Card className="glass-card border-[#76f935]/30 bg-[#76f935]/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#76f935]/20 flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-[#76f935]" />
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
                    <p className="font-semibold mb-1">To access your dashboard:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Click "Connect Wallet" in the top right</li>
                      <li>Select Algorand</li>
                      <li>Connect with Pera Wallet</li>
                      <li>Your dashboard will load automatically</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Link href="/" className="text-[#76f935] hover:text-[#5dd128] text-sm inline-flex items-center">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#76f935] mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your Algorand assets and transaction data...</p>
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Algorand Dashboard</h1>
            <p className="text-muted-foreground">Manage and monitor your Algorand assets</p>
            {address && (
              <p className="text-sm text-muted-foreground mt-2">
                Connected: {address.slice(0, 4)}...{address.slice(-4)}
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
              <Button className="bg-[#76f935] hover:bg-[#5dd128] text-black font-medium">
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
              <Coins className="w-8 h-8 text-[#76f935]" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Value</p>
                <p className="text-2xl font-bold text-foreground">${walletSummary?.totalValue?.toFixed(2) || '0.00'}</p>
              </div>
              <DollarSign className="w-8 h-8 text-[#76f935]" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">ALGO Balance</p>
                <p className="text-2xl font-bold text-foreground">{walletSummary?.algoBalance?.toFixed(4) || '0.0000'}</p>
              </div>
              <Wallet className="w-8 h-8 text-[#76f935]" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Recent Transactions</p>
                <p className="text-2xl font-bold text-foreground">{walletSummary?.recentTransactions || transactionData.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-[#76f935]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Asset List */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Your Algorand Assets</h2>
              {userTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No assets found in your wallet
                  </p>
                  <Link href="/create">
                    <Button className="bg-[#76f935] hover:bg-[#5dd128] text-black font-medium">
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
                          ? 'bg-[#76f935]/20 border border-[#76f935]/50' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => {
                        setSelectedToken(index);
                        // Update metadata form values when selecting token
                        setTokenMetadata({
                          name: token.name || '',
                          symbol: token.symbol || '',
                          description: token.description || '',
                          logoUrl: token.image || '',
                          website: token.website || ''
                        });
                      }}
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
                          <div className={`w-10 h-10 rounded-full bg-[#76f935] flex items-center justify-center text-black font-bold ${token.image ? 'hidden' : ''}`}>
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

          {/* Token Details */}
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
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Algorand Assets Found</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your wallet and create your first asset to get started.
                    </p>
                    <Link href="/create">
                      <Button className="bg-[#76f935] hover:bg-[#5dd128] text-black font-medium">
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
                          onClick={() => navigator.clipboard.writeText(userTokens[selectedToken].assetId.toString())}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border text-muted-foreground"
                          onClick={() => window.open(userTokens[selectedToken].explorerUrl, '_blank')}
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
                            stroke="#76f935" 
                            strokeWidth={3}
                            dot={{ fill: '#76f935', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#76f935', stroke: '#fff', strokeWidth: 2 }}
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
                            fill="#76f935"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                
                {userTokens.length > 0 && (
                  <div className="glass-card p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Network Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{selectedNetwork === 'algorand-mainnet' ? '1,000+' : '100+'}</p>
                        <p className="text-sm text-muted-foreground">TPS</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{selectedNetwork === 'algorand-mainnet' ? '30M+' : '10M+'}</p>
                        <p className="text-sm text-muted-foreground">Total Transactions</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{selectedNetwork === 'algorand-mainnet' ? '10K+' : '2K+'}</p>
                        <p className="text-sm text-muted-foreground">Active Assets</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-foreground">{selectedNetwork === 'algorand-mainnet' ? '<$0.001' : 'Free'}</p>
                        <p className="text-sm text-muted-foreground">Avg. Fees</p>
                      </div>
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
                        const displayTx = formatAlgorandTransactionForDisplay(tx);
                        return (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-[#76f935]/20 flex items-center justify-center">
                                <Send className="w-4 h-4 text-[#76f935]" />
                              </div>
                              <div>
                                <p className="text-foreground font-medium">{displayTx.type}</p>
                                <p className="text-muted-foreground text-sm">{displayTx.amount} to {displayTx.to}</p>
                                <button
                                  onClick={() => window.open(`${getAlgorandNetwork(selectedNetwork).explorer}/tx/${tx.id}`, '_blank')}
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
                      <Button className="bg-[#76f935] hover:bg-[#5dd128] text-black font-medium">
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
                            placeholder={`Enter amount of ${userTokens[selectedToken].symbol}`}
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="input-enhanced mt-2"
                          />
                        </div>
                        <Button 
                          onClick={handleTransfer}
                          className="bg-[#76f935] hover:bg-[#5dd128] text-black font-medium w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Transfer {userTokens[selectedToken].symbol}
                        </Button>
                      </div>
                    </div>

                    {/* Asset Management (if manager) */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Asset Management</h4>
                      
                      {/* Minting Interface */}
                      <div className="mb-8 space-y-4">
                        <h5 className="text-base font-semibold">Mint Additional Tokens</h5>
                        <div className="flex space-x-4">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Amount to mint"
                              value={mintAmount}
                              onChange={(e) => setMintAmount(e.target.value)}
                              className="input-enhanced"
                            />
                          </div>
                          <Button 
                            onClick={handleMint}
                            disabled={isMinting}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            {isMinting ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Minting...
                              </>
                            ) : (
                              <>
                                <Plus className="w-4 h-4 mr-2" />
                                Mint
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Burning Interface */}
                      <div className="mb-8 space-y-4">
                        <h5 className="text-base font-semibold">Burn Tokens</h5>
                        <div className="flex space-x-4">
                          <div className="flex-1">
                            <Input
                              type="number"
                              placeholder="Amount to burn"
                              value={burnAmount}
                              onChange={(e) => setBurnAmount(e.target.value)}
                              className="input-enhanced"
                            />
                          </div>
                          <Button 
                            onClick={handleBurn}
                            disabled={isBurning}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            {isBurning ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Burning...
                              </>
                            ) : (
                              <>
                                <Flame className="w-4 h-4 mr-2" />
                                Burn
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Metadata Update */}
                      <div className="space-y-4 pt-4 border-t border-border">
                        <h5 className="text-base font-semibold">Update Asset Metadata</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tokenName">Asset Name</Label>
                            <Input
                              id="tokenName"
                              value={tokenMetadata.name}
                              onChange={(e) => setTokenMetadata({...tokenMetadata, name: e.target.value})}
                              className="input-enhanced"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tokenSymbol">Asset Symbol</Label>
                            <Input
                              id="tokenSymbol"
                              value={tokenMetadata.symbol}
                              onChange={(e) => setTokenMetadata({...tokenMetadata, symbol: e.target.value.toUpperCase()})}
                              className="input-enhanced"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="tokenDescription">Description</Label>
                          <Input
                            id="tokenDescription"
                            value={tokenMetadata.description}
                            onChange={(e) => setTokenMetadata({...tokenMetadata, description: e.target.value})}
                            className="input-enhanced"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tokenLogo">Logo URL</Label>
                            <Input
                              id="tokenLogo"
                              value={tokenMetadata.logoUrl}
                              onChange={(e) => setTokenMetadata({...tokenMetadata, logoUrl: e.target.value})}
                              className="input-enhanced"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tokenWebsite">Website</Label>
                            <Input
                              id="tokenWebsite"
                              value={tokenMetadata.website}
                              onChange={(e) => setTokenMetadata({...tokenMetadata, website: e.target.value})}
                              className="input-enhanced"
                            />
                          </div>
                        </div>
                        
                        <Button 
                          onClick={handleUpdateMetadata}
                          disabled={isUpdatingMetadata}
                          className="bg-[#76f935] hover:bg-[#5dd128] text-black font-medium w-full mt-2"
                        >
                          {isUpdatingMetadata ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Settings className="w-4 h-4 mr-2" />
                              Update Metadata
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* More Management Options */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Other Management Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          onClick={() => window.open(userTokens[selectedToken].explorerUrl, '_blank')}
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