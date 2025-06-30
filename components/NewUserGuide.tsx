'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Coins, HelpCircle, ChevronDown, ChevronUp, CheckCircle, LightbulbIcon, AlertTriangle } from 'lucide-react';
import { Callout } from '@/components/ui/callout';

export function NewUserGuide({ type = 'token-creation' }: { type?: 'token-creation' | 'dashboard' | 'general' }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  
  // Check localStorage to see if guide has been dismissed before
  useEffect(() => {
    const guideStatus = localStorage.getItem(`guide-${type}-dismissed`);
    if (guideStatus === 'true') {
      setDismissed(true);
    }
  }, [type]);
  
  const dismissGuide = () => {
    setDismissed(true);
    localStorage.setItem(`guide-${type}-dismissed`, 'true');
  };
  
  if (dismissed) {
    return (
      <div className="mb-6 text-center">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setDismissed(false)}
          className="text-xs"
        >
          <HelpCircle className="w-3 h-3 mr-1" />
          Show Beginner Guide
        </Button>
      </div>
    );
  }
  
  const renderGuideContent = () => {
    switch(type) {
      case 'token-creation':
        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
                  New to Token Creation?
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <CardDescription>Quick guide for first-time token creators</CardDescription>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Connect Your Wallet First</p>
                      <p className="text-muted-foreground">Use the wallet button in the top right to connect either Solana or Algorand wallet.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Choose Network Carefully</p>
                      <p className="text-muted-foreground">Start with a testnet (Algorand Testnet or Solana Devnet) for your first token.</p>
                      <Callout variant="warn" className="mt-2 py-1.5 px-2.5 text-xs">
                        <p>Mainnet tokens have real value and cost real money to create!</p>
                      </Callout>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold text-xs">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Fund Your Wallet</p>
                      <p className="text-muted-foreground">Make sure you have enough funds (ALGO/SOL) to cover transaction fees.</p>
                      <p className="text-xs text-green-600 mt-0.5">Testnet tokens are free but need testnet ALGO/SOL.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold text-xs">4</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">After Creation</p>
                      <p className="text-muted-foreground">Save your token address/ID and bookmark the explorer page.</p>
                    </div>
                  </div>
                  
                  <Callout variant="tip" className="mt-2">
                    <p>Need help with tokenomics? Try our <a href="/tokenomics" className="text-green-600 underline hover:no-underline">Tokenomics Simulator</a> before creating your token.</p>
                  </Callout>
                </div>
              </CardContent>
            )}

            <CardFooter className="flex justify-between items-center pt-3 pb-3 border-t border-border/30">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(!isExpanded)} 
                  className="text-xs h-8 px-2 hover:bg-muted/50"
                >
                  {isExpanded ? "Hide Details" : "Show Details"}
                </Button>
                
                <a href="/support" className="text-xs text-blue-500 hover:underline flex items-center">
                  <HelpCircle className="w-3 h-3 mr-1" />
                  Need Help?
                </a>
              </div>
              
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={dismissGuide} 
                  className="text-xs h-8 px-3 bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/30"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Got it
                </Button>
              </div>
            </CardFooter>
          </>
        );
      
      case 'dashboard':
        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
                  Dashboard Guide
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <CardDescription>How to use your token dashboard</CardDescription>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold text-xs">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Token List</p>
                      <p className="text-muted-foreground">View all tokens owned by your connected wallet in the left panel.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold text-xs">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Token Details</p>
                      <p className="text-muted-foreground">Click any token to view its details, balance, and transaction history.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-500 font-bold text-xs">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Token Actions</p>
                      <p className="text-muted-foreground">Use the "Manage" tab to perform actions like transfers or token management.</p>
                    </div>
                  </div>
                  
                  <Callout variant="info" className="mt-2">
                    <p>New to Algorand? For ASA tokens, you need to "opt-in" before you can receive them.</p>
                  </Callout>
                </div>
              </CardContent>
            )}
            
            <CardFooter className="flex justify-between pt-0 pb-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
                {isExpanded ? "Collapse Guide" : "Expand Guide"}
              </Button>
              <Button variant="outline" size="sm" onClick={dismissGuide} className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Got it
              </Button>
            </CardFooter>
          </>
        );
        
      default:
        return (
          <>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <LightbulbIcon className="w-5 h-5 mr-2 text-yellow-500" />
                  Welcome to Snarbles!
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8 w-8 p-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              <CardDescription>Quick guide to get you started</CardDescription>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-4 text-sm">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-3 h-3 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Connect Your Wallet</p>
                      <p className="text-muted-foreground">Use the wallet button in the top navigation to connect either Solana or Algorand wallet.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Coins className="w-3 h-3 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Create a Token</p>
                      <p className="text-muted-foreground">Head to the Create page to launch your first token in under a minute.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-3 h-3 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Need Help?</p>
                      <p className="text-muted-foreground">Our Support page has guides, FAQs, and contact information.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
            
            <CardFooter className="flex justify-between pt-0 pb-2">
              <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
                {isExpanded ? "Collapse Guide" : "Expand Guide"}
              </Button>
              <Button variant="outline" size="sm" onClick={dismissGuide} className="text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Got it
              </Button>
            </CardFooter>
          </>
        );
    }
  };
  
  return (
    <Card className="mb-6 border-blue-500/20 bg-blue-500/5">
      {renderGuideContent()}
    </Card>
  );
}