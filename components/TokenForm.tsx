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
// import { useWallet } from '@solana/wallet-adapter-react'; // Temporarily removed
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

export default function TokenForm({ onTokenCreate, defaultNetwork = 'algorand-mainnet', tokenData: externalTokenData, setTokenData: setExternalTokenData }: TokenFormProps) {
  const [formData, setFormData] = useState({
    name: externalTokenData?.name || 'My Custom Token',
    symbol: externalTokenData?.symbol || 'MCT',
    description: externalTokenData?.description || 'A custom token created with Snarbles token platform',
    totalSupply: externalTokenData?.totalSupply || '1000000',
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
  const [deploymentSteps, setDeploymentSteps] = useState<any[]>([]);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [hasAppliedTokenomics, setHasAppliedTokenomics] = useState(false);
  const [tokenomicsInfo, setTokenomicsInfo] = useState<any>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Show confetti on successful deployment
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Wallet connections
  // Solana wallet (temporarily removed for re-implementation)
  const solanaConnected = false;
  const solanaPublicKey = null;
  const solanaWallet = null;
  const signTransaction = null;
  const signAllTransactions = null;
  const { 
    connected: algorandConnected,
    address: algorandAddress,
    signTransaction: algorandSignTransaction,
    selectedNetwork: algorandNetwork
  } = useAlgorandWallet();
  
  // Transaction tracker
  const [tracker, setTracker] = useState<TransactionTracker | null>(null);
  const [supabaseTracking, setSupabaseTracking] = useState(false);

  // Router and search params
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  // Initialize transaction tracker
  useEffect(() => {
    // Check if Supabase is available for tracking
    setSupabaseTracking(isSupabaseAvailable());
    
    const newTracker = new TransactionTracker((steps) => {
      setDeploymentSteps(steps);
      
      // Calculate progress based on completed steps
      const completedSteps = steps.filter(s => s.status === 'completed').length;
      const totalSteps = steps.length;
      const progress = Math.floor((completedSteps / totalSteps) * 100);
      setDeploymentProgress(progress);
      
      // Check if all steps are completed
      if (completedSteps === totalSteps) {
        setDeploymentComplete(true);
      }
    });
    setTracker(newTracker);
  }, []);

  // Check for tokenomics data from URL and localStorage on mount
  useEffect(() => {
    // Get tokenomics param from URL
    const tokenomicsParam = searchParams.get('tokenomics');
    
    if (tokenomicsParam === 'applied') {
      // Get tokenomics data from localStorage
      const savedTokenomics = localStorage.getItem('snarbles_tokenomics');
      
      if (savedTokenomics) {
        try {
          const tokenomicsData = JSON.parse(savedTokenomics);
          
          // Apply tokenomics to form
          setFormData({
            ...formData,
            name: formData.name || `${tokenomicsData.name} Token`,
            symbol: formData.symbol || tokenomicsData.name.split(' ').map((word: string) => word[0]).join('').toUpperCase(),
            totalSupply: tokenomicsData.totalSupply.toString(),
          });
          
          setTokenomicsInfo(tokenomicsData);
          setHasAppliedTokenomics(true);
          toast({ title: "Tokenomics Applied", description: "Your saved tokenomics configuration has been applied", variant: "default" });
        } catch (e) {
          console.error('Failed to parse tokenomics data', e);
        }
      }
    }
  }, [searchParams]);

  // Function to copy tokenomics details
  const copyTokenomicsDetails = () => {
    if (!tokenomicsInfo) return;
    
    const details = `
Tokenomics Summary:
- Total Supply: ${tokenomicsInfo.totalSupply.toLocaleString()}
- Distribution:
  ${Object.entries(tokenomicsInfo.distribution).map(([key, item]: [string, any]) => `  - ${item.label}: ${item.value}%`).join('\n')}
- Health Score: ${tokenomicsInfo.healthScore}%
${tokenomicsInfo.vestingSchedule?.enabled ? `- Vesting: Enabled (Team: ${tokenomicsInfo.vestingSchedule.team.period} months)` : ''}
    `.trim();
    
    navigator.clipboard.writeText(details);
    setCopySuccess('Copied!');
    
    setTimeout(() => {
      setCopySuccess(null);
    }, 2000);
    
    toast({ title: "Copied to Clipboard", description: "Tokenomics details have been copied to your clipboard", variant: "default" });
  };

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
    
    const supply = parseFloat(formData.totalSupply);
    if (isNaN(supply) || supply <= 0) {
      setError('Total supply must be a positive number');
      return;
    }
    
    const decimals = parseInt(formData.decimals);
    if (isNaN(decimals) || decimals < 0 || decimals > 18) {
      setError('Decimals must be between 0 and 18');
      return;
    }
    
    // Check wallet connection based on selected network
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

    // Set up progress animation
    progressInterval.current = setInterval(() => {
      setDeploymentProgress(prev => {
        // Don't go above 90% automatically - the final 10% will be set when complete
        return prev < 90 ? prev + 1 : prev;
      });
    }, 300);
    
    // Initialize tracker with appropriate steps
    if (tracker) {
      tracker.reset();
      createTokenCreationSteps(isAlgorand ? 'algorand' : 'solana').forEach(step => {
        tracker.addStep(step);
      });
    }

    try {
      let createResult;
      
      // Start with validation step
      if (tracker) {
        tracker.startStep('validation');
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UI
        tracker.completeStep('validation');
      }
      
      // Upload metadata step - simulated for now
      if (tracker) {
        tracker.startStep('metadata-upload');
        await new Promise(resolve => setTimeout(resolve, 800)); // Small delay for UI
        tracker.completeStep('metadata-upload');
      }
      
      // Create token on the appropriate blockchain
      if (isAlgorand) {
        if (!algorandAddress || !algorandSignTransaction) {
          throw new Error('Algorand wallet not properly connected');
        }
        
        // Create Algorand token
        createResult = await createAlgorandToken(
          algorandAddress,
          {
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description,
            decimals: parseInt(formData.decimals),
            totalSupply: formData.totalSupply,
            logoUrl: formData.logoUrl || '',
            website: '',
            github: '',
            twitter: '',
            mintable: true,
            burnable: false,
            pausable: false,
          },
          algorandSignTransaction,
          supabaseHelpers.uploadMetadataToStorage,
          algorandNetwork,
          { 
            onStepUpdate: (step, status, details) => {
              // Safely log step updates (handle potential BigInt values)
              try {
                console.log(`Step update: ${step} - ${status}`, details ? safeStringify(details) : details);
              } catch (logError) {
                console.log(`Step update: ${step} - ${status}`, { error: 'Details contain non-serializable values' });
              }
              if (tracker) {
                if (status === 'in-progress') {
                  tracker.startStep(step);
                } else if (status === 'completed') {
                  tracker.completeStep(step, details?.message);
                  if (details?.txId) {
                    tracker.addTransaction(step, details.txId, details.explorerUrl);
                  }
                } else if (status === 'failed') {
                  tracker.failStep(step, details?.error || 'Unknown error');
                }
              }
            }
          }
        );
      } else {
        if (!solanaWallet || !solanaPublicKey) {
          throw new Error('Solana wallet not properly connected');
        }
        
        // Create wallet interface for Solana token creation
        const walletInterface = {
          publicKey: solanaPublicKey!,
          signTransaction: signTransaction!,
          signAllTransactions: signAllTransactions!
        };
        
        // Create Solana token
        createResult = await createTokenOnChain(
          walletInterface,
          {
            name: formData.name,
            symbol: formData.symbol,
            description: formData.description,
            decimals: parseInt(formData.decimals),
            totalSupply: parseFloat(formData.totalSupply),
            logoUrl: formData.logoUrl || '',
            website: '',
            github: '',
            twitter: '',
            mintable: true,
            burnable: false,
            pausable: false,
          },
          {
            onStepUpdate: (step, status, details) => {
              // Safely log step updates (handle potential BigInt values)
              try {
                console.log(`Step update: ${step} - ${status}`, details ? safeStringify(details) : details);
              } catch (logError) {
                console.log(`Step update: ${step} - ${status}`, { error: 'Details contain non-serializable values' });
              }
              if (tracker) {
                if (status === 'in-progress') {
                  tracker.startStep(step);
                } else if (status === 'completed') {
                  tracker.completeStep(step, details?.message);
                  if (details?.signature) {
                    const explorerUrl = `https://explorer.solana.com/tx/${details.signature}?cluster=devnet`;
                    tracker.addTransaction(step, details.signature, explorerUrl);
                  }
                } else if (status === 'failed') {
                  tracker.failStep(step, details?.error || 'Unknown error');
                }
              }
            }
          }
        );
      }

      console.log('Token creation result:', createResult);
      
      if (createResult.success) {
        // Update progress to 100% when complete
        setDeploymentProgress(100);
        
        // Store result for UI display
        setResult(createResult);
        
        // Track token creation in Supabase if available
        if (supabaseTracking && createResult.success) {
          try {
            console.log('Tracking token creation in Supabase...');
            const walletAddress = network.includes('algorand') ? algorandAddress! : 'solana-address-placeholder';
            
            // Extract appropriate data based on blockchain
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
            
            // Track the token creation asynchronously
            trackTokenCreation(tokenDetails).then(result => {
              if (result.success) {
                console.log('Token creation tracked successfully');
              } else {
                console.warn('Token tracking failed:', result.error);
              }
            });
          } catch (trackingError) {
            // Don't let tracking errors affect the main flow
            console.error('Error tracking token creation:', trackingError);
          }
        }
        
        // Complete any remaining steps
        if (tracker) {
          const steps = tracker.getSteps();
          steps.forEach(step => {
            if (step.status === 'pending') {
              tracker.completeStep(step.id);
            }
          });
        }
        
        setDeploymentComplete(true);
        onTokenCreate?.(createResult);
      } else {
        throw new Error(createResult.error || 'Failed to create token');
      }
        
        // Show success confetti
        setShowConfetti(true);

    } catch (err) {
      console.error('Token creation error:', err);
      
      setDeploymentProgress(100); // Show completed progress even on error
      
      // Clear the interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      
      // Classify error for better user feedback
      const isAlgorand = network.startsWith('algorand');
      const classifiedError = classifyError(err, isAlgorand ? 'algorand' : 'solana');
      const userFriendlyError = formatErrorForUser(classifiedError);
      
      setError(userFriendlyError);
      
      // Update any in-progress steps to failed
      if (tracker) {
        const currentStep = tracker.getCurrentStep();
        if (currentStep) {
          tracker.failStep(currentStep.id, userFriendlyError);
        }
      }
      // Show error toast for better visibility
      toast({
        title: "Error Creating Token",
        description: userFriendlyError,
        variant: "destructive",
        duration: 6000
      });

    } finally {
      setIsDeploying(false);
      
      // Ensure interval is cleared
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }
  };

  // Sync formData with external tokenData
  useEffect(() => {
    if (setExternalTokenData && formData) {
      setExternalTokenData({
        ...formData,
        network: network
      });
    }
  }, [formData, network, setExternalTokenData]);

  // Initialize from external tokenData if provided
  useEffect(() => {
    if (externalTokenData) {
      setFormData(prev => ({
        ...prev,
        ...externalTokenData
      }));
      if (externalTokenData.network) {
        setNetwork(externalTokenData.network);
      }
    }
  }, [externalTokenData]);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const [formProgress, setFormProgress] = useState(0);
  const [isFormValid, setIsFormValid] = useState(false);
  const [fieldValidations, setFieldValidations] = useState({
    name: false,
    symbol: false,
    description: false,
    totalSupply: false
  });

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
    
    // Use safe logging for step updates
    safeLog(`Step Update - ${step}: ${status}`, details);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Progress Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Create Your Token</h2>
            <p className="text-gray-300 text-sm">Deploy your custom token with professional-grade features</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">{Math.round(formProgress)}%</div>
            <div className="text-xs text-gray-400">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${formProgress}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 animate-pulse" />
        </div>
        
        {/* Field Validation Indicators */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {Object.entries(fieldValidations).map(([field, isValid]) => (
            <div key={field} className={`flex items-center space-x-2 text-xs transition-all duration-300 ${isValid ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isValid ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-600'}`} />
              <span className="capitalize">{field}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="relative overflow-hidden border-0 bg-black/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
        <CardContent className="relative z-10 p-8 space-y-6">
          
          {/* Tokenomics Info Banner */}
          {hasAppliedTokenomics && tokenomicsInfo && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-green-400 mb-2">Tokenomics Applied</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(tokenomicsInfo.distribution).slice(0, 4).map(([key, item]: [string, any]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-300">{item.label}:</span>
                        <span className="text-green-400 font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-500/20">
                    <span className="text-xs text-gray-300">Health Score: <span className="text-green-400 font-medium">{tokenomicsInfo.healthScore}%</span></span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyTokenomicsDetails}
                      className="h-7 px-3 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
                    >
                      {copySuccess ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Clipboard className="w-3 h-3 mr-1" />
                      )}
                      {copySuccess || "Copy"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isDeploying && !deploymentComplete && (
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label htmlFor="network" className="text-base font-medium">Blockchain Network</Label>
                <Link href="/tokenomics" className="text-xs text-blue-500 hover:underline flex items-center">
                  <Calculator className="w-3 h-3 mr-1" />
                  Need tokenomics help?
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    network === 'algorand-testnet'
                      ? 'border-[#76f935]/50 bg-[#76f935]/10 shadow-md'
                      : 'border-border hover:border-[#76f935]/30 hover:bg-[#76f935]/5'
                  }`}
                  onClick={() => setNetwork('algorand-testnet')}
                >
                  <div className="w-6 h-6 rounded-full bg-[#76f935]/20 flex items-center justify-center">
                    <span className="text-[#76f935] font-bold text-xs">A</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Algorand</div>
                    <div className="text-xs text-muted-foreground">Testnet</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    network === 'solana-devnet'
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-md'
                      : 'border-border hover:border-blue-500/30 hover:bg-blue-500/5'
                  }`}
                  onClick={() => setNetwork('solana-devnet')}
                >
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-500 font-bold text-xs">S</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Solana</div>
                    <div className="text-xs text-muted-foreground">Devnet</div>
                  </div>
                </button>
                
                <button
                  type="button"
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    network === 'algorand-mainnet'
                      ? 'border-[#00d4aa]/50 bg-[#00d4aa]/10 shadow-md'
                      : 'border-border hover:border-[#00d4aa]/30 hover:bg-[#00d4aa]/5'
                  }`}
                  onClick={() => setNetwork('algorand-mainnet')}
                >
                  <div className="w-6 h-6 rounded-full bg-[#00d4aa]/20 flex items-center justify-center">
                    <span className="text-[#00d4aa] font-bold text-xs">A</span>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">Algorand</div>
                    <div className="text-xs text-muted-foreground">Mainnet</div>
                  </div>
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <span className={network === 'algorand-mainnet' ? 'text-yellow-500 font-medium' : ''}>
                  {network === 'algorand-mainnet' ? '⚠️ Mainnet tokens have real value' : 'Choose testnet/devnet for testing'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Token Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Awesome Token"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="MAT"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your token's purpose and utility..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalSupply">Total Supply</Label>
                <Input
                  className="form-input-enhanced"
                  id="totalSupply"
                  name="totalSupply"
                  type="text"
                  inputMode="numeric"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  placeholder="1000000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimals">Decimals</Label>
                <Input
                  className="form-input-enhanced"
                  id="decimals"
                  name="decimals"
                  type="text"
                  inputMode="numeric"
                  value={formData.decimals}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Recommended: 9 for Solana, 6 for Algorand
                </p>
              </div>
            </div>
            
            {/* Token Features */}
            <div className="space-y-3 p-4 border border-border/60 rounded-xl bg-muted/20">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Token Features</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Advanced features for your token</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mintable Feature */}
                <div className={`p-3 rounded-lg border flex justify-between items-center transition-all cursor-pointer ${
                  formData.mintable 
                    ? 'border-green-500/40 bg-green-500/10' 
                    : 'border-border hover:border-green-500/20 hover:bg-green-500/5'
                }`}
                  onClick={() => setFormData({...formData, mintable: !formData.mintable})}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                      <Plus className="h-4 w-4 text-green-500" />
                    </div>
                    <div>
                      <span className="font-medium block">Mintable</span>
                      <span className="text-xs text-muted-foreground">Create more tokens</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    formData.mintable ? 'bg-green-500' : 'bg-muted border border-muted-foreground/30'
                  }`}>
                    {formData.mintable && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>

                {/* Burnable Feature */}
                <div className={`p-3 rounded-lg border flex justify-between items-center transition-all cursor-pointer ${
                  formData.burnable 
                    ? 'border-red-500/40 bg-red-500/10' 
                    : 'border-border hover:border-red-500/20 hover:bg-red-500/5'
                }`}
                  onClick={() => setFormData({...formData, burnable: !formData.burnable})}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center mr-3">
                      <Flame className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <span className="font-medium block">Burnable</span>
                      <span className="text-xs text-muted-foreground">Destroy tokens</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    formData.burnable ? 'bg-red-500' : 'bg-muted border border-muted-foreground/30'
                  }`}>
                    {formData.burnable && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>

                {/* Pausable Feature */}
                <div className={`p-3 rounded-lg border flex justify-between items-center transition-all cursor-pointer ${
                  formData.pausable 
                    ? 'border-yellow-500/40 bg-yellow-500/10' 
                    : 'border-border hover:border-yellow-500/20 hover:bg-yellow-500/5'
                }`}
                  onClick={() => setFormData({...formData, pausable: !formData.pausable})}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center mr-3">
                      <Pause className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <span className="font-medium block">Pausable</span>
                      <span className="text-xs text-muted-foreground">Stop transfers</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    formData.pausable ? 'bg-yellow-500' : 'bg-muted border border-muted-foreground/30'
                  }`}>
                    {formData.pausable && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground col-span-full mt-2">
                  Select the features you want to enable for your token. These settings cannot be changed after deployment.
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website URL (Optional)</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourproject.com"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter Handle (Optional)</Label>
                <Input
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleInputChange}
                  placeholder="@yourproject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub (Optional)</Label>
                <Input
                  id="github"
                  name="github"
                  value={formData.github}
                  onChange={handleInputChange}
                  placeholder="yourproject"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div className="space-y-2">
                  <h5 className="mb-1 font-medium leading-none tracking-tight">Error Details:</h5>
                  <AlertDescription className="whitespace-pre-line">
                    <p>{error}</p>
                    {error.toLowerCase().includes('insufficient') && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <p className="text-blue-700 font-semibold">💡 How to fix:</p>
                        <p className="text-blue-600 text-sm">Make sure you have enough funds in your wallet to cover transaction fees.</p>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Go to Tokenomics Button */}
            {!hasAppliedTokenomics && !isDeploying && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3 relative overflow-hidden">
                  <Calculator className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-600">Need help with token distribution?</h3>
                    <p className="text-sm text-blue-600">Use our tokenomics simulator to design the optimal token distribution strategy for your project.</p>
                    <Link href="/tokenomics">
                      <Button variant="outline" className="mt-2 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600">
                        <Calculator className="w-4 h-4 mr-2" />
                        Design Token Distribution
                      </Button>
                      <p className="mt-2 text-xs text-blue-500">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>Learn more about token distribution strategies →</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Design your token distribution with our visual simulator</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </p>
                    </Link>
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-500/5 rounded-full"></div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className={`w-full h-14 text-lg font-medium transition-all duration-300 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-[1.02]' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isFormValid}
            >
              <Rocket className="w-5 h-5 mr-3" />
              Launch Token on {network.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              {isFormValid && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-lg" />
              )}
            </Button>
          </form>
        )}

        {isDeploying && (
          <>
            <div className="space-y-8">
            {/* Deployment Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Launching Your Token</h3>
                <p className="text-gray-300">Please wait while we deploy your token to the blockchain</p>
              </div>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative">
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${deploymentProgress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-60 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-400 mt-2">
                <span>0%</span>
                <span className="font-medium text-blue-400">{deploymentProgress}% Complete</span>
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
                        isActive ? 'text-blue-400' :
                        isCompleted ? 'text-green-400' :
                        isFailed ? 'text-red-400' :
                        'text-gray-400'
                      }`}>
                        {step.label}
                      </h4>
                      {step.details?.message && (
                        <p className="text-sm text-gray-500 mt-1">{step.details.message}</p>
                      )}
                      {step.details?.txId && (
                        <p className="text-xs text-blue-400 mt-1 font-mono">TX: {step.details.txId.slice(0, 16)}...</p>
                      )}
                    </div>
                    
                    {/* Animation Effect */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 opacity-50 animate-pulse" />
                    )}
                  </div>
                );
              })}
            </div>
              <p className="text-sm text-muted-foreground mt-2">{deploymentProgress}% Complete</p>
            </div>

            <div className="space-y-3">
              {deploymentSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <span className={`text-sm ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'in-progress' ? 'text-blue-700' :
                    step.status === 'failed' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {step.txId && (
                    <a 
                      href={step.explorerUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 flex items-center"
                    >
                      View <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                  {step.details && step.status === 'failed' && (
                    <span className="text-xs text-red-500 ml-1">({step.details})</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {deploymentComplete && (
          <div className="text-center space-y-4">
            <SuccessConfetti show={showConfetti} duration={4000} />
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce-once shadow-lg shadow-green-200">
                <Check className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-green-700 mt-2">Token Deployed Successfully!</h3>
              <p className="text-muted-foreground mt-1">Your token is now live on the blockchain</p>
            </div>
            
            {/* Result details */}
            {result && (
              <div className="border border-green-500/30 bg-green-500/5 rounded-md p-4 mt-4 text-left shadow-sm">
                <h4 className="font-semibold mb-3 flex items-center text-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Token Details:
                </h4>
                <div className="space-y-2 text-sm">
                  {result.assetId && (
                    <div className="flex flex-col sm:flex-row sm:justify-between p-2 bg-green-500/10 rounded-md">
                      <span className="font-medium text-green-800">Asset ID:</span>
                      <div className="flex items-center mt-1 sm:mt-0">
                        <span className="font-mono text-green-700">{result.assetId}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(result.assetId.toString());
                            toast({
                              title: "Copied!",
                              description: "Asset ID copied to clipboard",
                              duration: 2000
                            });
                          }}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {result.mintAddress && (
                    <div className="flex flex-col sm:flex-row sm:justify-between p-2 bg-blue-500/10 rounded-md">
                      <span className="font-medium text-blue-800">Mint Address:</span>
                      <div className="flex items-center mt-1 sm:mt-0">
                        <span className="font-mono text-blue-700">{result.mintAddress.substring(0, 6)}...{result.mintAddress.substring(result.mintAddress.length - 4)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(result.mintAddress);
                            toast({
                              title: "Copied!",
                              description: "Mint address copied to clipboard",
                              duration: 2000
                            });
                          }}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {result.tokenAddress && (
                    <div className="flex flex-col sm:flex-row sm:justify-between p-2 bg-purple-500/10 rounded-md">
                      <span className="font-medium text-purple-800">Token Address:</span>
                      <div className="flex items-center mt-1 sm:mt-0">
                        <span className="font-mono text-purple-700">{result.tokenAddress.substring(0, 6)}...{result.tokenAddress.substring(result.tokenAddress.length - 4)}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(result.tokenAddress);
                            toast({
                              title: "Copied!",
                              description: "Token address copied to clipboard",
                              duration: 2000
                            });
                          }}
                          className="ml-2 h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {(result.transactionId || result.signature) && (
                    <div className="flex flex-col sm:flex-row sm:justify-between p-2 bg-amber-500/10 rounded-md">
                      <span className="font-medium text-amber-800">Transaction:</span>
                      <a 
                        href={result.details?.explorerUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-amber-600 hover:underline flex items-center mt-1 sm:mt-0"
                      >
                        {result.transactionId ? 
                          `${result.transactionId.slice(0, 6)}...${result.transactionId.slice(-4)}` : 
                          result.signature ? 
                            `${result.signature.slice(0, 6)}...${result.signature.slice(-4)}` : 
                            'Transaction'}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                  {result.message && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-md text-blue-700 text-xs">
                      <div className="flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                        <div>{result.message}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex space-x-4 mt-4">
              <Button
                onClick={() => {
                  // Show success toast first
                  toast({
                    title: "Token Created Successfully!",
                    description: `Your ${formData.name} token is now live on the blockchain.`,
                    duration: 5000,
                  });
                  
                  // Clear form after a brief delay so user can see the success message
                  setTimeout(() => {
                    setDeploymentComplete(false);
                    setDeploymentProgress(0);
                    if (tracker) tracker.reset();
                    setResult(null);
                    setFormData({
                      name: '',
                      symbol: '',
                      description: '',
                      totalSupply: '',
                      decimals: '6',
                      logoUrl: '',
                      website: '',
                      twitter: '',
                      github: '',
                      mintable: true,
                      burnable: false,
                      pausable: false,
                    });
                  }, 500);
                }}
                variant="outline"
                className="flex-1 border-green-500/30 text-green-700 hover:bg-green-500/10"
              >
                Create Another Token
              </Button>
              
              {result && result.details?.explorerUrl && (
                <Button
                  onClick={() => window.open(result.details.explorerUrl, '_blank')}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Explorer
                </Button>
              )}
            </div>
          </div>
        )}
        
        {/* Optional tracking information */}
        {supabaseTracking && (
          <div className="text-center text-xs text-muted-foreground mt-3">
            <p>Token creations are tracked for your convenience.</p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}