'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
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
  Clock,
  Activity
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
  getAlgorandWalletSummaryWithMarketData,
  getAlgorandAssetCreationHistory,
  getAlgorandMarketData,
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
  const [filteredTransactions, setFilteredTransactions] = useState<AlgorandTransactionInfo[]>([]);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'send' | 'receive' | 'asset-transfer' | 'asset-config' | 'payment'>('all');
  const [assetCreationHistory, setAssetCreationHistory] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any>(null);
  const [walletSummary, setWalletSummary] = useState({
    totalValue: 0,
    totalTokens: 0,
    recentTransactions: 0,
    algoBalance: 0,
    algoValueUSD: 0,
    portfolioChange24h: 0
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
  const [selectedTokens, setSelectedTokens] = useState<Set<number>>(new Set()); // For batch operations
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchOperation, setBatchOperation] = useState<'transfer' | 'freeze' | 'unfreeze' | null>(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showOptInDialog, setShowOptInDialog] = useState(false);
  const [actionAmount, setActionAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [optInAssetId, setOptInAssetId] = useState('');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Advanced analytics state
  const [portfolioHistory, setPortfolioHistory] = useState<Array<{
    date: string;
    value: number;
    algoPrice: number;
  }>>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalReturn: 0,
    totalReturnPercent: 0,
    bestPerformingAsset: null as AlgorandTokenInfo | null,
    worstPerformingAsset: null as AlgorandTokenInfo | null,
    avgTransactionValue: 0,
    transactionFrequency: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);
  
  // Calculate advanced analytics
  const calculateAdvancedAnalytics = async () => {
    if (!connected || !walletAddress || tokens.length === 0) return;
    
    setAnalyticsLoading(true);
    
    try {
      // Generate mock portfolio history (in real app, this would come from historical data)
      const history = [];
      const currentDate = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        
        // Simulate portfolio value changes
        const baseValue = walletSummary.totalValue || 100;
        const variance = (Math.random() - 0.5) * 0.2; // ±10% variance
        const value = baseValue * (1 + variance);
        const algoPrice = marketData?.algoPrice || 1;
        
        history.push({
          date: date.toISOString().split('T')[0],
          value: Math.max(0, value),
          algoPrice: algoPrice * (1 + (Math.random() - 0.5) * 0.1)
        });
      }
      
      setPortfolioHistory(history);
      
      // Calculate performance metrics
      let bestAsset = null;
      let worstAsset = null;
      let bestReturn = -Infinity;
      let worstReturn = Infinity;
      
      tokens.forEach(token => {
        // Mock return calculation (in real app, use historical data)
        const mockReturn = (Math.random() - 0.5) * 100; // ±50% return
        
        if (mockReturn > bestReturn) {
          bestReturn = mockReturn;
          bestAsset = token;
        }
        
        if (mockReturn < worstReturn) {
          worstReturn = mockReturn;
          worstAsset = token;
        }
      });
      
      // Calculate transaction metrics
      const transactionValues = transactions
        .filter(tx => tx.amount && !isNaN(parseFloat(tx.amount)))
        .map(tx => parseFloat(tx.amount));
      
      const avgTransactionValue = transactionValues.length > 0 
        ? transactionValues.reduce((sum, val) => sum + val, 0) / transactionValues.length
        : 0;
      
      const daysSinceFirstTransaction = transactions.length > 0 
        ? Math.max(1, Math.floor((Date.now() - Math.min(...transactions.map(tx => tx.timestamp))) / (1000 * 60 * 60 * 24)))
        : 1;
      
      const transactionFrequency = transactions.length / daysSinceFirstTransaction;
      
      setPerformanceMetrics({
        totalReturn: history.length > 1 ? history[history.length - 1].value - history[0].value : 0,
        totalReturnPercent: history.length > 1 && history[0].value > 0 
          ? ((history[history.length - 1].value - history[0].value) / history[0].value) * 100 
          : 0,
        bestPerformingAsset: bestAsset,
        worstPerformingAsset: worstAsset,
        avgTransactionValue,
        transactionFrequency
      });
      
    } catch (error) {
      console.error('Error calculating analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };
  
  // Function to categorize and filter transactions
  const categorizeTransaction = (tx: AlgorandTransactionInfo) => {
    if (tx.type === 'payment') {
      return tx.from === walletAddress ? 'send' : 'receive';
    } else if (tx.type === 'asset-transfer') {
      return tx.from === walletAddress ? 'send' : 'receive';
    } else if (tx.type === 'asset-config') {
      return 'asset-config';
    }
    return 'other';
  };
  
  // Filter transactions based on selected category
  useEffect(() => {
    if (transactionFilter === 'all') {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(tx => {
        const category = categorizeTransaction(tx);
        if (transactionFilter === 'send' || transactionFilter === 'receive') {
          return category === transactionFilter;
        } else if (transactionFilter === 'asset-transfer') {
          return tx.type === 'asset-transfer';
        } else if (transactionFilter === 'asset-config') {
          return tx.type === 'asset-config';
        } else if (transactionFilter === 'payment') {
          return tx.type === 'payment';
        }
        return false;
      });
      setFilteredTransactions(filtered);
    }
  }, [transactions, transactionFilter]);
  
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
        if (!refreshing && !analyticsLoading) {
          loadDashboardData(false); // Silent refresh
        }
      }, 30000);
      
      setPollingInterval(interval);
      
      return () => clearInterval(interval);
    } else {
      // Clear data when wallet disconnects
      setTokens([]);
      setTransactions([]);
      setFilteredTransactions([]);
      setAssetCreationHistory([]);
      setWalletSummary({
        totalValue: 0,
        totalTokens: 0,
        recentTransactions: 0,
        algoBalance: 0,
        algoValueUSD: 0,
        portfolioChange24h: 0
      });
      setPortfolioHistory([]);
      setPerformanceMetrics({
        totalReturn: 0,
        totalReturnPercent: 0,
        bestPerformingAsset: null,
        worstPerformingAsset: null,
        avgTransactionValue: 0,
        transactionFrequency: 0
      });
    }
  }, [connected, walletAddress, selectedNetwork]);

  // Load all dashboard data
  const loadDashboardData = async (showLoadingState = true) => {
    if (!connected || !walletAddress) return;
    
    if (showLoadingState) {
      setTokenLoading(true);
      setTransactionLoading(true);
    }
    
    // Load wallet summary with market data
    try {
      const [summaryResult, marketResult] = await Promise.allSettled([
        getAlgorandWalletSummary(walletAddress, selectedNetwork),
        getAlgorandMarketData()
      ]);
      
      let summary = {
        totalValue: 0,
        totalTokens: 0,
        recentTransactions: 0,
        algoBalance: 0,
        algoValueUSD: 0,
        portfolioChange24h: 0
      };
      
      if (summaryResult.status === 'fulfilled' && summaryResult.value.success && summaryResult.value.data) {
        summary = {
          ...summary,
          ...summaryResult.value.data
        };
      }
      
      // Apply market data if available
      if (marketResult.status === 'fulfilled' && marketResult.value.success && marketResult.value.data) {
        const marketData = marketResult.value.data;
        setMarketData(marketData);
        
        const algoValueUSD = summary.algoBalance * marketData.algoPrice;
        const portfolioChange24h = (algoValueUSD * marketData.priceChange24h) / 100;
        
        summary = {
          ...summary,
          algoValueUSD,
          portfolioChange24h,
          totalValue: algoValueUSD + summary.totalValue // Add token values to ALGO value
        };
      }
      
      setWalletSummary(summary);
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
        setFilteredTransactions(transactionResult.data); // Initialize filtered transactions
      } else {
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
      setFilteredTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
    
    // Load asset creation history
    try {
      const creationResult = await getAlgorandAssetCreationHistory(walletAddress, selectedNetwork);
      
      if (creationResult.success && creationResult.data) {
        setAssetCreationHistory(creationResult.data);
      } else {
        setAssetCreationHistory([]);
      }
    } catch (error) {
      console.error('Error loading asset creation history:', error);
      setAssetCreationHistory([]);
    }
    
    setLoading(false);
    
    // Calculate analytics after all data is loaded
    setTimeout(() => calculateAdvancedAnalytics(), 1000);
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

  // Handle batch operations
  const handleBatchOperation = async () => {
    if (!batchOperation || selectedTokens.size === 0 || !walletAddress || !signTransaction) {
      return;
    }
    
    setActionError('');
    setActionSuccess('');
    
    try {
      setLoading(true);
      
      const selectedTokensList = Array.from(selectedTokens);
      const results = [];
      
      // Process each token in the batch
      for (const assetId of selectedTokensList) {
        const token = tokens.find(t => t.assetId === assetId);
        if (!token) continue;
        
        try {
          let result;
          
          if (batchOperation === 'freeze') {
            result = await freezeAlgorandAsset(
              walletAddress,
              assetId,
              walletAddress, // Freeze own account
              signTransaction,
              selectedNetwork
            );
          } else if (batchOperation === 'unfreeze') {
            result = await unfreezeAlgorandAsset(
              walletAddress,
              assetId,
              walletAddress, // Unfreeze own account
              signTransaction,
              selectedNetwork
            );
          }
          
          results.push({
            assetId,
            symbol: token.symbol,
            success: result?.success || false,
            error: result?.error
          });
          
          // Add delay between operations to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.push({
            assetId,
            symbol: token.symbol,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Show results
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        setActionSuccess(`Successfully ${batchOperation}d ${successCount} asset(s)`);
        toast({
          title: "Batch Operation Complete",
          description: `${successCount} asset(s) ${batchOperation}d successfully${failCount > 0 ? `, ${failCount} failed` : ''}`
        });
      }
      
      if (failCount > 0 && successCount === 0) {
        setActionError(`Failed to ${batchOperation} ${failCount} asset(s)`);
        toast({
          title: "Batch Operation Failed",
          description: `Failed to ${batchOperation} ${failCount} asset(s)`,
          variant: "destructive"
        });
      }
      
      // Refresh data after batch operation
      setTimeout(() => loadDashboardData(), 2000);
      
      setShowBatchDialog(false);
      setSelectedTokens(new Set());
      setBatchOperation(null);
      
    } catch (error) {
      console.error('Error in batch operation:', error);
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

  // Helper functions
  const getUserRole = (token: AlgorandTokenInfo): string[] => {
    const roles = [];
    if (token.creator === walletAddress) roles.push('Creator');
    if (token.manager === walletAddress) roles.push('Manager');
    if (token.freeze === walletAddress) roles.push('Freeze');
    if (token.clawback === walletAddress) roles.push('Clawback');
    if (token.reserve === walletAddress) roles.push('Reserve');
    return roles;
  };
  
  const canPerformAction = (token: AlgorandTokenInfo, action: string): boolean => {
    switch (action) {
      case 'mint':
        return token.manager === walletAddress;
      case 'burn':
        return token.clawback === walletAddress;
      case 'freeze':
        return token.freeze === walletAddress;
      case 'transfer':
        return true; // Anyone can transfer their own tokens
      case 'metadata':
        return token.manager === walletAddress;
      default:
        return false;
    }
  };

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
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 text-xs sm:text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => copyToClipboard(walletAddress)}
              className="h-9 text-xs sm:text-sm"
            >
              <Copy className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Copy Address</span>
              <span className="sm:hidden">Copy</span>
            </Button>
            <Button
              onClick={() => {
                setActionError('');
                setActionSuccess('');
                setOptInAssetId('');
                setShowOptInDialog(true);
              }}
              className="bg-[#76f935] hover:bg-[#68e029] text-black h-9 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Opt-in to Asset</span>
              <span className="sm:hidden">Opt-in</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Portfolio Value</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">${walletSummary.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {walletSummary.portfolioChange24h !== 0 && (
                  <span className={`flex items-center ${walletSummary.portfolioChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${walletSummary.portfolioChange24h < 0 ? 'rotate-180' : ''}`} />
                    {walletSummary.portfolioChange24h >= 0 ? '+' : ''}${walletSummary.portfolioChange24h.toFixed(2)}
                  </span>
                )}
                {walletSummary.portfolioChange24h === 0 && 'Total value'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">ALGO Balance</CardTitle>
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{walletSummary.algoBalance.toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">
                ${walletSummary.algoValueUSD.toFixed(2)} USD
                {marketData && (
                  <span className="ml-1">
                    @ ${marketData.algoPrice.toFixed(3)}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Assets</CardTitle>
              <Coins className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{walletSummary.totalTokens}</div>
              <p className="text-xs text-muted-foreground">
                {assetCreationHistory.length} created by you
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Transactions</CardTitle>
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{walletSummary.recentTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Recent activity
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Assets List */}
          <div className="xl:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="flex items-center">
                    Your Assets
                    <Badge variant="secondary" className="ml-2">{tokens.length}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedTokens.size > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBatchOperation('freeze');
                            setShowBatchDialog(true);
                          }}
                          className="text-xs"
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Batch Freeze ({selectedTokens.size})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBatchOperation('unfreeze');
                            setShowBatchDialog(true);
                          }}
                          className="text-xs"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Batch Unfreeze ({selectedTokens.size})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTokens(new Set())}
                          className="text-xs"
                        >
                          Clear Selection
                        </Button>
                      </>
                    )}
                    {tokens.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                      </Button>
                    )}
                  </div>
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
                      <div key={token.assetId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 glass-card hover:bg-muted/10 transition-colors cursor-pointer space-y-3 sm:space-y-0">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          {/* Batch Selection Checkbox */}
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-[#76f935] bg-gray-800 border-gray-600 rounded focus:ring-[#76f935] focus:ring-2"
                            checked={selectedTokens.has(token.assetId)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedTokens);
                              if (e.target.checked) {
                                newSelected.add(token.assetId);
                              } else {
                                newSelected.delete(token.assetId);
                              }
                              setSelectedTokens(newSelected);
                            }}
                          />
                          
                          <div className="flex-shrink-0">
                            {token.image ? (
                              <img 
                                src={token.image} 
                                alt={token.name} 
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                    <div class="w-10 h-10 sm:w-12 sm:h-12 algorand-card rounded-full flex items-center justify-center">
                                      <span class="text-[#76f935] font-bold text-sm">${token.symbol?.[0] || 'A'}</span>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 algorand-card rounded-full flex items-center justify-center">
                                <span className="text-[#76f935] font-bold text-sm">{token.symbol?.[0] || 'A'}</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-semibold text-foreground truncate">{token.name || `Asset #${token.assetId}`}</h3>
                              {token.verified && (
                                <Badge className="algorand-badge text-xs">Verified</Badge>
                              )}
                              {token.isFrozen && (
                                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs">Frozen</Badge>
                              )}
                              {getUserRole(token).length > 0 && (
                                <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 text-xs">
                                  {getUserRole(token)[0]}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <span className="truncate">{token.symbol || 'ASA'}</span>
                              <span className="mx-1">•</span>
                              <span className="truncate">ID: {token.assetId}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-sm sm:text-base">{token.uiBalance.toLocaleString()} {token.symbol}</p>
                            <p className="text-sm text-muted-foreground">{token.value || '$0.00'}</p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="flex-shrink-0">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canPerformAction(token, 'mint') && (
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
                              
                              {canPerformAction(token, 'burn') && (
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
                              
                              {canPerformAction(token, 'transfer') && (
                                <DropdownMenuItem onClick={() => {
                                  setSelectedToken(token);
                                  setShowTransferDialog(true);
                                  setActionError('');
                                  setActionSuccess('');
                                }}>
                                  <Send className="w-4 h-4 mr-2" />
                                  Transfer
                                </DropdownMenuItem>
                              )}
                              
                              {canPerformAction(token, 'freeze') && (
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
            
            {/* Created Assets Section */}
            {assetCreationHistory.length > 0 && (
              <Card className="glass-card mt-6">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                    <CardTitle className="flex items-center">
                      Assets Created by You
                      <Badge variant="secondary" className="ml-2">{assetCreationHistory.length}</Badge>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assetCreationHistory.slice(0, 5).map((asset) => (
                      <div key={asset.assetId} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 glass-card hover:bg-muted/10 transition-colors cursor-pointer space-y-3 sm:space-y-0">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#76f935] to-[#68e029] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-black font-bold text-sm">{asset.symbol?.[0] || 'A'}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-semibold text-foreground truncate">{asset.name}</h3>
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 text-xs">Creator</Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <span className="truncate">{asset.symbol}</span>
                              <span className="mx-1">•</span>
                              <span className="truncate">ID: {asset.assetId}</span>
                              <span className="mx-1">•</span>
                              <span className="truncate">Supply: {asset.totalSupply.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="text-left sm:text-right">
                            <p className="font-semibold text-sm sm:text-base">
                              {new Date(asset.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">Created</p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="flex-shrink-0">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyToClipboard(asset.assetId.toString())}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Asset ID
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => window.open(asset.explorerUrl, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View on Explorer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    
                    {assetCreationHistory.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs text-[#76f935] hover:text-[#68e029]">
                          View All Created Assets ({assetCreationHistory.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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

            {/* Market Data */}
            {marketData && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-[#76f935]" />
                    Algorand Market Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ALGO Price</span>
                      <span className="font-semibold">${marketData.algoPrice.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">24h Change</span>
                      <span className={`font-semibold ${marketData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {marketData.priceChange24h >= 0 ? '+' : ''}{marketData.priceChange24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Market Cap</span>
                      <span className="font-semibold">
                        ${(marketData.marketCap / 1000000000).toFixed(2)}B
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">24h Volume</span>
                      <span className="font-semibold">
                        ${(marketData.volume24h / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card className="glass-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                  {transactions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant={transactionFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTransactionFilter('all')}
                        className="text-xs h-7"
                      >
                        All ({transactions.length})
                      </Button>
                      <Button
                        variant={transactionFilter === 'send' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTransactionFilter('send')}
                        className="text-xs h-7"
                      >
                        Sent
                      </Button>
                      <Button
                        variant={transactionFilter === 'receive' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTransactionFilter('receive')}
                        className="text-xs h-7"
                      >
                        Received
                      </Button>
                      <Button
                        variant={transactionFilter === 'asset-transfer' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTransactionFilter('asset-transfer')}
                        className="text-xs h-7"
                      >
                        Assets
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {transactionLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg"></div>
                    ))}
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTransactions.slice(0, 5).map((tx) => {
                      // Format for display
                      const displayTx = formatAlgorandTransactionForDisplay(tx);
                      const category = categorizeTransaction(tx);
                      const isOutgoing = category === 'send';
                      
                      return (
                        <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 glass-card hover:bg-muted/10 transition-colors space-y-2 sm:space-y-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isOutgoing 
                                ? 'bg-red-500/20 text-red-500' 
                                : category === 'receive'
                                ? 'bg-green-500/20 text-green-500'
                                : tx.type.includes('Asset') 
                                ? 'bg-[#76f935]/20 text-[#76f935]' 
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                              {isOutgoing ? (
                                <Send className="w-4 h-4" />
                              ) : category === 'receive' ? (
                                <Activity className="w-4 h-4 rotate-180" />
                              ) : tx.type.includes('Config') ? (
                                <Settings className="w-4 h-4" />
                              ) : (
                                <MessageSquare className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{displayTx.type}</p>
                                <Badge className={`text-xs px-2 py-0 h-5 ${
                                  isOutgoing 
                                    ? 'bg-red-500/20 text-red-500 border-red-500/30'
                                    : category === 'receive'
                                    ? 'bg-green-500/20 text-green-500 border-green-500/30'
                                    : 'algorand-badge'
                                }`}>
                                  {isOutgoing ? 'Sent' : category === 'receive' ? 'Received' : displayTx.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{displayTx.time}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className={`font-medium text-sm ${
                              isOutgoing ? 'text-red-500' : category === 'receive' ? 'text-green-500' : ''
                            }`}>
                              {isOutgoing ? '-' : category === 'receive' ? '+' : ''}{displayTx.amount}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {filteredTransactions.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs text-[#76f935] hover:text-[#68e029]">
                          View All Transactions ({filteredTransactions.length})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No transactions found</p>
                    <p className="text-xs text-muted-foreground mt-1">Try selecting a different filter</p>
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

        {/* Batch Operations Dialog */}
        <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Batch {batchOperation && batchOperation.charAt(0).toUpperCase() + batchOperation.slice(1)} Assets</DialogTitle>
              <DialogDescription>
                {batchOperation === 'freeze' 
                  ? `Freeze ${selectedTokens.size} selected asset(s). This will prevent all transfers until unfrozen.`
                  : `Unfreeze ${selectedTokens.size} selected asset(s). This will allow transfers again.`
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
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-700 mb-2">Selected Assets ({selectedTokens.size})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Array.from(selectedTokens).map(assetId => {
                    const token = tokens.find(t => t.assetId === assetId);
                    return token ? (
                      <div key={assetId} className="flex items-center gap-3 p-2 bg-white/50 rounded">
                        <div className="w-6 h-6 bg-gradient-to-br from-[#76f935] to-[#68e029] rounded-full flex items-center justify-center">
                          <span className="text-black font-bold text-xs">{token.symbol?.[0] || 'A'}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{token.name}</p>
                          <p className="text-xs text-muted-foreground">{token.symbol} • ID: {assetId}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-semibold mb-1">Batch Operation Warning:</p>
                    <p>This operation will be applied to all selected assets. Each operation requires wallet approval and network fees. The process may take several minutes to complete.</p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleBatchOperation}
                disabled={selectedTokens.size === 0 || loading}
                variant={batchOperation === 'freeze' ? "secondary" : "default"}
                className={batchOperation === 'freeze' ? "" : "bg-[#76f935] hover:bg-[#68e029] text-black"}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {batchOperation === 'freeze' ? 'Freeze' : 'Unfreeze'} {selectedTokens.size} Asset(s)
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
      
      {/* Advanced Analytics Section */}
      {tokens.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="glass-card">
            <CardHeader className="bg-gradient-to-r from-[#76f935]/10 to-[#68e029]/10 border-b border-[#76f935]/30">
              <CardTitle className="text-[#76f935] flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Advanced Portfolio Analytics
              </CardTitle>
              <CardDescription className="text-[#68e029]">
                Detailed insights and performance tracking for your Algorand portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {analyticsLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className="h-64 bg-muted/20 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Portfolio Value Chart */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-[#76f935]" />
                        Portfolio Performance (30 Days)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={portfolioHistory}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Portfolio Value']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#76f935" 
                            strokeWidth={2}
                            dot={{ fill: '#76f935', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-[#76f935]" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg">
                          <span className="text-sm font-medium">Total Return</span>
                          <div className="text-right">
                            <div className={`font-bold ${performanceMetrics.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              ${performanceMetrics.totalReturn.toFixed(2)}
                            </div>
                            <div className={`text-xs ${performanceMetrics.totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {performanceMetrics.totalReturnPercent >= 0 ? '+' : ''}{performanceMetrics.totalReturnPercent.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                          <span className="text-sm font-medium">Avg Transaction Value</span>
                          <span className="font-bold">${performanceMetrics.avgTransactionValue.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                          <span className="text-sm font-medium">Transaction Frequency</span>
                          <span className="font-bold">{performanceMetrics.transactionFrequency.toFixed(1)}/day</span>
                        </div>
                        
                        {performanceMetrics.bestPerformingAsset && (
                          <div className="p-3 bg-green-500/10 rounded-lg">
                            <div className="text-sm font-medium text-green-700 mb-1">Best Performing Asset</div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{performanceMetrics.bestPerformingAsset.symbol}</span>
                              <Badge className="bg-green-500/20 text-green-700">Top Performer</Badge>
                            </div>
                          </div>
                        )}
                        
                        {performanceMetrics.worstPerformingAsset && (
                          <div className="p-3 bg-red-500/10 rounded-lg">
                            <div className="text-sm font-medium text-red-700 mb-1">Needs Attention</div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{performanceMetrics.worstPerformingAsset.symbol}</span>
                              <Badge className="bg-red-500/20 text-red-700">Review</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Transaction Activity Chart */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-[#76f935]" />
                        Transaction Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={transactions.slice(0, 10).map((tx, index) => ({
                          name: `Tx ${index + 1}`,
                          amount: parseFloat(tx.amount) || 0,
                          type: tx.type
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value: number) => [`${value.toFixed(4)}`, 'Amount']} />
                          <Bar dataKey="amount" fill="#76f935" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Asset Allocation Breakdown */}
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Coins className="w-5 h-5 mr-2 text-[#76f935]" />
                        Asset Allocation Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {tokens.slice(0, 5).map((token, index) => {
                          const percentage = tokens.length > 0 ? (token.uiBalance / tokens.reduce((sum, t) => sum + t.uiBalance, 0)) * 100 : 0;
                          return (
                            <div key={token.assetId} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: [
                                  '#76f935', '#00d4aa', '#3498db', '#9b59b6', '#e67e22'
                                ][index % 5] }}></div>
                                <span className="font-medium text-sm">{token.symbol}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-sm">{percentage.toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground">{token.uiBalance.toLocaleString()}</div>
                              </div>
                            </div>
                          );
                        })}
                        {tokens.length > 5 && (
                          <div className="text-center pt-2">
                            <span className="text-xs text-muted-foreground">
                              +{tokens.length - 5} more assets
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Token Management Section for Asset Creators */}
      {tokens.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-[#76f935]/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#76f935]/10 to-[#68e029]/10 border-b border-[#76f935]/30">
              <CardTitle className="text-[#76f935] flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Asset Management Center
              </CardTitle>
              <CardDescription className="text-[#68e029]">
                Manage your Algorand Standard Assets (ASA) with advanced controls
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokens.map((token) => (
                  <Card key={token.assetId} className="border-[#76f935]/20 hover:border-[#76f935]/40 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {token.image ? (
                            <img 
                              src={token.image} 
                              alt={token.symbol} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-[#76f935] to-[#68e029] rounded-full flex items-center justify-center">
                              <span className="text-black font-bold text-xs">
                                {token.symbol?.charAt(0) || 'A'}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-foreground">{token.symbol}</h3>
                            <p className="text-sm text-muted-foreground">{token.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {token.assetId}</p>
                          </div>
                        </div>
                        <Badge variant={token.isFrozen ? "destructive" : "default"}>
                          {token.isFrozen ? "Frozen" : "Active"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Balance:</span>
                          <p className="font-medium">{token.uiBalance?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Decimals:</span>
                          <p className="font-medium">{token.decimals}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setShowMintDialog(true);
                            setActionError('');
                            setActionSuccess('');
                          }}
                          className="flex-1 border-green-200 text-green-700 hover:bg-green-50"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Mint
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setShowBurnDialog(true);
                            setActionError('');
                            setActionSuccess('');
                          }}
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Flame className="w-3 h-3 mr-1" />
                          Burn
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedToken(token);
                            setShowTransferDialog(true);
                            setActionError('');
                            setActionSuccess('');
                          }}
                          className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const explorerUrl = selectedNetwork === 'algorand-mainnet' 
                              ? `https://algoexplorer.io/asset/${token.assetId}`
                              : `https://testnet.algoexplorer.io/asset/${token.assetId}`;
                            window.open(explorerUrl, '_blank');
                          }}
                          className="border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Section */}
      {tokens.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="border-[#76f935]/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#76f935]/10 to-[#68e029]/10 border-b border-[#76f935]/30">
              <CardTitle className="text-[#76f935] flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Portfolio Analytics
              </CardTitle>
              <CardDescription className="text-[#68e029]">
                Basic analytics for your Algorand asset portfolio
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600">Total Assets</p>
                        <p className="text-2xl font-bold text-green-800">{tokens.length}</p>
                      </div>
                      <Coins className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600">ALGO Balance</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {walletSummary.algoBalance.toFixed(2)}
                        </p>
                      </div>
                      <Wallet className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Transactions</p>
                        <p className="text-2xl font-bold text-purple-800">
                          {transactions.length}
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Distribution Chart */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Asset Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                              '#76f935', '#68e029', '#5dd41f', '#52c715', '#47ba0b', '#3cad01'
                            ][index % 6]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              tx.type === 'asset-transfer' ? 'bg-blue-500' :
                              tx.type === 'payment' ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-sm font-medium capitalize">
                              {tx.type.replace('-', ' ')}
                            </span>
                            <span className="text-sm text-muted-foreground">{tx.amount}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                      {transactions.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
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