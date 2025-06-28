import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Globe, Shield, Code, Users, Clock, Rocket, Heart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AboutPage() {
  return (
    <div className="min-h-screen app-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 tracking-tight">About Snarbles</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're building the future of token creation and management—one block at a time.
          </p>
        </div>
        
        {/* Our Mission */}
        <div className="glass-card p-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-red-500/10 text-red-500 w-fit px-3 py-1.5 rounded-full font-semibold text-sm">
                Our Mission
              </div>
              <h2 className="text-3xl font-bold text-foreground">Democratizing Token Creation</h2>
              <p className="text-muted-foreground leading-relaxed">
                We believe that creating and managing tokens should be accessible to everyone—not just 
                developers or those with technical expertise. By removing barriers to entry, we're 
                empowering a new wave of creators, communities, and businesses to participate fully 
                in the blockchain economy.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="mr-3 mt-1"><Check className="w-5 h-5 text-green-500" /></div>
                  <p className="text-foreground">Making blockchain technology accessible to everyone</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-1"><Check className="w-5 h-5 text-green-500" /></div>
                  <p className="text-foreground">Empowering communities to create their own economies</p>
                </div>
                <div className="flex items-start">
                  <div className="mr-3 mt-1"><Check className="w-5 h-5 text-green-500" /></div>
                  <p className="text-foreground">Simplifying complex blockchain operations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 p-8 rounded-xl border border-red-500/20">
              <h3 className="text-xl font-bold text-foreground mb-6">Why We Started Snarbles</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  In 2023, our founding team saw that despite the explosion in blockchain adoption, creating tokens remained a complex, technical, and often expensive process.
                </p>
                <p>
                  Communities and creators with brilliant ideas were being held back by technical barriers, while developers were charging thousands for basic token deployments.
                </p>
                <p>
                  We built Snarbles to solve this problem, making token creation as simple as creating a social media account—but with the full power of blockchain technology.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Our Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-card hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-500" />
                </div>
                <CardTitle>Security First</CardTitle>
                <CardDescription>
                  We never compromise on security and prioritize protecting user assets above all else
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Rigorous smart contract testing</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Regular security audits</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Decentralized architecture</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle>Radical Simplicity</CardTitle>
                <CardDescription>
                  We believe powerful technology should be simple to use and accessible to everyone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>No-code interface for complex operations</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Clear, jargon-free guidance</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Instant deployment without technical knowledge</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="glass-card hover:scale-105 transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <CardTitle>Community Focused</CardTitle>
                <CardDescription>
                  We build for and with our community, ensuring their needs drive our roadmap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Community-driven feature prioritization</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Open feedback channels</span>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-2 mt-1"><Check className="w-4 h-4 text-green-500" /></div>
                    <span>Regular community events and education</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Our Technology */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Technology</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powered by cutting-edge blockchain solutions
            </p>
          </div>
          
          <div className="glass-card p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">Multi-Chain Architecture</h3>
                <p className="text-muted-foreground">
                  Our platform is built on a flexible multi-chain foundation that currently supports Solana and Algorand, 
                  with more blockchains coming soon. This allows creators to choose the network that best suits their 
                  project's needs—whether it's Solana's speed, Algorand's low costs, or our upcoming SOON Network integration.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-500 font-bold">S</span>
                    </div>
                    <div>
                      <p className="font-semibold">Solana</p>
                      <p className="text-sm text-muted-foreground">High-speed, low fees</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-[#76f935]/20 flex items-center justify-center">
                      <span className="text-[#76f935] font-bold">A</span>
                    </div>
                    <div>
                      <p className="font-semibold">Algorand</p>
                      <p className="text-sm text-muted-foreground">Carbon-negative, secure</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-500 font-bold">S</span>
                    </div>
                    <div>
                      <p className="font-semibold">SOON Network</p>
                      <p className="text-sm text-muted-foreground">Coming Q3 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-muted/30 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="text-purple-500 font-bold">+</span>
                    </div>
                    <div>
                      <p className="font-semibold">More Chains</p>
                      <p className="text-sm text-muted-foreground">Expanding ecosystem</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-foreground">Security & Compliance</h3>
                <p className="text-muted-foreground">
                  Security is at the core of everything we build. Our platform uses:
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-500" /></div>
                    <div>
                      <span className="font-medium text-foreground">Enterprise-grade Smart Contracts</span>
                      <p className="text-sm">Audited, battle-tested, and continuously monitored</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-500" /></div>
                    <div>
                      <span className="font-medium text-foreground">Non-custodial Architecture</span>
                      <p className="text-sm">We never hold your tokens or private keys</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-500" /></div>
                    <div>
                      <span className="font-medium text-foreground">Decentralized Infrastructure</span>
                      <p className="text-sm">No central points of failure or control</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="mr-3 mt-1"><Shield className="w-5 h-5 text-green-500" /></div>
                    <div>
                      <span className="font-medium text-foreground">Real-time Verification</span>
                      <p className="text-sm">Automatic security scoring and risk assessment</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Meet Our Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Blockchain enthusiasts building the future of token creation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-600 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">AJ</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Alex Johnson</h3>
              <p className="text-muted-foreground">Founder & CEO</p>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
                Former blockchain lead at Ethereum Foundation with 8+ years in crypto development.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">SC</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Sarah Chen</h3>
              <p className="text-muted-foreground">CTO</p>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
                Smart contract expert and former lead developer at a top 10 DeFi protocol.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-green-600 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">MR</span>
              </div>
              <h3 className="text-xl font-bold text-foreground">Michael Rodriguez</h3>
              <p className="text-muted-foreground">Head of Product</p>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
                Product visionary with experience at leading Web3 startups and traditional fintech.
              </p>
            </div>
          </div>
        </div>
        
        {/* Roadmap */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Roadmap</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Where we've been and where we're heading
            </p>
          </div>
          
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border -ml-px"></div>
            
            <div className="space-y-12">
              <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 items-center">
                <div className="md:col-span-2 md:text-right order-2 md:order-1">
                  <h3 className="text-xl font-bold text-foreground">Q1 2024: Platform Launch</h3>
                  <p className="text-muted-foreground mt-2">
                    Initial release of Snarbles with Solana and Algorand support
                  </p>
                </div>
                
                <div className="flex justify-center order-1 md:order-2">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white relative z-10">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="md:col-span-2 order-3">
                  <div className="glass-card p-4 h-full">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Token creation interface
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Multi-chain support
                      </li>
                      <li className="flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        Dashboard and analytics
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 items-center">
                <div className="md:col-span-2 order-2 md:order-3">
                  <h3 className="text-xl font-bold text-foreground">Q2 2024: Enhanced Features</h3>
                  <p className="text-muted-foreground mt-2">
                    Expanding functionality with new management tools
                  </p>
                </div>
                
                <div className="flex justify-center order-1 md:order-2">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white relative z-10">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="md:col-span-2 order-3 md:order-1 md:text-right">
                  <div className="glass-card p-4 h-full">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center md:justify-end">
                        <span>Advanced tokenomics designer</span>
                        <Check className="w-4 h-4 text-green-500 ml-2" />
                      </li>
                      <li className="flex items-center md:justify-end">
                        <span>Token verification system</span>
                        <Check className="w-4 h-4 text-green-500 ml-2" />
                      </li>
                      <li className="flex items-center md:justify-end">
                        <span>Enhanced community tools</span>
                        <Clock className="w-4 h-4 text-yellow-500 ml-2" />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="relative grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8 items-center">
                <div className="md:col-span-2 md:text-right order-2 md:order-1">
                  <h3 className="text-xl font-bold text-foreground">Q3 2025: SOON Network Integration</h3>
                  <p className="text-muted-foreground mt-2">
                    Native support for the revolutionary SOON blockchain network
                  </p>
                </div>
                
                <div className="flex justify-center order-1 md:order-2">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white relative z-10">
                    <Rocket className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="md:col-span-2 order-3">
                  <div className="glass-card p-4 h-full">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-center">
                        <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                        SOON Network token creation
                      </li>
                      <li className="flex items-center">
                        <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                        Cross-chain management
                      </li>
                      <li className="flex items-center">
                        <Clock className="w-4 h-4 text-yellow-500 mr-2" />
                        Enterprise solutions
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="glass-card p-12 bg-gradient-to-br from-red-500/10 to-red-600/5 text-center border border-red-500/20">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Join the Snarbles Community</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Create your token, connect with other creators, and be part of the token revolution
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create">
              <Button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-lg px-8 py-3 h-auto">
                <Rocket className="w-5 h-5 mr-2" />
                Create Your Token
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10 text-lg px-8 py-3 h-auto">
                <Users className="w-5 h-5 mr-2" />
                Join Community
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}