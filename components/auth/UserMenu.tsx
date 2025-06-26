'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  Coins, 
  CreditCard, 
  Settings, 
  LogOut, 
  ChevronDown,
  History,
  Crown,
  Shield
} from 'lucide-react';
import { useSupabaseAuth, useCredits } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import AuthModal from './AuthModal';

export default function UserMenu() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');
  
  const { user, userProfile, signOut, isAuthenticated } = useSupabaseAuth();
  const { creditBalance, hasCredits } = useCredits();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const result = await signOut();
    if (result.success) {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out",
        duration: 3000,
      });
    }
  };

  const openAuthModal = (tab: 'signin' | 'signup') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => openAuthModal('signin')}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => openAuthModal('signup')}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Sign Up
          </Button>
        </div>

        <AuthModal 
          isOpen={authModalOpen} 
          onClose={() => setAuthModalOpen(false)}
          defaultTab={authModalTab}
        />
      </>
    );
  }

  const getTierBadge = () => {
    if (!userProfile) return null;
    
    const tier = userProfile.subscription_tier;
    if (tier === 'pro') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Pro</Badge>;
    }
    if (tier === 'premium') {
      return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">Premium</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Free</Badge>;
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        {/* Credits Display */}
        <div className="hidden sm:flex items-center space-x-2 bg-muted/50 rounded-lg px-3 py-1.5">
          <Coins className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">{creditBalance}</span>
          <span className="text-xs text-muted-foreground">credits</span>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="border-border text-foreground hover:bg-muted">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm">{user?.email?.split('@')[0] || 'User'}</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                {getTierBadge()}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Credits Section */}
            <div className="px-2 py-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">Credits</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{creditBalance}</span>
                  {!hasCredits && (
                    <Badge variant="outline" className="text-xs">
                      Low
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <History className="w-4 h-4 mr-2" />
              Token History
            </DropdownMenuItem>

            <DropdownMenuItem>
              <CreditCard className="w-4 h-4 mr-2" />
              Buy Credits
            </DropdownMenuItem>

            <DropdownMenuItem>
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Plan
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </>
  );
}