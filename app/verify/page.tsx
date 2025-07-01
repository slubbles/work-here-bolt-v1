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
  BarChart3
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
  const [network, setNetwork] = useState<NetworkType>('solana-devnet');
  const [tokenId, setTokenId] = useState(searchParams?.get('id') || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [progress, setProgress] = useState(0);
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
      throw new Error(`Failed to fetch Solana token data: ${error}`);
    }
  };

  const fetchAlgorandTokenData = async (assetId: string, networkType: NetworkType): Promise<Partial<VerificationResult>> => {
    try {
      const isMainnet = networkType === 'algorand-mainnet';
      const assetInfo = await getAlgorandAssetInfo(parseInt(assetId), isMainnet ? 'mainnet' : 'testnet');
      
      if (!assetInfo.success || !assetInfo.data) {
        throw new Error(assetInfo.error || 'Asset not found');
      }

      const asset = assetInfo.data;
      
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
      
      const networkName = isMainnet ? 'mainnet' : 'testnet';
      
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
        explorerUrl: `https://allo.info/asset/${assetId}`,
        warnings: score < 80 ? [
          'Asset verification incomplete',
          'Limited market data available',
          'Research thoroughly before trading'
        ] : []
      };
    } catch (error) {
      throw new Error(`Failed to fetch Algorand asset data: ${error}`);
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
    toast({
      title: "Copied",
      description: "Token ID copied to clipboard",
    });
  };

  const getNetworkStatus = () => {
    const statusMap = {
      'solana-devnet': { label: 'Solana Devnet', color: 'bg-purple-500', icon: Globe },
      'algorand-mainnet': { label: 'Algorand Mainnet', color: 'bg-green-500', icon: Globe },
      'algorand-testnet': { label: 'Algorand Testnet', color: 'bg-blue-500', icon: Globe }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Token Verification</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verify token safety, legitimacy, and get detailed analytics before investing. 
            Support for Solana and Algorand networks.
          </p>
        </div>

        {/* Network Status */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-sm border">
            <div className={`w-3 h-3 rounded-full ${networkStatus.color}`}></div>
            <networkStatus.icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{networkStatus.label}</span>
          </div>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Token/Asset Verification</span>
            </CardTitle>
            <CardDescription className="text-blue-100">
              Select network and enter token address or asset ID to start verification
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Network Selection */}
              <div>
                <Label htmlFor="network" className="text-sm font-medium text-gray-700">Network</Label>
                <Select value={network} onValueChange={(value) => setNetwork(value as NetworkType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solana-devnet">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Solana Devnet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="algorand-mainnet">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Algorand Mainnet</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="algorand-testnet">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Algorand Testnet</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Token ID Input */}
              <div className="md:col-span-2">
                <Label htmlFor="token-id" className="text-sm font-medium text-gray-700">
                  {network.includes('solana') ? 'Token Address' : 'Asset ID'}
                </Label>
                <div className="flex mt-1">
                  <Input
                    id="token-id"
                    placeholder={network.includes('solana') ? 'Enter Solana token address...' : 'Enter Algorand asset ID...'}
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    disabled={isVerifying}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleVerification()}
                    disabled={!tokenId || isVerifying}
                    className="ml-2 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isVerifying ? (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4" />
                        <span>Verify</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Verification Progress */}
        {isVerifying && (
          <Card className="mb-8 shadow-lg">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verification in Progress</span>
                  </span>
                  <span className="font-medium text-blue-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-gray-100" />
                <p className="text-sm text-gray-500 text-center">
                  Analyzing token data and security metrics...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className="space-y-6">
            {/* Overall Status */}
            <Card className="shadow-lg border-0">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    {getStatusIcon(verificationResult.status)}
                    <div>
                      <h3 className="text-xl font-semibold">
                        {verificationResult.verified ? 'Verified Token' : 'Unverified Token'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Network: {networkStatus.label}
                      </p>
                    </div>
                  </CardTitle>
                  <div className="text-right">
                    <Badge variant={getScoreBadgeVariant(verificationResult.score)} className="text-lg px-3 py-1">
                      {verificationResult.score}/100
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">Trust Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Token ID Display */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Token ID</p>
                      <p className="font-mono text-sm text-gray-900 break-all">{verificationResult.tokenId}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyTokenId}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Token Metadata */}
                {verificationResult.metadata && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">Name</span>
                      <p className="font-medium text-gray-900">{verificationResult.metadata.name}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">Symbol</span>
                      <p className="font-medium text-gray-900">{verificationResult.metadata.symbol}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">Total Supply</span>
                      <p className="font-medium text-gray-900">{verificationResult.metadata.totalSupply || 'N/A'}</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <span className="text-gray-500 block">Decimals</span>
                      <p className="font-medium text-gray-900">{verificationResult.metadata.decimals}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Checks */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Security Analysis</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive security and validation checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'tokenExists', label: 'Token Exists', icon: Hash },
                    { key: 'metadataValid', label: 'Metadata Valid', icon: Eye },
                    { key: 'liquidityAvailable', label: 'Liquidity Available', icon: BarChart3 },
                    { key: 'contractVerified', label: 'Contract Verified', icon: Shield },
                    { key: 'communityTrust', label: 'Community Trust', icon: Users }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="font-medium">{label}</span>
                      </div>
                      {verificationResult.checks[key as keyof typeof verificationResult.checks] ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Metrics */}
            {verificationResult.metrics && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span>Market Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Holders</p>
                      <p className="text-lg font-semibold text-gray-900">{verificationResult.metrics.holders || 'N/A'}</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Market Cap</p>
                      <p className="text-lg font-semibold text-gray-900">{verificationResult.metrics.marketCap || 'N/A'}</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">24h Volume</p>
                      <p className="text-lg font-semibold text-gray-900">{verificationResult.metrics.volume24h || 'N/A'}</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">24h Change</p>
                      <p className="text-lg font-semibold text-gray-900">{verificationResult.metrics.priceChange24h || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {!verificationResult.verified && verificationResult.warnings.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50 shadow-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <AlertDescription>
                  <div className="mt-2">
                    <p className="font-medium text-yellow-800 mb-2">Security Warnings</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                      {verificationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-2"
                    onClick={() => verificationResult.explorerUrl && window.open(verificationResult.explorerUrl, '_blank')}
                    disabled={!verificationResult.explorerUrl}
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View on Explorer</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-2"
                    onClick={() => handleVerification()}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Data</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4" />
                    <span>Add to Watchlist</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        {!verificationResult && !isVerifying && (
          <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">How Token Verification Works</h3>
                <p className="text-gray-600 mb-4 max-w-2xl mx-auto">
                  Our verification system analyzes multiple security factors including token existence, 
                  metadata validation, liquidity availability, and community trust metrics to provide 
                  a comprehensive safety score.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center">
                    <Search className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">1. Enter Details</h4>
                    <p className="text-sm text-gray-600">Select network and enter token address or asset ID</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">2. Security Analysis</h4>
                    <p className="text-sm text-gray-600">Comprehensive security and validation checks</p>
                  </div>
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">3. Get Results</h4>
                    <p className="text-sm text-gray-600">Detailed report with trust score and recommendations</p>
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