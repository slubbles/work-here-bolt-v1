'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Check, AlertCircle, Loader2, ExternalLink, Clipboard, CheckCircle, Calculator, Copy, HelpCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, supabaseHelpers } from '@/lib/algorand';
import { SuccessConfetti } from '@/components/SuccessConfetti';
import { TransactionTracker, createTokenCreationSteps, classifyError, formatErrorForUser } from '@/lib/error-handling';
import Link from 'next/link';

interface TokenFormProps {
  onTokenCreate?: (result: any) => void;
  defaultNetwork?: string;
}

export default function TokenForm({ onTokenCreate, defaultNetwork = 'algorand-testnet' }: TokenFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    totalSupply: '',
    decimals: '6',
    logoUrl: '',
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
  const { connected: solanaConnected, publicKey: solanaPublicKey, wallet: solanaWallet } = useWallet();
  const { 
    connected: algorandConnected,
    address: algorandAddress,
    signTransaction: algorandSignTransaction,
    selectedNetwork: algorandNetwork
  } = useAlgorandWallet();
  
  // Transaction tracker
  const [tracker, setTracker] = useState<TransactionTracker | null>(null);

  // Router and search params
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  // Initialize transaction tracker
  useEffect(() => {
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
              console.log(`Step update: ${step} - ${status}`, details);
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
        
        // Create Solana token
        createResult = await createTokenOnChain(
          solanaWallet,
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
              console.log(`Step update: ${step} - ${status}`, details);
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Token</CardTitle>
        <CardDescription>
          Deploy your custom token on Solana with just a few clicks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tokenomics Info Banner */}
        {hasAppliedTokenomics && tokenomicsInfo && (
          <Alert className="mt-6 border-green-500/30 bg-green-500/5">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-600 font-semibold">Tokenomics Applied</AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              <div className="space-y-1 mt-2">
                <p>Supply of <span className="font-semibold">{tokenomicsInfo.totalSupply.toLocaleString()}</span> tokens with custom distribution:</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  {Object.entries(tokenomicsInfo.distribution).map(([key, item]: [string, any]) => (
                    <li key={key} className="flex items-center justify-between text-xs">
                      <span>{item.label}:</span> 
                      <span className="font-medium">{item.value}%</span>
                    </li>
                  ))}
                </ul>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-green-500/20">
                  <span className="text-xs">Health Score: {tokenomicsInfo.healthScore}%</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={copyTokenomicsDetails}
                    className="h-8 px-2 text-xs border-green-500/30 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                  >
                    {copySuccess ? (
                      <Check className="w-3 h-3 mr-1" />
                    ) : (
                      <Clipboard className="w-3 h-3 mr-1" />
                    )}
                    {copySuccess || "Copy Details"}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isDeploying && !deploymentComplete && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="network">Blockchain Network</Label>
              <select 
                id="network"
                className="w-full p-2 border rounded-md"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
              >
                <option value="algorand-testnet">Algorand Testnet</option>
                <option value="algorand-mainnet">Algorand Mainnet</option>
                <option value="solana-devnet">Solana Devnet</option>
              </select>
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
                  id="totalSupply"
                  name="totalSupply"
                  type="number"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  placeholder="1000000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decimals">Decimals</Label>
                <Input
                  id="decimals"
                  name="decimals"
                  type="number"
                  value={formData.decimals}
                  onChange={handleInputChange}
                  min="0"
                  max="18"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <AlertDescription className="whitespace-pre-line">
                  <div className="space-y-2">
                    <p className="font-semibold">Error Details:</p>
                    <p>{error}</p>
                    {error.toLowerCase().includes('insufficient') && (
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded">
                        <p className="text-blue-700 font-semibold">💡 How to fix:</p>
                        <p className="text-blue-600 text-sm">Make sure you have enough funds in your wallet to cover transaction fees.</p>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Go to Tokenomics Button */}
            {!hasAppliedTokenomics && !isDeploying && (
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Calculator className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-blue-600">Need help with token distribution?</h3>
                    <p className="text-sm text-blue-600">Use our tokenomics simulator to design the optimal token distribution strategy for your project.</p>
                    <Link href="/tokenomics">
                      <Button variant="outline" className="mt-2 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 text-blue-600">
                        <Calculator className="w-4 h-4 mr-2" />
                        Open Tokenomics Simulator
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg">
              Deploy Token on {network.replace('-', ' ')}
            </Button>
          </form>
        )}

        {isDeploying && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-3 text-foreground">Deploying Your Token</h3>
              <Progress value={deploymentProgress} className="w-full h-3 bg-muted/50" />
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
          </div>
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
                    variant: "success"
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
      </CardContent>
    </Card>
  );
}