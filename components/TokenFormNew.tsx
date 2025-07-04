'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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

export default function TokenFormNew({ onTokenCreate, defaultNetwork = 'algorand-testnet', tokenData: externalTokenData, setTokenData: setExternalTokenData }: TokenFormProps) {
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

  // Calculate form completion progress and validation
  useEffect(() => {
    const validations = {
      name: formData.name && formData.name.trim().length >= 3,
      symbol: formData.symbol && formData.symbol.trim().length >= 2 && formData.symbol.trim().length <= 8,
      description: formData.description && formData.description.trim().length >= 10,
      totalSupply: formData.totalSupply && !isNaN(parseFloat(formData.totalSupply)) && parseFloat(formData.totalSupply) > 0
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
      {/* Progress Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm border border-red-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Create Your Token</h2>
            <p className="text-muted-foreground text-sm">Deploy your custom token with professional-grade features</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-500">{Math.round(formProgress)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${formProgress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 animate-pulse" />
        </div>
        
        {/* Field Validation Indicators */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {Object.entries(fieldValidations).map(([field, isValid]) => (
            <div key={field} className={`flex items-center space-x-2 text-xs transition-all duration-300 ${isValid ? 'text-green-500' : 'text-muted-foreground'}`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isValid ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-muted'}`} />
              <span className="capitalize">{field}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="relative overflow-hidden glass-card">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5" />
        <CardContent className="relative z-10 p-8 space-y-6">
          
          {!isDeploying && !deploymentComplete && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Network Selection */}
              <div className="space-y-2">
                <Label htmlFor="network" className="text-foreground font-medium">Network</Label>
                <select
                  id="network"
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="algorand-testnet">Algorand Testnet</option>
                  <option value="algorand-mainnet">Algorand Mainnet</option>
                  <option value="solana-devnet">Solana Devnet</option>
                </select>
              </div>

              {/* Token Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium">Token Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Awesome Token"
                  className={`transition-all duration-300 ${fieldValidations.name ? 'border-green-500 focus:border-green-500' : 'border-gray-700 focus:border-blue-500'}`}
                  required
                />
              </div>

              {/* Token Symbol */}
              <div className="space-y-2">
                <Label htmlFor="symbol" className="text-foreground font-medium">Token Symbol *</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="MAT"
                  className={`transition-all duration-300 ${fieldValidations.symbol ? 'border-green-500 focus:border-green-500' : 'border-gray-700 focus:border-blue-500'}`}
                  maxLength={8}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-foreground font-medium">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="A versatile token for my community and ecosystem"
                  className={`transition-all duration-300 ${fieldValidations.description ? 'border-green-500 focus:border-green-500' : 'border-gray-700 focus:border-blue-500'}`}
                  rows={3}
                  required
                />
              </div>

              {/* Total Supply */}
              <div className="space-y-2">
                <Label htmlFor="totalSupply" className="text-foreground font-medium">Total Supply *</Label>
                <Input
                  id="totalSupply"
                  name="totalSupply"
                  type="number"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  placeholder="1000000000"
                  min="1"
                  max="1000000000000"
                  className={`transition-all duration-300 ${fieldValidations.totalSupply ? 'border-green-500 focus:border-green-500' : 'border-gray-700 focus:border-blue-500'}`}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 1B (1,000,000,000) for utility tokens, 100M for governance tokens
                </p>
              </div>

              {/* Decimals */}
              <div className="space-y-2">
                <Label htmlFor="decimals" className="text-foreground font-medium">Decimals</Label>
                <Input
                  id="decimals"
                  name="decimals"
                  type="number"
                  value={formData.decimals}
                  onChange={handleInputChange}
                  min="0"
                  max="18"
                  className="border-gray-700 focus:border-blue-500"
                />
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label htmlFor="logoUrl" className="text-foreground font-medium">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                  className="border-gray-700 focus:border-blue-500"
                />
              </div>

              {/* Token Features */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Token Features</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mintable}
                      onChange={(e) => setFormData(prev => ({ ...prev, mintable: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-foreground">Mintable</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.burnable}
                      onChange={(e) => setFormData(prev => ({ ...prev, burnable: e.target.checked }))}
                      className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-foreground">Burnable</span>
                  </label>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.pausable}
                      onChange={(e) => setFormData(prev => ({ ...prev, pausable: e.target.checked }))}
                      className="w-4 h-4 text-yellow-600 bg-gray-800 border-gray-600 rounded focus:ring-yellow-500"
                    />
                    <span className="text-sm text-foreground">Pausable</span>
                  </label>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className={`w-full h-14 text-lg font-medium transition-all duration-300 ${
                  isFormValid 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02]' 
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
                disabled={!isFormValid}
              >
                <Rocket className="w-5 h-5 mr-3" />
                Launch Token on {network.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </Button>
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
