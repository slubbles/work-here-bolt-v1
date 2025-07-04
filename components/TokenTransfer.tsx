'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2, CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// import { useWallet } from '@solana/wallet-adapter-react'; // Temporarily disabled
import { useAlgorandWallet } from '@/components/providers/AlgorandWalletProvider';

interface TokenTransferProps {
  token: {
    id: string;
    name: string;
    symbol: string;
    assetId?: string;
    mintAddress?: string;
    network: string;
    decimals: number;
    balance?: string;
  };
}

export function TokenTransfer({ token }: TokenTransferProps) {
  const [open, setOpen] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const { toast } = useToast();
  // Solana wallet (temporarily disabled for re-implementation)
  const solanaConnected = false;
  const solanaPublicKey = null;
  const { connected: algorandConnected, address: algorandAddress } = useAlgorandWallet();

  const isAlgorand = token.network.includes('algorand');
  const isSolana = token.network.includes('solana');
  const isWalletConnected = (isAlgorand && algorandConnected) || (isSolana && solanaConnected);
  
  const formatBalance = (balance: string) => {
    if (!balance) return '0';
    const num = parseFloat(balance);
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  const validateTransfer = () => {
    if (!recipientAddress.trim()) {
      setError('Please enter a recipient address');
      return false;
    }
    
    if (!amount.trim() || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    
    if (token.balance && parseFloat(amount) > parseFloat(token.balance)) {
      setError('Amount exceeds available balance');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleTransfer = async () => {
    if (!validateTransfer()) return;
    
    setIsTransferring(true);
    setError('');
    
    try {
      if (isAlgorand) {
        // TODO: Implement Algorand token transfer
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transfer
        setTransferResult({
          success: true,
          txId: 'ALG_TX_' + Math.random().toString(36).substr(2, 9),
          explorerUrl: `https://testnet.algoexplorer.io/tx/ALG_TX_${Math.random().toString(36).substr(2, 9)}`
        });
      } else if (isSolana) {
        // TODO: Implement Solana token transfer
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transfer
        setTransferResult({
          success: true,
          txId: 'SOL_TX_' + Math.random().toString(36).substr(2, 9),
          explorerUrl: `https://explorer.solana.com/tx/SOL_TX_${Math.random().toString(36).substr(2, 9)}?cluster=devnet`
        });
      }
      
      toast({
        title: "Transfer Successful!",
        description: `Successfully sent ${amount} ${token.symbol} to ${recipientAddress.slice(0, 8)}...`,
      });
      
    } catch (err: any) {
      console.error('Transfer error:', err);
      setError(err.message || 'Transfer failed');
      toast({
        title: "Transfer Failed",
        description: err.message || 'An error occurred during the transfer',
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const resetForm = () => {
    setRecipientAddress('');
    setAmount('');
    setError('');
    setTransferResult(null);
    setIsTransferring(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Transaction ID copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500"
          disabled={!isWalletConnected}
        >
          <Send className="w-4 h-4" />
          Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            Transfer {token.symbol}
          </DialogTitle>
          <DialogDescription>
            Send {token.name} tokens to another wallet address
          </DialogDescription>
        </DialogHeader>

        {!transferResult && (
          <div className="space-y-4">
            {/* Token Info Card */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Token</p>
                    <p className="font-medium">{token.name} ({token.symbol})</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Network</p>
                    <p className="font-medium capitalize">{token.network.replace('-', ' ')}</p>
                  </div>
                  {token.balance && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Available Balance</p>
                      <p className="font-medium text-lg">{formatBalance(token.balance)} {token.symbol}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transfer Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address *</Label>
                <Input
                  id="recipient"
                  placeholder={isAlgorand ? "ALGORAND_ADDRESS..." : "SOLANA_ADDRESS..."}
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step={`0.${'0'.repeat(Math.max(0, token.decimals - 1))}1`}
                />
                {token.balance && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Available: {formatBalance(token.balance)} {token.symbol}</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => setAmount(token.balance || '0')}
                    >
                      Use Max
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isWalletConnected && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your {isAlgorand ? 'Algorand' : 'Solana'} wallet to transfer tokens.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {transferResult && transferResult.success && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-500 mb-2">Transfer Successful!</h3>
              <p className="text-muted-foreground">
                Successfully sent {amount} {token.symbol} to the recipient
              </p>
            </div>

            <Card className="bg-green-500/5 border-green-500/20">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Transaction ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{transferResult.txId.slice(0, 16)}...</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(transferResult.txId)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {transferResult.explorerUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <a href={transferResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Explorer
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {!transferResult && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={isTransferring || !isWalletConnected}
                className="gap-2"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Transfer
                  </>
                )}
              </Button>
            </>
          )}
          
          {transferResult && (
            <Button onClick={() => setOpen(false)} className="w-full">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
