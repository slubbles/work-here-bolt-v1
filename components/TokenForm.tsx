'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, Loader2, CheckCircle, AlertTriangle, Rocket, Network, Globe, Github, Twitter, Zap, DollarSign, Clock, Shield } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, optInToAsset, checkWalletConnection } from '@/lib/algorand';
import { supabaseHelpers } from '@/lib/supabase';
import { useTokenHistory } from '@/hooks/useSupabase';

interface TokenFormProps {
  tokenData: {
    name: string;
    symbol: string;
    description: string;
    totalSupply: string;
    decimals: string;
    logoUrl: string;
    website: string;
    github: string;
    twitter: string;
    mintable: boolean;
    burnable: boolean;
    pausable: boolean;
    network: string;
  };
  setTokenData: (data: any) => void;
}

export default function TokenForm({ tokenData, setTokenData }: TokenFormProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [algorandWalletStatus, setAlgorandWalletStatus] = useState<any>(null);
  
  // Supabase token history integration
  const { saveToken } = useTokenHistory();

  // Wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey, wallet: solanaWallet } = useWallet();
  const { connected: algorandConnected, address: algorandAddress, signTransaction: algorandSignTransaction, selectedNetwork: algorandSelectedNetwork, setSelectedNetwork: setAlgorandSelectedNetwork } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check Algorand wallet status when connected
    if (algorandConnected && algorandAddress && (tokenData.network === 'algorand-testnet' || tokenData.network === 'algorand-mainnet')) {
      checkAlgorandWalletStatus();
    }
  }, [algorandConnected, algorandAddress, tokenData.network]);

  // Update Algorand network when token network changes
  useEffect(() => {
    if (tokenData.network === 'algorand-testnet' || tokenData.network === 'algorand-mainnet') {
      if (algorandSelectedNetwork !== tokenData.network) {
        setAlgorandSelectedNetwork(tokenData.network);
      }
    }
  }, [tokenData.network, algorandSelectedNetwork, setAlgorandSelectedNetwork]);

  const checkAlgorandWalletStatus = async () => {
    if (!algorandAddress) return;
    
    try {
      const status = await checkWalletConnection(algorandAddress, tokenData.network);
      setAlgorandWalletStatus(status);
    } catch (error) {
      console.error(`Error checking Algorand wallet status for ${tokenData.network}:`, error);
    }
  };

  const updateTokenData = (field: string, value: any) => {
    setTokenData({ ...tokenData, [field]: value });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    setError('');

    try {
      const result = await supabaseHelpers.uploadFileToStorage(file, 'token-assets');
      
      if (result.success && result.url) {
        updateTokenData('logoUrl', result.url);
      } else {
        setError(result.error || 'Failed to upload image');
      }
    } catch (error) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!tokenData.name.trim()) {
      setError('Token name is required');
      return false;
    }
    if (!tokenData.symbol.trim()) {
      setError('Token symbol is required');
      return false;
    }
    if (!tokenData.totalSupply || parseFloat(tokenData.totalSupply) <= 0) {
      setError('Total supply must be greater than 0');
      return false;
    }
    return true;
  };

  // Save token to Supabase after successful deployment
  const saveTokenToSupabase = async (tokenDetails: any, network: string) => {
    try {
      const tokenData = {
        token_name: tokenDetails.name || tokenData.name,
        token_symbol: tokenDetails.symbol || tokenData.symbol,
        network: network,
        contract_address: tokenDetails.assetId || tokenDetails.tokenAddress || tokenDetails.mintAddress,
        description: tokenData.description,
        total_supply: parseFloat(tokenData.totalSupply) || undefined,
        decimals: parseInt(tokenData.decimals) || undefined,
        logo_url: tokenData.logoUrl || undefined,
        website: tokenData.website || undefined,
        github: tokenData.github || undefined,
        twitter: tokenData.twitter || undefined,
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable,
        transaction_hash: tokenDetails.signature || tokenDetails.transactionId
      };

      const result = await saveToken(tokenData);
      if (result.success) {
        console.log('✅ Token saved to Supabase successfully');
      } else {
        console.warn('⚠️ Failed to save token to Supabase:', result.error);
        // Don't fail the entire process if Supabase save fails
      }
    } catch (error) {
      console.warn('⚠️ Error saving token to Supabase:', error);
      // Don't fail the entire process if Supabase save fails
    }
  };

  const handleDeploy = async () => {
    if (!validateForm()) return;

    setIsDeploying(true);
    setError('');
    setDeploymentResult(null);

    try {
      const isAlgorandNetwork = tokenData.network === 'algorand-testnet' || tokenData.network === 'algorand-mainnet';
      
      if (isAlgorandNetwork) {
        // Algorand deployment
        if (!algorandConnected || !algorandAddress) {
          setError('Please connect your Algorand wallet first');
          return;
        }

        const algorandTokenData = {
          name: tokenData.name,
          symbol: tokenData.symbol,
          description: tokenData.description,
          decimals: parseInt(tokenData.decimals),
          totalSupply: tokenData.totalSupply,
          logoUrl: tokenData.logoUrl,
          website: tokenData.website,
          github: tokenData.github,
          twitter: tokenData.twitter,
          mintable: tokenData.mintable,
          burnable: tokenData.burnable,
          pausable: tokenData.pausable,
        };

        const result = await createAlgorandToken(
          algorandAddress,
          algorandTokenData,
          algorandSignTransaction,
          supabaseHelpers.uploadMetadataToStorage,
          tokenData.network
        );

        if (result.success) {
          // Auto opt-in creator to the new token
          if (result.assetId) {
            console.log('Attempting to opt-in creator to asset:', result.assetId);
            try {
              const optInResult = await optInToAsset(
                algorandAddress,
                result.assetId,
                algorandSignTransaction,
                tokenData.network
              );
              
              if (optInResult.success) {
                console.log('✓ Creator successfully opted-in to token');
              } else {
                console.warn('Opt-in failed:', optInResult.error);
              }
            } catch (optInError) {
              console.error('Opt-in error:', optInError);
            }
          }

          setDeploymentResult({
            ...result,
            network: tokenData.network,
            explorerUrl: result.details?.explorerUrl,
            message: 'Token created and you have been automatically opted-in!'
          });
          
          // Save to Supabase
          await saveTokenToSupabase({
            name: tokenData.name,
            symbol: tokenData.symbol,
            assetId: result.assetId,
            transactionId: result.transactionId
          }, tokenData.network);
        } else {
          setError(result.error || 'Failed to create Algorand token');
        }
      } else {
        // Solana deployment
        if (!solanaConnected || !solanaPublicKey || !solanaWallet) {
          setError('Please connect your Solana wallet first');
          return;
        }

        const solanaTokenData = {
          name: tokenData.name,
          symbol: tokenData.symbol,
          description: tokenData.description,
          decimals: parseInt(tokenData.decimals),
          totalSupply: parseInt(tokenData.totalSupply),
          logoUrl: tokenData.logoUrl,
          website: tokenData.website,
          github: tokenData.github,
          twitter: tokenData.twitter,
          mintable: tokenData.mintable,
          burnable: tokenData.burnable,
          pausable: tokenData.pausable,
        };

        const result = await createTokenOnChain(solanaWallet, solanaTokenData);

        if (result.success) {
          setDeploymentResult({
            ...result,
            network: tokenData.network,
            explorerUrl: `https://explorer.solana.com/address/${result.tokenAddress}?cluster=devnet`
          });
          
          // Save to Supabase
          await saveTokenToSupabase({
            name: tokenData.name,
            symbol: tokenData.symbol,
            tokenAddress: result.tokenAddress,
            mintAddress: result.mintAddress,
            signature: result.signature
          }, tokenData.network);
        } else {
          setError(result.error || 'Failed to create Solana token');
        }
      }
    } catch (error) {
      console.error('Deployment error:', error);
      setError(error instanceof Error ? error.message : 'Deployment failed');
    } finally {
      setIsDeploying(false);
    }
  };

  const networkOptions = [
    {
      value: 'solana-devnet',
      label: 'Solana Devnet',
      description: 'Testing Environment - Free',
      cost: 'Free',
      recommended: true,
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      available: solanaConnected
    },
    {
      value: 'solana-mainnet',
      label: 'Solana Mainnet',
      description: 'Production Network',
      cost: '~$2-5',
      recommended: false,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      available: solanaConnected
    },
    {
      value: 'algorand-testnet',
      label: 'Algorand TestNet',
      description: 'Ultra Low Cost Testing',
      cost: '~$0.001',
      recommended: false,
      color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
      available: algorandConnected
    },
    {
      value: 'algorand-mainnet',
      label: 'Algorand MainNet',
      description: 'Production Network - Low Cost',
      cost: '~$0.002',
      recommended: false,
      color: 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30',
      available: algorandConnected
    }
  ];

  const selectedNetwork = networkOptions.find(n => n.value === tokenData.network);
  const canDeploy = selectedNetwork?.available;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (deploymentResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">🎉 Token Created Successfully!</CardTitle>
            <CardDescription className="text-lg">
              Your <strong>{tokenData.name} ({tokenData.symbol})</strong> token is now live on{' '}
              {deploymentResult.network === 'algorand-testnet' ? 'Algorand TestNet' : deploymentResult.network === 'algorand-mainnet' ? 'Algorand MainNet' : 'Solana Network'}!
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                ✅ Token details have been saved to your dashboard history.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 bg-muted/50 rounded-lg px-4 py-2">
                <Network className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {deploymentResult.network === 'algorand-testnet' || deploymentResult.network === 'algorand-mainnet' ? 'Asset ID' : 'Token Address'}:
                </span>
                <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                  {deploymentResult.assetId || deploymentResult.tokenAddress}
                </code>
              </div>
            </div>

            {(deploymentResult.network === 'algorand-testnet' || deploymentResult.network === 'algorand-mainnet') && (
              <Alert className="border-green-500/30 bg-green-500/10">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600">
                  ✅ Successfully opted in! Your token should now appear in Pera Wallet.
                </AlertDescription>
              </Alert>
            )}

            <Alert className="border-blue-500/30 bg-blue-500/10">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-blue-600">
                    🔗 {deploymentResult.network === 'algorand-testnet' || deploymentResult.network === 'algorand-mainnet' ? 'Algorand' : 'Solana'} Token Created!
                  </p>
                  <p className="text-sm">
                    {deploymentResult.network === 'algorand-testnet' || deploymentResult.network === 'algorand-mainnet'
                      ? 'To see your token in Pera Wallet, you need to opt-in to receive it.'
                      : 'Your token is now available on the Solana blockchain.'
                    }
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={() => window.open(deploymentResult.explorerUrl, '_blank')}
                className="w-full"
                variant="outline"
              >
                🔍 View on {deploymentResult.network === 'algorand-testnet' || deploymentResult.network === 'algorand-mainnet' ? 'AlgoExplorer' : 'Explorer'}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => {
                    setDeploymentResult(null);
                    setError('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create Another
                </Button>
                <Button 
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 text-red-500 font-medium text-sm">
          <Rocket className="w-4 h-4" />
          <span className="uppercase tracking-wide">Token Creation</span>
        </div>
        <h1 className="text-4xl font-bold text-foreground">Create Your Token</h1>
        <p className="text-muted-foreground text-lg">
          Design and deploy your custom token in minutes across multiple blockchains
        </p>
      </div>

      {/* Network Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5" />
            <span>Choose Network</span>
          </CardTitle>
          <CardDescription>
            Select the blockchain network where you want to deploy your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {networkOptions.map((network) => (
              <div
                key={network.value}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  tokenData.network === network.value
                    ? 'border-red-500/50 bg-red-500/5'
                    : network.available
                    ? 'border-border hover:border-red-500/30 hover:bg-red-500/5'
                    : 'border-border/50 bg-muted/50 cursor-not-allowed opacity-60'
                }`}
                onClick={() => network.available && updateTokenData('network', network.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      tokenData.network === network.value ? 'bg-red-500' : 'bg-muted-foreground'
                    }`} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-foreground">{network.label}</span>
                        {network.recommended && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            Recommended
                          </Badge>
                        )}
                        {!network.available && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                            Connect Wallet
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{network.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={network.color}>
                      {network.cost}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!canDeploy && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please connect a wallet for your selected network to continue with token creation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Algorand Wallet Status */}
      {(tokenData.network === 'algorand-testnet' || tokenData.network === 'algorand-mainnet') && algorandConnected && algorandWalletStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Algorand Wallet Status</span>
            </CardTitle>
            <CardDescription>
              Wallet status for {tokenData.network === 'algorand-mainnet' ? 'MainNet' : 'TestNet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-medium">{algorandWalletStatus.balance?.toFixed(4)} ALGO</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Can Create Token:</span>
                <Badge className={algorandWalletStatus.canCreateToken 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border-red-500/30'
                }>
                  {algorandWalletStatus.canCreateToken ? 'Yes' : 'Insufficient Balance'}
                </Badge>
              </div>
              {!algorandWalletStatus.canCreateToken && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You need at least {algorandWalletStatus.recommendedBalance} ALGO to create a token.
                    Current balance: {algorandWalletStatus.balance?.toFixed(4)} ALGO
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
          <CardDescription>
            Configure your token's basic information and properties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Token Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Token"
                value={tokenData.name}
                onChange={(e) => updateTokenData('name', e.target.value)}
                className="input-enhanced"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Token Symbol *</Label>
              <Input
                id="symbol"
                placeholder="MAT"
                value={tokenData.symbol}
                onChange={(e) => updateTokenData('symbol', e.target.value.toUpperCase())}
                className="input-enhanced"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your token's purpose and utility..."
              value={tokenData.description}
              onChange={(e) => updateTokenData('description', e.target.value)}
              className="input-enhanced min-h-[100px]"
            />
          </div>

          {/* Token Economics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalSupply">Total Supply *</Label>
              <Input
                id="totalSupply"
                type="number"
                placeholder="1000000"
                value={tokenData.totalSupply}
                onChange={(e) => updateTokenData('totalSupply', e.target.value)}
                className="input-enhanced"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals</Label>
              <Select value={tokenData.decimals} onValueChange={(value) => updateTokenData('decimals', value)}>
                <SelectTrigger className="input-enhanced">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 decimals</SelectItem>
                  <SelectItem value="9">9 decimals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo Image</Label>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-red-500 mx-auto animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    )}
                    <p className="text-sm text-muted-foreground">
                      {uploadingImage ? 'Uploading...' : 'Click to upload logo (PNG/JPG, max 5MB)'}
                    </p>
                  </div>
                </label>
              </div>
              
              {tokenData.logoUrl && (
                <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <img src={tokenData.logoUrl} alt="Token logo" className="w-10 h-10 rounded-full object-cover" />
                  <span className="text-green-600 text-sm font-medium">Logo uploaded successfully</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Or enter image URL manually</Label>
                <Input
                  id="logoUrl"
                  placeholder="https://example.com/logo.png"
                  value={tokenData.logoUrl}
                  onChange={(e) => updateTokenData('logoUrl', e.target.value)}
                  className="input-enhanced"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <Label>Social Links (Optional)</Label>
            <div className="grid gap-3">
              <div className="flex items-center space-x-3">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://yourwebsite.com"
                  value={tokenData.website}
                  onChange={(e) => updateTokenData('website', e.target.value)}
                  className="input-enhanced"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Github className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://github.com/yourproject"
                  value={tokenData.github}
                  onChange={(e) => updateTokenData('github', e.target.value)}
                  className="input-enhanced"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Twitter className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://twitter.com/yourproject"
                  value={tokenData.twitter}
                  onChange={(e) => updateTokenData('twitter', e.target.value)}
                  className="input-enhanced"
                />
              </div>
            </div>
          </div>

          {/* Token Features */}
          <div className="space-y-4">
            <Label>Token Features</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Mintable</div>
                  <div className="text-sm text-muted-foreground">Allow creating new tokens after deployment</div>
                </div>
                <Switch
                  checked={tokenData.mintable}
                  onCheckedChange={(checked) => updateTokenData('mintable', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Burnable</div>
                  <div className="text-sm text-muted-foreground">Allow permanently destroying tokens</div>
                </div>
                <Switch
                  checked={tokenData.burnable}
                  onCheckedChange={(checked) => updateTokenData('burnable', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium text-foreground">Pausable</div>
                  <div className="text-sm text-muted-foreground">Allow pausing token transfers in emergencies</div>
                </div>
                <Switch
                  checked={tokenData.pausable}
                  onCheckedChange={(checked) => updateTokenData('pausable', checked)}
                />
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-600">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Deploy Button */}
          <Button
            onClick={handleDeploy}
            disabled={!canDeploy || isDeploying || ((tokenData.network === 'algorand-testnet' || tokenData.network === 'algorand-mainnet') && algorandWalletStatus && !algorandWalletStatus.canCreateToken)}
            className="w-full bg-red-500 hover:bg-red-600 text-white h-12 text-lg font-semibold"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Token...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-2" />
                🚀 Deploy to {selectedNetwork?.label}
              </>
            )}
          </Button>

          {selectedNetwork && (
            <div className="text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>~30 seconds</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DollarSign className="w-3 h-3" />
                  <span>{selectedNetwork.cost}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span>Secure</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}