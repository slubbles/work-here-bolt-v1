'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, Settings, Globe, Github, Twitter, Plus, Flame, Pause, Upload, Info, Check, Rocket, Users, TrendingUp, Loader2, CheckCircle, Network, Sparkles, Zap, ArrowRight, Wallet, ChevronDown, ChevronUp, AlertTriangle, Shield, Star, Clock, DollarSign, ImageIcon, X } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, ALGORAND_NETWORK_INFO, checkWalletConnection } from '@/lib/algorand';

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
  const [progress, setProgress] = useState(0);
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [error, setError] = useState('');
  const [showSocialLinks, setShowSocialLinks] = useState(false);
  const [algorandWalletStatus, setAlgorandWalletStatus] = useState<any>(null);

  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleInputChange = (field: string, value: string | boolean) => {
    setTokenData((prev: any) => ({
      ...prev,
      [field]: field === 'totalSupply' ? value.toString() : value,
    }));
  };

  const toggleFeature = (feature: string) => {
    setTokenData((prev: any) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  // Handle image file selection
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
      
      setUploadedImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // For now, we'll set a placeholder URL until we implement proper upload
      // In a real implementation, you would upload to Supabase Storage or similar
      setTokenData((prev: any) => ({
        ...prev,
        logoUrl: previewUrl // This is temporary - would be replaced with actual uploaded URL
      }));
      
      setError(''); // Clear any previous errors
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview('');
    setTokenData((prev: any) => ({
      ...prev,
      logoUrl: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          logoUrl: tokenData.logoUrl,
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
          totalSupply: parseFloat(tokenData.totalSupply),
          logoUrl: tokenData.logoUrl,
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
          },
          algorandSignTransaction
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
        setContractAddress(result.tokenAddress || result.assetId?.toString() || 'demo_' + Math.random().toString(36).substr(2, 9));
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

  const currentNetworkInfo = getNetworkInfo(tokenData.network);
  const isCorrectWalletConnected = 
    (currentNetworkInfo.requiresWallet === 'solana' && solanaConnected) ||
    (currentNetworkInfo.requiresWallet === 'algorand' && algorandConnected);

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
                  type="text"
                  placeholder="1000000000000"
                  value={tokenData.totalSupply}
                  onChange={(e) => {
                    // Only allow numeric input
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    handleInputChange('totalSupply', value);
                  }}
                  className="input-enhanced h-14 text-lg rounded-xl border-2"
                />
                <p className="text-sm text-muted-foreground">
                  How many tokens will exist in total (supports very large numbers)
                </p>
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

          {/* Social Links */}
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
                {/* Logo Upload Section */}
                <div className="space-y-4">
                  <Label className="text-foreground font-medium text-lg">Token Logo</Label>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Token logo preview"
                        className="w-24 h-24 rounded-xl object-cover border-2 border-border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Upload Options */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* File Upload */}
                    <div className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-border text-foreground hover:bg-muted h-12"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadedImage ? 'Change Image' : 'Upload Image'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        Max 5MB • JPG, PNG, GIF, WebP
                      </p>
                    </div>
                    
                    {/* URL Input Alternative */}
                    <div className="flex-1">
                      <div className="space-y-2">
                        <Label htmlFor="logoUrl" className="text-foreground font-medium text-sm">Or paste URL</Label>
                        <Input
                          id="logoUrl"
                          placeholder="https://example.com/logo.png"
                          value={uploadedImage ? '' : tokenData.logoUrl}
                          onChange={(e) => {
                            if (!uploadedImage) {
                              handleInputChange('logoUrl', e.target.value);
                            }
                          }}
                          disabled={!!uploadedImage}
                          className="input-enhanced rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {uploadedImage && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-600 text-sm font-medium flex items-center">
                        <Info className="w-4 h-4 mr-2" />
                        Image ready for deployment
                      </p>
                      <p className="text-blue-500 text-xs mt-1">
                        File: {uploadedImage.name} ({(uploadedImage.size / 1024).toFixed(1)} KB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Other Social Links */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="space-y-4">
                    <Label className="text-foreground font-medium">Community Links</Label>
                    <Input
                      placeholder="Discord, Telegram, etc."
                      className="input-enhanced rounded-xl"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">More social links coming soon</p>
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

      {/* Success Modal */}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}