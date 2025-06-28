'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { PublicKey } from '@solana/web3.js';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { 
  Coins, 
  TrendingUp, 
  Users,
  Play,
  Pause,
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
  Globe
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  getEnhancedTokenInfo,
  getWalletTransactionHistory, 
  getWalletSummary
} from '@/lib/solana-data';
import { mintTokens, burnTokens, transferTokens } from '@/lib/solana';
import { useToast } from '@/hooks/use-toast';

export default function SolanaDashboard() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isBurnModalOpen, setIsBurnModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Real data states
  const [userTokens, setUserTokens] = useState<EnhancedTokenInfo[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Solana wallet integration
  const { connected, publicKey, wallet } = useWallet();
  
  // Toast notification
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
      
      // Simplified data fetching with better error handling
      const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
        getEnhancedTokenInfo(walletAddress),
        getWalletTransactionHistory(walletAddress, 10),
        getWalletSummary(walletAddress)
      ]);
      
      // Handle tokens data
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success && tokensResult.value.data) {
        setUserTokens(tokensResult.value.data);
        console.log(`✅ Loaded ${tokensResult.value.data.length} tokens`);
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
  
  // Manual refresh function
  const handleRefresh = async () => {
    if (!connected || !publicKey || isRefreshing) return;
    
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

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

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

  // Pause Modal Component
  const PauseModal = () => (
    <Dialog open={isPauseModalOpen} onOpenChange={setIsPauseModalOpen}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isPaused ? 'Unpause' : 'Pause'} {userTokens[selectedToken]?.symbol || ''} Tokens
          </DialogTitle>
          <DialogDescription>
            {isPaused ? 
              'Resume token transfers and enable normal operations.' : 
              'Temporarily pause all token transfers. This is typically used during emergencies or upgrades.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-600">
              <AlertTriangle className="w-4 h-4 inline-block mr-1" />
              {isPaused ? 
                'Unpausing will re-enable all transfers of this token. Make sure any pending issues are resolved.' : 
                'Warning: Pausing affects all token holders and should only be used in emergency situations.'
              }
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsPauseModalOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePauseToggle}
            disabled={isProcessing}
            className={isPaused ? 
              "bg-green-500 hover:bg-green-600 text-white" : 
              "bg-red-500 hover:bg-red-600 text-white"
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Unpause Token
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause Token
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Handle transfer tokens
  const handleTransfer = async () => {
    if (!transferAmount || !transferAddress) {
      toast({
        title: "Invalid Input",
        description: "Please enter both amount and recipient address",
        variant: "destructive"
      });
      return;
    }
    
    if (!wallet) {
      toast({
        title: "Wallet Error",
        description: "Cannot access wallet functions",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const selectedTokenData = userTokens[selectedToken];
      
      // Call the actual transfer function
      const { transferTokens } = await import('@/lib/solana');
      
      toast({
        title: "Processing Transfer",
        description: "Please approve the transaction in your wallet",
      });
      
      const result = await transferTokens(
        wallet,
        selectedTokenData.mint,
        transferAddress,
        parseFloat(transferAmount),
        selectedTokenData.decimals
      );

      if (result.success) {
        toast({
          title: "Transfer Successful",
          description: `Transferred ${transferAmount} ${selectedTokenData.symbol} to ${transferAddress.slice(0, 6)}...`,
          variant: "default"
        });
        setTransferAmount('');
        setTransferAddress('');
        
        // Refresh data
        await fetchDashboardData();
      } else {
        throw new Error(result.error || "Transfer failed");
      }
      
    } catch (error) {
      console.error('Error transferring tokens:', error);
      
      let errorMessage = 'Failed to transfer tokens';
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = 'Insufficient balance for this transfer';
        } else if (error.message.includes('rejected') || error.message.includes('cancelled')) {
          errorMessage = 'Transaction was cancelled';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle pause/unpause tokens
  const handlePauseToggle = async () => {
    if (!wallet || userTokens.length === 0) {
      toast({
        title: "Wallet Error",
        description: "Cannot access wallet functions",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const selectedTokenData = userTokens[selectedToken];
      
      // Import the appropriate function
      const { pauseToken, unpauseToken } = await import('@/lib/solana');
      
      toast({
        title: isPaused ? "Unpausing Token" : "Pausing Token",
        description: "Please approve the transaction in your wallet",
      });
      
      // Call either pause or unpause
      const result = isPaused ? 
        await unpauseToken(wallet, selectedTokenData.mint) :
        await pauseToken(wallet, selectedTokenData.mint);

      if (result.success) {
        toast({
          title: isPaused ? "Token Unpaused" : "Token Paused",
          description: isPaused ? 
            `${selectedTokenData.symbol} transfers are now enabled` : 
            `${selectedTokenData.symbol} transfers are now paused`,
          variant: "default"
        });
        
        // Update state
        setIsPaused(!isPaused);
        setIsPauseModalOpen(false);
        
        // Refresh data
        await fetchDashboardData();
      } else {
        throw new Error(result.error || `Failed to ${isPaused ? 'unpause' : 'pause'} token`);
      }
      
    } catch (error) {
      console.error('Error toggling pause state:', error);
      
      let errorMessage = `Failed to ${isPaused ? 'unpause' : 'pause'} token`;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Operation Failed",
        description: errorMessage,
        variant: "destructive"
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
      <div className="min-h-screen app-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto shadow-2xl">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Connect Your Solana Wallet</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Access your token portfolio, analytics, and management tools by connecting your Solana wallet.
              </p>
            </div>

            <div className="glass-card p-8 max-w-lg mx-auto">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Shield className="w-6 h-6 text-blue-500 mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-2">Secure & Private</h3>
                    <p className="text-sm text-muted-foreground">Your wallet stays in your control. We never store your private keys.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Activity className="w-6 h-6 text-green-500 mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-2">Real-time Data</h3>
                    <p className="text-sm text-muted-foreground">View your tokens, balances, and transaction history in real-time.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Settings className="w-6 h-6 text-purple-500 mt-1" />
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground mb-2">Full Management</h3>
                    <p className="text-sm text-muted-foreground">Mint, burn, transfer, and manage all your tokens from one place.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
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
  
  // Show loading state after wallet is connected
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="glass-card p-6">
                <div className="h-6 w-32 bg-muted rounded animate-pulse mb-6"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
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
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Solana Dashboard</h1>
                <p className="text-muted-foreground text-lg">Manage your token portfolio and analytics</p>
              </div>
            </div>
            
            {publicKey && (
              <div className="flex items-center space-x-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-600 text-sm font-medium">
                  {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigator.clipboard.writeText(publicKey.toBase58())}
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
              <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all">
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
              label: 'Total Tokens', 
              value: walletSummary?.totalTokens || userTokens.length, 
              color: 'text-blue-500',
              bgColor: 'bg-blue-500/10',
              borderColor: 'border-blue-500/20'
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
              label: 'SOL Balance', 
              value: `${walletSummary?.solBalance?.toFixed(4) || '0.0000'} SOL`, 
              color: 'text-purple-500',
              bgColor: 'bg-purple-500/10',
              borderColor: 'border-purple-500/20'
            },
            { 
              icon: Activity, 
              label: 'Recent Activity', 
              value: walletSummary?.recentTransactions || transactionData.length, 
              color: 'text-orange-500',
              bgColor: 'bg-orange-500/10',
              borderColor: 'border-orange-500/20'
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
          {/* Token Portfolio - Left Sidebar */}
          <div className="xl:col-span-4">
            <Card className="glass-card h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-red-500" />
                    <span>Token Portfolio</span>
                  </CardTitle>
                  <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
                    {userTokens.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {userTokens.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                      <Coins className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">No Tokens Found</h3>
                      <p className="text-muted-foreground text-sm">Create your first token to get started with managing your portfolio.</p>
                    </div>
                    <Link href="/create">
                      <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Token
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userTokens.map((token, index) => (
                      <div 
                        key={index}
                        className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                          selectedToken === index 
                            ? 'bg-red-500/10 border-red-500/30 shadow-lg' 
                            : 'bg-muted/30 border-transparent hover:bg-muted/50 hover:border-red-500/20'
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
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold ${token.image ? 'hidden' : ''}`}>
                              {token.symbol.slice(0, 2)}
                            </div>
                            {token.verified && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
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
                                  {token.value || 'N/A'}
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
                            selectedToken === index ? 'rotate-90 text-red-500' : 'text-muted-foreground group-hover:text-foreground'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Token Details and Management - Right Content */}
          <div className="xl:col-span-8">
            {userTokens.length === 0 ? (
              <Card className="glass-card h-full">
                <CardContent className="flex items-center justify-center py-20">
                  <div className="text-center space-y-6 max-w-md">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto shadow-xl">
                      <Coins className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-foreground">Welcome to Solana Dashboard</h2>
                      <p className="text-muted-foreground">
                        Your token management hub. Create, monitor, and manage your Solana tokens from one place.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                      <Link href="/create">
                        <Button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-12">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Token
                        </Button>
                      </Link>
                      <Link href="/verify">
                        <Button variant="outline" className="w-full h-12">
                          <Shield className="w-4 h-4 mr-2" />
                          Verify Token
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Token Overview Card */}
                <Card className="glass-card border-red-500/20">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="w-5 h-5 text-red-500" />
                        <span>{userTokens[selectedToken]?.name} Overview</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(userTokens[selectedToken]?.mint || '')}
                          className="border-border hover:bg-muted"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Address
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`https://explorer.solana.com/address/${userTokens[selectedToken]?.mint}?cluster=devnet`, '_blank')}
                          className="border-border hover:bg-muted"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Explorer
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center space-y-2">
                          <p className="text-muted-foreground text-sm font-medium">Balance</p>
                          <p className="text-2xl font-bold text-foreground">
                            {userTokens[selectedToken]?.uiBalance.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-muted-foreground text-sm font-medium">Value</p>
                          <p className="text-2xl font-bold text-foreground">
                            {userTokens[selectedToken]?.value || 'N/A'}
                          </p>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-muted-foreground text-sm font-medium">Decimals</p>
                          <p className="text-2xl font-bold text-foreground">
                            {userTokens[selectedToken]?.decimals}
                          </p>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-muted-foreground text-sm font-medium">Holders</p>
                          <p className="text-2xl font-bold text-foreground">
                            {userTokens[selectedToken]?.holders?.toLocaleString() || '0'}
                          </p>
                       </div>
                    </div>
                    
                    {/* Token metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 p-4 bg-muted/20 rounded-xl">
                        <h3 className="font-medium text-foreground">Token Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{userTokens[selectedToken]?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Symbol:</span>
                            <span className="font-medium">{userTokens[selectedToken]?.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Decimals:</span>
                            <span className="font-medium">{userTokens[selectedToken]?.decimals}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mint Address:</span>
                            <span className="font-mono text-xs">
                              {userTokens[selectedToken]?.mint?.slice(0, 6)}...{userTokens[selectedToken]?.mint?.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 p-4 bg-muted/20 rounded-xl">
                        <h3 className="font-medium text-foreground">Market Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Price:</span>
                            <span className="font-medium">
                              {userTokens[selectedToken]?.marketData?.price ? 
                               `$${userTokens[selectedToken].marketData.price.toFixed(6)}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Market Cap:</span>
                            <span className="font-medium">
                              {userTokens[selectedToken]?.marketData?.marketCap ? 
                               `$${userTokens[selectedToken].marketData.marketCap.toLocaleString()}` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">24h Change:</span>
                            <span className={`font-medium ${
                              userTokens[selectedToken]?.change?.startsWith('+') 
                                ? 'text-green-500' 
                                : 'text-red-500'
                            }`}>
                              {userTokens[selectedToken]?.change || '0%'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Network:</span>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                              Solana Devnet
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Activity chart */}
                    <div className="mt-4">
                      <h3 className="font-medium text-foreground mb-4 flex items-center">
                        <Activity className="w-5 h-5 text-red-500 mr-2" /> 
                        Transaction Activity
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                            <XAxis 
                              dataKey="name" 
                              stroke="currentColor" 
                              opacity={0.7}
                              fontSize={12}
                            />
                            <YAxis 
                              stroke="currentColor" 
                              opacity={0.7}
                              fontSize={12}
                            />
                            <Tooltip 
                              contentStyle={{
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)'
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
                   </CardContent>
                  </Card>

                  {/* Token Management Card */}
                  <Card className="glass-card border-blue-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5 text-blue-500" />
                        <span>Token Management</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <Button 
                          onClick={() => setIsTransferDialogOpen(true)}
                          variant="outline" 
                          className="h-20 border-border hover:bg-muted hover:border-red-500/30 transition-all group"
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Send className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Transfer Tokens</span>
                            <span className="text-xs text-muted-foreground">Send to any address</span>
                          </div>
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            if (userTokens[selectedToken]?.marketData?.canMint) {
                              setIsMintModalOpen(true);
                            } else {
                              toast({
                                title: "Minting Disabled",
                                description: "This token does not have minting enabled",
                                variant: "destructive"
                              });
                            }
                          }}
                          variant="outline" 
                          className="h-20 border-border hover:bg-muted hover:border-red-500/30 transition-all group"
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Plus className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Mint Tokens</span>
                            <span className="text-xs text-muted-foreground">Create new tokens</span>
                          </div>
                        </Button>
                        
                        <Button 
                          onClick={() => {
                            if (userTokens[selectedToken]?.marketData?.canBurn) {
                              setIsBurnModalOpen(true); 
                            } else {
                              toast({
                                title: "Burning Disabled",
                                description: "This token does not have burning enabled",
                                variant: "destructive"
                              });
                            }
                          }}
                          variant="outline" 
                          className="h-20 border-border hover:bg-muted hover:border-red-500/30 transition-all group"
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Flame className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Burn Tokens</span>
                            <span className="text-xs text-muted-foreground">Remove from supply</span>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="h-20 border-border hover:bg-muted hover:border-red-500/30 transition-all group"
                          onClick={() => {
                            if (userTokens[selectedToken]?.marketData?.canPause) {
                              // Check current pause state first
                              setIsPaused(userTokens[selectedToken]?.isPaused || false);
                              setIsPauseModalOpen(true);
                            } else {
                              toast({
                                title: "Pause Feature Disabled",
                                description: "This token does not have pause functionality enabled",
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Pause className="w-6 h-6 text-yellow-500 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Pause/Unpause</span>
                            <span className="text-xs text-muted-foreground">Control transfers</span>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="h-20 border-border hover:bg-muted hover:border-red-500/30 transition-all group"
                          onClick={() => window.open(`https://explorer.solana.com/address/${userTokens[selectedToken].mint}?cluster=devnet`, '_blank')}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <BarChart3 className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">View Analytics</span>
                            <span className="text-xs text-muted-foreground">Detailed insights</span>
                          </div>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            toast({
                              title: "Feature Coming Soon",
                              description: "Metadata updates will be available in the next release",
                            });
                          }}
                          className="h-20 border-border hover:bg-muted hover:border-red-500/30 transition-all group"
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Settings className="w-6 h-6 text-gray-500 group-hover:scale-110 transition-transform" />
                            <span className="font-medium">Update Metadata</span>
                            <span className="text-xs text-muted-foreground">Coming soon</span>
                          </div>
                        </Button>
                      </div>
                      
                      {/* Token Permissions */}
                      <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
                        <h3 className="text-lg font-semibold mb-3">Token Capabilities</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center p-3 bg-muted/20 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                              <Plus className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium">Mintable</p>
                              <p className="text-xs text-muted-foreground">New tokens can be created</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center p-3 bg-muted/20 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                              <Flame className="w-4 h-4 text-red-500" />
                            </div>
                            <div>
                              <p className="font-medium">Burnable</p>
                              <p className="text-xs text-muted-foreground">Tokens can be destroyed</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center p-3 bg-muted/20 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                              <Pause className="w-4 h-4 text-yellow-500" />
                            </div>
                            <div>
                              <p className="font-medium">Pausable</p>
                              <p className="text-xs text-muted-foreground">Transfers can be paused</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Recent Transactions */}
                  <Card className="glass-card border-purple-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-purple-500" />
                        <span>Recent Transactions</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {transactionData.length === 0 ? (
                        <div className="text-center py-8">
                          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground text-lg font-medium mb-2">No recent transactions</p>
                          <p className="text-sm text-muted-foreground">Transactions will appear here as you use your wallet</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {transactionData.slice(0, 5).map((tx, index) => {
                            const displayTx = formatTransactionForDisplay(tx);
                            return (
                              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <Send className="w-5 h-5 text-purple-500" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">{displayTx.type}</p>
                                    <p className="text-muted-foreground text-sm">
                                      {displayTx.amount} to {displayTx.to}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className="text-muted-foreground text-sm">{formatDate(tx.timestamp)}</p>
                                  <Badge className={`${
                                    displayTx.status === 'Completed' 
                                      ? 'bg-green-500/20 text-green-600 border-green-500/30'
                                      : displayTx.status === 'Failed'
                                      ? 'bg-red-500/20 text-red-600 border-red-500/30'
                                      : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                                  }`}>
                                    {displayTx.status}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                          
                          {transactionData.length > 5 && (
                            <Button 
                              variant="ghost" 
                              className="w-full text-muted-foreground hover:text-foreground"
                              onClick={() => exportData('transactions')}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export All Transactions
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
              </div>
            )}
          </div>
        </div>
        
        {/* Modals and Dialogs */}
        
        {/* Transfer Dialog */}
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Transfer {userTokens[selectedToken]?.symbol || ''} Tokens
              </DialogTitle>
              <DialogDescription>
                Send tokens to another wallet address.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transferAddress">Recipient Address</Label>
                <Input
                  id="transferAddress"
                  placeholder="Enter Solana wallet address"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  className="input-enhanced"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transferAmount">Amount to Transfer</Label>
                <Input
                  id="transferAmount"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder={`Enter amount of ${userTokens[selectedToken]?.symbol || 'tokens'}`}
                  className="input-enhanced"
                  disabled={isProcessing}
                />
                <p className="text-xs text-muted-foreground">
                  Available balance: {userTokens[selectedToken]?.uiBalance.toLocaleString() || '0'} {userTokens[selectedToken]?.symbol || ''}
                </p>
              </div>
              
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-600">
                  <Info className="w-4 h-4 inline-block mr-1" />
                  Transfer will be processed on the Solana Devnet.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTransferDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={!transferAmount || parseFloat(transferAmount) <= 0 || !transferAddress || isProcessing}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Transfer Tokens
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Mint Modal - Keep existing modal */}
        <Dialog open={isMintModalOpen} onOpenChange={setIsMintModalOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Mint {userTokens[selectedToken]?.symbol || ''} Tokens
              </DialogTitle>
              <DialogDescription>
                Create new tokens and add them to the total supply.
                {userTokens[selectedToken]?.marketData ? (
                  <div className="mt-2 text-sm text-green-500">Token can be minted.</div>
                ) : (
                  <div className="mt-2 text-sm text-red-500">
                    Token does not have minting enabled or you don't have permission to mint.
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="mintAmount">Amount to Mint</Label>
                <Input
                  id="mintAmount"
                  type="number"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  placeholder={`Enter amount of ${userTokens[selectedToken]?.symbol || 'tokens'}`}
                  className="input-enhanced"
                  disabled={isProcessing}
                />
              </div>
              
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-600">
                  <Info className="w-4 h-4 inline-block mr-1" />
                  Minting will create new tokens and increase the total supply.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsMintModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleMintTokens}
                disabled={!mintAmount || parseFloat(mintAmount) <= 0 || isProcessing || !userTokens[selectedToken]?.marketData}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
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
        
        {/* Burn Modal - Keep existing modal */}
        <Dialog open={isBurnModalOpen} onOpenChange={setIsBurnModalOpen}>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Burn {userTokens[selectedToken]?.symbol || ''} Tokens
              </DialogTitle>
              <DialogDescription>
                Permanently remove tokens from circulation, reducing the total supply.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="burnAmount">Amount to Burn</Label>
                <Input
                  id="burnAmount"
                  type="number"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  placeholder={`Enter amount of ${userTokens[selectedToken]?.symbol || 'tokens'}`}
                  className="input-enhanced"
                  disabled={isProcessing}
                />
                <p className="text-sm text-muted-foreground">
                  Available balance: {userTokens[selectedToken]?.uiBalance.toLocaleString() || '0'} {userTokens[selectedToken]?.symbol || ''}
                </p>
              </div>
              
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-600">
                  <AlertTriangle className="w-4 h-4 inline-block mr-1" />
                  Warning: Burning tokens is permanent and cannot be undone.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsBurnModalOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBurnTokens}
                disabled={
                  !burnAmount || 
                  parseFloat(burnAmount) <= 0 || 
                  (userTokens[selectedToken] && parseFloat(burnAmount) > userTokens[selectedToken].uiBalance) || 
                  isProcessing
                }
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
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

        {/* Render modals */}
        {userTokens.length > 0 && (
          <>
            <PauseModal />
          </>
        )}
      </div>
    </div>
  );
}