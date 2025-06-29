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
  getEnhancedTokenInfo,
  getWalletTransactionHistory, 
  getWalletSummary
} from '@/lib/solana-data';
import { mintTokens, burnTokens, transferTokens } from '@/lib/solana';
import { useToast } from '@/hooks/use-toast';

interface TokenData {
  address: string;
  name: string;
  symbol: string;
  balance: number;
  value: number;
  change24h: number;
  supply: number;
  holders: number;
  verified: boolean;
  createdAt: Date;
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
  
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [walletSummary, setWalletSummary] = useState({
    totalValue: 0,
    tokenCount: 0,
    totalTransactions: 0,
    change24h: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showBurnDialog, setShowBurnDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [actionAmount, setActionAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockTokens: TokenData[] = [
    {
      address: '11111111111111111111111111111112',
      name: 'Sample Token',
      symbol: 'SMPL',
      balance: 1000,
      value: 250.50,
      change24h: 5.2,
      supply: 1000000,
      holders: 157,
      verified: true,
      createdAt: new Date(Date.now() - 86400000 * 7)
    },
    {
      address: '22222222222222222222222222222223',
      name: 'Demo Coin',
      symbol: 'DEMO',
      balance: 500,
      value: 125.75,
      change24h: -2.1,
      supply: 500000,
      holders: 89,
      verified: false,
      createdAt: new Date(Date.now() - 86400000 * 14)
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      signature: 'abc123def456',
      type: 'mint',
      amount: 100,
      timestamp: new Date(Date.now() - 3600000),
      status: 'confirmed',
      to: publicKey?.toString() || ''
    },
    {
      signature: 'def456ghi789',
      type: 'transfer',
      amount: 50,
      timestamp: new Date(Date.now() - 7200000),
      status: 'confirmed',
      from: publicKey?.toString() || '',
      to: '33333333333333333333333333333334'
    }
  ];

  const chartData = [
    { name: 'Jan', value: 400 },
    { name: 'Feb', value: 300 },
    { name: 'Mar', value: 600 },
    { name: 'Apr', value: 800 },
    { name: 'May', value: 700 },
    { name: 'Jun', value: 900 }
  ];

  useEffect(() => {
    if (connected && publicKey) {
      loadDashboardData();
    }
  }, [connected, publicKey]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In a real implementation, these would be actual API calls
      setTokens(mockTokens);
      setTransactions(mockTransactions);
      setWalletSummary({
        totalValue: mockTokens.reduce((sum, token) => sum + token.value, 0),
        tokenCount: mockTokens.length,
        totalTransactions: mockTransactions.length,
        change24h: 3.5
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Dashboard data refreshed"
    });
  };

  const handleMintTokens = async () => {
    if (!selectedToken || !actionAmount) return;
    
    try {
      setLoading(true);
      await mintTokens(new PublicKey(selectedToken.address), parseFloat(actionAmount));
      toast({
        title: "Success",
        description: `Minted ${actionAmount} ${selectedToken.symbol} tokens`
      });
      setShowMintDialog(false);
      setActionAmount('');
      await loadDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mint tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBurnTokens = async () => {
    if (!selectedToken || !actionAmount) return;
    
    try {
      setLoading(true);
      await burnTokens(new PublicKey(selectedToken.address), parseFloat(actionAmount));
      toast({
        title: "Success",
        description: `Burned ${actionAmount} ${selectedToken.symbol} tokens`
      });
      setShowBurnDialog(false);
      setActionAmount('');
      await loadDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to burn tokens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransferTokens = async () => {
    if (!selectedToken || !actionAmount || !transferRecipient) return;
    
    try {
      setLoading(true);
      await transferTokens(
        new PublicKey(selectedToken.address), 
        new PublicKey(transferRecipient),
        parseFloat(actionAmount)
      );
      toast({
        title: "Success",
        description: `Transferred ${actionAmount} ${selectedToken.symbol} tokens`
      });
      setShowTransferDialog(false);
      setActionAmount('');
      setTransferRecipient('');
      await loadDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer tokens",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
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
              <div className="text-2xl font-bold">${walletSummary.totalValue.toFixed(2)}</div>
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
                Unique token types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{walletSummary.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">
                Total transactions
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
                <CardTitle className="flex items-center justify-between">
                  Your Tokens
                  <Badge variant="secondary">{tokens.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tokens.map((token) => (
                      <div key={token.address} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Coins className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{token.name}</h3>
                              {token.verified && <Shield className="w-4 h-4 text-green-600" />}
                            </div>
                            <p className="text-sm text-gray-600">{token.symbol}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-semibold">{token.balance.toLocaleString()} {token.symbol}</p>
                          <p className="text-sm text-gray-600">${token.value.toFixed(2)}</p>
                          <p className={`text-xs ${token.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {token.change24h >= 0 ? '+' : ''}{token.change24h}%
                          </p>
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
                            }}>
                              <Plus className="w-4 h-4 mr-2" />
                              Mint Tokens
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowBurnDialog(true);
                            }}>
                              <Flame className="w-4 h-4 mr-2" />
                              Burn Tokens
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedToken(token);
                              setShowTransferDialog(true);
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
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.signature} className="flex items-center justify-between p-3 border rounded-lg">
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
                        <p className="font-medium">{tx.amount}</p>
                        <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className="text-xs">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                Mint new {selectedToken?.symbol} tokens
              </DialogDescription>
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
      </div>
    </div>
  );
}