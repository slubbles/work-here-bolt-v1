'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Calendar,
  Wallet,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Globe,
  Twitter,
  Github,
  Edit3,
  Share2,
  Network
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  getTokenData, 
  transferTokens, 
  mintTokens, 
  burnTokens, 
  pauseToken, 
  unpauseToken,
  getTokenBalance,
  getSolBalance,
  connection,
  PROGRAM_ID
} from '@/lib/solana';
import { 
  getAlgorandAccountInfo,
  getAlgorandAssetInfo,
  transferAlgorandAsset,
  mintAlgorandTokens,
  burnAlgorandTokens,
  pauseAlgorandToken,
  unpauseAlgorandToken,
  ALGORAND_NETWORK_INFO,
  formatAlgorandAddress
} from '@/lib/algorand';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

interface Token {
  id: string;
  name: string;
  symbol: string;
  balance: string;
  value: string;
  change: string;
  holders: number;
  totalSupply: string;
  address: string;
  network: 'solana' | 'algorand';
  decimals: number;
  logoUrl?: string;
  website?: string;
  github?: string;
  twitter?: string;
  assetId?: number;
  contractAddress?: string;
  features?: {
    mintable?: boolean;
    burnable?: boolean;
    pausable?: boolean;
  };
  isPaused?: boolean;
}

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Solana wallet integration
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  
  // Algorand wallet integration
  const { connected: algorandConnected, address: algorandAddress } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadUserTokens();
    }
  }, [mounted, solanaConnected, algorandConnected, solanaPublicKey, algorandAddress]);

  const loadUserTokens = async () => {
    setLoading(true);
    setError('');
    
    try {
      const tokens: Token[] = [];
      
      // Load Solana tokens
      if (solanaConnected && solanaPublicKey) {
        const solanaTokens = await loadSolanaTokens();
        tokens.push(...solanaTokens);
      }
      
      // Load Algorand tokens
      if (algorandConnected && algorandAddress) {
        const algorandTokens = await loadAlgorandTokens();
        tokens.push(...algorandTokens);
      }
      
      setUserTokens(tokens);
    } catch (err) {
      console.error('Error loading tokens:', err);
      setError('Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const loadSolanaTokens = async (): Promise<Token[]> => {
    if (!solanaPublicKey) return [];
    
    try {
      // Get token accounts for the wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        solanaPublicKey,
        {
          programId: TOKEN_PROGRAM_ID
        }
      );

      const tokens: Token[] = [];
      
      for (const accountInfo of tokenAccounts.value) {
        const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount;
        const mintAddress = accountInfo.account.data.parsed.info.mint;
        
        // Skip if balance is 0
        if (tokenAmount.uiAmount === 0) continue;
        
        try {
          // Try to get token data from our smart contract
          const tokenDataResult = await getTokenData(mintAddress);
          
          if (tokenDataResult.success) {
            const tokenData = tokenDataResult.data;
            
            tokens.push({
              id: mintAddress,
              name: tokenData.name,
              symbol: tokenData.symbol,
              balance: tokenAmount.uiAmountString || '0',
              value: '$0.00', // Would need price data
              change: '+0.0%',
              holders: 1, // Would need to calculate
              totalSupply: (tokenData.totalSupply / Math.pow(10, tokenData.decimals)).toLocaleString(),
              address: mintAddress,
              contractAddress: mintAddress,
              network: 'solana',
              decimals: tokenData.decimals,
              logoUrl: tokenData.metadata?.logoUri,
              website: tokenData.metadata?.website || undefined,
              github: tokenData.metadata?.github || undefined,
              twitter: tokenData.metadata?.twitter || undefined,
              features: {
                mintable: tokenData.features?.canMint,
                burnable: tokenData.features?.canBurn,
                pausable: tokenData.features?.canPause
              },
              isPaused: tokenData.isPaused
            });
          }
        } catch (error) {
          console.log('Token not from our platform:', mintAddress);
          // For non-platform tokens, create basic info
          tokens.push({
            id: mintAddress,
            name: 'Unknown Token',
            symbol: 'UNK',
            balance: tokenAmount.uiAmountString || '0',
            value: '$0.00',
            change: '+0.0%',
            holders: 1,
            totalSupply: 'Unknown',
            address: mintAddress,
            contractAddress: mintAddress,
            network: 'solana',
            decimals: tokenAmount.decimals || 9
          });
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Error loading Solana tokens:', error);
      return [];
    }
  };

  const loadAlgorandTokens = async (): Promise<Token[]> => {
    if (!algorandAddress) return [];
    
    try {
      const accountInfo = await getAlgorandAccountInfo(algorandAddress);
      
      if (!accountInfo.success || !accountInfo.assets) {
        return [];
      }
      
      const tokens: Token[] = [];
      
      for (const asset of accountInfo.assets) {
        const assetId = asset['asset-id'];
        const amount = asset.amount;
        
        // Skip if balance is 0
        if (amount === 0) continue;
        
        try {
          const assetInfoResult = await getAlgorandAssetInfo(assetId);
          
          if (assetInfoResult.success) {
            const assetData = assetInfoResult.data;
            const decimals = assetData.decimals || 0;
            const balance = amount / Math.pow(10, decimals);
            
            tokens.push({
              id: assetId.toString(),
              name: assetData.assetName || 'Unknown Asset',
              symbol: assetData.unitName || 'UNK',
              balance: balance.toLocaleString(),
              value: '$0.00', // Would need price data
              change: '+0.0%',
              holders: 1, // Would need to calculate
              totalSupply: assetData.totalSupply ? (assetData.totalSupply / Math.pow(10, decimals)).toLocaleString() : 'Unknown',
              address: assetId.toString(),
              assetId: assetId,
              network: 'algorand',
              decimals: decimals,
              logoUrl: undefined, // Would need metadata
              features: {
                mintable: !!assetData.manager,
                burnable: !!assetData.manager,
                pausable: !!assetData.freeze
              }
            });
          }
        } catch (error) {
          console.log('Error getting asset info for:', assetId);
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Error loading Algorand tokens:', error);
      return [];
    }
  };

  const chartData = [
    { name: 'Jan', value: 1000 },
    { name: 'Feb', value: 1200 },
    { name: 'Mar', value: 1100 },
    { name: 'Apr', value: 1400 },
    { name: 'May', value: 1600 },
    { name: 'Jun', value: 1800 },
  ];

  const transactionData = [
    { type: 'Transfer', amount: '1,000 tokens', to: 'Demo...123', time: '2 hours ago', status: 'Completed' },
    { type: 'Mint', amount: '5,000 tokens', to: 'Community Pool', time: '1 day ago', status: 'Completed' },
    { type: 'Transfer', amount: '500 tokens', to: 'Demo...789', time: '2 days ago', status: 'Completed' },
  ];

  const handleTransfer = () => {
    if (!transferAmount || !transferAddress) {
      alert('Please fill in both amount and recipient address');
      return;
    }
    
    // Simulate transfer
    alert(`Successfully transferred ${transferAmount} ${userTokens[selectedToken]?.symbol} to ${transferAddress}`);
    setTransferAmount('');
    setTransferAddress('');
  };

  const getNetworkInfo = (network: string) => {
    switch (network) {
      case 'algorand':
        return { name: 'Algorand', color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30' };
      case 'solana':
        return { name: 'Solana', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      default:
        return { name: 'Unknown', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  const getExplorerUrl = (token: Token) => {
    if (token.network === 'algorand' && token.assetId) {
      return `${ALGORAND_NETWORK_INFO.explorer}/asset/${token.assetId}`;
    } else if (token.network === 'solana' && token.contractAddress) {
      return `https://explorer.solana.com/address/${token.contractAddress}?cluster=devnet`;
    }
    return '#';
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Redirect to wallet connection if not connected to any wallet
  if (!solanaConnected && !algorandConnected) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="glass-card p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground">
                You need to connect at least one wallet (Solana or Algorand) to access the dashboard and manage your tokens.
              </p>
            </div>
            <div className="text-center">
              <Link href="/" className="text-red-500 hover:text-red-600 text-sm inline-flex items-center">
                Back to Home
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Multi-Chain Dashboard</h1>
            <p className="text-muted-foreground">Manage tokens across Solana and Algorand networks</p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              {solanaConnected && solanaPublicKey && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-500">Solana: {solanaPublicKey.toString().slice(0, 4)}...{solanaPublicKey.toString().slice(-4)}</span>
                </div>
              )}
              {algorandConnected && algorandAddress && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-[#76f935] rounded-full animate-pulse"></div>
                  <span className="text-[#76f935]">Algorand: {formatAlgorandAddress(algorandAddress)}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={loadUserTokens}
              variant="outline"
              className="border-border text-muted-foreground hover:bg-muted"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/create">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create New Token
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Tokens</p>
                <p className="text-2xl font-bold text-foreground">{userTokens.length}</p>
              </div>
              <Coins className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Value</p>
                <p className="text-2xl font-bold text-foreground">$0.00</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Holders</p>
                <p className="text-2xl font-bold text-foreground">
                  {userTokens.reduce((sum, token) => sum + token.holders, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Networks</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(userTokens.map(t => t.network)).size}
                </p>
              </div>
              <Network className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading your tokens...</p>
          </div>
        ) : userTokens.length === 0 ? (
          <div className="text-center py-12">
            <div className="glass-card p-12 max-w-md mx-auto">
              <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No tokens found</h3>
              <p className="text-muted-foreground mb-6">
                Create your first token or ensure you have tokens in your connected wallets.
              </p>
              <Link href="/create">
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Token
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Token List */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Your Tokens</h2>
                <div className="space-y-4">
                  {userTokens.map((token, index) => {
                    const networkInfo = getNetworkInfo(token.network);
                    return (
                      <div 
                        key={token.id}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedToken === index 
                            ? 'bg-red-500/20 border border-red-500/50' 
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                        onClick={() => setSelectedToken(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                              {token.logoUrl ? (
                                <img src={token.logoUrl} alt={token.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                token.symbol.slice(0, 2)
                              )}
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{token.name}</p>
                              <p className="text-muted-foreground text-sm">{token.symbol}</p>
                            </div>
                          </div>
                          <Badge className={networkInfo.color}>
                            {networkInfo.name}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-foreground font-semibold">{token.balance}</p>
                            <p className="text-muted-foreground text-sm">{token.value}</p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {token.change}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Token Details */}
            <div className="lg:col-span-2">
              {userTokens[selectedToken] && (
                <Tabs defaultValue="overview" className="space-y-6">
                  {/* Enhanced Tab Navigation */}
                  <div className="glass-card p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Token Management</h3>
                      <p className="text-sm text-muted-foreground">Manage and analyze your token performance</p>
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
                    <div className="glass-card p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-foreground">{userTokens[selectedToken].name}</h3>
                          <p className="text-muted-foreground">{userTokens[selectedToken].symbol}</p>
                          <Badge className={getNetworkInfo(userTokens[selectedToken].network).color}>
                            {getNetworkInfo(userTokens[selectedToken].network).name}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border text-muted-foreground"
                            onClick={() => navigator.clipboard.writeText(userTokens[selectedToken].address)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border text-muted-foreground"
                            onClick={() => window.open(getExplorerUrl(userTokens[selectedToken]), '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Balance</p>
                          <p className="text-foreground font-bold">{userTokens[selectedToken].balance}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Value</p>
                          <p className="text-foreground font-bold">{userTokens[selectedToken].value}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Holders</p>
                          <p className="text-foreground font-bold">{userTokens[selectedToken].holders}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <p className="text-muted-foreground text-sm">Supply</p>
                          <p className="text-foreground font-bold">{userTokens[selectedToken].totalSupply}</p>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Price Chart</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                            <XAxis dataKey="name" stroke="currentColor" opacity={0.7} />
                            <YAxis stroke="currentColor" opacity={0.7} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'var(--background)', 
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)'
                              }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="analytics" className="space-y-6">
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Holder Distribution</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                            <XAxis dataKey="name" stroke="currentColor" opacity={0.7} />
                            <YAxis stroke="currentColor" opacity={0.7} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'var(--background)', 
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                color: 'var(--foreground)'
                              }}
                            />
                            <Bar dataKey="value" fill="#EF4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="transactions" className="space-y-6">
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h4>
                      <div className="space-y-4">
                        {transactionData.map((tx, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <Send className="w-4 h-4 text-red-400" />
                              </div>
                              <div>
                                <p className="text-foreground font-medium">{tx.type}</p>
                                <p className="text-muted-foreground text-sm">{tx.amount} to {tx.to}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-muted-foreground text-sm">{tx.time}</p>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="manage" className="space-y-6">
                    {/* Token Transfer */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Transfer Tokens</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="transferAddress" className="text-foreground font-medium">
                            Recipient Address
                          </Label>
                          <Input
                            id="transferAddress"
                            placeholder={`Enter ${userTokens[selectedToken].network === 'algorand' ? 'Algorand' : 'Solana'} address`}
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
                          className="bg-red-500 hover:bg-red-600 text-white w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Transfer {userTokens[selectedToken].symbol}
                        </Button>
                      </div>
                    </div>

                    {/* Other Management Actions */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Token Management</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userTokens[selectedToken].features?.mintable && (
                          <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                            <Plus className="w-4 h-4 mr-2" />
                            Mint Tokens
                          </Button>
                        )}
                        {userTokens[selectedToken].features?.burnable && (
                          <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                            <Flame className="w-4 h-4 mr-2" />
                            Burn Tokens
                          </Button>
                        )}
                        {userTokens[selectedToken].features?.pausable && (
                          <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                            {userTokens[selectedToken].isPaused ? (
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
                        )}
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}