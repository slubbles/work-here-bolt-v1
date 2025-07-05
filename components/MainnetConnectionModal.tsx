'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, ExternalLink, Smartphone, Settings, Wifi } from 'lucide-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

interface MainnetConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MainnetConnectionModal({ isOpen, onClose }: MainnetConnectionModalProps) {
  const { connect, selectedNetwork, setSelectedNetwork } = useAlgorandWallet();
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: 'Check Pera Wallet Network',
      icon: Smartphone,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            First, ensure your Pera Wallet is set to the correct network:
          </p>
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Open Pera Wallet App</p>
                <p className="text-sm text-muted-foreground">On your phone or browser extension</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Go to Settings → Network</p>
                <p className="text-sm text-muted-foreground">Look for network selection option</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Select "Mainnet"</p>
                <p className="text-sm text-muted-foreground">Not Testnet or Betanet</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Clear Browser Conflicts',
      icon: Settings,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Clear any wallet conflicts that might be causing connection issues:
          </p>
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Refresh this page</p>
                <p className="text-sm text-muted-foreground">Press F5 or Ctrl+R (Cmd+R on Mac)</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Close other DApp tabs</p>
                <p className="text-sm text-muted-foreground">Other crypto sites might conflict</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Disconnect other wallets</p>
                <p className="text-sm text-muted-foreground">Like MetaMask or Phantom if connected</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Connect to Mainnet',
      icon: Wifi,
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Now try connecting to Algorand Mainnet:
          </p>
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-500">Ready to Connect</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your Snarbles platform is set to Algorand Mainnet. Click the button below to connect your Pera Wallet.
            </p>
            <Button 
              onClick={async () => {
                try {
                  await connect();
                  onClose();
                } catch (error) {
                  console.error('Connection failed:', error);
                }
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Connect to Algorand Mainnet
            </Button>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps.find(step => step.id === currentStep) || steps[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span>Mainnet Connection Guide</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-bold">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 ml-2 ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div className="min-h-[300px]">
            <div className="flex items-center space-x-3 mb-4">
              <currentStepData.icon className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
            </div>
            {currentStepData.content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <div className="flex space-x-2">
              {currentStep < steps.length ? (
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                >
                  Next Step
                </Button>
              ) : (
                <Button onClick={onClose} variant="outline">
                  Done
                </Button>
              )}
            </div>
          </div>

          {/* Help Links */}
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Need more help?</p>
            <div className="flex space-x-4">
              <a 
                href="https://perawallet.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center space-x-1"
              >
                <span>Pera Wallet Guide</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://algorand.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline flex items-center space-x-1"
              >
                <span>Algorand Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
