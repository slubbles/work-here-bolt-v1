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
  Share2
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
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';

interface UserToken {
  address: string;
  name: string;
  symbol: string;
  balance: number;
  value: string;
  change: string;
  holders: number;
  totalSupply: string;
  mintAddress: string;
  decimals: number;
  isPaused: boolean;
  features: {
    canMint: boolean;
    canBurn: boolean;
    canPause: boolean;
  };
  metadata: {
    logoUri: string;
    website?: string;
    github?: string;
    twitter?: string;
  };
  priceHistory: Array<{ date: string; price: number; volume: number }>;
  recentTransactions: Array<{
    type: string;
    amount: string;
    from: string;
    to: string;
    timestamp: string;
    status: string;
  }>;
}

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState(0);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState('');
              },
              priceHistory: generatePriceHistory(currentPrice, 30),
              recentTransactions: []
            });
          }
        } catch (tokenError) {
          console.error(`Error processing token ${mintAddress}:`, tokenError);
          // Continue with next token
        }
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching user tokens:', error);
      return [];
    }
  };

  const generatePriceHistory = (currentPrice: number, days: number) => {
    const history = [];
    let price = currentPrice;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Add some realistic price movement
      const change = (Math.random() - 0.5) * 0.1; // ±10% daily change
      price = Math.max(0.001, price * (1 + change));
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(4)),
        volume: Math.floor(1000 + Math.random() * 10000)
      });
    }
    
    return history;
  };

  const generateRecentTransactions = (symbol: string, userAddress: string) => {
    const transactions = [];
    const types = ['Transfer', 'Mint', 'Burn'];
    
    for (let i = 0; i < 5; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(100 + Math.random() * 1000);
      const hoursAgo = Math.floor(Math.random() * 72);
      
      transactions.push({
        type,
        amount: `${amount.toLocaleString()} ${symbol}`,
        from: type === 'Mint' ? 'System' : userAddress.slice(0, 4) + '...' + userAddress.slice(-4),
        to: type === 'Burn' ? 'Burned' : 'Demo_' + Math.random().toString(36).substr(2, 6),
        timestamp: `${hoursAgo} hours ago`,
        status: 'Completed'
      });
    }
    
    return transactions;
  };

  const findCustomTokenData = async (mintAddress: string) => {
    try {
      // Get all program accounts that might be our custom tokens
      const programAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
        filters: [
          {
            dataSize: 1000, // Approximate size of TokenData account
          }
        ]
      });

      // Check each account to see if it matches our mint
      for (const account of programAccounts) {
        try {
          // Try to deserialize as TokenData
          const tokenDataResult = await getTokenData(account.pubkey.toString());
          if (tokenDataResult.success && tokenDataResult.data.mint.toString() === mintAddress) {
            return {
              address: account.pubkey.toString(),
              name: tokenDataResult.data.name,
              symbol: tokenDataResult.data.symbol,
              totalSupply: tokenDataResult.data.totalSupply.toNumber(),
              isPaused: tokenDataResult.data.isPaused,
              features: tokenDataResult.data.features,
              metadata: tokenDataResult.data.metadata
            };
          }
        } catch (err) {
          // Not a valid TokenData account, continue
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error finding custom token data:', error);
      return null;
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleTransfer = async () => {
    if (!wallet || !connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (!transferAmount || !transferAddress) {
      setError('Please fill in both amount and recipient address');
      return;
    }

    const token = userTokens[selectedToken];
    if (!token) {
      setError('No token selected');
      return;
    }

    clearMessages();
    setIsLoading(true);

    try {
      const result = await transferTokens(
        wallet.adapter,
        token.address,
        transferAddress,
        parseFloat(transferAmount),
        token.decimals
      );

      if (result.success) {
        setSuccess(`Successfully transferred ${transferAmount} ${token.symbol}`);
        setTransferAmount('');
        setTransferAddress('');
        setShowTransferModal(false);
        // Reload user data to update balances
        loadUserData();
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      setError('Transfer failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMint = async () => {
    if (!wallet || !connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (!mintAmount) {
      setError('Please enter amount to mint');
      return;
    }

    const token = userTokens[selectedToken];
    if (!token) {
      setError('No token selected');
      return;
    }

    if (!token.features.canMint) {
      setError('Minting is disabled for this token');
      return;
    }

    clearMessages();
    setIsLoading(true);

    try {
      const result = await mintTokens(
        wallet.adapter,
        token.address,
        parseFloat(mintAmount),
        token.decimals
      );

      if (result.success) {
        setSuccess(`Successfully minted ${mintAmount} ${token.symbol}`);
        setMintAmount('');
        setShowMintModal(false);
        // Reload user data to update balances
        loadUserData();
      } else {
        setError(result.error || 'Minting failed');
      }
    } catch (error) {
      console.error('Mint error:', error);
      setError('Minting failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!wallet || !connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (!burnAmount) {
      setError('Please enter amount to burn');
      return;
    }

    const token = userTokens[selectedToken];
    if (!token) {
      setError('No token selected');
      return;
    }

    if (!token.features.canBurn) {
      setError('Burning is disabled for this token');
      return;
    }

    clearMessages();
    setIsLoading(true);

    try {
      const result = await burnTokens(
        wallet.adapter,
        token.address,
        parseFloat(burnAmount),
        token.decimals
      );

      if (result.success) {
        setSuccess(`Successfully burned ${burnAmount} ${token.symbol}`);
        setBurnAmount('');
        setShowBurnModal(false);
        // Reload user data to update balances
        loadUserData();
      } else {
        setError(result.error || 'Burning failed');
      }
    } catch (error) {
      console.error('Burn error:', error);
      setError('Burning failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!wallet || !connected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    const token = userTokens[selectedToken];
    if (!token) {
      setError('No token selected');
      return;
    }

    if (!token.features.canPause) {
      setError('Pausing is disabled for this token');
      return;
    }

    clearMessages();
    setIsLoading(true);

    try {
      const result = token.isPaused 
        ? await unpauseToken(wallet.adapter, token.address)
        : await pauseToken(wallet.adapter, token.address);

      if (result.success) {
        const action = token.isPaused ? 'unpaused' : 'paused';
        setSuccess(`Successfully ${action} ${token.symbol}`);
        
        // Update local state
        setUserTokens(prev => prev.map((t, index) => 
          index === selectedToken ? { ...t, isPaused: !t.isPaused } : t
        ));
      } else {
        setError(result.error || 'Pause/unpause failed');
      }
    } catch (error) {
      console.error('Pause/unpause error:', error);
      setError('Pause/unpause failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMetadata = () => {
    const token = userTokens[selectedToken];
    if (!token) return;

    setMetadataForm({
      website: token.metadata.website || '',
      twitter: token.metadata.twitter || '',
      github: token.metadata.github || '',
      logoUri: token.metadata.logoUri || ''
    });
    setShowMetadataModal(true);
  };

  const saveMetadata = async () => {
    // In a real implementation, this would update the token metadata on-chain
    setSuccess('Metadata update feature coming soon!');
    setShowMetadataModal(false);
  };

  const shareToken = async (token: UserToken) => {
    const shareData = {
      title: `${token.name} (${token.symbol})`,
      text: `Check out my token: ${token.name} with ${token.holders} holders!`,
      url: `${window.location.origin}/verify?token=${token.address}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
        setSuccess('Token info copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      setSuccess('Token info copied to clipboard!');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Calculate total portfolio value
  const totalValue = userTokens.reduce((sum, token) => {
    const value = parseFloat(token.value.replace('$', ''));
    return sum + value;
  }, 0);

  const totalHolders = userTokens.reduce((sum, token) => sum + token.holders, 0);

  // Redirect to wallet connection if not connected
  if (!connected) {
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
                You need to connect your Solana wallet to access the dashboard and manage your tokens.
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Token Dashboard</h1>
            <p className="text-muted-foreground">Manage and monitor your token portfolio</p>
            {publicKey && (
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-sm text-muted-foreground">
                  Connected: {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
                </p>
                <p className="text-sm text-muted-foreground">
                  SOL Balance: {solBalance.toFixed(4)} SOL
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={loadUserData}
              disabled={isLoadingTokens}
              className="border-border text-muted-foreground hover:bg-muted"
            >
              {isLoadingTokens ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
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

        {/* Messages */}
        {error && (
          <div className="glass-card p-4 border-l-4 border-red-500 bg-red-500/10 mb-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="glass-card p-4 border-l-4 border-green-500 bg-green-500/10 mb-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-500 font-medium">{success}</p>
            </div>
          </div>
        )}

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
                <p className="text-2xl font-bold text-foreground">${totalValue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Holders</p>
                <p className="text-2xl font-bold text-foreground">{totalHolders}</p>
              </div>
              <Users className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">SOL Balance</p>
                <p className="text-2xl font-bold text-foreground">{solBalance.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token List */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">Your Tokens</h2>
              {isLoadingTokens ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-red-500 mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading your tokens...</p>
                </div>
              ) : userTokens.length === 0 ? (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No tokens found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first token or ensure you have tokens in your wallet
                  </p>
                  <Link href="/create">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      Create Your First Token
                    </Button>
                  </Link>
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
                          {token.metadata.logoUri ? (
                            <img 
                              src={token.metadata.logoUri} 
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
                            <p className="text-muted-foreground text-sm">{token.symbol}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {token.isPaused && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Paused
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              shareToken(token);
                            }}
                            className="p-1"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-foreground font-semibold">{token.balance.toLocaleString()}</p>
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
              )}
            </div>
          </div>

          {/* Token Details */}
          <div className="lg:col-span-2">
            {userTokens.length > 0 && (
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
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border text-muted-foreground"
                          onClick={() => copyToClipboard(userTokens[selectedToken].address)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border text-muted-foreground"
                          onClick={() => window.open(`https://explorer.solana.com/address/${userTokens[selectedToken].mintAddress}?cluster=devnet`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">Balance</p>
                        <p className="text-foreground font-bold">{userTokens[selectedToken].balance.toLocaleString()}</p>
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
                    <h4 className="text-lg font-semibold text-foreground mb-4">Price Chart (30 Days)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userTokens[selectedToken].priceHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                          <XAxis dataKey="date" stroke="currentColor" opacity={0.7} />
                          <YAxis stroke="currentColor" opacity={0.7} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--foreground)'
                            }}
                          />
                          <Line type="monotone" dataKey="price" stroke="#EF4444" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="glass-card p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Volume Analysis</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userTokens[selectedToken].priceHistory}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.3} />
                          <XAxis dataKey="date" stroke="currentColor" opacity={0.7} />
                          <YAxis stroke="currentColor" opacity={0.7} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--background)', 
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              color: 'var(--foreground)'
                            }}
                          />
                          <Bar dataKey="volume" fill="#EF4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-6">
                  <div className="glass-card p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h4>
                    <div className="space-y-4">
                      {userTokens[selectedToken].recentTransactions.map((tx, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                              {tx.type === 'Transfer' && <Send className="w-4 h-4 text-red-400" />}
                              {tx.type === 'Mint' && <Plus className="w-4 h-4 text-green-400" />}
                              {tx.type === 'Burn' && <Flame className="w-4 h-4 text-red-400" />}
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{tx.type}</p>
                              <p className="text-muted-foreground text-sm">{tx.amount}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground text-sm">{tx.timestamp}</p>
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
                  {/* Token Management Actions */}
                  <div className="glass-card p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-6">Token Management</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="border-border text-muted-foreground hover:bg-muted h-12"
                        onClick={() => setShowTransferModal(true)}
                        disabled={isLoading}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Transfer Tokens
                      </Button>
                      
                      {userTokens[selectedToken]?.features.canMint && (
                        <Button 
                          variant="outline" 
                          className="border-border text-muted-foreground hover:bg-muted h-12"
                          onClick={() => setShowMintModal(true)}
                          disabled={isLoading}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Mint Tokens
                        </Button>
                      )}
                      
                      {userTokens[selectedToken]?.features.canBurn && (
                        <Button 
                          variant="outline" 
                          className="border-border text-muted-foreground hover:bg-muted h-12"
                          onClick={() => setShowBurnModal(true)}
                          disabled={isLoading}
                        >
                          <Flame className="w-4 h-4 mr-2" />
                          Burn Tokens
                        </Button>
                      )}
                      
                      {userTokens[selectedToken]?.features.canPause && (
                        <Button 
                          variant="outline" 
                          className="border-border text-muted-foreground hover:bg-muted h-12"
                          onClick={handlePauseToggle}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : userTokens[selectedToken]?.isPaused ? (
                            <Play className="w-4 h-4 mr-2" />
                          ) : (
                            <Pause className="w-4 h-4 mr-2" />
                          )}
                          {userTokens[selectedToken]?.isPaused ? 'Unpause Token' : 'Pause Token'}
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="border-border text-muted-foreground hover:bg-muted h-12"
                        onClick={handleUpdateMetadata}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Update Metadata
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="border-border text-muted-foreground hover:bg-muted h-12"
                        onClick={() => window.open(`/verify?token=${userTokens[selectedToken].address}`, '_blank')}
                      >
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
      </div>

      {/* Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Transfer Tokens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transferAddress" className="text-foreground font-medium">Recipient Address</Label>
              <Input
                id="transferAddress"
                placeholder="Enter wallet address"
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
                placeholder={`Enter amount of ${userTokens[selectedToken]?.symbol || 'tokens'}`}
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="input-enhanced mt-2"
              />
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowTransferModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleTransfer}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Transfer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mint Modal */}
      <Dialog open={showMintModal} onOpenChange={setShowMintModal}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Mint Tokens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mintAmount" className="text-foreground font-medium">Amount to Mint</Label>
              <Input
                id="mintAmount"
                type="number"
                placeholder={`Enter amount of ${userTokens[selectedToken]?.symbol || 'tokens'} to mint`}
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="input-enhanced mt-2"
              />
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowMintModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMint}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Mint
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Burn Modal */}
      <Dialog open={showBurnModal} onOpenChange={setShowBurnModal}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Burn Tokens</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="burnAmount" className="text-foreground font-medium">Amount to Burn</Label>
              <Input
                id="burnAmount"
                type="number"
                placeholder={`Enter amount of ${userTokens[selectedToken]?.symbol || 'tokens'} to burn`}
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                className="input-enhanced mt-2"
              />
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                ⚠️ Warning: Burned tokens will be permanently destroyed and cannot be recovered.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowBurnModal(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBurn}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Burning...
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 mr-2" />
                    Burn
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Metadata Update Modal */}
      <Dialog open={showMetadataModal} onOpenChange={setShowMetadataModal}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Update Token Metadata</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="logoUri" className="text-foreground font-medium">Logo URL</Label>
              <Input
                id="logoUri"
                placeholder="https://example.com/logo.png"
                value={metadataForm.logoUri}
                onChange={(e) => setMetadataForm(prev => ({ ...prev, logoUri: e.target.value }))}
                className="input-enhanced mt-2"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-foreground font-medium">Website</Label>
              <Input
                id="website"
                placeholder="https://yourproject.com"
                value={metadataForm.website}
                onChange={(e) => setMetadataForm(prev => ({ ...prev, website: e.target.value }))}
                className="input-enhanced mt-2"
              />
            </div>
            <div>
              <Label htmlFor="twitter" className="text-foreground font-medium">Twitter</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/yourproject"
                value={metadataForm.twitter}
                onChange={(e) => setMetadataForm(prev => ({ ...prev, twitter: e.target.value }))}
                className="input-enhanced mt-2"
              />
            </div>
            <div>
              <Label htmlFor="github" className="text-foreground font-medium">GitHub</Label>
              <Input
                id="github"
                placeholder="https://github.com/yourproject"
                value={metadataForm.github}
                onChange={(e) => setMetadataForm(prev => ({ ...prev, github: e.target.value }))}
                className="input-enhanced mt-2"
              />
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowMetadataModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={saveMetadata}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}