import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signInWithEmail, signUpWithEmail, getCurrentUser, signOut, linkWalletToUser } from '@/lib/supabase-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';
import { useToast } from '@/hooks/use-toast';
import { Mail, Key, LogIn, UserPlus, AlertCircle, Wallet, Check, AlertTriangle } from 'lucide-react';

interface SupabaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupabaseAuthModal({ isOpen, onClose }: SupabaseAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'profile'>('sign-in');
  
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useWallet();
  const { connected: algorandConnected, address: algorandAddress } = useAlgorandWallet();
  const { toast } = useToast();
  
  // Check authentication status when dialog opens
  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    }
  }, [isOpen]);
  
  const checkAuthStatus = async () => {
    try {
      const { user, session } = await getCurrentUser();
      
      if (user) {
        setUser(user);
        setMode('profile');
      } else {
        setMode('sign-in');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setMode('sign-in');
    }
  };
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await signInWithEmail(email, password);
      
      if (error) {
        setError(error);
        return;
      }
      
      await checkAuthStatus();
      toast({
        title: "Signed in",
        description: "You have successfully signed in"
      });
      
      setEmail('');
      setPassword('');
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await signUpWithEmail(email, password);
      
      if (error) {
        setError(error);
        return;
      }
      
      toast({
        title: "Account created",
        description: "Check your email to confirm your account"
      });
      
      setEmail('');
      setPassword('');
      setMode('sign-in');
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    setLoading(true);
    
    try {
      await signOut();
      setUser(null);
      setMode('sign-in');
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
    } catch (error: any) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLinkWallet = async (type: 'solana' | 'algorand') => {
    if (!user) return;
    
    const address = type === 'solana' 
      ? solanaPublicKey?.toString() 
      : algorandAddress;
      
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: `Please connect your ${type} wallet first`,
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await linkWalletToUser(address, type);
      
      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Wallet linked",
        description: `Your ${type} wallet has been linked to your account`,
      });
      
      await checkAuthStatus();
    } catch (error: any) {
      console.error('Error linking wallet:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to link wallet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {mode === 'profile' ? (
          // User profile
          <>
            <DialogHeader>
              <DialogTitle>Account Profile</DialogTitle>
              <DialogDescription>
                Your account information and linked wallets
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-2 border rounded-md bg-muted/50">
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Linked Wallets</Label>
                
                {/* Solana wallet */}
                <div className="p-3 border rounded-md bg-muted/30 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#AB9FF2]/20 flex items-center justify-center">
                      <span className="text-[#AB9FF2] font-semibold text-sm">S</span>
                    </div>
                    <span className="text-sm font-medium">Solana</span>
                  </div>
                  
                  {solanaConnected && solanaPublicKey ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleLinkWallet('solana')}
                      className="h-8 text-xs"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center space-x-1">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Linking</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <Wallet className="h-3 w-3 mr-1" />
                          <span>Link Wallet</span>
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>Wallet Not Connected</span>
                    </Button>
                  )}
                </div>
                
                {/* Algorand wallet */}
                <div className="p-3 border rounded-md bg-muted/30 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#22C55E]/20 flex items-center justify-center">
                      <span className="text-[#22C55E] font-semibold text-sm">A</span>
                    </div>
                    <span className="text-sm font-medium">Algorand</span>
                  </div>
                  
                  {algorandConnected && algorandAddress ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleLinkWallet('algorand')}
                      className="h-8 text-xs"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center space-x-1">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Linking</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <Wallet className="h-3 w-3 mr-1" />
                          <span>Link Wallet</span>
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs opacity-50 cursor-not-allowed"
                      disabled
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>Wallet Not Connected</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={handleSignOut} disabled={loading}>
                Sign Out
              </Button>
              <Button onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Auth tabs (sign in/sign up)
          <Tabs defaultValue={mode} onValueChange={(value) => setMode(value as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="sign-in">Sign In</TabsTrigger>
              <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sign-in">
              <DialogHeader>
                <DialogTitle>Sign In</DialogTitle>
                <DialogDescription>
                  Sign in to your account to track token creations and more
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSignIn} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <span className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </span>
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    <span className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Password
                    </span>
                  </Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="text-sm text-blue-600">
                  <p>Note: Authentication is optional. You can still use the platform with just a connected wallet.</p>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </span>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="sign-up">
              <DialogHeader>
                <DialogTitle>Create Account</DialogTitle>
                <DialogDescription>
                  Create an account to track your created tokens across multiple wallets
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSignUp} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">
                    <span className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </span>
                  </Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">
                    <span className="flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Password
                    </span>
                  </Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
                </div>
                
                {error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="text-sm text-blue-600">
                  <p>Note: Authentication is optional. You can still use the platform with just a connected wallet.</p>
                </div>
                
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Account
                      </span>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}