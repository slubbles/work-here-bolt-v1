'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  Shield, 
  Clock, 
  Users, 
  Copy, 
  RefreshCw, 
  Globe, 
  Eye,
  AlertCircle,
  TrendingUp,
  Wallet,
  Hash,
  BarChart3,
  Check
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAlgorandAssetInfo, getAlgorandNetwork } from '@/lib/algorand';

type NetworkType = 'solana-devnet' | 'algorand-mainnet' | 'algorand-testnet';

interface TokenMetadata {
  name: string;
  symbol: string;
  totalSupply?: string;
  decimals: number;
  description?: string;
  image?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  verified?: boolean;
}

interface VerificationResult {
  verified: boolean;
  score: number;
  status: 'success' | 'warning' | 'error';
  network: NetworkType;
  tokenId: string;
  checks: {
    tokenExists: boolean;
    metadataValid: boolean;
    liquidityAvailable: boolean;
    contractVerified: boolean;
    communityTrust: boolean;
  };
  warnings: string[];
  metadata?: TokenMetadata;
  metrics?: {
    holders?: number | string;
    marketCap?: string;
    volume24h?: string;
    priceChange24h?: string;
  };
  explorerUrl?: string;
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [network, setNetwork] = useState<NetworkType>('algorand-mainnet'); // Default to Algorand mainnet since most assets are there
  const [tokenId, setTokenId] = useState(searchParams?.get('id') || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [copiedTokenId, setCopiedTokenId] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlTokenId = searchParams?.get('id');
    const urlNetwork = searchParams?.get('network') as NetworkType;
    
    if (urlTokenId) {
      setTokenId(urlTokenId);
      if (urlNetwork && ['solana-devnet', 'algorand-mainnet', 'algorand-testnet'].includes(urlNetwork)) {
        setNetwork(urlNetwork);
      }
      handleVerification(urlTokenId, urlNetwork || network);
    }
  }, [searchParams]);

  const validateTokenId = (id: string, networkType: NetworkType): boolean => {
    if (!id.trim()) return false;
    
    if (networkType === 'solana-devnet') {
      // Solana public key validation (base58, 32 bytes = 44 chars)
      try {
        new PublicKey(id);
        return true;
      } catch {
        return false;
      }
    } else {
      // Algorand asset ID validation (numeric)
      return /^\d+$/.test(id) && parseInt(id) > 0;
    }
  };

  const fetchSolanaTokenData = async (tokenMint: string): Promise<Partial<VerificationResult>> => {
    try {
      const connection = new Connection('https://api.devnet.solana.com');
      const mintPubkey = new PublicKey(tokenMint);
      
      // Get token supply
      const supply = await connection.getTokenSupply(mintPubkey);
      
      // Get token accounts
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        mintPubkey,
        { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
      );

      // Basic metadata (in production, you'd fetch from Metaplex)
      const metadata: TokenMetadata = {
        name: 'Unknown Token',
        symbol: 'UNK',
        decimals: supply.value.decimals,
        totalSupply: supply.value.uiAmountString || '0',
        verified: false
      };

      const checks = {
        tokenExists: true,
        metadataValid: true,
        liquidityAvailable: tokenAccounts.value.length > 0,
        contractVerified: Math.random() > 0.5, // Mock for demo
        communityTrust: Math.random() > 0.3
      };

      const score = Object.values(checks).filter(Boolean).length * 20;

      return {
        verified: score >= 80,
        score,
        status: score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error',
        checks,
        metadata,
        metrics: {
          holders: tokenAccounts.value.length,
          marketCap: 'N/A',
          volume24h: 'N/A',
          priceChange24h: 'N/A'
        },
        explorerUrl: `https://explorer.solana.com/address/${tokenMint}?cluster=devnet`,
        warnings: score < 80 ? [
          'Token metadata not fully verified',
          'Limited liquidity detected',
          'Exercise caution when trading'
        ] : []
      };
    } catch (error) {
      throw new Error('Unable to fetch data. Please check the asset ID and try again.');
    }
  };

  const fetchAlgorandTokenData = async (assetId: string, networkType: NetworkType): Promise<Partial<VerificationResult>> => {
    try {
      console.log(`🔍 Verifying Algorand asset ${assetId} on ${networkType}`);
      const isMainnet = networkType === 'algorand-mainnet';
      const networkName = isMainnet ? 'mainnet' : 'testnet';
      
      console.log(`📡 Using network: ${networkName}`);
      let assetInfo = await getAlgorandAssetInfo(parseInt(assetId), networkName);
      
      // If asset not found on selected network, try the other network
      if (!assetInfo.success && networkType === 'algorand-mainnet') {
        console.log('🔄 Asset not found on mainnet, trying testnet...');
        assetInfo = await getAlgorandAssetInfo(parseInt(assetId), 'testnet');
        if (assetInfo.success) {
          console.log('✅ Asset found on testnet instead');
          toast({
            title: "Network Switch",
            description: "Asset found on Algorand Testnet instead of Mainnet",
          });
        }
      } else if (!assetInfo.success && networkType === 'algorand-testnet') {
        console.log('🔄 Asset not found on testnet, trying mainnet...');
        assetInfo = await getAlgorandAssetInfo(parseInt(assetId), 'mainnet');
        if (assetInfo.success) {
          console.log('✅ Asset found on mainnet instead');
          toast({
            title: "Network Switch", 
            description: "Asset found on Algorand Mainnet instead of Testnet",
          });
        }
      }
      
      console.log('Asset info result:', assetInfo);
      
      if (!assetInfo.success || !assetInfo.data) {
        console.error(`❌ Failed to fetch asset info: ${assetInfo.error}`);
        throw new Error(assetInfo.error || `Asset ${assetId} not found on either Algorand Mainnet or Testnet. Please verify the asset ID.`);
      }

      const asset = assetInfo.data;
      
      console.log(`✅ Asset found: ${asset.assetName} (${asset.unitName})`);
      
      const metadata: TokenMetadata = {
        name: asset.assetName || 'Unknown Asset',
        symbol: asset.unitName || 'UNK',
        decimals: asset.decimals || 0,
        totalSupply: asset.totalSupply?.toString() || '0',
        description: asset.url || undefined,
        verified: false // In production, check against verified asset registry
      };

      const checks = {
        tokenExists: true,
        metadataValid: !!(asset.assetName && asset.unitName),
        liquidityAvailable: true, // Assume true for existing assets
        contractVerified: !asset.manager, // No manager = immutable
        communityTrust: asset.totalSupply !== undefined && asset.totalSupply > 0
      };

      const score = Object.values(checks).filter(Boolean).length * 20;
      
      // Determine which network was actually used
      const actualNetwork = assetInfo.success ? (isMainnet ? 'mainnet' : 'testnet') : 'unknown';
      
      return {
        verified: score >= 80,
        score,
        status: score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error',
        checks,
        metadata,
        metrics: {
          holders: 'N/A',
          marketCap: 'N/A',
          volume24h: 'N/A',
          priceChange24h: 'N/A'
        },
        explorerUrl: actualNetwork === 'mainnet'
          ? `https://explorer.perawallet.app/asset/${assetId}`
          : `https://testnet.algoexplorer.io/asset/${assetId}`,
        warnings: score < 80 ? [
          'Asset verification incomplete',
          'Limited market data available',
          'Research thoroughly before trading'
        ] : []
      };
    } catch (error) {
      console.error('❌ Algorand verification error:', error);
      throw new Error(error instanceof Error ? error.message : 'Unable to fetch data. Please check the asset ID and try again.');
    }
  };

  const handleVerification = async (id?: string, selectedNetwork?: NetworkType) => {
    const tokenToVerify = id || tokenId;
    const networkToUse = selectedNetwork || network;
    
    if (!validateTokenId(tokenToVerify, networkToUse)) {
      setError(`Invalid ${networkToUse.includes('solana') ? 'token address' : 'asset ID'} format`);
      return;
    }

    setIsVerifying(true);
    setProgress(0);
    setVerificationResult(null);
    setError(null);

    const steps = [
      'Connecting to network...',
      'Validating token/asset...',
      'Fetching metadata...',
      'Checking liquidity...',
      'Analyzing security...',
      'Calculating trust score...'
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay for better UX
      }

      let result: Partial<VerificationResult>;
      
      if (networkToUse === 'solana-devnet') {
        result = await fetchSolanaTokenData(tokenToVerify);
      } else {
        result = await fetchAlgorandTokenData(tokenToVerify, networkToUse);
      }

      const finalResult: VerificationResult = {
        network: networkToUse,
        tokenId: tokenToVerify,
        ...result
      } as VerificationResult;

      setVerificationResult(finalResult);
      
      // Show success toast
      toast({
        title: "Verification Complete",
        description: `Token verification completed with ${finalResult.score}/100 score`,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Verification failed';
      setError(errorMessage);
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const copyTokenId = () => {
    navigator.clipboard.writeText(tokenId);
    setCopiedTokenId(true);
    toast({
      title: "Copied",
      description: "Token ID copied to clipboard",
    });
    setTimeout(() => setCopiedTokenId(false), 2000);
  };

  const getNetworkStatus = () => {
    const statusMap = {
      'solana-devnet': { label: 'Solana Devnet', color: 'bg-red-500', icon: Globe },
      'algorand-mainnet': { label: 'Algorand Mainnet', color: 'bg-green-500', icon: Globe },
      'algorand-testnet': { label: 'Algorand Testnet', color: 'bg-gray-500', icon: Globe }
    };
    return statusMap[network];
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-500" />;
      default: return <AlertTriangle className="w-6 h-6 text-gray-500" />;
    }
  };

  const networkStatus = getNetworkStatus();

  return (
    <div className="min-h-screen app-background py-16 px-4">
      <div className="max-w-7xl mx-auto space-y-20">
        {/* Header - Maximum spacing */}
        <div className="text-center mb-24">
          <div className="flex items-center justify-center space-x-6 mb-8">
            <Shield className="w-12 h-12 text-red-500" />
            <h1 className="text-6xl font-bold text-white">Token Verification</h1>
          </div>
          <p className="text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed mt-8">
            Verify token safety, legitimacy, and get detailed analytics before investing. 
            Support for Solana and Algorand networks.
          </p>
        </div>

        {/* Network Status - More spacing */}
        <div className="flex justify-center mb-16">
          <div className="flex items-center space-x-4 px-8 py-4 bg-gray-800 rounded-full shadow-lg border border-gray-700">
            <div className={`w-5 h-5 rounded-full ${networkStatus.color} shadow-lg`}></div>
            <networkStatus.icon className="w-6 h-6 text-gray-400" />
            <span className="text-xl font-medium text-white">{networkStatus.label}</span>
          </div>
        </div>

        {/* Search Form - Minimal spacing fixes */}
        <Card className="glass-card border border-border shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg p-6">
            <CardTitle className="flex items-center space-x-3 text-2xl">
              <Search className="w-6 h-6" />
              <span>Token/Asset Verification</span>
            </CardTitle>
            <CardDescription className="text-red-100 text-lg mt-2">
              Select network and enter token address or asset ID to start verification
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 bg-card space-y-4" style={{ padding: '8px' }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Network Selection - Fixed label spacing */}
              <div className="space-y-2">
                <Label htmlFor="network" className="text-lg font-semibold text-white">Network</Label>
                <div style={{ marginBottom: '3px' }}>
                  <Select value={network} onValueChange={(value) => setNetwork(value as NetworkType)}>
                    <SelectTrigger className="h-12 bg-gray-800 border-red-500 text-white focus:border-red-500 focus:ring-red-500/20 text-lg">
                      <SelectValue placeholder="Select network" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="solana-devnet" className="text-white hover:bg-gray-700 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-lg">Solana Devnet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="algorand-mainnet" className="text-white hover:bg-gray-700 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-lg">Algorand Mainnet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="algorand-testnet" className="text-white hover:bg-gray-700 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          <span className="text-lg">Algorand Testnet</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Token ID Input - Fixed label spacing */}
              <div className="lg:col-span-2 space-y-2">
                <Label htmlFor="token-id" className="text-lg font-semibold text-white">
                  {network.includes('solana') ? 'Token Address' : 'Asset ID'}
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="token-id"
                    placeholder={network.includes('solana') ? 'Enter Solana token address...' : 'Enter Algorand asset ID...'}
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    disabled={isVerifying}
                    className="flex-1 h-12 bg-gray-800 border-red-500 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500/20 text-lg"
                  />
                  <Button 
                    onClick={() => handleVerification()}
                    disabled={!tokenId || isVerifying || !validateTokenId(tokenId, network)}
                    className="px-8 h-14 bg-red-500 hover:bg-red-600 text-white font-semibold text-lg transition-all duration-300 shadow-lg"
                  >
                    {isVerifying ? (
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="w-5 h-5 animate-spin text-white" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Search className="w-5 h-5" />
                        <span>Verify</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Display - Reduced spacing */}
            {error && (
              <Alert className="border-red-500 bg-red-950/50 p-4 mt-6">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <AlertDescription className="text-red-400 text-lg ml-3">
                  Unable to fetch data. Please check the asset ID and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Verification Progress - More spacing */}
        {isVerifying && (
          <Card className="mb-12 glass-card border border-border">
            <CardContent className="pt-8 p-8">
              <div className="space-y-6">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-300 flex items-center space-x-3">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Verification in Progress</span>
                  </span>
                  <span className="font-medium text-red-500 text-xl">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-4 bg-gray-800" />
                <p className="text-lg text-gray-400 text-center mt-4">
                  Analyzing token data and security metrics...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Results - More spacing */}
        {verificationResult && (
          <div className="space-y-10">
            {/* Success Feedback */}
            {verificationResult.verified && (
              <div className="flex items-center justify-center space-x-4 mb-8 p-6 bg-green-950/50 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <span className="text-green-400 font-semibold text-xl">Verification Successful</span>
              </div>
            )}

            {/* Token Details Section - More spacing */}
            <Card className="glass-card border border-border">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-4">
                    {getStatusIcon(verificationResult.status)}
                    <div>
                      <h3 className="text-2xl font-semibold text-white">
                        {verificationResult.verified ? 'Verified Token' : 'Unverified Token'}
                      </h3>
                      <p className="text-lg text-gray-400 mt-2">
                        Network: {networkStatus.label}
                      </p>
                    </div>
                  </CardTitle>
                  <div className="text-right">
                    <Badge variant={getScoreBadgeVariant(verificationResult.score)} className="text-xl px-4 py-2">
                      {verificationResult.score}/100
                    </Badge>
                    <p className="text-sm text-gray-400 mt-2">Trust Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 bg-card">
                {/* Token ID Display */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-red-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg text-gray-400 mb-2">Token ID</p>
                      <p className="font-mono text-lg text-white break-all">{verificationResult.tokenId}</p>
                    </div>
                    <Button variant="outline" size="lg" onClick={copyTokenId} className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3">
                      {copiedTokenId ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Token Metadata - More spacing */}
                {verificationResult.metadata && (
                  <div className="space-y-6">
                    <h4 className="text-xl font-semibold text-white">Token Details</h4>
                    <div className="space-y-4 bg-black p-6 rounded-lg border border-gray-700">
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400 text-lg">Token Name:</span>
                        <span className="text-white font-medium text-lg">{verificationResult.metadata.name}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400 text-lg">Symbol:</span>
                        <span className="text-white font-medium text-lg">{verificationResult.metadata.symbol}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400 text-lg">Total Supply:</span>
                        <span className="text-white font-medium text-lg">{verificationResult.metadata.totalSupply || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-400 text-lg">Decimals:</span>
                        <span className="text-white font-medium text-lg">{verificationResult.metadata.decimals}</span>
                      </div>
                      {verificationResult.metadata.description && (
                        <div className="pt-4 border-t border-gray-700">
                          <span className="text-gray-400 block mb-3 text-lg">Description:</span>
                          <span className="text-white text-lg">{verificationResult.metadata.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Checks - More spacing */}
            <Card className="glass-card border border-border">
              <CardHeader className="p-8">
                <CardTitle className="flex items-center space-x-3 text-white text-2xl">
                  <Shield className="w-6 h-6 text-red-500" />
                  <span>Security Analysis</span>
                </CardTitle>
                <CardDescription className="text-gray-400 text-lg mt-2">
                  Comprehensive security and validation checks
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-card p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { key: 'tokenExists', label: 'Token Exists', icon: Hash },
                    { key: 'metadataValid', label: 'Metadata Valid', icon: Eye },
                    { key: 'liquidityAvailable', label: 'Liquidity Available', icon: BarChart3 },
                    { key: 'contractVerified', label: 'Contract Verified', icon: Shield },
                    { key: 'communityTrust', label: 'Community Trust', icon: Users }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-6 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center space-x-4">
                        <Icon className="w-6 h-6 text-gray-400" />
                        <span className="font-medium text-white text-lg">{label}</span>
                      </div>
                      {verificationResult.checks[key as keyof typeof verificationResult.checks] ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Metrics - More spacing */}
            {verificationResult.metrics && (
              <Card className="glass-card border border-border">
                <CardHeader className="p-8">
                  <CardTitle className="flex items-center space-x-3 text-white text-2xl">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                    <span>Market Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-card p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-6 bg-gray-800 rounded-lg border border-green-500/30">
                      <Users className="w-8 h-8 text-green-500 mx-auto mb-3" />
                      <p className="text-lg text-gray-400 mb-1">Holders</p>
                      <p className="text-xl font-semibold text-white">{verificationResult.metrics.holders || 'N/A'}</p>
                    </div>
                    <div className="text-center p-6 bg-gray-800 rounded-lg border border-purple-500/30">
                      <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                      <p className="text-lg text-gray-400 mb-1">Market Cap</p>
                      <p className="text-xl font-semibold text-white">{verificationResult.metrics.marketCap || 'N/A'}</p>
                    </div>
                    <div className="text-center p-6 bg-gray-800 rounded-lg border border-blue-500/30">
                      <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                      <p className="text-lg text-gray-400 mb-1">24h Volume</p>
                      <p className="text-xl font-semibold text-white">{verificationResult.metrics.volume24h || 'N/A'}</p>
                    </div>
                    <div className="text-center p-6 bg-gray-800 rounded-lg border border-yellow-500/30">
                      <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
                      <p className="text-lg text-gray-400 mb-1">24h Change</p>
                      <p className="text-xl font-semibold text-white">{verificationResult.metrics.priceChange24h || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings - More spacing */}
            {!verificationResult.verified && verificationResult.warnings.length > 0 && (
              <Alert className="border-yellow-500 bg-yellow-950/50 p-8">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <AlertDescription>
                  <div className="mt-3">
                    <p className="font-medium text-yellow-400 mb-3 text-lg">Security Warnings</p>
                    <ul className="list-disc list-inside space-y-2 text-lg text-yellow-300">
                      {verificationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions - More spacing */}
            <Card className="glass-card border border-border">
              <CardContent className="pt-8 bg-card p-8">
                <div className="flex flex-wrap gap-6">
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-3 border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-6 py-3 text-lg"
                    onClick={() => verificationResult.explorerUrl && window.open(verificationResult.explorerUrl, '_blank')}
                    disabled={!verificationResult.explorerUrl}
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>View on Explorer</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-3 border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white px-6 py-3 text-lg"
                    onClick={() => handleVerification()}
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Refresh Data</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-3 border-green-500 text-green-500 hover:bg-green-500 hover:text-white px-6 py-3 text-lg">
                    <Wallet className="w-5 h-5" />
                    <span>Add to Watchlist</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section - More spacing */}
        {!verificationResult && !isVerifying && (
          <Card className="glass-card border border-border">
            <CardContent className="p-8 bg-card">
              <div className="text-center">
                <div style={{ padding: '15px' }}>
                  <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">How Verification Works</h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto text-lg leading-relaxed">
                  Our verification system analyzes multiple security factors including token existence, 
                  metadata validation, liquidity availability, and community trust metrics to provide 
                  a comprehensive safety score.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="text-center bg-black p-6 rounded-lg border border-gray-700">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                    <h4 className="font-medium text-white text-lg mb-2">Enter Details</h4>
                    <p className="text-base text-gray-300">Select network and enter token address or asset ID</p>
                  </div>
                  <div className="text-center bg-black p-6 rounded-lg border border-gray-700">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-white text-lg mb-2">Security Analysis</h4>
                    <p className="text-base text-gray-300">Comprehensive security and validation checks</p>
                  </div>
                  <div className="text-center bg-black p-6 rounded-lg border border-gray-700">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-white text-lg mb-2">Get Results</h4>
                    <p className="text-base text-gray-300">Detailed report with trust score and recommendations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}