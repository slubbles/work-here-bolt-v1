'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  CreditCard, 
  Check, 
  Zap, 
  Crown, 
  Star,
  Loader2,
  X
} from 'lucide-react';
import { useCredits } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

interface CreditsPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditsPurchaseModal({ isOpen, onClose }: CreditsPurchaseModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { creditBalance, addCredits } = useCredits();
  const { toast } = useToast();

  const creditPackages = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 10,
      price: 9.99,
      popular: false,
      features: [
        '10 token creations',
        'Basic features included',
        'Email support'
      ]
    },
    {
      id: 'popular',
      name: 'Popular Pack',
      credits: 25,
      price: 19.99,
      popular: true,
      features: [
        '25 token creations',
        'All advanced features',
        'Priority support',
        '20% bonus credits'
      ]
    },
    {
      id: 'power',
      name: 'Power User',
      credits: 50,
      price: 34.99,
      popular: false,
      features: [
        '50 token creations',
        'All advanced features',
        'Dedicated support',
        '30% bonus credits'
      ]
    }
  ];

  const handlePurchase = async (packageId: string) => {
    setSelectedPlan(packageId);
    setIsProcessing(true);

    try {
      const selectedPackage = creditPackages.find(p => p.id === packageId);
      if (!selectedPackage) return;

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add credits to user account
      const result = await addCredits(
        selectedPackage.credits,
        `Credit purchase: ${selectedPackage.name}`,
        `payment_${Date.now()}`
      );

      if (result.success) {
        toast({
          title: "✅ Purchase Successful!",
          description: `${selectedPackage.credits} credits have been added to your account`,
          duration: 5000,
        });
        onClose();
      } else {
        throw new Error('Failed to add credits');
      }
    } catch (error) {
      toast({
        title: "❌ Purchase Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span>Purchase Credits</span>
          </DialogTitle>
          <DialogDescription>
            Choose a credit package to continue creating tokens and accessing advanced features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Balance */}
          <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Current Balance</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{creditBalance} Credits</div>
          </div>

          {/* Credit Packages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`relative cursor-pointer transition-all ${
                  pkg.popular 
                    ? 'border-red-500/50 bg-red-500/5 ring-2 ring-red-500/20' 
                    : 'border-border hover:border-red-500/30'
                } ${selectedPlan === pkg.id ? 'ring-2 ring-red-500/50' : ''}`}
                onClick={() => !isProcessing && setSelectedPlan(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-red-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="flex items-center justify-center space-x-2">
                    {pkg.id === 'starter' && <Zap className="w-5 h-5 text-blue-500" />}
                    {pkg.id === 'popular' && <Crown className="w-5 h-5 text-red-500" />}
                    {pkg.id === 'power' && <Star className="w-5 h-5 text-purple-500" />}
                    <span>{pkg.name}</span>
                  </CardTitle>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-foreground">${pkg.price}</div>
                    <div className="flex items-center justify-center space-x-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-lg font-semibold text-yellow-600">{pkg.credits} Credits</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ${(pkg.price / pkg.credits).toFixed(2)} per credit
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isProcessing}
                    className={`w-full ${
                      pkg.popular 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {isProcessing && selectedPlan === pkg.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Secure payment processing • No monthly fees • Credits never expire</p>
            <p className="mt-1">Cancel anytime • 30-day money-back guarantee</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}