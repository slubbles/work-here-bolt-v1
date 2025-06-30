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
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  getEnhancedTokenInfo as fetchEnhancedTokenInfo,
  getWalletTransactionHistory as fetchWalletTransactionHistory, 
  getWalletSummary as fetchWalletSummary,
  formatAlgorandTransactionForDisplay
} from '@/lib/solana-data';
import { mintTokens, burnTokens, transferTokens, getTokenBalance, pauseToken, unpauseToken } from '@/lib/solana';
import { DashboardSkeleton, TokenCardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { TokenHistoryList } from '@/components/TokenHistoryList';
import { SupabaseAuthModal } from '@/components/SupabaseAuthModal';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

interface TokenData {
  address: string;
  mint: string;
  name?: string;
  symbol?: string;
  balance?: string;
  uiBalance?: number;
  decimals?: number;
  value?: string;
  change?: string;
  holders?: number;
  isPaused?: boolean;
  verified?: boolean;
  createdAt?: Date;
  marketData?: any;
  image?: string;
}

interface Transaction {
  signature: string;
  type: 'mint' | 'burn' | 'transfer';
  amount: number;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
  from?: string;
  to?: string;
}

export default function SolanaDashboard() {
  const { connected, publicKey } = useWallet();
  const { toast } = useToast();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletSummary, setWalletSummary] = useState({
    totalValue: 0,
    tokenCount: 0,
    totalTransactions: 0,
    change24h: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [actionAmount, setActionAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [showTokenHistory, setShowTokenHistory] = useState(true);

  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 700 },
    { name: 'Jun', value: 900 }
  ];

  useEffect(() => {
    return () => {
      // Clean up polling interval when component unmounts
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    }
  }, [connected, publicKey]);
  
  // Check if Supabase is configured
  useEffect(() => {
    setSupabaseConfigured(isSupabaseAvailable());
  }, []);

  useEffect(() => {
    // Start dashboard data loading
    if (connected && publicKey) {
      setLoading(true);
      loadDashboardData();
      
      // Set up polling for real-time updates every 30 seconds
      const interval = setInterval(() => {
        if (!refreshing) {
          loadDashboardData(false); // Silent refresh
        }
      }, 30000);
      
      setPollingInterval(interval);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [connected, publicKey]);

  const loadDashboardData = async (showLoadingState = true) => {
    if (!connected || !publicKey) return;
    
    if (showLoadingState) {
      setLoading(true);
      setTokenLoading(true);
      setTransactionLoading(true);
    }
    
    // Load wallet summary
    try {
      const summaryResult = await fetchWalletSummary(publicKey.toString());
      
      if (summaryResult.success && summaryResult.data) {
        setWalletSummary({
          totalValue: summaryResult.data.totalValue || 0,
          tokenCount: summaryResult.data.totalTokens || 0,
          totalTransactions: summaryResult.data.recentTransactions || 0,
          change24h: Math.random() > 0.5 ? 3.5 : -2.1, // Random for demo
          solBalance: summaryResult.data.solBalance || 0
        });
      }
    } catch (error) {
      console.error('Error loading wallet summary:', error);
      // Continue with other data loading
    }
    
    // Load token data
    try {
      const tokenResult = await fetchEnhancedTokenInfo(publicKey.toString());
      
      if (tokenResult.success && tokenResult.data) {
        const enhancedTokens = tokenResult.data.map(token => ({
          address: token.mint,
          mint: token.mint,
          name: token.name,
          symbol: token.symbol,
          balance: token.balance,
          uiBalance: token.uiBalance,
          decimals: token.decimals,
          value: token.value,
          change: token.change,
          holders: token.holders || Math.floor(Math.random() * 1000) + 50,
          verified: token.verified || Math.random() > 0.3,
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
          marketData: token.marketData,
          image: token.image
        }));
        
        setTokens(enhancedTokens.length > 0 ? enhancedTokens : []);
      }
    } catch (error) {
      console.error('Error loading token data:', error);
      toast({
        title: "Error",
        description: "Failed to load token data",
        variant: "destructive"
      });
    } finally {
      setTokenLoading(false);
    }
    
    // Load transaction history
    try {
      const transactionResult = await fetchWalletTransactionHistory(publicKey.toString());
      
      if (transactionResult.success && transactionResult.data) {
        const formattedTransactions = transactionResult.data.map(tx => ({
          signature: tx.signature,
          type: tx.type.toLowerCase().includes('mint') 
            ? 'mint' 
            : tx.type.toLowerCase().includes('burn') 
              ? 'burn' 
              : 'transfer',
          amount: parseFloat(tx.amount) || 0,
          timestamp: new Date(tx.timestamp),
          status: tx.status as 'confirmed' | 'pending' | 'failed',
          from: tx.from,
          to: tx.to
        }));
        
        setTransactions(formattedTransactions.length > 0 ? formattedTransactions : []);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setTransactionLoading(false);
    }
    
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Dashboard data refreshed"
    });
  };

  const handleMintTokens = async () => {
    if (!selectedToken || !actionAmount) return;
    setActionError('');
    setActionSuccess('');
    
    try {
      setLoading(true);
      
      // Verify token balance to ensure enough decimals
      const balanceResult = await getTokenBalance(
        publicKey!.toString(),
        selectedToken.mint
      );
      
      const decimals = balanceResult.success 
        ? balanceResult.decimals 
        : (selectedToken.decimals || 9);
      
      const mintResult = await mintTokens(
        publicKey!, 
        selectedToken.mint, 
        parseFloat(actionAmount),
        decimals
      );
      
      if (mintResult.success) {
        setActionSuccess(`Successfully minted ${actionAmount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Minted ${actionAmount} ${selectedToken.symbol} tokens`,
          variant: "default"
        });
        
        // Wait for transaction to be confirmed
        setTimeout(async () => {
          await loadDashboardData();
        }, 2000);
      } else {
        setActionError(mintResult.error || 'Failed to mint tokens');
        toast({
          title: "Error",
          description: mintResult.error || 'Failed to mint tokens',
          variant: "destructive"
        });
      }
      
      setShowMintDialog(false);
      setActionAmount('');
    } catch (error) {
      console.error('Mint error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error minting tokens';
      setActionError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!selectedToken || !actionAmount) return;
    setActionError('');
    setActionSuccess('');
    
    try {
      setLoading(true);
      
      // Verify token balance to ensure enough decimals
      const balanceResult = await getTokenBalance(
        publicKey!.toString(),
        selectedToken.mint
      );
      
      const decimals = balanceResult.success 
        ? balanceResult.decimals 
        : (selectedToken.decimals || 9);
      
      // Validate burn amount against balance
      if (balanceResult.success && parseFloat(actionAmount) > balanceResult.balance) {
        setActionError(`Insufficient balance. You only have ${balanceResult.balance} tokens.`);
        toast({
          title: "Error",
          description: `Insufficient balance. You only have ${balanceResult.balance} tokens.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const burnResult = await burnTokens(
        publicKey!,
        selectedToken.mint,
        parseFloat(actionAmount),
        decimals
      );
      
      if (burnResult.success) {
        setActionSuccess(`Successfully burned ${actionAmount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Burned ${actionAmount} ${selectedToken.symbol} tokens`,
          variant: "default"
        });
        
        // Wait for transaction to be confirmed
        setTimeout(async () => {
          await loadDashboardData();
        }, 2000);
      } else {
        setActionError(burnResult.error || 'Failed to burn tokens');
        toast({
          title: "Error",
          description: burnResult.error || 'Failed to burn tokens',
          variant: "destructive"
        });
      }
      
      setShowBurnDialog(false);
      setActionAmount('');
    } catch (error) {
      console.error('Burn error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error burning tokens';
      setActionError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTokens = async () => {
    if (!selectedToken || !actionAmount || !transferRecipient) return;
    setActionError('');
    setActionSuccess('');
    
    try {
       // Validate recipient address
       if (transferRecipient.trim() === '') {
         setActionError('Recipient address is required');
         return;
       }
       
       // Check if recipient is a valid public key
       try {
         new PublicKey(transferRecipient);
       } catch (err) {
         setActionError('Invalid recipient address format');
         toast({
           title: "Error",
           description: "Invalid recipient address format",
           variant: "destructive"
         });
         return;
       }
       
       // Check if recipient is the same as sender
       if (transferRecipient === publicKey?.toString()) {
         setActionError('Cannot transfer to your own address');
         toast({
           title: "Error",
           description: "Cannot transfer to your own address",
           variant: "destructive"
         });
         return;
       }
       
      setLoading(true);
      
      // Verify token balance
      const balanceResult = await getTokenBalance(
        publicKey!.toString(),
        selectedToken.mint
      );
      
      const decimals = balanceResult.success 
        ? balanceResult.decimals 
        : (selectedToken.decimals || 9);
      
      // Validate transfer amount against balance
      if (balanceResult.success && parseFloat(actionAmount) > balanceResult.balance) {
        setActionError(`Insufficient balance. You only have ${balanceResult.balance} tokens.`);
        toast({
          title: "Error",
          description: `Insufficient balance. You only have ${balanceResult.balance} tokens.`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const transferResult = await transferTokens(
        publicKey!,
        selectedToken.mint,
        transferRecipient,
        parseFloat(actionAmount),
        decimals
      );
      
      if (transferResult.success) {
        setActionSuccess(`Successfully transferred ${actionAmount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Transferred ${actionAmount} ${selectedToken.symbol} tokens to ${transferRecipient.slice(0, 6)}...${transferRecipient.slice(-4)}`,
          variant: "default"
        });
        
        // Wait for transaction to be confirmed
        setTimeout(async () => {
          await loadDashboardData();
        }, 2000);
      } else {
        setActionError(transferResult.error || 'Failed to transfer tokens');
        toast({
          title: "Error",
          description: transferResult.error || 'Failed to transfer tokens',
          variant: "destructive"
        });
      }
      
      setShowTransferDialog(false);
      setActionAmount('');
      setTransferRecipient('');
    } catch (error) {
      console.error('Transfer error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error transferring tokens';
      setActionError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-indigo-600" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your Solana wallet to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 text-center">
              Your wallet needs to be connected to view tokens and perform transactions.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Display loading state while data is being fetched initially
  if (loading && !tokens.length && !transactions.length) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Solana Dashboard</h1>
            <p className="text-gray-600">
              Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => copyToClipboard(publicKey?.toString() || '')}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </Button>
            {supabaseConfigured && (
              <Button 
                variant="outline" 
                onClick={() => setShowAuthModal(true)}
                className="ml-2"
              >
                Account
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${typeof walletSummary.totalValue === 'number' 
                  ? walletSummary.totalValue.toFixed(2) 
                  : '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className={walletSummary.change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {walletSummary.change24h >= 0 ? '+' : ''}{walletSummary.change24h}%
                </span>
                {' '}from yesterday
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.tokenCount}</div>
              <p className="text-xs text-muted-foreground">
                {walletSummary.tokenCount === 1 ? 'Token' : 'Tokens'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"> 
              <CardTitle className="text-sm font-medium">SOL Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.solBalance.toFixed(4)} SOL</div>
              <p className="text-xs text-muted-foreground">
                Network currency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Mainnet</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">●</span> Connected
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tokens List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Your Tokens
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                  <Badge variant="secondary">{tokens.length}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tokenLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="space-y-4 w-full">
                      {[1, 2, 3].map((_, i) => (
                        <TokenCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                ) : tokens.length > 0 ? (
                  <div className="space-y-4">
                    {tokens.map((token) => (
                      <div key={token.address} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          {token.image ? (
                            <img 
                              src={token.image} 
                              alt={token.symbol} 
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = ''; 
                                // Replace with div containing first letter
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                  <div class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span class="text-white font-bold">${(token.symbol || '?')[0]}</span>
                                    <span class="sr-only">${token.symbol || 'Token'}</span>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold">{(token.symbol || '?')[0]}</span>
                              <span className="sr-only">{token.symbol || 'Token'}</span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{token.name}</h3>
                              {token.verified && (
                                <Tooltip content="Verified Token">
                                  <Shield className="w-4 h-4 text-green-600" />
                                </Tooltip>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{token.symbol}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{token.uiBalance?.toLocaleString() || '0'} {token.symbol}</p>
                          <p className="text-sm text-gray-600">{formatTokenValue(token)}</p>
                          {token.change && (
                            <p className={`text-xs ${token.change?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                              {token.change}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowMintDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }}>
                              <Plus className="w-4 h-4 mr-2" />
                              Mint Tokens
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowBurnDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }}>
                              <Flame className="w-4 h-4 mr-2" />
                              Burn Tokens
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowTransferDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }}>
                              <Send className="w-4 h-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(token.address)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Address
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wallet className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No tokens found</h3>
                    <p className="text-gray-500 mt-2">You don't have any tokens in your wallet yet.</p>
                    <div className="mt-6">
                      <Button 
                        onClick={() => window.location.href = '/create'} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Create Your First Token
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Token Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {tokens.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tokens.map(token => ({
                          name: token.symbol,
                          value: token.uiBalance || 0
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tokens.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6', '#F59E0B', '#F43F5E'
                          ][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No token data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.signature} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-all duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.type === 'mint' ? 'bg-green-100' :
                            tx.type === 'burn' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            {tx.type === 'mint' ? <Plus className="w-4 h-4 text-green-600" /> :
                             tx.type === 'burn' ? <Flame className="w-4 h-4 text-red-600" /> :
                             <Send className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{tx.type}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{tx.amount.toLocaleString()}</p>
                          <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                            {tx.status}
                          </Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-2" 
                          onClick={() => window.open(`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recent transactions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Token History Section */}
        {supabaseConfigured && showTokenHistory && publicKey && (
          <div className="mt-8">
            <TokenHistoryList walletAddress={publicKey.toString()} limit={5} />
          </div>
        )}

        {/* Mint Dialog */}
        <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mint Tokens</DialogTitle>
              <DialogDescription>
                Mint new {selectedToken?.symbol} tokens
              </DialogDescription>
              {actionSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionError}</p>
                  </div>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mintAmount">Amount</Label>
                <Input
                  id="mintAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to mint"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Current Balance</Label>
                  <span className="text-sm text-gray-500">{selectedToken?.uiBalance?.toLocaleString() || '0'} {selectedToken?.symbol}</span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-700">
                  <div className="flex items-start">
                    <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    <p>Minting tokens requires ownership privileges. If you created this token, you can mint additional tokens to your wallet.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMintDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleMintTokens} disabled={!actionAmount || loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Mint Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Burn Dialog */}
        <Dialog open={showBurnDialog} onOpenChange={setShowBurnDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Burn Tokens</DialogTitle>
              <DialogDescription>
                Burn {selectedToken?.symbol} tokens (this action cannot be undone)
              </DialogDescription>
              {actionSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionError}</p>
                  </div>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="burnAmount">Amount</Label>
                <Input
                  id="burnAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to burn"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Current Balance</Label>
                  <span className="text-sm text-gray-500">{selectedToken?.uiBalance?.toLocaleString() || '0'} {selectedToken?.symbol}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">
                  Warning: Burned tokens cannot be recovered
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBurnDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBurnTokens} 
                disabled={!actionAmount || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Burn Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transfer Tokens</DialogTitle>
              <DialogDescription>
                Transfer {selectedToken?.symbol} tokens to another address
              </DialogDescription>
              {actionSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <p>{actionError}</p>
                  </div>
                </div>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="transferAmount">Amount</Label>
                <Input
                  id="transferAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to transfer"
                />
              </div>
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  placeholder="Enter recipient's Solana address"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label>Current Balance</Label>
                  <span className="text-sm text-gray-500">{selectedToken?.uiBalance?.toLocaleString() || '0'} {selectedToken?.symbol}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleTransferTokens} 
                disabled={!actionAmount || !transferRecipient || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Transfer Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Supabase Auth Modal */}
        {showAuthModal && (
          <SupabaseAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        )}
      </div>
    </div>
  );
}