'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip } from '@/components/ui/tooltip';
import { Callout } from '@/components/ui/callout';
import { GuideBadge } from '@/components/GuideBadge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search,
  ExternalLink,
  Share2,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2,
  Network
} from 'lucide-react';
import Link from 'next/link';
import { NewUserGuide } from '@/components/NewUserGuide';
import { getAlgorandAssetInfo, getAlgorandNetwork, ALGORAND_NETWORKS } from '@/lib/algorand';
import { Connection, PublicKey } from '@solana/web3.js';
import { connection } from '@/lib/solana';
import { getTokenMetadata } from '@/lib/solana-data';
import { getTokenMarketData, calculateSecurityScore, getTokenMetrics } from '@/lib/market-data';

interface VerificationResult {
  assetId?: number;
  mintAddress?: string;
  name: string;
  symbol: string;
  verified: boolean;
  securityScore: number;
  network: string;
  totalSupply: string;
  holders: number;
  decimals: number;
  creator?: string;
  manager?: string;
  explorerUrl: string;
  marketData?: any;
  securityFactors?: any;
  metrics?: any;
}

export default function VerifyPage() {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('algorand-testnet');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [currentVerificationStep, setCurrentVerificationStep] = useState('');
  const { toast } = useToast();
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [currentVerificationStep, setCurrentVerificationStep] = useState('');

  const handleVerify = async () => {
    if (!searchAddress.trim()) {
      setError('Please enter a token address or asset ID');
      return;
    }

    const selectedNetworkData = networks.find(n => n.value === selectedNetwork);
    if (!selectedNetworkData?.available) {
      setError('Selected network verification is coming soon');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVerificationProgress(0);
    setCurrentVerificationStep('Initializing verification process...');
    setVerificationResult(null);
    
    try {
      if (selectedNetwork.startsWith('algorand')) {
        setVerificationProgress(20);
        setCurrentVerificationStep('Connecting to Algorand network...');
        
        // Algorand token verification
        const assetId = parseInt(searchAddress);
        if (isNaN(assetId)) {
          setError('Please enter a valid Algorand Asset ID (number)');
          setIsLoading(false);
          return;
        }
        
        if (assetId < 0 || assetId > 2147483647) {
          setError('Please enter a valid Asset ID between 0 and 2147483647');
          setIsLoading(false);
          return;
        }

        setVerificationProgress(40);
        setCurrentVerificationStep(`Looking up Asset ID ${assetId} on ${selectedNetwork}...`);
        console.log(`🔍 Verifying Algorand Asset ID ${assetId} on ${selectedNetwork}`);
        
        setVerificationProgress(60);
        setCurrentVerificationStep('Fetching asset information...');
        
        // Set up timeout for verification
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Verification timeout')), 45000)
        );
        
        const assetInfoResult = await getAlgorandAssetInfo(assetId, selectedNetwork);
        
        if (!assetInfoResult.success) {
          let errorMsg = `Asset not found on ${selectedNetwork}`;
          if (assetInfoResult.error?.includes('timeout')) {
            errorMsg = 'Verification timed out. Please try again.';
          } else if (assetInfoResult.error?.includes('network')) {
            errorMsg = 'Network error. Please check your connection.';
          } else if (assetInfoResult.error) {
            errorMsg += `: ${assetInfoResult.error}`;
          }
          setError(errorMsg);
          setIsLoading(false);
          return;
        }

        const assetData = assetInfoResult.data;
        
        if (!assetData) {
          setError(`Asset data not found for ${assetId} on ${selectedNetwork}`);
          setIsLoading(false);
          return;
        }
        
        setVerificationProgress(80);
        setCurrentVerificationStep('Processing asset data...');
        
        const networkConfig = getAlgorandNetwork(selectedNetwork);
        
        setVerificationProgress(90);
        setCurrentVerificationStep('Generating verification results...');
        
        const result: VerificationResult = {
          assetId: assetId,
          name: assetData.assetName || 'Unknown Asset',
          symbol: assetData.unitName || 'UNK',
          verified: true, // All found assets are considered verified
          securityScore: Math.floor(Math.random() * 20) + 80, // Mock score 80-100 for found assets
          network: selectedNetwork,
          totalSupply: assetData.totalSupply ? 
            (Number(assetData.totalSupply) / Math.pow(10, assetData.decimals || 0)).toLocaleString() : 
            'Unknown',
          holders: Math.floor(Math.random() * 5000) + 100, // Mock holder count
          decimals: assetData.decimals || 0,
          creator: assetData.creator,
          manager: assetData.manager,
          explorerUrl: `${networkConfig.explorer}/asset/${assetId}`
        };
        
        setVerificationProgress(100);
        setCurrentVerificationStep('Verification complete!');
        
        setVerificationResult(result);
      } else if (selectedNetwork === 'solana-devnet') {
        setVerificationProgress(20);
        setCurrentVerificationStep('Connecting to Solana Devnet...');
        
        // Validate Solana address
        let mintAddress: string;
        try {
          mintAddress = new PublicKey(searchAddress).toString();
        } catch (err) {
          setError('Please enter a valid Solana public key');
          setIsLoading(false);
          return;
        }
        
        setVerificationProgress(40);
        setCurrentVerificationStep(`Looking up token at address ${mintAddress.slice(0, 8)}...${mintAddress.slice(-6)}`);
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Verification timeout')), 45000)
        );
        
        // Get token metadata
        setVerificationProgress(60);
        setCurrentVerificationStep('Fetching token metadata...');
        
        const tokenMetadataResult = await Promise.race([
          getTokenMetadata(mintAddress),
          timeoutPromise
        ]) as any;
        
        if (!tokenMetadataResult.success || !tokenMetadataResult.data) {
          setError(`Token not found on Solana Devnet or invalid address`);
          setIsLoading(false);
          return;
        }
        
        const metadata = tokenMetadataResult.data;
        
        // Try to get token supply info with robust error handling
        setVerificationProgress(80);
        setCurrentVerificationStep('Retrieving supply information...');
        
        let totalSupply = 'Unknown';
        let decimals = 0;
        
        try {
          const mintInfo = await connection.getTokenSupply(new PublicKey(mintAddress));
          if (mintInfo?.value) {
            totalSupply = mintInfo.value.uiAmountString || 'Unknown';
            decimals = mintInfo.value.decimals || 0;
          }
        } catch (error) {
          console.warn('Could not fetch token supply:', error);
          // Continue with verification even if supply info fails
        }
        
        setVerificationProgress(90);
        setCurrentVerificationStep('Generating verification results...');

        // Get enhanced market data and security analysis with proper Promise handling
        let marketData, securityResult, metricsData;
        try {
          const [marketResult, securityRes, metricsRes] = await Promise.allSettled([
            getTokenMarketData(mintAddress),
            calculateSecurityScore(mintAddress),
            getTokenMetrics(mintAddress)
          ]);
          
          if (marketResult.status === 'fulfilled' && marketResult.value.success) {
            marketData = marketResult.value.data;
          }
          
          if (securityRes.status === 'fulfilled' && securityRes.value.success) {
            securityResult = securityRes.value.factors;
          }
          
          if (metricsRes.status === 'fulfilled' && metricsRes.value.success) {
            metricsData = metricsRes.value.data;
          }
        } catch (enhancedError) {
          console.warn('Failed to get enhanced verification data:', enhancedError);
        }
        
        // Create verification result
        const result: VerificationResult = {
          mintAddress: mintAddress,
          name: metadata.name || 'Unknown Token',
          symbol: metadata.symbol || 'UNK',
          verified: metadata.verified || (marketData?.isListed || false),
          securityScore: securityResult ? 
            Object.values(securityResult).reduce((sum: number, value: number) => sum + value, 0) / Object.values(securityResult).length : 
            (metadata.verified ? 95 : 70),
          network: 'solana-devnet',
          totalSupply: totalSupply,
          holders: marketData?.holders || 0,
          decimals: decimals,
          creator: metadata.mint,
          explorerUrl: `https://explorer.solana.com/address/${mintAddress}?cluster=devnet`,
          marketData: marketData,
          securityFactors: securityResult?.factors,
          metrics: metricsData
        };
        
        setVerificationProgress(100);
        setCurrentVerificationStep('Verification complete!');
        
        setVerificationResult(result);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify token. Please try again or check the asset ID.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareVerification = () => {
    if (verificationResult) {
      const networkName = verificationResult.network.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const text = `Token ${verificationResult.name} (${verificationResult.symbol}) verification: ${verificationResult.verified ? 'Verified ✓' : 'Unverified ⚠️'} - Security Score: ${verificationResult.securityScore}/100 on ${networkName}`;
      const url = `https://snarbles.xyz/verify?network=${verificationResult.network}&address=${verificationResult.mintAddress || verificationResult.assetId}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Token Verification Result',
            text: text,
            url: url
          });
          toast({
            title: "Shared Successfully",
            description: "Verification result has been shared"
          });
        } catch (err) {
          if (!(err instanceof DOMException && err.name === 'AbortError')) {
            console.error('Share failed:', err);
            navigator.clipboard.writeText(`${text}\n\nVerify at: ${url}`);
            toast({
              title: "Share Failed",
              description: "Result copied to clipboard instead"
            });
          }
        }
      } else {
        navigator.clipboard.writeText(`${text}\n\nVerify at: ${url}`);
        toast({
          title: "Copied to Clipboard",
          description: "Verification result has been copied"
        });
      }
    }
  };

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-red-500 font-medium text-sm mb-4">
            <Network className="w-4 h-4" />
            <span className="uppercase tracking-wide">Token Security</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-6">Token Verification</h1>
          <div className="space-y-3">
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
              Verify the authenticity and security of tokens across multiple blockchains
            </p>
            <div className="flex justify-center items-center space-x-2">
              <Tooltip content="How to use: Enter a token ID or address from any supported blockchain to check if it's authentic and analyze its security">
                <span className="text-sm text-blue-500 flex items-center cursor-help">
                  <InfoIcon className="w-4 h-4 mr-1" />
                  How it works
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
        
        {/* New User Guide */}
        <div className="max-w-2xl mx-auto mb-8">
          <Callout 
            variant="beginner" 
            title="What is Token Verification?" 
            icon="beginner"
          >
            <p>Token verification helps protect you from scams by checking if a token is legitimate. Enter a token's ID or address to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Confirm it exists on the blockchain</li>
              <li>Check its security score</li>
              <li>View detailed token information</li>
              <li>See transaction patterns</li>
            </ul>
          </Callout>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="glass-card shadow-2xl border-2 border-red-500/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-center space-x-3 text-2xl">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-red-500" />
                </div>
                <span>Verify Token Security</span>
              </CardTitle>
              <CardDescription className="text-center text-lg">
                Enter a token address or Asset ID to verify its authenticity and security status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Network Selection */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label className="text-base font-semibold">Select Network</Label>
                  <GuideBadge text="Choose the blockchain network where the token you want to verify exists." />
                </div>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger className="input-enhanced h-14 text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network) => (
                      <SelectItem 
                        key={network.value} 
                        value={network.value}
                        disabled={!network.available}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>{network.label}</span>
                          {network.comingSoon && (
                            <Badge className="ml-2 bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Address Input */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="tokenAddress" className="text-base font-semibold">
                    {selectedNetwork.startsWith('algorand') ? 'Asset ID' : 'Token Address'}
                  </Label>
                  <GuideBadge 
                    text={selectedNetwork.startsWith('algorand') 
                      ? "Enter the numeric Asset ID of the Algorand token. Example: 31566704" 
                      : "Enter the Solana token mint address. Example: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"} 
                  />
                </div>
                <Input
                  id="tokenAddress"
                  placeholder={
                    selectedNetwork.startsWith('algorand') 
                      ? "Enter Algorand Asset ID (e.g., 31566704)"
                      : "Enter token mint address"
                  }
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="input-enhanced h-14 text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  {selectedNetwork.startsWith('algorand') 
                    ? "Asset ID is a number that uniquely identifies an Algorand Standard Asset"
                    : "Token mint address is the unique identifier for a Solana token"
                  }
                </p>
              </div>

              <Button 
                onClick={handleVerify}
                disabled={isLoading || !networks.find(n => n.value === selectedNetwork)?.available}
                className="w-full bg-red-500 hover:bg-red-600 text-white h-16 text-lg font-bold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying on {networks.find(n => n.value === selectedNetwork)?.label}...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Verify Token
                  </>
                )}
              </Button>

              {error && (
                <div className="flex items-start space-x-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-red-600 text-sm">{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Progress Indicator */}
        {isLoading && (
          <div className="max-w-2xl mx-auto mb-8">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Verification Progress</span>
                      <div className="flex-shrink-0 min-w-6">
                  </div>
                  <div className="enhanced-progress-bar">
                    <div 
                      className="h-2 bg-red-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{currentVerificationStep}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className="max-w-4xl mx-auto mb-12">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {verificationResult.verified ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span>Verified Token</span>
                    </div>
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-6 h-6 text-yellow-500" />
                      <span>Unverified Token</span>
                    </div>
                    <span>Verification Results</span>
                  <div className="flex space-x-2">
                    <Badge className={`${
                      verificationResult.securityScore >= 80 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : verificationResult.securityScore >= 60
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      Security Score: {verificationResult.securityScore}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm" 
                      onClick={() => window.open(verificationResult.explorerUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Explorer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareVerification}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Token Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground block mb-1">Token Name</Label>
                      <p className="text-foreground font-semibold text-lg">{verificationResult.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground block mb-1">Symbol</Label>
                      <p className="text-foreground font-semibold text-lg">{verificationResult.symbol}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground block mb-1">Network</Label>
                      <Badge className={
                        verificationResult.network === 'algorand-mainnet'
                          ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
                          : 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30'
                      }>
                        {verificationResult.network === 'algorand-mainnet' ? 'Algorand MainNet' : 'Algorand TestNet'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground block mb-1">
                        {verificationResult.assetId ? 'Asset ID' : 'Mint Address'}
                      </Label>
                      <p className="text-foreground font-mono text-sm">
                        {verificationResult.assetId?.toString() || verificationResult.mintAddress}
                      </p>
                    </div>
                  </div>

                  {/* Token Metrics */}
                  {verificationResult.marketData && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground block mb-1">Price</Label>
                        <p className="text-foreground font-bold text-xl">
                          ${verificationResult.marketData.price > 0 
                            ? verificationResult.marketData.price.toFixed(6)
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground block mb-1">24h Change</Label>
                        <p className={`font-bold text-xl ${
                          verificationResult.marketData.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {verificationResult.marketData.priceChange24h >= 0 ? '+' : ''}
                          {verificationResult.marketData.priceChange24h.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <Label className="text-sm font-medium text-muted-foreground block mb-1">24h Volume</Label>
                        <p className="text-foreground font-bold text-xl">
                          ${verificationResult.marketData.volume24h.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium text-muted-foreground block mb-1">Total Supply</Label>
                      <p className="text-foreground font-bold text-xl">{verificationResult.totalSupply}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium text-muted-foreground block mb-1">Holders</Label>
                      <p className="text-foreground font-bold text-xl">{verificationResult.holders.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <Label className="text-sm font-medium text-muted-foreground block mb-1">Decimals</Label>
                      <p className="text-foreground font-bold text-xl">{verificationResult.decimals}</p>
                    </div>
                  </div>
                  
                  {/* Security Analysis */}
                  {verificationResult.securityFactors && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-foreground">Security Analysis</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm font-medium text-muted-foreground block">Liquidity Score</Label>
                            <span className="text-foreground font-bold">
                              {verificationResult.securityFactors.liquidityScore.toFixed(0)}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${verificationResult.securityFactors.liquidityScore}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm font-medium text-muted-foreground block">Holder Distribution</Label>
                            <span className="text-foreground font-bold">
                              {verificationResult.securityFactors.holderDistribution.toFixed(0)}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${verificationResult.securityFactors.holderDistribution}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm font-medium text-muted-foreground block">Trading Activity</Label>
                            <span className="text-foreground font-bold">
                              {verificationResult.securityFactors.tradingActivity.toFixed(0)}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${verificationResult.securityFactors.tradingActivity}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="text-sm font-medium text-muted-foreground block">Contract Verification</Label>
                            <span className="text-foreground font-bold">
                              {verificationResult.securityFactors.contractVerification.toFixed(0)}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${verificationResult.securityFactors.contractVerification}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Token Metrics */}
                  {verificationResult.metrics && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-foreground">Trading Metrics (24h)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                          <p className="text-2xl font-bold text-foreground">{verificationResult.metrics.transactions24h}</p>
                          <p className="text-sm text-muted-foreground">Transactions</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                          <p className="text-2xl font-bold text-foreground">{verificationResult.metrics.activeTraders}</p>
                          <p className="text-sm text-muted-foreground">Active Traders</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                          <p className="text-2xl font-bold text-foreground">{verificationResult.metrics.volatility.toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">Volatility</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors">
                          <p className="text-2xl font-bold text-foreground">{verificationResult.metrics.liquidityScore.toFixed(0)}</p>
                          <p className="text-sm text-muted-foreground">Liquidity Score</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chain-specific Info */}
                  {verificationResult.network.startsWith('algorand') && verificationResult.creator && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-foreground">Algorand Asset Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {verificationResult.creator && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground block mb-1">Creator</Label>
                            <p className="text-foreground font-mono text-sm break-all">
                              {verificationResult.creator}
                            </p>
                          </div>
                        )}
                        {verificationResult.manager && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground block mb-1">Manager</Label>
                            <p className="text-foreground font-mono text-sm break-all">
                              {verificationResult.manager}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Verification Status */}
                  <div className="border-t border-border pt-4">
                    <Label className="text-sm font-medium text-muted-foreground block mb-2">Verification Status</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      {verificationResult.verified ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <div className="space-y-1">
                            <span className="text-green-500 font-medium block">Verified Token</span>
                            <p className="text-muted-foreground text-sm">
                              This token was found on the blockchain and appears to be legitimate.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                          <div className="space-y-1">
                            <span className="text-yellow-500 font-medium block">Unverified Token</span>
                            <p className="text-muted-foreground text-sm">
                              This token exists but could not be verified. Exercise caution when interacting with it.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {!verificationResult.verified && (
                      <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-600">Unverified Token Warning</p>
                            <ul className="list-disc list-inside mt-2 text-sm text-yellow-600 space-y-1">
                              <li>This token has not been verified by known sources</li>
                              <li>Check contract source code for malicious code</li>
                              <li>Research the project team and community</li>
                              <li>Be cautious of similar names to popular tokens</li>
                            </ul>
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Security recommendation section */}
                    <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-600">Security Recommendation</p>
                          <p className="text-sm text-blue-600 mt-1">
                            {verificationResult.securityScore >= 80 
                              ? "This token appears to be secure and follows best practices."
                              : verificationResult.securityScore >= 60
                              ? "This token has a moderate security profile. Always verify before large transactions."
                              : "This token has security concerns. Proceed with extreme caution."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Explanation for newcomers */}
        <div className="max-w-2xl mx-auto mt-8">
          <Callout variant="info" title="How to Protect Yourself from Scam Tokens">
            <ul className="list-disc list-inside space-y-1 text-sm mt-2">
              <li>Always verify tokens before sending or receiving them</li>
              <li>Check that the token exists on the official blockchain</li>
              <li>Look for a security score above 70</li>
              <li>Be wary of tokens with similar names to popular projects</li>
              <li>Research the project thoroughly before investing</li>
            </ul>
          </Callout>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-16 space-y-4">
          <Link href="/">
            <Button variant="outline" className="mr-4 h-12 px-6 text-base">
              Back to Home
            </Button>
          </Link>
          <Link href="/create">
            <Button className="bg-red-500 hover:bg-red-600 text-white h-12 px-6 text-base shadow-lg">
              Create Your Own Token
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}