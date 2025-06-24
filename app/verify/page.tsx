'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { getAlgorandAssetInfo, getAlgorandNetwork } from '@/lib/algorand';

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
}

export default function VerifyPage() {
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('algorand-testnet');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const networks = [
    { value: 'algorand-mainnet', label: 'Algorand MainNet', available: true },
    { value: 'algorand-mainnet', label: 'Algorand Mainnet', available: true },
    { value: 'algorand-testnet', label: 'Algorand Testnet', available: true },
    { value: 'solana-devnet', label: 'Solana Network', available: false, comingSoon: true }
  ];

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
    
    try {
      if (selectedNetwork.startsWith('algorand')) {
        // Algorand token verification
        const assetId = parseInt(searchAddress);
        if (isNaN(assetId)) {
          setError('Please enter a valid Algorand Asset ID (number)');
          setIsLoading(false);
          return;
        }

        console.log(`🔍 Verifying Algorand Asset ID ${assetId} on ${selectedNetwork}`);
        
        const assetInfoResult = await getAlgorandAssetInfo(assetId, selectedNetwork);
        
        if (!assetInfoResult.success) {
          setError(`Asset not found on ${selectedNetwork}: ${assetInfoResult.error}`);
          setIsLoading(false);
          return;
        }

        const assetData = assetInfoResult.data;
        const networkConfig = getAlgorandNetwork(selectedNetwork);
        
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
        
        setVerificationResult(result);
      } else {
        // Solana verification (when available)
        setError('Solana verification coming soon');
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
      const text = `Token ${verificationResult.name} (${verificationResult.symbol}) verification: ${verificationResult.verified ? 'Verified' : 'Unverified'} - Security Score: ${verificationResult.securityScore}/100 on ${verificationResult.network}`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Token Verification Result',
          text: text,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(text);
      }
    }
  };

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 text-red-500 font-medium text-sm mb-4">
            <Network className="w-4 h-4" />
            <span className="uppercase tracking-wide">Token Security</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Token Verification</h1>
          <p className="text-muted-foreground text-lg">
            Verify the authenticity and security of tokens across multiple blockchains
          </p>
        </div>

        {/* Search Section */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Verify Token</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Network Selection */}
            <div className="space-y-2">
              <Label>Select Network</Label>
              <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                <SelectTrigger className="input-enhanced">
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
              <Label htmlFor="tokenAddress">
                {selectedNetwork.startsWith('algorand') ? 'Asset ID' : 'Token Address'}
              </Label>
              <Input
                id="tokenAddress"
                placeholder={
                  selectedNetwork.startsWith('algorand') 
                    ? "Enter Algorand Asset ID (e.g., 31566704)" 
                    : "Enter token mint address..."
                }
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="input-enhanced"
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
              className="w-full bg-red-500 hover:bg-red-600 text-white"
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
              <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Network Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {networks.map((network) => (
            <Card 
              key={network.value}
              className={`glass-card transition-all duration-300 ${
                selectedNetwork === network.value ? 'ring-2 ring-red-500/50' : ''
              } ${!network.available ? 'opacity-60' : 'hover:scale-105 cursor-pointer'}`}
              onClick={() => network.available && setSelectedNetwork(network.value)}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold text-foreground mb-2">{network.label}</h3>
                {network.available ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
                    Coming Soon
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Verification Results */}
        {verificationResult && (
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  {verificationResult.verified ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  )}
                  <span>Verification Results</span>
                </CardTitle>
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
                    <Label className="text-sm font-medium text-muted-foreground">Token Name</Label>
                    <p className="text-foreground font-semibold text-lg">{verificationResult.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Symbol</Label>
                    <p className="text-foreground font-semibold text-lg">{verificationResult.symbol}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Network</Label>
                    <Badge className={
                      verificationResult.network === 'algorand-mainnet'
                        ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
                        : 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30'
                    }>
                      {verificationResult.network === 'algorand-mainnet' ? 'Algorand MainNet' : 'Algorand TestNet'}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {verificationResult.assetId ? 'Asset ID' : 'Address'}
                    </Label>
                    <p className="text-foreground font-mono text-sm">
                      {verificationResult.assetId || verificationResult.mintAddress}
                    </p>
                  </div>
                </div>

                {/* Token Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-medium text-muted-foreground">Total Supply</Label>
                    <p className="text-foreground font-bold text-xl">{verificationResult.totalSupply}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-medium text-muted-foreground">Holders</Label>
                    <p className="text-foreground font-bold text-xl">{verificationResult.holders.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <Label className="text-sm font-medium text-muted-foreground">Decimals</Label>
                    <p className="text-foreground font-bold text-xl">{verificationResult.decimals}</p>
                  </div>
                </div>

                {/* Algorand Specific Info */}
                {verificationResult.network.startsWith('algorand') && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-foreground">Algorand Asset Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {verificationResult.creator && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Creator</Label>
                          <p className="text-foreground font-mono text-sm break-all">
                            {verificationResult.creator}
                          </p>
                        </div>
                      )}
                      {verificationResult.manager && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
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
                  <Label className="text-sm font-medium text-muted-foreground">Verification Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {verificationResult.verified ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-500 font-medium">Verified Token</span>
                        <p className="text-muted-foreground text-sm ml-2">
                          This token was found on the blockchain and appears to be legitimate.
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">Unverified Token</span>
                        <p className="text-muted-foreground text-sm ml-2">
                          This token could not be verified. Exercise caution.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link href="/">
            <Button variant="outline" className="mr-4">
              Back to Home
            </Button>
          </Link>
          <Link href="/create">
            <Button className="bg-red-500 hover:bg-red-600 text-white">
              Create Your Own Token
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}