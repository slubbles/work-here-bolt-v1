'use client';

import { useState, useEffect } from 'react';
import TokenForm from '@/components/TokenFormNew';
import TokenPreview from '@/components/TokenPreviewNew';
import { CheckCircle, Zap, AlertTriangle, Wallet, Clock, Shield, TrendingUp, ChevronRight, Sparkles, Rocket, HelpCircle, Minus, Plus, Star, Users, BarChart3, Lock, Coins, Network } from 'lucide-react';
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
    network: 'algorand-mainnet', // Default to mainnet for production 
  });
  
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(0); // Open first item by default
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

  // Enhanced visual cues with more modern design
  const visualCues = [
    {
      icon: Rocket,
      title: 'Lightning Fast',
      description: 'Deploy in under 60 seconds',
      color: 'from-red-500 to-red-600',
      feature: 'Speed'
    },
    {
      icon: Shield,
      title: 'Battle Tested',
      description: 'Audited smart contracts',
      color: 'from-green-500 to-emerald-500',
      feature: 'Security'
    },
    {
      icon: Star,
      title: 'Professional Grade',
      description: 'Enterprise-ready features',
      color: 'from-blue-500 to-blue-600',
      feature: 'Quality'
    }
  ];

  // Enhanced features for "Why Choose Snarbles" section
  const platformFeatures = [
    {
      icon: Zap,
      title: 'Instant Deployment',
      description: 'Deploy professional tokens in under 60 seconds with our optimized smart contracts.',
      stats: '< 60sec',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Audited contracts protecting over $50M in token value with zero security incidents.',
      stats: '$50M+ Protected',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Users,
      title: 'Trusted by Thousands',
      description: 'Join 10,000+ creators who have launched successful tokens on our platform.',
      stats: '10,000+ Tokens',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Coins,
      title: 'Multi-Chain Support',
      description: 'Deploy on Algorand and Solana with more blockchains coming soon.',
      stats: '2+ Networks',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Real-time tracking, tokenomics modeling, and performance insights.',
      stats: 'Real-time',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Lock,
      title: 'Complete Control',
      description: 'Retain full ownership with optional advanced features like pausing and burning.',
      stats: '100% Ownership',
      color: 'from-cyan-500 to-cyan-600'
    }
  ];
  
  return (
    <div className="min-h-screen app-background relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-full blur-3xl transition-all duration-1000 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        <div className={`absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        <div className={`absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-3xl transition-all duration-1000 delay-500 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
        <div className={`absolute top-1/2 right-1/4 w-36 h-36 bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-full blur-3xl transition-all duration-1000 delay-700 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Modern Hero Section */}
        <div className={`text-center mb-12 space-y-6 transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-full px-6 py-3 text-red-500 font-semibold text-sm">
            <Sparkles className="w-5 h-5" />
            <span className="uppercase tracking-wider">Professional Token Creation</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Create Professional <br />
            <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              Tokens Instantly
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Design and deploy enterprise-grade cryptocurrency tokens in minutes. 
            <span className="text-red-500 font-medium"> No coding, no complexity</span> – just professional results.
          </p>

          {/* Enhanced Visual Cues Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-12 transition-all duration-1000 delay-300 ${currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {visualCues.map((cue, index) => {
              const Icon = cue.icon;
              return (
                <div key={index} className={`group relative overflow-hidden rounded-2xl glass-card p-8 transition-all duration-300 hover:scale-105 border-l-4 border-red-500/50`}>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${cue.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{cue.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{cue.description}</p>
                      <div className="mt-3 text-xs font-semibold text-red-500 uppercase tracking-wider">{cue.feature}</div>
                    </div>
                  </div>
                  {/* Hover glow effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cue.color} opacity-0 group-hover:opacity-10 transition-all duration-300`} />
                </div>
              );
            })}
          </div>

          {/* Network Selection with enhanced styling */}
          <div className={`transition-all duration-1000 delay-500 ${currentStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="flex flex-col items-center space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Choose Your Network</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                <NetworkBadge network="algorand-mainnet" />
                <NetworkBadge network="algorand-testnet" />
                <NetworkBadge network="solana-devnet" />
              </div>
            </div>
          </div>
        </div>
        {/* Wallet Connection Status - Simplified per requirements */}
        {needsWalletConnection && (
          <div className={`mb-8 transition-all duration-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="relative overflow-hidden rounded-2xl glass-card border border-yellow-500/20 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4 text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-500 mb-2">Wallet Required</h3>
                    <p className="text-muted-foreground">Connect your wallet to start creating professional tokens</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Status */}
        {isAnyWalletConnected && (
          <div className={`mb-8 transition-all duration-500 delay-700 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 p-8">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold text-green-500 mb-3">Ready to Launch!</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center justify-center md:justify-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-muted-foreground">Fill token details</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-muted-foreground">Preview in real-time</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-muted-foreground">Deploy instantly</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Main Content Grid with better mobile optimization */}
        <div className={`grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 xl:gap-16 transition-all duration-1000 delay-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="order-2 xl:order-1 xl:col-span-7 xl:pr-6">
            <TokenForm tokenData={tokenData} setTokenData={setTokenData} />
          </div>
          <div className="order-1 xl:order-2 xl:col-span-5 xl:pl-6">
            <TokenPreview tokenData={tokenData} />
          </div>
        </div>

        {/* Enhanced "Why Choose Snarbles?" Section */}
        <div className="mt-24 py-20 border-t border-border">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-full px-6 py-3 text-red-500 font-semibold text-sm mb-6">
              <Star className="w-5 h-5" />
              <span className="uppercase tracking-wider">Why Choose Snarbles</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              The Professional Choice for 
              <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent"> Token Creation</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join thousands of successful projects that trust Snarbles for enterprise-grade token deployment
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group relative overflow-hidden rounded-2xl glass-card p-8 transition-all duration-300 hover:scale-105 border-l-4 border-red-500/50">
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`} />
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="text-center space-y-4">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-red-500 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      
                      <div className="text-2xl font-bold text-red-500">
                        {feature.stats}
                      </div>
                      
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced "How It Works" Section with gradient background */}
        <div className="mt-24 py-20 border-t border-border relative overflow-hidden">
          {/* Gradient background overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5 border border-blue-500/10 rounded-3xl" />
          <div className="relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 rounded-full px-6 py-3 text-red-500 font-semibold text-sm mb-6">
                <HelpCircle className="w-5 h-5" />
                <span className="uppercase tracking-wider">How It Works</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Simple Steps to 
                <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent"> Professional Tokens</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Your complete guide to creating and deploying tokens on Snarbles
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {[
                {
                  icon: Sparkles,
                  question: "What makes Snarbles different from other token platforms?",
                  answer: "Snarbles combines enterprise-grade security with consumer-friendly simplicity. Our audited smart contracts have protected over $50M in token value with zero security incidents. We offer real-time preview, multi-chain support, and deployment in under 60 seconds - faster than any competitor.",
                  defaultOpen: true
                },
                {
                  icon: Zap,
                  question: "How fast is the token creation process?",
                  answer: "Token creation typically takes under 60 seconds from start to finish. Simply fill out the form with your token details, preview your token in real-time, and click deploy. The blockchain processing usually completes within 30-45 seconds depending on network conditions. No waiting, no complexity.",
                  defaultOpen: true
                },
                {
                  icon: Network,
                  question: "What blockchain networks are supported?",
                  answer: "Currently supporting Algorand Mainnet and Testnet for production and testing, plus Solana Devnet for development. Algorand offers ultra-low costs (~$0.001) and instant finality, while Solana provides high throughput and developer-friendly tools. More networks coming soon.",
                  defaultOpen: false
                },
                {
                  icon: Users,
                  question: "Do I need coding experience to create a token?",
                  answer: "Absolutely not! Our no-code platform is designed for everyone. Simply enter your token details like name, symbol, and supply. Our interface guides you through every step with smart defaults and helpful tips. If you can fill out a form, you can create a professional token.",
                  defaultOpen: true
                },
                {
                  icon: Shield,
                  question: "Are the smart contracts secure and audited?",
                  answer: "Yes! Our smart contracts are battle-tested and professionally audited. They follow industry best practices and have been used to deploy over 10,000 tokens. Features include optional pausability, controlled minting, and burn mechanisms for complete security and control.",
                  defaultOpen: false
                },
                {
                  icon: Clock,
                  question: "Can I modify my token after creation?",
                  answer: "This depends on the features you enable during creation. Enable 'Mintable' to create more tokens later, 'Burnable' to allow token destruction, or 'Pausable' for emergency stops. Choose these features carefully during creation as they define your token's capabilities.",
                  defaultOpen: false
                },
                {
                  icon: Coins,
                  question: "What are the costs involved?",
                  answer: "You only pay blockchain network fees (gas fees) for deploying your token. Algorand costs ~$0.001, Solana Devnet is free for testing. There are no platform fees, no hidden costs, no subscription fees. We believe in transparent, affordable token creation.",
                  defaultOpen: false
                },
                {
                  icon: TrendingUp,
                  question: "How do I integrate advanced tokenomics?",
                  answer: "After creating your token, use our Tokenomics Simulator to design distribution models, vesting schedules, and economic parameters. Plan allocation across team, investors, community, and treasury with professional-grade modeling tools and real-time analysis.",
                  defaultOpen: false
                }
              ].map((faq, index) => {
                const Icon = faq.icon;
                const isOpen = openFaqItem === index || (faq.defaultOpen && openFaqItem === null);
                
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl glass-card border border-border hover:border-red-500/30 transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenFaqItem(openFaqItem === index ? null : index)}
                      className="w-full p-6 md:p-8 text-left flex items-center justify-between hover:bg-red-500/5 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4 pr-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-green-500 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-semibold text-white">{faq.question}</span>
                      </div>
                      <div className="flex-shrink-0">
                        {isOpen ? (
                          <Minus className="w-7 h-7 text-red-500 transition-all duration-300 rotate-0 group-hover:scale-110" />
                        ) : (
                          <Plus className="w-7 h-7 text-red-500 transition-all duration-300 rotate-0 group-hover:rotate-90 group-hover:scale-110" />
                        )}
                      </div>
                    </button>
                    
                    {isOpen && (
                      <div className="px-6 md:px-8 pb-6 md:pb-8 bg-gradient-to-r from-red-500/5 to-green-500/5 border-t border-red-500/10">
                        <div className="pt-4">
                          <p className="text-gray-300 leading-relaxed text-base">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}