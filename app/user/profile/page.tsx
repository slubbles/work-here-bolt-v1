'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Coins, 
  CreditCard, 
  History, 
  Crown,
  Settings,
  Mail,
  Calendar,
  TrendingUp,
  ArrowLeft,
  Plus,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useSupabaseAuth, useTokenHistory, useCredits } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export default function UserProfilePage() {
  const [isLoading, setIsLoading] = useState(false);
  
  const { user, userProfile, isAuthenticated } = useSupabaseAuth();
  const { tokens, fetchTokenHistory } = useTokenHistory();
  const { creditBalance, creditHistory, hasCredits } = useCredits();
  const { toast } = useToast();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen app-background flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to access your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getTierBadge = () => {
    if (!userProfile) return null;
    
    const tier = userProfile.subscription_tier;
    switch (tier) {
      case 'pro':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Pro</Badge>;
      case 'premium':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Premium</Badge>;
      default:
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Free</Badge>;
    }
  };

  return (
    <div className="min-h-screen app-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">User Profile</h1>
            <p className="text-muted-foreground">Manage your account and view your activity</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-border text-muted-foreground hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Platform
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{user?.email?.split('@')[0] || 'User'}</span>
                      {getTierBadge()}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Member since</span>
                  </div>
                  <span className="text-sm font-semibold">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm">Credits</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{creditBalance}</span>
                </div>

                <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Buy More Credits
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="tokens" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tokens">
                  <History className="w-4 h-4 mr-2" />
                  Token History
                </TabsTrigger>
                <TabsTrigger value="credits">
                  <Coins className="w-4 h-4 mr-2" />
                  Credits
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tokens" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="w-5 h-5" />
                      <span>Created Tokens</span>
                    </CardTitle>
                    <CardDescription>
                      All tokens you've created with Snarbles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tokens && tokens.length > 0 ? (
                      <div className="space-y-4">
                        {tokens.map((token, index) => (
                          <div key={token.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                                {token.token_symbol.slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{token.token_name}</p>
                                <p className="text-sm text-muted-foreground">{token.token_symbol}</p>
                                <p className="text-xs text-muted-foreground">{token.network}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {new Date(token.created_at).toLocaleDateString()}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const explorerUrl = token.network.startsWith('algorand') 
                                    ? `https://algoexplorer.io/asset/${token.contract_address}`
                                    : `https://explorer.solana.com/address/${token.contract_address}`;
                                  window.open(explorerUrl, '_blank');
                                }}
                                className="mt-2"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No tokens created yet</p>
                        <Link href="/create">
                          <Button className="bg-red-500 hover:bg-red-600 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Token
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credits" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Coins className="w-5 h-5" />
                      <span>Credit Balance</span>
                    </CardTitle>
                    <CardDescription>
                      Your current credit balance and transaction history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-6">
                      <Coins className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-yellow-600 mb-1">{creditBalance}</div>
                      <p className="text-sm text-muted-foreground">Available Credits</p>
                      <Button className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Buy More Credits
                      </Button>
                    </div>

                    {creditHistory && creditHistory.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Recent Transactions</h4>
                        {creditHistory.slice(0, 10).map((transaction, index) => (
                          <div key={transaction.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-foreground">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(transaction.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className={`text-sm font-semibold ${
                              transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No credit transactions yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Account Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="bg-muted/50"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Email cannot be changed at this time
                        </p>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-semibold text-foreground mb-2">Subscription</h4>
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium">Current Plan</p>
                            <p className="text-sm text-muted-foreground">
                              {userProfile?.subscription_tier === 'free' ? 'Free Plan' :
                               userProfile?.subscription_tier === 'pro' ? 'Pro Plan' : 'Premium Plan'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getTierBadge()}
                            <Button variant="outline" size="sm">
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}