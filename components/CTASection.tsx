import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle, Clock, DollarSign, Shield } from 'lucide-react';
import Link from 'next/link';

export default function CTASection() {
  const benefits = [
    { icon: Clock, text: 'Launch in under 30 seconds' },
    { icon: DollarSign, text: 'Minimal deployment costs' },
    { icon: Shield, text: 'Enterprise-grade security' },
    { icon: CheckCircle, text: 'No technical knowledge required' }
  ];

  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-red-500 font-medium text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="uppercase tracking-wide">Start Today</span>
              </div>
              <h2 className="text-4xl font-bold text-[#fefde0]">
                Your Token Vision Deserves to Become Reality
              </h2>
            </div>
            <p className="text-xl text-gray-400 leading-relaxed tracking-tight">
              Stop waiting for the "perfect moment." Thousands of visionaries have already transformed their concepts into thriving digital economies. Your opportunity is now.
            </p>
            
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <benefit.icon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span className="text-gray-400">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <p className="text-sm text-gray-500 mb-4">
                Join 10,000+ creators who chose Snarbles
              </p>
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 border-2 border-black flex items-center justify-center text-[#fefde0] text-xs font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Success Story with improved light mode visibility */}
          <div className="glass-card p-8" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-sm text-gray-500 uppercase tracking-wide font-medium mb-4">
                  Success Story
                </div>
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 mx-auto mb-4 flex items-center justify-center text-[#fefde0] font-bold text-xl">
                  CM
                </div>
                <h3 className="text-xl font-bold text-[#fefde0] mb-2">CommunityToken</h3>
                <p className="text-gray-300 text-sm mb-6">
                  "Launched our community token in 30 seconds. Now we have 5,000+ holders and growing!"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#fefde0]">5,000+</div>
                  <div className="text-xs text-gray-500">Token Holders</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#fefde0]">$50K</div>
                  <div className="text-xs text-gray-500">Weekly Volume</div>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-gray-800">
                <p className="text-xs text-gray-600">
                  Launched with Snarbles • 89 days ago
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}