'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Settings, 
  ExternalLink,
  Copy,
  Send,
  BarChart3,
  Wallet,
  ArrowRight,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Star,
  Grid,
  List,
  Activity,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  getAlgorandEnhancedTokenInfo, 
  getAlgorandTransactionHistory, 
  getAlgorandWalletSummary,
  AlgorandTokenInfo,
  AlgorandTransactionInfo,
  formatAlgorandTransactionForDisplay
} from '@/lib/algorand-data';
import { 
  mintAlgorandAssets, 
  burnAlgorandAssets, 
  updateAlgorandAssetMetadata 
} from '@/lib/algorand';
import { useToast } from '@/hooks/use-toast';

// Snarbles brand colors
const SNARBLES_COLORS = {
  primary: '#ef4444', // Red from Snarbles brand
  secondary: '#8b5cf6', // Purple accent
  accent: '#06b6d4', // Cyan
  success: '#10b981', // Green
  warning: '#f59e0b', // Amber
  chart: ['#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#84cc16', '#6366f1']
};

interface PortfolioData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ChartData {
  date: string;
  value: number;
  volume: number;
}

export default function OptimizedAlgorandDashboard() {
  // Core states
  const [userTokens, setUserTokens] = useState<AlgorandTokenInfo[]>([]);
  const [transactionData, setTransactionData] = useState<AlgorandTransactionInfo[]>([]);
  const [walletSummary, setWalletSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI states
  const [selectedToken, setSelectedToken] = useState<AlgorandTokenInfo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showZeroBalance, setShowZeroBalance] = useState(false);
  const [showHiddenAssets, setShowHiddenAssets] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'balance'>('value');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Token management states
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [isUpdatingMetadata, setIsUpdatingMetadata] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  
  // Metadata form state
  const [tokenMetadata, setTokenMetadata] = useState({
    name: '',
    symbol: '',
    description: '',
    logoUrl: '',
    website: ''
  });
  
  const { connected, address, selectedNetwork, signTransaction } = useAlgorandWallet();
  const { toast } = useToast();

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    if (!address) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [tokensResult, transactionsResult, summaryResult] = await Promise.allSettled([
        getAlgorandEnhancedTokenInfo(address, selectedNetwork),
        getAlgorandTransactionHistory(address, 20, selectedNetwork),
        getAlgorandWalletSummary(address, selectedNetwork)
      ]);
      
      if (tokensResult.status === 'fulfilled' && tokensResult.value.success) {
        setUserTokens(tokensResult.value.data || []);
      }
      
      if (transactionsResult.status === 'fulfilled' && transactionsResult.value.success) {
        setTransactionData(transactionsResult.value.data || []);
      }
      
      if (summaryResult.status === 'fulfilled' && summaryResult.value.success) {
        setWalletSummary(summaryResult.value.data);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected && address) {
      fetchDashboardData();
    } else {
      setUserTokens([]);
      setTransactionData([]);
      setWalletSummary(null);
      setSelectedToken(null);
      setIsLoading(false);
    }
  }, [connected, address, selectedNetwork]);

  // Computed values
  const filteredTokens = useMemo(() => {
    let filtered = userTokens.filter(token => 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!showZeroBalance) {
      filtered = filtered.filter(token => token.uiBalance > 0);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return (parseFloat(b.value?.replace('$', '') || '0')) - (parseFloat(a.value?.replace('$', '') || '0'));
        case 'name':
          return a.name.localeCompare(b.name);
        case 'balance':
          return b.uiBalance - a.uiBalance;
        default:
          return 0;
      }
    });
  }, [userTokens, searchQuery, showZeroBalance, sortBy]);

  const portfolioData: PortfolioData[] = useMemo(() => {
    if (!userTokens.length) return [];
    
    const totalValue = userTokens.reduce((sum, token) => 
      sum + parseFloat(token.value?.replace('$', '') || '0'), 0
    );
    
    return userTokens.map((token, index) => {
      const value = parseFloat(token.value?.replace('$', '') || '0');
      return {
        name: token.symbol,
        value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: SNARBLES_COLORS.chart[index % SNARBLES_COLORS.chart.length]
      };
    }).filter(item => item.value > 0).slice(0, 8);
  }, [userTokens]);

  const chartData: ChartData[] = useMemo(() => {
    const days = 30;
    const baseValue = walletSummary?.totalValue || 100;
    
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const variance = Math.sin(i * 0.3) * 0.1 + Math.random() * 0.1 - 0.05;
      const value = baseValue * (1 + variance);
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Number(value.toFixed(2)),
        volume: Math.random() * 1000 + 500
      };
    });
  }, [walletSummary]);

  // Token management functions
  const handleMintTokens = async () => {
    if (!selectedToken || !mintAmount || !signTransaction || !address) return;
    
    try {
      setIsMinting(true);
      const result = await mintAlgorandAssets(
        address,
        selectedToken.assetId,
        parseInt(mintAmount),
        signTransaction,
        selectedNetwork
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully minted ${mintAmount} ${selectedToken.symbol} tokens`,
        });
        setMintAmount('');
        setShowMintDialog(false);
        fetchDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to mint tokens',
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!selectedToken || !burnAmount || !signTransaction || !address) return;
    
    try {
      setIsBurning(true);
      const result = await burnAlgorandAssets(
        address,
        selectedToken.assetId,
        parseInt(burnAmount),
        signTransaction,
        selectedNetwork
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully burned ${burnAmount} ${selectedToken.symbol} tokens`,
        });
        setBurnAmount('');
        setShowBurnDialog(false);
        fetchDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to burn tokens',
        variant: "destructive",
      });
    } finally {
      setIsBurning(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!selectedToken || !signTransaction || !address) return;
    
    try {
      setIsUpdatingMetadata(true);
      const result = await updateAlgorandAssetMetadata(
        address,
        selectedToken.assetId,
        tokenMetadata,
        signTransaction,
        selectedNetwork
      );
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully updated metadata for ${selectedToken.symbol}`,
        });
        setShowMetadataDialog(false);
        fetchDashboardData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update metadata',
        variant: "destructive",
      });
    } finally {
      setIsUpdatingMetadata(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
    toast({
      title: "Dashboard Refreshed",
      description: "All data has been updated",
      duration: 3000
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Address copied to clipboard",
        duration: 2000
      });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center p-6">
        <div className="glass-card w-full max-w-md p-8 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your Algorand wallet to view your portfolio and manage your assets.
          </p>
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            Connect Pera Wallet
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen app-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Loading header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          </div>
          
          {/* Loading stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card p-6">
                <div className="space-y-3">
                  <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Algorand Dashboard
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-sm">Wallet:</span>
              <code className="glass-card px-3 py-1 rounded text-xs font-mono border-red-500/20">
                {address?.slice(0, 8)}...{address?.slice(-8)}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(address || '')}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-red-500/50 text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
              {selectedNetwork.replace('algorand-', '').toUpperCase()}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/create">
              <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Asset
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${walletSummary?.totalValue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs">
              <TrendingUp className="w-3 h-3 text-red-500 mr-1" />
              <span className="text-red-500">+2.5% today</span>
            </div>
          </div>

          <div className="glass-card p-6 border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">ALGO Balance</p>
                <p className="text-2xl font-bold text-foreground">
                  {walletSummary?.algoBalance?.toFixed(4) || '0.0000'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-muted-foreground">≈ ${((walletSummary?.algoBalance || 0) * 0.175).toFixed(2)}</span>
            </div>
          </div>

          <div className="glass-card p-6 border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Assets</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredTokens.length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-cyan-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-muted-foreground">{userTokens.length} total</span>
            </div>
          </div>

          <div className="glass-card p-6 border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Transactions</p>
                <p className="text-2xl font-bold text-foreground">
                  {walletSummary?.recentTransactions || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="flex items-center mt-2 text-xs">
              <span className="text-muted-foreground">Last 30 days</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card border-red-500/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
              Overview
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
              Assets
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500">
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Portfolio Chart */}
              <Card className="glass-card border-red-500/20">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-500" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          fill="url(#valueGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Allocation */}
              <Card className="glass-card border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-purple-500" />
                    Asset Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={portfolioData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {portfolioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }} 
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {portfolioData.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-slate-300 truncate">
                          {item.name} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Assets */}
            <Card className="glass-card border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Star className="w-5 h-5 text-cyan-500" />
                  Top Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTokens.slice(0, 5).map((token, index) => (
                    <div 
                      key={token.assetId} 
                      className="flex items-center justify-between p-4 rounded-lg glass-card border-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                      onClick={() => setSelectedToken(token)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="text-foreground font-semibold">{token.name}</p>
                          <p className="text-muted-foreground text-sm">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-foreground font-bold">{token.uiBalance.toFixed(4)}</p>
                        <p className="text-muted-foreground text-sm">{token.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            {/* Search and Filter Bar */}
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 glass-card border-red-500/20 text-foreground placeholder-muted-foreground"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-red-500/30 text-red-500 hover:bg-red-500/10">
                          <Filter className="w-4 h-4 mr-2" />
                          Sort: {sortBy}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="glass-card border-red-500/30">
                        <DropdownMenuItem onClick={() => setSortBy('value')}>
                          By Value
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('name')}>
                          By Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy('balance')}>
                          By Balance
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHiddenAssets(!showHiddenAssets)}
                      className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                    >
                      {showHiddenAssets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>

                    <div className="flex border border-cyan-500/30 rounded-md overflow-hidden">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-none border-0 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-500"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-none border-0 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-500"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assets Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTokens.map((token) => (
                  <Card 
                    key={token.assetId} 
                    className="glass-card border-red-500/10 hover:border-red-500/30 transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedToken(token);
                      setShowTokenDialog(true);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-foreground font-semibold">{token.name}</h3>
                            <p className="text-muted-foreground text-sm">{token.symbol}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Toggle favorite logic here
                          }}
                        >
                          <Star className="w-4 h-4 text-muted-foreground hover:text-yellow-500" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance</span>
                          <span className="text-foreground font-medium">{token.uiBalance.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Value</span>
                          <span className="text-foreground font-medium">{token.value}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Change</span>
                          <span className={`font-medium ${token.change?.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                            {token.change || '+0.00%'}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button size="sm" className="flex-1">
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-0">
                  <div className="divide-y divide-white/10">
                    {filteredTokens.map((token) => (
                      <div key={token.assetId} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{token.name}</h3>
                            <p className="text-slate-400 text-sm">{token.symbol}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-white font-medium">{token.uiBalance.toFixed(4)}</p>
                            <p className="text-slate-400 text-sm">Balance</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{token.value}</p>
                            <p className={`text-sm ${token.change?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                              {token.change}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-white/20 text-white">
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-white/20 text-white">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Portfolio Performance */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Portfolio Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }} 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fill="url(#performanceGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Trading Volume */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Trading Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }} 
                        />
                        <Bar dataKey="volume" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analytics Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6 text-center">
                  <ArrowUpRight className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">+12.5%</p>
                  <p className="text-slate-400 text-sm">30-day return</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">0.85</p>
                  <p className="text-slate-400 text-sm">Sharpe ratio</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="p-6 text-center">
                  <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">-8.2%</p>
                  <p className="text-slate-400 text-sm">Max drawdown</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionData.slice(0, 10).map((tx, index) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'Payment' ? 'bg-green-400/20 text-green-400' :
                          tx.type === 'Asset Transfer' ? 'bg-blue-400/20 text-blue-400' :
                          'bg-purple-400/20 text-purple-400'
                        }`}>
                          {tx.type === 'Payment' ? <Send className="w-5 h-5" /> :
                           tx.type === 'Asset Transfer' ? <ArrowRight className="w-5 h-5" /> :
                           <Settings className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.type}</p>
                          <p className="text-slate-400 text-sm">
                            {formatDistanceToNow(new Date(tx.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-white font-medium">{tx.amount} {tx.token}</p>
                        <Badge 
                          variant={tx.status === 'confirmed' ? 'default' : 'secondary'}
                          className={tx.status === 'confirmed' ? 'bg-green-400/20 text-green-400' : ''}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Token Management Dialogs */}
        {selectedToken && (
          <>
            {/* Mint Dialog */}
            <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
              <DialogContent className="glass-card border-red-500/20">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Mint {selectedToken.symbol} Tokens</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Create new tokens for asset ID {selectedToken.assetId}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mint-amount">Amount to Mint</Label>
                    <Input
                      id="mint-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      className="glass-card border-red-500/20"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMintDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleMintTokens}
                    disabled={isMinting || !mintAmount}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    {isMinting ? 'Minting...' : 'Mint Tokens'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Burn Dialog */}
            <Dialog open={showBurnDialog} onOpenChange={setShowBurnDialog}>
              <DialogContent className="glass-card border-red-500/20">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Burn {selectedToken.symbol} Tokens</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Permanently destroy tokens from circulation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="burn-amount">Amount to Burn</Label>
                    <Input
                      id="burn-amount"
                      type="number"
                      placeholder="Enter amount"
                      value={burnAmount}
                      onChange={(e) => setBurnAmount(e.target.value)}
                      className="glass-card border-red-500/20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: {selectedToken.uiBalance.toFixed(4)} {selectedToken.symbol}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBurnDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBurnTokens}
                    disabled={isBurning || !burnAmount}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    {isBurning ? 'Burning...' : 'Burn Tokens'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Metadata Update Dialog */}
            <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
              <DialogContent className="glass-card border-red-500/20 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Update {selectedToken.symbol} Metadata</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Modify asset information and properties
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metadata-name">Asset Name</Label>
                    <Input
                      id="metadata-name"
                      placeholder="Asset name"
                      value={tokenMetadata.name}
                      onChange={(e) => setTokenMetadata(prev => ({ ...prev, name: e.target.value }))}
                      className="glass-card border-red-500/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metadata-symbol">Symbol</Label>
                    <Input
                      id="metadata-symbol"
                      placeholder="Symbol"
                      value={tokenMetadata.symbol}
                      onChange={(e) => setTokenMetadata(prev => ({ ...prev, symbol: e.target.value }))}
                      className="glass-card border-red-500/20"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="metadata-description">Description</Label>
                    <Input
                      id="metadata-description"
                      placeholder="Asset description"
                      value={tokenMetadata.description}
                      onChange={(e) => setTokenMetadata(prev => ({ ...prev, description: e.target.value }))}
                      className="glass-card border-red-500/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metadata-logo">Logo URL</Label>
                    <Input
                      id="metadata-logo"
                      placeholder="https://..."
                      value={tokenMetadata.logoUrl}
                      onChange={(e) => setTokenMetadata(prev => ({ ...prev, logoUrl: e.target.value }))}
                      className="glass-card border-red-500/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="metadata-website">Website</Label>
                    <Input
                      id="metadata-website"
                      placeholder="https://..."
                      value={tokenMetadata.website}
                      onChange={(e) => setTokenMetadata(prev => ({ ...prev, website: e.target.value }))}
                      className="glass-card border-red-500/20"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMetadataDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateMetadata}
                    disabled={isUpdatingMetadata}
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  >
                    {isUpdatingMetadata ? 'Updating...' : 'Update Metadata'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Token Details Dialog */}
            <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
              <DialogContent className="glass-card border-red-500/20 max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="gradient-text flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {selectedToken.symbol.charAt(0)}
                    </div>
                    {selectedToken.name} ({selectedToken.symbol})
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Asset ID: {selectedToken.assetId}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Asset Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-4 border-red-500/10">
                      <p className="text-muted-foreground text-sm">Balance</p>
                      <p className="text-2xl font-bold text-foreground">{selectedToken.uiBalance.toFixed(4)}</p>
                    </div>
                    <div className="glass-card p-4 border-purple-500/10">
                      <p className="text-muted-foreground text-sm">Value</p>
                      <p className="text-2xl font-bold text-foreground">{selectedToken.value}</p>
                    </div>
                    <div className="glass-card p-4 border-cyan-500/10">
                      <p className="text-muted-foreground text-sm">Change</p>
                      <p className="text-2xl font-bold text-foreground">{selectedToken.change || '+0.00%'}</p>
                    </div>
                  </div>

                  {/* Management Actions */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Token Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Button 
                        onClick={() => setShowMintDialog(true)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Mint Tokens
                      </Button>
                      <Button 
                        onClick={() => setShowBurnDialog(true)}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Burn Tokens
                      </Button>
                      <Button 
                        onClick={() => setShowMetadataDialog(true)}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Update Metadata
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button variant="outline" className="border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10">
                        <Send className="w-4 h-4 mr-2" />
                        Transfer
                      </Button>
                      <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTokenDialog(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
