'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { createTokenOnChain } from '@/lib/solana';
import { createAlgorandToken, supabaseHelpers } from '@/lib/algorand';
import { TransactionTracker, createTokenCreationSteps, classifyError, formatErrorForUser } from '@/lib/error-handling';

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

    } catch (err) {
      console.error('Token creation error:', err);
      
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

    } finally {
      setIsDeploying(false);
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
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" size="lg">
              Deploy Token on {network.replace('-', ' ')}
            </Button>
          </form>
        )}

        {isDeploying && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Deploying Your Token</h3>
              <Progress value={deploymentProgress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">{deploymentProgress}% Complete</p>
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
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Token Deployed Successfully!</h3>
              <p className="text-sm text-gray-600">Your token is now live on the blockchain</p>
            </div>
            
            {/* Result details */}
            {result && (
              <div className="border rounded-md p-4 mt-4 text-left">
                <h4 className="font-semibold mb-2">Token Details:</h4>
                <div className="space-y-2 text-sm">
                  {result.assetId && (
                    <div className="flex justify-between">
                      <span className="font-medium">Asset ID:</span>
                      <span className="font-mono">{result.assetId}</span>
                    </div>
                  )}
                  {result.mintAddress && (
                    <div className="flex justify-between">
                      <span className="font-medium">Mint Address:</span>
                      <span className="font-mono">{result.mintAddress.substring(0, 10)}...{result.mintAddress.substring(result.mintAddress.length - 4)}</span>
                    </div>
                  )}
                  {result.tokenAddress && (
                    <div className="flex justify-between">
                      <span className="font-medium">Token Address:</span>
                      <span className="font-mono">{result.tokenAddress.substring(0, 10)}...{result.tokenAddress.substring(result.tokenAddress.length - 4)}</span>
                    </div>
                  )}
                  {result.transactionId || result.signature && (
                    <div className="flex justify-between">
                      <span className="font-medium">Transaction:</span>
                      <a 
                        href={result.details?.explorerUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        View in Explorer <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex space-x-4 mt-4">
              <Button 
                onClick={() => {
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
                }}
                variant="outline"
                className="flex-1"
              >
                Create Another Token
              </Button>
              
              {result && result.details?.explorerUrl && (
                <Button 
                  onClick={() => window.open(result.details.explorerUrl, '_blank')}
                  className="flex-1"
                >
                  View Token
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}