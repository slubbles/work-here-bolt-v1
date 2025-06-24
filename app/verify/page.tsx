'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search,
  ExternalLink,
  Share2,
  CheckCircle,
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface VerificationResult {
  mintAddress: string;
  name: string;
  symbol: string;
  verified: boolean;
  securityScore: number;
  network: string;
  totalSupply: string;
  holders: number;
}

export default function VerifyPage() {
  const [searchAddress, setSearchAddress] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!searchAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Mock verification - replace with actual verification logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResult: VerificationResult = {
        mintAddress: searchAddress,
        name: 'Example Token',
        symbol: 'EXT',
        verified: Math.random() > 0.5,
        securityScore: Math.floor(Math.random() * 100),
        network: 'solana',
        totalSupply: '1,000,000',
        holders: Math.floor(Math.random() * 10000)
      };
      
      setVerificationResult(mockResult);
    } catch (err) {
      setError('Failed to verify token. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const shareVerification = () => {
    if (verificationResult) {
      navigator.clipboard.writeText(
        `Token ${verificationResult.name} (${verificationResult.symbol}) verification: ${verificationResult.verified ? 'Verified' : 'Unverified'} - Security Score: ${verificationResult.securityScore}/100`
      );
    }
  };

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Token Verification</h1>
          <p className="text-muted-foreground text-lg">
            Verify the authenticity and security of any token
          </p>
        </div>

        {/* Search Section */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle>Enter Token Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tokenAddress">Token Address</Label>
              <Input
                id="tokenAddress"
                placeholder="Enter token mint address..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button 
              onClick={handleVerify}
              disabled={isLoading}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
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
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

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
                    onClick={() => window.open(`https://explorer.solana.com/address/${verificationResult.mintAddress}`, '_blank')}
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
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Token Name</Label>
                    <p className="text-foreground">{verificationResult.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Symbol</Label>
                    <p className="text-foreground">{verificationResult.symbol}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Supply</Label>
                    <p className="text-foreground">{verificationResult.totalSupply}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Holders</Label>
                    <p className="text-foreground">{verificationResult.holders.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label className="text-sm font-medium">Verification Status</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    {verificationResult.verified ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-green-500 font-medium">Verified Token</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        <span className="text-yellow-500 font-medium">Unverified Token</span>
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
            <Button variant="outline">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}