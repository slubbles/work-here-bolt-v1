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
import { useToast } from '@/hooks/use-toast';
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
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStep, setDeploymentStep] = useState('');
  const { toast } = useToast();
  
  // Supabase token history integration
  const { saveToken } = useTokenHistory();

  // Wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey, wallet: solanaWallet } = useWallet();
  const { 
    connected: algorandConnected, 
    address: algorandAddress, 
    signTransaction: algorandSignTransaction,
    selectedNetwork: algorandSelectedNetwork,
    setSelectedNetwork: setAlgorandSelectedNetwork,
    networkConfig: algorandNetworkConfig,
    isPeraWalletReady,
    isConnecting: algorandIsConnecting
  } = useAlgorandWallet();

  useEffect(() => {
    setMounted(true);
    
    // Welcome toast for new users
    const hasSeenWelcome = localStorage.getItem('snarbles_welcome_shown');
    if (!hasSeenWelcome) {
      setTimeout(() => {
        toast({
          title: "Welcome to Snarbles! 🚀",
          description: "Create your own token in under 30 seconds with no coding required.",
          duration: 5000,
        });
        localStorage.setItem('snarbles_welcome_shown', 'true');
      }, 1000);
    }
  }, []);

  useEffect(() => {
    // Toast for wallet connection status
    if (mounted) {
      if (algorandConnected && algorandAddress) {
        toast({
          title: "Algorand Wallet Connected",
          description: `Connected to ${algorandNetworkConfig?.name || 'Algorand Network'}`,
          duration: 3000,
        });
        checkAlgorandWalletStatus();
      } else if (mounted && !algorandConnected && algorandAddress === null) {
        // Only show disconnect toast if we were previously connected
        const wasConnected = localStorage.getItem('algorand_was_connected');
        if (wasConnected === 'true') {
          toast({
            title: "Algorand Wallet Disconnected",
            description: "Your Algorand wallet has been disconnected.",
            variant: "destructive",
            duration: 3000,
          });
          localStorage.removeItem('algorand_was_connected');
        }
      }
      
      // Track connection state
      if (algorandConnected) {
        localStorage.setItem('algorand_was_connected', 'true');
      }
    }
  }, [algorandConnected, algorandAddress, algorandSelectedNetwork, mounted, toast]);

  // Toast for Solana wallet connection
  useEffect(() => {
    if (mounted) {
      if (solanaConnected && solanaPublicKey) {
        toast({
          title: "Solana Wallet Connected",
          description: `Connected: ${solanaPublicKey.toString().slice(0, 4)}...${solanaPublicKey.toString().slice(-4)}`,
          duration: 3000,
        });
      } else if (mounted && !solanaConnected) {
        // Only show disconnect toast if we were previously connected
        const wasConnected = localStorage.getItem('solana_was_connected');
        if (wasConnected === 'true') {
          toast({
            title: "Solana Wallet Disconnected",
            description: "Your Solana wallet has been disconnected.",
            variant: "destructive",
            duration: 3000,
          });
          localStorage.removeItem('solana_was_connected');
        }
      }
      
      // Track connection state
      if (solanaConnected) {
        localStorage.setItem('solana_was_connected', 'true');
      }
    }
  }, [solanaConnected, solanaPublicKey, mounted, toast]);

  const checkAlgorandWalletStatus = async () => {
    if (!algorandAddress) return;
    
    try {
      const status = await checkWalletConnection(algorandAddress, algorandSelectedNetwork);
      setAlgorandWalletStatus(status);
    } catch (error) {
      console.error('Error checking Algorand wallet status:', error);
    }
  };

  const updateTokenData = (field: string, value: any) => {
    setTokenData({ ...tokenData, [field]: value });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select an image file to upload.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const errorMsg = 'Please select a valid image file (PNG, JPG, GIF, etc.)';
      setError(errorMsg);
      toast({
        title: "Invalid File Type",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMsg = 'Image size must be less than 5MB';
      setError(errorMsg);
      toast({
        title: "File Too Large",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
      return;
    }

    setUploadingImage(true);
    setError('');
    
    // Show upload start toast
    toast({
      title: "Uploading Image...",
      description: "Please wait while we upload your token logo.",
      duration: 2000,
    });

    try {
      const result = await supabaseHelpers.uploadFileToStorage(file, 'token-assets');
      
      if (result.success && result.url) {
        updateTokenData('logoUrl', result.url);
        toast({
          title: "Image Uploaded Successfully! ✅",
          description: "Your token logo has been uploaded and will be displayed on your token.",
          duration: 4000,
        });
      } else {
        const errorMsg = result.error || 'Failed to upload image';
        setError(errorMsg);
        toast({
          title: "Upload Failed",
          description: errorMsg,
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      const errorMsg = 'Failed to upload image. Please try again.';
      setError(errorMsg);
      toast({
        title: "Upload Error",
        description: errorMsg,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!tokenData.name.trim()) {
      const errorMsg = 'Token name is required';
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
      return false;
    }
    if (!tokenData.symbol.trim()) {
      const errorMsg = 'Token symbol is required';
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
      return false;
    }
    if (!tokenData.totalSupply || parseFloat(tokenData.totalSupply) <= 0) {
      const errorMsg = 'Total supply must be greater than 0';
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
        duration: 4000,
      });
      return false;
    }
    
    // Validate total supply doesn't overflow JavaScript's safe integer limit
    const totalSupplyNum = parseFloat(tokenData.totalSupply);
    const decimalsNum = parseInt(tokenData.decimals);
    const totalWithDecimals = totalSupplyNum * Math.pow(10, decimalsNum);
    
    if (!Number.isSafeInteger(totalWithDecimals)) {
      const errorMsg = `Total supply ${totalSupplyNum} with ${decimalsNum} decimals exceeds safe limits. Please reduce the total supply or decimals.`;
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
        duration: 6000,
      });
      return false;
    }
    
    // Success validation toast
    toast({
      title: "Validation Passed ✅",
      description: "All token parameters are valid. Ready to deploy!",
      duration: 2000,
    });
    
    return true;
  };

  // Save token to Supabase after successful deployment
  const saveTokenToSupabase = async (tokenDetails: any, network: string) => {
    try {
      const supabaseTokenData = {
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

      const result = await saveToken(supabaseTokenData);
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

  const updateProgress = (step: string, progress: number) => {
    setDeploymentStep(step);
    setDeploymentProgress(progress);
  };

  const handleDeploy = async () => {
    if (!validateForm()) return;

    // Show deployment start toast
    toast({
      title: "Starting Token Deployment 🚀",
      description: `Deploying ${tokenData.name} (${tokenData.symbol}) to ${selectedNetwork?.label}`,
      duration: 3000,
    });

    setIsDeploying(true);
    setError('');
    setDeploymentResult(null);
    setDeploymentProgress(0);
    setDeploymentStep('Initializing...');

    try {
      const isAlgorandNetwork = tokenData.network.startsWith('algorand');
      
      if (isAlgorandNetwork) {
        // Algorand deployment
        if (!algorandConnected || !algorandAddress) {
          const errorMsg = 'Please connect your Algorand wallet first';
          setError(errorMsg);
          toast({
            title: "Wallet Not Connected",
            description: errorMsg,
            variant: "destructive",
            duration: 4000,
          });
          return;
        }

        toast({
          title: "Preparing Algorand Transaction...",
          description: "Creating token parameters and metadata",
          duration: 2000,
        });

        updateProgress('Preparing Algorand transaction...', 20);

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

        updateProgress('Creating token on Algorand...', 60);

        const result = await createAlgorandToken(
          algorandAddress,
          algorandTokenData,
          algorandSignTransaction,
          supabaseHelpers.uploadMetadataToStorage,
          algorandSelectedNetwork
        );

        if (result.success) {
          updateProgress('Opting in to token...', 80);
          
          toast({
            title: "Token Created Successfully! 🎉",
            description: `${tokenData.name} (${tokenData.symbol}) is now live on ${algorandSelectedNetwork}`,
            duration: 5000,
          });
          
          // Auto opt-in creator to the new token
          if (result.assetId) {
            console.log('Attempting to opt-in creator to asset:', result.assetId);
            try {
              const optInResult = await optInToAsset(
                algorandAddress,
                result.assetId,
                algorandSignTransaction,
                algorandSelectedNetwork
              );
              
              if (optInResult.success) {
                console.log('✓ Creator successfully opted-in to token');
                toast({
                  title: "Auto Opt-in Successful ✅",
                  description: "You've been automatically opted-in to your new token",
                  duration: 3000,
                });
              } else {
                console.warn('Opt-in failed:', optInResult.error);
                toast({
                  title: "Opt-in Warning ⚠️",
                  description: "Token created but auto opt-in failed. Please opt-in manually.",
                  variant: "destructive",
                  duration: 5000,
                });
              }
            } catch (optInError) {
              console.error('Opt-in error:', optInError);
              toast({
                title: "Opt-in Error",
                description: "Token created but auto opt-in failed. Please opt-in manually.",
                variant: "destructive",
                duration: 5000,
              });
            }
          }

          updateProgress('Finalizing...', 100);

          setDeploymentResult({
            ...result,
            network: algorandSelectedNetwork,
            explorerUrl: result.details?.explorerUrl,
            message: 'Token created and you have been automatically opted-in!'
          });
          
          // Save to Supabase
          await saveTokenToSupabase({
            name: tokenData.name,
            symbol: tokenData.symbol,
            assetId: result.assetId,
            transactionId: result.transactionId
          }, algorandSelectedNetwork);
        } else {
          const errorMsg = result.error || 'Failed to create Algorand token';
          setError(errorMsg);
          toast({
            title: "Algorand Token Creation Failed",
            description: errorMsg,
            variant: "destructive",
            duration: 6000,
          });
        }
      } else {
        // Solana deployment
        if (!solanaConnected || !solanaPublicKey || !solanaWallet) {
          const errorMsg = 'Please connect your Solana wallet first';
          setError(errorMsg);
          toast({
            title: "Wallet Not Connected",
            description: errorMsg,
            variant: "destructive",
            duration: 4000,
          });
          return;
        }

        toast({
          title: "Preparing Solana Transaction...",
          description: "Creating token parameters and smart contract",
          duration: 2000,
        });

        updateProgress('Preparing Solana transaction...', 20);

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

        updateProgress('Creating token on Solana...', 60);

        const result = await createTokenOnChain(solanaWallet, solanaTokenData);

        if (result.success) {
          updateProgress('Finalizing...', 100);
          
          toast({
            title: "Solana Token Created! 🎉",
            description: `${tokenData.name} (${tokenData.symbol}) is now live on Solana`,
            duration: 5000,
          });
          
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
          const errorMsg = result.error || 'Failed to create Solana token';
          setError(errorMsg);
          toast({
            title: "Solana Token Creation Failed",
            description: errorMsg,
            variant: "destructive",
            duration: 6000,
          });
        }
      }
    } catch (error) {
      console.error('Deployment error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Deployment failed';
      setError(errorMsg);
      toast({
        title: "Deployment Error",
        description: errorMsg,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setIsDeploying(false);
      setDeploymentProgress(0);
      setDeploymentStep('');
    }
  };

  const networkOptions = [
    {
      value: 'algorand-mainnet',
      label: 'Algorand Mainnet',
      description: 'Production Network',
      cost: '~$0.002',
      recommended: false,
      color: 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30',
      available: algorandConnected && isPeraWalletReady,
      comingSoon: false
    },
    {
      value: 'algorand-testnet',
      label: 'Algorand Testnet',
      description: 'Ultra Low Cost Testing',
      cost: '~$0.001',
      recommended: false,
      color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
      available: algorandConnected && isPeraWalletReady,
      comingSoon: false
    },
    {
      value: 'solana-devnet',
      label: 'Solana Devnet',
      description: 'Testing Environment - Free',
      cost: 'Free',
      recommended: false,
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      available: solanaConnected,
      comingSoon: false
    },
    {
      value: 'soon-network',
      label: 'SOON Network',
      description: 'Next-gen Blockchain',
      cost: 'Coming Soon',
      recommended: false,
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      available: false,
      comingSoon: true
    }
  ];

  const selectedNetwork = networkOptions.find(n => n.value === tokenData.network);
  const canDeploy = selectedNetwork?.available && !selectedNetwork?.comingSoon;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (deploymentResult) {
    // Success toast when user copies address
    const copyButtons = document.querySelectorAll('[title="Copy address"]');
    copyButtons.forEach(button => {
      button.addEventListener('click', () => {
        toast({
          title: "Address Copied! 📋",
          description: "Contract address has been copied to your clipboard",
          duration: 2000,
        });
      });
    });
    
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
              <span className="font-bold text-blue-600">
                {deploymentResult.network === 'algorand-testnet' ? 'Algorand TestNet' : 
                 deploymentResult.network === 'algorand-mainnet' ? 'Algorand MainNet' : 'Solana Network'}
              </span>!
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
                  {deploymentResult.network?.startsWith('algorand') 
                    ? `Asset ID (${deploymentResult.network === 'algorand-mainnet' ? 'MainNet' : 'TestNet'})`
                    : 'Token Address'
                  }:
                </span>
                <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                  {deploymentResult.assetId || deploymentResult.tokenAddress}
                </code>
              </div>
            </div>

            {deploymentResult.network?.startsWith('algorand') && (
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
                    🔗 {deploymentResult.network?.startsWith('algorand') 
                      ? `Algorand ${deploymentResult.network === 'algorand-mainnet' ? 'MainNet' : 'TestNet'}` 
                      : 'Solana'} Token Created!
                  </p>
                  {deploymentResult.assetId && (
                    <p className="text-sm">
                      <strong>Asset ID:</strong> {deploymentResult.assetId}
                    </p>
                  )}
                  {deploymentResult.transactionId && (
                    <p className="text-sm">
                      <strong>Transaction ID:</strong> {deploymentResult.transactionId}
                    </p>
                  )}
                  <p className="text-sm">
                    {deploymentResult.network?.startsWith('algorand')
                      ? 'To see your token in Pera Wallet, you need to opt-in to receive it.'
                      : 'Your token is now available on the Solana blockchain.'
                    }
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={() => {
                  window.open(deploymentResult.explorerUrl, '_blank');
                  toast({
                    title: "Opening Explorer",
                    description: "Viewing your token on the blockchain explorer",
                    duration: 2000,
                  });
                }}
                className="w-full"
                variant="outline"
              >
                🔍 View on {deploymentResult.network?.startsWith('algorand') 
                  ? `${deploymentResult.network === 'algorand-mainnet' ? 'MainNet ' : 'TestNet '}Explorer` 
                  : 'Solana Explorer'}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => {
                    setDeploymentResult(null);
                    setError('');
                    toast({
                      title: "Ready for Another Token",
                      description: "Form has been reset. Create your next token!",
                      duration: 3000,
                    });
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Create Another
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Redirecting to Dashboard",
                      description: "View and manage all your tokens",
                      duration: 2000,
                    });
                    setTimeout(() => {
                      window.location.href = '/dashboard';
                    }, 500);
                  }}
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
    <div className="max-w-2xl mx-auto form-section">
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
                className={`network-card ${
                  network.comingSoon
                    ? 'coming-soon'
                    : network.available
                    ? tokenData.network === network.value
                      ? 'active'
                      : 'available'
                    : 'disabled'
                }`}
                onClick={() => {
                  if (network.available && !network.comingSoon) {
                    updateTokenData('network', network.value);
                    toast({
                      title: `${network.label} Selected`,
                      description: `Token will be deployed to ${network.label}`,
                      duration: 2000,
                    });
                    // Update Algorand network if selecting Algorand
                    if (network.value.startsWith('algorand')) {
                      setAlgorandSelectedNetwork(network.value);
                    }
                  }
                }}
              >
                {network.comingSoon && (
                  <div className="coming-soon-overlay">
                    <Badge className="coming-soon-badge">
                      Coming Soon
                    </Badge>
                  </div>
                )}
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
                        {!network.available && !network.comingSoon && (
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
                {selectedNetwork?.comingSoon 
                  ? `${selectedNetwork.label} is coming soon. Please select an available network.`
                  : 'Please connect a wallet for your selected network to continue with token creation.'
                }
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Algorand Wallet Status */}
      {tokenData.network.startsWith('algorand') && algorandConnected && algorandWalletStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Algorand Wallet Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium">
                  <Badge className={algorandNetworkConfig?.isMainnet 
                    ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
                    : 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30'
                  }>
                    {algorandNetworkConfig?.name || 'Algorand Network'}
                  </Badge>
                </span>
              </div>
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
                  {algorandWalletStatus.canCreateToken ? '✅ Yes' : '❌ Insufficient Balance'}
                </Badge>
              </div>
              {!algorandWalletStatus.canCreateToken && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You need at least <strong>{algorandWalletStatus.recommendedBalance} ALGO</strong> to create a token on {algorandNetworkConfig?.name}.
                    Current balance: {algorandWalletStatus.balance?.toFixed(4)} ALGO
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Details Form */}
      <Card className="token-form-card border-2 border-red-500/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center space-x-2">
            <span>Token Details</span>
          </CardTitle>
          <CardDescription>
            Configure your token's basic information and properties
          </CardDescription>
        </CardHeader>
        <CardContent className="form-section">
          {/* Basic Info */}
          <div className="form-group">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="form-label">Token Name *</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Token"
                  value={tokenData.name}
                  onChange={(e) => updateTokenData('name', e.target.value)}
                  className="form-input-enhanced"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol" className="form-label">Token Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="MAT"
                  value={tokenData.symbol}
                  onChange={(e) => updateTokenData('symbol', e.target.value.toUpperCase())}
                  className="form-input-enhanced"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="form-label">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your token's purpose and utility..."
                value={tokenData.description}
                onChange={(e) => updateTokenData('description', e.target.value)}
                className="form-input-enhanced min-h-[120px]"
                onBlur={() => {
                  if (tokenData.description.length > 0) {
                    toast({
                      title: "Description Added ✅",
                      description: "Token description will help users understand your project",
                      duration: 2000,
                    });
                  }
                }}
              />
            </div>

            {/* Token Economics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalSupply" className="form-label">Total Supply *</Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="1000000"
                  value={tokenData.totalSupply}
                  onChange={(e) => updateTokenData('totalSupply', e.target.value)}
                  className="form-input-enhanced"
                  min="1"
                  max="18446744073709551615"
                  onBlur={() => {
                    const supply = parseFloat(tokenData.totalSupply);
                    if (supply > 0) {
                      toast({
                        title: "Supply Set ✅",
                        description: `Total supply: ${supply.toLocaleString()} tokens`,
                        duration: 2000,
                      });
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: 18.4 quintillion (Algorand protocol limit)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimals" className="form-label">Decimals</Label>
                <Select value={tokenData.decimals} onValueChange={(value) => updateTokenData('decimals', value)}>
                  <SelectTrigger className="form-input-enhanced">
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
            <div className="space-y-4">
              <Label htmlFor="logo" className="form-label">Logo Image</Label>
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
                  <Label htmlFor="logoUrl" className="form-label">Or enter image URL manually</Label>
                  <Input
                    id="logoUrl"
                    placeholder="https://example.com/logo.png"
                    value={tokenData.logoUrl}
                    onChange={(e) => updateTokenData('logoUrl', e.target.value)}
                    className="form-input-enhanced"
                    onBlur={() => {
                      if (tokenData.logoUrl) {
                        toast({
                          title: "Logo URL Added ✅",
                          description: "Logo will be displayed with your token",
                          duration: 2000,
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="space-y-4">
              <Label className="form-label">Social Links (Optional)</Label>
              <div className="grid gap-3">
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://yourwebsite.com"
                    value={tokenData.website}
                    onChange={(e) => updateTokenData('website', e.target.value)}
                    className="form-input-enhanced"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Github className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://github.com/yourproject"
                    value={tokenData.github}
                    onChange={(e) => updateTokenData('github', e.target.value)}
                    className="form-input-enhanced"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Twitter className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="https://twitter.com/yourproject"
                    value={tokenData.twitter}
                    onChange={(e) => updateTokenData('twitter', e.target.value)}
                    className="form-input-enhanced"
                  />
                </div>
              </div>
            </div>

            {/* Token Features */}
            <div className="space-y-4">
              <Label className="form-label">Token Features</Label>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">Mintable</div>
                    <div className="text-sm text-muted-foreground">Allow creating new tokens after deployment</div>
                  </div>
                  <Switch
                    checked={tokenData.mintable}
                    onCheckedChange={(checked) => {
                      updateTokenData('mintable', checked);
                      toast({
                        title: checked ? "Mintable Enabled ✅" : "Mintable Disabled",
                        description: checked ? "You can create new tokens after deployment" : "Token supply is now fixed",
                        duration: 2000,
                      });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">Burnable</div>
                    <div className="text-sm text-muted-foreground">Allow permanently destroying tokens</div>
                  </div>
                  <Switch
                    checked={tokenData.burnable}
                    onCheckedChange={(checked) => {
                      updateTokenData('burnable', checked);
                      toast({
                        title: checked ? "Burnable Enabled ✅" : "Burnable Disabled",
                        description: checked ? "Tokens can be permanently destroyed" : "Tokens cannot be burned",
                        duration: 2000,
                      });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">Pausable</div>
                    <div className="text-sm text-muted-foreground">Allow pausing token transfers in emergencies</div>
                  </div>
                  <Switch
                    checked={tokenData.pausable}
                    onCheckedChange={(checked) => {
                      updateTokenData('pausable', checked);
                      toast({
                        title: checked ? "Pausable Enabled ✅" : "Pausable Disabled",
                        description: checked ? "Token transfers can be paused in emergencies" : "Token transfers cannot be paused",
                        duration: 2000,
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Deployment Progress */}
            {isDeploying && (
              <div className="space-y-4 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl loading-shimmer">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  <span className="text-blue-600 font-bold text-lg">{deploymentStep}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-4 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${deploymentProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <p className="text-sm text-blue-600 font-medium animate-pulse">
                  Please don't close this window while your token is being created...
                </p>
              </div>
            )}

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
              onClick={() => {
                if (!canDeploy) {
                  toast({
                    title: "Cannot Deploy",
                    description: "Please connect a wallet for your selected network",
                    variant: "destructive",
                    duration: 4000,
                  });
                  return;
                }
                handleDeploy();
              }}
              disabled={!canDeploy || isDeploying || (tokenData.network.startsWith('algorand') && algorandWalletStatus && !algorandWalletStatus.canCreateToken)}
              className="w-full bg-red-500 hover:bg-red-600 text-white h-12 text-lg font-semibold"
            >
              {isDeploying ? (
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Creating on {selectedNetwork?.label}...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Rocket className="w-5 h-5 mr-2" />
                  <span>🚀 Deploy to {selectedNetwork?.label}</span>
                </div>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}