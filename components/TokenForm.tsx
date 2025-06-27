'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Rocket, 
  Plus, 
  Flame, 
  Pause, 
  CheckCircle, 
  AlertTriangle, 
  Upload,
  X
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken } from '@/lib/algorand';
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
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState('');
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey, wallet: solanaWallet } = useWallet();
  const { 
    connected: algorandConnected, 
    address: algorandAddress, 
    signTransaction: algorandSignTransaction,
    selectedNetwork: algorandNetwork 
  } = useAlgorandWallet();

  // Form validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!tokenData.name.trim()) errors.push('Token name is required');
    if (!tokenData.symbol.trim()) errors.push('Token symbol is required');
    if (!tokenData.totalSupply || parseFloat(tokenData.totalSupply) <= 0) {
      errors.push('Total supply must be greater than 0');
    }
    
    // Network-specific validations
    if (tokenData.network.startsWith('algorand')) {
      if (tokenData.name.length > 32) errors.push('Token name must be 32 characters or less for Algorand');
      if (tokenData.symbol.length > 8) errors.push('Token symbol must be 8 characters or less for Algorand');
      if (tokenData.description.length > 1000) errors.push('Description must be 1000 characters or less for Algorand');
    } else if (tokenData.network.startsWith('solana')) {
      if (tokenData.name.length > 32) errors.push('Token name must be 32 characters or less for Solana');
      if (tokenData.symbol.length > 10) errors.push('Token symbol must be 10 characters or less for Solana');
      if (tokenData.description.length > 200) errors.push('Description must be 200 characters or less for Solana');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Check wallet connection based on selected network
  const isWalletConnected = () => {
    if (tokenData.network.startsWith('algorand')) {
      return algorandConnected && algorandAddress;
    } else if (tokenData.network.startsWith('solana')) {
      return solanaConnected && solanaPublicKey;
    }
    return false;
  };

  const getConnectedAddress = () => {
    if (tokenData.network.startsWith('algorand')) {
      return algorandAddress;
    } else if (tokenData.network.startsWith('solana')) {
      return solanaPublicKey?.toString();
    }
    return null;
  };

  // Handle file upload for logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, GIF, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Please upload an image smaller than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      // Try Supabase upload first, fall back to other methods
      const uploadResult = await supabaseHelpers.uploadFileToStorage(
        file,
        'token-logos',
        `logo-${Date.now()}-${file.name}`
      );

      if (uploadResult.success && uploadResult.url) {
        setTokenData({ ...tokenData, logoUrl: uploadResult.url });
      } else {
        // Fallback: Create a data URL for the image
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setTokenData({ ...tokenData, logoUrl: result });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Main token creation handler
  const handleCreateToken = async () => {
    console.log('🚀 Starting token creation process...');

    // Validate form first
    if (!validateForm()) {
      alert('Please fix the form errors before proceeding');
      return;
    }

    // Check wallet connection
    if (!isWalletConnected()) {
      alert(`Please connect your ${tokenData.network.includes('algorand') ? 'Algorand' : 'Solana'} wallet first`);
      return;
    }

    setIsDeploying(true);
    setDeploymentStep('Preparing token creation...');
    setDeploymentResult(null);

    try {
      let result;

      if (tokenData.network.startsWith('algorand')) {
        // Algorand token creation
        setDeploymentStep('Creating Algorand Standard Asset...');
        
        if (!algorandAddress || !algorandSignTransaction) {
          throw new Error('Algorand wallet not properly connected');
        }

        result = await createAlgorandToken(
          algorandAddress,
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
          algorandSignTransaction,
          supabaseHelpers.uploadMetadataToStorage,
          algorandNetwork
        );

      } else if (tokenData.network.startsWith('solana')) {
        // Solana token creation
        setDeploymentStep('Creating Solana token...');
        
        if (!solanaWallet || !solanaPublicKey) {
          throw new Error('Solana wallet not properly connected');
        }

        result = await createTokenOnChain(solanaWallet, {
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
        });

      } else {
        throw new Error(`Unsupported network: ${tokenData.network}`);
      }

      if (result.success) {
        setDeploymentStep('Token created successfully!');
        setDeploymentResult(result);

        console.log('✅ Token creation completed:', result);

      } else {
        throw new Error(result.error || 'Token creation failed');
      }

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDeploymentStep(`Failed: ${errorMessage}`);
      
      alert(`Token creation failed: ${errorMessage}`);
    } finally {
      setIsDeploying(false);
    }
  };

  // Get network display info
  const getNetworkInfo = () => {
    const networks = {
      'algorand-testnet': { 
        name: 'Algorand TestNet', 
        color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
        cost: '~$0.001'
      },
      'algorand-mainnet': { 
        name: 'Algorand MainNet', 
        color: 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30',
        cost: '~$0.002'
      },
      'solana-devnet': { 
        name: 'Solana Devnet', 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        cost: 'Free'
      },
      'solana-mainnet': { 
        name: 'Solana Mainnet', 
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        cost: '~$2-5'
      }
    };
    return networks[tokenData.network as keyof typeof networks] || networks['solana-devnet'];
  };

  const networkInfo = getNetworkInfo();

  return (
    <div className="space-y-8">
      {/* Form Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold">Please fix the following errors:</p>
              <ul className="list-disc list-inside text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Network Selection Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-red-500" />
            <span>Network Selection</span>
          </CardTitle>
          <CardDescription>
            Choose the blockchain network for your token deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <Badge className={`${networkInfo.color} text-base px-6 py-3 rounded-xl font-bold shadow-md`}>
              {networkInfo.name}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">Deployment cost: {networkInfo.cost}</p>
          </div>
        </CardContent>
      </Card>

      {/* Token Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Token Information</CardTitle>
          <CardDescription>
            Basic information about your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">Token Name *</Label>
              <Input
                id="name"
                placeholder="e.g., My Awesome Token"
                value={tokenData.name}
                onChange={(e) => setTokenData({ ...tokenData, name: e.target.value })}
                className="input-enhanced h-12 text-base"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbol" className="text-foreground font-medium">Token Symbol *</Label>
              <Input
                id="symbol"
                placeholder="e.g., MAT"
                value={tokenData.symbol}
                onChange={(e) => setTokenData({ ...tokenData, symbol: e.target.value.toUpperCase() })}
                className="input-enhanced h-12 text-base"
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your token's purpose and features..."
              value={tokenData.description}
              onChange={(e) => setTokenData({ ...tokenData, description: e.target.value })}
              className="input-enhanced min-h-[120px] text-base"
              maxLength={tokenData.network.startsWith('algorand') ? 1000 : 200}
            />
            <p className="text-xs text-muted-foreground">
              {tokenData.description.length}/{tokenData.network.startsWith('algorand') ? 1000 : 200} characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="totalSupply" className="text-foreground font-medium">Total Supply *</Label>
              <Input
                id="totalSupply"
                type="number"
                placeholder="e.g., 1000000"
                value={tokenData.totalSupply}
                onChange={(e) => setTokenData({ ...tokenData, totalSupply: e.target.value })}
                className="input-enhanced h-12 text-base"
                required
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="decimals" className="text-foreground font-medium">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                value={tokenData.decimals}
                onChange={(e) => setTokenData({ ...tokenData, decimals: e.target.value })}
                className="input-enhanced h-12 text-base"
                min="0"
                max="18"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Logo */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Token Logo</CardTitle>
          <CardDescription>
            Upload a logo for your token (optional but recommended)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tokenData.logoUrl ? (
              <div className="flex items-center space-x-4">
                <img 
                  src={tokenData.logoUrl} 
                  alt="Token logo" 
                  className="w-16 h-16 rounded-full object-cover border-2 border-red-500/50"
                />
                <div className="flex-1">
                  <p className="text-sm text-foreground font-medium">Logo uploaded successfully</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTokenData({ ...tokenData, logoUrl: '' })}
                    className="mt-2"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-foreground font-medium">Upload token logo</p>
                  <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={isUploading}
                  />
                  <label htmlFor="logo-upload">
                    <Button variant="outline" disabled={isUploading} asChild>
                      <span>
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Add social media and website links (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website" className="text-foreground font-medium">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://your-website.com"
              value={tokenData.website}
              onChange={(e) => setTokenData({ ...tokenData, website: e.target.value })}
              className="input-enhanced h-12 text-base"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="twitter" className="text-foreground font-medium">Twitter</Label>
              <Input
                id="twitter"
                placeholder="https://twitter.com/username"
                value={tokenData.twitter}
                onChange={(e) => setTokenData({ ...tokenData, twitter: e.target.value })}
                className="input-enhanced h-12 text-base"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="github" className="text-foreground font-medium">GitHub</Label>
              <Input
                id="github"
                placeholder="https://github.com/username"
                value={tokenData.github}
                onChange={(e) => setTokenData({ ...tokenData, github: e.target.value })}
                className="input-enhanced h-12 text-base"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Features */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Token Features</CardTitle>
          <CardDescription>
            Configure advanced token capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`feature-card ${tokenData.mintable ? 'active' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Plus className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-foreground">Mintable</p>
                    <p className="text-sm text-muted-foreground">Create new tokens</p>
                  </div>
                </div>
                <Switch
                  checked={tokenData.mintable}
                  onCheckedChange={(checked) => setTokenData({ ...tokenData, mintable: checked })}
                  className="touch-target-switch"
                />
              </div>
            </div>

            <div className={`feature-card ${tokenData.burnable ? 'active' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Flame className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="font-medium text-foreground">Burnable</p>
                    <p className="text-sm text-muted-foreground">Destroy tokens</p>
                  </div>
                </div>
                <Switch
                  checked={tokenData.burnable}
                  onCheckedChange={(checked) => setTokenData({ ...tokenData, burnable: checked })}
                  className="touch-target-switch"
                />
              </div>
            </div>

            <div className={`feature-card ${tokenData.pausable ? 'active' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Pause className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-foreground">Pausable</p>
                    <p className="text-sm text-muted-foreground">Pause transfers</p>
                  </div>
                </div>
                <Switch
                  checked={tokenData.pausable}
                  onCheckedChange={(checked) => setTokenData({ ...tokenData, pausable: checked })}
                  className="touch-target-switch"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-red-500" />
            <span>Deploy Token</span>
          </CardTitle>
          <CardDescription>
            Deploy your token to the {networkInfo.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isWalletConnected() ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-foreground font-medium">
                {tokenData.network.includes('algorand') ? 'Algorand' : 'Solana'} Wallet
              </span>
            </div>
            <span className={`text-sm font-semibold ${isWalletConnected() ? 'text-green-500' : 'text-red-500'}`}>
              {isWalletConnected() ? 'Connected' : 'Not Connected'}
            </span>
          </div>

          {isWalletConnected() && (
            <div className="text-sm text-muted-foreground">
              <p>Connected to: {getConnectedAddress()?.slice(0, 8)}...{getConnectedAddress()?.slice(-8)}</p>
            </div>
          )}

          {/* Deployment Progress */}
          {isDeploying && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                <span className="text-foreground font-medium">{deploymentStep}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          )}

          {/* Deployment Result */}
          {deploymentResult && (
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-600">✅ Token deployed successfully!</p>
                  <div className="text-sm space-y-1">
                    {deploymentResult.assetId && (
                      <p><strong>Asset ID:</strong> {deploymentResult.assetId}</p>
                    )}
                    {deploymentResult.tokenAddress && (
                      <p><strong>Token Address:</strong> {deploymentResult.tokenAddress}</p>
                    )}
                    {deploymentResult.mintAddress && (
                      <p><strong>Mint Address:</strong> {deploymentResult.mintAddress}</p>
                    )}
                    {deploymentResult.transactionId && (
                      <p><strong>Transaction:</strong> {deploymentResult.transactionId}</p>
                    )}
                    {deploymentResult.details?.explorerUrl && (
                      <p>
                        <a 
                          href={deploymentResult.details.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400 underline"
                        >
                          View on Explorer →
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Deploy Button */}
          <Button
            onClick={handleCreateToken}
            disabled={isDeploying || !isWalletConnected()}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Creating Token...
              </>
            ) : !isWalletConnected() ? (
              `Connect ${tokenData.network.includes('algorand') ? 'Algorand' : 'Solana'} Wallet`
            ) : (
              <>
                <Rocket className="w-5 h-5 mr-3" />
                Deploy Token to {networkInfo.name}
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Deployment cost: {networkInfo.cost}</p>
            <p className="mt-1">Your token will be created and managed using your connected wallet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}