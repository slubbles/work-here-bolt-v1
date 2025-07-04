import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getWalletTokenHistory } from '@/lib/token-tracking';
import { formatDistanceToNow } from 'date-fns';
import { Copy, ExternalLink, Search, Coins, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { isSupabaseAvailable } from '@/lib/supabase-client';
import { TokenTransfer } from '@/components/TokenTransfer';

interface TokenHistoryListProps {
  walletAddress: string;
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

export function TokenHistoryList({ 
  walletAddress, 
  limit = 5, 
  showHeader = true,
  className = ''
}: TokenHistoryListProps) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supabaseEnabled, setSupabaseEnabled] = useState(false);
  
  const { toast } = useToast();
  
  useEffect(() => {
    setSupabaseEnabled(isSupabaseAvailable());
    if (walletAddress) {
      loadTokenHistory();
    }
  }, [walletAddress]);
  
  const loadTokenHistory = async () => {
    if (!walletAddress || !isSupabaseAvailable()) {
      setLoading(false);
      if (!isSupabaseAvailable()) {
        setError('Supabase integration is not configured');
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getWalletTokenHistory(walletAddress, { limit });
      
      if (result.success && result.data) {
        setTokens(result.data);
      } else {
        setError(result.message || 'Failed to load token history');
      }
    } catch (err) {
      console.error('Error loading token history:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard"
    });
  };
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const getNetworkColor = (network: string) => {
    if (network.includes('solana')) {
      return 'bg-[#9945FF]/20 text-[#9945FF] border-[#9945FF]/30';
    }
    if (network.includes('algorand')) {
      return network.includes('mainnet')
        ? 'bg-[#00d4aa]/20 text-[#00d4aa] border-[#00d4aa]/30'
        : 'bg-[#ffee55]/20 text-[#ffee55] border-[#ffee55]/30';
    }
    return 'bg-gray-200 text-gray-700 border-gray-300';
  };

  if (!supabaseEnabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Coins className="w-5 h-5" />
            <span>My Created Tokens</span>
          </CardTitle>
          <CardDescription>
            Your token creation history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-center bg-gray-50 rounded-md">
            <div>
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900">Supabase Not Configured</h3>
              <p className="text-gray-500 mt-2 max-w-sm">
                Token history requires Supabase integration. Add Supabase credentials to enable this feature.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-xl flex items-center space-x-2">
            <Coins className="w-5 h-5" />
            <span>My Created Tokens</span>
          </CardTitle>
          <CardDescription>
            Your token creation history
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg"></div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center justify-center p-6 text-center bg-gray-50 rounded-md">
            <div>
              <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900">No Token History Found</h3>
              <p className="text-gray-500 mt-2 max-w-sm">
                {error.includes('configured') 
                  ? 'Token history tracking requires Supabase configuration.' 
                  : 'We couldn\'t find any tokens you\'ve created. Try creating your first token!'}
              </p>
              {!error.includes('configured') && (
                <Button 
                  className="mt-4" 
                  variant="outline"
                  asChild
                >
                  <Link href="/create">
                    Create Your First Token
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex items-center justify-center p-6 text-center bg-gray-50 rounded-md">
            <div>
              <Coins className="h-10 w-10 text-blue-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900">No Created Tokens</h3>
              <p className="text-gray-500 mt-2">
                You haven't created any tokens yet. Get started with your first token!
              </p>
              <Button 
                className="mt-4" 
                variant="outline"
                asChild
              >
                <Link href="/create">
                  Create Your First Token
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <div key={token.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">
                        {token.token_name}
                      </h3>
                      <Badge className={getNetworkColor(token.network)}>
                        {token.network.replace('-', ' ')}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{token.token_symbol}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <span className="mr-4">Created {formatDistanceToNow(new Date(token.created_at), { addSuffix: true })}</span>
                      <span>{token.total_supply?.toLocaleString() || 'N/A'} supply</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TokenTransfer 
                      token={{
                        id: token.id,
                        name: token.token_name,
                        symbol: token.token_symbol,
                        assetId: token.network.includes('algorand') ? token.contract_address : undefined,
                        mintAddress: token.network.includes('solana') ? token.contract_address : undefined,
                        network: token.network,
                        decimals: token.decimals || 9,
                        balance: token.balance // This would need to be fetched from wallet
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => copyToClipboard(token.contract_address)}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <Link href={`/verify?address=${token.contract_address}`}>
                        <Search className="h-4 w-4 text-gray-500" />
                      </Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        let url = '#';
                        if (token.network.includes('solana')) {
                          url = `https://explorer.solana.com/address/${token.contract_address}?cluster=${token.network.includes('devnet') ? 'devnet' : 'mainnet'}`;
                        } else if (token.network.includes('algorand')) {
                          const network = token.network.includes('testnet') ? 'testnet' : 'mainnet';
                          url = `https://explorer.${network}.algoexplorerapi.io/asset/${token.contract_address}`;
                        }
                        window.open(url, '_blank');
                      }}
                    >
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {tokens.length > 4 && (
              <div className="pt-2 text-center">
                <Button 
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  asChild
                >
                  <Link href="/dashboard">
                    View All Tokens
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}