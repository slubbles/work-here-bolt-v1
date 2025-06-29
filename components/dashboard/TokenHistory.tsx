import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TokenHistoryList } from '@/components/TokenHistoryList';
import { Coins, ArrowUpDown, Filter, Wallet } from 'lucide-react';

export function TokenHistory({ walletAddress }: { walletAddress: string }) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterNetwork, setFilterNetwork] = useState<string | null>(null);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const networkFilters = [
    { value: null, label: 'All Networks' },
    { value: 'solana', label: 'Solana' },
    { value: 'algorand', label: 'Algorand' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center space-x-2">
            <Coins className="w-5 h-5" />
            <span>My Created Tokens</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
              className="h-8 gap-1"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="text-xs">{sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
            >
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs">Filter</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          History of tokens you've created on all networks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {networkFilters.map((filter) => (
            <Badge
              key={filter.value || 'all'}
              variant={filterNetwork === filter.value ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterNetwork(filter.value)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
        
        <div className="mt-4">
          <TokenHistoryList
            walletAddress={walletAddress}
            showHeader={false}
            limit={10}
          />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-xs text-muted-foreground flex items-center">
          <Wallet className="w-3.5 h-3.5 mr-1.5" />
          <span className="font-mono">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
        >
          Download History
        </Button>
      </CardFooter>
    </Card>
  );
}