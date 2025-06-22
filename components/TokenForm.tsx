'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, Settings, Globe, Github, Twitter, Plus, Flame, Pause, Upload, Info, Check, Rocket, Users, TrendingUp, Loader2, CheckCircle, Network, Sparkles, Zap, ArrowRight, Wallet, ChevronDown, ChevronUp, AlertTriangle, Shield, Star, Clock, DollarSign, Image, FileImage, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, ALGORAND_NETWORK_INFO, checkWalletConnection, optInToAsset, ARC3Metadata } from '@/lib/algorand';
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
  const [isCreating, setIsCreating] = useState(false);
  const [creationStep, setCreationStep] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [contractAddress, setContractAddress] = useState('');
  const [assetId, setAssetId] = useState<number | null>(null);
  const [isOptingIn, setIsOptingIn] = useState(false);
  const [optInComplete, setOptInComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [algorandWalletStatus, setAlgorandWalletStatus] = useState<any>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [optInSuccess, setOptInSuccess] = useState(false);
  const [createdAssetId, setCreatedAssetId] = useState<number | null>(null);
  const [isAlgorandToken, setIsAlgorandToken] = useState(false);

  // Wallet connections
  const { connected: solanaConnected, publicKey: solanaPublicKey, wallet: solanaWallet } = useWallet();
  const { 
    connected: algorandConnected, 
    address: algorandAddress, 
    signTransaction: algorandSignTransaction,
    isConnecting: algorandConnecting,
    error: algorandError,
    balance: algorandBalance
  } = useAlgorandWallet();

  // Check Algorand wallet status when connected
  useEffect(() => {
    const checkAlgorandStatus = async () => {
      if (algorandConnected && algorandAddress) {
        try {
          console.log('=== CHECKING ALGORAND STATUS ===');
          console.log('Algorand connected:', algorandConnected);
          console.log('Algorand address:', algorandAddress);
          console.log('Algorand balance from context:', algorandBalance);
          
          const status = await checkWalletConnection(algorandAddress);
          console.log('Wallet status result:', status);
          setAlgorandWalletStatus(status);
        } catch (error) {
          console.error('Failed to check Algorand wallet status:', error);
          setAlgorandWalletStatus({
            connected: false,
            error: 'Failed to check wallet status',
            canCreateToken: false,
            recommendedBalance: 0.101
          });
        }
      } else {
        console.log('Algorand not connected, clearing wallet status');
        setAlgorandWalletStatus(null);
      }
    };

    checkAlgorandStatus();
  }, [algorandConnected, algorandAddress]);

  // Check if we have applied tokenomics from the simulator
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tokenomics') === 'applied') {
      const savedTokenomics = localStorage.getItem('snarbles_tokenomics');
      if (savedTokenomics) {
        const config = JSON.parse(savedTokenomics);
        setTokenData((prev: any) => ({
          ...prev,
          totalSupply: config.totalSupply.toString(),
        }));
      }
    }
  }, []);

  // Handle logo file upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be smaller than 5MB');
      return;
    }

    setLogoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setError(''); // Clear any previous errors
  };

  // Upload metadata JSON to Supabase Storage
  const uploadMetadataToStorage = async (metadata: ARC3Metadata): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const metadataFile = new File([metadataBlob], `${tokenData.symbol}-metadata.json`, { type: 'application/json' });
      return await supabaseHelpers.uploadFileToStorage(metadataFile, 'token-metadata');
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setTokenData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleFeature = (feature: string) => {
    setTokenData((prev: any) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
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
      setError('Image file must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    setError('');

    try {
      const uploadResult = await supabaseHelpers.uploadFileToStorage(
        file, 
        'token-assets', 
        `logos/${Date.now()}-${file.name}`
      );

      if (uploadResult.success && uploadResult.url) {
        setUploadedImageUrl(uploadResult.url);
        setTokenData((prev: any) => ({
          ...prev,
          logoUrl: uploadResult.url,
        }));
        setSuccess('Image uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(uploadResult.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      setError('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const createMetadataForAlgorand = async (tokenData: any, imageUrl: string) => {
    // Create ARC-3 compliant metadata
    const metadata = {
      name: tokenData.name,
      description: tokenData.description,
      image: imageUrl,
      decimals: parseInt(tokenData.decimals),
      unit_name: tokenData.symbol,
      external_url: tokenData.website || undefined,
      background_color: "FFFFFF",
      animation_url: undefined,
      properties: {
        website: tokenData.website || undefined,
        github: tokenData.github || undefined,
        twitter: tokenData.twitter || undefined,
        mintable: tokenData.mintable,
        burnable: tokenData.burnable,
        pausable: tokenData.pausable,
      }
    };

    // Upload metadata JSON to storage
    const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json'
    });
    const metadataFile = new File([metadataBlob], `${tokenData.symbol}-metadata.json`, {
      type: 'application/json'
    });

    const uploadResult = await supabaseHelpers.uploadFileToStorage(
      metadataFile,
      'token-assets',
      `metadata/${Date.now()}-${tokenData.symbol}-metadata.json`
    );

    return uploadResult;
  };

  const handleOptInToToken = async () => {
    if (!algorandSignTransaction || !algorandAddress || !createdAssetId) {
      setError('Wallet not connected or asset ID not available');
      return;
    }

    setIsOptingIn(true);
    setError('');

    try {
      const result = await optInToAsset(
        algorandAddress,
        createdAssetId,
        algorandSignTransaction
      );

      if (result.success) {
        setOptInSuccess(true);
        setSuccess('Successfully opted in to your token! It should now appear in your Pera Wallet.');
      } else {
        setError(result.error || 'Failed to opt in to token');
      }
    } catch (error) {
      console.error('Opt-in error:', error);
      setError('Failed to opt in to token');
    } finally {
      setIsOptingIn(false);
    }
  };

  const getNetworkInfo = (networkValue: string) => {
    const networks = {
      'solana-devnet': { 
        name: 'Solana Devnet', 
        description: 'Solana testing environment - Free deployment',
        cost: 'Free',
        recommended: true,
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        requiresWallet: 'solana'
      },
      'solana-mainnet': {
        name: 'Solana Mainnet',
        description: 'Solana production network - Real deployment',
        cost: '~$2-5',
        recommended: false,
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        requiresWallet: 'solana'
      },
      'algorand-testnet': {
        name: ALGORAND_NETWORK_INFO.name,
        description: ALGORAND_NETWORK_INFO.description,
        cost: ALGORAND_NETWORK_INFO.cost,
        recommended: false,
        color: 'bg-[#76f935]/20 text-[#76f935] border-[#76f935]/30',
        requiresWallet: 'algorand'
      },
      'soon-network': {
        name: 'Soon Network',
        description: 'Next-generation blockchain - Coming Soon',
        cost: 'TBA',
        recommended: false,
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        disabled: true,
        requiresWallet: 'soon'
      }
    };
    return networks[networkValue as keyof typeof networks] || networks['solana-devnet'];
  };

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Also update the logoUrl in tokenData for preview
      setTokenData((prev: any) => ({ ...prev, logoUrl: URL.createObjectURL(file) }));
    }
  };

  const validateForm = () => {
    // Clear any previous errors
    setError('');
    
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

    const networkInfo = getNetworkInfo(tokenData.network);
    
    // Check wallet connection based on network
    if (networkInfo.requiresWallet === 'solana' && !solanaConnected) {
      setError('Please connect your Solana wallet first');
      return false;
    }
    
    if (networkInfo.requiresWallet === 'algorand') {
      if (!algorandConnected) {
        setError('Please connect your Algorand wallet first');
        return false;
      }
      
      // Explicitly check if algorandAddress is available
      if (!algorandAddress || algorandAddress.trim() === '') {
        setError('Algorand wallet address not detected. Please ensure your wallet is fully connected and try again.');
        return false;
      }
      
      // Wait for wallet status to be loaded
      if (algorandWalletStatus === null) {
        setError('Loading wallet status, please wait...');
        return false;
      }
      
      // Additional Algorand-specific validations
      if (algorandWalletStatus && !algorandWalletStatus.canCreateToken) {
        const requiredBalance = algorandWalletStatus.recommendedBalance || 0.101;
        const currentBalance = algorandWalletStatus.balance || 0;
        const shortfall = requiredBalance - currentBalance;
        
        setError(`Insufficient ALGO balance for token creation. You have ${currentBalance.toFixed(4)} ALGO but need ${requiredBalance.toFixed(3)} ALGO (shortfall: ${shortfall.toFixed(4)} ALGO). This includes account minimum balance + asset creation fee + transaction costs.`);
        return false;
      }
    }

    return true;
  };

  const handleCreateToken = async () => {
    // Clear any previous errors
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    setProgress(0);
    setIsAlgorandToken(tokenData.network === 'algorand-testnet');
    
    // Upload logo file to Supabase if one was selected
    let uploadedLogoUrl = tokenData.logoUrl;
    if (logoFile && tokenData.network === 'algorand-testnet') {
      try {
        setCreationStep('Uploading logo...');
        setProgress(10);
        
        const uploadResult = await supabaseHelpers.uploadFileToStorage(logoFile, 'token-assets');
        if (uploadResult.success) {
          uploadedLogoUrl = uploadResult.url!;
          setTokenData((prev: any) => ({ ...prev, logoUrl: uploadedLogoUrl }));
        } else {
          setError(`Logo upload failed: ${uploadResult.error}`);
          setIsCreating(false);
          return;
        }
      } catch (err) {
        setError('Logo upload failed');
        setIsCreating(false);
        return;
      }
    }
    
    const networkInfo = getNetworkInfo(tokenData.network);
    
    const steps = [
      'Validating token parameters...',
      `Connecting to ${networkInfo.name}...`,
      'Preparing smart contract call...',
      'Creating token...',
      'Deploying to blockchain...',
      'Verifying contract...',
      'Finalizing deployment...'
    ];

    try {
      for (let i = 0; i < steps.length - 2; i++) {
        setCreationStep(steps[i]);
        setProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1000));
      }

      // Handle logo upload if file is selected
      let finalLogoUrl = tokenData.logoUrl;
      if (logoFile) {
        setCreationStep('Uploading logo image...');
        setProgress(60);
        setIsUploadingImage(true);
        
        const uploadResult = await supabaseHelpers.uploadFileToStorage(logoFile, 'token-assets');
        if (uploadResult.success) {
          finalLogoUrl = uploadResult.url!;
          handleInputChange('logoUrl', finalLogoUrl);
        } else {
          console.warn('Logo upload failed, continuing without logo:', uploadResult.error);
        }
        setIsUploadingImage(false);
      }

      let result;

      // Route to appropriate blockchain
      if (tokenData.network.startsWith('solana')) {
        setCreationStep('Creating Solana token...');
        setProgress(70);
        
        result = await createTokenOnChain(solanaWallet, {
          name: tokenData.name,
          symbol: tokenData.symbol,
          description: tokenData.description,
          decimals: parseInt(tokenData.decimals),
          totalSupply: parseFloat(tokenData.totalSupply),
          logoUrl: finalLogoUrl,
          website: tokenData.website,
          github: tokenData.github,
          twitter: tokenData.twitter,
          mintable: tokenData.mintable,
          burnable: tokenData.burnable,
          pausable: tokenData.pausable,
        });
      } else if (tokenData.network === 'algorand-testnet') {
        setCreationStep('Creating Algorand ASA...');
        setProgress(70);
        
        // Additional validation for Algorand
        if (!algorandAddress || algorandAddress.trim() === '') {
          throw new Error('Algorand wallet address is not available. Please disconnect and reconnect your wallet.');
        }

        let finalLogoUrl = tokenData.logoUrl;
        
        // If we have an uploaded image, create metadata
        if (finalLogoUrl) {
          setCreationStep('Creating metadata...');
          const metadataResult = await createMetadataForAlgorand(tokenData, finalLogoUrl);
          
          if (metadataResult.success && metadataResult.url) {
            // Use metadata URL as the assetURL for ARC-3 compliance
            finalLogoUrl = metadataResult.url;
          }
        }
        
        console.log('=== TOKEN FORM DEBUG ===');
        console.log('Algorand address from context:', algorandAddress);
        console.log('Algorand connected status:', algorandConnected);
        console.log('Algorand sign transaction function type:', typeof algorandSignTransaction);
        console.log('Algorand wallet status:', algorandWalletStatus);
        console.log('Token data being sent:', {
          name: tokenData.name,
          symbol: tokenData.symbol,
          description: tokenData.description,
          decimals: parseInt(tokenData.decimals),
          totalSupply: tokenData.totalSupply, // Now using string
          logoUrl: finalLogoUrl,
          website: tokenData.website,
          github: tokenData.github,
          twitter: tokenData.twitter,
          mintable: tokenData.mintable,
          burnable: tokenData.burnable,
          pausable: tokenData.pausable,
        });
        console.log('=== END TOKEN FORM DEBUG ===');
        
        result = await createAlgorandToken(
          algorandAddress!,
          {
            ...tokenData,
            logoUrl: uploadedLogoUrl, // Use uploaded URL
            totalSupply: tokenData.totalSupply, // Keep as string for BigInt support
            decimals: parseInt(tokenData.decimals),
          },
          algorandSignTransaction,
          // Pass metadata upload function for ARC-3 compliance
          async (metadata) => {
            const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
            const metadataFile = new File([jsonBlob], `${tokenData.symbol}-metadata.json`, { type: 'application/json' });
            return await supabaseHelpers.uploadFileToStorage(metadataFile, 'token-metadata');
          }
        );
      } else {
        throw new Error('Unsupported network');
      }

      setCreationStep('Verifying contract...');
      setProgress(85);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCreationStep('Finalizing deployment...');
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (result?.success) {
        // Store asset ID for Algorand tokens for opt-in
        if (tokenData.network === 'algorand-testnet' && result.assetId) {
          setAssetId(result.assetId);
        }
        
        const address = result.tokenAddress || result.assetId?.toString() || 'demo_' + Math.random().toString(36).substr(2, 9);
        setContractAddress(address);
        
        // For Algorand tokens, store the asset ID for opt-in
        if (result.assetId && tokenData.network === 'algorand-testnet') {
          setCreatedAssetId(result.assetId);
        }
        
        setCreationStep('Token created successfully!');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setIsCreating(false);
        setShowSuccessModal(true);
      } else {
        throw new Error(result?.error || 'Failed to create token');
      }

    } catch (error) {
      console.error('Token creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create token');
      setIsCreating(false);
      setProgress(0);
      setCreationStep('');
    }
  };

  const handleOptInToAsset = async () => {
    if (!algorandAddress || !contractAddress) return;
    
    setIsOptingIn(true);
    setError('');
    
    try {
      const assetId = parseInt(contractAddress);
      const result = await optInToAsset(algorandAddress, assetId, algorandSignTransaction);
      
      if (result.success) {
        setSuccess('Successfully opted in to your new token!');
      } else {
        setError(result.error || 'Opt-in failed');
      }
    } catch (error) {
      console.error('Opt-in error:', error);
      setError('Failed to opt in to token');
    } finally {
      setIsOptingIn(false);
    }
  };

  // Handle opt-in to Algorand ASA
  const handleOptIn = async () => {
    if (!assetId || !algorandAddress || !algorandSignTransaction) {
      setError('Opt-in not available - missing required data');
      return;
    }

    setIsOptingIn(true);
    setError('');

    try {
      const result = await optInToAsset(algorandAddress, assetId, algorandSignTransaction);
      if (result.success) {
        setOptInComplete(true);
      } else {
        setError(result.error || 'Opt-in failed');
      }
    } catch (error) {
      setError('Opt-in failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsOptingIn(false);
    }
  };

  const currentNetworkInfo = getNetworkInfo(tokenData.network);
  const isCorrectWalletConnected = 
    (currentNetworkInfo.requiresWallet === 'solana' && solanaConnected) ||
    (currentNetworkInfo.requiresWallet === 'algorand' && algorandConnected);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 text-red-500 font-semibold text-sm">
          <div className="relative">
            <Rocket className="w-5 h-5" />
            <div className="absolute -inset-1 bg-red-500/20 rounded-full blur animate-pulse"></div>
          </div>
          <span className="uppercase tracking-wider">Launch Your Vision</span>
          <Sparkles className="w-4 h-4" />
        </div>
        
        <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
          <span className="block text-foreground">Create Your</span>
          <span className="block">
            <span className="gradient-text relative">
              Dream Token
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-red-600/20 blur-lg -z-10"></div>
            </span>
          </span>
          <span className="block text-foreground">in Minutes</span>
        </h1>
        
        <p className="text-muted-foreground text-xl leading-relaxed max-w-2xl">
          Transform your idea into a real cryptocurrency token that thousands can discover, trade, and believe in. 
          <span className="text-foreground font-semibold"> Your community is waiting.</span>
        </p>
      </div>

      {/* Enhanced Wallet Connection Status */}
      {!isCorrectWalletConnected && (
        <div className="glass-card p-6 border-l-4 border-yellow-500 bg-yellow-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="w-6 h-6 text-yellow-500" />
              <div>
                <h3 className="text-foreground font-semibold">
                  Connect Your {currentNetworkInfo.requiresWallet === 'solana' ? 'Solana' : 'Algorand'} Wallet
                </h3>
                <p className="text-muted-foreground text-sm">
                  You need to connect your {currentNetworkInfo.requiresWallet === 'solana' ? 'Solana' : 'Algorand'} wallet to create tokens on {currentNetworkInfo.name}
                </p>
              </div>
            </div>
            {currentNetworkInfo.requiresWallet === 'solana' ? (
              <WalletMultiButton className="!bg-red-500 hover:!bg-red-600 !text-white !font-semibold !rounded-xl !px-6 !py-3">
                Connect Solana Wallet
              </WalletMultiButton>
            ) : (
              <Button 
                onClick={() => window.location.reload()} // This will trigger the wallet connection in navbar
                className="bg-[#76f935] hover:bg-[#5dd128] text-white font-semibold rounded-xl px-6 py-3"
                disabled={algorandConnecting}
              >
                {algorandConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Algorand Wallet'
                )}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Connected Wallet Status */}
      {isCorrectWalletConnected && (
        <div className={`glass-card p-4 border-l-4 ${
          currentNetworkInfo.requiresWallet === 'algorand' && algorandWalletStatus === null
            ? 'border-yellow-500 bg-yellow-500/10'
            : 'border-green-500 bg-green-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentNetworkInfo.requiresWallet === 'algorand' && algorandWalletStatus === null ? (
                <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="text-green-600 font-semibold">
                  {currentNetworkInfo.requiresWallet === 'algorand' && algorandWalletStatus === null 
                    ? '🔄 Checking Algorand Wallet Balance...'
                    : `✅ ${currentNetworkInfo.requiresWallet === 'solana' ? 'Solana' : 'Algorand'} Wallet Connected`
                  }
                </p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>
                    {currentNetworkInfo.requiresWallet === 'solana' 
                      ? `${solanaPublicKey?.toString().slice(0, 4)}...${solanaPublicKey?.toString().slice(-4)}`
                      : `${algorandAddress?.slice(0, 4)}...${algorandAddress?.slice(-4)}`
                    }
                  </span>
                  {currentNetworkInfo.requiresWallet === 'algorand' && algorandBalance !== null && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-3 h-3" />
                      <span>{algorandBalance.toFixed(4)} ALGO</span>
                      {algorandWalletStatus && !algorandWalletStatus.canCreateToken && (
                        <span className="text-yellow-500 text-xs">
                          (Need {(algorandWalletStatus.recommendedBalance || 0.101).toFixed(3)} ALGO)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {currentNetworkInfo.requiresWallet === 'algorand' && algorandWalletStatus && algorandWalletStatus.balance !== undefined && (
              <div className="text-right">
                {algorandWalletStatus.canCreateToken ? (
                  <div className="flex items-center space-x-2 text-green-500">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Ready to Create</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-yellow-500">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Need {((algorandWalletStatus.recommendedBalance || 0.101) - (algorandWalletStatus.balance || 0)).toFixed(4)} more ALGO
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {(error || algorandError) && (
        <div className="glass-card p-4 border-l-4 border-red-500 bg-red-500/10">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 font-medium">{error || algorandError}</p>
          </div>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="glass-card p-4 border-l-4 border-green-500 bg-green-500/10">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-500 font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="space-y-8 relative z-10">
          {/* Essential Details Section */}
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Essential Details</h2>
                <p className="text-muted-foreground">The core information for your token</p>
              </div>
            </div>

            {/* Network Selection */}
            <div className="space-y-4">
              <Label htmlFor="network" className="text-foreground font-semibold text-lg flex items-center space-x-2">
                <Network className="w-5 h-5 text-red-500" />
                <span>Choose Your Network*</span>
              </Label>
              <Select value={tokenData.network} onValueChange={(value) => handleInputChange('network', value)}>
                <SelectTrigger className="input-enhanced h-14 text-lg rounded-xl border-2 bg-background">
                  <SelectValue placeholder="Select deployment network" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border rounded-xl shadow-xl z-50">
                  <SelectItem value="solana-devnet" className="text-foreground p-4 cursor-pointer hover:bg-muted focus:bg-muted">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">Solana Devnet</div>
                        <div className="text-xs text-muted-foreground">Testing environment - Free (Recommended)</div>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    </div>
                  </SelectItem>
                  <SelectItem value="solana-mainnet" className="text-foreground p-4 cursor-pointer hover:bg-muted focus:bg-muted">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">Solana Mainnet</div>
                        <div className="text-xs text-muted-foreground">Production network - ~$2-5</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="algorand-testnet" className="text-foreground p-4 cursor-pointer hover:bg-muted focus:bg-muted">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-4 h-4 rounded-full bg-[#76f935] flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">Algorand TestNet</div>
                        <div className="text-xs text-muted-foreground">Ultra low cost - ~$0.001</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="soon-network" className="text-foreground p-4 opacity-50 cursor-not-allowed" disabled>
                    <div className="flex items-center space-x-3 w-full">
                      <div className="w-4 h-4 rounded-full bg-orange-500 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground">Soon Network</div>
                        <div className="text-xs text-muted-foreground">Coming Soon - Next-gen blockchain</div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-orange-500 font-medium">Soon</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="text-center">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl ${currentNetworkInfo.color} text-sm font-semibold`}>
                  <Network className="w-4 h-4" />
                  <span>{currentNetworkInfo.name} - {currentNetworkInfo.cost}</span>
                  {currentNetworkInfo.recommended && (
                    <Star className="w-3 h-3 text-green-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Token Name & Symbol */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="name" className="text-foreground font-semibold text-lg">
                  Token Name*
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Community Rewards Token"
                  value={tokenData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-enhanced h-14 text-lg rounded-xl border-2"
                  maxLength={32}
                />
                <p className="text-sm text-muted-foreground">Choose a memorable name for your token</p>
              </div>

              <div className="space-y-4">
                <Label htmlFor="symbol" className="text-foreground font-semibold text-lg">
                  Token Symbol*
                </Label>
                <Input
                  id="symbol"
                  placeholder="e.g., CRT"
                  value={tokenData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                  className="input-enhanced h-14 text-lg rounded-xl border-2"
                  maxLength={tokenData.network === 'algorand-testnet' ? 8 : 10}
                />
                <p className="text-sm text-muted-foreground">
                  Short ticker symbol ({tokenData.network === 'algorand-testnet' ? '2-8' : '2-10'} characters)
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <Label htmlFor="description" className="text-foreground font-semibold text-lg">
                Tell Your Story
              </Label>
              <Textarea
                id="description"
                placeholder="What problem does your token solve? What makes your community special? Share your vision..."
                value={tokenData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input-enhanced min-h-[140px] text-lg rounded-xl border-2 resize-none"
                maxLength={200}
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Describe your token's purpose and vision</p>
                <span className="text-xs text-muted-foreground">{tokenData.description.length}/200</span>
              </div>
            </div>

            {/* Supply and Decimals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="totalSupply" className="text-foreground font-semibold text-lg">
                  Total Supply*
                </Label>
                <Input
                  id="totalSupply"
                  type="number"
                  placeholder="1000000"
                  value={tokenData.totalSupply}
                  onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                  className="input-enhanced h-14 text-lg rounded-xl border-2"
                />
                <p className="text-sm text-muted-foreground">How many tokens will exist in total</p>
              </div>
              <div className="space-y-4">
                <Label htmlFor="decimals" className="text-foreground font-semibold text-lg">
                  Decimals*
                </Label>
                <Select value={tokenData.decimals} onValueChange={(value) => handleInputChange('decimals', value)}>
                  <SelectTrigger className="input-enhanced h-14 text-lg rounded-xl border-2 bg-background">
                    <SelectValue placeholder="9 (recommended)" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border rounded-xl shadow-xl z-50">
                    <SelectItem value="9" className="text-foreground cursor-pointer hover:bg-muted focus:bg-muted">9 (standard)</SelectItem>
                    <SelectItem value="6" className="text-foreground cursor-pointer hover:bg-muted focus:bg-muted">6</SelectItem>
                    {tokenData.network === 'algorand-testnet' && (
                      <>
                        <SelectItem value="0" className="text-foreground cursor-pointer hover:bg-muted focus:bg-muted">0 (whole numbers)</SelectItem>
                        <SelectItem value="3" className="text-foreground cursor-pointer hover:bg-muted focus:bg-muted">3</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">Token precision (9 is standard)</p>
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="space-y-6">
            <button
              onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
              className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-red-500" />
                <span className="text-foreground font-semibold text-lg">Advanced Features</span>
              </div>
              {showAdvancedFeatures ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showAdvancedFeatures && (
              <div className="space-y-6 p-6 bg-muted/20 rounded-xl border border-border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div 
                    className={`feature-card p-6 cursor-pointer transition-all ${tokenData.mintable ? 'active' : ''}`}
                    onClick={() => toggleFeature('mintable')}
                  >
                    <div className="text-center space-y-3">
                      <Plus className="w-8 h-8 text-green-500 mx-auto" />
                      <h4 className="font-semibold text-foreground">Mintable</h4>
                      <p className="text-sm text-muted-foreground">Create new tokens after deployment</p>
                    </div>
                  </div>

                  <div 
                    className={`feature-card p-6 cursor-pointer transition-all ${tokenData.burnable ? 'active' : ''}`}
                    onClick={() => toggleFeature('burnable')}
                  >
                    <div className="text-center space-y-3">
                      <Flame className="w-8 h-8 text-red-500 mx-auto" />
                      <h4 className="font-semibold text-foreground">Burnable</h4>
                      <p className="text-sm text-muted-foreground">Permanently remove tokens from supply</p>
                    </div>
                  </div>

                  <div 
                    className={`feature-card p-6 cursor-pointer transition-all ${tokenData.pausable ? 'active' : ''}`}
                    onClick={() => toggleFeature('pausable')}
                  >
                    <div className="text-center space-y-3">
                      <Pause className="w-8 h-8 text-yellow-500 mx-auto" />
                      <h4 className="font-semibold text-foreground">Pausable</h4>
                      <p className="text-sm text-muted-foreground">Emergency stop for transfers</p>
                    </div>
                  </div>
                </div>
                
                {tokenData.network === 'algorand-testnet' && (
                  <div className="p-4 bg-[#76f935]/10 border border-[#76f935]/30 rounded-lg">
                    <p className="text-[#76f935] text-sm font-medium">
                      ℹ️ Note: Advanced features on Algorand are implemented through the manager/freeze addresses and may require additional transactions.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Social Links & Branding */}
          <div className="space-y-6">
            <button
              onClick={() => setShowSocialLinks(!showSocialLinks)}
              className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-red-500" />
                <span className="text-foreground font-semibold text-lg">Social Links & Branding</span>
              </div>
              {showSocialLinks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {showSocialLinks && (
              <div className="space-y-6 p-6 bg-muted/20 rounded-xl border border-border">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <Label className="text-foreground font-semibold text-lg flex items-center space-x-2">
                    <Image className="w-5 h-5 text-red-500" />
                    <span>Token Logo</span>
                  </Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="input-enhanced rounded-xl flex-1"
                        disabled={isUploadingImage}
                      />
                      {isUploadingImage && (
                        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                      )}
                    </div>
                    {(uploadedImageUrl || tokenData.logoUrl) && (
                      <div className="flex items-center space-x-4">
                        <img 
                          src={uploadedImageUrl || tokenData.logoUrl}
                          alt="Token logo preview"
                          className="w-16 h-16 rounded-lg object-cover border border-border"
                        />
                        <div className="text-sm text-muted-foreground">
                          <p>✅ Logo uploaded successfully</p>
                          <p className="text-xs">This will appear in explorers and wallets</p>
                        </div>
                      </div>
                    )}
                    <Input
                      placeholder="Or enter logo URL manually"
                      value={tokenData.logoUrl}
                      onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                      className="input-enhanced rounded-xl"
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload an image or provide a URL. For best results, use a square image (PNG/JPG, max 5MB).
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label htmlFor="logoUrl" className="text-foreground font-medium flex items-center">
                      <FileImage className="w-4 h-4 mr-2" />
                      Logo Image
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center justify-center px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <Upload className="w-4 h-4 mr-2" />
                          <span className="text-sm">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs text-muted-foreground">Max 5MB</span>
                      </div>
                      {logoPreview && (
                        <div className="flex items-center space-x-3">
                          <img src={logoPreview} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover border border-border" />
                          <div className="text-sm text-muted-foreground">
                            {logoFile?.name} ({Math.round((logoFile?.size || 0) / 1024)}KB)
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Or enter a URL:</span>
                      </div>
                      <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={tokenData.logoUrl}
                        onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                        className="input-enhanced rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="logoUrl" className="text-foreground font-medium">
                      Logo {tokenData.network === 'algorand-testnet' ? '(Upload File or URL)' : '(URL)'}
                    </Label>
                    {tokenData.network === 'algorand-testnet' ? (
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileChange}
                          className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 input-enhanced"
                        />
                        <div className="text-center text-muted-foreground text-sm">or</div>
                        <Input
                          id="logoUrl"
                          placeholder="https://example.com/logo.png"
                          value={logoFile ? '' : tokenData.logoUrl}
                          onChange={(e) => {
                            setLogoFile(null);
                            handleInputChange('logoUrl', e.target.value);
                          }}
                          className="input-enhanced rounded-xl"
                          disabled={!!logoFile}
                        />
                      </div>
                    ) : (
                      <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={tokenData.logoUrl}
                        onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                        className="input-enhanced rounded-xl"
                      />
                    )}
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="website" className="text-foreground font-medium">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://yourproject.com"
                      value={tokenData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="input-enhanced rounded-xl"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="twitter" className="text-foreground font-medium">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/yourproject"
                      value={tokenData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      className="input-enhanced rounded-xl"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label htmlFor="github" className="text-foreground font-medium">GitHub</Label>
                    <Input
                      id="github"
                      placeholder="https://github.com/yourproject"
                      value={tokenData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      className="input-enhanced rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Create Button */}
          <div className="pt-8 border-t border-border">
            {isCreating ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6 relative">
                    <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Creating Your Token</h3>
                  <p className="text-muted-foreground text-lg">{creationStep}</p>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={handleCreateToken}
                  disabled={!isCorrectWalletConnected || algorandConnecting || (currentNetworkInfo.requiresWallet === 'algorand' && algorandWalletStatus === null)}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-6 text-xl rounded-xl button-enhanced shadow-2xl hover:shadow-3xl transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Rocket className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                  {!isCorrectWalletConnected 
                    ? `Connect ${currentNetworkInfo.requiresWallet === 'solana' ? 'Solana' : 'Algorand'} Wallet to Deploy`
                    : currentNetworkInfo.requiresWallet === 'algorand' && algorandWalletStatus === null
                    ? 'Checking Wallet Balance...'
                    : `Deploy to ${currentNetworkInfo.name}`
                  }
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                {currentNetworkInfo.requiresWallet === 'algorand' && algorandWalletStatus && !algorandWalletStatus.canCreateToken && algorandWalletStatus.balance !== undefined && (
                  <div className="text-center">
                    <p className="text-sm text-yellow-500">
                      ⚠️ Need {(algorandWalletStatus.recommendedBalance || 0.101).toFixed(3)} ALGO total (including minimum balance requirements)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {algorandWalletStatus.balance.toFixed(4)} ALGO | 
                      Shortfall: {((algorandWalletStatus.recommendedBalance || 0.101) - algorandWalletStatus.balance).toFixed(4)} ALGO
                    </p>
                    <details className="mt-2 text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">Why do I need this much ALGO?</summary>
                      <div className="mt-2 p-3 bg-muted/30 rounded-lg text-left">
                        <p className="mb-2">Algorand requires ALGO for:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Account minimum balance: ~0.1 ALGO</li>
                          <li>Asset creation fee: 0.001 ALGO</li>
                          <li>New asset minimum balance: 0.1 ALGO</li>
                        </ul>
                        <p className="mt-2 text-xs">This ensures your account can hold the new token you create.</p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal with Opt-in */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="glass-card border-green-500/50 max-w-lg mx-4">
          <DialogHeader className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto relative">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div className="absolute inset-0 rounded-full border-2 border-green-500/30 animate-ping"></div>
            </div>
            <DialogTitle className="text-3xl font-bold text-foreground">
              🎉 Token Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="text-center">
              <p className="text-muted-foreground text-lg mb-6">
                Your <span className="text-foreground font-bold">{tokenData.name} ({tokenData.symbol})</span> token is now live on {currentNetworkInfo.name}!
              </p>
              <div className="glass-card p-6 bg-muted/30">
                <p className="text-sm text-muted-foreground mb-3 font-medium">
                  {tokenData.network === 'algorand-testnet' ? 'Asset ID:' : 'Token Address:'}
                </p>
                <p className="text-foreground font-mono text-sm break-all bg-background/50 p-3 rounded-lg">
                  {contractAddress}
                </p>
              </div>
            </div>
            
            {/* Algorand Opt-in Section */}
            {tokenData.network === 'algorand-testnet' && assetId && !optInComplete && (
              <div className="glass-card p-6 bg-[#76f935]/5 border border-[#76f935]/30">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-[#76f935]/20 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6 text-[#76f935]" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-lg mb-2">Opt-in to Your Token</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      To see your token in Pera Wallet, you need to opt-in to receive it. This is a one-time setup required by Algorand.
                    </p>
                  </div>
                  <Button
                    onClick={handleOptIn}
                    disabled={isOptingIn}
                    className="bg-[#76f935] hover:bg-[#5dd128] text-white font-semibold"
                  >
                    {isOptingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Opting In...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Opt-in to Token
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {optInComplete && (
              <div className="glass-card p-4 bg-green-500/10 border border-green-500/30">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <p className="text-green-600 font-medium">✅ Successfully opted in! Your token should now appear in Pera Wallet.</p>
                </div>
              </div>
            )}

            {/* Algorand Opt-in Section */}
            {isAlgorandToken && createdAssetId && (
              <div className="space-y-4">
                <div className="p-4 bg-[#76f935]/10 border border-[#76f935]/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-[#76f935] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[#76f935] font-semibold text-sm">Algorand Token Created!</p>
                      <p className="text-[#76f935] text-xs mt-1">
                        To see your token in Pera Wallet, you need to opt-in to receive it.
                      </p>
                    </div>
                  </div>
                </div>
                
                {!optInSuccess ? (
                  <Button
                    onClick={handleOptInToToken}
                    disabled={isOptingIn}
                    className="w-full bg-[#76f935] hover:bg-[#5dd128] text-white font-semibold h-12"
                  >
                    {isOptingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Opting In...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Opt-in to Your Token
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-green-500 font-semibold text-sm">
                      ✅ Successfully opted in! Your token should now appear in Pera Wallet.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Algorand Opt-in Button */}
            {tokenData.network === 'algorand-testnet' && contractAddress && (
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  To receive your newly created token, you need to opt-in to the asset:
                </p>
                <Button 
                  onClick={handleOptInToAsset}
                  disabled={isOptingIn}
                  className="bg-[#76f935] hover:bg-[#5dd128] text-white font-semibold"
                >
                  {isOptingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opting In...
                    </>
                  ) : (
                    'Opt-in to Your Token'
                  )}
                </Button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className="h-12 font-semibold"
                onClick={() => setShowSuccessModal(false)}
              >
                Create Another
              </Button>
              <Button 
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white h-12 font-semibold"
                onClick={() => window.location.href = '/dashboard'}
              >
                View Dashboard
              </Button>
            </div>
            
            {tokenData.network === 'algorand-testnet' && (
              <div className="text-center pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`${ALGORAND_NETWORK_INFO.explorer}/asset/${assetId}`, '_blank')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on AlgoExplorer
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}