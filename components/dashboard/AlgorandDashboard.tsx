'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Info,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Eye,
  Star,
  Shield,
  Activity,
  Clock,
  Globe,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { getAlgorandEnhancedTokenInfo, getAlgorandTransactionHistory, getAlgorandWalletSummary } from '@/lib/algorand-data';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Transaction formatter
const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export default function AlgorandDashboard() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [optInAssetId, setOptInAssetId] = useState('');
  
  // Data states
  const [userTokens, setUserTokens] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  
  // Algorand wallet integration
  const { 
    connected, 
    address, 
    signTransaction,
    selectedNetwork, 
    networkConfig,
    balance 
  } = useAlgorandWallet();
  
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch data when wallet connects
  useEffect(() => {
    if (connected && address) {
      console.log('🔄 Algorand wallet connected, fetching data...');
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
  }, [connected, address, selectedNetwork]);

  const fetchDashboardData = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log(`📊 Fetching Algorand dashboard data for: ${address} on ${selectedNetwork}`);
      
      // Reset data during loading
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      
      // Fetch data in parallel
      const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
        getAlgorandEnhancedTokenInfo(address, selectedNetwork),
        getAlgorandTransactionHistory(address, 20, selectedNetwork),
        getAlgorandWalletSummary(address, selectedNetwork)
      ]);
      
      // Handle tokens data
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
        setUserTokens(tokensResult.value.data);
        console.log(`✅ Loaded ${tokensResult.value.data.length} Algorand tokens`);
      } else {
        console.warn('⚠️ Failed to load Algorand tokens');
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
          algoBalance: balance || 0,
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
        algoBalance: balance || 0,
        recentTransactions: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!connected || !address || isRefreshing) return;

    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Handle transfer of assets
  const handleTransfer = () => {
    handleTransferAsset();
  };
  
  // Implement actual Algorand asset transfer
  const handleTransferAsset = async () => {
    if (!transferAddress || !transferAmount || filteredTokens.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please enter both recipient address and amount",
        variant: "destructive"
      });
      return;
    }
    
    if (!signTransaction || !address) {
      toast({
        title: "Wallet Error",
        description: "Cannot access wallet signing functions",
        variant: "destructive"
      });
      return;
    }
    
    setIsTransferring(true);
    
    try {
      // Get selected token data
      const selectedTokenData = filteredTokens[selectedToken];
      const assetId = selectedTokenData.assetId;
      
      // Get amount with proper decimal handling
      const amount = parseFloat(transferAmount);
      const amountInBaseUnits = Math.floor(amount * Math.pow(10, selectedTokenData.decimals));
      
      console.log(`🔄 Transferring ${amount} ${selectedTokenData.symbol} (Asset ID: ${assetId}) to ${transferAddress}`);
      
      // Import algosdk dynamically to avoid server-side issues
      const algosdk = (await import('algosdk')).default;
      const { getAlgorandClient, waitForConfirmationWithRetry } = await import('@/lib/algorand');
      
      // Get Algorand client
      const algodClient = getAlgorandClient(selectedNetwork);
      
      // Get suggested params
      const suggestedParams = await algodClient.getTransactionParams().do();
      
      // Create asset transfer transaction
      const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: address,
        to: transferAddress,
        assetIndex: assetId,
        amount: amountInBaseUnits,
        suggestedParams
      });
      
      toast({
        title: "Approve Transaction",
        description: "Please approve the transaction in your wallet",
      });
      
      // Sign the transaction
      const signedTxn = await signTransaction(assetTransferTxn);
      
      // Submit transaction to the network
      const response = await algodClient.sendRawTransaction(signedTxn).do();
      const txId = response.txId || response.txid;
      
      console.log('📡 Transaction submitted, waiting for confirmation:', txId);
      
      // Wait for confirmation
      await waitForConfirmationWithRetry(algodClient, txId, 10, selectedNetwork);
      
      toast({
        title: "Transfer Successful",
        description: `${transferAmount} ${selectedTokenData.symbol} sent to ${transferAddress.slice(0, 6)}...`,
        variant: "default"
      });
      
      console.log('✅ Transaction confirmed');
      
      // Reset form
      setTransferAmount('');
      setTransferAddress('');
      
      // Refresh dashboard data
      await fetchDashboardData();
      
    } catch (err) {
      console.error('❌ Transfer error:', err);
      let errorMessage = 'Failed to transfer asset';
      
      if (err instanceof Error) {
        if (err.message.includes('opt in')) {
          errorMessage = 'Recipient has not opted in to this asset. They must opt in before you can transfer.';
        } else if (err.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for this transfer';
        } else if (err.message.includes('cancelled') || err.message.includes('rejected')) {
          errorMessage = 'Transaction was cancelled by user';
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle opt-in to asset
  const handleOptIn = () => {
    handleOptInToAsset();
  };
  
  // Implement actual Algorand asset opt-in
  const handleOptInToAsset = async () => {
    if (!optInAssetId) {
      toast({
        title: "Missing Information",
        description: "Please enter an asset ID to opt in",
        variant: "destructive"
      });
      return;
    }
    
    if (!signTransaction || !address) {
      toast({
        title: "Wallet Error",
        description: "Cannot access wallet signing functions",
        variant: "destructive"
      });
      return;
    }
    
    const assetId = parseInt(optInAssetId);
    if (isNaN(assetId)) {
      toast({
        title: "Invalid Asset ID",
        description: "Please enter a valid Asset ID (number)",
        variant: "destructive"
      });
      return;
    }
    
    setIsTransferring(true);
    
    try {
      console.log(`🔄 Opting in to Asset ID: ${assetId}`);
      
      // Import functions
      const { optInToAsset } = await import('@/lib/algorand');
      
      toast({
        title: "Opt-in Initiated",
        description: `Opting in to Asset ID ${assetId}...`,
      });
      
      // Call the opt-in function
      const result = await optInToAsset(address, assetId, signTransaction, selectedNetwork);
      
      if (result.success) {
        toast({
          title: "Opt-in Successful",
          description: `Successfully opted in to Asset ID ${assetId}`,
          variant: "default"
        });
        setOptInAssetId('');
        
        // Refresh dashboard data
        await fetchDashboardData();
      } else {
        throw new Error(result.error || 'Failed to opt-in to asset');
      }
    } catch (err) {
      console.error('❌ Opt-in error:', err);
      let errorMessage = 'Failed to opt-in to asset';
      
      if (err instanceof Error) {
        if (err.message.includes('already')) {
          errorMessage = 'You have already opted in to this asset';
        } else if (err.message.includes('insufficient')) {
          errorMessage = 'Insufficient ALGO balance for opt-in';
        } else if (err.message.includes('not found')) {
          errorMessage = 'Asset ID not found on this network';
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: "Opt-in Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const exportData = (type: 'transactions' | 'analytics' | 'all') => {
    let data;
    let filename;

    switch (type) {
      case 'transactions':
        data = transactionData;
        filename = `algorand-transactions-${new Date().toISOString().split('T')[0]}.json`;
        break;
      case 'analytics':
        data = { tokens: userTokens, summary: walletSummary };
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
      title: "Export Complete",
      description: `${type} data exported successfully`,
    });
  };

  // Filter tokens based on search
  const filteredTokens = userTokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.assetId.toString().includes(searchQuery)
  );

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

  // Wallet connection prompt
  if (!connected) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#76f935] to-[#5dd128] flex items-center justify-center mx-auto shadow-2xl">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Connect Your Algorand Wallet</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Access your Algorand Standard Assets (ASAs), transaction history, and portfolio analytics.
              </p>
            </div>

            <div className="glass-card p-8 max-w-lg mx-auto">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Shield className="w-6 h-6 text-[#76f935] mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-2">Ultra-Low Fees</h3>
                    <p className="text-sm text-muted-foreground">Algorand transactions cost less than $0.001, making it perfect for token management.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Activity className="w-6 h-6 text-blue-500 mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-2">Instant Finality</h3>
                    <p className="text-sm text-muted-foreground">Transactions are confirmed in under 4 seconds with immediate finality.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Settings className="w-6 h-6 text-purple-500 mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-2">Advanced Features</h3>
                    <p className="text-sm text-muted-foreground">Built-in asset management, atomic swaps, and smart contract capabilities.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button className="bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Token
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted px-8 py-3 text-lg font-semibold">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen app-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-muted rounded animate-pulse"></div>
              </div>
              <div className="h-10 w-32 bg-muted rounded animate-pulse"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                      <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                    </div>
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-4 glass-card p-6">
                <div className="h-6 w-32 bg-muted rounded animate-pulse mb-6"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="xl:col-span-8 space-y-6">
                <div className="glass-card p-6">
                  <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4"></div>
                  <div className="h-64 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#76f935] to-[#5dd128] flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Algorand Dashboard</h1>
                <p className="text-muted-foreground text-lg">Manage your Algorand Standard Assets (ASAs)</p>
              </div>
            </div>
            
            {address && (
              <div className="flex items-center space-x-3 p-3 bg-[#76f935]/10 border border-[#76f935]/20 rounded-xl backdrop-blur-sm">
                <div className="w-2 h-2 bg-[#76f935] rounded-full animate-pulse"></div>
                <span className="text-[#76f935] text-sm font-medium">
                  {address.slice(0, 4)}...{address.slice(-4)}
                </span>
                <Badge className={`text-xs font-semibold ${networkConfig?.isMainnet 
                  ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30' 
                  : 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30'
                }`}>
                  {networkConfig?.isMainnet ? 'Mainnet' : 'Testnet'}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigator.clipboard.writeText(address)}
                  className="h-7 px-2 text-xs"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            )}
            
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing || !connected}
              className="border-border hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-border hover:bg-muted">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportData('transactions')}>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export Transactions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('analytics')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Export Analytics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportData('all')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Link href="/create">
              <Button className="bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Create Token
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { 
              icon: Coins, 
              label: 'Total Assets', 
              value: walletSummary?.totalTokens || userTokens.length, 
              color: 'text-[#76f935]',
              bgColor: 'bg-[#76f935]/10',
              borderColor: 'border-[#76f935]/20'
            },
            { 
              icon: DollarSign, 
              label: 'Portfolio Value', 
              value: `$${walletSummary?.totalValue?.toFixed(2) || '0.00'}`, 
              color: 'text-green-500',
              bgColor: 'bg-green-500/10',
              borderColor: 'border-green-500/20'
            },
            { 
              icon: Wallet, 
              label: 'ALGO Balance', 
              value: `${walletSummary?.algoBalance?.toFixed(4) || balance?.toFixed(4) || '0.0000'} ALGO`, 
              color: 'text-blue-500',
              bgColor: 'bg-blue-500/10',
              borderColor: 'border-blue-500/20'
            },
            { 
              icon: Activity, 
              label: 'Recent Activity', 
              value: walletSummary?.recentTransactions || transactionData.length, 
              color: 'text-purple-500',
              bgColor: 'bg-purple-500/10',
              borderColor: 'border-purple-500/20'
            }
          ].map((stat, index) => (
            <Card key={index} className={`glass-card hover:scale-105 transition-all duration-300 ${stat.bgColor} ${stat.borderColor} border backdrop-blur-xl`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Asset Portfolio - Left Sidebar */}
          <div className="xl:col-span-4">
            <Card className="glass-card h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-[#76f935]" />
                    <span>Asset Portfolio</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-[#76f935]/10 text-[#76f935] border-[#76f935]/20">
                    {filteredTokens.length}
                  </Badge>
                </div>
                
                {userTokens.length > 3 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-muted/30 border-muted"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredTokens.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                      <Coins className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">
                        {userTokens.length === 0 ? 'No Assets Found' : 'No Matching Assets'}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {userTokens.length === 0 
                          ? 'Create your first Algorand Standard Asset to get started.'
                          : 'Try adjusting your search terms.'}
                      </p>
                    </div>
                    {userTokens.length === 0 && (
                      <Link href="/create">
                        <Button className="bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white mt-4">
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Asset
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTokens.map((token, index) => (
                      <div 
                        key={index}
                        className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                          selectedToken === index 
                            ? 'bg-[#76f935]/10 border-[#76f935]/30 shadow-lg' 
                            : 'bg-muted/30 border-transparent hover:bg-muted/50 hover:border-[#76f935]/20'
                        }`}
                        onClick={() => setSelectedToken(index)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.symbol}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-[#76f935] to-[#5dd128] flex items-center justify-center text-white font-bold ${token.image ? 'hidden' : ''}`}>
                              {token.symbol.slice(0, 2)}
                            </div>
                            {token.verified && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#76f935] rounded-full flex items-center justify-center">
                                <Star className="w-3 h-3 text-white" fill="currentColor" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{token.name}</h3>
                              <Badge variant="outline" className="text-xs font-mono">
                                {token.symbol}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-foreground font-semibold">
                                  {token.uiBalance.toLocaleString()}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  Asset ID: {token.assetId}
                                </p>
                              </div>
                              
                              {token.change && (
                                <Badge className={`text-xs ${
                                  token.change.startsWith('+') 
                                    ? 'bg-green-500/20 text-green-600 border-green-500/30'
                                    : 'bg-red-500/20 text-red-600 border-red-500/30'
                                }`}>
                                  {token.change}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <ChevronRight className={`w-4 h-4 transition-transform ${
                            selectedToken === index ? 'rotate-90 text-[#76f935]' : 'text-muted-foreground group-hover:text-foreground'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Asset Details and Management - Right Content */}
          <div className="xl:col-span-8">
            {filteredTokens.length === 0 ? (
              <Card className="glass-card h-full">
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#76f935] to-[#5dd128] flex items-center justify-center mx-auto shadow-xl">
                      <Coins className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">Welcome to Algorand Dashboard</h2>
                      <p className="text-muted-foreground">
                        Your Algorand Standard Asset management hub. Create, monitor, and manage your ASAs with ultra-low fees.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                      <Link href="/create">
                        <Button className="w-full bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white h-12">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Asset
                        </Button>
                      </Link>
                      <Link href="/verify">
                        <Button variant="outline" className="w-full h-12">
                          <Shield className="w-4 h-4 mr-2" />
                          Verify Asset
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Asset Overview Card */}
                <Card className="glass-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-[#76f935]" />
                        <span>{filteredTokens[selectedToken]?.name} Overview</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(filteredTokens[selectedToken]?.assetId?.toString() || '')}
                          className="border-border hover:bg-muted"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy ID
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(filteredTokens[selectedToken]?.explorerUrl, '_blank')}
                          className="border-border hover:bg-muted"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Explorer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground text-sm font-medium">Balance</p>
                        <p className="text-2xl font-bold text-foreground">
                          {filteredTokens[selectedToken]?.uiBalance.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground text-sm font-medium">Asset ID</p>
                        <p className="text-2xl font-bold text-foreground">
                          {filteredTokens[selectedToken]?.assetId}
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground text-sm font-medium">Decimals</p>
                        <p className="text-2xl font-bold text-foreground">
                          {filteredTokens[selectedToken]?.decimals}
                        </p>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-muted-foreground text-sm font-medium">Holders</p>
                        <p className="text-2xl font-bold text-foreground">
                          {filteredTokens[selectedToken]?.holders?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Asset Name</Label>
                          <p className="text-foreground font-semibold">{filteredTokens[selectedToken]?.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Unit Name</Label>
                          <p className="text-foreground font-semibold">{filteredTokens[selectedToken]?.symbol}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Creator</Label>
                          <p className="text-foreground font-mono text-sm">
                            {filteredTokens[selectedToken]?.creator ? 
                              `${filteredTokens[selectedToken].creator.slice(0, 8)}...${filteredTokens[selectedToken].creator.slice(-8)}` :
                              'N/A'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Network</Label>
                          <div>
                            <Badge className={`${networkConfig?.isMainnet 
                              ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30' 
                              : 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30'
                            }`}>
                              {networkConfig?.name}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
                          <p className="text-foreground font-mono text-sm">
                            {filteredTokens[selectedToken]?.manager ? 
                              `${filteredTokens[selectedToken].manager.slice(0, 8)}...${filteredTokens[selectedToken].manager.slice(-8)}` :
                              'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Asset Management Card */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-[#76f935]" />
                      <span>Asset Management</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-16 border-border hover:bg-muted hover:border-[#76f935]/30 transition-all group"
                        onClick={() => window.open(filteredTokens[selectedToken]?.explorerUrl, '_blank')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <ExternalLink className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">View on Explorer</span>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-16 border-border hover:bg-muted hover:border-[#76f935]/30 transition-all group"
                        onClick={() => {
                          toast({
                            title: "Feature Coming Soon",
                            description: "Asset freezing will be available in the next update",
                            variant: "default"
                          });
                        }}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Flame className="w-5 h-5 text-orange-500 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Freeze Asset</span>
                        </div>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-16 border-border hover:bg-muted hover:border-[#76f935]/30 transition-all group"
                        onClick={() => exportData('all')}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Download className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Export Data</span>
                        </div>
                      </Button>
                    </div>
                    
                    {/* Transfer Asset Section */}
                    <div className="p-5 bg-[#76f935]/5 rounded-xl border border-[#76f935]/20">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Send className="w-5 h-5 text-[#76f935] mr-2" />
                        Transfer {filteredTokens[selectedToken]?.symbol || 'Asset'}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <Label htmlFor="transferAddress" className="text-foreground font-medium">Recipient Address</Label>
                          <Input
                            id="transferAddress"
                            placeholder="Enter Algorand wallet address"
                            value={transferAddress}
                            onChange={(e) => setTransferAddress(e.target.value)}
                            className="input-enhanced"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transferAmount" className="text-foreground font-medium">Amount</Label>
                          <Input
                            id="transferAmount"
                            type="number"
                            placeholder={`Enter amount of ${filteredTokens[selectedToken]?.symbol}`}
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="input-enhanced"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleTransfer}
                        className="w-full bg-gradient-to-r from-[#76f935] to-[#5dd128] hover:from-[#5dd128] hover:to-[#4bb01f] text-white mb-4"
                        disabled={isTransferring}
                      >
                        {isTransferring ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Transfer Asset
                          </>
                        )}
                      </Button>
                      
                      <div className="flex items-start space-x-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-blue-600 text-sm font-medium">Important: Opt-in Required</p>
                          <p className="text-xs text-blue-500">
                            The recipient must opt-in to this asset before you can transfer it. This is a security feature of Algorand ASAs.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Opt-in to Asset Section */}
                    <div className="p-5 bg-blue-500/5 rounded-xl border border-blue-500/20">
                      <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Shield className="w-5 h-5 text-blue-500 mr-2" />
                        Opt-in to New Asset
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="optInAssetId" className="text-foreground font-medium">Asset ID</Label>
                          <Input
                            id="optInAssetId"
                            placeholder="Enter Asset ID to opt-in"
                            value={optInAssetId}
                            onChange={(e) => setOptInAssetId(e.target.value)}
                            className="input-enhanced"
                          />
                        </div>
                        <Button 
                          onClick={handleOptIn}
                          className="bg-blue-500 hover:bg-blue-600 text-white h-10"
                          disabled={isTransferring}
                        >
                          {isTransferring ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-2" />
                              Opt-in
                            </>
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        You must opt-in to an ASA before you can receive it. This creates an asset entry in your account.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Transaction History Card */}
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-[#76f935]" />
                        <span>Recent Transactions</span>
                      </CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => exportData('transactions')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {transactionData.length === 0 ? (
                      <div className="text-center py-10">
                        <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold text-foreground">No Recent Transactions</h3>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
                          Transactions will appear here as you interact with Algorand blockchain
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {transactionData.map((tx, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-[#76f935]/20 flex items-center justify-center">
                                <Send className="w-5 h-5 text-[#76f935]" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{tx.type}</p>
                                <p className="text-muted-foreground text-sm">
                                  {tx.amount} {tx.token}
                                </p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-muted-foreground text-sm">
                                {formatDate(tx.timestamp)}
                              </p>
                              <Badge className={`${
                                tx.status === 'confirmed' 
                                  ? 'bg-green-500/20 text-green-600 border-green-500/30'
                                  : tx.status === 'failed'
                                  ? 'bg-red-500/20 text-red-600 border-red-500/30'
                                  : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                              }`}>
                                {tx.status === 'confirmed' ? 'Completed' : tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Render modals */}
      <MintModal />
      <BurnModal />
    </div>
  );
}