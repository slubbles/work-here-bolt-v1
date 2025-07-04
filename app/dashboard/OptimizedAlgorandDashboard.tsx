'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown,
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
  ArrowDownRight
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
  getAlgorandEnhancedTokenInfo, 
  getAlgorandTransactionHistory, 
  getAlgorandWalletSummary,
  AlgorandTokenInfo,
  AlgorandTransactionInfo,
  formatAlgorandTransactionForDisplay
} from '@/lib/algorand-data';
import { useToast } from '@/hooks/use-toast';

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

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
  const [showHiddenAssets, setShowHiddenAssets] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'balance'>('value');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Wallet integration
  const { connected, address, selectedNetwork, balance } = useAlgorandWallet();
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
    }
  }, [connected, address, selectedNetwork]);

  // Computed values
  const filteredTokens = useMemo(() => {
    let filtered = userTokens.filter(token => 
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!showHiddenAssets) {
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
  }, [userTokens, searchQuery, showHiddenAssets, sortBy]);

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
        color: COLORS[index % COLORS.length]
      };
    }).filter(item => item.value > 0).slice(0, 8);
  }, [userTokens]);

  const chartData: ChartData[] = useMemo(() => {
    // Generate mock historical data for demo
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <CardTitle className="text-2xl text-white">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-300 mb-6">
              Connect your Algorand wallet to view your portfolio and manage your assets.
            </p>
            <Button className="w-full">
              Connect Pera Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Algorand Dashboard
            </h1>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-sm">Wallet:</span>
              <code className="bg-white/10 px-2 py-1 rounded text-xs">
                {address?.slice(0, 8)}...{address?.slice(-8)}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => copyToClipboard(address || '')}
                className="h-6 w-6 p-0 text-slate-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-400 border-green-400/50">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
              {selectedNetwork.replace('algorand-', '').toUpperCase()}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Total Value</p>
                  <p className="text-2xl font-bold text-white">
                    ${walletSummary?.totalValue?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <div className="flex items-center mt-2 text-xs">
                <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                <span className="text-green-400">+2.5% today</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">ALGO Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {walletSummary?.algoBalance?.toFixed(4) || '0.0000'}
                  </p>
                </div>
                <Coins className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex items-center mt-2 text-xs">
                <span className="text-slate-400">≈ ${(walletSummary?.algoBalance * 0.175)?.toFixed(2) || '0.00'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Assets</p>
                  <p className="text-2xl font-bold text-white">
                    {filteredTokens.length}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <div className="flex items-center mt-2 text-xs">
                <span className="text-slate-400">{userTokens.length} total</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-medium">Transactions</p>
                  <p className="text-2xl font-bold text-white">
                    {walletSummary?.recentTransactions || 0}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-orange-400" />
              </div>
              <div className="flex items-center mt-2 text-xs">
                <span className="text-slate-400">Last 30 days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-lg border-white/20 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
              Assets
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
              Transactions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Portfolio Chart */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Portfolio Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          fill="url(#valueGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Asset Allocation */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
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
                            backgroundColor: '#1e293b', 
                            border: '1px solid #334155',
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Top Assets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTokens.slice(0, 5).map((token, index) => (
                    <div key={token.assetId} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold">
                          {token.symbol.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{token.name}</p>
                          <p className="text-slate-400 text-sm">{token.symbol}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">{token.uiBalance.toFixed(4)}</p>
                        <p className="text-slate-400 text-sm">{token.value}</p>
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
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder-slate-400"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-white/20 text-white">
                          <Filter className="w-4 h-4 mr-2" />
                          Sort: {sortBy}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-600">
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
                      className="border-white/20 text-white"
                    >
                      {showHiddenAssets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>

                    <div className="flex border border-white/20 rounded-md overflow-hidden">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="rounded-none border-0"
                      >
                        <Grid className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="rounded-none border-0"
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
                  <Card key={token.assetId} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{token.name}</h3>
                            <p className="text-slate-400 text-sm">{token.symbol}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Balance</span>
                          <span className="text-white font-medium">{token.uiBalance.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Value</span>
                          <span className="text-white font-medium">{token.value}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Change</span>
                          <span className={`font-medium ${token.change?.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                            {token.change}
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
      </div>
    </div>
  );
}
