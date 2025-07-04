'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

export default function SolanaDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-yellow-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Solana Dashboard Temporarily Disabled</h2>
              <p className="text-muted-foreground">
                We're re-implementing the Solana wallet connection. Please use the Algorand dashboard for now.
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
