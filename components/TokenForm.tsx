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
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Loader2, 
  Rocket, 
  Plus,
  Flame,
  Pause,
  CheckCircle, 
  AlertTriangle, 
  Upload,
  X,
  Coins,
  Settings,
  Wallet
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, supabaseHelpers } from '@/lib/algorand';
import { HelpCircle, Info, Link2 } from 'lucide-react';

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
  const [error, setError] = useState('');
  
  // Dialog states
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogType, setDialogType] = useState<'success' | 'error'>('success');
  
  // Network selection states
  const [showNetworkOptions, setShowNetworkOptions] = useState(false);

  // Wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey, wallet: solanaWallet } = useWallet();
  const { 
    connected: algorandConnected, 
    address: algorandAddress, 
    signTransaction: algorandSignTransaction,
    selectedNetwork: algorandNetwork 
  } = useAlgorandWallet();

  // Show result dialog helper
  const showDialog = (title: string, message: string, type: 'success' | 'error') => {
    setDialogTitle(title);
    setDialogMessage(message);
    setDialogType(type);
    setShowResultDialog(true);
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!tokenData.name.trim()) errors.push('Token name is required');
    if (!tokenData.symbol.trim()) errors.push('Token symbol is required');
    if (!tokenData.totalSupply || parseFloat(tokenData.totalSupply) <= 0) {
      errors.push('Total supply must be greater than 0');
    }
    if (parseFloat(tokenData.totalSupply) > 1e15) {
      errors.push('Total supply is too large. Please use a smaller number.');
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
    
    // URL validation
    if (tokenData.website && !isValidUrl(tokenData.website)) {
      errors.push('Please enter a valid website URL');
    }
    if (tokenData.twitter && !isValidUrl(tokenData.twitter)) {
      errors.push('Please enter a valid Twitter URL');
    }
    if (tokenData.github && !isValidUrl(tokenData.github)) {
      errors.push('Please enter a valid GitHub URL');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };
  
  // URL validation helper
  const isValidUrl = (string: string): boolean => {
    if (!string) return true; // Empty URLs are valid (optional)
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Check wallet connection based on selected network
  const isWalletConnected = () => {
    if (tokenData.network === 'algorand') {
      return algorandConnected && algorandAddress;
    } else if (tokenData.network === 'solana') {
      return solanaConnected && solanaPublicKey;
    }
    return false;
  };

  const getConnectedAddress = () => {
    if (tokenData.network === 'algorand') {
      return algorandAddress;
    } else if (tokenData.network === 'solana') {
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
      setError('Please upload an image file (PNG, JPG, GIF, etc.)');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Please upload an image smaller than 5MB');
      setTimeout(() => setError(''), 5000);
      return;
    }

    setIsUploading(true);
    setError('');

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
        // Enhanced fallback: Create optimized data URL
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Resize image to max 400x400 for better performance
          const maxSize = 400;
          let { width, height } = img;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setTokenData({ ...tokenData, logoUrl: dataUrl });
        };
        
        img.src = URL.createObjectURL(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload logo. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  // Main token creation handler
  const handleCreateToken = async () => {
    console.log('🚀 Starting token creation process...');

    // Validate form first
    if (!validateForm()) {
      setError('Please fix the form errors before proceeding');
      setTimeout(() => setError(''), 5000);
      return;
    }

    // Check wallet connection
    if (!isWalletConnected()) {
      setError(`Please connect your ${tokenData.network === 'algorand' ? 'Algorand' : 'Solana'} wallet first`);
      setTimeout(() => setError(''), 5000);
      return;
    }

    setIsDeploying(true);
    setDeploymentStep('Preparing token creation...');
    setDeploymentResult(null);
    setError('');

    try {
      let result;

      if (tokenData.network === 'algorand') {
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

      } else if (tokenData.network === 'solana') {
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
        
        // Show success dialog
        const successMessage = `Token "${tokenData.name}" has been successfully created and deployed to the blockchain!\n\n${
          result.assetId ? `Asset ID: ${result.assetId}` : `Mint Address: ${result.mintAddress || result.tokenAddress}`
        }\n\nTransaction ID: ${result.transactionId}`;
        
        showDialog('🎉 Token Created Successfully!', successMessage, 'success');

        console.log('✅ Token creation completed:', result);

      } else {
        throw new Error(result.error || 'Token creation failed');
      }

    } catch (error) {
      console.error('❌ Token creation failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setDeploymentStep(`Failed: ${errorMessage}`);
      setError(errorMessage);
      
      // Show error dialog
      showDialog('❌ Token Creation Failed', errorMessage, 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  // Get network display info
  const getNetworkInfo = () => {
    if (tokenData.network === 'algorand') {
      // Use the network selected in the Algorand wallet provider
      return algorandNetwork === 'algorand-mainnet' 
        ? { 
            name: 'Algorand MainNet', 
            color: 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30',
            cost: '~$0.002'
          }
        : { 
            name: 'Algorand TestNet', 
            color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
            cost: '~$0.001'
          };
    } else if (tokenData.network === 'solana') {
      return { 
        name: 'Solana Devnet', 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        cost: 'Free'
      };
    }
    
    // Fallback
    const networks = {
      'solana': { 
        name: 'Solana Devnet', 
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        cost: 'Free'
      }
    };
    return networks[tokenData.network as keyof typeof networks] || networks['solana'];
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
        
      {/* General Error Display */}
      {error && !validationErrors.length && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold text-red-600">{error}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Network Selection Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shadow-sm">
              <Rocket className="w-6 h-6 text-red-500" />
            </div>
            <span>Step 1: Choose Network</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Select the blockchain network where your token will be deployed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Network</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Algorand Network */}
              <div 
                className={`network-card flex flex-col justify-center items-center p-6 transition-all duration-300 cursor-pointer ${
                  tokenData.network === 'algorand' ? 'active algorand-card shadow-lg transform -translate-y-1' : ''
                } cursor-pointer`}
                onClick={() => {
                  setTokenData({ ...tokenData, network: 'algorand' });
                  setShowNetworkOptions(true);
                }}
              >
                <div className="w-12 h-12 bg-[#76f935]/20 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <span className="text-xl font-bold text-[#76f935]">A</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Algorand</h3>
                <Badge className="algorand-badge">Ultra Low Cost</Badge>
                <p className="text-sm text-muted-foreground mt-2 text-center">Perfect for cost-sensitive projects</p>
              </div>
              
              {/* Solana Network */}
              <div 
                className={`network-card flex flex-col justify-center items-center p-6 transition-all duration-300 cursor-pointer ${
                  tokenData.network === 'solana' ? 'active shadow-lg transform -translate-y-1' : ''
                } cursor-pointer`}
                onClick={() => setTokenData({ ...tokenData, network: 'solana' })}
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <span className="text-xl font-bold text-blue-500">S</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Solana</h3>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Fast & Reliable</Badge>
                <p className="text-sm text-muted-foreground mt-2 text-center">Best for high-performance projects</p>
              </div>
            </div>
            
            {/* Algorand Network Options Dialog */}
            {showNetworkOptions && tokenData.network === 'algorand' && (
              <div className="mt-4 p-4 bg-muted/20 border border-border rounded-lg">
                <h4 className="font-medium text-foreground mb-3">Choose Algorand Network</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={algorandNetwork === 'algorand-testnet' ? 'default' : 'outline'}
                    onClick={() => {
                      if (setAlgorandSelectedNetwork) {
                        setAlgorandSelectedNetwork('algorand-testnet');
                      }
                      setShowNetworkOptions(false);
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <span className="font-semibold">Algorand Testnet</span>
                    <span className="text-xs opacity-75">~$0.001 cost</span>
                  </Button>
                  <Button
                    variant={algorandNetwork === 'algorand-mainnet' ? 'default' : 'outline'}
                    onClick={() => {
                      if (setAlgorandSelectedNetwork) {
                        setAlgorandSelectedNetwork('algorand-mainnet');
                      }
                      setShowNetworkOptions(false);
                    }}
                    className="h-16 flex flex-col items-center justify-center"
                  >
                    <span className="font-semibold">Algorand Mainnet</span>
                    <span className="text-xs opacity-75">~$0.002 cost</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Address Input */}
          <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-foreground">Selected Network</h4>
                <p className="text-sm text-muted-foreground">Deployment cost: {networkInfo.cost}</p>
              </div>
              <Badge className={`${networkInfo.color} px-3 py-1 text-sm`}>
                {networkInfo.name}
              </Badge>
            </div>
            
            {tokenData.network === 'algorand' && algorandNetwork === 'algorand-testnet' && (
              <div className="mt-3 flex items-start gap-2 text-sm text-amber-500">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Using Testnet for development. Tokens are not tradable on Mainnet.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Token Information */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shadow-sm">
              <Coins className="w-6 h-6 text-red-500" />
            </div>
            <span>Step 2: Define Your Token</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Set the core properties that define your token's identity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="name" className="text-foreground font-medium">Token Name <span className="text-red-500">*</span></Label>
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
              <Input 
                id="name"
                placeholder="e.g., My Awesome Token"
                value={tokenData.name}
                onChange={(e) => setTokenData({ ...tokenData, name: e.target.value })}
                className="input-enhanced h-12 text-base focus:ring-4"
                required
              />
              <p className="text-xs text-muted-foreground">The full name of your token (max 32 characters)</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="symbol" className="text-foreground font-medium">Token Symbol <span className="text-red-500">*</span></Label>
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
              <Input 
                id="symbol"
                placeholder="e.g., MAT"
                value={tokenData.symbol}
                onChange={(e) => setTokenData({ ...tokenData, symbol: e.target.value.toUpperCase() })}
                className="input-enhanced h-12 text-base focus:ring-4"
                maxLength={10}
                required
              />
              <p className="text-xs text-muted-foreground">Short ticker symbol for exchanges (2-10 characters)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your token's purpose and features..."
              value={tokenData.description}
              onChange={(e) => setTokenData({ ...tokenData, description: e.target.value })}
              className="input-enhanced min-h-[120px] text-base focus:ring-4"
              maxLength={tokenData.network.startsWith('algorand') ? 1000 : 200}
            />
            <p className="text-xs text-muted-foreground">
              {tokenData.description.length}/{tokenData.network.startsWith('algorand') ? 1000 : 200} characters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label htmlFor="totalSupply" className="text-foreground font-medium">Total Supply <span className="text-red-500">*</span></Label>
                <span className="text-xs text-muted-foreground">Required</span>
              </div>
              <Input 
                id="totalSupply"
                type="number"
                placeholder="e.g., 1000000"
                value={tokenData.totalSupply}
                onChange={(e) => setTokenData({ ...tokenData, totalSupply: e.target.value })}
                className="input-enhanced h-12 text-base focus:ring-4"
                required
                min="1"
              />
              <div className="flex items-center text-xs text-muted-foreground space-x-1">
                <Info className="w-4 h-4" />
                <span>Total number of tokens that will be created</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="decimals" className="text-foreground font-medium">Decimals</Label>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Recommended: 9</span>
              </div>
              <Input 
                id="decimals"
                type="number"
                value={tokenData.decimals}
                onChange={(e) => setTokenData({ ...tokenData, decimals: e.target.value })}
                className="input-enhanced h-12 text-base focus:ring-4"
                min="0"
                max="18"
              />
              <p className="text-xs text-muted-foreground">Divisibility of your token (0-18)</p>
            </div>
          </div>
          
          <div className="mt-2 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/15 transition-colors">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-600">Quick Tips</h4>
                <ul className="mt-2 text-sm text-blue-600 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Choose a clear, memorable name and symbol</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Set supply based on your tokenomics strategy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Higher decimals (9) allow for smaller fractional amounts</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Logo */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shadow-sm">
              <Upload className="w-6 h-6 text-red-500" />
            </div>
            <span>Step 3: Add Logo</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Add visual identity to your token (optional but recommended)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tokenData.logoUrl ? (
              <div className="flex items-center space-x-4">
                <img 
                  src={tokenData.logoUrl} 
                  alt="Token logo"
                  className="w-20 h-20 rounded-full object-cover border-2 border-red-500/50 shadow-xl"
                />
                <div className="flex-1">
                  <p className="text-base text-foreground font-medium">Logo uploaded successfully</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTokenData({ ...tokenData, logoUrl: '' })}
                    className="mt-2 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-red-300 transition-colors">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                <div className="space-y-4">
                  <div>
                    <p className="text-foreground font-medium text-lg">Upload token logo</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                  </div>
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
                        {isUploading 
                          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                          : <><Upload className="w-4 h-4 mr-2" />Choose File</>
                        }
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-sm text-yellow-600">
              <p className="flex items-center">
                <Info className="w-5 h-5 mr-2 flex-shrink-0" /> 
                <span>A well-designed logo increases recognition and trust in your token. For best results, use a square image with a simple, bold design.</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shadow-sm">
              <Link2 className="w-6 h-6 text-red-500" />
            </div>
            <span>Step 4: Add Links</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Enhance your token with official links (optional)
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
              className="input-enhanced h-12 text-base focus:ring-4"
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
                className="input-enhanced h-12 text-base focus:ring-4"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="github" className="text-foreground font-medium">GitHub</Label>
              <Input
                id="github"
                placeholder="https://github.com/username"
                value={tokenData.github}
                onChange={(e) => setTokenData({ ...tokenData, github: e.target.value })}
                className="input-enhanced h-12 text-base focus:ring-4"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Features */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shadow-sm">
              <Settings className="w-6 h-6 text-red-500" />
            </div>
            <span>Step 5: Add Features</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Choose advanced smart contract capabilities for your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Mintable Feature */}
            <div className="feature-card p-6 border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg">
              <div className="text-center space-y-4">
                <div 
                  className="feature-toggle-button mx-auto"
                  onClick={() => setTokenData({ ...tokenData, mintable: !tokenData.mintable })}
                >
                  <div className={`feature-toggle-button-inner ${tokenData.mintable ? 'active' : ''}`}>
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Mintable Token</h3>
                  <p className="text-sm text-muted-foreground mt-1">Allows you to create additional tokens later</p>
                </div>
              </div>
            </div>

            {/* Burnable Feature */}
            <div className="feature-card p-6 border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg">
              <div className="text-center space-y-4">
                <div 
                  className="feature-toggle-button mx-auto"
                  onClick={() => setTokenData({ ...tokenData, burnable: !tokenData.burnable })}
                >
                  <div className={`feature-toggle-button-inner ${tokenData.burnable ? 'active' : ''}`}>
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Burnable Token</h3>
                  <p className="text-sm text-muted-foreground mt-1">Allows permanent destruction of tokens</p>
                </div>
              </div>
            </div>

            {/* Pausable Feature */}
            <div className="feature-card p-6 border rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg">
              <div className="text-center space-y-4">
                <div 
                  className="feature-toggle-button mx-auto"
                  onClick={() => setTokenData({ ...tokenData, pausable: !tokenData.pausable })}
                >
                  <div className={`feature-toggle-button-inner ${tokenData.pausable ? 'active' : ''}`}>
                    <Pause className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Pausable Token</h3>
                  <p className="text-sm text-muted-foreground mt-1">Ability to freeze all transfers in emergencies</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/15 transition-colors">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-600">
                <h4 className="font-medium">Important Security Note</h4>
                <p className="mt-1">These features give you (the creator) special privileges over the token. Choose carefully based on your project's needs and security considerations.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Section */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center shadow-sm">
              <Rocket className="w-6 h-6 text-red-500" />
            </div>
            <span>Step 6: Deploy Token</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Launch your token to the {networkInfo.name} blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet Connection Status */}
          <div className={`p-5 rounded-lg border ${
            isWalletConnected() 
              ? 'bg-green-500/10 border-green-500/30 shadow-md' 
              : 'bg-red-500/10 border-red-500/30'
          } transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isWalletConnected() ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <div>
                  <span className="text-foreground font-medium">
                    {tokenData.network.includes('algorand') ? 'Algorand' : 'Solana'} Wallet
                  </span>
                  {isWalletConnected() && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {getConnectedAddress()?.slice(0, 8)}...{getConnectedAddress()?.slice(-8)}
                    </p>
                  )}
                </div>
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${isWalletConnected() 
                ? 'text-green-500 bg-green-500/10' 
                : 'text-red-500 bg-red-500/10 animate-pulse'}`}
              >
                {isWalletConnected() ? 'Connected ✓' : 'Not Connected'}
              </span>
            </div>
            
            {!isWalletConnected() && (
              <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Please connect your {tokenData.network === 'algorand' ? 'Algorand' : 'Solana'} wallet in the top navigation bar first</span>
              </div>
            )}
          </div>

          {/* Deployment Progress */}
          {isDeploying && (
            <div className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-lg space-y-4">
              <div className="flex items-center space-x-3 text-blue-600">
                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                <span className="font-medium">{deploymentStep}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
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
            disabled={isDeploying || !isWalletConnected() || validationErrors.length > 0}
            className={`w-full h-16 text-xl font-bold rounded-xl transition-all duration-500 ${
              isWalletConnected() && validationErrors.length === 0
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-xl hover:shadow-2xl hover:scale-105'
                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
            }`}
          >
            {isDeploying ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Creating Token...
              </div>
            ) : !isWalletConnected() ? (
              <div className="flex items-center justify-center">
                <Wallet className="w-5 h-5 mr-3" />
                Connect {tokenData.network === 'algorand' ? 'Algorand' : 'Solana'} Wallet First
              </div>
            ) : validationErrors.length > 0 ? (
              <div className="flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 mr-3" />
                Fix Form Errors First
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Rocket className="w-5 h-5 mr-3" />
                Launch Token on {networkInfo.name}
              </div>
            )}
          </Button>

          <div className="p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/40 transition-colors">
            <div className="text-center space-y-2">
              <p className="text-foreground text-lg"><span className="font-medium">Network Fee:</span> {networkInfo.cost}</p>
              <p className="text-sm text-muted-foreground">Your token will be created and managed using your connected wallet</p>
              <p className="text-xs text-muted-foreground italic mt-1">Tokens are created directly on the blockchain, no account required</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Result Dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className={`text-center ${dialogType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {dialogTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center whitespace-pre-line">
              {dialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction 
              onClick={() => setShowResultDialog(false)}
              className={`w-full ${dialogType === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {dialogType === 'success' ? 'Awesome!' : 'Try Again'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}