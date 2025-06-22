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
  Calendar,
  Wallet,
  ArrowRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { PeraWalletConnect } from '@perawallet/connect';
import { getAlgorandAccountInfo, getAlgorandAssetInfo, ALGORAND_NETWORK_INFO } from '@/lib/algorand';

// Enhanced Token interface to support both Solana and Algorand
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
  network: 'solana' | 'algorand' | 'algorand-testnet' | 'algorand-mainnet';
  decimals?: number;
  creatorAddress?: string; // For Algorand ASAs
  managerAddress?: string; // For Algorand ASAs
  logoUri?: string;
  metadata?: {
    website?: string;
    github?: string;
    twitter?: string;
  };
  explorerUrl?: string;
}

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'solana' | 'algorand'>('solana');
  const [algorandWallet, setAlgorandWallet] = useState<string | null>(null);
  
  // Solana wallet integration
  const { connected: solanaConnected, publicKey } = useWallet();

  // Initialize Pera Wallet for Algorand
  const [peraWallet] = useState(() => new PeraWalletConnect());
  const [algorandConnected, setAlgorandConnected] = useState(false);
  const [algorandAddress, setAlgorandAddress] = useState<string | null>(null);
  const [algorandSelectedNetwork, setAlgorandSelectedNetwork] = useState('algorand-testnet');

  useEffect(() => {
    // Check for existing Algorand wallet connection
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setAlgorandWallet(accounts[0]);
      }
    });
  }, [peraWallet]);

  useEffect(() => {
    if (selectedNetwork === 'solana' && solanaConnected) {
      loadSolanaTokens();
    } else if (selectedNetwork === 'algorand' && algorandConnected && algorandAddress) {
      loadAlgorandTokens();
    }
  }, [selectedNetwork, solanaConnected, algorandConnected, algorandAddress, algorandSelectedNetwork]);

  useEffect(() => {
    // Check for existing Algorand wallet connection
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setAlgorandConnected(true);
        setAlgorandAddress(accounts[0]);
      }
    }).catch(() => {
      // No existing session
    });
  }, [peraWallet]);

  useEffect(() => {
    // Listen for disconnect events
    peraWallet.connector?.on('disconnect', () => {
      setAlgorandConnected(false);
      setAlgorandAddress(null);
      setUserTokens([]);
    });
  }, [peraWallet]);

  // Update Algorand network when dashboard network changes
  useEffect(() => {
    if (selectedNetwork === 'algorand' && algorandSelectedNetwork !== 'algorand-testnet') {
      setAlgorandSelectedNetwork('algorand-testnet');
    }
  }, [selectedNetwork, algorandSelectedNetwork]);

  const loadSolanaTokens = () => {
    // Mock Solana tokens for demo
    const solanaTokens: Token[] = [
      {
        id: 'sol-1',
        name: 'Community Rewards Token',
        symbol: 'CRT',
        balance: '50,000',
        value: '$2,500',
        change: '+12.5%',
        holders: 1250,
        totalSupply: '1,000,000',
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        network: 'solana'
      },
      {
        id: 'sol-2',
        name: 'Gaming Token',
        symbol: 'GAME',
        balance: '25,000',
        value: '$1,200',
        change: '+8.3%',
        holders: 850,
        totalSupply: '500,000',
        address: '9yHXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgBsV',
        network: 'solana'
      }
    ];
    setUserTokens(solanaTokens);
  };

  const loadAlgorandTokens = async () => {
    if (!algorandAddress) return;
    
    setIsLoadingTokens(true);
    try {
      console.log(`Loading Algorand tokens for wallet: ${algorandAddress} on ${algorandSelectedNetwork}`);
      
      // Get account information
      const accountInfo = await getAlgorandAccountInfo(algorandAddress, algorandSelectedNetwork);
      if (!accountInfo.success) {
        console.error('Failed to get account info:', accountInfo.error);
        return;
      }

      const algorandTokens: Token[] = [];
      const processedAssets = new Set<number>();

      // Process assets held in the wallet (including zero balance)
      for (const asset of accountInfo.assets) {
        const assetId = asset['asset-id'];
        
        if (processedAssets.has(assetId)) continue;
        processedAssets.add(assetId);

        try {
          const assetInfoResult = await getAlgorandAssetInfo(assetId, algorandSelectedNetwork);
          if (assetInfoResult.success) {
            const assetInfo = assetInfoResult.data;
            const amount = asset.amount || 0;
            const decimals = assetInfo.decimals || 0;
            const balance = decimals > 0 ? (amount / Math.pow(10, decimals)) : amount;
            
            // Get network configuration for explorer URL
            const { getAlgorandNetwork } = await import('@/lib/algorand');
            const networkConfig = getAlgorandNetwork(algorandSelectedNetwork);

            algorandTokens.push({
              id: `algo-${assetId}`,
              name: assetInfo.assetName || 'Unknown Asset',
              symbol: assetInfo.unitName || 'UNK',
              balance: balance.toLocaleString(),
              value: `$${(balance * 0.05).toFixed(2)}`, // Mock price calculation
              change: `${(Math.random() - 0.5) * 20 > 0 ? '+' : ''}${((Math.random() - 0.5) * 20).toFixed(1)}%`,
              holders: Math.floor(50 + Math.random() * 500),
              totalSupply: assetInfo.totalSupply ? 
                (Number(assetInfo.totalSupply) / Math.pow(10, decimals)).toLocaleString() : 
                'Unknown',
              address: assetId.toString(),
              network: algorandSelectedNetwork,
              decimals: decimals,
              creatorAddress: assetInfo.creator,
              managerAddress: assetInfo.manager,
              logoUri: assetInfo.metadata?.logoUri,
              metadata: {
                website: assetInfo.metadata?.website,
                github: assetInfo.metadata?.github,
                twitter: assetInfo.metadata?.twitter
              },
              explorerUrl: `${networkConfig.explorer}/asset/${assetId}`
            });
          }
        } catch (error) {
          console.error(`Error loading asset ${assetId}:`, error);
          // Continue processing other assets even if one fails
        }
      }

      // TODO: In a real implementation, you would also query for assets where
      // the connected wallet is the creator or manager, even if not held.
      // This would require additional API calls or indexer queries.

      console.log('Loaded Algorand tokens:', algorandTokens);
      setUserTokens(algorandTokens);
    } catch (error) {
      console.error(`Error loading Algorand tokens on ${algorandSelectedNetwork}:`, error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const connectAlgorandWallet = async () => {
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setAlgorandConnected(true);
        setAlgorandAddress(accounts[0]);
      }
    } catch (error) {
      console.error('Failed to connect Algorand wallet:', error);
    }
  };

  const disconnectAlgorandWallet = () => {
    try {
      peraWallet.disconnect();
      setAlgorandConnected(false);
      setAlgorandAddress(null);
      setUserTokens([]);
    } catch (error) {
      console.error('Failed to disconnect Algorand wallet:', error);
    }
  };

  const handleTransfer = () => {
    if (!transferAmount || !transferAddress) {
      alert('Please fill in both amount and recipient address');
      return;
    }
    
    if (userTokens.length === 0) {
      alert('No tokens available for transfer');
      return;
    }
    
    // Simulate transfer
    alert(`Successfully transferred ${transferAmount} ${userTokens[selectedToken]?.symbol || 'tokens'} to ${transferAddress}`);
    setTransferAmount('');
    setTransferAddress('');
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
    { 
      type: 'Transfer', 
      amount: userTokens.length > 0 ? `1,000 ${userTokens[0].symbol}` : '1,000 tokens', 
      to: solanaConnected && publicKey ? 
        `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 
        algorandWallet ? 
        `${algorandWallet.slice(0, 4)}...${algorandWallet.slice(-4)}` :
        'Demo_abc...123', 
      time: '2 hours ago', 
      status: 'Completed' 
    },
    { type: 'Mint', amount: '5,000 tokens', to: 'Community Pool', time: '1 day ago', status: 'Completed' },
    { type: 'Transfer', amount: '500 tokens', to: 'Demo_xyz...789', time: '2 days ago', status: 'Completed' },
  ];

  // Check if any wallet is connected
  const isWalletConnected = (selectedNetwork === 'solana' && solanaConnected) || 
                           (selectedNetwork === 'algorand' && algorandConnected);

  // Redirect to wallet connection if not connected
  if (!isWalletConnected) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="glass-card p-8 space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-4">
                Choose a network and connect your wallet to access the dashboard and manage your tokens.
              </p>
              
              {/* Network Selection */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={selectedNetwork === 'solana' ? 'default' : 'outline'}
                  onClick={() => setSelectedNetwork('solana')}
                  className="flex-1"
                >
                  Solana
                </Button>
                <Button
                  variant={selectedNetwork === 'algorand' ? 'default' : 'outline'}
                  onClick={() => setSelectedNetwork('algorand')}
                  className="flex-1"
                >
                  Algorand
                </Button>
              </div>
              
              {/* Algorand Network Selector */}
              {selectedNetwork === 'algorand' && (
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-2 block">Algorand Network</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={algorandSelectedNetwork === 'algorand-testnet' ? 'default' : 'outline'}
                      onClick={() => setAlgorandSelectedNetwork('algorand-testnet')}
                      size="sm"
                      className="flex-1"
                    >
                      TestNet
                    </Button>
                    <Button
                      variant={algorandSelectedNetwork === 'algorand-mainnet' ? 'default' : 'outline'}
                      onClick={() => setAlgorandSelectedNetwork('algorand-mainnet')}
                      size="sm"
                      className="flex-1"
                    >
                      MainNet
                    </Button>
                  </div>
                </div>
              )}

              {selectedNetwork === 'algorand' && !algorandConnected && (
                <Button
                  onClick={connectAlgorandWallet}
                  className="bg-[#76f935] hover:bg-[#6ae82d] text-black w-full mb-4"
                >
                  Connect Pera Wallet
                </Button>
              )}
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Token Dashboard</h1>
            <p className="text-muted-foreground">Manage and monitor your token portfolio</p>
            <div className="flex items-center gap-4 mt-2">
              {solanaConnected && publicKey && (
                <p className="text-sm text-muted-foreground">
                  Solana: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </p>
              )}
              {algorandAddress && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    Algorand ({algorandSelectedNetwork === 'algorand-mainnet' ? 'MainNet' : 'TestNet'}): 
                    {algorandAddress.slice(0, 4)}...{algorandAddress.slice(-4)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnectAlgorandWallet}
                    className="text-xs"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={selectedNetwork === 'solana' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedNetwork('solana')}
              >
                Solana
              </Button>
              <Button
                variant={selectedNetwork === 'algorand' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedNetwork('algorand')}
              >
                Algorand
              </Button>
            </div>
            {/* Algorand Network Toggle for Desktop */}
            {selectedNetwork === 'algorand' && (
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={algorandSelectedNetwork === 'algorand-testnet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAlgorandSelectedNetwork('algorand-testnet')}
                  className="text-xs"
                >
                  TestNet
                </Button>
                <Button
                  variant={algorandSelectedNetwork === 'algorand-mainnet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setAlgorandSelectedNetwork('algorand-mainnet')}
                  className="text-xs"
                >
                  MainNet
                </Button>
              </div>
            )}
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
                <p className="text-2xl font-bold text-foreground">
                  ${userTokens.reduce((sum, token) => {
                    const value = parseFloat(token.value.replace('$', '').replace(',', ''));
                    return sum + (isNaN(value) ? 0 : value);
                  }, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Holders</p>
                <p className="text-2xl font-bold text-foreground">
                  {userTokens.reduce((sum, token) => sum + token.holders, 0).toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Network</p>
                <p className="text-2xl font-bold text-foreground capitalize">
                  {selectedNetwork === 'algorand' 
                    ? `Algorand ${algorandSelectedNetwork === 'algorand-mainnet' ? 'MainNet' : 'TestNet'}`
                    : selectedNetwork
                  }
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {isLoadingTokens ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading your tokens...</p>
          </div>
        ) : userTokens.length === 0 ? (
          <div className="text-center py-12">
            <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Tokens Found</h3>
            <p className="text-muted-foreground mb-6">
              You don't have any tokens on {selectedNetwork} yet. Create your first token to get started!
            </p>
            <Link href="/create">
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Token
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Token List */}
            <div className="lg:col-span-1">
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Your Tokens</h2>
                <div className="space-y-4">
                  {userTokens.map((token, index) => (
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
                          {token.logoUri ? (
                            <img 
                              src={token.logoUri} 
                              alt={token.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                              {token.symbol.slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-foreground font-medium">{token.name}</p>
                            <p className="text-muted-foreground text-sm">{token.symbol} • {token.network}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-foreground font-semibold">{token.balance}</p>
                          <p className="text-muted-foreground text-sm">{token.value}</p>
                        </div>
                        <Badge className={`${
                          token.change.startsWith('+') 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {token.change}
                        </Badge>
                      </div>
                    </div>
                  ))}
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
                          <p className="text-muted-foreground">{userTokens[selectedToken].symbol} • {userTokens[selectedToken].network}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-border text-muted-foreground"
                            onClick={() => {
                              const token = userTokens[selectedToken];
                              if (token.network.startsWith('algorand')) {
                                if (token.explorerUrl) {
                                  window.open(token.explorerUrl, '_blank');
                                } else {
                                  // Fallback to constructing URL
                                  const { getAlgorandNetwork } = require('@/lib/algorand');
                                  const networkConfig = getAlgorandNetwork(token.network);
                                  window.open(`${networkConfig.explorer}/asset/${token.address}`, '_blank');
                                }
                              } else {
                                window.open(`https://explorer.solana.com/address/${token.address}?cluster=devnet`, '_blank');
                              }
                            }}
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

                      {/* Additional info for Algorand tokens */}
                      {userTokens[selectedToken].network.startsWith('algorand') && (
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {userTokens[selectedToken].creatorAddress && (
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-muted-foreground text-sm">Creator</p>
                              <p className="text-foreground font-mono text-sm">
                                {userTokens[selectedToken].creatorAddress?.slice(0, 8)}...
                                {userTokens[selectedToken].creatorAddress?.slice(-8)}
                              </p>
                            </div>
                          )}
                          {userTokens[selectedToken].managerAddress && (
                            <div className="bg-muted/50 rounded-lg p-4">
                              <p className="text-muted-foreground text-sm">Manager</p>
                              <p className="text-foreground font-mono text-sm">
                                {userTokens[selectedToken].managerAddress?.slice(0, 8)}...
                                {userTokens[selectedToken].managerAddress?.slice(-8)}
                              </p>
                            </div>
                          )}
                          <div className="bg-muted/50 rounded-lg p-4">
                            <p className="text-muted-foreground text-sm">Network</p>
                            <p className="text-foreground font-semibold text-sm">
                              {userTokens[selectedToken].network === 'algorand-mainnet' ? 'Algorand MainNet' : 'Algorand TestNet'}
                            </p>
                          </div>
                        </div>
                      )}
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
                          <Label htmlFor="transferAddress" className="text-foreground font-medium">Recipient Address</Label>
                          <Input
                            id="transferAddress"
                            placeholder={`Enter ${userTokens[selectedToken].network} address`}
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
                          Transfer {userTokens[selectedToken]?.symbol || 'tokens'}
                        </Button>
                      </div>
                    </div>

                    {/* Other Management Actions */}
                    <div className="glass-card p-6">
                      <h4 className="text-lg font-semibold text-foreground mb-6">Token Management</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Plus className="w-4 h-4 mr-2" />
                          Mint Tokens
                        </Button>
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Flame className="w-4 h-4 mr-2" />
                          Burn Tokens
                        </Button>
                        <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted h-12">
                          <Settings className="w-4 h-4 mr-2" />
                          Update Metadata
                        </Button>
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