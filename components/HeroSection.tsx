'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Play, TrendingUp, Users, Zap, Sparkles, Rocket, Star, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStat, setCurrentStat] = useState(0);

  const liveStats = [
    { label: 'Tokens Created', value: '12,847', icon: Rocket },
    { label: 'Active Users', value: '8,392', icon: Users },
    { label: 'Total Value', value: '$2.4M', icon: TrendingUp },
    { label: 'Success Rate', value: '99.2%', icon: Star },
  ];

  useEffect(() => {
    setIsVisible(true);
    
    // Rotate stats every 3 seconds
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % liveStats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section min-h-screen flex items-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center space-x-3 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 text-red-500 font-semibold text-sm backdrop-blur-sm">
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <span className="uppercase tracking-wider">Launch Your Vision</span>
              <Sparkles className="w-4 h-4" />
            </div>
            
            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="block text-foreground">Turn Your Idea</span>
                <span className="block">Into a{' '}
                  <span className="gradient-text relative">
                    Real Token
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 to-red-600/20 blur-lg -z-10"></div>
                  </span>
                </span>
                <span className="block text-foreground">in 30 Seconds</span>
              </h1>
            </div>
            
            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
              Join thousands of creators who've already launched successful tokens. 
              <span className="text-foreground font-semibold"> No coding, no complexity</span>—just your vision brought to life.
            </p>

            {/* Social Proof */}
            <div className="flex items-center space-x-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-background flex items-center justify-center text-white text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground text-xs">
                  +8K
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-foreground font-semibold">8,392</span> creators trust Snarbles
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href="/create">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 text-lg font-semibold w-full sm:w-auto shadow-xl hover:shadow-2xl group rounded-xl button-enhanced transform hover:scale-105 transition-all duration-300"
                >
                  <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Create Your Token Now
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-border text-foreground hover:bg-muted px-8 py-4 text-lg font-semibold backdrop-blur-sm rounded-xl w-full sm:w-auto transform hover:scale-105 transition-all duration-300"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">No coding required</span>
              </div>
              <div className="flex items-center space-x-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Deploy in 30 seconds</span>
              </div>
            </div>
          </div>

          {/* Right Content - Enhanced Preview */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="glass-card p-8 max-w-md mx-auto relative overflow-hidden">
              {/* Live Stats Ticker */}
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span>🔥 LIVE</span>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const IconComponent = liveStats[currentStat].icon;
                      return <IconComponent className="w-3 h-3" />;
                    })()}
                    <span>{liveStats[currentStat].label}: {liveStats[currentStat].value}</span>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-6 relative z-10 pt-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">Live Preview</div>
                  <div className="flex items-center space-x-2 text-green-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium">Ready</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-foreground">Your Token</h3>
                
                <div className="flex justify-center relative">
                  <div className="token-preview-circle relative">
                    YOU
                    <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping"></div>
                  </div>
                </div>

                {/* Feature Showcase */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors">
                      Transfer
                    </Button>
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors">
                      Mint
                    </Button>
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors">
                      Burn
                    </Button>
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors">
                      Analytics
                    </Button>
                  </div>
                </div>

                {/* Status */}
                <div className="pt-6 border-t border-border">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="flex items-center space-x-2 text-green-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-semibold">Ready to launch</p>
                    </div>
                    <div className="text-muted-foreground text-sm">• 30 seconds</div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-500/20 rounded-full animate-bounce delay-500"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-red-600/20 rounded-full animate-bounce delay-1000"></div>
            </div>

            {/* Floating testimonial */}
            <div className="absolute -bottom-8 -left-8 glass-card p-4 max-w-xs hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">"Created my token in 25 seconds!"</p>
                  <p className="text-xs font-semibold text-foreground">- Alex, Founder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}