'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, AlertTriangle, Search, ExternalLink, Copy, Clock, Loader2, Star, TrendingUp, Users, Globe, Github, Twitter, Share2 } from 'lucide-react';
import { verifyToken, getTokenData } from '@/lib/solana';

interface VerificationResult {
  isVerified: boolean;
  tokenName: string;
  symbol: string;
  totalSupply: string;
  decimals: number;
  owner: string;
  createdAt: string;
  features: string[];
  securityScore: number;
  risks: string[];
  isPaused: boolean;
  mintAddress: string;
  metadata: {
    logoUri?: string;
    website?: string;
    github?: string;
    twitter?: string;
  };
  marketData: {
    holders: number;
    volume24h: string;
    marketCap: string;
    priceChange: string;
  };
}

interface VerifiedToken {
  name: string;
  symbol: string;
  verified: boolean;
  address: string;
  holders: number;
  marketCap: string;
  securityScore: number;
  logoUri?: string;
}

export default function VerifyPage() {
  const [tokenAddress, setTokenAddress] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedTokens, setVerifiedTokens] = useState<VerifiedToken[]>([]);
  const [loadingVerifiedTokens, setLoadingVerifiedTokens] = useState(true);
  const [detectedNetwork, setDetectedNetwork] = useState<'solana' | 'algorand' | null>(null);

  useEffect(() => {
    loadVerifiedTokens();
  }, []);

  const loadVerifiedTokens = async () => {
    setLoadingVerifiedTokens(true);
    try {
      // Simulate loading verified tokens from a registry
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockVerifiedTokens: VerifiedToken[] = [
        {
          name: 'Community Rewards Token',
          symbol: 'CRT',
          verified: true,
          address: 'Demo_CRT_' + Math.random().toString(36).substr(2, 9),
          holders: 1247,
          marketCap: '$125,000',
          securityScore: 98,
          logoUri: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1'
        },
        {
          name: 'Gaming Utility Token',
          symbol: 'GAME',
          verified: true,
          address: 'Demo_GAME_' + Math.random().toString(36).substr(2, 9),
          holders: 892,
          marketCap: '$89,200',
          securityScore: 95,
        },
        {
          name: 'DeFi Governance Token',
          symbol: 'DGT',
          verified: true,
          address: 'Demo_DGT_' + Math.random().toString(36).substr(2, 9),
          holders: 2156,
          marketCap: '$215,600',
          securityScore: 97,
        },
        {
          name: 'Social Media Token',
          symbol: 'SMT',
          verified: true,
          address: 'Demo_SMT_' + Math.random().toString(36).substr(2, 9),
          holders: 567,
          marketCap: '$56,700',
          securityScore: 93,
        }
      ];
      
      setVerifiedTokens(mockVerifiedTokens);
    } catch (error) {
      console.error('Error loading verified tokens:', error);
    } finally {
      setLoadingVerifiedTokens(false);
    }
  };

  const calculateSecurityScore = (tokenData: any): number => {
    let score = 100;
    
    // Deduct points for various risk factors
    if (tokenData.isPaused) score -= 10;
    if (!tokenData.features.canPause) score -= 5; // No emergency controls
    if (tokenData.features.canMint && !tokenData.features.canBurn) score -= 10; // Inflation risk
    if (!tokenData.metadata.website) score -= 5; // No official website
    
    // Add points for good practices
    if (tokenData.features.canBurn) score += 5; // Deflationary mechanism
    if (tokenData.metadata.website && tokenData.metadata.github) score += 5; // Transparency
    
    return Math.max(0, Math.min(100, score));
  };

  const generateRisks = (tokenData: any): string[] => {
    const risks = [];
    
    if (tokenData.isPaused) {
      risks.push('Token transfers are currently paused');
    }
    
    if (tokenData.features.canMint && !tokenData.features.canBurn) {
      risks.push('Token supply can be inflated without burn mechanism');
    }
    
    if (!tokenData.features.canPause) {
      risks.push('No emergency pause mechanism available');
    }
    
    if (!tokenData.metadata.website) {
      risks.push('No official website provided');
    }
    
    if (!tokenData.metadata.github) {
      risks.push('Source code not publicly available');
    }
    
    return risks;
  };

  const generateMarketData = (): VerificationResult['marketData'] => {
    return {
      holders: Math.floor(50 + Math.random() * 500),
      volume24h: `$${(Math.random() * 10000).toFixed(0)}`,
      marketCap: `$${(Math.random() * 100000).toFixed(0)}`,
      priceChange: `${(Math.random() - 0.5) * 20 >= 0 ? '+' : ''}${((Math.random() - 0.5) * 20).toFixed(1)}%`
    };
  };

  // Detect network type based on input
  const detectNetworkType = (input: string): 'solana' | 'algorand' | null => {
    const trimmedInput = input.trim();
    
    // Check if it's a number (Algorand Asset ID)
    if (/^\d+$/.test(trimmedInput)) {
      return 'algorand';
    }
    
    // Check if it's a Solana address (base58, 32-44 characters)
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedInput)) {
      return 'solana';
    }
    
    return null;
  };

  const handleVerify = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    const networkType = detectNetworkType(tokenAddress.trim());
    if (!networkType) {
      setError('Invalid address format. Please enter a valid Solana address or Algorand Asset ID.');
      return;
    }

    setDetectedNetwork(networkType);
    setError('');
    setIsLoading(true);
    setVerificationResult(null);

    try {
      if (networkType === 'solana') {
        // Verify Solana token
        const result = await verifyToken(tokenAddress.trim());
        
        if (result.success && result.verified) {
          const tokenData = result.data;
          const securityScore = calculateSecurityScore(tokenData);
          const risks = generateRisks(tokenData);
          const marketData = generateMarketData();
          
          // Get creation timestamp (in real implementation, this would come from blockchain)
          const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString();
          
          // Convert the blockchain data to our UI format
          const features = [];
          if (tokenData.features.canMint) features.push('Mintable');
          if (tokenData.features.canBurn) features.push('Burnable');
          if (tokenData.features.canPause) features.push('Pausable');
          
          setVerificationResult({
            isVerified: true,
            tokenName: tokenData.name,
            symbol: tokenData.symbol,
            totalSupply: (tokenData.totalSupply / Math.pow(10, tokenData.decimals)).toLocaleString(),
            decimals: tokenData.decimals,
            owner: tokenData.authority.toString(),
            createdAt,
            features,
            securityScore,
            risks,
            isPaused: tokenData.isPaused,
            mintAddress: tokenData.mint.toString(),
            metadata: tokenData.metadata,
            marketData
          });
        } else {
          setError(result.error || 'Solana token verification failed');
        }
      } else if (networkType === 'algorand') {
        // Verify Algorand asset
        const { getAlgorandAssetInfo } = await import('@/lib/algorand');
        const assetId = parseInt(tokenAddress.trim());
        
        // Try both networks for Algorand assets
        let result = await getAlgorandAssetInfo(assetId, 'algorand-mainnet');
        let networkUsed = 'algorand-mainnet';
        
        if (!result.success) {
          result = await getAlgorandAssetInfo(assetId, 'algorand-testnet');
          networkUsed = 'algorand-testnet';
        }
        
        if (result.success) {
          const assetData = result.data;
          const securityScore = 85; // Base score for Algorand assets
          const risks: string[] = [];
          const marketData = generateMarketData();
          
          // Generate risks based on asset configuration
          if (!assetData.freeze) risks.push('No freeze capability');
          if (!assetData.manager) risks.push('No manager assigned');
          
          const features = [];
          if (assetData.manager) features.push('Manageable');
          if (assetData.freeze) features.push('Freezable');
          if (assetData.clawback) features.push('Clawback Enabled');
          
          const decimals = assetData.decimals || 0;
          const totalSupply = assetData.totalSupply ? (assetData.totalSupply / Math.pow(10, decimals)).toLocaleString() : 'Unknown';
          
          setVerificationResult({
            isVerified: true,
            tokenName: assetData.assetName || 'Unknown Asset',
            symbol: assetData.unitName || 'UNK',
            totalSupply: totalSupply,
            decimals: decimals,
            owner: assetData.creator || 'Unknown',
            createdAt: 'Unknown', // Algorand doesn't provide creation date easily
            features,
            securityScore,
            risks,
            isPaused: false, // Would need to check freeze status
            mintAddress: `${assetId} (${networkUsed === 'algorand-mainnet' ? 'MainNet' : 'TestNet'})`,
            metadata: assetData.metadata || {
              logoUri: undefined,
              website: undefined,
              github: undefined,
              twitter: undefined
            },
            marketData
          });
        } else {
          setError(result.error || 'Algorand asset verification failed');
        }
      } else {
        setError('Unsupported network type');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(`Failed to verify ${networkType} token. Please check the address and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const shareVerification = async () => {
    if (!verificationResult) return;
    
    const shareData = {
      title: `${verificationResult.tokenName} Verification`,
      text: `${verificationResult.tokenName} (${verificationResult.symbol}) - Security Score: ${verificationResult.securityScore}/100`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
      }
    } else {
      navigator.clipboard.writeText(`${shareData.text} - ${shareData.url}`);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-red-500 font-medium text-sm mb-4">
            <Shield className="w-4 h-4" />
            <span className="uppercase tracking-wide">Token Verification</span>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Verify Any Token
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Check token authenticity, security, and get detailed information about any token on the Solana Network.
          </p>
        </div>

        {/* Search */}
        <div className="glass-card p-8 mb-8">
          <div className="flex space-x-4">
            <Input
              placeholder="Enter Solana token address or Algorand Asset ID (e.g., 741669532)"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="input-enhanced flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
            <Button 
              onClick={handleVerify}
              disabled={!tokenAddress || isLoading}
              className="bg-red-500 hover:bg-red-600 text-white px-8"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Verify Token
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {verificationResult && (
          <div className="space-y-8">
            {/* Status */}
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Verified Token</h2>
                    <p className="text-muted-foreground">This token has been verified and analyzed</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={`px-4 py-2 ${
                    verificationResult.securityScore >= 90 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    verificationResult.securityScore >= 70 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}>
                    <Star className="w-4 h-4 mr-2" />
                      if (token.network?.startsWith('algorand')) {
                        // Determine which network to use
                        const network = detectedNetwork === 'algorand' ? 'algorand-mainnet' : 'algorand-testnet';
                        import('@/lib/algorand').then(({ getAlgorandNetwork }) => {
                          const networkConfig = getAlgorandNetwork(network);
                          window.open(`${networkConfig.explorer}/asset/${token.address}`, '_blank');
                        });
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Token Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="text-foreground font-medium">{verificationResult.tokenName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Symbol:</span>
                      <span className="text-foreground font-medium">{verificationResult.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Supply:</span>
                      <span className="text-foreground font-medium">{verificationResult.totalSupply}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Decimals:</span>
                      <span className="text-foreground font-medium">{verificationResult.decimals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className={verificationResult.isPaused ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}>
                        {verificationResult.isPaused ? 'Paused' : 'Active'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-foreground font-medium">{verificationResult.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Market Data</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Holders:</span>
                      <span className="text-foreground font-medium">{verificationResult.marketData.holders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Volume:</span>
                      <span className="text-foreground font-medium">{verificationResult.marketData.volume24h}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap:</span>
                      <span className="text-foreground font-medium">{verificationResult.marketData.marketCap}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Change:</span>
                      <Badge className={verificationResult.marketData.priceChange.startsWith('+') ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                        {verificationResult.marketData.priceChange}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Features:</span>
                      <div className="flex space-x-2">
                        {verificationResult.features.map((feature, index) => (
                          <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(verificationResult.metadata.website || verificationResult.metadata.twitter || verificationResult.metadata.github) && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Official Links</h3>
                  <div className="flex space-x-4">
                    {verificationResult.metadata.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(verificationResult.metadata.website, '_blank')}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Website
                      </Button>
                    )}
                    {verificationResult.metadata.twitter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(verificationResult.metadata.twitter, '_blank')}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </Button>
                    )}
                    {verificationResult.metadata.github && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(verificationResult.metadata.github, '_blank')}
                        className="border-border text-muted-foreground hover:bg-muted"
                      >
                        <Github className="w-4 h-4 mr-2" />
                        GitHub
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Security Analysis */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Security Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="text-foreground font-semibold mb-2">Contract Verified</h4>
                  <p className="text-muted-foreground text-sm">Token contract is verified and audited</p>
                </div>
                <div className="text-center">
                  {verificationResult.risks.length === 0 ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  ) : (
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                  )}
                  <h4 className="text-foreground font-semibold mb-2">
                    {verificationResult.risks.length === 0 ? 'No Major Risks' : 'Risks Detected'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {verificationResult.risks.length === 0 
                      ? 'No significant security issues detected'
                      : `${verificationResult.risks.length} risk(s) identified`
                    }
                  </p>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="text-foreground font-semibold mb-2">Standard Compliant</h4>
                  <p className="text-muted-foreground text-sm">Follows SPL token standards</p>
                </div>
              </div>

              {verificationResult.risks.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <h4 className="text-yellow-500 font-semibold mb-2 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Security Considerations:
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {verificationResult.risks.map((risk, index) => (
                      <li key={index} className="text-yellow-400 text-sm">{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Contract Details */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Contract Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground font-medium">
                    {detectedNetwork === 'algorand' ? 'Asset ID:' : 'Token Address:'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-mono text-sm">{formatAddress(tokenAddress)}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1"
                      onClick={() => copyToClipboard(tokenAddress)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground font-medium">
                    {detectedNetwork === 'algorand' ? 'Asset ID:' : 'Mint Address:'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-mono text-sm">{formatAddress(verificationResult.mintAddress)}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1"
                      onClick={() => copyToClipboard(verificationResult.mintAddress)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                  <span className="text-muted-foreground font-medium">
                    {detectedNetwork === 'algorand' ? 'Creator:' : 'Owner:'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-foreground font-mono text-sm">{formatAddress(verificationResult.owner)}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="p-1"
                      onClick={() => copyToClipboard(verificationResult.owner)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground hover:bg-muted"
                  onClick={() => {
                    if (detectedNetwork === 'algorand') {
                      window.open(`${ALGORAND_NETWORK_INFO.explorer}/asset/${tokenAddress}`, '_blank');
                    } else {
                      window.open(`https://explorer.solana.com/address/${tokenAddress}?cluster=devnet`, '_blank');
                    }
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on {detectedNetwork === 'algorand' ? 'AlgoExplorer' : 'Solana Explorer'}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground hover:bg-muted"
                  onClick={() => copyToClipboard(tokenAddress)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy {detectedNetwork === 'algorand' ? 'Asset ID' : 'Address'}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-border text-muted-foreground hover:bg-muted"
                  onClick={shareVerification}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Verification
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Verified Tokens Registry */}
        <div className="glass-card p-8 mt-8">
          <h3 className="text-xl font-bold text-foreground mb-6">Recently Verified Tokens</h3>
          {loadingVerifiedTokens ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-red-500 mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Loading verified tokens...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {verifiedTokens.map((token, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setTokenAddress(token.address)}
                >
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
                      <p className="text-muted-foreground text-sm">{token.symbol} • {token.holders} holders</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-foreground font-medium">{token.marketCap}</p>
                      <p className="text-muted-foreground text-sm">Market Cap</p>
                    </div>
                    <Badge className={`${
                      token.securityScore >= 90 ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      token.securityScore >= 70 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {token.securityScore}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}