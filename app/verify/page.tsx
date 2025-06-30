'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertTriangle, Search, ExternalLink, Shield, Clock, Users } from 'lucide-react';

interface VerificationResult {
  verified: boolean;
  score: number;
  checks: {
    contractVerified: boolean;
    liquidityLocked: boolean;
    ownershipRenounced: boolean;
    auditCompleted: boolean;
    communityTrust: boolean;
  };
  warnings: string[];
  metadata?: {
    name: string;
    symbol: string;
    totalSupply: string;
    decimals: number;
    contractAddress: string;
  };
}

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [tokenAddress, setTokenAddress] = useState(searchParams?.get('address') || '');
  const [selectedNetwork, setSelectedNetwork] = useState('solana-devnet');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (searchParams?.get('address')) {
      handleVerification();
    }
  }, [searchParams]);

  const handleVerification = async () => {
    if (!tokenAddress || !selectedNetwork) return;

    setIsVerifying(true);
    setProgress(0);
    setVerificationResult(null);

    // Simulate verification process with progress updates
    const steps = [
      'Validating contract address...',
      'Checking contract verification...',
      'Analyzing liquidity locks...',
      'Verifying ownership status...',
      'Checking audit reports...',
      `Calculating trust score on ${selectedNetwork}...`
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(((i + 1) / steps.length) * 100);
    }

    // Mock verification result
    const mockResult: VerificationResult = {
      verified: Math.random() > 0.3,
      score: Math.floor(Math.random() * 40) + 60,
      checks: {
        contractVerified: Math.random() > 0.2,
        liquidityLocked: Math.random() > 0.4,
        ownershipRenounced: Math.random() > 0.5,
        auditCompleted: Math.random() > 0.7,
        communityTrust: Math.random() > 0.3
      },
      warnings: [],
      metadata: {
        name: 'Sample Token',
        symbol: 'SMPL',
        totalSupply: '1,000,000,000',
        decimals: 9,
        contractAddress: tokenAddress
      }
    };

    if (!mockResult.verified) {
      mockResult.warnings = [
        'This token has not been verified by known sources',
        'Check contract source code for malicious code',
        'Research the project team and community',
        'Be cautious of similar names to popular tokens'
      ];
    }

    setVerificationResult(mockResult);
    setIsVerifying(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Token Verification</h1>
          <p className="text-lg text-gray-300">
            Verify token safety and legitimacy before investing
          </p>
          <p className="text-sm text-gray-400 mt-2">Select network and enter token address to begin verification</p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="w-5 h-5" />
              <span>Enter Token Address</span>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Paste the token contract address to start verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="network-select" className="text-gray-300">Network</Label>
                <select
                  id="network-select"
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  disabled={isVerifying}
                  className="w-full p-2 rounded-md border border-gray-700 bg-gray-900 text-white"
                >
                  <option value="solana-devnet">Solana Devnet</option>
                  <option value="solana-mainnet">Solana Mainnet</option>
                  <option value="algorand-testnet">Algorand Testnet</option>
                  <option value="algorand-mainnet">Algorand Mainnet</option>
                </select>
              </div>
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <Label htmlFor="token-address" className="text-gray-300">Token Address</Label>
                  <Input
                    id="token-address"
                    placeholder={selectedNetwork.includes('solana') ? 'Solana address...' : 'Algorand asset ID...'}
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    disabled={isVerifying}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                <div className="flex md:items-end">
                  <Button 
                    onClick={handleVerification}
                    disabled={!tokenAddress || isVerifying}
                    className="px-8 w-full md:w-auto bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Progress */}
        {isVerifying && (
          <Card className="mb-8 bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-300">
                  <span className="text-muted-foreground">Verification Progress</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verification Results */}
        {verificationResult && (
          <div className="space-y-6">
            {/* Overall Status */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    {verificationResult.verified ? (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span>Verified Token</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                        <span>Unverified Token</span>
                      </div>
                    )}
                  </CardTitle>
                  <Badge variant={getScoreBadgeVariant(verificationResult.score)} className="text-white">
                    Score: {verificationResult.score}/100
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {verificationResult.metadata && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-300">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{verificationResult.metadata.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Symbol:</span>
                      <p className="font-medium">{verificationResult.metadata.symbol}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Supply:</span>
                      <p className="font-medium">{verificationResult.metadata.totalSupply}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Decimals:</span>
                      <p className="font-medium">{verificationResult.metadata.decimals}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Checks */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Checks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span>Contract Verified</span>
                    {verificationResult.checks.contractVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span>Liquidity Locked</span>
                    {verificationResult.checks.liquidityLocked ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span>Ownership Renounced</span>
                    {verificationResult.checks.ownershipRenounced ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span>Audit Completed</span>
                    {verificationResult.checks.auditCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warnings for Unverified Tokens */}
            {!verificationResult.verified && verificationResult.warnings.length > 0 && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-600">Unverified Token Warning</p>
                    <ul className="list-disc list-inside mt-2 text-sm text-yellow-600 space-y-1">
                      {verificationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Link href={`https://explorer.solana.com/address/${verificationResult?.metadata?.contractAddress || ''}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                      <span>View on Explorer</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Link href={`/verify/community?address=${verificationResult?.metadata?.contractAddress || ''}`}>
                      <Users className="w-4 h-4" />
                      <span>Community Analysis</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Link href={`/verify/history?address=${verificationResult?.metadata?.contractAddress || ''}`}>
                      <Clock className="w-4 h-4" />
                      <span>Price History</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}