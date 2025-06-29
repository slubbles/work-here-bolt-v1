'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
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
  CheckCircle,
  Wallet,
  RefreshCw,
  Info,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Clock
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  getAlgorandEnhancedTokenInfo, 
  getAlgorandTransactionHistory, 
  getAlgorandWalletSummary,
  formatAlgorandTransactionForDisplay,
  AlgorandTokenInfo,
  AlgorandTransactionInfo
} from '@/lib/algorand-data';
import { 
  mintAlgorandAssets, 
  burnAlgorandAssets, 
  transferAlgorandAssets, 
  optInToAsset,
  freezeAlgorandAsset,
  unfreezeAlgorandAsset,
  getAlgorandNetwork
} from '@/lib/algorand';
import { TokenHistoryList } from '@/components/TokenHistoryList';
import { SupabaseAuthModal } from '@/components/SupabaseAuthModal';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { trackPageView } from '@/lib/analytics';

export default function AlgorandDashboard() {
  const { toast } = useToast();
  const { 
    connected, 
    address: walletAddress, 
    signTransaction, 
    selectedNetwork,
    networkConfig
  } = useAlgorandWallet();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  
  // State for tokens, transactions, and wallet summary
  const [tokens, setTokens] = useState<AlgorandTokenInfo[]>([]);
  const [transactions, setTransactions] = useState<AlgorandTransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState({
    totalValue: 0,
    totalTokens: 0,
    recentTransactions: 0,
    algoBalance: 0
  });
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  
  // Selected token and action state
  const [selectedToken, setSelectedToken] = useState<AlgorandTokenInfo | null>(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showOptInDialog, setShowOptInDialog] = useState(false);
  const [actionAmount, setActionAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [optInAssetId, setOptInAssetId] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);
  
  // Load data when wallet connects or network changes
  useEffect(() => {
    setSupabaseConfigured(isSupabaseAvailable());
    
    // Track page view
    if (isSupabaseAvailable()) {
      trackPageView('algorand_dashboard');
    }
    
    if (connected && walletAddress) {
      setLoading(true);
      loadDashboardData();
      
      // Set up polling for real-time updates every 30 seconds
      const interval = setInterval(() => {
        if (!refreshing) {
          loadDashboardData(false); // Silent refresh
        }
      }, 30000);
      
      setPollingInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [connected, walletAddress, selectedNetwork]);

  // Load all dashboard data
  const loadDashboardData = async (showLoadingState = true) => {
    if (!connected || !walletAddress) return;
    
    if (showLoadingState) {
      setTokenLoading(true);
      setTransactionLoading(true);
    }
    
    // Load wallet summary
    try {
      const summaryResult = await getAlgorandWalletSummary(walletAddress, selectedNetwork);
      
      if (summaryResult.success && summaryResult.data) {
        setWalletSummary({
          totalValue: summaryResult.data.totalValue || 0,
          totalTokens: summaryResult.data.totalTokens || 0,
          recentTransactions: summaryResult.data.recentTransactions || 0,
          algoBalance: summaryResult.data.algoBalance || 0
        });
      }
    } catch (error) {
      console.error('Error loading wallet summary:', error);
    }
    
    // Load token data
    try {
      const tokenResult = await getAlgorandEnhancedTokenInfo(walletAddress, selectedNetwork);
      
      if (tokenResult.success && tokenResult.data) {
        setTokens(tokenResult.data);
      } else {
        // Set empty array if no tokens found or error
        setTokens([]);
      }
    } catch (error) {
      console.error('Error loading token data:', error);
      toast({
        title: "Error",
        description: "Failed to load token data",
        variant: "destructive"
      });
      setTokens([]);
    } finally {
      setTokenLoading(false);
    }
    
    // Load transaction history
    try {
      const transactionResult = await getAlgorandTransactionHistory(walletAddress, 20, selectedNetwork);
      
      if (transactionResult.success && transactionResult.data) {
        setTransactions(transactionResult.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
    
    setLoading(false);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
    setRefreshing(false);
    toast({
      title: "Dashboard Updated",
      description: "Latest data has been loaded"
    });
  };
  
  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
  };

  // Handle token minting
  const handleMintTokens = async () => {
    if (!selectedToken || !actionAmount || !walletAddress || !signTransaction) {
      return;
    }
    
    setActionError('');
    setActionSuccess('');
    
    try {
      // Validate amount
      const amount = parseFloat(actionAmount);
      if (isNaN(amount) || amount <= 0) {
        setActionError('Please enter a valid positive amount');
        return;
      }
      
      setLoading(true);
      
      const mintResult = await mintAlgorandAssets(
        walletAddress,
        selectedToken.assetId,
        amount,
        signTransaction,
        selectedNetwork
      );
      
      if (mintResult.success) {
        setActionSuccess(`Successfully minted ${amount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Minted ${amount} ${selectedToken.symbol} tokens`
        });
        
        // Refresh data after successful mint
        setTimeout(() => loadDashboardData(), 2000);
        
        setShowMintDialog(false);
        setActionAmount('');
      } else {
        setActionError(mintResult.error || 'Failed to mint tokens');
        toast({
          title: "Error",
          description: mintResult.error || 'Failed to mint tokens',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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

  // Handle token burning
  const handleBurnTokens = async () => {
    if (!selectedToken || !actionAmount || !walletAddress || !signTransaction) {
      return;
    }
    
    setActionError('');
    setActionSuccess('');
    
    try {
      // Validate amount
      const amount = parseFloat(actionAmount);
      if (isNaN(amount) || amount <= 0) {
        setActionError('Please enter a valid positive amount');
        return;
      }
      
      // Validate burn amount against balance
      if (amount > selectedToken.uiBalance) {
        setActionError(`Insufficient balance. You only have ${selectedToken.uiBalance} ${selectedToken.symbol}`);
        return;
      }
      
      setLoading(true);
      
      const burnResult = await burnAlgorandAssets(
        walletAddress,
        selectedToken.assetId,
        amount,
        signTransaction,
        selectedNetwork
      );
      
      if (burnResult.success) {
        setActionSuccess(`Successfully burned ${amount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Burned ${amount} ${selectedToken.symbol} tokens`
        });
        
        // Refresh data after successful burn
        setTimeout(() => loadDashboardData(), 2000);
        
        setShowBurnDialog(false);
        setActionAmount('');
      } else {
        setActionError(burnResult.error || 'Failed to burn tokens');
        toast({
          title: "Error",
          description: burnResult.error || 'Failed to burn tokens',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error burning tokens:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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

  // Handle token transfer
  const handleTransferTokens = async () => {
    if (!selectedToken || !actionAmount || !transferRecipient || !walletAddress || !signTransaction) {
      return;
    }
    
    setActionError('');
    setActionSuccess('');
    
    try {
      // Validate recipient
      if (transferRecipient.trim() === '') {
        setActionError('Recipient address is required');
        return;
      }
      
      // Validate amount
      const amount = parseFloat(actionAmount);
      if (isNaN(amount) || amount <= 0) {
        setActionError('Please enter a valid positive amount');
        return;
      }
      
      // Validate transfer amount against balance
      if (amount > selectedToken.uiBalance) {
        setActionError(`Insufficient balance. You only have ${selectedToken.uiBalance} ${selectedToken.symbol}`);
        return;
      }
      
      setLoading(true);
      
      const transferResult = await transferAlgorandAssets(
        walletAddress,
        selectedToken.assetId,
        transferRecipient,
        amount,
        signTransaction,
        selectedNetwork
      );
      
      if (transferResult.success) {
        setActionSuccess(`Successfully transferred ${amount} ${selectedToken.symbol} tokens`);
        toast({
          title: "Success",
          description: `Transferred ${amount} ${selectedToken.symbol} tokens to ${transferRecipient.slice(0, 8)}...`
        });
        
        // Refresh data after successful transfer
        setTimeout(() => loadDashboardData(), 2000);
        
        setShowTransferDialog(false);
        setActionAmount('');
        setTransferRecipient('');
      } else {
        setActionError(transferResult.error || 'Failed to transfer tokens');
        toast({
          title: "Error",
          description: transferResult.error || 'Failed to transfer tokens',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error transferring tokens:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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

  // Handle token freeze (pause)
  const handleFreezeToken = async () => {
    if (!selectedToken || !walletAddress || !signTransaction) {
      return;
    }
    
    setActionError('');
    setActionSuccess('');
    
    try {
      setLoading(true);
      
      // If token is already frozen, unfreeze it
      const isFrozen = selectedToken.isFrozen;
      
      const freezeResult = isFrozen 
        ? await unfreezeAlgorandAsset(
            walletAddress,
            selectedToken.assetId,
            walletAddress, // Unfreeze own account
            signTransaction,
            selectedNetwork
          )
        : await freezeAlgorandAsset(
            walletAddress,
            selectedToken.assetId,
            walletAddress, // Freeze own account
            signTransaction,
            selectedNetwork
          );
      
      if (freezeResult.success) {
        const action = isFrozen ? 'unfrozen' : 'frozen';
        setActionSuccess(`Successfully ${action} ${selectedToken.symbol} token`);
        toast({
          title: "Success",
          description: `${selectedToken.symbol} token has been ${action}`
        });
        
        // Refresh data after successful freeze/unfreeze
        setTimeout(() => loadDashboardData(), 2000);
        
        setShowFreezeDialog(false);
      } else {
        const action = isFrozen ? 'unfreeze' : 'freeze';
        setActionError(freezeResult.error || `Failed to ${action} token`);
        toast({
          title: "Error",
          description: freezeResult.error || `Failed to ${action} token`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error freezing/unfreezing token:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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

  // Handle asset opt-in
  const handleOptIn = async () => {
    if (!optInAssetId || !walletAddress || !signTransaction) {
      setActionError('Please enter a valid asset ID');
      return;
    }
    
    setActionError('');
    setActionSuccess('');
    
    try {
      const assetId = parseInt(optInAssetId);
      
      if (isNaN(assetId) || assetId <= 0) {
        setActionError('Please enter a valid asset ID');
        return;
      }
      
      setLoading(true);
      
      const optInResult = await optInToAsset(
        walletAddress,
        assetId,
        signTransaction,
        selectedNetwork
      );
      
      if (optInResult.success) {
        setActionSuccess(`Successfully opted in to asset ${assetId}`);
        toast({
          title: "Success",
          description: `Opted in to asset ${assetId}`
        });
        
        // Refresh data after successful opt-in
        setTimeout(() => loadDashboardData(), 2000);
        
        setShowOptInDialog(false);
        setOptInAssetId('');
      } else {
        setActionError(optInResult.error || 'Failed to opt in to asset');
        toast({
          title: "Error",
          description: optInResult.error || 'Failed to opt in to asset',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error opting in to asset:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
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

  // If not connected, show connection prompt
  if (!connected || !walletAddress) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Card className="glass-card border-orange-500/30 bg-orange-500/5">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#76f935]/20 flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-[#76f935]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Connect Wallet</h2>
                <p className="text-muted-foreground">
                  Connect your Algorand wallet to access your token dashboard
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-600">
                    <p className="font-semibold mb-1">Connection required:</p>
                    <p>Use the wallet button in the top navigation to connect your Algorand wallet.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Display loading state while data is being fetched initially
  if (loading && !tokens.length && !transactions.length) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#76f935] mx-auto mb-4"></div>
          <p className="text-foreground text-lg font-semibold">Loading Algorand Dashboard...</p>
          <p className="text-muted-foreground mt-2">Fetching your assets and transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Algorand Dashboard</h1>
            <p className="text-muted-foreground">
              Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(walletAddress)}
              className="h-9"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </Button>
            <Button
              onClick={() => {
                setActionError('');
                setActionSuccess('');
                setOptInAssetId('');
                setShowOptInDialog(true);
              }}
              className="bg-[#76f935] hover:bg-[#68e029] text-black h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Opt-in to Asset
            </Button>
          </div>
        </div>
        
        {/* Network Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className={`flex items-center px-4 py-2 rounded-full ${
            networkConfig?.isMainnet
              ? 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/30'
              : 'bg-[#76f935]/10 text-[#76f935] border border-[#76f935]/30'
          }`}>
            <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: 'currentColor' }}></span>
            <span className="font-medium">
              {networkConfig?.isMainnet ? 'Algorand MainNet' : 'Algorand TestNet'}
            </span>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${walletSummary.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Estimated portfolio value
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assets</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.totalTokens}</div>
              <p className="text-xs text-muted-foreground">
                Unique asset types
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ALGO Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.algoBalance.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">
                Native Algorand balance
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.recentTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Recent transactions
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assets List */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    Your Assets
                    <Badge variant="secondary" className="ml-2">{tokens.length}</Badge>
                  </CardTitle>
                  {tokens.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tokenLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : tokens.length > 0 ? (
                  <div className="space-y-4">
                    {tokens.map((token) => (
                      <div key={token.assetId} className="flex items-center justify-between p-4 glass-card hover:bg-muted/10 transition-colors cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.name} 
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                    <div class="w-12 h-12 algorand-card rounded-full flex items-center justify-center">
                                      <span class="text-[#76f935] font-bold">${token.symbol?.[0] || 'A'}</span>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 algorand-card rounded-full flex items-center justify-center">
                                <span className="text-[#76f935] font-bold">{token.symbol?.[0] || 'A'}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-semibold text-foreground">{token.name || `Asset #${token.assetId}`}</h3>
                              {token.verified && (
                                <Badge className="ml-2 algorand-badge">Verified</Badge>
                              )}
                              {token.isFrozen && (
                                <Badge className="ml-2 bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Frozen</Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <span>{token.symbol || 'ASA'}</span>
                              <span className="mx-1">•</span>
                              <span>ID: {token.assetId}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{token.uiBalance.toLocaleString()} {token.symbol}</p>
                          <p className="text-sm text-muted-foreground">{token.value || '$0.00'}</p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {token.manager === walletAddress && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedToken(token);
                                setShowMintDialog(true);
                                setActionError('');
                                setActionSuccess('');
                              }}>
                                <Plus className="w-4 h-4 mr-2" />
                                Mint Tokens
                              </DropdownMenuItem>
                            )}
                            
                            {token.clawback === walletAddress && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedToken(token);
                                setShowBurnDialog(true);
                                setActionError('');
                                setActionSuccess('');
                              }}>
                                <Flame className="w-4 h-4 mr-2" />
                                Burn Tokens
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowTransferDialog(true);
                              setActionError('');
                              setActionSuccess('');
                            }}>
                              <Send className="w-4 h-4 mr-2" />
                              Transfer
                            </DropdownMenuItem>
                            
                            {token.freeze === walletAddress && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedToken(token);
                                setShowFreezeDialog(true);
                                setActionError('');
                                setActionSuccess('');
                              }}>
                                {token.isFrozen ? (
                                  <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Unfreeze Asset
                                  </>
                                ) : (
                                  <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Freeze Asset
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem onClick={() => copyToClipboard(token.assetId.toString())}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Asset ID
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => window.open(token.explorerUrl, '_blank')}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View on Explorer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-[#76f935]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins className="w-10 h-10 text-[#76f935]/60" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Assets Found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      You don't have any Algorand Standard Assets (ASAs) in this wallet or they haven't been opted into yet.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button 
                        onClick={() => {
                          setActionError('');
                          setActionSuccess('');
                          setOptInAssetId('');
                          setShowOptInDialog(true);
                        }}
                        className="bg-[#76f935] hover:bg-[#68e029] text-black"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Opt-in to Asset
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = '/create?network=algorand'}
                      >
                        Create New Token
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Asset Allocation */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {tokens.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tokens.map(token => ({
                          name: token.symbol || `ASA ${token.assetId}`,
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
                            '#76f935', '#00d4aa', '#3498db', '#9b59b6', '#e67e22', '#f1c40f'
                          ][index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[200px] bg-muted/10 rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">No asset data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((tx) => {
                      // Format for display
                      const displayTx = formatAlgorandTransactionForDisplay(tx);
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-3 glass-card hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              tx.type.includes('Asset') 
                                ? 'bg-[#76f935]/20 text-[#76f935]' 
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              {tx.type.includes('Transfer') ? (
                                <Send className="w-4 h-4" />
                              ) : tx.type.includes('Config') ? (
                                <Settings className="w-4 h-4" />
                              ) : (
                                <MessageSquare className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{displayTx.type}</p>
                              <p className="text-xs text-muted-foreground">{displayTx.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{displayTx.amount}</p>
                            <Badge className="text-xs px-2 py-0 h-5 algorand-badge">
                              {displayTx.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {transactions.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs text-[#76f935] hover:text-[#68e029]">
                          View All Transactions
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No recent transactions</p>
                    <p className="text-xs text-muted-foreground mt-1">Transactions will appear here when you send or receive assets</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Network Info */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm">Algorand Network Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Network:</span>
                    <Badge className={networkConfig?.isMainnet ? 'algorand-mainnet-badge' : 'algorand-badge'}>
                      {networkConfig?.name || (networkConfig?.isMainnet ? 'MainNet' : 'TestNet')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Active
                    </span>
                  </div>
                  {networkConfig?.isMainnet ? (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-2">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                        <p className="text-yellow-600 text-xs">
                          You are connected to MainNet. All transactions use real ALGO and have real value.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#76f935]/10 border border-[#76f935]/20 rounded-lg mt-2">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-[#76f935] mt-0.5" />
                        <p className="text-[#68e029] text-xs">
                          You are connected to TestNet. Perfect for testing - tokens have no real value.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mint Dialog */}
        <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mint Tokens</DialogTitle>
              <DialogDescription>
                Mint new {selectedToken?.symbol} tokens (Asset ID: {selectedToken?.assetId})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {actionSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-600 text-sm">{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{actionError}</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="mintAmount">Amount to Mint</Label>
                <Input
                  id="mintAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to mint"
                />
              </div>
              {selectedToken && (
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <Label>Current Supply</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedToken.uiBalance} {selectedToken.symbol}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                  <p className="text-blue-600 text-sm">
                    Minting requires you to be the asset manager. Only the account that created the asset can mint more tokens.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMintDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleMintTokens} 
                disabled={!actionAmount || loading}
                className="bg-[#76f935] hover:bg-[#68e029] text-black"
              >
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
                Burn {selectedToken?.symbol} tokens (Asset ID: {selectedToken?.assetId})
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {actionSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-600 text-sm">{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{actionError}</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="burnAmount">Amount to Burn</Label>
                <Input
                  id="burnAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to burn"
                  max={selectedToken?.uiBalance.toString()}
                />
              </div>
              {selectedToken && (
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <Label>Available Balance</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedToken.uiBalance} {selectedToken.symbol}
                    </span>
                  </div>
                </div>
              )}
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
            </DialogHeader>
            <div className="space-y-4">
              {actionSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-600 text-sm">{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{actionError}</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="transferAmount">Amount</Label>
                <Input
                  id="transferAmount"
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  placeholder="Enter amount to transfer"
                  max={selectedToken?.uiBalance.toString()}
                />
              </div>
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  placeholder="Enter recipient's Algorand address"
                />
              </div>
              {selectedToken && (
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <Label>Available Balance</Label>
                    <span className="text-sm text-muted-foreground">
                      {selectedToken.uiBalance} {selectedToken.symbol}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                  <p className="text-blue-600 text-sm">
                    Important: The recipient must have opted into this asset (ASA #{selectedToken?.assetId}) to receive it.
                  </p>
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
                className="bg-[#76f935] hover:bg-[#68e029] text-black"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Transfer Tokens
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Freeze/Unfreeze Dialog */}
        <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedToken?.isFrozen ? 'Unfreeze Asset' : 'Freeze Asset'}
              </DialogTitle>
              <DialogDescription>
                {selectedToken?.isFrozen 
                  ? `Unfreeze ${selectedToken?.symbol} tokens to allow transfers`
                  : `Freeze ${selectedToken?.symbol} tokens to prevent transfers`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {actionSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-600 text-sm">{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{actionError}</p>
                  </div>
                </div>
              )}
              <div className="p-4 bg-muted/10 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Asset ID:</span>
                  <span>{selectedToken?.assetId}</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Token Name:</span>
                  <span>{selectedToken?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Current Status:</span>
                  <Badge className={selectedToken?.isFrozen 
                    ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" 
                    : "bg-green-500/20 text-green-500 border-green-500/30"
                  }>
                    {selectedToken?.isFrozen ? 'Frozen' : 'Active'}
                  </Badge>
                </div>
              </div>
              
              <div className={`p-3 ${
                selectedToken?.isFrozen 
                  ? "bg-blue-500/10 border border-blue-500/20"
                  : "bg-yellow-500/10 border border-yellow-500/20"
                } rounded-lg`}
              >
                <div className="flex items-start">
                  <Info className={`w-4 h-4 ${
                    selectedToken?.isFrozen ? "text-blue-500" : "text-yellow-500"
                  } mr-2 mt-0.5`} />
                  <p className={`text-sm ${
                    selectedToken?.isFrozen ? "text-blue-600" : "text-yellow-600"
                  }`}>
                    {selectedToken?.isFrozen 
                      ? "Unfreezing will allow transfers of this asset again."
                      : "Freezing will prevent all transfers of this asset until unfrozen."
                    }
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFreezeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleFreezeToken}
                disabled={loading}
                variant={selectedToken?.isFrozen ? "default" : "secondary"}
                className={selectedToken?.isFrozen 
                  ? "bg-[#76f935] hover:bg-[#68e029] text-black" 
                  : ""
                }
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {selectedToken?.isFrozen ? 'Unfreeze Asset' : 'Freeze Asset'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Opt-In Dialog */}
        <Dialog open={showOptInDialog} onOpenChange={setShowOptInDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opt-in to Asset</DialogTitle>
              <DialogDescription>
                Opt-in to an Algorand Standard Asset (ASA) to receive it
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {actionSuccess && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                    <p className="text-green-600 text-sm">{actionSuccess}</p>
                  </div>
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-red-600 text-sm">{actionError}</p>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="assetId">Asset ID</Label>
                <Input
                  id="assetId"
                  type="number"
                  value={optInAssetId}
                  onChange={(e) => setOptInAssetId(e.target.value)}
                  placeholder="Enter asset ID (e.g., 123456789)"
                />
              </div>
              
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start">
                  <Info className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                  <div className="text-blue-600 text-sm">
                    <p className="mb-1"><strong>What is opting in?</strong></p>
                    <p>
                      On Algorand, you must opt-in to each asset before you can receive it. 
                      This requires a small amount of ALGO (~0.1) to be reserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOptInDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleOptIn}
                disabled={!optInAssetId || loading}
                className="bg-[#76f935] hover:bg-[#68e029] text-black"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Opt-in to Asset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Token History Section */}
      {supabaseConfigured && walletAddress && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <TokenHistoryList walletAddress={walletAddress} limit={5} />
        </div>
      )}
      
      {/* Supabase Auth Modal */}
      {showAuthModal && (
        <SupabaseAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}