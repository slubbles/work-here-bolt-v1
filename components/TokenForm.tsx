'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface TokenFormProps {
  onTokenCreate?: (tokenData: any) => void;
}

export default function TokenForm({ onTokenCreate }: TokenFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    totalSupply: '',
    decimals: '6'
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentSteps, setDeploymentSteps] = useState<{step: string, status: 'pending' | 'processing' | 'complete' | 'error', error?: string}[]>([]);
  const [deploymentComplete, setDeploymentComplete] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsDeploying(true);
    setDeploymentProgress(0);
    setDeploymentComplete(false);

    // Initialize deployment steps
    setDeploymentSteps([
      { step: 'Validating token parameters', status: 'complete' },
      { step: 'Preparing transaction', status: 'processing' },
      { step: 'Awaiting wallet confirmation', status: 'pending' },
      { step: 'Broadcasting transaction', status: 'pending' },
      { step: 'Confirming on blockchain', status: 'pending' }
    ]);

    try {
      // Simulate deployment process
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDeploymentProgress((i + 1) * 20);
        
        setDeploymentSteps(prev => prev.map((step, index) => {
          if (index === i) return { ...step, status: 'complete' };
          if (index === i + 1) return { ...step, status: 'processing' };
          return step;
        }));
      }

      setDeploymentComplete(true);
      onTokenCreate?.(formData);
    } catch (err) {
      setError('Failed to deploy token. Please try again.');
      setDeploymentSteps(prev => prev.map(step => 
        step.status === 'processing' ? { ...step, status: 'error' } : step
      ));
    } finally {
      setIsDeploying(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
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
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" size="lg">
              Deploy Token
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
                  {getStepIcon(step.status)}
                  <span className={`text-sm ${
                    step.status === 'complete' ? 'text-green-700' :
                    step.status === 'processing' ? 'text-blue-700' :
                    step.status === 'error' ? 'text-red-700' :
                    'text-gray-500'
                  }`}>
                    {step.step}
                  </span>
                  {step.error && (
                    <span className="text-xs text-red-500">({step.error})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {deploymentComplete && (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Token Deployed Successfully!</h3>
              <p className="text-sm text-gray-600">Your token is now live on the Solana blockchain</p>
            </div>
            <Button 
              onClick={() => {
                setDeploymentComplete(false);
                setDeploymentProgress(0);
                setDeploymentSteps([]);
                setFormData({
                  name: '',
                  symbol: '',
                  description: '',
                  totalSupply: '',
                  decimals: '6'
                });
              }}
              variant="outline"
            >
              Create Another Token
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}