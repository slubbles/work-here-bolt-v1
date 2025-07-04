'use client';

import { useState, useEffect } from 'react';
import TokenForm from '@/components/TokenFormNew';
import TokenPreview from '@/components/TokenPreviewNew';
import { CheckCircle, Zap, AlertTriangle, Wallet, Clock, Shield, TrendingUp, ChevronRight, Sparkles, Rocket, HelpCircle, Minus, Plus } from 'lucide-react';
import { Callout } from '@/components/ui/callout';
import { Button } from '@/components/ui/button';
import { NetworkBadge } from '@/components/GuideBadge';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

export default function CreateTokenPage() {
  const [tokenData, setTokenData] = useState({
    name: 'My Awesome Token',
    symbol: 'MAT',
    description: 'A versatile token for my community and ecosystem',
    totalSupply: '1000000000', // Default to 1 billion
    decimals: '9', // Smart default: 9 decimals (recommended)
    logoUrl: '',
    website: '',
    github: '',
    twitter: '',
    mintable: true,
    burnable: false, 
    pausable: false,
    network: 'algorand-testnet', 
  });
  
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null);
  const { connected: solanaConnected } = useWallet();
  const { connected: algorandConnected } = useAlgorandWallet();
  
  useEffect(() => {
    setMounted(true);
    // Animate entrance
    const timer = setTimeout(() => {
      setCurrentStep(1);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Check if any wallet is connected
  const isAnyWalletConnected = solanaConnected || algorandConnected;

  // Simplified: Always show wallet connection if no wallet is connected
  const needsWalletConnection = !isAnyWalletConnected;

  // Visual cues data
  const visualCues = [
    {
      icon: Rocket,
      title: 'Lightning Fast',
      description: 'Deploy in under 60 seconds',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: Shield,
      title: 'Battle Tested',
      description: 'Secure smart contracts',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: TrendingUp,
      title: 'Zero Code',
      description: 'No technical skills needed',
      color: 'from-blue-500 to-blue-600'
    }
  ];
  
  return (
    <div className="min-h-screen app-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-full blur-3xl transition-all duration-1000 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        <div className={`absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        <div className={`absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl transition-all duration-1000 delay-500 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section with Visual Cues */}
        <div className={`text-center mb-10 space-y-4 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-red-500 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="uppercase tracking-wider">Token Creation Platform</span>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground">
            Create Your Token <span className="text-red-500">Instantly</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Design and deploy professional cryptocurrency tokens in minutes. 
            <span className="text-red-500 font-medium"> No coding skills required.</span>
          </p>

          {/* Visual Cues Row */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8 transition-all duration-1000 delay-300 ${currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {visualCues.map((cue, index) => {
              const Icon = cue.icon;
              return (
                <div key={index} className={`group relative overflow-hidden rounded-xl glass-card p-6 transition-all duration-300 hover:scale-105`}>
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${cue.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <h3 className="font-semibold text-foreground">{cue.title}</h3>
                    <p className="text-sm text-muted-foreground">{cue.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Network Selection */}
          <div className={`transition-all duration-1000 delay-500 ${currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex justify-center gap-3 flex-wrap">
              <NetworkBadge network="algorand-testnet" />
              <NetworkBadge network="algorand-mainnet" />
              <NetworkBadge network="solana-devnet" />
            </div>
          </div>
        </div>
        
        {/* Wallet Connection Status */}
        {needsWalletConnection && (
          <div className={`mb-8 transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="relative overflow-hidden rounded-xl glass-card border border-yellow-500/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-500 mb-1">Wallet Connection Required</h3>
                    <p className="text-muted-foreground text-sm">Connect your wallet to continue with token creation</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all duration-300" 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Connect Wallet
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Success Tips */}
        {isAnyWalletConnected && (
          <div className={`mb-8 transition-all duration-500 delay-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-green-500 mb-2">Wallet Connected - Ready to Deploy!</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-muted-foreground">Fill token details</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-muted-foreground">Preview in real-time</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-muted-foreground">Deploy instantly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-16 transition-all duration-1000 delay-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="order-2 xl:order-1 xl:col-span-7 xl:pr-4">
            <TokenForm tokenData={tokenData} setTokenData={setTokenData} />
          </div>
          <div className="order-1 xl:order-2 xl:col-span-5 xl:pl-4">
            <TokenPreview tokenData={tokenData} />
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 py-16 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Snarbles?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create professional tokens with enterprise-grade features in minutes, not hours
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Lightning Fast */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600 mb-4">Deploy in under 60 seconds</p>
              <p className="text-sm text-gray-500">
                Our optimized smart contracts and streamlined process get your token live faster than any other platform
              </p>
            </div>

            {/* Battle Tested */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Battle Tested</h3>
              <p className="text-gray-600 mb-4">Secure smart contracts</p>
              <p className="text-sm text-gray-500">
                Audited contracts used by thousands of projects. Your tokens are protected by industry-leading security
              </p>
            </div>

            {/* Zero Code */}
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Zero Code</h3>
              <p className="text-gray-600 mb-4">No technical skills needed</p>
              <p className="text-sm text-gray-500">
                Simple form-based interface. If you can fill out a form, you can create a professional token
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 py-16 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about creating tokens on Snarbles
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                question: "What functionalities does the create token page have?",
                answer: "The create token page provides comprehensive token creation with: 1) Token Metadata (name, symbol, description, logo), 2) Supply Management (total supply, decimals, mintable/burnable options), 3) Security Features (pausable tokens, ownership controls), 4) Multi-blockchain Support (Solana Devnet, Algorand Mainnet/Testnet), 5) Real-time Preview (see your token before deployment), 6) Social Integration (website, Twitter, GitHub links), 7) Advanced Features (tokenomics integration, vesting schedules), 8) One-click Deployment with gas fee estimation."
              },
              {
                question: "How fast is the token creation process?",
                answer: "Token creation typically takes under 60 seconds from start to finish. Simply fill out the form with your token details, preview your token in real-time, and click deploy. The blockchain processing usually completes within 30-45 seconds depending on network conditions."
              },
              {
                question: "What blockchain networks are supported?",
                answer: "Currently, we support Solana Devnet for testing and development, plus Algorand Mainnet and Testnet for production deployments. Each network has its own advantages - Solana for speed and low costs, Algorand for sustainability and instant finality."
              },
              {
                question: "Do I need coding experience to create a token?",
                answer: "No coding experience required! Our intuitive form-based interface guides you through every step. Simply enter your token details like name, symbol, and supply, and we handle all the technical complexity behind the scenes."
              },
              {
                question: "Are the smart contracts secure?",
                answer: "Yes! Our smart contracts are battle-tested and have been used to deploy thousands of tokens. They follow industry best practices for security, are regularly audited, and include features like pausability and controlled minting for added protection."
              },
              {
                question: "Can I modify my token after creation?",
                answer: "This depends on the features you enable during creation. If you enable 'Mintable', you can create more tokens later. If you enable 'Burnable', token holders can destroy their tokens. 'Pausable' tokens can be temporarily stopped by the owner. Choose these features carefully during creation."
              },
              {
                question: "What are the costs involved?",
                answer: "You only pay blockchain network fees (gas fees) for deploying your token. These vary by network but are typically very low - usually just a few cents to a few dollars. There are no platform fees from Snarbles for token creation."
              },
              {
                question: "How do I integrate tokenomics?",
                answer: "After creating your token, you can use our Tokenomics Simulator to design distribution models, vesting schedules, and economic parameters. The simulator helps you plan token allocation across team, investors, community, and other stakeholders with professional-grade modeling tools."
              }
            ].map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden hover:border-red-300 transition-colors"
              >
                <button
                  onClick={() => setOpenFaqItem(openFaqItem === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-red-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openFaqItem === index ? (
                    <Minus className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <Plus className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                </button>
                {openFaqItem === index && (
                  <div className="px-6 pb-4 bg-red-50 border-t border-red-100">
                    <p className="text-gray-700 leading-relaxed pt-4">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}