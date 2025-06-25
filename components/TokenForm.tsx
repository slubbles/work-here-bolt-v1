'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { 
  Upload, 
  Rocket, 
  Settings, 
  Globe, 
  Github, 
  Twitter, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Network,
  Zap,
  Shield
} from 'lucide-react';
import { createAlgorandToken } from '@/lib/algorand';
import { createTokenOnChain } from '@/lib/solana';
import { supabaseHelpers } from '@/lib/supabase';

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
  const { toast } = useToast();
  
  // Wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  const { connected: algorandConnected, address: algorandAddress, signTransaction } = useAlgorandWallet();

  // Validation states
  const [nameError, setNameError] = useState('');
  const [symbolError, setSymbolError] = useState('');
  const [totalSupplyError, setTotalSupplyError] = useState('');
  const [decimalsError, setDecimalsError] = useState('');
  const [logoError, setLogoError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Validation functions
  const validateName = (value: string): string => {
    if (!value.trim()) return 'Token name is required';
    if (value.length < 2) return 'Token name must be at least 2 characters';
    if (value.length > 32) return 'Token name must be 32 characters or less';
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) return 'Token name can only contain letters, numbers, spaces, hyphens, and underscores';
    return '';
  };

  const validateSymbol = (value: string): string => {
    if (!value.trim()) return 'Token symbol is required';
    if (value.length < 2) return 'Symbol must be at least 2 characters';
    if (value.length > 10) return 'Symbol must be 10 characters or less';
    if (!/^[A-Z0-9]+$/.test(value.toUpperCase())) return 'Symbol can only contain letters and numbers';
    return '';
  };

  const validateTotalSupply = (value: string): string => {
    if (!value.trim()) return 'Total supply is required';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'Total supply must be a valid number';
    if (numValue <= 0) return 'Total supply must be greater than 0';
    if (numValue > 1000000000000) return 'Total supply is too large';
    if (!/^\d+(\.\d+)?$/.test(value)) return 'Total supply must be a positive number';
    return '';
  };

  const validateDecimals = (value: string): string => {
    if (!value.trim()) return 'Decimals value is required';
    const numValue = parseInt(value);
    if (isNaN(numValue)) return 'Decimals must be a valid number';
    if (numValue < 0) return 'Decimals cannot be negative';
    if (numValue > 18) return 'Decimals cannot exceed 18';
    return '';
  };

  const validateLogoUrl = (value: string): string => {
    if (value && value.trim()) {
      try {
        new URL(value);
        if (!value.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
          return 'Logo URL must point to an image file (jpg, png, gif, svg, webp)';
        }
      } catch {
        return 'Please enter a valid URL';
      }
    }
    return '';
  };

  // Handle input changes with validation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTokenData({ ...tokenData, name: value });
    setNameError(validateName(value));
  };

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setTokenData({ ...tokenData, symbol: value });
    setSymbolError(validateSymbol(value));
  };

  const handleTotalSupplyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTokenData({ ...tokenData, totalSupply: value });
    setTotalSupplyError(validateTotalSupply(value));
  };

  const handleDecimalsChange = (value: string) => {
    setTokenData({ ...tokenData, decimals: value });
    setDecimalsError(validateDecimals(value));
  };

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTokenData({ ...tokenData, logoUrl: value });
    setLogoError(validateLogoUrl(value));
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (PNG, JPG, GIF, SVG, WebP)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    toast({
      title: "Uploading Logo",
      description: "Please wait while we upload your logo...",
    });

    try {
      const uploadResult = await supabaseHelpers.uploadFileToStorage(file, 'token-assets');
      
      if (uploadResult.success && uploadResult.url) {
        setTokenData({ ...tokenData, logoUrl: uploadResult.url });
        setLogoError('');
        toast({
          title: "Upload Successful",
          description: "Your logo has been uploaded successfully!",
        });
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again or enter a URL manually.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Check form validity
  useEffect(() => {
    const hasValidName = !nameError && tokenData.name.trim();
    const hasValidSymbol = !symbolError && tokenData.symbol.trim();
    const hasValidSupply = !totalSupplyError && tokenData.totalSupply.trim();
    const hasValidDecimals = !decimalsError && tokenData.decimals.trim();
    const hasValidLogo = !logoError;
    
    setIsFormValid(hasValidName && hasValidSymbol && hasValidSupply && hasValidDecimals && hasValidLogo);
  }, [nameError, symbolError, totalSupplyError, decimalsError, logoError, tokenData]);

  // Get connected wallet info
  const getConnectedWallet = () => {
    if (tokenData.network.startsWith('algorand') && algorandConnected) {
      return { type: 'algorand', address: algorandAddress };
    }
    if (tokenData.network.startsWith('solana') && solanaConnected) {
      return { type: 'solana', address: solanaPublicKey?.toString() };
    }
    return null;
  };

  // Handle token deployment
  const handleDeploy = async () => {
    // Check wallet connection
    const wallet = getConnectedWallet();
    if (!wallet) {
      toast({
        title: "Wallet Not Connected",
        description: `Please connect your ${tokenData.network.startsWith('algorand') ? 'Algorand' : 'Solana'} wallet to deploy your token.`,
        variant: "destructive",
      });
      return;
    }

    // Final validation check
    if (!isFormValid) {
      toast({
        title: "Form Validation Error",
        description: "Please fix all validation errors before deploying your token.",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);
    
    toast({
      title: "Deploying Token",
      description: `Creating your ${tokenData.name} token on ${tokenData.network}...`,
    });

    try {
      let result;

      if (tokenData.network.startsWith('algorand')) {
        // Algorand deployment
        result = await createAlgorandToken(
          algorandAddress!,
          {
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
          },
          signTransaction,
          supabaseHelpers.uploadMetadataToStorage,
          tokenData.network
        );
      } else {
        // Solana deployment
        result = await createTokenOnChain(
          { publicKey: solanaPublicKey },
          {
            name: tokenData.name,
            symbol: tokenData.symbol,
            description: tokenData.description,
            decimals: parseInt(tokenData.decimals),
            totalSupply: parseFloat(tokenData.totalSupply),
            logoUrl: tokenData.logoUrl,
            website: tokenData.website,
            github: tokenData.github,
            twitter: tokenData.twitter,
            mintable: tokenData.mintable,
            burnable: tokenData.burnable,
            pausable: tokenData.pausable,
          }
        );
      }

      if (result.success) {
        toast({
          title: "🎉 Token Created Successfully!",
          description: `Your ${tokenData.name} token has been deployed. Transaction: ${result.transactionId || result.signature}`,
        });

        // Save to user history if possible
        try {
          await supabaseHelpers.saveTokenCreation({
            user_id: wallet.address,
            token_name: tokenData.name,
            token_symbol: tokenData.symbol,
            network: tokenData.network,
            contract_address: result.assetId?.toString() || result.tokenAddress || result.mintAddress || '',
            description: tokenData.description,
            total_supply: parseFloat(tokenData.totalSupply),
            decimals: parseInt(tokenData.decimals),
            logo_url: tokenData.logoUrl,
            website: tokenData.website,
            github: tokenData.github,
            twitter: tokenData.twitter,
            mintable: tokenData.mintable,
            burnable: tokenData.burnable,
            pausable: tokenData.pausable,
            transaction_hash: result.transactionId || result.signature,
          });
        } catch (saveError) {
          console.warn('Could not save to user history:', saveError);
        }

        // Reset form
        setTokenData({
          name: '',
          symbol: '',
          description: '',
          totalSupply: '1000000',
          decimals: '9',
          logoUrl: '',
          website: '',
          github: '',
          twitter: '',
          mintable: true,
          burnable: false,
          pausable: false,
          network: tokenData.network,
        });

      } else {
        throw new Error(result.error || 'Deployment failed');
      }

    } catch (error) {
      console.error('Deployment error:', error);
      
      let errorMessage = 'An unexpected error occurred during deployment';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Deployment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const networks = [
    {
      value: 'algorand-testnet',
      label: 'Algorand Testnet',
      badge: 'FREE',
      cost: '~$0.001',
      available: true,
      color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30'
    },
    {
      value: 'algorand-mainnet',
      label: 'Algorand Mainnet',
      badge: 'PROD',
      cost: '~$0.002',
      available: true,
      color: 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
    },
    {
      value: 'solana-devnet',
      label: 'Solana Devnet',
      badge: 'FREE',
      cost: '~$2-5',
      available: false,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      value: 'solana-mainnet',
      label: 'Solana Mainnet',
      badge: 'PROD',
      cost: '~$2-5',
      available: false,
      color: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Rocket className="w-6 h-6 text-red-500" />
          <h1 className="text-4xl font-bold text-foreground">Create Your Token</h1>
          <Rocket className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-muted-foreground text-xl">
          Launch your cryptocurrency token in under 30 seconds
        </p>
      </div>

      {/* Network Selection */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-red-500" />
            <span>Select Blockchain Network</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {networks.map((network) => (
              <div
                key={network.value}
                className={`network-card ${
                  tokenData.network === network.value ? 'active' : ''
                } ${network.available ? 'available' : 'disabled'}`}
                onClick={() => network.available && setTokenData({ ...tokenData, network: network.value })}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{network.label}</h3>
                  <Badge className={network.color}>
                    {network.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Deployment cost: {network.cost}
                </p>
                {!network.available && (
                  <Badge className="coming-soon-badge">
                    Coming Soon
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-red-500" />
            <span>Token Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="form-section">
          <div className="form-group">
            <div className="space-y-2">
              <Label htmlFor="name" className="form-label">Token Name *</Label>
              <Input
                id="name"
                placeholder="e.g., My Awesome Token"
                value={tokenData.name}
                onChange={handleNameChange}
                className={`form-input ${nameError ? 'border-red-500' : ''}`}
              />
              {nameError && (
                <div className="flex items-center space-x-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{nameError}</span>
                </div>
              )}
              {!nameError && tokenData.name && (
                <div className="flex items-center space-x-1 text-green-500 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Valid token name</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="symbol" className="form-label">Token Symbol *</Label>
              <Input
                id="symbol"
                placeholder="e.g., MAT"
                value={tokenData.symbol}
                onChange={handleSymbolChange}
                className={`form-input ${symbolError ? 'border-red-500' : ''}`}
                maxLength={10}
              />
              {symbolError && (
                <div className="flex items-center space-x-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{symbolError}</span>
                </div>
              )}
              {!symbolError && tokenData.symbol && (
                <div className="flex items-center space-x-1 text-green-500 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Valid symbol</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalSupply" className="form-label">Total Supply *</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="1000000"
                  value={tokenData.totalSupply}
                  onChange={handleTotalSupplyChange}
                  className={`form-input ${totalSupplyError ? 'border-red-500' : ''}`}
                />
                {totalSupplyError && (
                  <div className="flex items-center space-x-1 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{totalSupplyError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimals" className="form-label">Decimals *</Label>
                <Select value={tokenData.decimals} onValueChange={handleDecimalsChange}>
                  <SelectTrigger className={`form-input ${decimalsError ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select decimals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - No decimals</SelectItem>
                    <SelectItem value="6">6 - Standard</SelectItem>
                    <SelectItem value="9">9 - High precision</SelectItem>
                    <SelectItem value="18">18 - Maximum</SelectItem>
                  </SelectContent>
                </Select>
                {decimalsError && (
                  <div className="flex items-center space-x-1 text-red-500 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{decimalsError}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="form-label">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your token's purpose and utility..."
                value={tokenData.description}
                onChange={(e) => setTokenData({ ...tokenData, description: e.target.value })}
                className="form-textarea"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {tokenData.description.length}/200 characters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-red-500" />
            <span>Token Logo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logoFile" className="form-label">Upload Logo</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="logoFile"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="form-input"
                disabled={isUploading}
              />
              {isUploading && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload PNG, JPG, GIF, SVG, or WebP. Max 5MB.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl" className="form-label">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://example.com/logo.png"
              value={tokenData.logoUrl}
              onChange={handleLogoUrlChange}
              className={`form-input ${logoError ? 'border-red-500' : ''}`}
            />
            {logoError && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{logoError}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-red-500" />
            <span>Social Links</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="form-group">
          <div className="space-y-2">
            <Label htmlFor="website" className="form-label flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Website</span>
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourproject.com"
              value={tokenData.website}
              onChange={(e) => setTokenData({ ...tokenData, website: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github" className="form-label flex items-center space-x-2">
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </Label>
            <Input
              id="github"
              type="url"
              placeholder="https://github.com/yourproject"
              value={tokenData.github}
              onChange={(e) => setTokenData({ ...tokenData, github: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter" className="form-label flex items-center space-x-2">
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
            </Label>
            <Input
              id="twitter"
              type="url"
              placeholder="https://twitter.com/yourproject"
              value={tokenData.twitter}
              onChange={(e) => setTokenData({ ...tokenData, twitter: e.target.value })}
              className="form-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Token Features */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span>Token Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="font-semibold text-foreground">Mintable</h4>
              <p className="text-sm text-muted-foreground">Allow creating new tokens after deployment</p>
            </div>
            <Switch
              checked={tokenData.mintable}
              onCheckedChange={(checked) => setTokenData({ ...tokenData, mintable: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="font-semibold text-foreground">Burnable</h4>
              <p className="text-sm text-muted-foreground">Allow permanently destroying tokens</p>
            </div>
            <Switch
              checked={tokenData.burnable}
              onCheckedChange={(checked) => setTokenData({ ...tokenData, burnable: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <h4 className="font-semibold text-foreground">Pausable</h4>
              <p className="text-sm text-muted-foreground">Allow pausing all token transfers</p>
            </div>
            <Switch
              checked={tokenData.pausable}
              onCheckedChange={(checked) => setTokenData({ ...tokenData, pausable: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Deploy Button */}
      <div className="text-center pt-8">
        <Button
          size="lg"
          onClick={handleDeploy}
          disabled={!isFormValid || isDeploying}
          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-12 py-4 text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Deploying Token...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 mr-2" />
              Deploy Token
            </>
          )}
        </Button>
        
        {!isFormValid && (
          <p className="text-sm text-muted-foreground mt-3">
            Please fix all validation errors to enable deployment
          </p>
        )}
        
        {!getConnectedWallet() && (
          <p className="text-sm text-yellow-600 mt-3">
            Connect your {tokenData.network.startsWith('algorand') ? 'Algorand' : 'Solana'} wallet to deploy
          </p>
        )}
      </div>
    </div>
  );
}