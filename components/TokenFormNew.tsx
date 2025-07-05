'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Check, AlertCircle, Loader2, ExternalLink, Clipboard, CheckCircle, Calculator, Copy, HelpCircle, Plus, Flame, Pause, Rocket } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWallet } from '@solana/wallet-adapter-react';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { trackTokenCreation } from '@/lib/token-tracking';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, supabaseHelpers } from '@/lib/algorand';
import { SuccessConfetti } from '@/components/SuccessConfetti';
import { TransactionTracker, createTokenCreationSteps, classifyError, formatErrorForUser } from '@/lib/error-handling';
import { safeStringify, safeLog } from '@/lib/utils';
import Link from 'next/link';

interface TokenFormProps {
  onTokenCreate?: (result: any) => void;
  defaultNetwork?: string;
  tokenData?: any;
  setTokenData?: (data: any) => void;
}

export default function TokenFormNew({ onTokenCreate, defaultNetwork = 'algorand-mainnet', tokenData: externalTokenData, setTokenData: setExternalTokenData }: TokenFormProps) {
  const [formData, setFormData] = useState({
    name: externalTokenData?.name || 'My Custom Token',
    symbol: externalTokenData?.symbol || 'MCT',
    description: externalTokenData?.description || 'A custom token created with Snarbles token platform',
    totalSupply: externalTokenData?.totalSupply || '1000000000', // Default to 1 billion
    decimals: externalTokenData?.decimals || '9',
    logoUrl: externalTokenData?.logoUrl || '',
    website: externalTokenData?.website || '',
    twitter: externalTokenData?.twitter || '',
    github: externalTokenData?.github || '',
    mintable: externalTokenData?.mintable ?? true,
    burnable: externalTokenData?.burnable ?? false,
    pausable: externalTokenData?.pausable ?? false,
  });
  
  const [network, setNetwork] = useState<string>(defaultNetwork);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Progress tracking states
  const [formProgress, setFormProgress] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);
  const [fieldValidations, setFieldValidations] = useState({
    name: false,
    symbol: false,
    description: false,
    totalSupply: false
  });

  const [deploymentSteps, setDeploymentSteps] = useState([
    { id: 'wallet-approval', label: 'Wallet Approval', status: 'pending', icon: 'wallet', details: null as any },
    { id: 'transaction-broadcast', label: 'Broadcasting Transaction', status: 'pending', icon: 'broadcast', details: null as any },
    { id: 'confirmation', label: 'Network Confirmation', status: 'pending', icon: 'confirmation', details: null as any },
    { id: 'asset-verification', label: 'Asset Verification', status: 'pending', icon: 'verification', details: null as any }
  ]);

  // Wallet states
  const { connected: solanaConnected, publicKey: solanaPublicKey, signTransaction: signSolanaTransaction } = useWallet();
  const { connected: algorandConnected, address: algorandAddress, signTransaction: signAlgorandTransaction } = useAlgorandWallet();

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // Calculate form completion progress and validation with enhanced supply validation
  useEffect(() => {
    const validations = {
      name: formData.name && formData.name.trim().length >= 3,
      symbol: formData.symbol && formData.symbol.trim().length >= 2 && formData.symbol.trim().length <= 8,
      description: formData.description && formData.description.trim().length >= 10,
      totalSupply: formData.totalSupply && !isNaN(parseFloat(formData.totalSupply)) && parseFloat(formData.totalSupply) > 0 && parseFloat(formData.totalSupply) <= 1000000000000 // Max 1 trillion
    };
    
    setFieldValidations(validations);
    
    const completedFields = Object.values(validations).filter(Boolean).length;
    const totalFields = Object.keys(validations).length;
    const progress = (completedFields / totalFields) * 100;
    
    setFormProgress(progress);
    setIsFormValid(progress === 100);
  }, [formData]);

  // Enhanced step update handler with animations
  const onStepUpdate = (step: string, status: string, details?: any) => {
    setDeploymentSteps(prev => prev.map(s => {
      if (s.id === step) {
        return { ...s, status, details, timestamp: Date.now() };
      }
      return s;
    }));
    
    // Calculate overall progress
    const completedSteps = deploymentSteps.filter(s => s.status === 'completed').length;
    const totalSteps = deploymentSteps.length;
    const progress = Math.round((completedSteps / totalSteps) * 100);
    setDeploymentProgress(progress);
    
    // Use safe logging for step updates
    safeLog(`Step Update - ${step}: ${status}`, details);
  };

  // Update external token data when form changes
  useEffect(() => {
    if (setExternalTokenData) {
      setExternalTokenData({
        ...formData,
        network
      });
    }
  }, [formData, network, setExternalTokenData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.symbol || !formData.totalSupply) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Check wallet connection
    const isAlgorand = network.startsWith('algorand');
    if ((isAlgorand && !algorandConnected) || (!isAlgorand && !solanaConnected)) {
      setError(`Please connect your ${isAlgorand ? 'Algorand' : 'Solana'} wallet first`);
      return;
    }
    
    // Reset states
    setError('');
    setIsDeploying(true);
    setDeploymentProgress(0);
    setDeploymentComplete(false);
    setResult(null);
    
    try {
      let createResult;
      
      if (isAlgorand) {
        // Algorand token creation
        createResult = await createAlgorandToken(
          algorandAddress!,
          {
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description,
            decimals: parseInt(formData.decimals),
            totalSupply: formData.totalSupply,
            logoUrl: formData.logoUrl,
            website: formData.website,
            github: formData.github,
            twitter: formData.twitter,
            mintable: formData.mintable,
            burnable: formData.burnable,
            pausable: formData.pausable,
          },
          signAlgorandTransaction!,
          supabaseHelpers.uploadMetadataToStorage,
          network,
          { onStepUpdate }
        );
      } else {
        // Solana token creation - need to create a wallet interface
        const walletInterface = {
          publicKey: solanaPublicKey!,
          signTransaction: signSolanaTransaction!
        };
        
        createResult = await createTokenOnChain(
          walletInterface as any,
          {
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description,
            decimals: parseInt(formData.decimals),
            totalSupply: parseInt(formData.totalSupply),
            logoUrl: formData.logoUrl,
            website: formData.website,
            github: formData.github,
            twitter: formData.twitter,
            mintable: formData.mintable,
            burnable: formData.burnable,
            pausable: formData.pausable,
          },
          { onStepUpdate }
        );
      }
      
      if (createResult.success) {
        setResult(createResult);
        setDeploymentComplete(true);
        setShowConfetti(true);
        
        // Track successful creation
        if (isSupabaseAvailable()) {
          try {
            const walletAddress = isAlgorand ? algorandAddress! : solanaPublicKey!.toString();
            const tokenDetails = {
              tokenName: formData.name,
              tokenSymbol: formData.symbol,
              network: network,
              contractAddress: isAlgorand 
                ? (createResult as any).assetId?.toString() || (createResult as any).transactionId || ''
                : (createResult as any).mintAddress || (createResult as any).tokenAddress || '',
              description: formData.description,
              totalSupply: formData.totalSupply,
              decimals: parseInt(formData.decimals),
              logoUrl: formData.logoUrl,
              website: formData.website || '',
              github: formData.github || '',
              twitter: formData.twitter || '',
              mintable: formData.mintable,
              burnable: formData.burnable,
              pausable: formData.pausable,
              transactionHash: isAlgorand 
                ? (createResult as any).transactionId || ''
                : (createResult as any).signature || '',
              walletAddress
            };
            
            trackTokenCreation(tokenDetails);
          } catch (trackingError) {
            console.error('Error tracking token creation:', trackingError);
          }
        }
        
        if (onTokenCreate) {
          onTokenCreate(createResult);
        }
        
        toast({
          title: "Token Created Successfully!",
          description: `Your token "${formData.name}" is now live on ${network}`,
          variant: "default",
        });
      } else {
        throw new Error(createResult.error || 'Token creation failed');
      }
    } catch (error) {
      console.error('Token creation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create token');
      setIsDeploying(false);
      
      toast({
        title: "Token Creation Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Enhanced Progress Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 p-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-foreground mb-2">Create Your Token</h2>
            <p className="text-muted-foreground">Deploy your custom token with professional-grade features</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{Math.round(formProgress)}%</div>
            <div className="text-sm text-muted-foreground">Complete</div>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-red-600 to-green-500 rounded-full transition-all duration-700 ease-out shadow-lg"
            style={{ width: `${formProgress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 animate-pulse" />
        </div>
        
        {/* Enhanced Field Validation Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Object.entries(fieldValidations).map(([field, isValid]) => (
            <div key={field} className={`flex items-center space-x-3 text-sm transition-all duration-300 ${isValid ? 'text-green-500' : 'text-muted-foreground'}`}>
              <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isValid ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-muted border-2 border-muted-foreground'}`} />
              <span className="capitalize font-medium">{field === 'totalSupply' ? 'Supply' : field}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Main Form Card */}
      <Card className="relative overflow-hidden glass-card border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5" />
        <CardContent className="relative z-10 p-10 space-y-10">
          
          {!isDeploying && !deploymentComplete && (
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Network Selection - Enhanced */}
              <div className="space-y-6">
                <Label htmlFor="network" className="text-foreground font-semibold text-xl flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                  <span>Deployment Network</span>
                </Label>
                <select
                  id="network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full p-5 rounded-xl bg-card border border-border text-foreground focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 font-medium text-lg"
                >
                  <option value="algorand-testnet">Algorand Testnet (Free Testing)</option>
                  <option value="algorand-mainnet">Algorand Mainnet (~$0.001)</option>
                  <option value="solana-devnet">Solana Devnet (Free Testing)</option>
                </select>
              </div>

              {/* Token Basics Section */}
              <div className="space-y-8">
                <div className="flex items-center space-x-2 pb-2 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Token Information</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-transparent" />
                </div>

                {/* Token Name */}
                <div className="space-y-4">
                  <Label htmlFor="name" className="text-foreground font-semibold text-lg flex items-center space-x-3">
                    <span className="relative">
                      Token Name 
                      <span className="text-red-500 font-bold text-xl ml-1">*</span>
                    </span>
                    {fieldValidations.name && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. My Awesome Token"
                    className={`h-14 text-xl transition-all duration-300 ${fieldValidations.name ? 'border-green-500 focus:border-green-500 shadow-lg shadow-green-500/20' : 'border-border focus:border-red-500 shadow-lg shadow-red-500/20'}`}
                    required
                  />
                  <p className="text-sm text-muted-foreground">The full name of your token (3+ characters)</p>
                </div>

                {/* Token Symbol */}
                <div className="space-y-4">
                  <Label htmlFor="symbol" className="text-foreground font-semibold text-lg flex items-center space-x-3">
                    <span className="relative">
                      Token Symbol 
                      <span className="text-red-500 font-bold text-xl ml-1">*</span>
                    </span>
                    {fieldValidations.symbol && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </Label>
                  <Input
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    placeholder="e.g. MAT"
                    className={`h-14 text-xl font-mono transition-all duration-300 ${fieldValidations.symbol ? 'border-green-500 focus:border-green-500 shadow-lg shadow-green-500/20' : 'border-border focus:border-red-500 shadow-lg shadow-red-500/20'}`}
                    maxLength={8}
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Short identifier (2-8 characters, e.g. BTC, ETH)</p>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <Label htmlFor="description" className="text-foreground font-semibold text-lg flex items-center space-x-3">
                    <span className="relative">
                      Description 
                      <span className="text-red-500 font-bold text-xl ml-1">*</span>
                    </span>
                    {fieldValidations.description && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g. A versatile token for my community and ecosystem"
                    className={`min-h-28 text-xl transition-all duration-300 ${fieldValidations.description ? 'border-green-500 focus:border-green-500 shadow-lg shadow-green-500/20' : 'border-border focus:border-red-500 shadow-lg shadow-red-500/20'}`}
                    rows={3}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Brief description of your token's purpose (10+ characters)</p>
                </div>
              </div>

              {/* Token Economics Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Token Economics</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent" />
                </div>

                {/* Enhanced Total Supply */}
                <div className="space-y-4">
                  <Label htmlFor="totalSupply" className="text-foreground font-semibold text-lg flex items-center space-x-3">
                    <span className="relative">
                      Total Supply 
                      <span className="text-red-500 font-bold text-xl ml-1">*</span>
                    </span>
                    {fieldValidations.totalSupply && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </Label>
                  <div className="relative">
                    <Input
                      id="totalSupply"
                      name="totalSupply"
                      type="number"
                      value={formData.totalSupply}
                      onChange={handleInputChange}
                      placeholder="1000000000"
                      min="1"
                      max="1000000000000"
                      step="1"
                      className={`h-14 text-xl pr-24 transition-all duration-300 ${fieldValidations.totalSupply ? 'border-green-500 focus:border-green-500 shadow-lg shadow-green-500/20' : 'border-border focus:border-red-500 shadow-lg shadow-red-500/20'}`}
                      required
                    />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-base text-muted-foreground font-medium">
                      {formData.totalSupply && parseFloat(formData.totalSupply) >= 1000000000 
                        ? `${(parseFloat(formData.totalSupply) / 1000000000).toFixed(1)}B` 
                        : formData.totalSupply && parseFloat(formData.totalSupply) >= 1000000
                        ? `${(parseFloat(formData.totalSupply) / 1000000).toFixed(1)}M`
                        : 'tokens'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: '1M', value: '1000000' },
                      { label: '100M', value: '100000000' },
                      { label: '1B', value: '1000000000' },
                      { label: '1T', value: '1000000000000' }
                    ].map((preset) => (
                      <Button
                        key={preset.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => setFormData(prev => ({ ...prev, totalSupply: preset.value }))}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum: 1 trillion tokens. Popular choices: 1B for utility, 100M for governance
                  </p>
                </div>

                {/* Decimals */}
                <div className="space-y-3">
                  <Label htmlFor="decimals" className="text-foreground font-medium">Decimal Places</Label>
                  <Input
                    id="decimals"
                    name="decimals"
                    type="number"
                    value={formData.decimals}
                    onChange={handleInputChange}
                    min="0"
                    max="18"
                    className="h-12 border-border focus:border-blue-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 9 decimals (like SOL) or 18 decimals (like ETH)
                  </p>
                </div>
              </div>

              {/* Social Links Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Links & Branding</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
                </div>

                {/* Logo URL */}
                <div className="space-y-3">
                  <Label htmlFor="logoUrl" className="text-foreground font-medium">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    value={formData.logoUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                    className="h-12 border-border focus:border-blue-500"
                  />
                  <p className="text-xs text-muted-foreground">
                    Square image (512x512px recommended). Supports PNG, JPG, SVG
                  </p>
                </div>

                {/* Social Links Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-foreground font-medium">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://example.com"
                      className="h-12 border-border focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="twitter" className="text-foreground font-medium">Twitter</Label>
                    <Input
                      id="twitter"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      placeholder="@username"
                      className="h-12 border-border focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="github" className="text-foreground font-medium">GitHub</Label>
                    <Input
                      id="github"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="username/repo"
                      className="h-12 border-border focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Token Features */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-border">
                  <h3 className="text-lg font-semibold text-foreground">Advanced Features</h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent" />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-green-500/30 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${formData.mintable ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted/50'}`}>
                              <Plus className={`w-6 h-6 ${formData.mintable ? 'text-green-500' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">Mintable</h4>
                              <p className="text-sm text-muted-foreground">Allow creating more tokens later</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.mintable}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, mintable: checked }))}
                          />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>If enabled, you can mint additional tokens after deployment</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-red-500/30 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${formData.burnable ? 'bg-red-500/20 border border-red-500/30' : 'bg-muted/50'}`}>
                              <Flame className={`w-6 h-6 ${formData.burnable ? 'text-red-500' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">Burnable</h4>
                              <p className="text-sm text-muted-foreground">Allow token holders to destroy tokens</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.burnable}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, burnable: checked }))}
                          />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>If enabled, token holders can permanently destroy their tokens</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-yellow-500/30 transition-all duration-300 cursor-pointer">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${formData.pausable ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-muted/50'}`}>
                              <Pause className={`w-6 h-6 ${formData.pausable ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-foreground">Pausable</h4>
                              <p className="text-sm text-muted-foreground">Emergency stop functionality</p>
                            </div>
                          </div>
                          <Switch
                            checked={formData.pausable}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pausable: checked }))}
                          />
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>If enabled, you can pause all token transfers in emergencies</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-lg">Deployment Error</AlertTitle>
                  <AlertDescription className="text-base">{error}</AlertDescription>
                </Alert>
              )}

              {/* Enhanced Deploy Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className={`w-full h-16 text-xl font-bold transition-all duration-300 relative overflow-hidden ${
                    isFormValid 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 hover:scale-[1.02] border-0' 
                      : 'bg-muted text-muted-foreground cursor-not-allowed border-border'
                  }`}
                  disabled={!isFormValid}
                >
                  {isFormValid && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  )}
                  <div className="relative z-10 flex items-center justify-center space-x-3">
                    <Rocket className="w-6 h-6" />
                    <span>Deploy Token on {network.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                  </div>
                </Button>
                
                {!isFormValid && (
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    Complete all required fields to enable deployment
                  </p>
                )}
              </div>
            </form>
          )}

          {isDeploying && (
            <div className="space-y-8">
              {/* Deployment Header */}
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <Rocket className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Launching Your Token</h3>
                  <p className="text-muted-foreground">Please wait while we deploy your token to the blockchain</p>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="relative">
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-red-600 to-green-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${deploymentProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60 animate-pulse" />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>0%</span>
                  <span className="font-medium text-red-500">{deploymentProgress}% Complete</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Deployment Steps */}
              <div className="space-y-4">
                {deploymentSteps.map((step, index) => {
                  const isActive = step.status === 'in-progress';
                  const isCompleted = step.status === 'completed';
                  const isFailed = step.status === 'failed';
                  
                  return (
                    <div key={step.id} className={`relative flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                      isActive ? 'bg-blue-500/10 border border-blue-500/30 scale-105' :
                      isCompleted ? 'bg-green-500/10 border border-green-500/30' :
                      isFailed ? 'bg-red-500/10 border border-red-500/30' :
                      'bg-gray-800/50 border border-gray-700'
                    }`}>
                      {/* Step Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive ? 'bg-blue-500 animate-pulse' :
                        isCompleted ? 'bg-green-500' :
                        isFailed ? 'bg-red-500' :
                        'bg-gray-600'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : isFailed ? (
                          <AlertCircle className="w-5 h-5 text-white" />
                        ) : isActive ? (
                          <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-400 rounded-full" />
                        )}
                      </div>
                      
                      {/* Step Content */}
                      <div className="flex-1">
                        <h4 className={`font-medium transition-colors duration-300 ${
                          isActive ? 'text-red-500' :
                          isCompleted ? 'text-green-500' :
                          isFailed ? 'text-red-500' :
                          'text-muted-foreground'
                        }`}>
                          {step.label}
                        </h4>
                        {step.details?.message && (
                          <p className="text-sm text-muted-foreground mt-1">{step.details.message}</p>
                        )}
                        {step.details?.txId && (
                          <p className="text-xs text-red-500 mt-1 font-mono">TX: {step.details.txId.slice(0, 16)}...</p>
                        )}
                      </div>
                      
                      {/* Animation Effect */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/20 to-red-500/0 opacity-50 animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {deploymentComplete && result && (
            <div className="text-center space-y-6">
              <SuccessConfetti show={showConfetti} duration={4000} />
              
              {/* Success Icon */}
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center animate-bounce-once shadow-lg shadow-green-500/30">
                <Check className="w-10 h-10 text-white" />
              </div>
              
              {/* Success Message */}
              <div>
                <h3 className="text-2xl font-bold text-green-400 mb-2">Token Deployed Successfully!</h3>
                <p className="text-muted-foreground">Your token is now live on the blockchain</p>
              </div>
              
              {/* Result Details */}
              <div className="border border-green-500/30 bg-green-500/10 rounded-xl p-6 text-left">
                <h4 className="font-semibold mb-4 flex items-center text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Token Details
                </h4>
                <div className="space-y-3 text-sm">
                  {result.assetId && (
                    <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg">
                      <span className="font-medium text-green-300">Asset ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-green-400">{result.assetId}</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => navigator.clipboard.writeText(result.assetId.toString())}
                          className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {result.transactionId && (
                    <div className="flex justify-between items-center p-3 bg-green-500/5 rounded-lg">
                      <span className="font-medium text-green-300">Transaction ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-green-400">{result.transactionId.slice(0, 16)}...</span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => navigator.clipboard.writeText(result.transactionId)}
                          className="h-6 w-6 p-0 text-green-400 hover:text-green-300"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {result.details?.explorerUrl && (
                    <Button 
                      asChild
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                    >
                      <a href={result.details.explorerUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Next Steps */}
              <div className="text-center">
                <Button 
                  onClick={() => router.push('/dashboard')}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
