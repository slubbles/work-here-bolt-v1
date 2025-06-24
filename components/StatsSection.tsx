'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, Coins, DollarSign, Zap, Globe } from 'lucide-react';
import { getAlgorandPlatformStats } from '@/lib/algorand';

export default function StatsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    tokens: 0,
    users: 0,
    value: 0,
    rate: 0,
  });
  const [algorandStats, setAlgorandStats] = useState<any>(null);

  const finalStats = [
    { value: 12847, label: 'Tokens Created', icon: Coins, suffix: '', color: 'text-blue-500' },
    { value: 8392, label: 'Active Users', icon: Users, suffix: '', color: 'text-green-500' },
    { value: 2.4, label: 'Total Value', icon: DollarSign, suffix: 'M', prefix: '$', color: 'text-purple-500' },
    { value: 99.2, label: 'Success Rate', icon: TrendingUp, suffix: '%', color: 'text-red-500' },
  ];

  useEffect(() => {
    // Load Algorand stats with error handling
    const loadAlgorandStats = async () => {
      try {
        const stats = await getAlgorandPlatformStats();
        if (stats.success) {
          setAlgorandStats(stats.data);
        }
      } catch (error) {
        console.error('Failed to load Algorand stats:', error);
        // Continue with default stats if Algorand stats fail
      }
    };

    loadAlgorandStats();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          
          // Animate numbers
          const duration = 2000;
          const steps = 60;
          const stepDuration = duration / steps;
          
          let currentStep = 0;
          const timer = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            setAnimatedValues({
              tokens: Math.floor(finalStats[0].value * easeOut),
              users: Math.floor(finalStats[1].value * easeOut),
              value: parseFloat((finalStats[2].value * easeOut).toFixed(1)),
              rate: parseFloat((finalStats[3].value * easeOut).toFixed(1)),
            });
            
            if (currentStep >= steps) {
              clearInterval(timer);
            }
          }, stepDuration);
          
          return () => clearInterval(timer);
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('stats-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const formatValue = (stat: any, animatedValue: number) => {
    const prefix = stat.prefix || '';
    const suffix = stat.suffix || '';
    
    if (stat.suffix === 'M') {
      return `${prefix}${animatedValue}${suffix}`;
    }
    if (stat.suffix === '%') {
      return `${animatedValue}${suffix}`;
    }
    return `${prefix}${animatedValue.toLocaleString()}${suffix}`;
  };

  return (
    <section id="stats-section" className="py-20 app-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-red-500 font-semibold text-sm mb-6">
            <Zap className="w-4 h-4" />
            <span className="uppercase tracking-wider">Platform Stats</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            Trusted by Thousands of Creators
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join the fastest-growing multi-chain token creation platform
          </p>
        </div>

        {/* Combined Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {finalStats.map((stat, index) => {
            const animatedValue = Object.values(animatedValues)[index];
            
            return (
              <div 
                key={index} 
                className={`glass-card p-6 text-center transition-all duration-500 hover:scale-105 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="space-y-4">
                  {/* Icon */}
                  <div className={`w-12 h-12 mx-auto rounded-xl ${stat.color} bg-current/10 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  
                  {/* Value */}
                  <div className="space-y-2">
                    <div className={`text-3xl lg:text-4xl font-bold ${stat.color}`}>
                      {formatValue(stat, animatedValue)}
                    </div>
                    <div className="text-muted-foreground text-sm font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-red-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Multi-Chain Support */}
        <div className="mt-16">
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">Multi-Chain Support</h3>
              <p className="text-muted-foreground">Create tokens on multiple blockchains with one platform</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Solana */}
              <div className="text-center p-6 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-500 font-bold">S</span>
                </div>
                <h4 className="text-foreground font-semibold mb-2">Solana Network</h4>
                <p className="text-muted-foreground text-sm mb-4">Fast, low-cost token creation</p>
                <div className="text-blue-500 font-bold text-lg">
                  {animatedValues.tokens > 0 ? Math.floor(animatedValues.tokens * 0.7).toLocaleString() : '0'} tokens
                </div>
              </div>

              {/* Algorand */}
              <div className="text-center p-6 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-500 font-bold">A</span>
                </div>
                <h4 className="text-foreground font-semibold mb-2">Algorand Network</h4>
                <p className="text-muted-foreground text-sm mb-4">Ultra-low cost ASA creation</p>
                <div className="text-purple-500 font-bold text-lg">
                  {algorandStats ? algorandStats.totalTokens.toLocaleString() : '1,247'} tokens
                </div>
              </div>

              {/* Soon Network */}
              <div className="text-center p-6 bg-orange-500/10 border border-orange-500/30 rounded-xl opacity-75">
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-500 font-bold">S</span>
                </div>
                <h4 className="text-foreground font-semibold mb-2">Soon Network</h4>
                <p className="text-muted-foreground text-sm mb-4">Next-gen blockchain (Coming Soon)</p>
                <div className="text-orange-500 font-bold text-lg">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-green-500" />
              <span>Multi-Chain Platform</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Lightning Fast</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span>Growing Daily</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}