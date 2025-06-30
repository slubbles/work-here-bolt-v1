'use client';

import { Coins, Settings, BarChart3, Shield, Wallet, Users, Headphones, Code, Zap, Globe, Lock, Rocket } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: Coins,
      title: 'Instant Token Creation',
      description: 'Deploy custom tokens in under 30 seconds with our intuitive no-code builder—no technical expertise needed.',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      icon: Settings,
      title: 'Advanced Management',
      description: 'Precisely control supply, permissions and distribution with enterprise-grade token management tools.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Track holder growth, transaction patterns, and market dynamics with comprehensive real-time analytics.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Military-grade security with automated auditing, verification badges, and tamper-proof records.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      icon: Wallet,
      title: 'Universal Compatibility',
      description: 'True cross-chain interoperability with Solana, Algorand, and future networks—all major wallets supported.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      icon: Users,
      title: 'Community Building',
      description: 'Comprehensive governance, distribution, and engagement tools to foster vibrant token ecosystems.',
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Sub-second transactions and deployments powered by our proprietary Layer-2 optimization technology.',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      icon: Code,
      title: 'Zero Coding Required',
      description: 'Leverage advanced tokenomics and complex distribution models with absolutely no programming required.',
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const section = document.getElementById('features-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features-section" className="py-20 app-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-red-500 font-semibold text-sm">
            <Rocket className="w-4 h-4" />
            <span className="uppercase tracking-wider">Platform Features</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight">
            Everything You Need to{' '}
            <span className="gradient-text">Succeed</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From ideation to thriving ecosystem, we provide the complete toolkit for token success.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`glass-card p-6 text-center transition-all duration-500 group relative overflow-hidden cursor-pointer border ${feature.borderColor} ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
              onMouseEnter={() => setHoveredFeature(index)}
              onMouseLeave={() => setHoveredFeature(null)}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 ${feature.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className={`w-16 h-16 mx-auto mb-6 p-4 rounded-xl ${feature.bgColor} ${feature.color} transition-all duration-300 group-hover:scale-110 relative`}>
                  <feature.icon className="w-full h-full" />
                  {hoveredFeature === index && (
                    <div className="absolute inset-0 rounded-xl border-2 border-current opacity-50 animate-ping"></div>
                  )}
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-current transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Hover border effect */}
              <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-current/20 transition-colors duration-300"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="glass-card p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Experience These Features?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of creators who've already discovered the power of Snarbles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                  Start Creating Now
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="border border-border text-foreground hover:bg-muted px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}