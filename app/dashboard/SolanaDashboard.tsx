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
  Loader2,
  CheckCircle,
  Pause,
  Play
} from 'lucide-react';
import { DashboardSkeleton, StatCardSkeleton, TokenCardSkeleton, ChartSkeleton, TransactionItemSkeleton, TokenOverviewSkeleton, ManagementActionsSkeleton } from '@/components/skeletons/DashboardSkeletons';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getEnhancedTokenInfo, 
  getWalletTransactionHistory, 
  getWalletSummary,
  EnhancedTokenInfo,
  TransactionInfo
} from '@/lib/solana-data';
import { 
  getTokenData,
  mintTokens,
  burnTokens,
  pauseToken,
  unpauseToken,
  transferTokens,
  getTokenBalance
} from '@/lib/solana';
import { useSupabaseAuth, useTokenHistory } from '@/hooks/useSupabase';

interface TokenOperation {
  type: 'mint' | 'burn' | 'pause' | 'unpause' | 'transfer';
  tokenAddress: string;
  amount?: number;
  recipient?: string;
  status: 'pending' | 'success' | 'error';
  signature?: string;
  error?: string;
}

export default function SolanaDashboard() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Token operation states
  const [currentOperation, setCurrentOperation] = useState<TokenOperation | null>(null);
  const [operationHistory, setOperationHistory] = useState<TokenOperation[]>([]);
  
  // Real data states
  const [userTokens, setUserTokens] = useState<EnhancedTokenInfo[]>([]);
  const [transactionData, setTransactionData] = useState<TransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Token balances and data
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: number}>({});
  const [tokenDataCache, setTokenDataCache] = useState<{[key: string]: any}>({});
  
  // Solana wallet integration
  const { connected, publicKey, wallet } = useWallet();
  const { toast } = useToast();
  
  // Supabase integration
  const { user, isAuthenticated } = useSupabaseAuth();
  const { tokens: savedTokens, fetchTokenHistory } = useTokenHistory();

  // Fetch real data when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      console.log('🔄 Wallet connected, fetching real data...');
      fetchDashboardData();
    } else {
      // Reset states when wallet disconnects
      console.log('❌ Wallet disconnected, resetting dashboard...');
      setIsLoading(true);
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      setError(null);
      setSelectedToken(0);
      setTokenBalances({});
      setTokenDataCache({});
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
      
      // Fetch all data in parallel, including saved token history if authenticated
      const promises = [
        getEnhancedTokenInfo(walletAddress),
        getWalletTransactionHistory(walletAddress, 20),
        getWalletSummary(walletAddress)
      ];
      
      // Add token history fetch if authenticated
      if (isAuthenticated && user) {
        promises.push(fetchTokenHistory());
      }
      
      const [tokensResult, transactionsResult, summaryResult] = await Promise.all(promises);
      
      // Handle tokens data
      if (tokensResult.success && tokensResult.data) {
        setUserTokens(tokensResult.data);
        console.log(`✅ Loaded ${tokensResult.data.length} tokens`);
        
        // Fetch additional token data and balances for management
        await fetchTokenManagementData(tokensResult.data);
      } else {
        console.warn('⚠️ Failed to load tokens:', tokensResult.error);
        setUserTokens([]);
      }
      
      // Handle transactions data
      if (transactionsResult.success && transactionsResult.data) {
        setTransactionData(transactionsResult.data);
        console.log(`✅ Loaded ${transactionsResult.data.length} transactions`);
      } else {
        console.warn('⚠️ Failed to load transactions:', transactionsResult.error);
        setTransactionData([]);
      }
      
      // Handle summary data
      if (summaryResult.success && summaryResult.data) {
        setWalletSummary(summaryResult.data);
        console.log(`✅ Loaded wallet summary`);
      } else {
        console.warn('⚠️ Failed to load wallet summary:', summaryResult.error);
        setWalletSummary(null);
      }
      
      toast({
        title: "✅ Dashboard Updated",
        description: "Loaded latest data from Solana blockchain",
        duration: 3000,
      });
      
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      
      toast({
        title: "❌ Failed to Load Data",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch additional token management data
  const fetchTokenManagementData = async (tokens: EnhancedTokenInfo[]) => {
    if (!publicKey || !wallet) return;
    
    const balances: {[key: string]: number} = {};
    const tokenData: {[key: string]: any} = {};
    
    for (const token of tokens) {
      try {
        // Get current balance
        const balanceResult = await getTokenBalance(publicKey.toString(), token.mint);
        if (balanceResult.success) {
          balances[token.mint] = balanceResult.balance;
        }
        
        // Get token management data (if it's a token we created)
        try {
          const dataResult = await getTokenData(token.mint);
          if (dataResult.success) {
            tokenData[token.mint] = dataResult.data;
          }
        } catch (err) {
          // Token might not be created through our platform - that's okay
          console.log(`Token ${token.mint} not created through platform`);
        }
      } catch (err) {
        console.warn(`Failed to fetch data for token ${token.mint}:`, err);
      }
    }
    
    setTokenBalances(balances);
    setTokenDataCache(tokenData);
  };
  
  // Manual refresh function
  const handleRefresh = async () => {
    if (!connected || !publicKey || isRefreshing) return;
    
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  // Token operation functions
  const executeTokenOperation = async (operation: Omit<TokenOperation, 'status' | 'signature'>) => {
    if (!wallet || !publicKey) {
      toast({
        title: "❌ Wallet Not Connected",
        description: "Please connect your wallet to perform token operations",
        variant: "destructive",
      });
      return;
    }

    const token = userTokens[selectedToken];
    if (!token) {
      toast({
        title: "❌ No Token Selected",
        description: "Please select a token to manage",
        variant: "destructive",
      });
      return;
    }

    // Start operation
    const operationWithStatus: TokenOperation = {
      ...operation,
      status: 'pending'
    };
    
    setCurrentOperation(operationWithStatus);
    
    try {
      let result;
      
      switch (operation.type) {
        case 'mint':
          if (!operation.amount || operation.amount <= 0) {
            throw new Error('Please enter a valid amount to mint');
          }
          result = await mintTokens(wallet, operation.tokenAddress, operation.amount, token.decimals);
          break;
          
        case 'burn':
          if (!operation.amount || operation.amount <= 0) {
            throw new Error('Please enter a valid amount to burn');
          }
          result = await burnTokens(wallet, operation.tokenAddress, operation.amount, token.decimals);
          break;
          
        case 'pause':
          result = await pauseToken(wallet, operation.tokenAddress);
          break;
          
        case 'unpause':
          result = await unpauseToken(wallet, operation.tokenAddress);
          break;
          
        case 'transfer':
          if (!operation.amount || operation.amount <= 0) {
            throw new Error('Please enter a valid amount to transfer');
          }
          if (!operation.recipient) {
            throw new Error('Please enter a recipient address');
          }
          result = await transferTokens(wallet, operation.tokenAddress, operation.recipient, operation.amount, token.decimals);
          break;
          
        default:
          throw new Error('Unknown operation type');
      }
      
      if (result.success) {
        const completedOperation: TokenOperation = {
          ...operationWithStatus,
          status: 'success',
          signature: result.signature
        };
        
        setCurrentOperation(completedOperation);
        setOperationHistory(prev => [completedOperation, ...prev.slice(0, 9)]); // Keep last 10
        
        toast({
          title: "✅ Operation Successful",
          description: `${operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} operation completed successfully`,
          duration: 5000,
        });
        
        // Clear form fields
        setMintAmount('');
        setBurnAmount('');
        setTransferAmount('');
        setTransferAddress('');
        
        // Refresh data after successful operation
        setTimeout(() => {
          fetchDashboardData();
        }, 2000);
        
      } else {
        throw new Error(result.error || 'Operation failed');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      
      const failedOperation: TokenOperation = {
        ...operationWithStatus,
        status: 'error',
        error: errorMessage
      };
      
      setCurrentOperation(failedOperation);
      setOperationHistory(prev => [failedOperation, ...prev.slice(0, 9)]);
      
      toast({
        title: "❌ Operation Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
    
    // Clear current operation after 5 seconds
    setTimeout(() => {
      setCurrentOperation(null);
    }, 5000);
  };

  // Handle specific operations
  const handleMint = () => {
    const amount = parseFloat(mintAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "❌ Invalid Amount",
        description: "Please enter a valid amount to mint",
        variant: "destructive",
      });
      return;
    }
    
    executeTokenOperation({
      type: 'mint',
      tokenAddress: userTokens[selectedToken].mint,
      amount
    });
  };

  const handleBurn = () => {
    const amount = parseFloat(burnAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "❌ Invalid Amount",
        description: "Please enter a valid amount to burn",
        variant: "destructive",
      });
      return;
    }
    
    const currentBalance = tokenBalances[userTokens[selectedToken].mint] || 0;
    if (amount > currentBalance) {
      toast({
        title: "❌ Insufficient Balance",
        description: `You only have ${currentBalance} tokens available to burn`,
        variant: "destructive",
      });
      return;
    }
    
    executeTokenOperation({
      type: 'burn',
      tokenAddress: userTokens[selectedToken].mint,
      amount
    });
  };

  const handlePause = () => {
    executeTokenOperation({
      type: 'pause',
      tokenAddress: userTokens[selectedToken].mint
    });
  };

  const handleUnpause = () => {
    executeTokenOperation({
      type: 'unpause',
      tokenAddress: userTokens[selectedToken].mint
    });
  };

  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0) {
      toast({
        title: "❌ Invalid Amount",
        description: "Please enter a valid amount to transfer",
        variant: "destructive",
      });
      return;
    }
    
    if (!transferAddress.trim()) {
      toast({
        title: "❌ Invalid Address",
        description: "Please enter a valid recipient address",
        variant: "destructive",
      });
      return;
    }
    
    const currentBalance = tokenBalances[userTokens[selectedToken].mint] || 0;
    if (amount > currentBalance) {
      toast({
        title: "❌ Insufficient Balance",
        description: `You only have ${currentBalance} tokens available to transfer`,
        variant: "destructive",
      });
      return;
    }
    
    executeTokenOperation({
      type: 'transfer',
      tokenAddress: userTokens[selectedToken].mint,
      amount,
      recipient: transferAddress
    });
  };

  // Check if token is manageable (created through our platform)
  const isTokenManageable = (tokenMint: string) => {
    return tokenDataCache[tokenMint] !== undefined;
  };

  // Check if token supports specific operations
  const canMint = (tokenMint: string) => {
    const tokenData = tokenDataCache[tokenMint];
    return tokenData?.features?.canMint || false;
  };

  const canBurn = (tokenMint: string) => {
    const tokenData = tokenDataCache[tokenMint];
    return tokenData?.features?.canBurn || false;
  };

  const canPause = (tokenMint: string) => {
    const tokenData = tokenDataCache[tokenMint];
    return tokenData?.features?.canPause || false;
  };

  const isTokenPaused = (tokenMint: string) => {
    const tokenData = tokenDataCache[tokenMint];
    return tokenData?.isPaused || false;
  };

  // Generate chart data from transaction history
  const chartData = [
    { name: 'Week 1', value: transactionData.slice(0, 7).length },
    { name: 'Week 2', value: transactionData.slice(7, 14).length },
    { name: 'Week 3', value: transactionData.slice(14, 21).length },
    { name: 'Week 4', value: transactionData.slice(21, 28).length },
  ];

  // Format transaction data for display
  const formatTransactionForDisplay = (tx: TransactionInfo) => {
    const timeAgo = new Date(tx.timestamp).toRelativeTimeString 
      ? new Date(tx.timestamp).toRelativeTimeString()
      : new Date(tx.timestamp).toLocaleDateString();
    
    return {
      type: tx.type,
      amount: `${tx.amount} ${tx.token}`,
      to: tx.to ? `${tx.to.slice(0, 4)}...${tx.to.slice(-4)}` : 'Unknown',
      time: timeAgo,
      status: tx.status === 'confirmed' ? 'Completed' : tx.status === 'failed' ? 'Failed' : 'Pending'
    };
  };

  // CSV Export Functions
  const convertToCSV = (data: any[], headers: string[]): string => {
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  };

  const downloadCSV = (csv: string, filename: string): void => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const exportTransactions = (format: 'csv' | 'json' = 'csv'): void => {
    const filename = `${userTokens[selectedToken]?.symbol || 'TOKEN'}_transactions_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      const headers = ['type', 'amount', 'to', 'time', 'status', 'token_symbol'];
      const exportData = transactionData.map(tx => ({
        type: tx.type,
        amount: tx.amount,
        to: tx.to,
        time: tx.time,
        status: tx.status,
        token_symbol: userTokens[selectedToken]?.symbol || 'TOKEN'
      }));
      
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, `${filename}.csv`);
    } else {
      // JSON export
      const exportData = {
        token: userTokens[selectedToken],
        transactions: transactionData,
        exported_at: new Date().toISOString(),
        total_transactions: transactionData.length
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
    
    toast({
      title: "Export Successful",
      description: `Transaction data exported as ${format.toUpperCase()}`,
    });
  };

  const exportChartData = (format: 'csv' | 'json' = 'csv'): void => {
    const filename = `${userTokens[selectedToken]?.symbol || 'TOKEN'}_analytics_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'csv') {
      const headers = ['period', 'value', 'token_symbol', 'data_type'];
      const exportData = chartData.map(item => ({
        period: item.name,
        value: item.value,
        token_symbol: userTokens[selectedToken]?.symbol || 'TOKEN',
        data_type: 'price_chart'
      }));
      
      const csv = convertToCSV(exportData, headers);
      downloadCSV(csv, `${filename}.csv`);
    } else {
      // JSON export
      const exportData = {
        token: userTokens[selectedToken],
        chart_data: chartData,
        analytics: {
          total_supply: userTokens[selectedToken]?.totalSupply,
          holders: userTokens[selectedToken]?.holders,
          current_value: userTokens[selectedToken]?.value,
          change: userTokens[selectedToken]?.change
        },
        exported_at: new Date().toISOString(),
        data_points: chartData.length
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
    
    toast({
      title: "Export Successful",
      description: `Analytics data exported as ${format.toUpperCase()}`,
    });
  };

  const exportAllData = (): void => {
    const filename = `${userTokens[selectedToken]?.symbol || 'TOKEN'}_complete_data_${new Date().toISOString().split('T')[0]}`;
    
    const completeData = {
      token_info: userTokens[selectedToken],
      transactions: transactionData,
      chart_data: chartData,
      analytics: {
        total_supply: userTokens[selectedToken]?.totalSupply,
        holders: userTokens[selectedToken]?.holders,
        current_value: userTokens[selectedToken]?.value,
        change: userTokens[selectedToken]?.change
      },
      export_metadata: {
        exported_at: new Date().toISOString(),
        export_type: 'complete_dashboard_data',
        version: '1.0',
        total_transactions: transactionData.length,
        total_chart_points: chartData.length
      }
    };
    
    const jsonString = JSON.stringify(completeData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({
      title: "Complete Export Successful",
      description: "All dashboard data exported as JSON",
    });
  };

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

  // Show full loading skeleton on initial load
  if (isLoading) {
    console.log('🔄 Showing dashboard loading skeleton...');
    return <DashboardSkeleton />;
  }

  // Log when dashboard content is about to render
  console.log('✅ Rendering dashboard content with wallet:', publicKey?.toString());

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
            {isAuthenticated && user && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Signed in as {user.email?.split('@')[0]}
              </p>
            )}
            {!isAuthenticated && (
              <p className="text-sm text-orange-600 mt-1">
                Sign in to save your token history and access advanced features
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

        {/* Current Operation Status */}
        {currentOperation && (
          <div className="mb-8">
            <Card className="glass-card border-blue-500/30 bg-blue-500/5">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  {currentOperation.status === 'pending' && (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  )}
                  {currentOperation.status === 'success' && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                  {currentOperation.status === 'error' && (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  )}
                  
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {currentOperation.type.charAt(0).toUpperCase() + currentOperation.type.slice(1)} Operation
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentOperation.status === 'pending' && 'Processing transaction...'}
                      {currentOperation.status === 'success' && `Successfully completed! TX: ${currentOperation.signature?.slice(0, 8)}...`}
                      {currentOperation.status === 'error' && currentOperation.error}
                    </p>
                  </div>
                  
                  {currentOperation.signature && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://explorer.solana.com/tx/${currentOperation.signature}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <div className="glass-card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Total Tokens</p>
                    <p className="text-2xl font-bold text-foreground">
                      {walletSummary?.totalTokens || userTokens.length}
                      {isAuthenticated && savedTokens && savedTokens.length > 0 && (
                        <span className="text-sm text-muted-foreground ml-2">
                          (+{savedTokens.length} saved)
                        </span>
                      )}
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
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token List */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Your Tokens</h2>
              {isLoading ? (
                <div className="space-y-4">
                  <TokenCardSkeleton />
                  <TokenCardSkeleton />
                  <TokenCardSkeleton />
                </div>
              ) : userTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {isAuthenticated && savedTokens && savedTokens.length > 0 
                      ? `No tokens in current wallet (${savedTokens.length} saved tokens in history)`
                      : 'No tokens found in your wallet'
                    }
                  </p>
                  <Link href="/create">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Token
                    </Button>
                  </Link>
                  {!isAuthenticated && (
                    <p className="text-sm text-muted-foreground mt-4">
                      Sign in to save your token history across sessions
                    </p>
                  )}
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
                                // Fallback to symbol if image fails
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
                        <div className="flex items-center space-x-2">
                          {token.verified && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                              Verified
                            </Badge>
                          )}
                          {isTokenManageable(token.mint) && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                              Manageable
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-foreground font-semibold">
                            {(tokenBalances[token.mint] || token.uiBalance || 0).toLocaleString()}
                          </p>
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
              {/* Enhanced Tab Navigation */}
              <div className="glass-card p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Token Management</h3>
                  <p className="text-sm text-muted-foreground">Manage and analyze your token performance</p>
                  {isAuthenticated && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ History saved to your account
                    </p>
                  )}
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
                {isLoading ? (
                  <TokenOverviewSkeleton />
                ) : userTokens.length === 0 ? (
                  <div className="glass-card p-6 text-center">
                    <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Tokens Found</h3>
                    <p className="text-muted-foreground mb-6">
                      {isAuthenticated 
                        ? 'Create your first token to get started. It will be saved to your account!'
                        : 'Connect your wallet and create your first token to get started.'
                      }
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
                        {isTokenManageable(userTokens[selectedToken].mint) && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              Platform Token
                            </Badge>
                            {isTokenPaused(userTokens[selectedToken].mint) && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                Paused
                              </Badge>
                            )}
                          </div>
                        )}
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
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Current Balance</p>
                        <p className="text-foreground font-bold">
                          {(tokenBalances[userTokens[selectedToken].mint] || userTokens[selectedToken].uiBalance || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Value</p>
                        <p className="text-foreground font-bold">{userTokens[selectedToken].value || 'N/A'}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Decimals</p>
                        <p className="text-foreground font-bold">{userTokens[selectedToken].decimals}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
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

                {isLoading || userTokens.length === 0 ? (
                  <div className="glass-card p-6">
                    <ChartSkeleton />
                  </div>
                ) : (
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
                            wrapperClassName="custom-tooltip"
                            contentStyle={{}}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="p-4">
                                    <p className="text-foreground font-semibold mb-2">{`Period: ${label}`}</p>
                                    <div className="space-y-1">
                                      {payload.map((entry, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: entry.color }}
                                          />
                                          <span className="text-foreground text-sm">
                                            Transactions: <span className="font-bold">{entry.value}</span>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border">
                                      <p className="text-xs text-muted-foreground">
                                        Recent activity for your wallet
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#EF4444" 
                            strokeWidth={3}
                            dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }}
                            animationBegin={0}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                {isLoading || userTokens.length === 0 ? (
                  <div className="glass-card p-6">
                    <ChartSkeleton />
                  </div>
                ) : (
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-foreground">Transaction Distribution</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <FileDown className="w-4 h-4" />
                            Export Analytics
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportChartData('csv')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportChartData('json')}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Export as JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                            tickLine={{ stroke: 'currentColor', opacity: 0.5 }}
                          />
                          <YAxis 
                            stroke="currentColor" 
                            opacity={0.7}
                            tick={{ fontSize: 12 }}
                            tickLine={{ stroke: 'currentColor', opacity: 0.5 }}
                          />
                          <Tooltip
                            wrapperClassName="custom-tooltip"
                            contentStyle={{}}
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="p-4">
                                    <p className="text-foreground font-semibold mb-2">{`Period: ${label}`}</p>
                                    <div className="space-y-1">
                                      {payload.map((entry, index) => (
                                        <div key={index} className="flex items-center space-x-2">
                                          <div 
                                            className="w-3 h-3 rounded-sm" 
                                            style={{ backgroundColor: entry.color }}
                                          />
                                          <span className="text-foreground text-sm">
                                            Transactions: <span className="font-bold">{entry.value}</span>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border">
                                      <p className="text-xs text-muted-foreground">
                                        Your wallet activity
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="value" 
                            fill="#EF4444"
                            radius={[4, 4, 0, 0]}
                            animationBegin={100}
                            animationDuration={1200}
                            animationEasing="ease-out"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                {isLoading ? (
                  <div className="glass-card p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h4>
                    <div className="space-y-4">
                      <TransactionItemSkeleton />
                      <TransactionItemSkeleton />
                      <TransactionItemSkeleton />
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-foreground">Recent Transactions</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Download className="w-4 h-4" />
                            Export Transactions
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => exportTransactions('csv')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportTransactions('json')}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Export as JSON
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={exportAllData}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Export All Data
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* Operation History */}
                    {operationHistory.length > 0 && (
                      <div className="mb-6">
                        <h5 className="text-sm font-semibold text-foreground mb-3">Recent Operations</h5>
                        <div className="space-y-2">
                          {operationHistory.slice(0, 3).map((operation, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm">
                              <div className="flex items-center space-x-3">
                                {operation.status === 'pending' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {operation.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                {operation.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                <div>
                                  <p className="font-medium text-foreground capitalize">{operation.type}</p>
                                  {operation.amount && (
                                    <p className="text-muted-foreground">{operation.amount} tokens</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge className={`text-xs ${
                                  operation.status === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                  operation.status === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                }`}>
                                  {operation.status}
                                </Badge>
                                {operation.signature && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-1 h-6 text-xs"
                                    onClick={() => window.open(`https://explorer.solana.com/tx/${operation.signature}`, '_blank')}
                                  >
                                    View TX
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
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
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                  <Send className="w-4 h-4 text-red-400" />
                                </div>
                                <div>
                                  <p className="text-foreground font-medium">{displayTx.type}</p>
                                  <p className="text-muted-foreground text-sm">{displayTx.amount} to {displayTx.to}</p>
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
                )}
              </TabsContent>

              <TabsContent value="manage" className="space-y-6">
                {isLoading ? (
                  <ManagementActionsSkeleton />
                ) : userTokens.length === 0 ? (
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
                ) : !isTokenManageable(userTokens[selectedToken].mint) ? (
                  <div className="glass-card p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Token Not Manageable</h3>
                    <p className="text-muted-foreground mb-6">
                      This token was not created through our platform and cannot be managed here. 
                      You can still transfer tokens using the basic transfer function below.
                    </p>
                    
                    {/* Basic Transfer for Non-Manageable Tokens */}
                    <div className="max-w-md mx-auto">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="basicTransferAddress" className="text-foreground font-medium">Recipient Address</Label>
                          <Input
                            id="basicTransferAddress"
                            placeholder="Enter wallet address"
                            value={transferAddress}
                            onChange={(e) => setTransferAddress(e.target.value)}
                            className="input-enhanced mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="basicTransferAmount" className="text-foreground font-medium">Amount</Label>
                          <Input
                            id="basicTransferAmount"
                            type="number"
                            placeholder={`Enter amount of ${userTokens[selectedToken].symbol}`}
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="input-enhanced mt-2"
                          />
                        </div>
                        <Button 
                          onClick={handleTransfer}
                          disabled={currentOperation?.status === 'pending'}
                          className="bg-red-500 hover:bg-red-600 text-white w-full"
                        >
                          {currentOperation?.status === 'pending' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Transfer {userTokens[selectedToken].symbol}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
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
                            placeholder="Enter wallet address (e.g., 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)"
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
                            max={tokenBalances[userTokens[selectedToken].mint] || 0}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Available: {(tokenBalances[userTokens[selectedToken].mint] || 0).toLocaleString()} {userTokens[selectedToken].symbol}
                          </p>
                        </div>
                        <Button 
                          onClick={handleTransfer}
                          disabled={currentOperation?.status === 'pending'}
                          className="bg-red-500 hover:bg-red-600 text-white w-full"
                        >
                          {currentOperation?.status === 'pending' ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Transfer {userTokens[selectedToken].symbol}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Advanced Token Management */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Advanced Token Management</h4>
                      
                      {/* Mint Tokens */}
                      {canMint(userTokens[selectedToken].mint) && (
                        <div className="mb-6 p-4 border border-green-500/30 rounded-lg bg-green-500/5">
                          <h5 className="font-semibold text-foreground mb-3 flex items-center">
                            <Plus className="w-4 h-4 mr-2 text-green-500" />
                            Mint New Tokens
                          </h5>
                          <div className="space-y-3">
                            <Input
                              type="number"
                              placeholder="Amount to mint"
                              value={mintAmount}
                              onChange={(e) => setMintAmount(e.target.value)}
                              className="input-enhanced"
                            />
                            <Button 
                              onClick={handleMint}
                              disabled={currentOperation?.status === 'pending'}
                              className="bg-green-500 hover:bg-green-600 text-white w-full"
                            >
                              {currentOperation?.status === 'pending' && currentOperation?.type === 'mint' ? (
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
                          </div>
                        </div>
                      )}

                      {/* Burn Tokens */}
                      {canBurn(userTokens[selectedToken].mint) && (
                        <div className="mb-6 p-4 border border-red-500/30 rounded-lg bg-red-500/5">
                          <h5 className="font-semibold text-foreground mb-3 flex items-center">
                            <Flame className="w-4 h-4 mr-2 text-red-500" />
                            Burn Tokens
                          </h5>
                          <div className="space-y-3">
                            <Input
                              type="number"
                              placeholder="Amount to burn"
                              value={burnAmount}
                              onChange={(e) => setBurnAmount(e.target.value)}
                              className="input-enhanced"
                              max={tokenBalances[userTokens[selectedToken].mint] || 0}
                            />
                            <p className="text-xs text-muted-foreground">
                              Max burnable: {(tokenBalances[userTokens[selectedToken].mint] || 0).toLocaleString()} {userTokens[selectedToken].symbol}
                            </p>
                            <Button 
                              onClick={handleBurn}
                              disabled={currentOperation?.status === 'pending'}
                              variant="destructive"
                              className="w-full"
                            >
                              {currentOperation?.status === 'pending' && currentOperation?.type === 'burn' ? (
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
                          </div>
                        </div>
                      )}

                      {/* Pause/Unpause */}
                      {canPause(userTokens[selectedToken].mint) && (
                        <div className="mb-6 p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/5">
                          <h5 className="font-semibold text-foreground mb-3 flex items-center">
                            {isTokenPaused(userTokens[selectedToken].mint) ? (
                              <Play className="w-4 h-4 mr-2 text-yellow-500" />
                            ) : (
                              <Pause className="w-4 h-4 mr-2 text-yellow-500" />
                            )}
                            {isTokenPaused(userTokens[selectedToken].mint) ? 'Resume Token' : 'Pause Token'}
                          </h5>
                          <p className="text-sm text-muted-foreground mb-3">
                            {isTokenPaused(userTokens[selectedToken].mint) 
                              ? 'Resume all token transfers and operations'
                              : 'Temporarily halt all token transfers'
                            }
                          </p>
                          <Button 
                            onClick={isTokenPaused(userTokens[selectedToken].mint) ? handleUnpause : handlePause}
                            disabled={currentOperation?.status === 'pending'}
                            className={`w-full ${
                              isTokenPaused(userTokens[selectedToken].mint) 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-yellow-500 hover:bg-yellow-600'
                            } text-white`}
                          >
                            {currentOperation?.status === 'pending' && 
                             (currentOperation?.type === 'pause' || currentOperation?.type === 'unpause') ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : isTokenPaused(userTokens[selectedToken].mint) ? (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Resume Token
                              </>
                            ) : (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pause Token
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Other Management Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          onClick={exportAllData}
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
      </div>
    </div>
  );
}